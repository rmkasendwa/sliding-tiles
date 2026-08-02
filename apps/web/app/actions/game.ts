'use server';

import { revalidatePath } from 'next/cache';

import {
  ApiCompletionResponse,
  ApiDailyChallengeCompletionResponse,
  apiRequest,
} from '@/lib/api';
import { BoardState } from '@/lib/board';
import { getSession } from '@/lib/session';

export async function saveGameState(board: BoardState) {
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }

  await apiRequest('/game-state', {
    body: { board },
    method: 'PUT',
  });

  revalidatePath('/profile');

  return { ok: true };
}

export async function recordCompletedLevel(board: BoardState) {
  return recordLevelAttempt({ board });
}

export async function recordLevelAttempt({
  attemptType = 'original',
  board,
  puzzleConfig,
  replayOfId,
}: {
  attemptType?: 'original' | 'replay';
  board: BoardState;
  puzzleConfig?: BoardState;
  replayOfId?: string | null;
}) {
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }

  const result = await apiRequest<ApiCompletionResponse>(
    '/leaderboard/completions',
    {
      body: {
        attemptType,
        board,
        puzzleConfig,
        replayOfId: replayOfId ?? undefined,
      },
      method: 'POST',
    },
  );

  revalidatePath('/leaderboard');
  revalidatePath('/profile');

  return { ok: true, personalBest: result.personalBest };
}

export async function recordDailyChallengeAttempt({
  board,
  challengeDate,
  puzzleConfig,
}: {
  board: BoardState;
  challengeDate: string;
  puzzleConfig?: BoardState;
}) {
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }

  const result = await apiRequest<ApiDailyChallengeCompletionResponse>(
    '/leaderboard/daily/completions',
    {
      body: {
        board,
        challengeDate,
        puzzleConfig,
      },
      method: 'POST',
    },
  );

  return { ok: true, rank: result.rank, totalCount: result.totalCount };
}
