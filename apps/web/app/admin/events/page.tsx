import {
  ChevronDown,
  ChevronRight,
  Filter,
  MousePointerClick,
} from 'lucide-react';
import Link from 'next/link';

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

function EventsFilters({
  eventNames,
  params,
}: {
  eventNames: AdminAnalyticsResponse['eventNames'];
  params: Record<string, string | string[] | undefined>;
}) {
  const selectedEvent = getParam(params.eventName) ?? '';
  const hasActiveFilters = [
    'boardSize',
    'dateFrom',
    'dateTo',
    'eventName',
    'level',
    'sessionId',
  ].some((key) => Boolean(getParam(params[key])));

  return (
    <details className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
      <summary className="group flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-4 marker:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <Filter
            aria-hidden="true"
            className="size-4 text-accent"
            strokeWidth={2.2}
          />
          <span className="grid min-w-0 gap-0.5">
            <span className="text-sm font-extrabold uppercase text-accent-strong">
              Filters are collapsed
            </span>
            <span className="truncate text-xs font-bold text-muted">
              {hasActiveFilters
                ? 'Some filters are active. Expand to review or change them.'
                : 'Expand to filter by event, date, level, board size, or session.'}
            </span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-panel px-2.5 py-1 text-xs font-bold text-foreground">
          Expand
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 transition-transform group-open:rotate-180"
            strokeWidth={2.2}
          />
        </span>
      </summary>
      <form
        action={routes.adminEvents}
        className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 min-[1180px]:grid-cols-6 min-[1180px]:items-end"
      >
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          Event type
          <select
            className="min-h-11 min-w-0 rounded-[7px] border border-line bg-panel px-3 text-base outline-none focus:border-accent"
            defaultValue={selectedEvent}
            name="eventName"
          >
            <option value="">All events</option>
            {eventNames.map((eventName) => (
              <option key={eventName} value={eventName}>
                {humanizeEventName(eventName)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          From
          <input
            className="min-h-11 min-w-0 rounded-[7px] border border-line bg-panel px-3 text-base outline-none focus:border-accent"
            defaultValue={getParam(params.dateFrom) ?? ''}
            name="dateFrom"
            type="date"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          To
          <input
            className="min-h-11 min-w-0 rounded-[7px] border border-line bg-panel px-3 text-base outline-none focus:border-accent"
            defaultValue={getParam(params.dateTo) ?? ''}
            name="dateTo"
            type="date"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          Level
          <input
            className="min-h-11 min-w-0 rounded-[7px] border border-line bg-panel px-3 text-base outline-none focus:border-accent"
            defaultValue={getParam(params.level) ?? ''}
            min="1"
            name="level"
            type="number"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          Board size
          <input
            className="min-h-11 min-w-0 rounded-[7px] border border-line bg-panel px-3 text-base outline-none focus:border-accent"
            defaultValue={getParam(params.boardSize) ?? ''}
            name="boardSize"
            placeholder="4x4"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-bold">
          Session ID
          <input
            className="min-h-11 min-w-0 rounded-[7px] border border-line bg-panel px-3 text-base outline-none focus:border-accent"
            defaultValue={getParam(params.sessionId) ?? ''}
            name="sessionId"
            placeholder="UUID"
          />
        </label>
        <button className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[7px] border border-primary bg-primary px-5 text-sm font-bold text-primary-contrast shadow-button-primary transition hover:bg-primary-strong sm:col-span-2 min-[1180px]:col-span-6">
          Apply Filters
        </button>
      </form>
    </details>
  );
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
      <EventsFilters eventNames={analytics.eventNames} params={params} />

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
