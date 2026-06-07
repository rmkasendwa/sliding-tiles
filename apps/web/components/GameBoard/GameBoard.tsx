'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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

import { SoundProvider, useSound } from '../SoundProvider';
import {
  LEVEL_COMPLETE_ADVANCE_DELAY_MS,
  LEVEL_COMPLETE_CELEBRATION_DELAY_MS,
  LEVEL_COMPLETE_CONFETTI_DURATION_MS,
  RESET_GATHER_DELAY_MS,
  TILE_ENTRY_ANIMATION_MS,
  TILE_ENTRY_LOCK_IN_DELAY_MS,
} from './constants';
import { GameStage } from './GameStage';
import { ResponsiveGameInfoPanel } from './ResponsiveGameInfoPanel';
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
  replayOfId,
}: GameBoardProps & {
  initialAttemptStartBoard?: BoardState;
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
  const [attemptStartBoard, setAttemptStartBoard] = useState<BoardState>(() =>
    initialAttemptStartBoard ??
    resetBoardAttempt(initialBoard, initialBoard.startedAt),
  );
  const [activeReplayOfId, setActiveReplayOfId] = useState<string | null>(
    replayOfId ?? null,
  );
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [boardEntryAnimationKey, setBoardEntryAnimationKey] = useState(0);
  const [isBoardEntering, setIsBoardEntering] = useState(true);
  const [tileRotationSeed, setTileRotationSeed] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [isShuffleInProgress, setIsShuffleInProgress] = useState(false);
  const isShuffleAnimationRunning = isResetting || isShuffleInProgress;
  const playHintSound = useCallback(() => playSound('hint'), [playSound]);
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
    isInteractionBlocked: isCelebrating || isShuffleAnimationRunning,
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
  const shuffleInProgressRef = useRef(false);
  const hasPlayedInitialEntrySoundRef = useRef(false);
  const exitReplayMode = useCallback(() => {
    window.history.replaceState(window.history.state, '', '/play');
    setActiveReplayOfId(null);
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

  useGamePersistence({
    activeReplayOfId,
    attemptStartBoard,
    board,
    elapsedTimeMs,
    highestReachedLevel,
    isGameComplete,
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

  const completeLevel = useCallback(
    (completedBoard: BoardState, effectiveLevelStartedAtMs: number) => {
      const completedElapsedTimeMs = completeClock(
        effectiveLevelStartedAtMs,
      );
      launchCompletionConfetti(completedBoard);
      playSound('complete');
      setIsCompletionImageVisible(true);
      showSolvedBoard();
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
      exitReplayMode,
      isSignedIn,
      launchCompletionConfetti,
      playSound,
      resetClock,
      showSolvedBoard,
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
      shuffleInProgressRef.current = false;
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
      board.level,
      clearBoardHint,
      exitReplayMode,
      highestReachedLevel,
      isShuffleAnimationRunning,
      playSound,
      prepareClockForBoardChange,
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

  useGameKeyboardControls({
    board,
    isInteractionBlocked: isCelebrating || isShuffleAnimationRunning,
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
        elapsedTimeLabel={elapsedTimeLabel}
        hintedSlot={hintedSlot}
        isBoardEntering={isBoardEntering}
        isBoardFullscreen={isBoardFullscreen}
        isCelebrating={isCelebrating}
        isCompletionImageVisible={isCompletionImageVisible}
        isFocusPaused={isFocusPaused}
        isMuted={isMuted}
        isResetting={isResetting}
        isShowingHintPlaceholder={isShowingHintPlaceholder}
        isShowingSolvedHint={isShowingSolvedHint}
        isShuffleAnimationRunning={isShuffleAnimationRunning}
        isSoundEnabled={isSoundEnabled}
        movableSlotKeys={movableSlotKeys}
        onBoardPointerDown={startBoardHint}
        onBoardPointerLeave={clearBoardHintFromPointer}
        onBoardPointerUp={clearBoardHintFromPointer}
        onHint={setHintedSlot}
        onInvalidMove={() => playSound('invalid')}
        onMove={moveTile}
        onOpenDetails={openInfoModal}
        onPeekCancel={stopPeekButtonPreview}
        onPeekDown={startPeekButtonPreview}
        onPeekLeave={stopPeekButtonPreview}
        onPeekUp={stopPeekButtonPreview}
        onReset={resetLevel}
        onShuffle={shuffleLevel}
        onToggleFullscreen={() => void toggleBoardFullscreen()}
        onToggleMuted={toggleMuted}
        rows={rows}
        suppressNextClickRef={suppressNextClickRef}
        tileRotationSeed={tileRotationSeed}
      />

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
  initialHighestReachedLevel: progressionLevel,
  isSignedIn,
  playerAvatarUrl,
  playerName,
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
        className="grid min-h-[calc(100svh-36px)] w-full place-items-center rounded-lg bg-night text-sm font-bold text-surface"
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
        replayOfId={replayOfId}
      />
    </SoundProvider>
  );
}
