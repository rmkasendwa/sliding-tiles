import { Trophy } from 'lucide-react';
import Link from 'next/link';

import { CurrentUserBadge } from '@/components/CurrentUserBadge';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { RelativeTimestap } from '@/components/RelativeTimestap';
import { ApiScore, apiRequest, getApiMessage } from '@/lib/api';
import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export const metadata = pageMetadata.leaderboard;

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

function perLevel(value: number, level: number, precision = 2) {
  const safeLevel = Math.max(1, level);
  return (value / safeLevel).toFixed(precision);
}

function getRankTone(rank: number) {
  if (rank === 1) {
    return 'bg-medal-gold-surface border-medal-gold-border text-medal-gold-text';
  }

  if (rank === 2) {
    return 'bg-medal-silver-surface border-medal-silver-border text-medal-silver-text';
  }

  if (rank === 3) {
    return 'bg-medal-bronze-surface border-medal-bronze-border text-clay-strong';
  }

  return 'bg-panel border-line text-foreground';
}

function LeaderboardEmptyState() {
  return (
    <section
      aria-labelledby="leaderboard-empty-heading"
      className="profile-reveal grid min-h-80 place-items-center rounded-lg border border-accent/18 bg-[linear-gradient(160deg,var(--color-primary-soft),var(--color-surface)_48%,var(--color-warning-surface))] px-5 py-12 text-center shadow-panel sm:min-h-96 sm:px-8"
      style={{ animationDelay: '130ms' }}
    >
      <div className="grid max-w-lg justify-items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full border border-warning/35 bg-warning-soft text-warning-strong shadow-featured-stat sm:size-18">
          <Trophy
            aria-hidden="true"
            className="size-8 sm:size-9"
            strokeWidth={2}
          />
        </span>
        <div className="grid gap-2">
          <h2
            className="text-[clamp(1.75rem,5vw,2.4rem)] leading-tight text-foreground"
            id="leaderboard-empty-heading"
          >
            No rankings yet
          </h2>
          <p className="mx-auto max-w-md text-sm leading-6 text-muted sm:text-base">
            Be the first player to complete a puzzle and claim the top spot.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-[7px] border border-primary bg-primary px-5 text-sm font-bold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong"
          href={routes.play}
        >
          Play Now
        </Link>
      </div>
    </section>
  );
}

