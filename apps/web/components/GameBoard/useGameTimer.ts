'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { AnonymousTimerStatus } from '@/lib/anonymousGameStorage';
import type { BoardState } from '@/lib/board';

import {
  IDLE_PAUSE_DELAY_MS,
  getActiveStartForResume,
  getIdlePausedSnapshot,
  getTimerSnapshot,
  type RunningTimerState,
} from './gameTiming';

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

export function useGameTimer(
  initialBoard: BoardState,
  initialTimerStatus?: AnonymousTimerStatus,
) {
  const [sessionStartedAtMs, setSessionStartedAtMs] = useState(() => {
    const initialTotalElapsed = Math.max(
      0,
      initialBoard.totalElapsedTimeMs ?? initialBoard.elapsedTimeMs ?? 0,
    );
    return Date.now() - initialTotalElapsed;
  });
  const [activeStartedAtMs, setActiveStartedAtMs] = useState(() => {
    const now = Date.now();
    const initialElapsed = Math.max(0, initialBoard.elapsedTimeMs ?? 0);
    const initialPaused = Math.max(0, initialBoard.pausedDurationMs ?? 0);
    return now - initialElapsed - initialPaused;
  });
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [pausedDurationMs, setPausedDurationMs] = useState(
    () => Math.max(0, initialBoard.pausedDurationMs ?? 0),
  );
  const [isClockRunning, setIsClockRunning] = useState(
    () =>
      initialTimerStatus === 'running' ||
      (initialTimerStatus === undefined && initialBoard.moves > 0),
  );
  const [isFocusPaused, setIsFocusPaused] = useState(
    initialTimerStatus === 'paused',
  );
  const [isIdlePaused, setIsIdlePaused] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const activeStartedAtMsRef = useRef(activeStartedAtMs);
  const idlePauseTimeoutRef = useRef<number | null>(null);
  const isClockRunningRef = useRef(isClockRunning);
  const isGameCompleteRef = useRef(false);
  const pausedDurationMsRef = useRef(pausedDurationMs);
  const sessionStartedAtMsRef = useRef(sessionStartedAtMs);

  const clearIdlePauseTimeout = useCallback(() => {
    if (idlePauseTimeoutRef.current !== null) {
      window.clearTimeout(idlePauseTimeoutRef.current);
      idlePauseTimeoutRef.current = null;
    }
  }, []);

  const pauseClockForIdle = useCallback(
    (idleStartedAtMs: number) => {
      if (!isClockRunningRef.current || isGameCompleteRef.current) {
        return;
      }

      const pausedAtMs = Date.now();
      const snapshot = getIdlePausedSnapshot({
        idleStartedAtMs,
        nowMs: pausedAtMs,
        state: {
          activeStartedAtMs: activeStartedAtMsRef.current,
          pausedDurationMs: pausedDurationMsRef.current,
          sessionStartedAtMs: sessionStartedAtMsRef.current,
        },
      });

      pausedDurationMsRef.current = snapshot.pausedDurationMs;
      isClockRunningRef.current = false;
      setClockNowMs(pausedAtMs);
      setPausedDurationMs(snapshot.pausedDurationMs);
      setIsClockRunning(false);
      setIsFocusPaused(false);
      setIsIdlePaused(true);
    },
    [],
  );

  const scheduleIdlePause = useCallback(() => {
    clearIdlePauseTimeout();

    if (!isClockRunningRef.current || isGameCompleteRef.current) {
      return;
    }

    const idleStartedAtMs = Date.now();
    idlePauseTimeoutRef.current = window.setTimeout(() => {
      idlePauseTimeoutRef.current = null;
      pauseClockForIdle(idleStartedAtMs);
    }, IDLE_PAUSE_DELAY_MS);
  }, [clearIdlePauseTimeout, pauseClockForIdle]);

  useEffect(() => {
    if (!isClockRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isClockRunning]);

  useEffect(() => {
    activeStartedAtMsRef.current = activeStartedAtMs;
  }, [activeStartedAtMs]);

  useEffect(() => {
    pausedDurationMsRef.current = pausedDurationMs;
  }, [pausedDurationMs]);

  useEffect(() => {
    sessionStartedAtMsRef.current = sessionStartedAtMs;
  }, [sessionStartedAtMs]);

  useEffect(() => {
    const pauseClockForFocusLoss = () => {
      if (!isClockRunningRef.current || isGameCompleteRef.current) {
        return;
      }

      clearIdlePauseTimeout();
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
  }, [clearIdlePauseTimeout]);

  useEffect(() => {
    return clearIdlePauseTimeout;
  }, [clearIdlePauseTimeout]);

  const resetClock = useCallback(() => {
    const levelStart = Date.now();
    clearIdlePauseTimeout();
    activeStartedAtMsRef.current = levelStart;
    pausedDurationMsRef.current = 0;
    sessionStartedAtMsRef.current = levelStart;
    setActiveStartedAtMs(levelStart);
    setClockNowMs(levelStart);
    setPausedDurationMs(0);
    setSessionStartedAtMs(levelStart);
    setIsClockRunning(false);
    setIsFocusPaused(false);
    setIsIdlePaused(false);
    setIsGameComplete(false);
    isClockRunningRef.current = false;
    isGameCompleteRef.current = false;
  }, [clearIdlePauseTimeout]);

  const prepareClockForBoardChange = useCallback(() => {
    clearIdlePauseTimeout();
    setIsClockRunning(false);
    setIsFocusPaused(false);
    setIsIdlePaused(false);
    setIsGameComplete(false);
    isClockRunningRef.current = false;
    isGameCompleteRef.current = false;
  }, [clearIdlePauseTimeout]);

  const startClockForValidMove = useCallback(() => {
    const moveTime = Date.now();
    if (isClockRunningRef.current) {
      scheduleIdlePause();
      return {
        activeStartedAtMs: activeStartedAtMsRef.current,
        pausedDurationMs: pausedDurationMsRef.current,
        sessionStartedAtMs: sessionStartedAtMsRef.current,
      };
    }

    const snapshot =
      isFocusPaused || isIdlePaused
        ? getTimerSnapshot(
            {
              activeStartedAtMs: activeStartedAtMsRef.current,
              pausedDurationMs: pausedDurationMsRef.current,
              sessionStartedAtMs: sessionStartedAtMsRef.current,
            },
            clockNowMs,
          )
        : {
            activeElapsedTimeMs: 0,
            pausedDurationMs: 0,
            totalElapsedTimeMs: 0,
          };
    const nextPausedDurationMs =
      snapshot.pausedDurationMs +
      (isFocusPaused || isIdlePaused ? Math.max(0, moveTime - clockNowMs) : 0);
    const activeStart = getActiveStartForResume({
      activeElapsedTimeMs: snapshot.activeElapsedTimeMs,
      nowMs: moveTime,
      pausedDurationMs: nextPausedDurationMs,
    });
    const sessionStart =
      isFocusPaused || isIdlePaused
        ? sessionStartedAtMsRef.current
        : moveTime;

    activeStartedAtMsRef.current = activeStart;
    pausedDurationMsRef.current = nextPausedDurationMs;
    sessionStartedAtMsRef.current = sessionStart;
    setActiveStartedAtMs(activeStart);
    setClockNowMs(moveTime);
    setPausedDurationMs(nextPausedDurationMs);
    setSessionStartedAtMs(sessionStart);
    setIsClockRunning(true);
    setIsFocusPaused(false);
    setIsIdlePaused(false);
    isClockRunningRef.current = true;
    scheduleIdlePause();

    return {
      activeStartedAtMs: activeStart,
      pausedDurationMs: nextPausedDurationMs,
      sessionStartedAtMs: sessionStart,
    };
  }, [clockNowMs, isFocusPaused, isIdlePaused, scheduleIdlePause]);

  const stopClockForAssistedPlay = useCallback(() => {
    clearIdlePauseTimeout();
    const stoppedAtMs = isFocusPaused ? clockNowMs : Date.now();

    isClockRunningRef.current = false;
    setClockNowMs(stoppedAtMs);
    setIsClockRunning(false);
    setIsFocusPaused(false);
    setIsIdlePaused(false);
  }, [clearIdlePauseTimeout, clockNowMs, isFocusPaused]);

  const completeClock = useCallback((effectiveTimerState: RunningTimerState) => {
    clearIdlePauseTimeout();
    const completedAtMs = Date.now();
    const snapshot = getTimerSnapshot(effectiveTimerState, completedAtMs);

    isGameCompleteRef.current = true;
    isClockRunningRef.current = false;
    setClockNowMs(completedAtMs);
    setIsClockRunning(false);
    setIsFocusPaused(false);
    setIsIdlePaused(false);
    setIsGameComplete(true);

    return snapshot;
  }, [clearIdlePauseTimeout]);

  const timerSnapshot = getTimerSnapshot(
    {
      activeStartedAtMs,
      pausedDurationMs,
      sessionStartedAtMs,
    },
    clockNowMs,
  );
  const elapsedTimeMs = timerSnapshot.activeElapsedTimeMs;
  const timerStatus: AnonymousTimerStatus = isFocusPaused || isIdlePaused
    ? 'paused'
    : isClockRunning
      ? 'running'
      : 'idle';

  return {
    clockNowMs,
    completeClock,
    elapsedTimeMs,
    elapsedTimeLabel: formatElapsedTime(elapsedTimeMs),
    isClockRunning,
    isFocusPaused,
    isGameComplete,
    isIdlePaused,
    pausedDurationMs: timerSnapshot.pausedDurationMs,
    prepareClockForBoardChange,
    resetClock,
    startClockForValidMove,
    stopClockForAssistedPlay,
    timerStatus,
    totalElapsedTimeMs: timerSnapshot.totalElapsedTimeMs,
    totalElapsedTimeLabel: formatElapsedTime(timerSnapshot.totalElapsedTimeMs),
  };
}
