import Link from 'next/link';

import { ProfileAvatar } from '@/components/ProfileAvatar';
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
    scores
      .reduce((acc, score) => {
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
      }, new Map<string, { bestLevel: number; name: string; runs: number; userId: string }>())
      .values(),
  )
    .sort((a, b) => b.bestLevel - a.bestLevel || b.runs - a.runs)
    .slice(0, 8);
  const recentRuns = [...scores]
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    )
    .slice(0, 8);
  const podium = scores.slice(0, 3);
  const currentUserRank = session?.id
    ? scores.findIndex((score) => score.userId === session.id) + 1
    : 0;

  return (
    <section className="page-rail mx-auto grid max-w-300 gap-6 pt-5 pb-10">
      <div
        className="profile-reveal grid gap-4 rounded-xl border border-accent/20 bg-[radial-gradient(circle_at_88%_12%,rgba(128,196,78,0.28),transparent_36%),radial-gradient(circle_at_12%_100%,rgba(246,207,130,0.34),transparent_34%),linear-gradient(135deg,rgba(23,79,67,0.12),rgba(255,255,255,0.52)_48%,rgba(91,132,175,0.18))] p-5 shadow-panel min-[1060px]:grid-cols-[minmax(0,1fr)_320px]"
        style={{ animationDelay: '40ms' }}
      >
        <div>
          <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
            Pond hall of fame
          </p>
          <h1 className="mt-1 text-[clamp(2.5rem,6vw,5rem)] leading-[0.92]">
            Fast frogs. Clean runs.
          </h1>
          <p className="mt-3 max-w-[66ch] text-muted">
            This board rewards range and discipline. Hit deeper levels, cut dead
            moves, and keep your clock brutal. The top lane changes fast.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-accent/22 bg-white/76 px-3 py-1 text-xs font-bold uppercase text-accent-strong shadow-sm">
              Live top 50
            </span>
            <span className="rounded-full border border-[#d5a344]/35 bg-[#fff4d6]/78 px-3 py-1 text-xs font-bold uppercase text-[#8a621c] shadow-sm">
              Best level, then time
            </span>
            {currentUserRank > 0 ? (
              <span className="rounded-full border border-[#5f87a8]/28 bg-[#eef6ff]/78 px-3 py-1 text-xs font-bold uppercase text-[#486b89] shadow-sm">
                Your best rank: #{currentUserRank}
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2 rounded-lg border border-[#d5a344]/35 bg-[linear-gradient(180deg,#fff9e8,#f6fbef)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_14px_34px_rgba(138,109,33,0.12)] min-[1060px]:mt-8 min-[1060px]:self-start">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] font-extrabold uppercase leading-none text-muted">
              Featured run
            </p>
            {scores[0] ? (
              <span className="rounded-full border border-accent/18 bg-accent/8 px-2 py-0.5 text-[0.68rem] font-extrabold uppercase text-accent-strong">
                #{1}
              </span>
            ) : null}
          </div>
          {scores[0] ? (
            <>
              <div className="grid gap-1">
                <p className="text-lg font-bold leading-tight text-foreground">
                  {scores[0].user?.name ?? 'Player'}
                </p>
                <p className="text-sm leading-snug text-muted">
                  Level {scores[0].level} · {scores[0].moves} moves ·{' '}
                  {formatDuration(scores[0].timeSeconds)}
                </p>
              </div>
              <p className="text-xs leading-snug text-muted">
                Completed {formatCompletedAt(scores[0].completedAt)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Post a run to claim this spot.</p>
          )}
          <Link
            className="mt-0.5 inline-flex min-h-9 w-fit items-center justify-center rounded-[7px] border border-accent bg-accent px-3.5 text-sm font-bold text-white"
            href={routes.play}
          >
            Play a run
          </Link>
        </div>
      </div>

      <div
        className="profile-reveal grid gap-3 min-[820px]:grid-cols-3"
        style={{ animationDelay: '70ms' }}
      >
        {podium.map((score, index) => {
          const rank = index + 1;
          const playerName = score.user?.name ?? 'Player';
          return (
            <article
              className={[
                'rounded-lg border p-4 shadow-panel',
                rank === 1
                  ? 'border-[#e2c066] bg-[linear-gradient(180deg,#fff8e2,#fff1cb)]'
                  : rank === 2
                    ? 'border-[#bfd0dd] bg-[linear-gradient(180deg,#f8fbff,#eef3f8)]'
                    : 'border-[#ddb18a] bg-[linear-gradient(180deg,#fff5ed,#f6e2d0)]',
              ].join(' ')}
              key={score.id}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.8rem] font-extrabold uppercase text-muted">
                  #{rank}
                </span>
                <span className="text-xs font-bold uppercase text-muted">
                  {formatCompletedAt(score.completedAt)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                <ProfileAvatar
                  avatarUrl={score.user?.avatarUrl}
                  name={playerName}
                  size={40}
                />
                <p className="text-lg font-bold text-foreground">
                  {playerName}
                  {session?.id === score.userId ? ' (You)' : ''}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <p className="rounded-md border border-black/8 bg-white/60 px-2 py-1.5">
                  L{score.level}
                </p>
                <p className="rounded-md border border-black/8 bg-white/60 px-2 py-1.5">
                  {score.moves} mv
                </p>
                <p className="rounded-md border border-black/8 bg-white/60 px-2 py-1.5">
                  {formatDuration(score.timeSeconds)}
                </p>
              </div>
            </article>
          );
        })}
        {podium.length > 0 && podium.length < 3
          ? Array.from({ length: 3 - podium.length }).map((_, index) => {
              return (
                <article
                  className="rounded-lg border-2 border-dashed p-4 border-black/8 bg-black/1.5 max-[820px]:hidden"
                  key={index}
                />
              );
            })
          : null}
        {podium.length === 0 ? (
          <div className="rounded-lg border border-line bg-panel p-4 text-muted min-[820px]:col-span-3">
            Top-3 podium will appear as soon as runs are posted.
          </div>
        ) : null}
      </div>

      <div
        className="profile-reveal grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[620px]:grid-cols-1"
        style={{ animationDelay: '100ms' }}
      >
        <article className="rounded-lg border border-accent/22 bg-[linear-gradient(160deg,#f5fbef,#ffffff)] p-4 shadow-panel">
          <p className="text-[0.75rem] font-extrabold uppercase text-accent-strong">
            Posted runs
          </p>
          <p className="mt-1 text-2xl font-bold">{scores.length}</p>
        </article>
        <article className="rounded-lg border border-[#5f87a8]/24 bg-[linear-gradient(160deg,#eef6ff,#ffffff)] p-4 shadow-panel">
          <p className="text-[0.75rem] font-extrabold uppercase text-[#486b89]">
            Players
          </p>
          <p className="mt-1 text-2xl font-bold">{uniquePlayers}</p>
        </article>
        <article className="rounded-lg border border-[#d5a344]/30 bg-[linear-gradient(160deg,#fff5d8,#ffffff)] p-4 shadow-panel">
          <p className="text-[0.75rem] font-extrabold uppercase text-[#8a621c]">
            Best run
          </p>
          <p className="mt-1 text-2xl font-bold">
            {fastestRun ? formatDuration(fastestRun.timeSeconds) : '-'}
          </p>
          <p className="mt-1 text-sm text-muted">Highest level: {bestLevel}</p>
        </article>
        <article className="rounded-lg border border-[#c77d56]/24 bg-[linear-gradient(160deg,#fff1e8,#ffffff)] p-4 shadow-panel">
          <p className="text-[0.75rem] font-extrabold uppercase text-[#875936]">
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

      <div
        className="profile-reveal hidden gap-4 min-[1120px]:grid min-[1120px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
        style={{ animationDelay: '130ms' }}
      >
        <article className="overflow-hidden rounded-lg border border-accent/18 bg-panel shadow-panel">
          <header className="border-b border-accent/16 bg-[linear-gradient(90deg,rgba(128,196,78,0.16),rgba(255,255,255,0.45))] px-4 py-3">
            <p className="text-[0.74rem] font-extrabold uppercase text-accent-strong">
              Top players in this slice
            </p>
          </header>
          <ol className="grid">
            {topPlayers.map((player, index) => (
              <li
                className="grid grid-cols-[46px_minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-line/80 px-4 py-2.5 odd:bg-accent/4 last:border-b-0"
                key={player.userId}
              >
                <span className="text-sm font-bold text-muted">
                  #{index + 1}
                </span>
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

        <article className="overflow-hidden rounded-lg border border-[#5f87a8]/18 bg-panel shadow-panel">
          <header className="border-b border-[#5f87a8]/16 bg-[linear-gradient(90deg,rgba(91,132,175,0.18),rgba(255,255,255,0.45))] px-4 py-3">
            <p className="text-[0.74rem] font-extrabold uppercase text-[#486b89]">
              Recent completions
            </p>
          </header>
          <ul className="grid">
            {recentRuns.map((score) => (
              <li
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line/80 px-4 py-2.5 odd:bg-[#5f87a8]/5 last:border-b-0"
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
              <li className="px-4 py-3 text-sm text-muted">
                No recent completions.
              </li>
            ) : null}
          </ul>
        </article>
      </div>

      <div
        className="profile-reveal grid gap-3 min-[901px]:hidden"
        style={{ animationDelay: '130ms' }}
      >
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
                  : rank % 3 === 1
                    ? 'border-accent/18 bg-[#f8fcf2]'
                    : rank % 3 === 2
                      ? 'border-[#5f87a8]/18 bg-[#f4f9ff]'
                      : 'border-[#d5a344]/22 bg-[#fff9eb]',
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

      <div
        className="profile-reveal overflow-hidden rounded-lg border border-accent/16 bg-panel shadow-panel"
        style={{ animationDelay: '160ms' }}
      >
        <table className="hidden w-full border-collapse min-[901px]:table">
          <thead className="bg-[linear-gradient(90deg,rgba(128,196,78,0.14),rgba(91,132,175,0.12),rgba(246,207,130,0.16))]">
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
                    ? 'bg-[linear-gradient(90deg,rgba(112,173,71,0.16),rgba(112,173,71,0.06))]'
                    : index % 2 === 0
                      ? 'bg-white/34'
                      : 'bg-[#f7fbf3]/70'
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
