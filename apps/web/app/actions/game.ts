'use server';

import { revalidatePath } from 'next/cache';

import { apiRequest } from '@/lib/api';
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
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }

  await apiRequest('/leaderboard/completions', {
    body: { board },
    method: 'POST',
  });

  revalidatePath('/leaderboard');
  revalidatePath('/profile');

  return { ok: true };
}
