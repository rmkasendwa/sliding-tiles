'use client';

import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { reportApplicationError } from '@/lib/error-reporting';
import { themeInitScript } from '@/lib/theme';

import './globals.css';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    reportApplicationError(error, 'Global application error');
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ErrorState
          actions={[
            {
              icon: RefreshCw,
              label: 'Reload page',
              onClick: () => window.location.reload(),
              tone: 'primary',
            },
          ]}
          eyebrow="Sliding Tiles"
          message="The app hit an unexpected snag. Reload the page to get a fresh board without exposing any technical details here."
          status="Error"
          title="Something needs a reset"
        />
      </body>
    </html>
  );
}
