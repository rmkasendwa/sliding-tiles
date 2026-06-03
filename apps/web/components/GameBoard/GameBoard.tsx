'use client';

import {
  Maximize2,
  Minimize2,
  Search,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  PointerEvent,
  ReactNode,
  TouchEvent,
} from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

import { SoundProvider, useSound } from '../SoundProvider';
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
  RESET_GATHER_DELAY_MS,
  TILE_ENTRY_ANIMATION_MS,
  TILE_ENTRY_LOCK_IN_DELAY_MS,
} from './constants';
import { GameHud } from './GameHud';
import { GameInfoPanel } from './GameInfoPanel';

export type GameBoardProps = {
  initialBoard: BoardState;
  isSignedIn: boolean;
  playerAvatarUrl?: string | null;
  playerName?: string;
  soundEnabled?: boolean;
};

const INFO_MODAL_TRANSITION_MS = 180;
const PEEK_BUTTON_PREVIEW_DELAY_MS = 120;

type GameToolButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  description: string;
  icon: ReactNode;
  tooltip: string;
};

function GameToolButton({
  className = '',
  description,
  icon,
  tooltip,
  ...buttonProps
}: GameToolButtonProps) {
  const descriptionId = useId();
  const tooltipId = useId();
  const describedBy = [descriptionId, tooltipId, buttonProps['aria-describedby']]
    .filter(Boolean)
    .join(' ');

  return (
    <span className="group/tool relative inline-grid">
      <button
        {...buttonProps}
        aria-describedby={describedBy}
        className={[
          'grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-line transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {icon}
        <span className="sr-only" id={descriptionId}>
          {description}
        </span>
      </button>
      <span
        className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-max max-w-52 translate-y-1 rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-bold leading-snug text-foreground opacity-0 shadow-panel transition-[opacity,transform] duration-150 group-active/tool:translate-y-0 group-active/tool:opacity-100 group-focus-within/tool:translate-y-0 group-focus-within/tool:opacity-100 group-hover/tool:translate-y-0 group-hover/tool:opacity-100 motion-reduce:transition-none"
        id={tooltipId}
        role="tooltip"
      >
        {tooltip}
      </span>
    </span>
  );
}

function MobileInfoModalPortal({
  children,
  isOpen,
  onClose,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isEntered, setIsEntered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsMounted(true), 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isMounted || !isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => setIsEntered(true));

    return () => window.cancelAnimationFrame(frame);
  }, [isMounted, isOpen]);

  if (!isMounted) {
    return null;
  }

  const isVisible = isOpen && isEntered;

  return createPortal(
    <div
      className={[
        'fixed inset-0 z-50 hidden items-center justify-center bg-foreground/75 p-3 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none max-[900px]:flex',
        isVisible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <button
        aria-label="Close run details"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        className={[
          'relative z-10 w-full max-w-lg transform transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none',
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-1 scale-[0.98] opacity-0',
        ].join(' ')}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function formatElapsedTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function GameBoardContent({
  initialBoard,
  isSignedIn,
  playerAvatarUrl,
  playerName,
}: GameBoardProps) {
  const {
    isEnabled: isSoundEnabled,
    isMuted,
    playSound,
    startAmbience,
    stopAmbience,
    toggleMuted,
  } = useSound();
  const SoundIcon = isMuted ? VolumeX : Volume2;
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [hintedSlot, setHintedSlot] = useState<string | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isShowingSolvedHint, setIsShowingSolvedHint] = useState(false);
  const [isShowingHintPlaceholder, setIsShowingHintPlaceholder] =
    useState(false);
  const [boardEntryAnimationKey, setBoardEntryAnimationKey] = useState(0);
  const [isBoardEntering, setIsBoardEntering] = useState(true);
  const [levelStartedAtMs, setLevelStartedAtMs] = useState(() => {
    const initialElapsed = Math.max(0, initialBoard.elapsedTimeMs ?? 0);
    return Date.now() - initialElapsed;
  });
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [isClockRunning, setIsClockRunning] = useState(
    () => initialBoard.moves > 0,
  );
  const [tileRotationSeed, setTileRotationSeed] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [isShuffleInProgress, setIsShuffleInProgress] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isInfoModalRendered, setIsInfoModalRendered] = useState(false);
  const [isBoardFullscreen, setIsBoardFullscreen] = useState(false);
  const FullscreenIcon = isBoardFullscreen ? Minimize2 : Maximize2;
  const previewButtonPointerIdRef = useRef<number | null>(null);
  const previewButtonTimeoutRef = useRef<number | null>(null);
  const boardFrameRef = useRef<HTMLElement>(null);
  const boardSurfaceRef = useRef<HTMLDivElement>(null);
  const boardHintTimeoutRef = useRef<number | null>(null);
  const placeholderRevealTimeoutRef = useRef<number | null>(null);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const levelAdvanceTimeoutRef = useRef<number | null>(null);
  const boardEntryTimeoutRef = useRef<number | null>(null);
  const lockInTimeoutRef = useRef<number | null>(null);
  const entryMotionSoundTimeoutsRef = useRef<number[]>([]);
  const entryMotionSoundCycleRef = useRef<number>(-1);
  const resetTimeoutRef = useRef<number | null>(null);
  const shuffleInProgressRef = useRef(false);
  const infoModalTransitionTimeoutRef = useRef<number | null>(null);
  const boardHintMouseUpRef = useRef<(() => void) | null>(null);
  const suppressNextClickRef = useRef(false);
  const hasPlayedInitialEntrySoundRef = useRef(false);

  const showInfoModal = useCallback(() => {
    if (infoModalTransitionTimeoutRef.current !== null) {
      window.clearTimeout(infoModalTransitionTimeoutRef.current);
      infoModalTransitionTimeoutRef.current = null;
    }

    setIsInfoModalRendered(true);
    setIsInfoModalOpen(true);
  }, []);

  const closeInfoModal = useCallback(() => {
    if (infoModalTransitionTimeoutRef.current !== null) {
      window.clearTimeout(infoModalTransitionTimeoutRef.current);
    }

    setIsInfoModalOpen(false);
    const transitionMs = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
      ? 0
      : INFO_MODAL_TRANSITION_MS;

    infoModalTransitionTimeoutRef.current = window.setTimeout(() => {
      setIsInfoModalRendered(false);
      infoModalTransitionTimeoutRef.current = null;
    }, transitionMs);
  }, []);

  useEffect(() => {
    startAmbience();
    return stopAmbience;
  }, [startAmbience, stopAmbience]);

  useEffect(() => {
    if (boardEntryTimeoutRef.current !== null) {
      window.clearTimeout(boardEntryTimeoutRef.current);
    }

    boardEntryTimeoutRef.current = window.setTimeout(() => {
      setIsBoardEntering(false);
      if (shuffleInProgressRef.current) {
        shuffleInProgressRef.current = false;
        setIsShuffleInProgress(false);
      }
      boardEntryTimeoutRef.current = null;
    }, TILE_ENTRY_ANIMATION_MS);

    return () => {
      if (boardEntryTimeoutRef.current !== null) {
        window.clearTimeout(boardEntryTimeoutRef.current);
        boardEntryTimeoutRef.current = null;
      }
    };
  }, [boardEntryAnimationKey]);

  useEffect(() => {
    if (!isClockRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isClockRunning]);

  useEffect(() => {
    const elapsedTimeMs = Math.max(0, clockNowMs - levelStartedAtMs);
    const boardWithElapsed = {
      ...board,
      elapsedTimeMs,
    };

    if (isSignedIn) {
      const timeout = window.setTimeout(() => {
        void saveGameState(boardWithElapsed);
      }, 350);
      return () => window.clearTimeout(timeout);
    }

    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(boardWithElapsed),
    );
  }, [board, clockNowMs, isSignedIn, levelStartedAtMs]);

  const movableSlotKeys = useMemo(() => {
    return new Set(board.movableSlots.map(slotKey));
  }, [board.movableSlots]);

  const scheduleLockInSound = useCallback(
    (delay = TILE_ENTRY_LOCK_IN_DELAY_MS) => {
      if (lockInTimeoutRef.current !== null) {
        window.clearTimeout(lockInTimeoutRef.current);
      }

      lockInTimeoutRef.current = window.setTimeout(() => {
        playSound('lock');
        lockInTimeoutRef.current = null;
      }, delay);
    },
    [playSound],
  );

  const clearEntryMotionSoundTimers = useCallback(() => {
    entryMotionSoundTimeoutsRef.current.forEach((timeout) => {
      window.clearTimeout(timeout);
    });
    entryMotionSoundTimeoutsRef.current = [];
  }, []);

  const scheduleEntryMotionSounds = useCallback(() => {
    clearEntryMotionSoundTimers();

    const tileCount = board.dimensions[0] * board.dimensions[1] - 1;
    const cueStart = Math.round(TILE_ENTRY_ANIMATION_MS * 0.06);
    const cueEnd = Math.max(
      cueStart,
      Math.min(TILE_ENTRY_ANIMATION_MS, TILE_ENTRY_LOCK_IN_DELAY_MS - 210),
    );
    const cueInterval = Math.max(150, 210 - tileCount * 4);
    const cueCount = Math.max(
      1,
      Math.min(2, Math.floor((cueEnd - cueStart) / cueInterval) + 1),
    );
    const sweepDelays = Array.from({ length: cueCount }, (_, index) => {
      const delay = cueStart + index * cueInterval;
      return Math.min(delay, cueEnd);
    });

    entryMotionSoundTimeoutsRef.current = sweepDelays.map((delay) =>
      window.setTimeout(() => {
        playSound('whoosh');
      }, delay),
    );
  }, [board.dimensions, clearEntryMotionSoundTimers, playSound]);

  useEffect(() => {
    if (!isBoardEntering || isMuted) {
      return clearEntryMotionSoundTimers;
    }

    if (entryMotionSoundCycleRef.current === boardEntryAnimationKey) {
      return clearEntryMotionSoundTimers;
    }

    entryMotionSoundCycleRef.current = boardEntryAnimationKey;
    scheduleEntryMotionSounds();
    return clearEntryMotionSoundTimers;
  }, [
    boardEntryAnimationKey,
    clearEntryMotionSoundTimers,
    isBoardEntering,
    isMuted,
    scheduleEntryMotionSounds,
  ]);

  useEffect(() => {
    if (boardEntryAnimationKey !== 0) {
      return;
    }

    if (hasPlayedInitialEntrySoundRef.current || isMuted) {
      return;
    }

    scheduleLockInSound();
    hasPlayedInitialEntrySoundRef.current = true;
  }, [boardEntryAnimationKey, isMuted, scheduleLockInSound]);

  const resetClock = useCallback(() => {
    const levelStart = Date.now();
    setLevelStartedAtMs(levelStart);
    setClockNowMs(levelStart);
    setIsClockRunning(false);
  }, []);

  const startClockIfNeeded = useCallback(() => {
    if (isClockRunning) {
      return;
    }

    const levelStart = Date.now();
    setLevelStartedAtMs(levelStart);
    setClockNowMs(levelStart);
    setIsClockRunning(true);
  }, [isClockRunning]);

  const isShuffleAnimationRunning = isResetting || isShuffleInProgress;

  const completeLevel = useCallback(
    (completedBoard: BoardState) => {
      const completedAtMs = Date.now();
      const completedElapsedTimeMs = Math.max(
        0,
        completedAtMs - levelStartedAtMs,
      );
      playSound('complete');
      setClockNowMs(completedAtMs);
      setIsClockRunning(false);
      setHintedSlot(null);
      if (isSignedIn) {
        void recordCompletedLevel({
          ...completedBoard,
          elapsedTimeMs: completedElapsedTimeMs,
        });
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
          scheduleLockInSound();
          resetClock();
          setIsBoardEntering(true);
          setBoardEntryAnimationKey((key) => key + 1);
          setTileRotationSeed((seed) => seed + 1);
          setBoard(
            createBoardState(
              completedBoard.level + 1,
              nextGridDimensions(completedBoard.dimensions),
            ),
          );
          setIsCelebrating(false);
          setIsShowingSolvedHint(false);
          setIsShowingHintPlaceholder(false);
          levelAdvanceTimeoutRef.current = null;
        }, LEVEL_COMPLETE_ADVANCE_DELAY_MS);
      }, LEVEL_COMPLETE_CELEBRATION_DELAY_MS);
    },
    [isSignedIn, levelStartedAtMs, playSound, resetClock, scheduleLockInSound],
  );

  const moveTile = useCallback(
    (slot: Slot) => {
      if (isCelebrating || isShuffleAnimationRunning) {
        return;
      }

      const nextBoard = moveBoardTile(board, slot);
      setBoard(nextBoard);

      if (nextBoard !== board) {
        startClockIfNeeded();
        playSound('move');
      }

      if (nextBoard !== board && isTileGridInOrder(nextBoard.tileGrid)) {
        completeLevel(nextBoard);
      }
    },
    [
      board,
      completeLevel,
      isCelebrating,
      isShuffleAnimationRunning,
      playSound,
      startClockIfNeeded,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const [row, column] = board.emptySlot;
      if (isCelebrating || isShuffleAnimationRunning) {
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
  }, [
    board,
    isCelebrating,
    isShuffleAnimationRunning,
    movableSlotKeys,
    moveTile,
  ]);

  const [columns, rows] = board.dimensions;
  const tileWidth = BOARD_SIZE / columns;
  const tileHeight = BOARD_SIZE / rows;
  const elapsedTimeMs = Math.max(0, clockNowMs - levelStartedAtMs);
  const elapsedTimeLabel = formatElapsedTime(elapsedTimeMs);

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

  const showFullImagePreview = useCallback(() => {
    if (isCelebrating || isShuffleAnimationRunning) {
      return;
    }

    if (boardHintTimeoutRef.current !== null) {
      window.clearTimeout(boardHintTimeoutRef.current);
      boardHintTimeoutRef.current = null;
    }
    if (placeholderRevealTimeoutRef.current !== null) {
      window.clearTimeout(placeholderRevealTimeoutRef.current);
      placeholderRevealTimeoutRef.current = null;
    }

    suppressNextClickRef.current = true;
    setIsShowingSolvedHint(true);
    setIsShowingHintPlaceholder(true);
    playSound('hint');
  }, [isCelebrating, isShuffleAnimationRunning, playSound]);

  const hideFullImagePreview = useCallback(() => {
    previewButtonPointerIdRef.current = null;
    clearBoardHint();
  }, [clearBoardHint]);

  useEffect(() => {
    return () => {
      clearBoardHint();
      clearEntryMotionSoundTimers();
      if (celebrationTimeoutRef.current !== null) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
      if (levelAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(levelAdvanceTimeoutRef.current);
      }
      if (boardEntryTimeoutRef.current !== null) {
        window.clearTimeout(boardEntryTimeoutRef.current);
      }
      if (lockInTimeoutRef.current !== null) {
        window.clearTimeout(lockInTimeoutRef.current);
      }
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
      shuffleInProgressRef.current = false;
      if (previewButtonTimeoutRef.current !== null) {
        window.clearTimeout(previewButtonTimeoutRef.current);
      }
      if (infoModalTransitionTimeoutRef.current !== null) {
        window.clearTimeout(infoModalTransitionTimeoutRef.current);
      }
    };
  }, [clearBoardHint, clearEntryMotionSoundTimers]);

  useEffect(() => {
    if (!isInfoModalRendered) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeInfoModal();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeInfoModal, isInfoModalRendered]);

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

      if (isCelebrating || isShuffleAnimationRunning) {
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
    [clearBoardHint, isCelebrating, isShuffleAnimationRunning, playSound],
  );

  const clearBoardHintFromPointer = useCallback(() => {
    if (isCelebrating || isShuffleAnimationRunning) {
      return;
    }

    clearBoardHint();
  }, [clearBoardHint, isCelebrating, isShuffleAnimationRunning]);

  const startPeekButtonPreview = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || isCelebrating || isShuffleAnimationRunning) {
        return;
      }

      previewButtonPointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (previewButtonTimeoutRef.current !== null) {
        window.clearTimeout(previewButtonTimeoutRef.current);
      }

      previewButtonTimeoutRef.current = window.setTimeout(() => {
        if (previewButtonPointerIdRef.current === event.pointerId) {
          showFullImagePreview();
        }
        previewButtonTimeoutRef.current = null;
      }, PEEK_BUTTON_PREVIEW_DELAY_MS);
    },
    [isCelebrating, isShuffleAnimationRunning, showFullImagePreview],
  );

  const stopPeekButtonPreview = useCallback(
    (event?: PointerEvent<HTMLButtonElement>) => {
      if (
        event &&
        previewButtonPointerIdRef.current !== null &&
        previewButtonPointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      if (
        event &&
        event.currentTarget.hasPointerCapture(event.pointerId)
      ) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (previewButtonTimeoutRef.current !== null) {
        window.clearTimeout(previewButtonTimeoutRef.current);
        previewButtonTimeoutRef.current = null;
      }

      hideFullImagePreview();
    },
    [hideFullImagePreview],
  );

  const moveTileAtClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const boardSurface = boardSurfaceRef.current;
      if (!boardSurface || isCelebrating || isShuffleAnimationRunning) {
        return;
      }

      const rect = boardSurface.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        return;
      }

      const column = Math.min(
        columns - 1,
        Math.floor((x / rect.width) * columns),
      );
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
      isShuffleAnimationRunning,
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
    if (shuffleInProgressRef.current || isShuffleAnimationRunning) {
      return;
    }

    shuffleInProgressRef.current = true;
    setIsShuffleInProgress(true);
    clearBoardHint();
    if (boardEntryTimeoutRef.current !== null) {
      window.clearTimeout(boardEntryTimeoutRef.current);
      boardEntryTimeoutRef.current = null;
    }
    if (levelAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(levelAdvanceTimeoutRef.current);
      levelAdvanceTimeoutRef.current = null;
    }
    if (celebrationTimeoutRef.current !== null) {
      window.clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = null;
    }
    setIsCelebrating(false);
    playSound('shuffle');
    scheduleLockInSound(RESET_GATHER_DELAY_MS + TILE_ENTRY_LOCK_IN_DELAY_MS);
    setTileRotationSeed((seed) => seed + 1);
    setIsResetting(true);
    resetTimeoutRef.current = window.setTimeout(() => {
      resetClock();
      setIsBoardEntering(true);
      setBoardEntryAnimationKey((key) => key + 1);
      setBoard(createBoardState(board.level, board.dimensions));
      setIsResetting(false);
      resetTimeoutRef.current = null;
    }, RESET_GATHER_DELAY_MS);
  }, [
    board.dimensions,
    board.level,
    clearBoardHint,
    isShuffleAnimationRunning,
    playSound,
    resetClock,
    scheduleLockInSound,
  ]);

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
        showInfoModal();
      }

      return;
    }

    showInfoModal();
  }, [exitBoardFullscreen, isBoardFullscreen, showInfoModal]);
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
    <div className="play-shell-reveal grid min-h-full w-full grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[900px]:grid-cols-1">
      <section
        className={[
          'play-board-reveal relative grid min-h-0 place-items-center overflow-hidden bg-night shadow-game-shell',
          isBoardFullscreen
            ? 'fullscreen-board-stage fixed inset-0 z-50 h-screen rounded-none p-4'
            : 'h-[calc(100svh-36px)] rounded-lg p-3 max-[900px]:p-2.5',
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
              : 'w-[min(100%,calc(100svh-64px))]',
          ].join(' ')}
          onPointerDown={startBoardHint}
          onPointerLeave={clearBoardHintFromPointer}
          onPointerUp={clearBoardHintFromPointer}
          onTouchEnd={moveTileFromTouch}
          style={{
            background: BOARD_SURFACE_BACKGROUND,
            touchAction: 'none',
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
                emptySlot={board.emptySlot}
                hintedSlot={hintedSlot}
                isHintPlaceholderVisible={isShowingHintPlaceholder}
                isEntering={isBoardEntering}
                isMovable={isMovable}
                isResetting={isResetting}
                isShowingSolvedHint={isShowingSolvedHint}
                key={`${boardEntryAnimationKey}:${tile.position}`}
                onHint={
                  tile.type === 'PLACEHOLDER' ? () => undefined : setHintedSlot
                }
                onInvalidMove={() => playSound('invalid')}
                onMove={moveTile}
                rows={rows}
                suppressNextClickRef={suppressNextClickRef}
                tile={tile}
                tileHeight={tileHeight}
                tileRotationSeed={tileRotationSeed}
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
                  className="absolute block animate-[celebration-float_1600ms_ease-out_both] rounded-full bg-celebration shadow-[0_0_26px_rgba(243,212,107,0.9),0_0_8px_rgba(255,255,255,0.9)]"
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
          className="play-overlay-float board-overlay absolute left-4 top-4 z-40 rounded-[7px] border px-3 py-2 text-sm font-bold text-accent-strong"
        >
          Level {board.level} · {columns}x{rows}
        </div>
        <div
          aria-label={`${board.moves} ${board.moves === 1 ? 'move' : 'moves'}, elapsed time ${elapsedTimeLabel}`}
          className="play-overlay-float board-overlay absolute bottom-4 left-4 z-40 rounded-[7px] border px-3 py-2 text-sm font-bold text-accent-strong"
        >
          {board.moves} {board.moves === 1 ? 'move' : 'moves'} ·{' '}
          {elapsedTimeLabel}
        </div>
        <div className="board-overlay absolute bottom-4 right-4 z-40 flex gap-1 rounded-[7px] border p-1 text-accent-strong">
          <GameToolButton
            aria-label={
              isShuffleAnimationRunning
                ? 'Level is shuffling'
                : 'Restart level'
            }
            className={
              isShuffleAnimationRunning
                ? 'disabled:cursor-wait'
                : undefined
            }
            description="Return the current puzzle to its starting state."
            disabled={isShuffleAnimationRunning}
            icon={
              <RotateCcw
                aria-hidden="true"
                className={[
                  'size-4',
                  isShuffleAnimationRunning
                    ? 'animate-spin motion-reduce:animate-none'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                strokeWidth={2.2}
              />
            }
            onClick={restartLevel}
            tooltip={
              isShuffleAnimationRunning
                ? 'Shuffling the puzzle'
                : 'Reset the current puzzle'
            }
            type="button"
          />
          {isSoundEnabled ? (
            <GameToolButton
              aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'}
              aria-pressed={!isMuted}
              description={
                isMuted
                  ? 'Enable music and game sound effects.'
                  : 'Mute music and game sound effects.'
              }
              icon={
                <SoundIcon
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2.2}
                />
              }
              onClick={toggleMuted}
              tooltip={isMuted ? 'Enable game sounds' : 'Mute game sounds'}
              type="button"
            />
          ) : null}
          <GameToolButton
            aria-label="Peek full image"
            className="active:bg-accent/15"
            description="Temporarily reveal the complete puzzle image while pressed."
            disabled={isCelebrating || isShuffleAnimationRunning}
            icon={
              <Search aria-hidden="true" className="size-4" strokeWidth={2.2} />
            }
            onClick={(event) => event.preventDefault()}
            onPointerCancel={stopPeekButtonPreview}
            onPointerDown={startPeekButtonPreview}
            onPointerLeave={stopPeekButtonPreview}
            onPointerUp={stopPeekButtonPreview}
            tooltip="Hold to preview the full image"
            type="button"
          />
          <GameToolButton
            aria-label={
              isBoardFullscreen
                ? 'Exit fullscreen board'
                : 'Enter fullscreen board'
            }
            description={
              isBoardFullscreen
                ? 'Return the board to the page layout.'
                : 'Expand the board to fill the screen.'
            }
            icon={
              <FullscreenIcon
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.2}
              />
            }
            onClick={toggleBoardFullscreen}
            tooltip={
              isBoardFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
            }
            type="button"
          />
        </div>
      </section>

      <aside className="play-panel-reveal sticky top-4 max-[900px]:hidden">
        <GameInfoPanel
          columns={columns}
          gameModeLabel={gameModeLabel}
          isSignedIn={isSignedIn}
          playerAvatarUrl={playerAvatarUrl}
          playerName={playerName}
          rows={rows}
        />
      </aside>
      {isInfoModalRendered && (
        <MobileInfoModalPortal
          isOpen={isInfoModalOpen}
          onClose={closeInfoModal}
        >
          <GameInfoPanel
            columns={columns}
            gameModeLabel={gameModeLabel}
            isModal
            isSignedIn={isSignedIn}
            onClose={closeInfoModal}
            playerAvatarUrl={playerAvatarUrl}
            playerName={playerName}
            rows={rows}
          />
        </MobileInfoModalPortal>
      )}
    </div>
  );
}

export function GameBoard({
  initialBoard,
  isSignedIn,
  playerAvatarUrl,
  playerName,
  soundEnabled = true,
}: GameBoardProps) {
  return (
    <SoundProvider enabled={soundEnabled}>
      <GameBoardContent
        initialBoard={initialBoard}
        isSignedIn={isSignedIn}
        playerAvatarUrl={playerAvatarUrl}
        playerName={playerName}
      />
    </SoundProvider>
  );
}
