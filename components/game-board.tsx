'use client';

import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { recordCompletedLevel, saveGameState } from '@/app/actions/game';
import {
  BoardState,
  Tile,
  Slot,
  createBoardState,
  isTileGridInOrder,
  moveBoardTile,
  nextGridDimensions,
  slotKey,
} from '@/lib/board';

import { useSound } from './sound-provider';

type GameBoardProps = {
  initialBoard: BoardState;
  isSignedIn: boolean;
};

type BoardTileProps = {
  columns: number;
  hintedSlot: string | null;
  isHintPlaceholderVisible: boolean;
  isMovable: boolean;
  isShowingSolvedHint: boolean;
  onHint: (slot: string | null) => void;
  onInvalidMove: () => void;
  onMove: (slot: Slot) => void;
  rows: number;
  suppressNextClickRef: MutableRefObject<boolean>;
  tile: Tile;
  tileHeight: number;
  tileWidth: number;
};

const LOCAL_STORAGE_KEY = 'sliding-tiles:anonymous-board';
const BOARD_SIZE = 999;
const BOARD_HINT_DELAY_MS = 500;
const BOARD_HINT_TILE_REVEAL_DELAY_MS = 220;
const LEVEL_COMPLETE_CELEBRATION_DELAY_MS = 500;
const LEVEL_COMPLETE_ADVANCE_DELAY_MS = 10000;
const TILE_TRANSITION =
  'left 180ms ease, top 180ms ease, box-shadow 180ms ease';
const HINT_PLACEHOLDER_TRANSITION =
  'left 180ms ease, top 180ms ease, opacity 360ms ease, box-shadow 180ms ease, filter 180ms ease';
const BOARD_SURFACE_BACKGROUND =
  'repeating-linear-gradient(-45deg, rgba(30, 37, 34, 0.12) 0 10px, rgba(30, 37, 34, 0.12) 10px 18px, rgba(255, 255, 255, 0.22) 18px 28px, rgba(255, 255, 255, 0.22) 28px 36px), #ece4d3';
const SOLUTION_GRID_BACKGROUND =
  "linear-gradient(to right, rgba(255, 255, 255, 0.42) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.42) 1px, transparent 1px), url('/api/assets/frog')";
const TILE_BACKGROUND = "url('/api/assets/frog')";
const CELEBRATION_PARTICLES = Array.from({ length: 30 }, (_, index) => ({
  delay: `${index * 70}ms`,
  left: `${6 + ((index * 23) % 88)}%`,
  size: `${9 + (index % 5) * 4}px`,
  top: `${8 + ((index * 19) % 74)}%`,
}));

function BoardTile({
  columns,
  hintedSlot,
  isHintPlaceholderVisible,
  isMovable,
  isShowingSolvedHint,
  onHint,
  onInvalidMove,
  onMove,
  rows,
  suppressNextClickRef,
  tile,
  tileHeight,
  tileWidth,
}: BoardTileProps) {
  const [homeRow, homeColumn] = tile.homeSlot;
  const [row, column] = isShowingSolvedHint ? tile.homeSlot : tile.slot;
  const isHintPlaceholder = tile.type === 'PLACEHOLDER';
  const tileClasses = [
    'absolute cursor-pointer rounded-md border border-black/20 bg-no-repeat shadow-[inset_0_-3px_4px_rgba(0,0,0,0.26),inset_0_3px_4px_rgba(255,255,255,0.34),0_16px_22px_rgba(0,0,0,0.24)] hover:z-[8] focus-visible:z-[8]',
    isMovable ? '' : 'cursor-not-allowed',
    isShowingSolvedHint
      ? 'z-[2] cursor-default brightness-[1.04] saturate-[1.08]'
      : '',
    isHintPlaceholder ? 'pointer-events-none' : '',
    hintedSlot === slotKey(tile.homeSlot)
      ? 'z-[9] shadow-[0_18px_30px_rgba(0,0,0,0.28)]'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      aria-label={`Tile ${tile.position + 1}`}
      className={tileClasses}
      key={tile.position}
      onBlur={() => onHint(null)}
      onClick={() => {
        if (isHintPlaceholder) {
          return;
        }

        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false;
          return;
        }

        if (isMovable) {
          onMove(tile.slot);
        } else {
          onInvalidMove();
          onHint(slotKey(tile.homeSlot));
        }
      }}
      onMouseEnter={() => {
        if (!isMovable && !isHintPlaceholder) {
          onHint(slotKey(tile.homeSlot));
        }
      }}
      onMouseLeave={() => onHint(null)}
      style={{
        width: `${(tileWidth / BOARD_SIZE) * 100}%`,
        height: `${(tileHeight / BOARD_SIZE) * 100}%`,
        top: `${((row * tileHeight) / BOARD_SIZE) * 100}%`,
        left: `${((column * tileWidth) / BOARD_SIZE) * 100}%`,
        backgroundImage: TILE_BACKGROUND,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        backgroundPosition: `${
          columns > 1 ? (homeColumn / (columns - 1)) * 100 : 0
        }% ${rows > 1 ? (homeRow / (rows - 1)) * 100 : 0}%`,
        opacity: isHintPlaceholder && !isHintPlaceholderVisible ? 0 : 1,
        transition: isHintPlaceholder
          ? HINT_PLACEHOLDER_TRANSITION
          : TILE_TRANSITION,
      }}
      type="button"
    />
  );
}

