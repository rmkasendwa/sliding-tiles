import { ChevronRight, MousePointerClick } from 'lucide-react';
import Link from 'next/link';

import { AdminAnalyticsFilters } from '@/components/AdminAnalyticsFilters';
import { AdminEventMetadata } from '@/components/AdminEventMetadata';
import type { AdminAnalyticsResponse } from '@/lib/api';
import { apiRequest } from '@/lib/api';
import { routes } from '@/lib/routes';

type AdminEventsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function humanizeEventName(eventName: string) {
  return eventName.replaceAll('_', ' ');
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function buildQuery(
  params: Record<string, string | string[] | undefined>,
  includeCursor = true,
) {
  const query = new URLSearchParams({ take: '50' });
  for (const key of [
    'boardSize',
    ...(includeCursor ? ['cursor'] : []),
    'dateFrom',
    'dateTo',
    'eventName',
    'level',
    'sessionId',
  ]) {
    const value = getParam(params[key]);
    if (value) {
      query.set(key, value);
    }
  }

  return query;
}

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const params = (await searchParams) ?? {};
  const query = buildQuery(params);
  const analytics = await apiRequest<AdminAnalyticsResponse>(
    `/admin/analytics?${query}`,
  );
  const nextQuery = buildQuery(params, false);
  if (analytics.nextCursor) {
    nextQuery.set('cursor', analytics.nextCursor);
  }

  return (
    <div className="grid gap-5">
      <AdminAnalyticsFilters
        action={routes.adminAnalytics}
        eventNames={analytics.eventNames}
        params={params}
      />

      <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <MousePointerClick
              aria-hidden="true"
              className="size-5 text-accent"
            />
            <h2 className="text-xl">Recent Events</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-245 border-collapse text-left text-sm">
            <thead className="bg-panel text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Board</th>
                <th className="px-4 py-3">Metadata</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {analytics.recentEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 font-bold">
                    {humanizeEventName(event.eventName)}
                  </td>
                  <td className="max-w-52 truncate px-4 py-3 font-mono text-xs text-muted">
                    {event.sessionId}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {event.level ?? 'n/a'}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {event.puzzleSize ?? 'n/a'}
                  </td>
                  <td className="px-4 py-3">
                    <AdminEventMetadata event={event} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <time dateTime={event.occurredAt}>
                      {formatDateTime(event.occurredAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {analytics.nextCursor ? (
          <div className="border-t border-line p-4 text-right">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border border-line bg-panel px-3 text-sm font-bold text-foreground shadow-sm transition hover:border-accent/50 hover:text-accent-strong"
              href={`${routes.adminEvents}?${nextQuery}`}
            >
              Next Page
              <ChevronRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.2}
              />
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
