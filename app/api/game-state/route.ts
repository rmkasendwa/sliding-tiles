import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ gameState: null }, { status: 401 });
  }

  const gameState = await prisma.gameState.findUnique({
    where: { userId: session.id },
  });

  return NextResponse.json({ gameState: gameState?.board ?? null });
}
