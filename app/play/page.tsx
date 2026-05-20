import { GameBoard } from '@/components/game-board';
import { BoardState } from '@/lib/board';
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

  return (
    <section className="shell page grid-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Puzzle board</p>
          <h1>Play</h1>
        </div>
      </div>
      <GameBoard
        initialBoard={(savedState?.board as BoardState | undefined) ?? null}
        isSignedIn={Boolean(session)}
      />
    </section>
  );
}
