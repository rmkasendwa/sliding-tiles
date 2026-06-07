import Link from 'next/link';
import type { ReactNode } from 'react';

import type { ApiRun } from '@/lib/api';
import { routes } from '@/lib/routes';

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
  return `${(timeSeconds / Math.max(level, 1)).toFixed(1)}s/lvl`;
}

export function RunHistoryList({
  continuation,
  runs,
}: {
  continuation?: ReactNode;
  runs: ApiRun[];
}) {
  return (
    <div className="grid gap-2.5">
      {runs.map((run, index) => {
        return (
          <article className="relative pl-4" key={run.id}>
            <span
              aria-hidden="true"
              className={[
                'absolute left-0 top-5 w-0.5',
                index === runs.length - 1 && !continuation
                  ? 'hidden'
                  : index === runs.length - 1
                    ? 'h-[calc(100%+10px)] bg-line/70'
                    : 'h-[calc(100%-8px)] bg-line/70',
              ].join(' ')}
            />
            <span
              aria-hidden="true"
              className={[
                'absolute -left-1 top-2 h-2.5 w-2.5 rounded-full border',
                index === 0
                  ? 'border-primary bg-primary'
                  : run.attemptType === 'replay'
                    ? 'border-info bg-info'
                    : 'border-warning bg-warning',
              ].join(' ')}
            />
            <div
              className={[
                'grid gap-2 rounded-lg border p-3',
                run.attemptType === 'replay'
                  ? 'border-info/22 bg-info-surface'
                  : 'border-accent/22 bg-surface/70',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Level {run.level}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold uppercase text-muted">
                    {formatDateTime(run.completedAt)}
                  </p>
                </div>
                <span
                  className={[
                    'rounded-full border px-2.5 py-1 text-[0.7rem] font-extrabold uppercase',
                    run.attemptType === 'replay'
                      ? 'border-info/26 bg-info-soft/80 text-info-strong'
                      : 'border-accent/22 bg-primary-soft/76 text-accent-strong',
                  ].join(' ')}
                >
                  {run.attemptType === 'replay' ? 'Replay' : 'Original'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm max-[620px]:grid-cols-1">
                <p className="rounded-md border border-line bg-surface/80 px-2 py-1.5">
                  Time: {formatDuration(run.timeSeconds)}
                </p>
                <p className="rounded-md border border-line bg-surface/80 px-2 py-1.5">
                  Moves: {run.moves}
                </p>
                <p className="rounded-md border border-line bg-surface/80 px-2 py-1.5">
                  Pace: {formatPace(run.timeSeconds, run.level)}
                </p>
              </div>
              <div className="grid gap-2 rounded-md border border-line bg-surface/70 px-2.5 py-2 text-xs text-muted">
                <p>
                  Level best:{' '}
                  <span className="font-bold text-foreground">
                    {run.levelBest
                      ? `${formatDuration(run.levelBest.timeSeconds)} · ${run.levelBest.moves} moves`
                      : 'Pending'}
                  </span>
                </p>
                {run.replayComparison ? (
                  <p
                    className={[
                      'font-bold',
                      run.replayComparison.startsWith('Improved')
                        ? 'text-primary-strong'
                        : run.replayComparison.startsWith('Behind')
                          ? 'text-warning-strong'
                          : 'text-info-strong',
                    ].join(' ')}
                  >
                    Replay result: {run.replayComparison}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {run.canReplay ? (
                  <Link
                    className="inline-flex min-h-9 items-center justify-center rounded-[7px] border border-primary bg-primary px-3 text-sm font-bold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong"
                    href={`${routes.play}?replay=${encodeURIComponent(run.id)}`}
                  >
                    Replay Level
                  </Link>
                ) : (
                  <span className="inline-flex min-h-9 items-center justify-center rounded-[7px] border border-line bg-surface/70 px-3 text-sm font-bold text-muted">
                    Replay unavailable
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
      {continuation ? (
        <div className="relative pl-4">
          <span
            aria-hidden="true"
            className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-info bg-info"
          />
          {continuation}
        </div>
      ) : null}
    </div>
  );
}
