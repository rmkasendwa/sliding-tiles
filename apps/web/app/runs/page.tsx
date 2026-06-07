import { redirect } from 'next/navigation';

import { RunHistoryFeed } from '@/components/RunHistoryFeed';
import { type ApiRunPage, apiRequest } from '@/lib/api';
import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export const metadata = pageMetadata.runs;

export default async function RunsPage() {
  const session = await getSession();
  if (!session) {
    redirect(routes.login);
  }

  const initialPage = await apiRequest<ApiRunPage>(
    '/leaderboard/mine?take=12',
  );

  return (
    <section className="page-rail mx-auto grid w-full max-w-240 gap-5 py-6 sm:py-8">
      <header className="grid gap-2 border-b border-line pb-4">
        <p className="text-xs font-extrabold uppercase text-accent-strong">
          Performance archive
        </p>
        <h1 className="text-[clamp(2rem,6vw,3.6rem)] leading-tight">
          Run History
        </h1>
        <p className="max-w-2xl text-muted">
          Review every completed puzzle, compare replay performance, and return
          to any saved configuration.
        </p>
      </header>

      <RunHistoryFeed initialPage={initialPage} />
    </section>
  );
}
