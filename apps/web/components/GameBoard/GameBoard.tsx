'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { recordLevelAttempt } from '@/app/actions/game';
import type { AnonymousTimerStatus } from '@/lib/anonymousGameStorage';
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
import { solveSlidingTilesBoard } from '@/lib/boardSolver';

import { SoundProvider, useSound } from '../SoundProvider';
import {
  AUTO_PLAY_DEFAULT_STEP_DELAY_MS,
  AUTO_PLAY_FASTEST_STEP_DELAY_MS,
  AUTO_PLAY_SLOWEST_STEP_DELAY_MS,
  LEVEL_COMPLETE_ADVANCE_DELAY_MS,
  LEVEL_COMPLETE_CELEBRATION_DELAY_MS,
  LEVEL_COMPLETE_CONFETTI_DURATION_MS,
  RESET_GATHER_DELAY_MS,
  TILE_ENTRY_ANIMATION_MS,
  TILE_ENTRY_LOCK_IN_DELAY_MS,
} from './constants';
import { GameStage } from './GameStage';
import type { ReplayPerformance, ReplayResult } from './ReplayResultPanel';
import { ResponsiveGameInfoPanel } from './ResponsiveGameInfoPanel';
import { useAnonymousGameplayAnalytics } from './useAnonymousGameplayAnalytics';
import { useBoardFullscreen } from './useBoardFullscreen';
import { useBoardPreview } from './useBoardPreview';
import { useGameInfoModal } from './useGameInfoModal';
import { useGameKeyboardControls } from './useGameKeyboardControls';
import { useGamePersistence } from './useGamePersistence';
import { useGameTimer } from './useGameTimer';
import { useInitialGameState } from './useInitialGameState';

export type GameBoardProps = {
  initialBoard: BoardState;
  initialHighestReachedLevel?: number;
  isSignedIn: boolean;
  playerAvatarUrl?: string | null;
  playerName?: string;
  replayBest?: ReplayPerformance;
  replayOfId?: string | null;
  soundEnabled?: boolean;
};

