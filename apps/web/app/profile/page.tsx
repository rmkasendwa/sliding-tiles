import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { ApiGameState, ApiScore, apiRequest } from '@/lib/api';
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

function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

function formatPace(timeSeconds: number, level: number) {
  const safeLevel = Math.max(level, 1);
  return `${(timeSeconds / safeLevel).toFixed(1)}s/lvl`;
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'ST';
  }

  const pieces = trimmed.split(/\s+/).slice(0, 2);
  return pieces.map((piece) => piece[0]?.toUpperCase() ?? '').join('');
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect(routes.login);
  }

  const { gameState, scores } = await apiRequest<{
    gameState: ApiGameState | null;
    scores: ApiScore[];
  }>('/profile');

  const completedRuns = scores.length;
  const bestRun =
    scores.length > 0
      ? scores.reduce((best, score) =>
          score.timeSeconds < best.timeSeconds ? score : best,
        )
      : null;
  const highestCompletedLevel = scores.reduce(
    (maxLevel, score) => Math.max(maxLevel, score.level),
    0,
  );
  const averageMoves =
    scores.length > 0
      ? Math.round(
          scores.reduce((total, score) => total + score.moves, 0) /
            scores.length,
        )
      : null;
  const firstCompletedRun =
    scores.length > 0 ? scores[scores.length - 1] : null;
  const latestRun = scores[0] ?? null;
  const bestPaceRun =
    scores.length > 0
      ? scores.reduce((best, score) =>
          score.timeSeconds / Math.max(score.level, 1) <
          best.timeSeconds / Math.max(best.level, 1)
            ? score
            : best,
        )
      : null;
  const cleanestRun =
    scores.length > 0
      ? scores.reduce((best, score) =>
          score.moves / Math.max(score.level, 1) <
          best.moves / Math.max(best.level, 1)
            ? score
            : best,
        )
      : null;
  const recentAverageTime =
    scores.length > 0
      ? Math.round(
          scores
            .slice(0, 3)
            .reduce((sum, score) => sum + score.timeSeconds, 0) /
            Math.min(scores.length, 3),
        )
      : null;
  const achievementBadges = [
    completedRuns >= 10 ? 'Endurance runner' : null,
    highestCompletedLevel >= 8 ? 'Deep-level specialist' : null,
    bestRun && bestRun.timeSeconds <= 120 ? 'Speed frog' : null,
    cleanestRun && cleanestRun.moves <= cleanestRun.level * 8
      ? 'Efficiency minded'
      : null,
  ].filter((badge): badge is string => Boolean(badge));
  const trendRuns = [...scores]
    .slice(0, 5)
    .reverse()
    .map((score) => ({
      id: score.id,
      level: score.level,
      pace: score.timeSeconds / Math.max(score.level, 1),
      timestamp: score.completedAt,
    }));
  const minTrendPace =
    trendRuns.length > 0 ? Math.min(...trendRuns.map((run) => run.pace)) : 0;
  const maxTrendPace =
    trendRuns.length > 0 ? Math.max(...trendRuns.map((run) => run.pace)) : 0;
  const trendRange = Math.max(maxTrendPace - minTrendPace, 0.0001);
  const nextTargetLevel =
    Math.max(highestCompletedLevel, gameState?.level ?? 0) + 1;
  const milestoneItems = [
    {
      label: 'First clear',
      value: firstCompletedRun ? `Level ${firstCompletedRun.level}` : 'Pending',
    },
    {
      label: 'Personal best',
      value: bestRun ? formatDuration(bestRun.timeSeconds) : 'Pending',
    },
    {
      label: 'Current board',
      value: gameState ? `Level ${gameState.level}` : 'No active run',
    },
    {
      label: 'Next target',
      value: `Level ${nextTargetLevel}`,
    },
  ];

  return (
    <section className="page-rail mx-auto grid max-w-300 gap-6 pt-5 pb-10">
      <div className="grid gap-4 rounded-xl border border-accent/20 bg-[radial-gradient(circle_at_top_right,rgba(116,191,77,0.18),transparent_54%),linear-gradient(140deg,rgba(24,58,43,0.08),rgba(255,255,255,0.36))] p-5 shadow-panel min-[980px]:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
            Account cockpit
          </p>
          <h1 className="mt-1 text-[clamp(2.4rem,7vw,5.8rem)] leading-[0.92]">
            {session.name}
          </h1>
          <p className="mt-3 max-w-[64ch] text-muted">
            Your run history, current board progress, and personal pace all in
            one place.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-accent/22 bg-white/70 px-3 py-1 text-xs font-bold uppercase text-accent-strong">
              Signed in as {session.email}
            </span>
            <span className="rounded-full border border-accent/22 bg-white/70 px-3 py-1 text-xs font-bold uppercase text-accent-strong">
              {completedRuns} completed runs
            </span>
            {achievementBadges.slice(0, 2).map((badge) => (
              <span
                className="rounded-full border border-accent/22 bg-white/70 px-3 py-1 text-xs font-bold uppercase text-accent-strong"
                key={badge}
              >
                {badge}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-9 items-center justify-center rounded-[7px] border border-accent bg-accent px-3 text-sm font-bold text-white"
              href={routes.play}
            >
              Continue playing
            </Link>
            <Link
              className="inline-flex min-h-9 items-center justify-center rounded-[7px] border border-accent/30 bg-white/72 px-3 text-sm font-bold text-accent-strong"
              href={routes.leaderboard}
            >
              View leaderboard
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel/90 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-accent/25 bg-white/70 text-sm font-extrabold text-accent-strong">
              {getInitials(session.name)}
            </div>
            <div>
              <p className="text-sm text-muted">Profile summary</p>
              <p className="text-lg font-bold text-foreground">
                {session.name}
              </p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
            <div className="rounded-[7px] border border-line bg-white/65 p-2.5">
              <dt className="text-muted">Best time</dt>
              <dd className="mt-1 font-bold text-foreground">
                {bestRun ? formatDuration(bestRun.timeSeconds) : '-'}
              </dd>
            </div>
            <div className="rounded-[7px] border border-line bg-white/65 p-2.5">
              <dt className="text-muted">Top level</dt>
              <dd className="mt-1 font-bold text-foreground">
                {highestCompletedLevel > 0 ? highestCompletedLevel : '-'}
              </dd>
            </div>
            <div className="rounded-[7px] border border-line bg-white/65 p-2.5">
              <dt className="text-muted">Avg moves</dt>
              <dd className="mt-1 font-bold text-foreground">
                {averageMoves ?? '-'}
              </dd>
            </div>
            <div className="rounded-[7px] border border-line bg-white/65 p-2.5">
              <dt className="text-muted">Saved board</dt>
              <dd className="mt-1 font-bold text-foreground">
                {gameState ? `Level ${gameState.level}` : 'None'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <section
        className="profile-reveal grid gap-4 rounded-xl border border-line bg-panel/95 p-4 shadow-panel"
        style={{ animationDelay: '40ms' }}
      >
        <div className="flex items-end justify-between gap-3 border-b border-line/60 pb-2">
          <h2 className="text-[1.12rem] font-bold">Account and Security</h2>
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
            Identity
          </span>
        </div>

        <div className="grid items-start gap-4 min-[980px]:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <section className="grid gap-3 rounded-lg border border-line bg-white/55 p-4">
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-[1.03rem] font-bold">Milestone journey</h3>
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                Progress map
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[620px]:grid-cols-1">
              {milestoneItems.map((item, index) => (
                <article
                  className="relative rounded-lg border border-line bg-white/65 p-3"
                  key={item.label}
                >
                  {index < milestoneItems.length - 1 ? (
                    <span className="absolute right-0 top-1/2 hidden h-px w-3.5 -translate-y-1/2 translate-x-full bg-accent/30 min-[981px]:block" />
                  ) : null}
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-lg border border-line bg-white/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[1.03rem] font-bold">Account security</h3>
                <p className="mt-0.5 text-sm text-muted">Update password</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                Protected
              </span>
            </div>
            <ChangePasswordForm compact />
          </section>
        </div>
      </section>

      <section
        className="profile-reveal grid gap-5 rounded-xl border border-line bg-panel/95 p-4 shadow-panel"
        style={{ animationDelay: '70ms' }}
      >
        <div className="flex items-end justify-between gap-3 border-b border-line/60 pb-2">
          <h2 className="text-[1.12rem] font-bold">Performance and Activity</h2>
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
            Analytics
          </span>
        </div>

        <div className="grid gap-3 min-[880px]:grid-cols-3">
          <article className="rounded-lg border border-line bg-white/55 p-4">
            <p className="text-[0.75rem] font-extrabold uppercase text-muted">
              Latest run
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {latestRun ? `Level ${latestRun.level}` : '-'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {latestRun
                ? `${formatDuration(latestRun.timeSeconds)} · ${latestRun.moves} moves`
                : 'No completed runs yet'}
            </p>
          </article>
          <article className="rounded-lg border border-line bg-white/55 p-4">
            <p className="text-[0.75rem] font-extrabold uppercase text-muted">
              Best pace
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {bestPaceRun
                ? formatPace(bestPaceRun.timeSeconds, bestPaceRun.level)
                : '-'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {bestPaceRun
                ? `Set on level ${bestPaceRun.level}`
                : 'Complete runs to measure pace'}
            </p>
          </article>
          <article className="rounded-lg border border-line bg-white/55 p-4">
            <p className="text-[0.75rem] font-extrabold uppercase text-muted">
              Recent average
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {recentAverageTime ? formatDuration(recentAverageTime) : '-'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Last {Math.min(scores.length, 3)} runs
            </p>
          </article>
        </div>

        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-start gap-5 max-[980px]:grid-cols-1">
          <div className="grid gap-5">
            <section className="grid gap-4 rounded-lg border border-line bg-white/55 p-4">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">Saved board</h2>
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  Resume point
                </span>
              </div>
              {gameState ? (
                <>
                  <div className="grid grid-cols-3 gap-2.5 max-[620px]:grid-cols-1">
                    <div className="rounded-[7px] border border-line bg-white/60 p-3">
                      <span className="block text-[0.78rem] text-muted">
                        Level
                      </span>
                      <strong className="mt-1 block text-[1.4rem]">
                        {gameState.level}
                      </strong>
                    </div>
                    <div className="rounded-[7px] border border-line bg-white/60 p-3">
                      <span className="block text-[0.78rem] text-muted">
                        Moves
                      </span>
                      <strong className="mt-1 block text-[1.4rem]">
                        {gameState.moves}
                      </strong>
                    </div>
                    <div className="rounded-[7px] border border-line bg-white/60 p-3">
                      <span className="block text-[0.78rem] text-muted">
                        Last save
                      </span>
                      <strong className="mt-1 block text-[1.08rem]">
                        {formatDateTime(gameState.updatedAt)}
                      </strong>
                    </div>
                  </div>
                  <p className="text-sm text-muted">
                    Your signed-in progress is active and ready to continue.
                  </p>
                </>
              ) : (
                <div className="rounded-[7px] border border-dashed border-line bg-white/45 p-4">
                  <p className="leading-normal text-muted">
                    No saved board yet. Start a signed-in run and your progress
                    will appear here automatically.
                  </p>
                </div>
              )}
            </section>

            <div className="grid grid-cols-3 gap-3 max-[620px]:grid-cols-1">
              <article className="rounded-lg border border-line bg-white/55 p-4">
                <p className="text-[0.75rem] font-extrabold uppercase text-muted">
                  Completed runs
                </p>
                <p className="mt-1 text-2xl font-bold">{completedRuns}</p>
              </article>
              <article className="rounded-lg border border-line bg-white/55 p-4">
                <p className="text-[0.75rem] font-extrabold uppercase text-muted">
                  Best level
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {highestCompletedLevel > 0 ? highestCompletedLevel : '-'}
                </p>
              </article>
              <article className="rounded-lg border border-line bg-white/55 p-4">
                <p className="text-[0.75rem] font-extrabold uppercase text-muted">
                  Fastest clear
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {bestRun ? formatDuration(bestRun.timeSeconds) : '-'}
                </p>
              </article>
            </div>

            <section className="grid gap-3 rounded-lg border border-line bg-white/55 p-4">
              <div className="flex items-end justify-between gap-2">
                <h3 className="text-[1.12rem] font-bold">Performance trend</h3>
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  Last {trendRuns.length}
                </span>
              </div>
              {trendRuns.length > 0 ? (
                <div className="grid gap-2.5">
                  {trendRuns.map((run) => {
                    const normalized =
                      1 - (run.pace - minTrendPace) / trendRange;
                    const widthPercent = Math.round(38 + normalized * 62);

                    return (
                      <article className="grid gap-1" key={run.id}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <p className="font-semibold text-foreground">
                            Level {run.level}
                          </p>
                          <p className="text-muted">
                            {formatDateTime(run.timestamp)}
                          </p>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                          <div
                            className="profile-trend-bar h-full rounded-full bg-[linear-gradient(90deg,#6cb34d,#2f7f61)]"
                            style={
                              {
                                '--bar-scale': `${widthPercent / 100}`,
                                animationDelay: `${(trendRuns.length - 1) * 40}ms`,
                              } as React.CSSProperties
                            }
                          />
                        </div>
                        <p className="text-xs text-muted">
                          Pace {run.pace.toFixed(1)}s/lvl
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Complete a few runs to see your recent pace trend.
                </p>
              )}
            </section>

            <section className="grid gap-3 rounded-lg border border-line bg-white/55 p-4">
              <div className="flex items-end justify-between gap-2">
                <h3 className="text-[1.12rem] font-bold">Personal records</h3>
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  Snapshot
                </span>
              </div>
              <div className="grid gap-2.5">
                <article className="rounded-lg border border-line bg-white/60 p-3">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                    Fastest clear
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {bestRun
                      ? `${formatDuration(bestRun.timeSeconds)} on level ${bestRun.level}`
                      : 'No record yet'}
                  </p>
                </article>
                <article className="rounded-lg border border-line bg-white/60 p-3">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                    Best pace run
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {bestPaceRun
                      ? `${formatPace(bestPaceRun.timeSeconds, bestPaceRun.level)} at level ${bestPaceRun.level}`
                      : 'No record yet'}
                  </p>
                </article>
                <article className="rounded-lg border border-line bg-white/60 p-3">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                    Cleanest run
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {cleanestRun
                      ? `${cleanestRun.moves} moves on level ${cleanestRun.level}`
                      : 'No record yet'}
                  </p>
                </article>
              </div>
            </section>
          </div>

          <section className="grid gap-4 rounded-lg border border-line bg-white/55 p-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">Recent runs</h2>
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                Last {scores.length > 10 ? 10 : scores.length}
              </span>
            </div>

            {scores.length > 0 ? (
              <div className="grid gap-2.5">
                {scores.map((score, index) => (
                  <article className="relative pl-4" key={score.id}>
                    <span
                      aria-hidden="true"
                      className={[
                        'absolute left-0 top-5 h-[calc(100%-8px)] w-0.5',
                        index === scores.length - 1 ? 'hidden' : 'bg-line/70',
                      ].join(' ')}
                    />
                    <span
                      aria-hidden="true"
                      className={[
                        'absolute -left-1 top-2 h-2.5 w-2.5 rounded-full border',
                        index === 0
                          ? 'border-accent bg-accent'
                          : 'border-line bg-panel',
                      ].join(' ')}
                    />
                    <div
                      className={[
                        'grid gap-2 rounded-lg border bg-white/60 p-3',
                        index === 0
                          ? 'border-accent/45 shadow-[0_8px_20px_rgba(90,133,63,0.16)]'
                          : 'border-line',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-foreground">
                          Level {score.level}
                        </p>
                        <p className="text-xs font-semibold uppercase text-muted">
                          {formatDateTime(score.completedAt)}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm max-[620px]:grid-cols-1">
                        <p className="rounded-md border border-line bg-white/80 px-2 py-1.5">
                          Time: {formatDuration(score.timeSeconds)}
                        </p>
                        <p className="rounded-md border border-line bg-white/80 px-2 py-1.5">
                          Moves: {score.moves}
                        </p>
                        <p className="rounded-md border border-line bg-white/80 px-2 py-1.5">
                          Pace: {formatPace(score.timeSeconds, score.level)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[7px] border border-dashed border-line bg-white/45 p-4">
                <p className="leading-normal text-muted">
                  Completed levels will show up here after your first finished
                  run.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </section>
  );
}
