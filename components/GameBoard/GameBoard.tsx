'use client';

import type { MouseEvent } from 'react';
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
import { GameInfoPanel } from './GameInfoPanel';
import { SolutionImage } from './SolutionPreview';

export type GameBoardProps = {
  initialBoard: BoardState;
  isSignedIn: boolean;
};

export function GameBoard({ initialBoard, isSignedIn }: GameBoardProps) {
  const { isMuted, playSound, toggleMuted } = useSound();
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
    (event: MouseEvent<HTMLDivElement>) => {
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
          isMuted={isMuted}
          isCelebrating={isCelebrating}
          isSignedIn={isSignedIn}
          message={message}
          onRestart={restartLevel}
          onToggleMuted={toggleMuted}
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
              isMuted={isMuted}
              isModal
              isCelebrating={isCelebrating}
              isSignedIn={isSignedIn}
              message={message}
              onClose={() => setIsInfoModalOpen(false)}
              onRestart={restartLevel}
              onToggleMuted={toggleMuted}
              rows={rows}
            />
          </div>
        </div>
      )}
    </div>
  );
}
