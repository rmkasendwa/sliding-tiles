import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Link2,
  MousePointerClick,
} from 'lucide-react';
import Link from 'next/link';

import { AdminAnalyticsEventsList } from '@/components/AdminAnalyticsEventsList';
import { AdminAnalyticsFilters } from '@/components/AdminAnalyticsFilters';
import { AdminEventTrendBar } from '@/components/AdminEventTrendBar';
import {
  buildAnalyticsEventsQuery,
  formatAnalyticsMetric,
  humanizeAnalyticsEventName,
} from '@/lib/admin';
import type { AdminAnalyticsResponse } from '@/lib/api';
import { apiRequest } from '@/lib/api';
import { routes } from '@/lib/routes';

type AdminAnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const metricLabels: Array<{
  key: keyof AdminAnalyticsResponse['metrics'];
  label: string;
  type?: 'duration' | 'number' | 'percent';
}> = [
  { key: 'totalAnonymousSessions', label: 'Total anonymous sessions' },
  { key: 'gamesStarted', label: 'Games started' },
  { key: 'gamesCompleted', label: 'Games completed' },
  { key: 'completionRate', label: 'Completion rate', type: 'percent' },
  { key: 'averageMovesPerCompletedGame', label: 'Avg moves / completed game' },
  {
    key: 'averageActivePlayTimeMs',
    label: 'Avg active play time',
    type: 'duration',
  },
  {
    key: 'averageTotalPlayTimeMs',
    label: 'Avg total play time',
    type: 'duration',
  },
  { key: 'autoPlayUsage', label: 'Auto Play usage' },
  { key: 'replayUsage', label: 'Replay usage' },
  { key: 'peekImageUsage', label: 'Peek image usage' },
  { key: 'leaderboardViews', label: 'Leaderboard views' },
  { key: 'signupClicks', label: 'Signup clicks' },
];

function getTrendDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 6 + index);
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  });
}

function EventCountCard({
  event,
  trendDays,
}: {
  event: AdminAnalyticsResponse['eventCounts'][number];
  trendDays: string[];
}) {
  const max = Math.max(...event.trend, 1);
  const eventLabel = humanizeAnalyticsEventName(event.eventName);

  return (
    <div className="grid gap-2 rounded-[7px] border border-line bg-panel px-3 py-2 transition hover:border-accent/45 hover:bg-accent/5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <span className="truncate text-sm font-bold">{eventLabel}</span>
        <span className="text-sm font-black">
          {event.count.toLocaleString()}
        </span>
      </div>
      <div className="grid h-10 grid-cols-7 items-end gap-1 pt-2">
        {event.trend.map((value, index) => {
          const previousValue = index > 0 ? event.trend[index - 1] : null;
          const delta =
            previousValue === null ? null : value - previousValue;

          return (
            <AdminEventTrendBar
              dateLabel={trendDays[index] ?? 'n/a'}
              delta={delta}
              eventLabel={eventLabel}
              key={`${event.eventName}-${index}`}
              max={max}
              value={value}
            />
          );
        })}
      </div>
    </div>
  );
}

function GoogleAuthStat({
  label,
  value,
  tone = 'text-foreground',
}: {
  label: string;
  tone?: string;
  value: number | string;
}) {
  return (
    <article className="min-w-0 rounded-[7px] border border-line bg-panel px-3 py-2">
      <p className="truncate whitespace-nowrap text-xs font-extrabold uppercase text-muted">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black leading-none ${tone}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </article>
  );
}

