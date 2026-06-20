import { ChevronRight, MousePointerClick } from 'lucide-react';
import Link from 'next/link';

import { AdminAnalyticsEventsList } from '@/components/AdminAnalyticsEventsList';
import { AdminAnalyticsFilters } from '@/components/AdminAnalyticsFilters';
import { buildAnalyticsEventsQuery } from '@/lib/admin';
import type { AdminAnalyticsResponse } from '@/lib/api';
import { apiRequest } from '@/lib/api';
import { routes } from '@/lib/routes';

type AdminEventsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const params = (await searchParams) ?? {};
  const query = buildAnalyticsEventsQuery(params, '50');
  const analytics = await apiRequest<AdminAnalyticsResponse>(
    `/admin/analytics?${query}`,
  );
  const nextQuery = buildAnalyticsEventsQuery(params, '50', false);
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

      <section className="rounded-lg border border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <MousePointerClick
              aria-hidden="true"
              className="size-5 text-accent"
            />
            <h2 className="text-xl">Recent Events</h2>
          </div>
        </div>
        <AdminAnalyticsEventsList events={analytics.recentEvents} />
        {analytics.nextCursor ? (
          <div className="border-t border-line p-4 text-right sticky bottom-0 bg-surface rounded-b-lg">
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
