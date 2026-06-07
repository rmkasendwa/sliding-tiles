'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  ANONYMOUS_GAME_STORAGE_KEY,
  parseAnonymousGameProgress,
} from '@/lib/anonymousGameStorage';
import type { BoardState } from '@/lib/board';

import { HIGHEST_REACHED_LEVEL_STORAGE_KEY } from './useGamePersistence';

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

export function useInitialGameState({
  initialBoard,
  isSignedIn,
  replayOfId,
}: {
  initialBoard: BoardState;
  isSignedIn: boolean;
  replayOfId?: string | null;
}) {
  const isReady = useSyncExternalStore(
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
  const activeInitialBoard = restoredProgress?.board ?? initialBoard;

  return {
    activeInitialBoard,
    initialAttemptStartBoard: restoredProgress?.attemptStartBoard,
    initialHighestReachedLevel: Math.max(
      activeInitialBoard.level,
      restoredProgress?.highestReachedLevel ?? 1,
      storedHighestReachedLevel ?? 1,
    ),
    initialTimerStatus: restoredProgress?.timerStatus,
    isReady,
  };
}
