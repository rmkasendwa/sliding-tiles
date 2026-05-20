import { prisma } from '@/lib/prisma';

export default async function LeaderboardPage() {
  const scores = await prisma.leaderboard.findMany({
    orderBy: [{ level: 'desc' }, { timeSeconds: 'asc' }, { moves: 'asc' }],
    take: 25,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <section className="shell page grid-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Best completed levels</p>
          <h1>Leaderboard</h1>
        </div>
      </div>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Level</th>
              <th>Moves</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr key={score.id}>
                <td>{index + 1}</td>
                <td>{score.user.name}</td>
                <td>{score.level}</td>
                <td>{score.moves}</td>
                <td>{score.timeSeconds}s</td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr>
                <td colSpan={5}>No completed signed-in games yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
