'use server';

import { revalidatePath } from 'next/cache';

import {
  ApiCompletionResponse,
  ApiDailyChallengeCompletionResponse,
  ApiDailyChallengeResponse,
  apiRequest,
} from '@/lib/api';
import { BoardState } from '@/lib/board';
import { getSession } from '@/lib/session';

type LocalCompletion = {
  localDate: string;
  timeZone?: string;
};

function getServerCompletionFallback(): LocalCompletion {
  const now = new Date();

  return {
    localDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

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
  completion,
  puzzleConfig,
  replayOfId,
}: {
  attemptType?: 'original' | 'replay';
  board: BoardState;
  completion?: LocalCompletion;
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
        completion: completion ?? getServerCompletionFallback(),
        puzzleConfig,
        replayOfId: replayOfId ?? undefined,
      },
      method: 'POST',
    },
  );

  revalidatePath('/leaderboard');
  revalidatePath('/profile');

  return {
    achievements: result.achievements,
    ok: true,
    personalBest: result.personalBest,
    streak: result.streak,
  };
}

export async function recordDailyChallengeAttempt({
  board,
  challengeDate,
  completion,
  puzzleConfig,
}: {
  board: BoardState;
  challengeDate: string;
  completion?: LocalCompletion;
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
        completion: completion ?? getServerCompletionFallback(),
        puzzleConfig,
      },
      method: 'POST',
    },
  );

  return {
    ok: true,
    rank: result.rank,
    streak: result.streak,
    totalCount: result.totalCount,
  };
}

export async function listDailyChallengeRankings({
  challengeDate,
}: {
  challengeDate: string;
}) {
  const result = await apiRequest<ApiDailyChallengeResponse>(
    `/leaderboard/daily?date=${encodeURIComponent(challengeDate)}&take=50`,
    { token: null },
  );

  return result.scores;
}
