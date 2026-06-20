import { humanizeAnalyticsEventName } from '@/lib/admin';
import { AdminAnalyticsEvent } from '@/lib/api';
import { AdminEventMetadata } from './AdminEventMetadata';
import { RelativeTimestamp } from './RelativeTimestap';

export type AdminAnalyticsEventsTableProps = {
  events: AdminAnalyticsEvent[];
};

export function AdminAnalyticsEventsList({
  events,
}: AdminAnalyticsEventsTableProps) {
  const renderedAt = new Date().getTime();

  return (
    <>
      <div className="grid gap-3 p-3 lg:hidden">
        {events.map((event) => (
          <article
            className="grid gap-3 rounded-[7px] border border-line bg-panel p-3"
            key={event.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="grid min-w-0 gap-1">
                <h3 className="truncate text-sm font-black text-foreground">
                  {humanizeAnalyticsEventName(event.eventName)}
                </h3>
                <p
                  className="max-w-full truncate font-mono text-xs text-muted"
                  title={event.sessionId}
                >
                  {event.sessionId}
                </p>
              </div>
              <time
                className="shrink-0 text-xs font-bold text-muted"
                dateTime={event.occurredAt}
                suppressHydrationWarning
              >
                <RelativeTimestamp
                  isoDate={event.occurredAt}
                  now={renderedAt}
                />
              </time>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-[7px] border border-line bg-surface px-3 py-2">
                <dt className="text-xs font-extrabold uppercase text-muted">
                  Level
                </dt>
                <dd className="font-bold text-foreground">
                  {event.level ?? 'n/a'}
                </dd>
              </div>
              <div className="rounded-[7px] border border-line bg-surface px-3 py-2">
                <dt className="text-xs font-extrabold uppercase text-muted">
                  Board
                </dt>
                <dd className="font-bold text-foreground">
                  {event.puzzleSize ?? 'n/a'}
                </dd>
              </div>
            </dl>

            <AdminEventMetadata event={event} />
          </article>
        ))}
      </div>

      <table className="hidden w-full min-w-245 border-collapse text-left text-sm lg:table">
        <thead className="sticky top-18.25 z-10 bg-panel text-xs uppercase text-muted">
          <tr>
            <th className="min-w-47.5 px-4 py-3">Event</th>
            <th className="px-4 py-3">Session</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3">Board</th>
            <th className="px-4 py-3">Metadata</th>
            <th className="w-50 px-4 py-3">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {events.map((event) => (
            <tr key={event.id}>
              <td className="px-4 py-3 font-bold">
                {humanizeAnalyticsEventName(event.eventName)}
              </td>
              <td className="max-w-52 truncate px-4 py-3 font-mono text-xs text-muted">
                {event.sessionId}
              </td>
              <td className="px-4 py-3 text-muted">{event.level ?? 'n/a'}</td>
              <td className="px-4 py-3 text-muted">
                {event.puzzleSize ?? 'n/a'}
              </td>
              <td className="px-4 py-3">
                <AdminEventMetadata event={event} />
              </td>
              <td className="px-4 py-3 text-muted" suppressHydrationWarning>
                <RelativeTimestamp
                  isoDate={event.occurredAt}
                  now={renderedAt}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
