'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type ProgressState = 'complete' | 'loading';

function getUrlKey(url: URL) {
  return `${url.pathname}${url.search}`;
}

function shouldStartProgress(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) {
    return false;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }

  const anchor = target.closest('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) {
    return false;
  }

  const targetValue = anchor.getAttribute('target');
  if (targetValue && targetValue !== '_self') {
    return false;
  }

  if (anchor.hasAttribute('download')) {
    return false;
  }

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) {
    return false;
  }

  const nextUrl = new URL(anchor.href, window.location.href);
  if (nextUrl.origin !== window.location.origin) {
    return false;
  }

  const currentUrl = new URL(window.location.href);
  const isSamePage = getUrlKey(nextUrl) === getUrlKey(currentUrl);

  return !isSamePage;
}

export function RouteProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<ProgressState>('complete');
  const startedUrlKeyRef = useRef<string | null>(null);
  const completeTimeoutRef = useRef<number | null>(null);
  const historyCompleteTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (completeTimeoutRef.current !== null) {
      window.clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }

    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (historyCompleteTimeoutRef.current !== null) {
      window.clearTimeout(historyCompleteTimeoutRef.current);
      historyCompleteTimeoutRef.current = null;
    }

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const completeProgress = useCallback(() => {
    if (!startedUrlKeyRef.current) {
      return;
    }

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startedUrlKeyRef.current = null;
    setProgress(100);
    setState('complete');

    hideTimeoutRef.current = window.setTimeout(() => {
      setProgress(0);
      hideTimeoutRef.current = null;
    }, 180);
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    startedUrlKeyRef.current = getUrlKey(new URL(window.location.href));
    setState('loading');
    setProgress(8);

    completeTimeoutRef.current = window.setTimeout(() => {
      setProgress(42);
      completeTimeoutRef.current = null;
    }, 80);

    intervalRef.current = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 88) {
          return value;
        }

        return value + Math.max(2, (90 - value) * 0.12);
      });
    }, 220);
  }, [clearTimers]);

  const scheduleCompleteProgress = useCallback(() => {
    if (historyCompleteTimeoutRef.current !== null) {
      window.clearTimeout(historyCompleteTimeoutRef.current);
    }

    historyCompleteTimeoutRef.current = window.setTimeout(() => {
      completeProgress();
      historyCompleteTimeoutRef.current = null;
    }, 0);
  }, [completeProgress]);

  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      scheduleCompleteProgress();
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      scheduleCompleteProgress();
      return result;
    };

    const handleClick = (event: MouseEvent) => {
      if (!shouldStartProgress(event)) {
        return;
      }

      startProgress();
    };

    const handlePopState = () => {
      startProgress();
    };

    window.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
      clearTimers();
    };
  }, [clearTimers, scheduleCompleteProgress, startProgress]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      completeProgress();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [completeProgress, pathname]);

  return (
    <div
      aria-hidden="true"
      className={[
        'pointer-events-none fixed left-0 top-0 z-1000 h-0.5 w-full overflow-hidden bg-transparent',
        progress > 0 ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <div
        className={[
          'h-full origin-left bg-accent shadow-[0_0_12px_rgba(37,111,90,0.42)] transition-[opacity,transform] duration-200 ease-out',
          state === 'loading' ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
