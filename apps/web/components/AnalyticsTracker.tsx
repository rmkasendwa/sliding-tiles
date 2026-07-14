'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { useAnonymousGameplayAnalytics } from './GameBoard/useAnonymousGameplayAnalytics';

type AnalyticsTrackerProps = {
  userId?: string;
};

function getRouteViewEvent(pathname: string) {
  if (pathname === '/') {
    return 'landing_page_view' as const;
  }
  if (pathname === '/leaderboard') {
    return 'leaderboard_viewed' as const;
  }
  if (pathname === '/profile') {
    return 'profile_viewed' as const;
  }
  if (pathname === '/runs') {
    return 'runs_history_viewed' as const;
  }

  return null;
}

export function AnalyticsTracker({ userId }: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const isSignedIn = Boolean(userId);
  const { track } = useAnonymousGameplayAnalytics(isSignedIn);
  const startedSessionRef = useRef(false);

  useEffect(() => {
    if (!startedSessionRef.current) {
      startedSessionRef.current = true;
      track('session_started', {
        metadata: { signedIn: isSignedIn },
      });
    }

    const eventName = getRouteViewEvent(pathname);
    if (eventName) {
      track(eventName);
    }
  }, [isSignedIn, pathname, track]);

  useEffect(() => {
    const endSession = () =>
      track(
        'session_ended',
        { metadata: { signedIn: isSignedIn } },
        { immediate: true },
      );

    window.addEventListener('pagehide', endSession);
    return () => window.removeEventListener('pagehide', endSession);
  }, [isSignedIn, track]);

  return null;
}
