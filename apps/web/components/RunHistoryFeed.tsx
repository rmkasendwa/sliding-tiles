'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApiRun, ApiRunPage } from '@/lib/api';

import { RunHistoryList } from './RunHistoryList';

type RunFilter = 'all' | 'original' | 'replay';

const filters: { label: string; value: RunFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Original', value: 'original' },
  { label: 'Replay', value: 'replay' },
];

export function RunHistoryFeed({
  initialPage,
}: {
  initialPage: ApiRunPage;
}) {
  const [filter, setFilter] = useState<RunFilter>('all');
  const [runs, setRuns] = useState<ApiRun[]>(initialPage.scores);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    async ({
      cursor,
      replace = false,
      selectedFilter = filter,
    }: {
      cursor?: string | null;
      replace?: boolean;
      selectedFilter?: RunFilter;
    } = {}) => {
      if (isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      try {
        const params = new URLSearchParams({ take: '12' });
        if (cursor) {
          params.set('cursor', cursor);
        }
        if (selectedFilter !== 'all') {
          params.set('attemptType', selectedFilter);
        }

        const response = await fetch(`/api/runs?${params}`);
        if (!response.ok) {
          throw new Error('Unable to load run history.');
        }
        const page = (await response.json()) as ApiRunPage;
        if (requestId !== requestIdRef.current) {
          return;
        }
        setRuns((current) =>
          replace
            ? page.scores
            : [
                ...current,
                ...page.scores.filter(
                  (run) => !current.some((item) => item.id === run.id),
                ),
              ],
        );
        setNextCursor(page.nextCursor);
      } catch {
        if (requestId === requestIdRef.current) {
          setError('Unable to load more runs right now.');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [filter],
  );

  const selectFilter = (nextFilter: RunFilter) => {
    if (nextFilter === filter) {
      return;
    }
    requestIdRef.current += 1;
    isLoadingRef.current = false;
    setFilter(nextFilter);
    setRuns([]);
    setNextCursor(null);
    void loadPage({ replace: true, selectedFilter: nextFilter });
  };

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !nextCursor || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadPage({ cursor: nextCursor });
        }
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isLoading, loadPage, nextCursor]);

  return (
    <div className="grid gap-5">
      <div
        aria-label="Filter run history"
        className="inline-grid w-fit grid-cols-3 rounded-[7px] border border-line bg-panel p-1"
        role="group"
      >
        {filters.map((item) => (
          <button
            aria-pressed={filter === item.value}
            className={[
              'min-h-10 cursor-pointer rounded-md px-4 text-sm font-bold transition-colors',
              filter === item.value
                ? 'bg-primary text-primary-contrast shadow-button-primary'
                : 'text-muted hover:bg-accent/10 hover:text-foreground',
            ].join(' ')}
            key={item.value}
            onClick={() => selectFilter(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {runs.length > 0 ? (
        <RunHistoryList runs={runs} />
      ) : !isLoading ? (
        <div className="rounded-lg border border-dashed border-line bg-surface/50 p-8 text-center">
          <h2 className="text-xl font-bold">No runs found</h2>
          <p className="mt-2 text-sm text-muted">
            Completed runs matching this filter will appear here.
          </p>
        </div>
      ) : null}

      <div
        aria-live="polite"
        className="grid min-h-12 place-items-center text-sm font-bold text-muted"
        ref={loadMoreRef}
        role="status"
      >
        {isLoading
          ? 'Loading runs...'
          : error
            ? error
            : nextCursor
              ? 'Scroll for more'
              : runs.length > 0
                ? 'You reached the end of your run history.'
                : ''}
      </div>

      {error ? (
        <button
          className="mx-auto min-h-10 cursor-pointer rounded-[7px] border border-line bg-panel px-4 text-sm font-bold text-foreground hover:bg-accent/10"
          onClick={() => void loadPage({ cursor: nextCursor })}
          type="button"
        >
          Try Again
        </button>
      ) : null}
    </div>
  );
}
