import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [gameState, scores] = await Promise.all([
    prisma.gameState.findUnique({
      where: { userId: session.id },
    }),
    prisma.leaderboard.findMany({
      where: { userId: session.id },
      orderBy: [{ completedAt: 'desc' }],
      take: 10,
    }),
  ]);

  return (
    <section className="mx-auto grid w-[min(1180px,calc(100%_-_32px))] gap-6 py-11 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Account
          </p>
          <h1 className="text-[clamp(2.4rem,7vw,5.7rem)] leading-[0.94]">
            {session.name}
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_300px] items-start gap-[22px] max-[820px]:grid-cols-1">
        <section className="grid gap-4 rounded-lg border border-line bg-panel p-[18px] shadow-panel">
          <h2 className="text-[clamp(1.7rem,3vw,2.4rem)]">Saved board</h2>
          {gameState ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-[7px] border border-line bg-white/50 p-3">
                <span className="block text-[0.78rem] text-muted">Level</span>
                <strong className="mt-1 block text-[1.4rem]">
                  {gameState.level}
                </strong>
              </div>
              <div className="rounded-[7px] border border-line bg-white/50 p-3">
                <span className="block text-[0.78rem] text-muted">Moves</span>
                <strong className="mt-1 block text-[1.4rem]">
                  {gameState.moves}
                </strong>
              </div>
            </div>
          ) : (
            <p className="leading-normal text-muted">
              Start a signed-in game to save progress.
            </p>
          )}
        </section>
        <section className="grid gap-4 rounded-lg border border-line bg-panel p-[18px] shadow-panel">
          <h2 className="text-[clamp(1.7rem,3vw,2.4rem)]">Recent scores</h2>
          {scores.length > 0 ? (
            scores.map((score) => (
              <div
                className="rounded-[7px] border border-line bg-white/50 p-3"
                key={score.id}
              >
                <span className="block text-[0.78rem] text-muted">
                  Level {score.level} on{' '}
                  {score.completedAt.toLocaleDateString('en-US')}
                </span>
                <strong className="mt-1 block text-[1.4rem]">
                  {score.timeSeconds}s / {score.moves} moves
                </strong>
              </div>
            ))
          ) : (
            <p className="leading-normal text-muted">
              Completed levels will show up here.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
