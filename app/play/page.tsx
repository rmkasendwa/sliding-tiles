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
    <section className="mx-auto grid w-[min(1180px,calc(100%_-_32px))] gap-6 py-11 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Puzzle board
          </p>
          <h1 className="text-[clamp(2.4rem,7vw,5.7rem)] leading-[0.94]">
            Play
          </h1>
        </div>
      </div>
      <GameBoard initialBoard={initialBoard} isSignedIn={Boolean(session)} />
    </section>
  );
}
