import { GameBoard } from '@/components/GameBoard';
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
    <section className="mx-auto grid min-h-[calc(100svh-154px)] w-[min(1600px,calc(100%-40px))] py-4">
      <GameBoard initialBoard={initialBoard} isSignedIn={Boolean(session)} />
    </section>
  );
}