function SolutionPreview({ columns, rows }: { columns: number; rows: number }) {
  return (
    <figure className="m-0 grid gap-2">
      <div
        aria-label="Completed puzzle reference image"
        className="aspect-square overflow-hidden rounded-[7px] border border-foreground/15 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
        role="img"
        style={{
          backgroundImage: SOLUTION_GRID_BACKGROUND,
          backgroundPosition: '0 0, 0 0, center',
          backgroundRepeat: 'repeat, repeat, no-repeat',
          backgroundSize: `calc(100% / ${columns}) 100%, 100% calc(100% / ${rows}), cover`,
        }}
      />
      <figcaption className="text-[0.82rem] text-muted">
        Reference image
      </figcaption>
    </figure>
  );
}

export function GameBoard({ initialBoard, isSignedIn }: GameBoardProps) {
  const { playSound } = useSound();
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [message, setMessage] = useState('');
  const [hintedSlot, setHintedSlot] = useState<string | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isShowingSolvedHint, setIsShowingSolvedHint] = useState(false);
  const [isShowingHintPlaceholder, setIsShowingHintPlaceholder] =
    useState(false);
  const boardHintTimeoutRef = useRef<number | null>(null);
  const placeholderRevealTimeoutRef = useRef<number | null>(null);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const levelAdvanceTimeoutRef = useRef<number | null>(null);
  const boardHintMouseUpRef = useRef<(() => void) | null>(null);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    if (isSignedIn) {
      const timeout = window.setTimeout(() => {
        void saveGameState(board);
      }, 350);
      return () => window.clearTimeout(timeout);
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(board));
  }, [board, isSignedIn]);

  const movableSlotKeys = useMemo(() => {
    return new Set(board.movableSlots.map(slotKey));
  }, [board.movableSlots]);

  const completeLevel = useCallback(
    (completedBoard: BoardState) => {
      playSound('complete');
      setMessage(`Level ${completedBoard.level} complete`);
      setHintedSlot(null);
      if (isSignedIn) {
        void recordCompletedLevel(completedBoard);
      }

      if (celebrationTimeoutRef.current !== null) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
      if (levelAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(levelAdvanceTimeoutRef.current);
      }

      celebrationTimeoutRef.current = window.setTimeout(() => {
        setIsCelebrating(true);
        setIsShowingSolvedHint(true);
        setIsShowingHintPlaceholder(true);
        celebrationTimeoutRef.current = null;

        levelAdvanceTimeoutRef.current = window.setTimeout(() => {
          setBoard(
            createBoardState(
              completedBoard.level + 1,
              nextGridDimensions(completedBoard.dimensions)
            )
          );
          setMessage('');
          setIsCelebrating(false);
          setIsShowingSolvedHint(false);
          setIsShowingHintPlaceholder(false);
          levelAdvanceTimeoutRef.current = null;
        }, LEVEL_COMPLETE_ADVANCE_DELAY_MS);
      }, LEVEL_COMPLETE_CELEBRATION_DELAY_MS);
    },
    [isSignedIn, playSound]
  );

  const moveTile = useCallback(
    (slot: Slot) => {
      if (isCelebrating) {
        return;
      }

      const nextBoard = moveBoardTile(board, slot);
      setBoard(nextBoard);

      if (nextBoard !== board) {
        playSound('move');
      }

      if (nextBoard !== board && isTileGridInOrder(nextBoard.tileGrid)) {
        completeLevel(nextBoard);
      }
    },
    [board, completeLevel, isCelebrating, playSound]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const [row, column] = board.emptySlot;
      if (isCelebrating) {
        return;
      }

      const slotToMove: Slot | null = (() => {
        switch (event.key) {
          case 'ArrowUp':
          case 'w':
            return [row + 1, column];
          case 'ArrowRight':
          case 'd':
            return [row, column - 1];
          case 'ArrowDown':
          case 's':
            return [row - 1, column];
          case 'ArrowLeft':
          case 'a':
            return [row, column + 1];
          default:
            return null;
        }
      })();

      if (slotToMove && movableSlotKeys.has(slotKey(slotToMove))) {
        event.preventDefault();
        moveTile(slotToMove);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, isCelebrating, movableSlotKeys, moveTile]);

  const [columns, rows] = board.dimensions;
  const tileWidth = BOARD_SIZE / columns;
  const tileHeight = BOARD_SIZE / rows;

  const clearBoardHint = useCallback(() => {
    if (boardHintTimeoutRef.current !== null) {
      window.clearTimeout(boardHintTimeoutRef.current);
      boardHintTimeoutRef.current = null;
    }
    if (placeholderRevealTimeoutRef.current !== null) {
      window.clearTimeout(placeholderRevealTimeoutRef.current);
      placeholderRevealTimeoutRef.current = null;
    }
    setIsShowingSolvedHint(false);
    setIsShowingHintPlaceholder(false);
    if (boardHintMouseUpRef.current) {
      window.removeEventListener('mouseup', boardHintMouseUpRef.current);
      boardHintMouseUpRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearBoardHint();
      if (celebrationTimeoutRef.current !== null) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
      if (levelAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(levelAdvanceTimeoutRef.current);
      }
    };
  }, [clearBoardHint]);

  const startBoardHint = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      if (isCelebrating) {
        return;
      }

      if (boardHintTimeoutRef.current !== null) {
        window.clearTimeout(boardHintTimeoutRef.current);
      }

      boardHintTimeoutRef.current = window.setTimeout(() => {
        suppressNextClickRef.current = true;
        setIsShowingSolvedHint(true);
        playSound('hint');
        placeholderRevealTimeoutRef.current = window.setTimeout(() => {
          setIsShowingHintPlaceholder(true);
          placeholderRevealTimeoutRef.current = null;
        }, BOARD_HINT_TILE_REVEAL_DELAY_MS);
        boardHintTimeoutRef.current = null;
      }, BOARD_HINT_DELAY_MS);

      if (boardHintMouseUpRef.current) {
        window.removeEventListener('mouseup', boardHintMouseUpRef.current);
      }

      boardHintMouseUpRef.current = clearBoardHint;
      window.addEventListener('mouseup', clearBoardHint, { once: true });
    },
    [clearBoardHint, isCelebrating, playSound]
  );

  const restartLevel = useCallback(() => {
    clearBoardHint();
    if (levelAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(levelAdvanceTimeoutRef.current);
      levelAdvanceTimeoutRef.current = null;
    }
    if (celebrationTimeoutRef.current !== null) {
      window.clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = null;
    }
    setIsCelebrating(false);
    setMessage('');
    setBoard(createBoardState(board.level, board.dimensions));
  }, [board.dimensions, board.level, clearBoardHint]);

  const gameModeLabel = isSignedIn ? 'Saved run' : 'Anonymous run';

  return (
    <div className="grid min-h-[calc(100svh-186px)] w-full grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[900px]:grid-cols-1">
      <section
        className="grid h-[calc(100svh-186px)] min-h-0 place-items-center overflow-hidden rounded-lg bg-[#17231f] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] max-[900px]:h-[calc(100svh-230px)] max-[900px]:p-2.5"
        aria-label="Sliding tile board"
      >
        <div
          className="relative aspect-square w-[min(100%,calc(100svh-210px))] overflow-hidden rounded-lg max-[900px]:w-[min(100%,calc(100svh-250px))]"
          onMouseDown={startBoardHint}
          onMouseLeave={clearBoardHint}
          onMouseUp={clearBoardHint}
          style={{ background: BOARD_SURFACE_BACKGROUND }}
        >
          {board.tileGrid.flat().map((tile) => {
            if (tile.type === 'PLACEHOLDER' && !isShowingSolvedHint) {
              return null;
            }

            const isMovable = movableSlotKeys.has(slotKey(tile.slot));

            return (
              <BoardTile
                columns={columns}
                hintedSlot={hintedSlot}
                isHintPlaceholderVisible={isShowingHintPlaceholder}
                isMovable={isMovable}
                isShowingSolvedHint={isShowingSolvedHint}
                key={tile.position}
                onHint={
                  tile.type === 'PLACEHOLDER' ? () => undefined : setHintedSlot
                }
                onInvalidMove={() => playSound('invalid')}
                onMove={moveTile}
                rows={rows}
                suppressNextClickRef={suppressNextClickRef}
                tile={tile}
                tileHeight={tileHeight}
                tileWidth={tileWidth}
              />
            );
          })}
          {isCelebrating && (
            <div className="pointer-events-none absolute inset-0 z-30 animate-[celebration-fade-in_700ms_ease-out_both] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,250,241,0.18),rgba(37,111,90,0.18)_42%,rgba(32,36,31,0.3))]" />
              <div className="absolute inset-4 rounded-lg border border-white/60 shadow-[inset_0_0_52px_rgba(255,255,255,0.38),0_0_44px_rgba(243,212,107,0.3)]" />
              {CELEBRATION_PARTICLES.map((particle, index) => (
                <span
                  className="absolute block animate-[celebration-float_1600ms_ease-out_both] rounded-full bg-[#f3d46b] shadow-[0_0_26px_rgba(243,212,107,0.9),0_0_8px_rgba(255,255,255,0.9)]"
                  key={index}
                  style={{
                    animationDelay: particle.delay,
                    height: particle.size,
                    left: particle.left,
                    top: particle.top,
                    width: particle.size,
                  }}
                />
              ))}
              <div className="absolute inset-x-6 bottom-6 rounded-lg border border-white/35 bg-panel/90 px-5 py-4 text-center shadow-panel backdrop-blur">
                <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
                  Level complete
                </p>
                <p className="mt-1 text-sm text-muted">
                  Enjoy the solved image. Next level is loading.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="grid content-start gap-4 self-start rounded-lg border border-line bg-panel p-5 shadow-panel">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
              {gameModeLabel}
            </p>
            <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent-strong">
              Level {board.level}
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] leading-none">
            Complete the pond
          </h1>
          <p className="text-sm leading-6 text-muted">
            Slide the pieces back together. Hold the board to peek at the full
            picture.
          </p>
        </div>
        <SolutionPreview columns={columns} rows={rows} />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[7px] border border-line bg-white/50 p-3">
            <span className="block text-[0.78rem] text-muted">Grid</span>
            <strong className="mt-1 block text-[1.4rem]">
              {columns}x{rows}
            </strong>
          </div>
          <div className="rounded-[7px] border border-line bg-white/50 p-3">
            <span className="block text-[0.78rem] text-muted">Moves</span>
            <strong className="mt-1 block text-[1.4rem]">{board.moves}</strong>
          </div>
        </div>
        <p className="rounded-lg border border-line bg-white/40 p-3 text-sm leading-6 text-muted">
          Use arrow keys or WASD. Click movable tiles to slide them, or click a
          locked tile to flash where it belongs.
        </p>
        {!isSignedIn && (
          <p className="leading-normal text-muted">
            Anonymous progress stays in this browser. Sign in to sync your board
            and post leaderboard times.
          </p>
        )}
        <button
          className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[7px] border border-accent/30 px-3.5 font-bold text-accent-strong"
          disabled={isCelebrating}
          onClick={restartLevel}
          type="button"
        >
          Restart level
        </button>
        {message && (
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            {message}
          </p>
        )}
      </aside>
    </div>
  );
}
