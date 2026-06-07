'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { AnonymousTimerStatus } from '@/lib/anonymousGameStorage';
import type { BoardState } from '@/lib/board';

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
  const [isGameComplete, setIsGameComplete] = useState(false);
  const isClockRunningRef = useRef(isClockRunning);
  const isGameCompleteRef = useRef(false);

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

  const resetClock = useCallback(() => {
    const levelStart = Date.now();
    setLevelStartedAtMs(levelStart);
    setClockNowMs(levelStart);
    setIsClockRunning(false);
    setIsFocusPaused(false);
    setIsGameComplete(false);
    isClockRunningRef.current = false;
    isGameCompleteRef.current = false;
  }, []);

  const prepareClockForBoardChange = useCallback(() => {
    setIsClockRunning(false);
    setIsFocusPaused(false);
    setIsGameComplete(false);
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

  const completeClock = useCallback((effectiveLevelStartedAtMs: number) => {
    const completedAtMs = Date.now();
    const elapsedTimeMs = Math.max(
      0,
      completedAtMs - effectiveLevelStartedAtMs,
    );

    isGameCompleteRef.current = true;
    isClockRunningRef.current = false;
    setClockNowMs(completedAtMs);
    setIsClockRunning(false);
    setIsFocusPaused(false);
    setIsGameComplete(true);

    return elapsedTimeMs;
  }, []);

  const elapsedTimeMs = Math.max(0, clockNowMs - levelStartedAtMs);
  const timerStatus: AnonymousTimerStatus = isFocusPaused
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
    levelStartedAtMs,
    prepareClockForBoardChange,
    resetClock,
    startClockForValidMove,
    timerStatus,
  };
}
