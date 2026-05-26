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
    <section className="page-rail-wide mx-auto grid min-h-[calc(100svh-154px)] py-4">
      <GameBoard initialBoard={initialBoard} isSignedIn={Boolean(session)} />
    </section>
  );
}
