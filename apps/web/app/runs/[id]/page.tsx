import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ApiRequestError, type ApiPublicRun, apiRequest } from '@/lib/api';
import { siteUrl } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { siteConfig } from '@/lib/site';

type SharedRunPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

async function getSharedRun(runId: string) {
  try {
    return await apiRequest<ApiPublicRun>(
      `/leaderboard/runs/${encodeURIComponent(runId)}`,
      { token: null },
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

function getRunTitle(run: ApiPublicRun) {
  return `${run.user.name} solved Level ${run.level}`;
}

function getRunDescription(run: ApiPublicRun) {
  return [
    `${formatDuration(run.timeSeconds)} active time`,
    `${run.moves} moves`,
    run.attemptType === 'replay' ? 'replay attempt' : 'original attempt',
  ].join(' · ');
}

export async function generateMetadata({
  params,
}: SharedRunPageProps): Promise<Metadata> {
  const { id } = await params;
  const run = await getSharedRun(id);
  const title = `${getRunTitle(run)} | ${siteConfig.name}`;
  const description = getRunDescription(run);
  const path = `${routes.runs}/${encodeURIComponent(id)}`;

  return {
    alternates: {
      canonical: path,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: `${siteConfig.name} shared run for Level ${run.level}`,
          height: 630,
          url: '/og/runs.png',
          width: 1200,
        },
      ],
      siteName: siteConfig.name,
      title,
      type: 'article',
      url: path,
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: [
        {
          alt: `${siteConfig.name} shared run for Level ${run.level}`,
          url: '/og/runs.png',
        },
      ],
      title,
    },
  };
}

export default async function SharedRunPage({ params }: SharedRunPageProps) {
  const { id } = await params;
  const run = await getSharedRun(id);
  const [columns, rows] = run.puzzle.dimensions ?? [null, null];
  const canonicalUrl = new URL(
    `${routes.runs}/${encodeURIComponent(id)}`,
    siteUrl,
  ).toString();

  return (
    <section className="page-rail mx-auto grid w-full max-w-300 gap-5 py-5">
      <header className="grid gap-4 border-b border-line pb-5">
        <p className="text-xs font-extrabold uppercase text-accent-strong">
          Shared run
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ProfileAvatar
            avatarUrl={run.user.avatarUrl}
            name={run.user.name}
            size={56}
          />
          <div>
            <h1 className="text-[clamp(2rem,6vw,3.6rem)] leading-tight">
              Level {run.level} Solved
            </h1>
            <p className="text-muted">
              {run.user.name} completed this puzzle on{' '}
              {formatDateTime(run.completedAt)}.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-3 rounded-lg border border-line bg-panel p-4 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">Completion Stats</h2>
            <span className="rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-xs font-extrabold uppercase text-accent-strong">
              {run.attemptType === 'replay' ? 'Replay' : 'Original'}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <p className="rounded-md border border-line bg-surface/80 px-3 py-2">
              <span className="block text-xs font-extrabold uppercase text-muted">
                Active time
              </span>
              <span className="text-lg font-extrabold">
                {formatDuration(run.timeSeconds)}
              </span>
            </p>
            <p className="rounded-md border border-line bg-surface/80 px-3 py-2">
              <span className="block text-xs font-extrabold uppercase text-muted">
                Total time
              </span>
              <span className="text-lg font-extrabold">
                {formatDuration(run.totalTimeSeconds ?? run.timeSeconds)}
              </span>
            </p>
            <p className="rounded-md border border-line bg-surface/80 px-3 py-2">
              <span className="block text-xs font-extrabold uppercase text-muted">
                Moves
              </span>
              <span className="text-lg font-extrabold">{run.moves}</span>
            </p>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-line bg-surface/70 p-3">
              <dt className="font-extrabold text-muted">Paused time</dt>
              <dd>{formatDuration(run.pausedDurationSeconds)}</dd>
            </div>
            <div className="rounded-md border border-line bg-surface/70 p-3">
              <dt className="font-extrabold text-muted">Shared URL</dt>
              <dd className="truncate">{canonicalUrl}</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-3 rounded-lg border border-line bg-panel p-4 shadow-panel">
          <h2 className="text-xl font-extrabold">Puzzle Details</h2>
          <div className="grid gap-2 text-sm">
            <p className="rounded-md border border-line bg-surface/80 px-3 py-2">
              Level: <span className="font-extrabold">{run.puzzle.level}</span>
            </p>
            <p className="rounded-md border border-line bg-surface/80 px-3 py-2">
              Grid:{' '}
              <span className="font-extrabold">
                {columns && rows ? `${columns} x ${rows}` : 'Unavailable'}
              </span>
            </p>
            <p className="rounded-md border border-line bg-surface/80 px-3 py-2">
              Tiles:{' '}
              <span className="font-extrabold">
                {run.puzzle.tileCount ?? 'Unavailable'}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-primary bg-primary px-4 text-sm font-bold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong"
              href={routes.play}
            >
              Play Sliding Tiles
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-line bg-panel px-4 text-sm font-bold text-foreground transition-colors hover:bg-accent/10"
              href={routes.leaderboard}
            >
              View Leaderboard
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
