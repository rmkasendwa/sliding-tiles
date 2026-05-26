import Link from 'next/link';

import { ApiScore, apiRequest, getApiMessage } from '@/lib/api';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatCompletedAt(isoDate: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(isoDate));
}

function perLevel(value: number, level: number, precision = 2) {
  const safeLevel = Math.max(1, level);
  return (value / safeLevel).toFixed(precision);
}

function getRankTone(rank: number) {
  if (rank === 1) {
    return 'bg-[#f6edd0] border-[#ecd387] text-[#8a6d21]';
  }

  if (rank === 2) {
    return 'bg-[#ecf0f4] border-[#c9d4df] text-[#546271]';
  }

  if (rank === 3) {
    return 'bg-[#f3e2d4] border-[#dbb38d] text-[#875936]';
  }

  return 'bg-panel border-line text-foreground';
}

export default async function LeaderboardPage() {
  const session = await getSession();
  let scores: ApiScore[] = [];
  let loadError: string | null = null;

  try {
    const response = await apiRequest<{ scores: ApiScore[] }>(
      '/leaderboard?take=50',
    );
    scores = response.scores;
  } catch (error) {
    loadError = getApiMessage(error) ?? 'Unable to load leaderboard right now.';
  }

  const uniquePlayers = new Set(scores.map((score) => score.userId)).size;
  const bestLevel = scores.reduce(
    (best, score) => Math.max(best, score.level),
    0,
  );
  const fastestRun =
    scores.length > 0
      ? scores.reduce((best, score) =>
          score.timeSeconds < best.timeSeconds ? score : best,
        )
      : null;
  const averageMoves =
    scores.length > 0
      ? Math.round(
          scores.reduce((total, score) => total + score.moves, 0) /
            scores.length,
        )
      : 0;
  const topPlayers = Array.from(
    scores.reduce(
      (acc, score) => {
        const existing = acc.get(score.userId);
        if (existing) {
          existing.runs += 1;
          existing.bestLevel = Math.max(existing.bestLevel, score.level);
          return acc;
        }

        acc.set(score.userId, {
          bestLevel: score.level,
          name: score.user?.name ?? 'Player',
          runs: 1,
          userId: score.userId,
        });
        return acc;
      },
      new Map<
        string,
        { bestLevel: number; name: string; runs: number; userId: string }
      >(),
    ).values(),
  )
    .sort((a, b) => b.bestLevel - a.bestLevel || b.runs - a.runs)
    .slice(0, 8);
  const recentRuns = [...scores]
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    )
    .slice(0, 8);

  return (
    <section className="page-rail mx-auto grid gap-6 py-11 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Pond hall of fame
          </p>
          <h1 className="text-[clamp(2.4rem,7vw,5.7rem)] leading-[0.94]">
            Fast frogs. Clean runs.
          </h1>
          <p className="mt-2 max-w-[62ch] text-muted">
            Every posted run is a claim to the crown. Climb by pushing deeper
            levels, shaving seconds, and keeping your moves razor tight.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent bg-accent px-3.5 font-bold text-white"
          href={routes.play}
        >
          Play a run
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[620px]:grid-cols-1">
        <article className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <p className="text-[0.75rem] font-extrabold uppercase text-muted">
            Posted runs
          </p>
          <p className="mt-1 text-2xl font-bold">{scores.length}</p>
        </article>
        <article className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <p className="text-[0.75rem] font-extrabold uppercase text-muted">
            Players
          </p>
          <p className="mt-1 text-2xl font-bold">{uniquePlayers}</p>
        </article>
        <article className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <p className="text-[0.75rem] font-extrabold uppercase text-muted">
            Best run
          </p>
          <p className="mt-1 text-2xl font-bold">
            {fastestRun ? formatDuration(fastestRun.timeSeconds) : '-'}
          </p>
          <p className="mt-1 text-sm text-muted">Highest level: {bestLevel}</p>
        </article>
        <article className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <p className="text-[0.75rem] font-extrabold uppercase text-muted">
            Avg moves
          </p>
          <p className="mt-1 text-2xl font-bold">
            {scores.length > 0 ? averageMoves : '-'}
          </p>
          <p className="mt-1 text-sm text-muted">Across all listed runs</p>
        </article>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          {loadError}
        </div>
      ) : null}

      <div className="hidden gap-4 min-[1120px]:grid min-[1120px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <article className="overflow-hidden rounded-lg border border-line bg-panel shadow-panel">
          <header className="border-b border-line px-4 py-3">
            <p className="text-[0.74rem] font-extrabold uppercase text-muted">
              Top players in this slice
            </p>
          </header>
          <ol className="grid">
            {topPlayers.map((player, index) => (
              <li
                className="grid grid-cols-[46px_minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-line/80 px-4 py-2.5 last:border-b-0"
                key={player.userId}
              >
                <span className="text-sm font-bold text-muted">#{index + 1}</span>
                <span className="font-semibold text-foreground">
                  {player.name}
                  {session?.id === player.userId ? ' (You)' : ''}
                </span>
                <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent-strong">
                  L{player.bestLevel}
                </span>
                <span className="text-xs text-muted">{player.runs} runs</span>
              </li>
            ))}
            {topPlayers.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">No players yet.</li>
            ) : null}
          </ol>
        </article>

        <article className="overflow-hidden rounded-lg border border-line bg-panel shadow-panel">
          <header className="border-b border-line px-4 py-3">
            <p className="text-[0.74rem] font-extrabold uppercase text-muted">
              Recent completions
            </p>
          </header>
          <ul className="grid">
            {recentRuns.map((score) => (
              <li
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line/80 px-4 py-2.5 last:border-b-0"
                key={score.id}
              >
                <span className="truncate text-sm text-foreground">
                  {score.user?.name ?? 'Player'} · Level {score.level}
                </span>
                <span className="text-xs text-muted">
                  {formatCompletedAt(score.completedAt)}
                </span>
              </li>
            ))}
            {recentRuns.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">No recent completions.</li>
            ) : null}
          </ul>
        </article>
      </div>

      <div className="grid gap-3 min-[901px]:hidden">
        {scores.map((score, index) => {
          const rank = index + 1;
          const isCurrentUser = Boolean(
            session?.id && session.id === score.userId,
          );
          return (
            <article
              className={[
                'rounded-lg border p-4 shadow-panel',
                isCurrentUser
                  ? 'border-accent bg-[#f2f8eb]'
                  : 'border-line bg-panel',
              ].join(' ')}
              key={score.id}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={[
                    'inline-flex min-w-9 items-center justify-center rounded-full border px-2 py-0.5 text-sm font-bold',
                    getRankTone(rank),
                  ].join(' ')}
                >
                  #{rank}
                </span>
                <p className="text-sm text-muted">
                  {formatCompletedAt(score.completedAt)}
                </p>
              </div>
              <p className="mt-2 text-lg font-bold">
                {score.user?.name ?? 'Player'}
                {isCurrentUser ? ' (You)' : ''}
              </p>
              <p className="mt-1 text-sm text-muted">
                Level {score.level} · {score.moves} moves ·{' '}
                {formatDuration(score.timeSeconds)}
              </p>
            </article>
          );
        })}
        {scores.length === 0 && !loadError ? (
          <div className="rounded-lg border border-line bg-panel p-4 text-muted">
            No completed signed-in games yet.
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-panel">
        <table className="hidden w-full border-collapse min-[901px]:table">
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
              <th className="border-b border-line p-3.5 text-left text-[0.84rem] uppercase text-muted">
                Pace
              </th>
              <th className="border-b border-line p-3.5 text-left text-[0.84rem] uppercase text-muted">
                Efficiency
              </th>
              <th className="border-b border-line p-3.5 text-left text-[0.84rem] uppercase text-muted">
                Completed
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr
                className={
                  session?.id === score.userId
                    ? 'bg-[linear-gradient(90deg,rgba(112,173,71,0.14),rgba(112,173,71,0.04))]'
                    : ''
                }
                key={score.id}
              >
                <td className="border-b border-line p-3.5 text-left">
                  <span
                    className={[
                      'inline-flex min-w-9 items-center justify-center rounded-full border px-2 py-0.5 text-sm font-bold',
                      getRankTone(index + 1),
                    ].join(' ')}
                  >
                    #{index + 1}
                  </span>
                </td>
                <td className="border-b border-line p-3.5 text-left">
                  {score.user?.name ?? 'Player'}
                  {session?.id === score.userId ? ' (You)' : ''}
                </td>
                <td className="border-b border-line p-3.5 text-left">
                  {score.level}
                </td>
                <td className="border-b border-line p-3.5 text-left">
                  {score.moves}
                </td>
                <td className="border-b border-line p-3.5 text-left">
                  {formatDuration(score.timeSeconds)}
                </td>
                <td className="border-b border-line p-3.5 text-left text-sm text-muted">
                  {perLevel(score.timeSeconds, score.level, 1)}s/lvl
                </td>
                <td className="border-b border-line p-3.5 text-left text-sm text-muted">
                  {perLevel(score.moves, score.level)} moves/lvl
                </td>
                <td className="border-b border-line p-3.5 text-left text-sm text-muted">
                  {formatCompletedAt(score.completedAt)}
                </td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr>
                <td
                  className="border-b border-line p-3.5 text-left"
                  colSpan={8}
                >
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
