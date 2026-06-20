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
    <table className="w-full min-w-245 border-collapse text-left text-sm">
      <thead className="bg-panel text-xs uppercase text-muted sticky top-18.25 z-10">
        <tr>
          <th className="px-4 py-3 min-w-47.5">Event</th>
          <th className="px-4 py-3">Session</th>
          <th className="px-4 py-3">Level</th>
          <th className="px-4 py-3">Board</th>
          <th className="px-4 py-3">Metadata</th>
          <th className="px-4 py-3 w-50">Timestamp</th>
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
              <RelativeTimestamp isoDate={event.occurredAt} now={renderedAt} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
