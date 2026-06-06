'use client';

import {
  Maximize2,
  Minimize2,
  Search,
  Shuffle,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ButtonHTMLAttributes, PointerEvent, ReactNode } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { recordLevelAttempt, saveGameState } from '@/app/actions/game';
import {
  BoardState,
  Slot,
  createBoardState,
  getDimensionsForLevel,
  isTileGridInOrder,
  moveBoardTile,
  nextGridDimensions,
  resetBoardAttempt,
  slotKey,
} from '@/lib/board';

import { SoundProvider, useSound } from '../SoundProvider';
import { BoardTile } from './BoardTile';
import {
  BOARD_HINT_DELAY_MS,
  BOARD_HINT_TILE_REVEAL_DELAY_MS,
  BOARD_SIZE,
  BOARD_SURFACE_BACKGROUND,
  CELEBRATION_PARTICLES,
  CONFETTI_PARTICLES,
  LEVEL_COMPLETE_ADVANCE_DELAY_MS,
  LEVEL_COMPLETE_CELEBRATION_DELAY_MS,
  LEVEL_COMPLETE_CONFETTI_DURATION_MS,
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
  replayOfId?: string | null;
  soundEnabled?: boolean;
};

const INFO_MODAL_TRANSITION_MS = 180;
const PEEK_BUTTON_PREVIEW_DELAY_MS = 120;

function isEditableKeyboardTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
      ),
    )
  );
}

type GameToolButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  description: string;
  icon: ReactNode;
  tooltip: string;
};

