'use client';

import { useEffect } from 'react';

import { saveGameState } from '@/app/actions/game';
import {
  ANONYMOUS_GAME_STORAGE_KEY,
  serializeAnonymousGameProgress,
  type AnonymousTimerStatus,
} from '@/lib/anonymousGameStorage';
import { BoardState, isTileGridInOrder } from '@/lib/board';

export const HIGHEST_REACHED_LEVEL_STORAGE_KEY =
  'sliding-tiles:highest-reached-level';

const LEGACY_ANONYMOUS_GAME_STORAGE_KEY = 'sliding-tiles:anonymous-board';

type GamePersistenceOptions = {
  activeReplayOfId: string | null;
  attemptStartBoard: BoardState;
  board: BoardState;
  elapsedTimeMs: number;
  highestReachedLevel: number;
  isGameComplete: boolean;
  isSignedIn: boolean;
  timerStatus: AnonymousTimerStatus;
};

export function useGamePersistence({
  activeReplayOfId,
  attemptStartBoard,
  board,
  elapsedTimeMs,
  highestReachedLevel,
  isGameComplete,
  isSignedIn,
  timerStatus,
}: GamePersistenceOptions) {
  useEffect(() => {
    if (isSignedIn) {
      return;
    }

    const storedHighestReachedLevel = Number.parseInt(
      window.localStorage.getItem(HIGHEST_REACHED_LEVEL_STORAGE_KEY) ?? '',
      10,
    );

    window.localStorage.setItem(
      HIGHEST_REACHED_LEVEL_STORAGE_KEY,
      String(
        Math.max(
          highestReachedLevel,
          Number.isFinite(storedHighestReachedLevel)
            ? storedHighestReachedLevel
            : 1,
        ),
      ),
    );
  }, [highestReachedLevel, isSignedIn]);

  useEffect(() => {
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

      if (isGameComplete || isTileGridInOrder(board.tileGrid)) {
        window.localStorage.removeItem(ANONYMOUS_GAME_STORAGE_KEY);
        return;
      }

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
    elapsedTimeMs,
    highestReachedLevel,
    isGameComplete,
    isSignedIn,
    timerStatus,
  ]);
}
