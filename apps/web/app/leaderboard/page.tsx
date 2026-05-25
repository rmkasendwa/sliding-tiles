import { ApiScore, apiRequest } from '@/lib/api';

export default async function LeaderboardPage() {
  const { scores } = await apiRequest<{ scores: ApiScore[] }>(
    '/leaderboard?take=25',
  );

  return (
    <section className="mx-auto grid w-[min(1180px,calc(100%_-_32px))] gap-6 py-11 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Best completed levels
          </p>
          <h1 className="text-[clamp(2.4rem,7vw,5.7rem)] leading-[0.94]">
            Leaderboard
          </h1>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-panel">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-line p-3.5 text-left text-[0.84rem] uppercase text-muted">
                Rank
              </th>
              <th className="border-b border-line p-3.5 text-left text-[0.84rem] uppercase text-muted">
                Player
              </th>
              <th className="border-b border-line p-3.5 text-left text-[0.84rem] uppercase text-muted">
                Level
              </th>
              <th className="border-b border-line p-3.5 text-left text-[0.84rem] uppercase text-muted">
                Moves
              </th>
              <th className="border-b border-line p-3.5 text-left text-[0.84rem] uppercase text-muted">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr key={score.id}>
                <td className="border-b border-line p-3.5 text-left">
                  {index + 1}
                </td>
                <td className="border-b border-line p-3.5 text-left">
                  {score.user?.name ?? 'Player'}
                </td>
                <td className="border-b border-line p-3.5 text-left">
                  {score.level}
                </td>
                <td className="border-b border-line p-3.5 text-left">
                  {score.moves}
                </td>
                <td className="border-b border-line p-3.5 text-left">
                  {score.timeSeconds}s
                </td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr>
                <td className="border-b border-line p-3.5 text-left" colSpan={5}>
                  No completed signed-in games yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
