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
    <section className="shell page grid-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{session.name}</h1>
        </div>
      </div>
      <div className="game-layout">
        <section className="panel game-card">
          <h2>Saved board</h2>
          {gameState ? (
            <div className="stat-grid">
              <div className="stat">
                <span>Level</span>
                <strong>{gameState.level}</strong>
              </div>
              <div className="stat">
                <span>Moves</span>
                <strong>{gameState.moves}</strong>
              </div>
            </div>
          ) : (
            <p className="notice">Start a signed-in game to save progress.</p>
          )}
        </section>
        <section className="panel game-card">
          <h2>Recent scores</h2>
          {scores.length > 0 ? (
            scores.map((score) => (
              <div className="stat" key={score.id}>
                <span>
                  Level {score.level} on{' '}
                  {score.completedAt.toLocaleDateString('en-US')}
                </span>
                <strong>
                  {score.timeSeconds}s / {score.moves} moves
                </strong>
              </div>
            ))
          ) : (
            <p className="notice">Completed levels will show up here.</p>
          )}
        </section>
      </div>
    </section>
  );
}
