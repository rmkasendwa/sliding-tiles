'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { routes } from '@/lib/routes';

export function FooterLeaderboardCta() {
  const pathname = usePathname();
  const isLeaderboardPage =
    pathname === routes.leaderboard ||
    pathname.startsWith(`${routes.leaderboard}/`);

  if (isLeaderboardPage) {
    return null;
  }

  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border border-primary bg-primary px-4 text-sm font-bold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong"
      href={routes.leaderboard}
    >
      View Leaderboard <span aria-hidden="true">&rarr;</span>
    </Link>
  );
}
