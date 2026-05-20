import { GameBoard } from '@/components/game-board';
import { BoardState, createBoardState } from '@/lib/board';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function PlayPage() {
  const session = await getSession();
  const savedState = session
    ? await prisma.gameState.findUnique({
        where: { userId: session.id },
        select: { board: true },
      })
    : null;
  const initialBoard =
    (savedState?.board as BoardState | undefined) ?? createBoardState();

  return (
    <section className="shell page grid-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Puzzle board</p>
          <h1>Play</h1>
        </div>
      </div>
      <GameBoard initialBoard={initialBoard} isSignedIn={Boolean(session)} />
    </section>
  );
}
