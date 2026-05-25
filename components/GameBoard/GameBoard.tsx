'use client';

import { Maximize2, Minimize2, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { PointerEvent, TouchEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { recordCompletedLevel, saveGameState } from '@/app/actions/game';
import {
  BoardState,
  Slot,
  createBoardState,
  isTileGridInOrder,
  moveBoardTile,
  nextGridDimensions,
  slotKey,
  slotsEqual,
} from '@/lib/board';

import { useSound } from '../SoundProvider';
import { BoardTile } from './BoardTile';
import {
  BOARD_HINT_DELAY_MS,
  BOARD_HINT_TILE_REVEAL_DELAY_MS,
  BOARD_SIZE,
  BOARD_SURFACE_BACKGROUND,
  CELEBRATION_PARTICLES,
  LEVEL_COMPLETE_ADVANCE_DELAY_MS,
  LEVEL_COMPLETE_CELEBRATION_DELAY_MS,
  LOCAL_STORAGE_KEY,
} from './constants';
import { GameHud } from './GameHud';
import { GameInfoPanel } from './GameInfoPanel';

export type GameBoardProps = {
  initialBoard: BoardState;
  isSignedIn: boolean;
};

export function GameBoard({ initialBoard, isSignedIn }: GameBoardProps) {
  const { isMuted, playSound, toggleMuted } = useSound();
  const SoundIcon = isMuted ? VolumeX : Volume2;
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [message, setMessage] = useState('');
  const [hintedSlot, setHintedSlot] = useState<string | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isShowingSolvedHint, setIsShowingSolvedHint] = useState(false);
  const [isShowingHintPlaceholder, setIsShowingHintPlaceholder] =
    useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isBoardFullscreen, setIsBoardFullscreen] = useState(false);
  const FullscreenIcon = isBoardFullscreen ? Minimize2 : Maximize2;
  const boardFrameRef = useRef<HTMLElement>(null);
  const boardSurfaceRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === boardFrameRef.current) {
        setIsBoardFullscreen(true);
        return;
      }

      if (!document.fullscreenElement) {
        setIsBoardFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isBoardFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBoardFullscreen]);

  const startBoardHint = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) {
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

  const clearBoardHintFromPointer = useCallback(() => {
    if (isCelebrating) {
      return;
    }

    clearBoardHint();
  }, [clearBoardHint, isCelebrating]);

  const moveTileAtClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const boardSurface = boardSurfaceRef.current;
      if (!boardSurface || isCelebrating) {
        return;
      }

      const rect = boardSurface.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        return;
      }

      const column = Math.min(columns - 1, Math.floor((x / rect.width) * columns));
      const row = Math.min(rows - 1, Math.floor((y / rect.height) * rows));
      const tappedSlot: Slot = [row, column];

      if (!movableSlotKeys.has(slotKey(tappedSlot))) {
        playSound('invalid');
        const tappedTile = board.tileGrid
          .flat()
          .find((tile) => slotsEqual(tile.slot, tappedSlot));

        if (tappedTile && tappedTile.type !== 'PLACEHOLDER') {
          setHintedSlot(slotKey(tappedTile.homeSlot));
        }

        return;
      }

      moveTile(tappedSlot);
    },
    [
      board.tileGrid,
      columns,
      isCelebrating,
      movableSlotKeys,
      moveTile,
      playSound,
      rows,
    ],
  );

  const moveTileFromTouch = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      event.preventDefault();
      clearBoardHintFromPointer();
      moveTileAtClientPoint(touch.clientX, touch.clientY);
    },
    [clearBoardHintFromPointer, moveTileAtClientPoint],
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
  const exitBoardFullscreen = useCallback(async () => {
    const boardFrame = boardFrameRef.current;

    if (document.fullscreenElement === boardFrame) {
      await document.exitFullscreen();
      return;
    }

    setIsBoardFullscreen(false);
  }, []);
  const openInfoModal = useCallback(async () => {
    if (isBoardFullscreen) {
      await exitBoardFullscreen();

      if (window.matchMedia('(max-width: 900px)').matches) {
        setIsInfoModalOpen(true);
      }

      return;
    }

    setIsInfoModalOpen(true);
  }, [exitBoardFullscreen, isBoardFullscreen]);
  const toggleBoardFullscreen = useCallback(async () => {
    const boardFrame = boardFrameRef.current;
    if (!boardFrame) {
      return;
    }

    if (isBoardFullscreen) {
      await exitBoardFullscreen();
      return;
    }

    setIsBoardFullscreen(true);

    if (document.fullscreenEnabled && boardFrame.requestFullscreen) {
      try {
        await boardFrame.requestFullscreen();
      } catch {
        setIsBoardFullscreen(true);
      }
    }
  }, [exitBoardFullscreen, isBoardFullscreen]);

  return (
    <div className="grid min-h-full w-full grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[900px]:grid-cols-1">
      <section
          className={[
            'relative grid min-h-0 place-items-center overflow-hidden bg-[#17231f] shadow-[0_24px_80px_rgba(0,0,0,0.24)]',
            isBoardFullscreen
              ? 'fullscreen-board-stage fixed inset-0 z-50 h-screen rounded-none p-4'
              : 'h-[calc(100svh-104px)] rounded-lg p-3 max-[900px]:p-2.5',
        ].join(' ')}
        aria-label="Sliding tile board"
        ref={boardFrameRef}
      >
        <GameHud
          columns={columns}
          onOpenDetails={openInfoModal}
          rows={rows}
          variant={isBoardFullscreen ? 'fullscreen' : 'compact'}
        />
        <div
          ref={boardSurfaceRef}
          className={[
            'relative aspect-square overflow-hidden rounded-lg',
            isBoardFullscreen
              ? 'fullscreen-board-shell'
              : 'w-[min(100%,calc(100svh-128px))]',
          ].join(' ')}
          onPointerDown={startBoardHint}
          onPointerLeave={clearBoardHintFromPointer}
          onPointerUp={clearBoardHintFromPointer}
          onTouchEnd={moveTileFromTouch}
          style={{
            background: BOARD_SURFACE_BACKGROUND,
            touchAction: 'manipulation',
          }}
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
        <div
          aria-label={`Level ${board.level}, ${columns} by ${rows} grid`}
          className="board-overlay absolute left-4 top-4 z-40 rounded-[7px] border px-3 py-2 text-sm font-bold text-accent-strong"
        >
          Level {board.level} · {columns}x{rows}
        </div>
        <div
          aria-label={`${board.moves} ${board.moves === 1 ? 'move' : 'moves'}`}
          className="board-overlay absolute bottom-4 left-4 z-40 rounded-[7px] border px-3 py-2 text-sm font-bold text-accent-strong"
        >
          {board.moves} {board.moves === 1 ? 'move' : 'moves'}
        </div>
        <div className="board-overlay absolute bottom-4 right-4 z-40 flex gap-1 rounded-[7px] border p-1 text-accent-strong">
          <button
            aria-label="Restart level"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-[6px] border border-line transition-colors hover:bg-accent/10"
            onClick={restartLevel}
            type="button"
          >
            <RotateCcw
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
          </button>
          <button
            aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'}
            aria-pressed={!isMuted}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-[6px] border border-line transition-colors hover:bg-accent/10"
            onClick={toggleMuted}
            type="button"
          >
            <SoundIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
          </button>
          <button
            aria-label={
              isBoardFullscreen ? 'Exit fullscreen board' : 'Enter fullscreen board'
            }
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-[6px] border border-line transition-colors hover:bg-accent/10"
            onClick={toggleBoardFullscreen}
            type="button"
          >
            <FullscreenIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
          </button>
        </div>
      </section>

      <aside className="max-[900px]:hidden">
        <GameInfoPanel
          board={board}
          columns={columns}
          gameModeLabel={gameModeLabel}
          isSignedIn={isSignedIn}
          message={message}
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
              isSignedIn={isSignedIn}
              message={message}
              onClose={() => setIsInfoModalOpen(false)}
              rows={rows}
            />
          </div>
        </div>
      )}
    </div>
  );
}
