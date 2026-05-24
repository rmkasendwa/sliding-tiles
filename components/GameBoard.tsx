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

import { useSound } from './SoundProvider';

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

type GameInfoPanelProps = {
  board: BoardState;
  columns: number;
  gameModeLabel: string;
  isModal?: boolean;
  isCelebrating: boolean;
  isSignedIn: boolean;
  message: string;
  onClose?: () => void;
  onRestart: () => void;
  rows: number;
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

function SolutionImage({ columns, rows }: { columns: number; rows: number }) {
  return (
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
  );
}

function SolutionPreview({
  columns,
  isCompact = false,
  rows,
}: {
  columns: number;
  isCompact?: boolean;
  rows: number;
}) {
  return (
    <figure className="m-0 grid gap-2">
      <div className={isCompact ? 'mx-auto w-full max-w-72' : ''}>
        <SolutionImage columns={columns} rows={rows} />
      </div>
      <figcaption className="text-[0.82rem] text-muted">
        Reference image
      </figcaption>
    </figure>
  );
}

function GameInfoPanel({
  board,
  columns,
  gameModeLabel,
  isModal = false,
  isCelebrating,
  isSignedIn,
  message,
  onClose,
  onRestart,
  rows,
}: GameInfoPanelProps) {
  return (
    <div
      className={[
        'grid content-start gap-4 self-start border border-line bg-panel shadow-panel',
        isModal ? 'min-h-full rounded-xl p-4' : 'rounded-lg p-5',
      ].join(' ')}
    >
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            {gameModeLabel}
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent-strong">
              Level {board.level}
            </span>
            {onClose && (
              <button
                aria-label="Close run details"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-[7px] border border-line text-xl leading-none text-muted"
                onClick={onClose}
                type="button"
              >
                &times;
              </button>
            )}
          </div>
        </div>
        <h1
          className={[
            'leading-none',
            isModal
              ? 'text-[clamp(2rem,9vw,2.55rem)]'
              : 'text-[clamp(1.8rem,4vw,2rem)]',
          ].join(' ')}
        >
          Complete the pond
        </h1>
        <p className="text-sm leading-6 text-muted">
          Slide the pieces back together. Hold the board to peek at the full
          picture.
        </p>
      </div>
      <SolutionPreview columns={columns} isCompact={isModal} rows={rows} />
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
        onClick={onRestart}
        type="button"
      >
        Restart level
      </button>
      {message && (
        <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
          {message}
        </p>
      )}
    </div>
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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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
              nextGridDimensions(completedBoard.dimensions),
            ),
          );
          setMessage('');
          setIsCelebrating(false);
          setIsShowingSolvedHint(false);
          setIsShowingHintPlaceholder(false);
          levelAdvanceTimeoutRef.current = null;
        }, LEVEL_COMPLETE_ADVANCE_DELAY_MS);
      }, LEVEL_COMPLETE_CELEBRATION_DELAY_MS);
    },
    [isSignedIn, playSound],
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
    [board, completeLevel, isCelebrating, playSound],
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

  useEffect(() => {
    if (!isInfoModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInfoModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInfoModalOpen]);

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
    [clearBoardHint, isCelebrating, playSound],
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
  const openInfoModal = useCallback(() => {
    setIsInfoModalOpen(true);
  }, []);

  return (
    <div className="grid min-h-full w-full grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[900px]:grid-cols-1">
      <section
        className="relative grid h-[calc(100svh-104px)] min-h-0 place-items-center overflow-hidden rounded-lg bg-[#17231f] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] max-[900px]:p-2.5"
        aria-label="Sliding tile board"
      >
        <button
          aria-label="Open run details"
          className="absolute right-4 top-4 z-20 hidden w-24 cursor-pointer rounded-lg border border-white/20 bg-panel/92 p-1.5 text-left shadow-panel backdrop-blur transition-transform hover:-translate-y-0.5 max-[900px]:grid"
          onClick={openInfoModal}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openInfoModal();
            }
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
            openInfoModal();
          }}
          type="button"
        >
          <SolutionImage columns={columns} rows={rows} />
          <span className="mt-1 flex items-center justify-between gap-2 px-0.5 text-[0.7rem] font-bold text-accent-strong">
            <span>Guide</span>
            <span>L{board.level}</span>
          </span>
        </button>
        <div
          className="relative aspect-square w-[min(100%,calc(100svh-128px))] overflow-hidden rounded-lg"
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

      <aside className="max-[900px]:hidden">
        <GameInfoPanel
          board={board}
          columns={columns}
          gameModeLabel={gameModeLabel}
          isCelebrating={isCelebrating}
          isSignedIn={isSignedIn}
          message={message}
          onRestart={restartLevel}
          rows={rows}
        />
      </aside>
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 hidden items-center justify-center bg-foreground/45 p-3 backdrop-blur-sm max-[900px]:flex">
          <button
            aria-label="Close run details"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsInfoModalOpen(false)}
            type="button"
          />
          <div className="relative z-10 max-h-[calc(100svh-28px)] w-full max-w-lg overflow-y-auto rounded-xl">
            <GameInfoPanel
              board={board}
              columns={columns}
              gameModeLabel={gameModeLabel}
              isModal
              isCelebrating={isCelebrating}
              isSignedIn={isSignedIn}
              message={message}
              onClose={() => setIsInfoModalOpen(false)}
              onRestart={restartLevel}
              rows={rows}
            />
          </div>
        </div>
      )}
    </div>
  );
}
