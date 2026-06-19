'use client';

import { Home, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { reportApplicationError } from '@/lib/error-reporting';
import { routes } from '@/lib/routes';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportApplicationError(error, 'Application route error');
  }, [error]);

  return (
    <ErrorState
      actions={[
        {
          icon: RotateCcw,
          label: 'Try again',
          onClick: reset,
          tone: 'primary',
        },
        { href: routes.home, icon: Home, label: 'Home', tone: 'secondary' },
      ]}
      eyebrow="Sliding Tiles"
      message="Something went wrong while loading this part of the game. Try again, or return home and keep playing from there."
      status="500"
      title="The board slipped"
    />
  );
}
