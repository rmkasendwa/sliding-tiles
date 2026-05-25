import { NextResponse } from 'next/server';

import { ApiGameState, apiRequest } from '@/lib/api';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ gameState: null }, { status: 401 });
  }

  const { gameState } = await apiRequest<{ gameState: ApiGameState | null }>(
    '/game-state',
  );

  return NextResponse.json({ gameState: gameState?.board ?? null });
}
