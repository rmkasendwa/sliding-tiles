'use client';

import type { PointerEvent } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { recordLevelAttempt, saveGameState } from '@/app/actions/game';
import {
  ANONYMOUS_GAME_STORAGE_KEY,
  parseAnonymousGameProgress,
  serializeAnonymousGameProgress,
  type AnonymousTimerStatus,
} from '@/lib/anonymousGameStorage';
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
  LEVEL_COMPLETE_ADVANCE_DELAY_MS,
  LEVEL_COMPLETE_CELEBRATION_DELAY_MS,
  LEVEL_COMPLETE_CONFETTI_DURATION_MS,
  RESET_GATHER_DELAY_MS,
  TILE_ENTRY_ANIMATION_MS,
  TILE_ENTRY_LOCK_IN_DELAY_MS,
} from './constants';
import { CompletionEffects } from './CompletionEffects';
import { GameHud } from './GameHud';
import { GameToolbar } from './GameToolbar';
import { INFO_MODAL_TRANSITION_MS } from './MobileInfoModalPortal';
import { ResponsiveGameInfoPanel } from './ResponsiveGameInfoPanel';

export type GameBoardProps = {
  initialBoard: BoardState;
  isSignedIn: boolean;
  playerAvatarUrl?: string | null;
  playerName?: string;
  replayOfId?: string | null;
  soundEnabled?: boolean;
};

const PEEK_BUTTON_PREVIEW_DELAY_MS = 120;
const LEGACY_ANONYMOUS_GAME_STORAGE_KEY = 'sliding-tiles:anonymous-board';
const HIGHEST_REACHED_LEVEL_STORAGE_KEY =
  'sliding-tiles:highest-reached-level';

function subscribeToClientReady() {
  return () => undefined;
}

function getClientReadySnapshot() {
  return true;
}

function getServerClientReadySnapshot() {
  return false;
}

function getAnonymousProgressSnapshot() {
  return window.localStorage.getItem(ANONYMOUS_GAME_STORAGE_KEY);
}

function getHighestReachedLevelSnapshot() {
  return window.localStorage.getItem(HIGHEST_REACHED_LEVEL_STORAGE_KEY);
}

