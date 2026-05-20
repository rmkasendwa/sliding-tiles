'use server';

import { revalidatePath } from 'next/cache';

import { Prisma } from '@/app/generated/prisma';
import { BoardState } from '@/lib/board';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function saveGameState(board: BoardState) {
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }

  await prisma.gameState.upsert({
    where: { userId: session.id },
    update: {
      level: board.level,
      board: board as unknown as Prisma.InputJsonValue,
      moves: board.moves,
      startedAt: new Date(board.startedAt),
    },
    create: {
      userId: session.id,
      level: board.level,
      board: board as unknown as Prisma.InputJsonValue,
      moves: board.moves,
      startedAt: new Date(board.startedAt),
    },
  });

  revalidatePath('/profile');

  return { ok: true };
}

export async function recordCompletedLevel(board: BoardState) {
  const session = await getSession();
  if (!session) {
    return { ok: false };
  }

  const timeSeconds = Math.max(
    1,
    Math.round((Date.now() - new Date(board.startedAt).getTime()) / 1000)
  );

  await prisma.leaderboard.create({
    data: {
      userId: session.id,
      level: board.level,
      moves: board.moves,
      timeSeconds,
    },
  });

  revalidatePath('/leaderboard');
  revalidatePath('/profile');

  return { ok: true };
}
