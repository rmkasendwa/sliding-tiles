import { GameBoard } from '@/components/GameBoard';
import { ApiGameState, apiRequest } from '@/lib/api';
import { BoardState, createBoardState, normalizeBoardState } from '@/lib/board';
import { getSession } from '@/lib/session';

export default async function PlayPage() {
  const session = await getSession();
  const savedState = session
    ? await apiRequest<{ gameState: ApiGameState | null }>('/game-state')
    : null;
  const initialBoard = normalizeBoardState(
    (savedState?.gameState?.board as BoardState | undefined) ??
      createBoardState(),
  );

  return (
    <section className="page-rail-wide mx-auto grid min-h-svh py-4">
      <GameBoard
        initialBoard={initialBoard}
        isSignedIn={Boolean(session)}
        playerAvatarUrl={session?.avatarUrl}
        playerName={session?.name}
      />
    </section>
  );
}