function getServerStorageSnapshot() {
  return null;
}

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
  initialAttemptStartBoard,
  initialBoard,
  initialHighestReachedLevel,
  initialTimerStatus,
  isSignedIn,
  playerAvatarUrl,
  playerName,
  replayOfId,
}: GameBoardProps & {
  initialAttemptStartBoard?: BoardState;
  initialHighestReachedLevel?: number;
  initialTimerStatus?: AnonymousTimerStatus;
}) {
  const {
    isEnabled: isSoundEnabled,
    isMuted,
    playSound,
    startAmbience,
    stopAmbience,
    toggleMuted,
  } = useSound();
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [confettiBurstKey, setConfettiBurstKey] = useState<number | null>(null);
  const [isCompletionImageVisible, setIsCompletionImageVisible] =
    useState(false);
  const [highestReachedLevel, setHighestReachedLevel] = useState(
    Math.max(
      initialHighestReachedLevel ?? initialBoard.level,
      initialBoard.level,
    ),
  );
  const [attemptStartBoard, setAttemptStartBoard] = useState<BoardState>(() =>
    initialAttemptStartBoard ??
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
    () =>
      initialTimerStatus === 'running' ||
      (initialTimerStatus === undefined && initialBoard.moves > 0),
  );
  const [isFocusPaused, setIsFocusPaused] = useState(
    initialTimerStatus === 'paused',
  );
  const [tileRotationSeed, setTileRotationSeed] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [isShuffleInProgress, setIsShuffleInProgress] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isInfoModalRendered, setIsInfoModalRendered] = useState(false);
  const [isBoardFullscreen, setIsBoardFullscreen] = useState(false);
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
  const isClockRunningRef = useRef(
    initialTimerStatus === 'running' ||
      (initialTimerStatus === undefined && initialBoard.moves > 0),
  );
  const isGameCompleteRef = useRef(false);
  const exitReplayMode = useCallback(() => {
    window.history.replaceState(window.history.state, '', '/play');
    setActiveReplayOfId(null);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      HIGHEST_REACHED_LEVEL_STORAGE_KEY,
      String(highestReachedLevel),
    );
  }, [highestReachedLevel]);

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

    if (!isSignedIn) {
      window.localStorage.removeItem(LEGACY_ANONYMOUS_GAME_STORAGE_KEY);

      if (isGameCompleteRef.current || isTileGridInOrder(board.tileGrid)) {
        window.localStorage.removeItem(ANONYMOUS_GAME_STORAGE_KEY);
        return;
      }

      const timerStatus: AnonymousTimerStatus = isFocusPaused
        ? 'paused'
        : isClockRunning
          ? 'running'
          : 'idle';

      window.localStorage.setItem(
        ANONYMOUS_GAME_STORAGE_KEY,
        serializeAnonymousGameProgress({
          attemptStartBoard,
          board: boardWithElapsed,
          highestReachedLevel,
          timerStatus,
        }),
      );
    }
  }, [
    activeReplayOfId,
    attemptStartBoard,
    board,
    clockNowMs,
    highestReachedLevel,
    isClockRunning,
    isFocusPaused,
    isSignedIn,
    levelStartedAtMs,
  ]);

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
          resetClock();
          setIsBoardEntering(false);
          setHighestReachedLevel((highestLevel) =>
            Math.max(highestLevel, completedBoard.level + 1),
          );
          if (activeReplayOfId) {
            exitReplayMode();
          }
          if (!activeReplayOfId) {
            setActiveReplayOfId(null);
          }
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
      exitReplayMode,
      isSignedIn,
      launchCompletionConfetti,
      playSound,
      resetClock,
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
      setHighestReachedLevel((highestLevel) =>
        Math.max(highestLevel, board.level),
      );
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
          exitReplayMode();
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
      exitReplayMode,
      highestReachedLevel,
      isShuffleAnimationRunning,
      playSound,
      resetClock,
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
          exitReplayMode();
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
      exitReplayMode,
      isShuffleAnimationRunning,
      playSound,
      resetClock,
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
          <CompletionEffects
            confettiBurstKey={confettiBurstKey}
            isCelebrating={isCelebrating}
            isCompletionImageVisible={isCompletionImageVisible}
          />
        </div>
        <GameToolbar
          columns={columns}
          elapsedTimeLabel={elapsedTimeLabel}
          isBoardFullscreen={isBoardFullscreen}
          isCelebrating={isCelebrating}
          isFocusPaused={isFocusPaused}
          isMuted={isMuted}
          isShuffleAnimationRunning={isShuffleAnimationRunning}
          isSoundEnabled={isSoundEnabled}
          level={board.level}
          moves={board.moves}
          onPeekCancel={stopPeekButtonPreview}
          onPeekDown={startPeekButtonPreview}
          onPeekLeave={stopPeekButtonPreview}
          onPeekUp={stopPeekButtonPreview}
          onReset={resetLevel}
          onShuffle={shuffleLevel}
          onToggleFullscreen={() => void toggleBoardFullscreen()}
          onToggleMuted={toggleMuted}
          rows={rows}
        />
      </section>

      <ResponsiveGameInfoPanel
        columns={columns}
        gameModeLabel={gameModeLabel}
        highestReachedLevel={highestReachedLevel}
        isLevelSelectDisabled={isShuffleAnimationRunning || isCelebrating}
        isModalOpen={isInfoModalOpen}
        isModalRendered={isInfoModalRendered}
        isSignedIn={isSignedIn}
        level={board.level}
        onCloseModal={closeInfoModal}
        onSelectLevel={selectLevel}
        playerAvatarUrl={playerAvatarUrl}
        playerName={playerName}
        rows={rows}
      />
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
  const isAnonymousStorageReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    isSignedIn ? getClientReadySnapshot : getServerClientReadySnapshot,
  );
  const storedProgressValue = useSyncExternalStore(
    subscribeToClientReady,
    getAnonymousProgressSnapshot,
    getServerStorageSnapshot,
  );
  const storedHighestLevelValue = useSyncExternalStore(
    subscribeToClientReady,
    getHighestReachedLevelSnapshot,
    getServerStorageSnapshot,
  );
  const restoredProgress = useMemo(
    () =>
      isSignedIn || replayOfId
        ? null
        : parseAnonymousGameProgress(storedProgressValue),
    [isSignedIn, replayOfId, storedProgressValue],
  );
  const storedHighestReachedLevel = useMemo(() => {
    if (isSignedIn || replayOfId) {
      return undefined;
    }

    const storedLevel = Number.parseInt(storedHighestLevelValue ?? '', 10);
    return Number.isFinite(storedLevel) && storedLevel > 0
      ? storedLevel
      : undefined;
  }, [isSignedIn, replayOfId, storedHighestLevelValue]);

  if (!isAnonymousStorageReady) {
    return (
      <div
        aria-label="Loading saved game"
        className="grid min-h-[calc(100svh-36px)] w-full place-items-center rounded-lg bg-night text-sm font-bold text-surface"
        role="status"
      >
        Loading game...
      </div>
    );
  }

  const activeInitialBoard = restoredProgress?.board ?? initialBoard;
  const initialHighestReachedLevel = Math.max(
    activeInitialBoard.level,
    restoredProgress?.highestReachedLevel ?? 1,
    storedHighestReachedLevel ?? 1,
  );

  return (
    <SoundProvider enabled={soundEnabled}>
      <GameBoardContent
        initialAttemptStartBoard={restoredProgress?.attemptStartBoard}
        initialBoard={activeInitialBoard}
        initialHighestReachedLevel={initialHighestReachedLevel}
        initialTimerStatus={restoredProgress?.timerStatus}
        isSignedIn={isSignedIn}
        playerAvatarUrl={playerAvatarUrl}
        playerName={playerName}
        replayOfId={replayOfId}
      />
    </SoundProvider>
  );
}