function GameToolButton({
  'aria-describedby': ariaDescribedBy,
  className = '',
  description,
  icon,
  onBlur,
  onFocus,
  onPointerCancel,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onPointerUp,
  tooltip,
  ...buttonProps
}: GameToolButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTouchInteractionRef = useRef(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const descriptionId = useId();
  const tooltipId = useId();
  const describedBy = [descriptionId, ariaDescribedBy]
    .filter(Boolean)
    .join(' ');
  const showTooltip = () => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const bounds = button.getBoundingClientRect();
    setTooltipPosition({
      left: Math.min(
        window.innerWidth - 112,
        Math.max(112, bounds.left + bounds.width / 2),
      ),
      top: bounds.top - 8,
    });
  };
  const hideTooltip = () => setTooltipPosition(null);

  return (
    <span className="relative inline-grid">
      <button
        {...buttonProps}
        aria-describedby={describedBy}
        className={[
          'grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-line transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent max-[480px]:h-11 max-[480px]:w-11',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onBlur={(event) => {
          hideTooltip();
          isTouchInteractionRef.current = false;
          onBlur?.(event);
        }}
        onFocus={(event) => {
          if (!isTouchInteractionRef.current) {
            showTooltip();
          }
          onFocus?.(event);
        }}
        onPointerCancel={(event) => {
          hideTooltip();
          onPointerCancel?.(event);
        }}
        onPointerDown={(event) => {
          isTouchInteractionRef.current = event.pointerType !== 'mouse';
          if (isTouchInteractionRef.current) {
            hideTooltip();
          }
          onPointerDown?.(event);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') {
            isTouchInteractionRef.current = false;
            showTooltip();
          }
          onPointerEnter?.(event);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            hideTooltip();
          }
          onPointerLeave?.(event);
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse') {
            hideTooltip();
          }
          onPointerUp?.(event);
        }}
        ref={buttonRef}
      >
        {icon}
        <span className="sr-only" id={descriptionId}>
          {description}
        </span>
      </button>
      {tooltipPosition
        ? createPortal(
            <span
              className="pointer-events-none fixed z-100 w-max max-w-52 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-bold leading-snug text-foreground shadow-panel"
              id={tooltipId}
              role="tooltip"
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top,
              }}
            >
              {tooltip}
            </span>,
            document.body,
          )
        : null}
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
        'fixed inset-0 z-50 hidden items-center justify-center bg-black/75 p-3 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none max-[900px]:flex',
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
  replayOfId,
}: GameBoardProps) {
  const router = useRouter();
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
  const [confettiBurstKey, setConfettiBurstKey] = useState<number | null>(null);
  const [isCompletionImageVisible, setIsCompletionImageVisible] =
    useState(false);
  const [highestReachedLevel, setHighestReachedLevel] = useState(
    initialBoard.level,
  );
  const [attemptStartBoard, setAttemptStartBoard] = useState<BoardState>(() =>
    resetBoardAttempt(initialBoard, initialBoard.startedAt),
  );
  const [activeReplayOfId, setActiveReplayOfId] = useState<string | null>(
    replayOfId ?? null,
  );
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
  const [isFocusPaused, setIsFocusPaused] = useState(false);
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
  const confettiTimeoutRef = useRef<number | null>(null);
  const completedPuzzleKeyRef = useRef<string | null>(null);
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
  const isClockRunningRef = useRef(initialBoard.moves > 0);
  const isGameCompleteRef = useRef(false);

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
    const pauseClockForFocusLoss = () => {
      if (!isClockRunningRef.current || isGameCompleteRef.current) {
        return;
      }

      const pausedAt = Date.now();
      isClockRunningRef.current = false;
      setClockNowMs(pausedAt);
      setIsClockRunning(false);
      setIsFocusPaused(true);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseClockForFocusLoss();
      }
    };

    window.addEventListener('blur', pauseClockForFocusLoss);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      window.removeEventListener('blur', pauseClockForFocusLoss);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const elapsedTimeMs = Math.max(0, clockNowMs - levelStartedAtMs);
    const boardWithElapsed = {
      ...board,
      elapsedTimeMs,
    };

    if (isSignedIn && !activeReplayOfId) {
      const timeout = window.setTimeout(() => {
        void saveGameState(boardWithElapsed);
      }, 350);
      return () => window.clearTimeout(timeout);
    }

    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(boardWithElapsed),
    );
  }, [activeReplayOfId, board, clockNowMs, isSignedIn, levelStartedAtMs]);

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
    setIsFocusPaused(false);
    isClockRunningRef.current = false;
    isGameCompleteRef.current = false;
  }, []);

  const startClockForValidMove = useCallback(() => {
    if (isClockRunningRef.current) {
      return levelStartedAtMs;
    }

    const moveTime = Date.now();
    const preservedElapsedTimeMs = isFocusPaused
      ? Math.max(0, clockNowMs - levelStartedAtMs)
      : 0;
    const levelStart = moveTime - preservedElapsedTimeMs;

    setLevelStartedAtMs(levelStart);
    setClockNowMs(moveTime);
    setIsClockRunning(true);
    setIsFocusPaused(false);
    isClockRunningRef.current = true;

    return levelStart;
  }, [clockNowMs, isFocusPaused, levelStartedAtMs]);

  const isShuffleAnimationRunning = isResetting || isShuffleInProgress;

  const launchCompletionConfetti = useCallback((completedBoard: BoardState) => {
    const puzzleKey = `${completedBoard.level}:${completedBoard.startedAt}`;
    if (
      completedPuzzleKeyRef.current === puzzleKey ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    completedPuzzleKeyRef.current = puzzleKey;
    if (confettiTimeoutRef.current !== null) {
      window.clearTimeout(confettiTimeoutRef.current);
    }

    setConfettiBurstKey((key) => (key ?? 0) + 1);
    confettiTimeoutRef.current = window.setTimeout(() => {
      setConfettiBurstKey(null);
      confettiTimeoutRef.current = null;
    }, LEVEL_COMPLETE_CONFETTI_DURATION_MS);
  }, []);

  const completeLevel = useCallback(
    (completedBoard: BoardState, effectiveLevelStartedAtMs: number) => {
      const completedAtMs = Date.now();
      const completedElapsedTimeMs = Math.max(
        0,
        completedAtMs - effectiveLevelStartedAtMs,
      );
      isGameCompleteRef.current = true;
      isClockRunningRef.current = false;
      launchCompletionConfetti(completedBoard);
      playSound('complete');
      setClockNowMs(completedAtMs);
      setIsClockRunning(false);
      setIsFocusPaused(false);
      setHintedSlot(null);
      setIsCompletionImageVisible(true);
      setIsShowingSolvedHint(true);
      setIsShowingHintPlaceholder(true);
      if (isSignedIn) {
        void recordLevelAttempt({
          attemptType: activeReplayOfId ? 'replay' : 'original',
          board: {
            ...completedBoard,
            elapsedTimeMs: completedElapsedTimeMs,
          },
          puzzleConfig: attemptStartBoard,
          replayOfId: activeReplayOfId,
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
        celebrationTimeoutRef.current = null;

        levelAdvanceTimeoutRef.current = window.setTimeout(() => {
          scheduleLockInSound();
          resetClock();
          setIsBoardEntering(true);
          setBoardEntryAnimationKey((key) => key + 1);
          setTileRotationSeed((seed) => seed + 1);
          setHighestReachedLevel((highestLevel) =>
            Math.max(highestLevel, completedBoard.level + 1),
          );
          if (activeReplayOfId) {
            router.replace('/play', { scroll: false });
          }
          setActiveReplayOfId(null);
          const nextBoard = createBoardState(
            completedBoard.level + 1,
            nextGridDimensions(completedBoard.dimensions),
          );
          setAttemptStartBoard(
            resetBoardAttempt(nextBoard, nextBoard.startedAt),
          );
          setBoard(nextBoard);
          setIsCompletionImageVisible(false);
          setIsCelebrating(false);
          setIsShowingSolvedHint(false);
          setIsShowingHintPlaceholder(false);
          levelAdvanceTimeoutRef.current = null;
        }, LEVEL_COMPLETE_ADVANCE_DELAY_MS);
      }, LEVEL_COMPLETE_CELEBRATION_DELAY_MS);
    },
    [
      activeReplayOfId,
      attemptStartBoard,
      isSignedIn,
      launchCompletionConfetti,
      playSound,
      resetClock,
      router,
      scheduleLockInSound,
    ],
  );

  const moveTile = useCallback(
    (slot: Slot) => {
      if (isCelebrating || isShuffleAnimationRunning) {
        return;
      }

      const nextBoard = moveBoardTile(board, slot);
      setBoard(nextBoard);

      if (nextBoard !== board) {
        const effectiveLevelStartedAtMs = startClockForValidMove();
        playSound('move');

        if (isTileGridInOrder(nextBoard.tileGrid)) {
          completeLevel(nextBoard, effectiveLevelStartedAtMs);
        }
      }
    },
    [
      board,
      completeLevel,
      isCelebrating,
      isShuffleAnimationRunning,
      playSound,
      startClockForValidMove,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        isEditableKeyboardTarget(event.target) ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches
      ) {
        return;
      }

      const [row, column] = board.emptySlot;
      if (isCelebrating || isShuffleAnimationRunning) {
        return;
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const slotToMove: Slot | null = (() => {
        switch (key) {
          case 'ArrowUp':
          case 'w':
            return [row + 1, column];
          case 'ArrowRight':
          case 'd':
            return [row, column - 1];
          case 'ArrowDown':
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
      if (confettiTimeoutRef.current !== null) {
        window.clearTimeout(confettiTimeoutRef.current);
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

      if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
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

  const selectLevel = useCallback(
    (level: number) => {
      const targetLevel = Math.trunc(level);
      const maxLevel = Math.max(highestReachedLevel, board.level);

      if (
        !Number.isFinite(targetLevel) ||
        targetLevel < 1 ||
        targetLevel > maxLevel ||
        targetLevel === board.level ||
        shuffleInProgressRef.current ||
        isShuffleAnimationRunning
      ) {
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
      setIsCompletionImageVisible(false);
      setIsShowingSolvedHint(false);
      setIsShowingHintPlaceholder(false);
      setIsClockRunning(false);
      setIsFocusPaused(false);
      isClockRunningRef.current = false;
      isGameCompleteRef.current = false;
      playSound('shuffle');
      scheduleLockInSound(RESET_GATHER_DELAY_MS + TILE_ENTRY_LOCK_IN_DELAY_MS);
      setTileRotationSeed((seed) => seed + 1);
      setIsResetting(true);

      resetTimeoutRef.current = window.setTimeout(() => {
        resetClock();
        if (activeReplayOfId) {
          router.replace('/play', { scroll: false });
        }
        const selectedBoard = createBoardState(
          targetLevel,
          getDimensionsForLevel(targetLevel),
        );
        setActiveReplayOfId(null);
        setAttemptStartBoard(
          resetBoardAttempt(selectedBoard, selectedBoard.startedAt),
        );
        setIsBoardEntering(true);
        setBoardEntryAnimationKey((key) => key + 1);
        setBoard(selectedBoard);
        setIsResetting(false);
        resetTimeoutRef.current = null;
      }, RESET_GATHER_DELAY_MS);
    },
    [
      activeReplayOfId,
      board.level,
      clearBoardHint,
      highestReachedLevel,
      isShuffleAnimationRunning,
      playSound,
      resetClock,
      router,
      scheduleLockInSound,
    ],
  );

  const refreshBoard = useCallback(
    (createNextBoard: () => BoardState, exitReplay: boolean) => {
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
      setIsCompletionImageVisible(false);
      setIsShowingSolvedHint(false);
      setIsShowingHintPlaceholder(false);
      setIsClockRunning(false);
      setIsFocusPaused(false);
      isClockRunningRef.current = false;
      isGameCompleteRef.current = false;
      playSound('shuffle');
      scheduleLockInSound(RESET_GATHER_DELAY_MS + TILE_ENTRY_LOCK_IN_DELAY_MS);
      setTileRotationSeed((seed) => seed + 1);
      setIsResetting(true);
      resetTimeoutRef.current = window.setTimeout(() => {
        resetClock();
        const nextBoard = createNextBoard();

        if (exitReplay && activeReplayOfId) {
          router.replace('/play', { scroll: false });
        }
        if (exitReplay) {
          setActiveReplayOfId(null);
        }

        setAttemptStartBoard(resetBoardAttempt(nextBoard, nextBoard.startedAt));
        setIsBoardEntering(true);
        setBoardEntryAnimationKey((key) => key + 1);
        setBoard(nextBoard);
        setIsResetting(false);
        resetTimeoutRef.current = null;
      }, RESET_GATHER_DELAY_MS);
    },
    [
      activeReplayOfId,
      clearBoardHint,
      isShuffleAnimationRunning,
      playSound,
      resetClock,
      router,
      scheduleLockInSound,
    ],
  );

  const resetLevel = useCallback(() => {
    refreshBoard(() => resetBoardAttempt(attemptStartBoard), false);
  }, [attemptStartBoard, refreshBoard]);

  const shuffleLevel = useCallback(() => {
    refreshBoard(() => createBoardState(board.level, board.dimensions), true);
  }, [board.dimensions, board.level, refreshBoard]);

  const gameModeLabel = activeReplayOfId
    ? 'Replay run'
    : isSignedIn
      ? 'Saved run'
      : 'Anonymous run';
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

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableKeyboardTarget(event.target) ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'r':
          event.preventDefault();
          resetLevel();
          break;
        case 's':
          event.preventDefault();
          shuffleLevel();
          break;
        case 'f':
          event.preventDefault();
          void toggleBoardFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [resetLevel, shuffleLevel, toggleBoardFullscreen]);

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
          {isCompletionImageVisible ? (
            <div
              aria-label="Completed puzzle image"
              className="completion-image-reveal pointer-events-none absolute inset-0 z-20 bg-[url('/frog.svg')] bg-cover bg-center bg-no-repeat"
              role="img"
            />
          ) : null}
          {confettiBurstKey !== null ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
              key={confettiBurstKey}
            >
              {CONFETTI_PARTICLES.map((particle, index) => (
                <span
                  className="completion-confetti-piece absolute top-1/2 block"
                  key={index}
                  style={
                    {
                      '--confetti-color': particle.color,
                      '--confetti-delay': particle.delay,
                      '--confetti-drift': particle.drift,
                      '--confetti-drift-mid': particle.driftMid,
                      '--confetti-rotation': particle.rotation,
                      '--confetti-rotation-mid': particle.rotationMid,
                      '--confetti-size': particle.size,
                      left: particle.left,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ) : null}
          {isCelebrating && (
            <div className="pointer-events-none absolute inset-0 z-30 animate-[celebration-fade-in_700ms_ease-out_both] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-panel)_18%,transparent),color-mix(in_srgb,var(--color-primary)_18%,transparent)_42%,color-mix(in_srgb,var(--color-night)_30%,transparent))]" />
              <div className="absolute inset-4 rounded-lg border border-surface/60 shadow-[inset_0_0_52px_color-mix(in_srgb,var(--color-surface)_38%,transparent),0_0_44px_color-mix(in_srgb,var(--color-celebration)_30%,transparent)]" />
              {CELEBRATION_PARTICLES.map((particle, index) => (
                <span
                  className="absolute block animate-[celebration-float_1600ms_ease-out_both] rounded-full bg-celebration shadow-[0_0_26px_color-mix(in_srgb,var(--color-celebration)_90%,transparent),0_0_8px_color-mix(in_srgb,var(--color-surface)_90%,transparent)]"
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
              <div className="absolute inset-x-6 bottom-6 rounded-lg border border-surface/35 bg-panel/90 px-5 py-4 text-center shadow-panel backdrop-blur">
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
          className="play-overlay-float board-overlay absolute left-4 top-4 z-40 rounded-[7px] border px-3 py-2 text-sm font-bold text-accent-strong max-[480px]:hidden"
        >
          Level {board.level} · {columns}x{rows}
        </div>
        {isFocusPaused ? (
          <div
            aria-live="polite"
            className="board-overlay absolute bottom-[4.5rem] left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-[7px] border px-3 py-2 text-center text-xs font-bold text-foreground max-[480px]:bottom-[8.25rem] max-[480px]:max-w-[calc(100%-2rem)] max-[480px]:whitespace-normal"
            role="status"
          >
            Game paused. Make your next move to continue.
          </div>
        ) : null}
        <div className="absolute inset-x-4 bottom-4 z-40 flex items-end justify-between gap-2 max-[480px]:flex-col max-[480px]:items-stretch">
          <div className="contents max-[480px]:flex max-[480px]:items-center max-[480px]:justify-center max-[480px]:gap-2">
            <div
              aria-label={`Level ${board.level}, ${columns} by ${rows} grid`}
              className="board-overlay hidden whitespace-nowrap rounded-[7px] border px-2.5 py-2 text-xs font-bold text-accent-strong max-[480px]:block"
            >
              Level {board.level} · {columns}x{rows}
            </div>
            <div
              aria-label={`${board.moves} ${board.moves === 1 ? 'move' : 'moves'}, elapsed time ${elapsedTimeLabel}`}
              className="play-overlay-float board-overlay self-start whitespace-nowrap rounded-[7px] border px-3 py-2 text-sm font-bold text-accent-strong max-[480px]:self-auto max-[480px]:px-2.5 max-[480px]:text-xs"
            >
              {board.moves} {board.moves === 1 ? 'move' : 'moves'} ·{' '}
              {elapsedTimeLabel}
            </div>
          </div>
          <div className="board-overlay flex shrink-0 self-end gap-1 rounded-[7px] border p-1 text-accent-strong max-[480px]:self-center">
            <GameToolButton
              aria-label={
                isShuffleAnimationRunning
                  ? 'Puzzle is updating'
                  : 'Reset current puzzle'
              }
              className={
                isShuffleAnimationRunning ? 'disabled:cursor-wait' : undefined
              }
              description="Return the current puzzle to its starting configuration."
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
              onClick={resetLevel}
              tooltip={
                isShuffleAnimationRunning
                  ? 'Updating the puzzle'
                  : 'Reset the current puzzle (R)'
              }
              type="button"
            />
            <GameToolButton
              aria-label={
                isShuffleAnimationRunning
                  ? 'Puzzle is shuffling'
                  : 'Shuffle puzzle'
              }
              className={
                isShuffleAnimationRunning ? 'disabled:cursor-wait' : undefined
              }
              description="Create a new puzzle configuration for this level."
              disabled={isShuffleAnimationRunning}
              icon={
                <Shuffle
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2.2}
                />
              }
              onClick={shuffleLevel}
              tooltip={
                isShuffleAnimationRunning
                  ? 'Shuffling the puzzle'
                  : 'Shuffle the puzzle (S)'
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
                <Search
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2.2}
                />
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
                isBoardFullscreen
                  ? 'Exit fullscreen (F)'
                  : 'Enter fullscreen (F)'
              }
              type="button"
            />
          </div>
        </div>
      </section>

      <aside className="play-panel-reveal sticky top-4 max-[900px]:hidden">
        <GameInfoPanel
          columns={columns}
          gameModeLabel={gameModeLabel}
          highestReachedLevel={highestReachedLevel}
          isLevelSelectDisabled={isShuffleAnimationRunning || isCelebrating}
          isSignedIn={isSignedIn}
          level={board.level}
          onSelectLevel={selectLevel}
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
            highestReachedLevel={highestReachedLevel}
            isLevelSelectDisabled={isShuffleAnimationRunning || isCelebrating}
            isModal
            isSignedIn={isSignedIn}
            level={board.level}
            onClose={closeInfoModal}
            onSelectLevel={selectLevel}
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
  replayOfId,
  soundEnabled = true,
}: GameBoardProps) {
  return (
    <SoundProvider enabled={soundEnabled}>
      <GameBoardContent
        initialBoard={initialBoard}
        isSignedIn={isSignedIn}
        playerAvatarUrl={playerAvatarUrl}
        playerName={playerName}
        replayOfId={replayOfId}
      />
    </SoundProvider>
  );
}