function GameBoardContent({
  initialAttemptStartBoard,
  initialBoard,
  initialHighestReachedLevel,
  initialTimerStatus,
  isSignedIn,
  playerAvatarUrl,
  playerName,
  replayBest,
  replayOfId,
}: GameBoardProps & {
  initialAttemptStartBoard?: BoardState;
  initialTimerStatus?: AnonymousTimerStatus;
}) {
  const router = useRouter();
  const { track: trackAnonymousEvent } =
    useAnonymousGameplayAnalytics(isSignedIn);
  const {
    isEnabled: isSoundEnabled,
    isMuted,
    playSound,
    startAmbience,
    stopAmbience,
    toggleMuted,
  } = useSound();
  const {
    completeClock,
    elapsedTimeLabel,
    elapsedTimeMs,
    isFocusPaused,
    isGameComplete,
    prepareClockForBoardChange,
    resetClock,
    startClockForValidMove,
    timerStatus,
  } = useGameTimer(initialBoard, initialTimerStatus);
  const {
    close: closeInfoModal,
    isOpen: isInfoModalOpen,
    isRendered: isInfoModalRendered,
    open: showInfoModal,
  } = useGameInfoModal();
  const {
    exit: exitBoardFullscreen,
    frameRef: boardFrameRef,
    isFullscreen: isBoardFullscreen,
    toggle: toggleBoardFullscreen,
  } = useBoardFullscreen();
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
  const [attemptStartBoard, setAttemptStartBoard] = useState<BoardState>(
    () =>
      initialAttemptStartBoard ??
      resetBoardAttempt(initialBoard, initialBoard.startedAt),
  );
  const [activeReplayOfId, setActiveReplayOfId] = useState<string | null>(
    replayOfId ?? null,
  );
  const [currentReplayBest, setCurrentReplayBest] =
    useState<ReplayPerformance | null>(replayBest ?? null);
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [boardEntryAnimationKey, setBoardEntryAnimationKey] = useState(0);
  const [isBoardEntering, setIsBoardEntering] = useState(true);
  const [tileRotationSeed, setTileRotationSeed] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [isShuffleInProgress, setIsShuffleInProgress] = useState(false);
  const [isAutoPlayRunning, setIsAutoPlayRunning] = useState(false);
  const [isAutoPlayCompletion, setIsAutoPlayCompletion] = useState(false);
  const [isAutoPlaySolvedNoticeVisible, setIsAutoPlaySolvedNoticeVisible] =
    useState(false);
  const [autoPlayStepDelayMs, setAutoPlayStepDelayMs] = useState(
    AUTO_PLAY_DEFAULT_STEP_DELAY_MS,
  );
  const [autoPlayMoveCount, setAutoPlayMoveCount] = useState(0);
  const [autoPlayElapsedMs, setAutoPlayElapsedMs] = useState(0);
  const [autoPlayStatusMessage, setAutoPlayStatusMessage] = useState<
    string | null
  >(null);
  const isShuffleAnimationRunning = isResetting || isShuffleInProgress;
  const playHintSound = useCallback(() => playSound('hint'), [playSound]);
  const getAnalyticsMetadata = useCallback(
    (
      targetBoard: BoardState = board,
      timerValueMs: number = elapsedTimeMs,
    ) => ({
      level: targetBoard.level,
      moveCount: targetBoard.moves,
      puzzleSize: `${targetBoard.dimensions[0]}x${targetBoard.dimensions[1]}`,
      timerValueMs: Math.max(0, Math.round(timerValueMs)),
    }),
    [board, elapsedTimeMs],
  );
  const analyticsMetadataRef = useRef(getAnalyticsMetadata());
  useEffect(() => {
    analyticsMetadataRef.current = getAnalyticsMetadata();
  }, [getAnalyticsMetadata]);
  const trackFullImagePeek = useCallback(() => {
    trackAnonymousEvent('full_image_peeked', getAnalyticsMetadata());
  }, [getAnalyticsMetadata, trackAnonymousEvent]);
  const {
    clear: clearBoardHint,
    clearFromPointer: clearBoardHintFromPointer,
    hintedSlot,
    isShowingHintPlaceholder,
    isShowingSolvedHint,
    setHintedSlot,
    showSolvedBoard,
    startBoardHint,
    startPeekButtonPreview,
    stopPeekButtonPreview,
    suppressNextClickRef,
  } = useBoardPreview({
    isInteractionBlocked:
      isCelebrating ||
      isShuffleAnimationRunning ||
      isAutoPlayRunning ||
      Boolean(replayResult),
    onFullImagePeeked: trackFullImagePeek,
    playHintSound,
  });
  const celebrationTimeoutRef = useRef<number | null>(null);
  const confettiTimeoutRef = useRef<number | null>(null);
  const completedPuzzleKeyRef = useRef<string | null>(null);
  const levelAdvanceTimeoutRef = useRef<number | null>(null);
  const boardEntryTimeoutRef = useRef<number | null>(null);
  const lockInTimeoutRef = useRef<number | null>(null);
  const entryMotionSoundTimeoutsRef = useRef<number[]>([]);
  const entryMotionSoundCycleRef = useRef<number>(-1);
  const resetTimeoutRef = useRef<number | null>(null);
  const autoPlayTimeoutRef = useRef<number | null>(null);
  const autoPlayMovesRef = useRef<Slot[]>([]);
  const autoPlayStepRef = useRef(0);
  const autoPlayStepDelayRef = useRef(autoPlayStepDelayMs);
  const autoPlayElapsedMsRef = useRef(0);
  const autoPlayStartedAtRef = useRef<number | null>(null);
  const isAutoPlayRunningRef = useRef(false);
  const shuffleInProgressRef = useRef(false);
  const hasPlayedInitialEntrySoundRef = useRef(false);
  const previousTimerStatusRef = useRef(timerStatus);
  const boardRef = useRef(board);
  const exitReplayMode = useCallback(() => {
    setActiveReplayOfId(null);
    router.replace('/play', { scroll: false });
  }, [router]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    autoPlayStepDelayRef.current = autoPlayStepDelayMs;
  }, [autoPlayStepDelayMs]);

  useEffect(() => {
    if (!isAutoPlayRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      const startedAt = autoPlayStartedAtRef.current;
      setAutoPlayElapsedMs(
        autoPlayElapsedMsRef.current +
          (startedAt === null ? 0 : Date.now() - startedAt),
      );
    }, 250);

    return () => window.clearInterval(interval);
  }, [isAutoPlayRunning]);

  useEffect(() => {
    startAmbience();
    return stopAmbience;
  }, [startAmbience, stopAmbience]);

  useEffect(() => {
    trackAnonymousEvent('game_opened', analyticsMetadataRef.current);
    trackAnonymousEvent(
      'signup_prompt_shown',
      analyticsMetadataRef.current,
    );
  }, [trackAnonymousEvent]);

  useEffect(() => {
    trackAnonymousEvent('level_started', analyticsMetadataRef.current);
  }, [board.level, board.startedAt, trackAnonymousEvent]);

  useEffect(() => {
    const previousStatus = previousTimerStatusRef.current;
    previousTimerStatusRef.current = timerStatus;

    if (previousStatus === 'running' && timerStatus === 'paused') {
      trackAnonymousEvent('timer_paused', analyticsMetadataRef.current);
    } else if (previousStatus === 'paused' && timerStatus === 'running') {
      trackAnonymousEvent('timer_resumed', analyticsMetadataRef.current);
    }
  }, [timerStatus, trackAnonymousEvent]);

  useEffect(() => {
    const abandonOnPageExit = () => {
      if (board.moves > 0 && !isGameComplete) {
        trackAnonymousEvent('level_abandoned', getAnalyticsMetadata(), {
          immediate: true,
        });
      }
    };

    window.addEventListener('pagehide', abandonOnPageExit);
    return () => window.removeEventListener('pagehide', abandonOnPageExit);
  }, [
    board.moves,
    getAnalyticsMetadata,
    isGameComplete,
    trackAnonymousEvent,
  ]);

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

  useGamePersistence({
    activeReplayOfId,
    attemptStartBoard,
    board,
    elapsedTimeMs,
    highestReachedLevel,
    isGameComplete,
    isPersistenceDisabled: isAutoPlayRunning || isAutoPlayCompletion,
    isSignedIn,
    timerStatus,
  });

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

  const cancelAutoPlay = useCallback(() => {
    if (autoPlayTimeoutRef.current !== null) {
      window.clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }

    autoPlayMovesRef.current = [];
    autoPlayStepRef.current = 0;
    if (autoPlayStartedAtRef.current !== null) {
      const nextElapsed =
        autoPlayElapsedMsRef.current + Date.now() - autoPlayStartedAtRef.current;
      autoPlayElapsedMsRef.current = nextElapsed;
      autoPlayStartedAtRef.current = null;
      setAutoPlayElapsedMs(nextElapsed);
    }
    isAutoPlayRunningRef.current = false;
    setIsAutoPlayRunning(false);
  }, []);

  const completeLevel = useCallback(
    (
      completedBoard: BoardState,
      effectiveLevelStartedAtMs: number,
      source: 'auto-play' | 'player' = 'player',
    ) => {
      const completedElapsedTimeMs = completeClock(effectiveLevelStartedAtMs);
      const latestReplayPerformance = {
        moves: completedBoard.moves,
        timeSeconds: Math.max(1, Math.round(completedElapsedTimeMs / 1000)),
      };
      const analyticsMetadata = getAnalyticsMetadata(
        completedBoard,
        completedElapsedTimeMs,
      );
      const completedReplayResult = activeReplayOfId
        ? {
            latest: latestReplayPerformance,
            previousBest: currentReplayBest ?? latestReplayPerformance,
          }
        : null;
      launchCompletionConfetti(completedBoard);
      playSound('complete');
      setIsCompletionImageVisible(true);
      showSolvedBoard();
      if (source === 'auto-play' || isAutoPlayCompletion) {
        cancelAutoPlay();
        setIsAutoPlayCompletion(true);
        setIsAutoPlaySolvedNoticeVisible(true);
        if (source === 'auto-play') {
          trackAnonymousEvent('auto_play_completed', analyticsMetadata);
        }
        return;
      }

      trackAnonymousEvent('level_completed', analyticsMetadata);

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
          if (completedReplayResult) {
            setCurrentReplayBest({
              moves: Math.min(
                completedReplayResult.previousBest.moves,
                completedReplayResult.latest.moves,
              ),
              timeSeconds: Math.min(
                completedReplayResult.previousBest.timeSeconds,
                completedReplayResult.latest.timeSeconds,
              ),
            });
            setIsCelebrating(false);
            setReplayResult(completedReplayResult);
            levelAdvanceTimeoutRef.current = null;
            return;
          }

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
          clearBoardHint();
          levelAdvanceTimeoutRef.current = null;
        }, LEVEL_COMPLETE_ADVANCE_DELAY_MS);
      }, LEVEL_COMPLETE_CELEBRATION_DELAY_MS);
    },
    [
      activeReplayOfId,
      attemptStartBoard,
      clearBoardHint,
      completeClock,
      currentReplayBest,
      exitReplayMode,
      isAutoPlayCompletion,
      isSignedIn,
      launchCompletionConfetti,
      playSound,
      resetClock,
      showSolvedBoard,
      getAnalyticsMetadata,
      trackAnonymousEvent,
    ],
  );

  const moveTile = useCallback(
    (slot: Slot, source: 'auto-play' | 'player' = 'player') => {
      const isAutoPlayMove = source === 'auto-play';

      if (
        isCelebrating ||
        isShuffleAnimationRunning ||
        (isAutoPlayRunningRef.current && !isAutoPlayMove)
      ) {
        return;
      }

      const currentBoard = isAutoPlayMove ? boardRef.current : board;
      const nextBoard = moveBoardTile(currentBoard, slot, {
        countMove: !isAutoPlayMove,
      });
      boardRef.current = nextBoard;
      setBoard(nextBoard);

      if (nextBoard !== currentBoard) {
        const effectiveLevelStartedAtMs = isAutoPlayMove
          ? Date.now()
          : startClockForValidMove();
        const currentElapsedTimeMs = Math.max(
          0,
          Date.now() - effectiveLevelStartedAtMs,
        );
        if (!isAutoPlayMove) {
          trackAnonymousEvent(
            'move_made',
            getAnalyticsMetadata(nextBoard, currentElapsedTimeMs),
          );
        } else {
          setAutoPlayMoveCount((count) => count + 1);
        }
        playSound('move');

        if (isTileGridInOrder(nextBoard.tileGrid)) {
          completeLevel(nextBoard, effectiveLevelStartedAtMs, source);
        }
      }
    },
    [
      board,
      cancelAutoPlay,
      completeLevel,
      isCelebrating,
      isShuffleAnimationRunning,
      getAnalyticsMetadata,
      playSound,
      startClockForValidMove,
      trackAnonymousEvent,
    ],
  );

  const runNextAutoPlayMove = useCallback(() => {
    if (!isAutoPlayRunningRef.current) {
      return;
    }

    const nextSlot = autoPlayMovesRef.current[autoPlayStepRef.current];

    if (!nextSlot) {
      cancelAutoPlay();
      return;
    }

    autoPlayStepRef.current += 1;
    moveTile(nextSlot, 'auto-play');

    if (autoPlayStepRef.current >= autoPlayMovesRef.current.length) {
      autoPlayTimeoutRef.current = null;
      cancelAutoPlay();
      return;
    }

    autoPlayTimeoutRef.current = window.setTimeout(
      runNextAutoPlayMove,
      autoPlayStepDelayRef.current,
    );
  }, [cancelAutoPlay, moveTile]);

  const updateAutoPlaySpeed = useCallback((delayMs: number) => {
    const nextDelay = Math.min(
      AUTO_PLAY_SLOWEST_STEP_DELAY_MS,
      Math.max(AUTO_PLAY_FASTEST_STEP_DELAY_MS, Math.trunc(delayMs)),
    );

    autoPlayStepDelayRef.current = nextDelay;
    setAutoPlayStepDelayMs(nextDelay);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlayRunningRef.current) {
      cancelAutoPlay();
      return;
    }

    if (
      activeReplayOfId ||
      isCelebrating ||
      isShuffleAnimationRunning ||
      replayResult
    ) {
      return;
    }

    const solution = solveSlidingTilesBoard(boardRef.current);

    if (solution.status !== 'solved') {
      if (solution.status === 'already-solved') {
        showSolvedBoard();
      } else {
        setAutoPlayStatusMessage(
          `${solution.reason} Try reset or shuffle to start from a clean board.`,
        );
        playSound('invalid');
      }
      return;
    }

    clearBoardHint();
    setAutoPlayStatusMessage(null);
    if (!isAutoPlayCompletion) {
      autoPlayElapsedMsRef.current = 0;
      setAutoPlayElapsedMs(0);
      setAutoPlayMoveCount(0);
    }
    setIsAutoPlayCompletion(true);
    autoPlayMovesRef.current = solution.moves;
    autoPlayStepRef.current = 0;
    isAutoPlayRunningRef.current = true;
    autoPlayStartedAtRef.current = Date.now();
    setIsAutoPlayRunning(true);
    trackAnonymousEvent('auto_play_started', getAnalyticsMetadata());
    autoPlayTimeoutRef.current = window.setTimeout(runNextAutoPlayMove, 0);
  }, [
    activeReplayOfId,
    cancelAutoPlay,
    clearBoardHint,
    getAnalyticsMetadata,
    isCelebrating,
    isShuffleAnimationRunning,
    playSound,
    replayResult,
    runNextAutoPlayMove,
    showSolvedBoard,
    trackAnonymousEvent,
  ]);

  const [columns, rows] = board.dimensions;

  useEffect(() => {
    return () => {
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
      if (autoPlayTimeoutRef.current !== null) {
        window.clearTimeout(autoPlayTimeoutRef.current);
      }
      shuffleInProgressRef.current = false;
      isAutoPlayRunningRef.current = false;
    };
  }, [clearEntryMotionSoundTimers]);

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

      cancelAutoPlay();
      setIsAutoPlayCompletion(false);
      setIsAutoPlaySolvedNoticeVisible(false);
      setAutoPlayStatusMessage(null);
      autoPlayElapsedMsRef.current = 0;
      autoPlayStartedAtRef.current = null;
      setAutoPlayElapsedMs(0);
      setAutoPlayMoveCount(0);
      if (board.moves > 0) {
        trackAnonymousEvent('level_abandoned', getAnalyticsMetadata());
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
      prepareClockForBoardChange();
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
      board,
      clearBoardHint,
      exitReplayMode,
      highestReachedLevel,
      isShuffleAnimationRunning,
      getAnalyticsMetadata,
      playSound,
      prepareClockForBoardChange,
      resetClock,
      scheduleLockInSound,
      trackAnonymousEvent,
      cancelAutoPlay,
    ],
  );

  const refreshBoard = useCallback(
    (createNextBoard: () => BoardState, exitReplay: boolean) => {
      if (shuffleInProgressRef.current || isShuffleAnimationRunning) {
        return;
      }

      cancelAutoPlay();
      setIsAutoPlayCompletion(false);
      setIsAutoPlaySolvedNoticeVisible(false);
      setAutoPlayStatusMessage(null);
      autoPlayElapsedMsRef.current = 0;
      autoPlayStartedAtRef.current = null;
      setAutoPlayElapsedMs(0);
      setAutoPlayMoveCount(0);
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
      prepareClockForBoardChange();
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
      prepareClockForBoardChange,
      resetClock,
      scheduleLockInSound,
      cancelAutoPlay,
    ],
  );

  const resetLevel = useCallback(() => {
    trackAnonymousEvent('reset_level_clicked', getAnalyticsMetadata());
    cancelAutoPlay();
    setIsAutoPlayCompletion(false);
    setIsAutoPlaySolvedNoticeVisible(false);
    setAutoPlayStatusMessage(null);
    autoPlayElapsedMsRef.current = 0;
    autoPlayStartedAtRef.current = null;
    setAutoPlayElapsedMs(0);
    setAutoPlayMoveCount(0);
    if (board.moves > 0) {
      trackAnonymousEvent('level_abandoned', getAnalyticsMetadata());
    }
    refreshBoard(() => resetBoardAttempt(attemptStartBoard), false);
  }, [
    attemptStartBoard,
    board.moves,
    cancelAutoPlay,
    getAnalyticsMetadata,
    refreshBoard,
    trackAnonymousEvent,
  ]);

  const shuffleLevel = useCallback(() => {
    cancelAutoPlay();
    setIsAutoPlayCompletion(false);
    setIsAutoPlaySolvedNoticeVisible(false);
    setAutoPlayStatusMessage(null);
    autoPlayElapsedMsRef.current = 0;
    autoPlayStartedAtRef.current = null;
    setAutoPlayElapsedMs(0);
    setAutoPlayMoveCount(0);
    if (board.moves > 0) {
      trackAnonymousEvent('level_abandoned', getAnalyticsMetadata());
    }
    refreshBoard(() => createBoardState(board.level, board.dimensions), true);
  }, [
    board.dimensions,
    board.level,
    board.moves,
    cancelAutoPlay,
    getAnalyticsMetadata,
    refreshBoard,
    trackAnonymousEvent,
  ]);
  const replayAgain = useCallback(() => {
    cancelAutoPlay();
    setIsAutoPlayCompletion(false);
    setIsAutoPlaySolvedNoticeVisible(false);
    setAutoPlayStatusMessage(null);
    autoPlayElapsedMsRef.current = 0;
    autoPlayStartedAtRef.current = null;
    setAutoPlayElapsedMs(0);
    setAutoPlayMoveCount(0);
    setReplayResult(null);
    refreshBoard(() => resetBoardAttempt(attemptStartBoard), false);
  }, [attemptStartBoard, cancelAutoPlay, refreshBoard]);
  const continueProgress = useCallback(() => {
    cancelAutoPlay();
    setIsAutoPlayCompletion(false);
    setIsAutoPlaySolvedNoticeVisible(false);
    setAutoPlayStatusMessage(null);
    autoPlayElapsedMsRef.current = 0;
    autoPlayStartedAtRef.current = null;
    setAutoPlayElapsedMs(0);
    setAutoPlayMoveCount(0);
    setReplayResult(null);
    exitReplayMode();
    refreshBoard(
      () =>
        createBoardState(
          highestReachedLevel,
          getDimensionsForLevel(highestReachedLevel),
        ),
      false,
    );
  }, [cancelAutoPlay, exitReplayMode, highestReachedLevel, refreshBoard]);

  const gameModeLabel = activeReplayOfId
    ? 'Replay run'
    : isSignedIn
      ? 'Saved run'
      : 'Anonymous run';
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
  const trackSignupClick = useCallback(() => {
    trackAnonymousEvent('signup_clicked', getAnalyticsMetadata(), {
      immediate: true,
    });
  }, [getAnalyticsMetadata, trackAnonymousEvent]);

  useGameKeyboardControls({
    board,
    isInteractionBlocked:
      isCelebrating ||
      isShuffleAnimationRunning ||
      isAutoPlayRunning ||
      Boolean(replayResult),
    movableSlotKeys,
    onMove: moveTile,
    onReset: resetLevel,
    onShuffle: shuffleLevel,
    onToggleFullscreen: toggleBoardFullscreen,
  });

  return (
    <div className="play-shell-reveal grid min-h-full w-full grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[900px]:grid-cols-1">
      <GameStage
        board={board}
        boardEntryAnimationKey={boardEntryAnimationKey}
        boardFrameRef={boardFrameRef}
        columns={columns}
        confettiBurstKey={confettiBurstKey}
        continueLevel={highestReachedLevel}
        elapsedTimeLabel={elapsedTimeLabel}
        hintedSlot={hintedSlot}
        isBoardEntering={isBoardEntering}
        isBoardFullscreen={isBoardFullscreen}
        isCelebrating={isCelebrating}
        isCompletionImageVisible={isCompletionImageVisible}
        isFocusPaused={isFocusPaused}
        isMuted={isMuted}
        isAutoPlayActive={isAutoPlayRunning}
        isAutoPlayBlocked={
          Boolean(activeReplayOfId) ||
          isCelebrating ||
          isShuffleAnimationRunning ||
          Boolean(replayResult)
        }
        isAutoPlaySolvedNoticeVisible={isAutoPlaySolvedNoticeVisible}
        autoPlaySpeed={{
          delayMs: autoPlayStepDelayMs,
          fastestDelayMs: AUTO_PLAY_FASTEST_STEP_DELAY_MS,
          slowestDelayMs: AUTO_PLAY_SLOWEST_STEP_DELAY_MS,
        }}
        autoPlayStats={{
          elapsedMs: autoPlayElapsedMs,
          moves: autoPlayMoveCount,
        }}
        autoPlayStatusMessage={autoPlayStatusMessage}
        isResetting={isResetting}
        isShowingHintPlaceholder={isShowingHintPlaceholder}
        isShowingSolvedHint={isShowingSolvedHint}
        isShuffleAnimationRunning={isShuffleAnimationRunning}
        isSoundEnabled={isSoundEnabled}
        movableSlotKeys={movableSlotKeys}
        onAutoPlayToggle={toggleAutoPlay}
        onAutoPlaySpeedChange={updateAutoPlaySpeed}
        onBoardPointerDown={startBoardHint}
        onBoardPointerLeave={clearBoardHintFromPointer}
        onBoardPointerUp={clearBoardHintFromPointer}
        onContinueReplay={continueProgress}
        onHint={setHintedSlot}
        onInvalidMove={() => playSound('invalid')}
        onMove={moveTile}
        onOpenDetails={openInfoModal}
        onPeekCancel={stopPeekButtonPreview}
        onPeekDown={startPeekButtonPreview}
        onPeekLeave={stopPeekButtonPreview}
        onPeekUp={stopPeekButtonPreview}
        onReset={resetLevel}
        onReplayAgain={replayAgain}
        onShuffle={shuffleLevel}
        onToggleFullscreen={() => void toggleBoardFullscreen()}
        onToggleMuted={toggleMuted}
        replayResult={replayResult}
        rows={rows}
        suppressNextClickRef={suppressNextClickRef}
        tileRotationSeed={tileRotationSeed}
      />

      <ResponsiveGameInfoPanel
        columns={columns}
        gameModeLabel={gameModeLabel}
        highestReachedLevel={highestReachedLevel}
        isLevelSelectDisabled={
          isShuffleAnimationRunning ||
          isCelebrating ||
          isAutoPlayRunning ||
          isAutoPlaySolvedNoticeVisible ||
          Boolean(replayResult)
        }
        isModalOpen={isInfoModalOpen}
        isModalRendered={isInfoModalRendered}
        isSignedIn={isSignedIn}
        level={board.level}
        onCloseModal={closeInfoModal}
        onSignupClick={trackSignupClick}
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
  initialHighestReachedLevel: progressionLevel,
  isSignedIn,
  playerAvatarUrl,
  playerName,
  replayBest,
  replayOfId,
  soundEnabled = true,
}: GameBoardProps) {
  const {
    activeInitialBoard,
    initialAttemptStartBoard,
    initialHighestReachedLevel,
    initialTimerStatus,
    isReady,
  } = useInitialGameState({
    initialBoard,
    initialHighestReachedLevel: progressionLevel,
    isSignedIn,
    replayOfId,
  });

  if (!isReady) {
    return (
      <div
        aria-label="Loading saved game"
        className="grid min-h-[calc(100svh-32px)] w-full place-items-center rounded-lg bg-night text-sm font-bold text-surface"
        role="status"
      >
        Loading game...
      </div>
    );
  }

  return (
    <SoundProvider enabled={soundEnabled}>
      <GameBoardContent
        initialAttemptStartBoard={initialAttemptStartBoard}
        initialBoard={activeInitialBoard}
        initialHighestReachedLevel={initialHighestReachedLevel}
        initialTimerStatus={initialTimerStatus}
        isSignedIn={isSignedIn}
        playerAvatarUrl={playerAvatarUrl}
        playerName={playerName}
        replayBest={replayBest}
        replayOfId={replayOfId}
      />
    </SoundProvider>
  );
}
