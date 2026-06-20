import { BarChart3, ChevronRight, MousePointerClick } from 'lucide-react';
import Link from 'next/link';

import { AdminAnalyticsEventsList } from '@/components/AdminAnalyticsEventsList';
import { AdminAnalyticsFilters } from '@/components/AdminAnalyticsFilters';
import { buildAnalyticsEventsQuery } from '@/lib/admin';
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

function formatMetric(
  value: number | null,
  type: 'duration' | 'number' | 'percent' = 'number',
) {
  if (value === null) {
    return 'n/a';
  }

  if (type === 'percent') {
    return `${value.toFixed(1)}%`;
  }

  if (type === 'duration') {
    const seconds = Math.round(value / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

function humanizeEventName(eventName: string) {
  return eventName.replaceAll('_', ' ');
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
              {formatMetric(analytics.metrics[metric.key], metric.type)}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="rounded-lg border border-line bg-surface p-4 shadow-panel">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 aria-hidden="true" className="size-5 text-accent" />
            <h2 className="text-xl">Event Counts</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {analytics.eventCounts.map((event) => (
              <div
                className="grid gap-2 rounded-[7px] border border-line bg-panel px-3 py-2"
                key={event.eventName}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <span className="truncate text-sm font-bold">
                    {humanizeEventName(event.eventName)}
                  </span>
                  <span className="text-sm font-black">
                    {event.count.toLocaleString()}
                  </span>
                </div>
                <div
                  className="grid h-8 grid-cols-7 items-end gap-1"
                  aria-hidden="true"
                >
                  {event.trend.map((value, index) => {
                    const max = Math.max(...event.trend, 1);
                    return (
                      <span
                        className="rounded-t-[3px] bg-accent/70"
                        key={`${event.eventName}-${index}`}
                        style={{
                          height: `${Math.max(10, (value / max) * 100)}%`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
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