export default async function LeaderboardPage() {
  const session = await getSession();
  let renderedAt = 0;
  let scores: ApiScore[] = [];
  let loadError: string | null = null;

  try {
    const response = await apiRequest<{
      generatedAt: string;
      scores: ApiScore[];
    }>('/leaderboard?take=50');
    renderedAt = new Date(response.generatedAt).getTime();
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
    <section className="page-rail mx-auto grid max-w-300 gap-5 py-5">
      <div
        className="profile-reveal grid gap-4 rounded-xl border border-accent/20 bg-[radial-gradient(circle_at_88%_12%,color-mix(in_srgb,var(--color-accent)_28%,transparent),transparent_36%),radial-gradient(circle_at_12%_100%,color-mix(in_srgb,var(--color-warning)_34%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_srgb,var(--color-primary-strong)_12%,transparent),color-mix(in_srgb,var(--color-surface)_52%,transparent)_48%,color-mix(in_srgb,var(--color-info)_18%,transparent))] p-5 shadow-panel min-[1060px]:grid-cols-[minmax(0,1fr)_320px]"
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
            <span className="rounded-full border border-accent/22 bg-surface/76 px-3 py-1 text-xs font-bold uppercase text-accent-strong shadow-sm">
              Live top 50
            </span>
            <span className="rounded-full border border-warning/35 bg-warning-soft/78 px-3 py-1 text-xs font-bold uppercase text-warning-strong shadow-sm">
              Best level, then time
            </span>
            {currentUserRank > 0 ? (
              <span className="rounded-full border border-info/28 bg-info-soft/78 px-3 py-1 text-xs font-bold uppercase text-info-strong shadow-sm">
                Your best rank: #{currentUserRank}
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2 rounded-lg border border-warning/35 bg-[linear-gradient(180deg,var(--color-warning-surface),var(--color-primary-soft))] p-3 shadow-featured-stat min-[1060px]:mt-8 min-[1060px]:self-start">
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
                Completed{' '}
                <RelativeTimestap
                  isoDate={scores[0].completedAt}
                  now={renderedAt}
                />
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Post a run to claim this spot.</p>
          )}
          <Link
            className="mt-0.5 inline-flex min-h-9 w-fit items-center justify-center rounded-[7px] border border-primary bg-primary px-3.5 text-sm font-bold text-primary-contrast"
            href={routes.play}
          >
            Play a run
          </Link>
        </div>
      </div>

      {scores.length > 0 ? (
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
                    ? 'border-medal-gold-border bg-[linear-gradient(180deg,var(--color-warning-surface),var(--color-warning-soft))]'
                    : rank === 2
                      ? 'border-medal-silver-border bg-[linear-gradient(180deg,var(--color-info-surface),var(--color-info-soft))]'
                      : 'border-medal-bronze-border bg-[linear-gradient(180deg,var(--color-clay-soft),var(--color-medal-bronze-surface))]',
                ].join(' ')}
                key={score.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.8rem] font-extrabold uppercase text-muted">
                    #{rank}
                  </span>
                  <span className="text-xs font-bold uppercase text-muted">
                    <RelativeTimestap
                      isoDate={score.completedAt}
                      now={renderedAt}
                    />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <ProfileAvatar
                    avatarUrl={score.user?.avatarUrl}
                    name={playerName}
                    size={40}
                  />
                  <p className="inline-flex min-w-0 items-center gap-1.5 text-lg font-bold text-foreground">
                    <span className="truncate">{playerName}</span>
                    {session?.id === score.userId ? <CurrentUserBadge /> : null}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <p className="rounded-md border border-foreground/8 bg-surface/60 px-2 py-1.5">
                    L{score.level}
                  </p>
                  <p className="rounded-md border border-foreground/8 bg-surface/60 px-2 py-1.5">
                    {score.moves} mv
                  </p>
                  <p className="rounded-md border border-foreground/8 bg-surface/60 px-2 py-1.5">
                    {formatDuration(score.timeSeconds)}
                  </p>
                </div>
              </article>
            );
          })}
          {podium.length < 3
            ? Array.from({ length: 3 - podium.length }).map((_, index) => {
                return (
                  <article
                    className="rounded-lg border border-dashed p-4 border-foreground/8 bg-foreground/1.5 max-[820px]:hidden"
                    key={index}
                  />
                );
              })
            : null}
        </div>
      ) : null}

      {scores.length > 0 ? (
        <div
          className="profile-reveal grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[620px]:grid-cols-1"
          style={{ animationDelay: '100ms' }}
        >
          <article className="rounded-lg border border-accent/22 bg-[linear-gradient(160deg,var(--color-primary-soft),var(--color-surface))] p-4 shadow-panel">
            <p className="text-[0.75rem] font-extrabold uppercase text-accent-strong">
              Posted runs
            </p>
            <p className="mt-1 text-2xl font-bold">{scores.length}</p>
          </article>
          <article className="rounded-lg border border-info/24 bg-[linear-gradient(160deg,var(--color-info-soft),var(--color-surface))] p-4 shadow-panel">
            <p className="text-[0.75rem] font-extrabold uppercase text-info-strong">
              Players
            </p>
            <p className="mt-1 text-2xl font-bold">{uniquePlayers}</p>
          </article>
          <article className="rounded-lg border border-warning/30 bg-[linear-gradient(160deg,var(--color-warning-soft),var(--color-surface))] p-4 shadow-panel">
            <p className="text-[0.75rem] font-extrabold uppercase text-warning-strong">
              Best run
            </p>
            <p className="mt-1 text-2xl font-bold">
              {fastestRun ? formatDuration(fastestRun.timeSeconds) : '-'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Highest level: {bestLevel}
            </p>
          </article>
          <article className="rounded-lg border border-clay/24 bg-[linear-gradient(160deg,var(--color-clay-soft),var(--color-surface))] p-4 shadow-panel">
            <p className="text-[0.75rem] font-extrabold uppercase text-clay-strong">
              Avg moves
            </p>
            <p className="mt-1 text-2xl font-bold">
              {scores.length > 0 ? averageMoves : '-'}
            </p>
            <p className="mt-1 text-sm text-muted">Across all listed runs</p>
          </article>
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          {loadError}
        </div>
      ) : null}

      {scores.length > 0 ? (
        <div
          className="profile-reveal hidden gap-4 min-[1120px]:grid min-[1120px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
          style={{ animationDelay: '130ms' }}
        >
          <article className="overflow-hidden rounded-lg border border-accent/18 bg-panel shadow-panel">
            <header className="border-b border-accent/16 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_16%,transparent),color-mix(in_srgb,var(--color-surface)_45%,transparent))] px-4 py-3">
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
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-foreground">
                    <span className="truncate">{player.name}</span>
                    {session?.id === player.userId ? (
                      <CurrentUserBadge />
                    ) : null}
                  </span>
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent-strong">
                    L{player.bestLevel}
                  </span>
                  <span className="text-xs text-muted">{player.runs} runs</span>
                </li>
              ))}
              {topPlayers.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted">
                  No players yet.
                </li>
              ) : null}
            </ol>
          </article>

          <article className="overflow-hidden rounded-lg border border-info/18 bg-panel shadow-panel">
            <header className="border-b border-info/16 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-info)_18%,transparent),color-mix(in_srgb,var(--color-surface)_45%,transparent))] px-4 py-3">
              <p className="text-[0.74rem] font-extrabold uppercase text-info-strong">
                Recent completions
              </p>
            </header>
            <ul className="grid">
              {recentRuns.map((score) => (
                <li
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line/80 px-4 py-2.5 odd:bg-info/5 last:border-b-0"
                  key={score.id}
                >
                  <span className="truncate text-sm text-foreground">
                    {score.user?.name ?? 'Player'} · Level {score.level}
                  </span>
                  <span className="text-xs text-muted">
                    <RelativeTimestap
                      isoDate={score.completedAt}
                      now={renderedAt}
                    />
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
      ) : null}

      {scores.length === 0 && !loadError ? <LeaderboardEmptyState /> : null}

      {scores.length > 0 ? (
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
                    ? 'border-accent bg-primary-soft'
                    : rank % 3 === 1
                      ? 'border-accent/18 bg-primary-soft/70'
                      : rank % 3 === 2
                        ? 'border-info/18 bg-info-surface'
                        : 'border-warning/22 bg-warning-surface',
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
                    <RelativeTimestap
                      isoDate={score.completedAt}
                      now={renderedAt}
                    />
                  </p>
                </div>
                <p className="mt-2 inline-flex min-w-0 items-center gap-1.5 text-lg font-bold">
                  <span className="truncate">
                    {score.user?.name ?? 'Player'}
                  </span>
                  {isCurrentUser ? <CurrentUserBadge /> : null}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Level {score.level} · {score.moves} moves ·{' '}
                  {formatDuration(score.timeSeconds)}
                </p>
              </article>
            );
          })}
        </div>
      ) : null}

      {scores.length > 0 ? (
        <div
          className="profile-reveal overflow-hidden rounded-lg border border-accent/16 bg-panel shadow-panel"
          style={{ animationDelay: '160ms' }}
        >
          <table className="hidden w-full border-collapse min-[901px]:table">
            <thead className="bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_14%,transparent),color-mix(in_srgb,var(--color-info)_12%,transparent),color-mix(in_srgb,var(--color-warning)_16%,transparent))]">
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
                      ? 'bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_16%,transparent),color-mix(in_srgb,var(--color-accent)_6%,transparent))]'
                      : index % 2 === 0
                        ? 'bg-surface/34'
                        : 'bg-primary-soft/70'
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
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span className="truncate">
                        {score.user?.name ?? 'Player'}
                      </span>
                      {session?.id === score.userId ? (
                        <CurrentUserBadge />
                      ) : null}
                    </span>
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
                    <RelativeTimestap
                      isoDate={score.completedAt}
                      now={renderedAt}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