function CountList({
  emptyLabel,
  items,
}: {
  emptyLabel: string;
  items: Record<string, number>;
}) {
  const entries = Object.entries(items).filter(([, count]) => count > 0);

  if (entries.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([name, count]) => (
        <span
          className="inline-flex min-h-8 items-center gap-2 rounded-full border border-line bg-panel px-3 text-xs font-bold text-foreground"
          key={name}
        >
          <span className="text-muted">{name.replaceAll('_', ' ')}</span>
          <span>{count.toLocaleString()}</span>
        </span>
      ))}
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  const params = (await searchParams) ?? {};
  const query = buildAnalyticsEventsQuery(params);
  const analytics = await apiRequest<AdminAnalyticsResponse>(
    `/admin/analytics?${query}`,
  );
  const eventQuery = buildAnalyticsEventsQuery(params, '50');
  const trendDays = getTrendDays();

  return (
    <div className="grid gap-5">
      <AdminAnalyticsFilters
        action={routes.adminAnalytics}
        eventNames={analytics.eventNames}
        params={params}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metricLabels.map((metric) => (
          <article
            className="rounded-lg border border-line bg-surface p-4 shadow-panel"
            key={metric.key}
          >
            <p className="text-xs font-extrabold uppercase text-muted">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-black leading-none text-foreground">
              {formatAnalyticsMetric(
                analytics.metrics[metric.key],
                metric.type,
              )}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="rounded-lg border border-line bg-surface p-4 shadow-panel">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound aria-hidden="true" className="size-5 text-accent" />
            <h2 className="text-xl">Google Auth</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <GoogleAuthStat
              label="Started"
              value={analytics.googleAuth.started}
            />
            <GoogleAuthStat
              label="Completed"
              tone="text-success-strong"
              value={analytics.googleAuth.completed}
            />
            <GoogleAuthStat
              label="Failed"
              tone="text-danger"
              value={analytics.googleAuth.failed}
            />
            <GoogleAuthStat
              label="Success rate"
              value={formatAnalyticsMetric(
                analytics.googleAuth.successRate,
                'percent',
              )}
            />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="grid gap-3 rounded-[7px] border border-line bg-panel p-3">
              <div className="flex items-center gap-2">
                <MousePointerClick
                  aria-hidden="true"
                  className="size-4 text-accent"
                />
                <h3 className="text-sm font-black">Entry Points</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <GoogleAuthStat
                  label="Login starts"
                  value={analytics.googleAuth.startedByEntryPoint.login}
                />
                <GoogleAuthStat
                  label="Signup starts"
                  value={analytics.googleAuth.startedByEntryPoint.signup}
                />
                <GoogleAuthStat
                  label="Anonymous completions"
                  value={analytics.googleAuth.anonymousProgressCompletions}
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-[7px] border border-line bg-panel p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  aria-hidden="true"
                  className="size-4 text-success-strong"
                />
                <h3 className="text-sm font-black">Completed Outcomes</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <GoogleAuthStat
                  label="New accounts"
                  value={analytics.googleAuth.outcomes.new_account ?? 0}
                />
                <GoogleAuthStat
                  label="Existing Google"
                  value={
                    analytics.googleAuth.outcomes
                      .existing_google_account ?? 0
                  }
                />
                <GoogleAuthStat
                  label="Linked account"
                  value={
                    analytics.googleAuth.outcomes
                      .linked_existing_account ?? 0
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-[7px] border border-line bg-panel p-3">
              <div className="flex items-center gap-2">
                <Link2 aria-hidden="true" className="size-4 text-info-strong" />
                <h3 className="text-sm font-black">Completed By Entry</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <GoogleAuthStat
                  label="Login"
                  value={analytics.googleAuth.completedByEntryPoint.login}
                />
                <GoogleAuthStat
                  label="Signup"
                  value={analytics.googleAuth.completedByEntryPoint.signup}
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-[7px] border border-line bg-panel p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  aria-hidden="true"
                  className="size-4 text-danger"
                />
                <h3 className="text-sm font-black">Failures</h3>
              </div>
              <CountList
                emptyLabel="No Google auth failures in this view."
                items={analytics.googleAuth.failureCategories}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-4 shadow-panel">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 aria-hidden="true" className="size-5 text-accent" />
            <h2 className="text-xl">Event Counts</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {analytics.eventCounts.map((event) => (
              <EventCountCard
                event={event}
                key={event.eventName}
                trendDays={trendDays}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <MousePointerClick
                aria-hidden="true"
                className="size-5 text-accent"
              />
              <h2 className="text-xl">Recent Events</h2>
            </div>
            <Link
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[7px] border border-line bg-panel px-3 text-sm font-bold text-foreground shadow-sm transition hover:border-accent/50 hover:text-accent-strong"
              href={`${routes.adminEvents}?${eventQuery}`}
            >
              View All
              <ChevronRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.2}
              />
            </Link>
          </div>
          <AdminAnalyticsEventsList events={analytics.recentEvents} />
        </div>
      </section>
    </div>
  );
}
