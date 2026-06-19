import type { Metadata } from 'next';

import { NotFoundErrorState } from '@/components/ErrorState';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  description:
    'The requested Sliding Tiles page could not be found. Return home, play a puzzle, or view the leaderboard.',
  title: `Page Not Found | ${siteConfig.name}`,
};

export default function NotFound() {
  return <NotFoundErrorState />;
}
