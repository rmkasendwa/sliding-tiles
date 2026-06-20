import { ChevronDown, Filter } from 'lucide-react';

import type { AdminAnalyticsResponse } from '@/lib/api';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function humanizeEventName(eventName: string) {
  return eventName.replaceAll('_', ' ');
}

export function AdminAnalyticsFilters({
  action,
  eventNames,
  params,
}: {
  action: string;
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
      <summary className="group flex min-h-13 cursor-pointer list-none items-start justify-between gap-3 p-4 marker:hidden">
        <span className="flex min-w-0 items-start gap-2">
          <Filter
            aria-hidden="true"
            className="size-4 text-accent"
            strokeWidth={2.2}
          />
          <span className="grid min-w-0 gap-0.5">
            <span className="text-sm font-extrabold uppercase text-accent-strong leading-none">
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
        action={action}
        className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-3"
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
        <button className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[7px] border border-primary bg-primary px-5 text-sm font-bold text-primary-contrast shadow-button-primary transition hover:bg-primary-strong sm:col-span-2 lg:col-span-3">
          Apply Filters
        </button>
      </form>
    </details>
  );
}
