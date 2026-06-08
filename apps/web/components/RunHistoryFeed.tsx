'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

import type { ApiRun, ApiRunPage } from '@/lib/api';

import { RunHistoryList } from './RunHistoryList';

type RunFilter = 'all' | 'original' | 'replay';
type CachedRunPage = {
  nextCursor: string | null;
  runs: ApiRun[];
};

const filters: { label: string; value: RunFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Original', value: 'original' },
  { label: 'Replay', value: 'replay' },
];

function RunHistorySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid gap-2.5">
      {Array.from({ length: count }, (_, index) => (
        <div className="relative pl-7 sm:pl-4" key={index}>
          <span className="absolute left-1.5 top-2 size-2.5 rounded-full bg-line shadow-sm sm:-left-1" />
          <span className="absolute left-2.5 top-5 h-[calc(100%-8px)] w-0.5 bg-line/85 sm:left-0 sm:bg-line/70" />
          <div className="grid gap-3 rounded-lg border border-line bg-surface/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-2">
                <span className="h-4 w-24 animate-pulse rounded bg-line/70 motion-reduce:animate-none" />
                <span className="h-3 w-36 animate-pulse rounded bg-line/55 motion-reduce:animate-none" />
              </div>
              <span className="h-7 w-20 animate-pulse rounded-full bg-line/60 motion-reduce:animate-none" />
            </div>
            <div className="grid grid-cols-3 gap-2 max-[620px]:grid-cols-1">
              {Array.from({ length: 3 }, (_, metricIndex) => (
                <span
                  className="h-9 animate-pulse rounded-md bg-line/50 motion-reduce:animate-none"
                  key={metricIndex}
                />
              ))}
            </div>
            <span className="h-14 animate-pulse rounded-md bg-line/45 motion-reduce:animate-none" />
            <span className="h-9 w-32 animate-pulse rounded-md bg-line/60 motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RunHistoryFeed({
  initialFilter,
  initialPage,
}: {
  initialFilter: RunFilter;
  initialPage: ApiRunPage;
}) {
  const [filter, setFilter] = useState<RunFilter>(initialFilter);
  const [runs, setRuns] = useState<ApiRun[]>(initialPage.scores);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Partial<Record<RunFilter, CachedRunPage>>>({
    [initialFilter]: {
      nextCursor: initialPage.nextCursor,
      runs: initialPage.scores,
    },
  });
  const activeFilterRef = useRef(initialFilter);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const isReplacing = isLoading && runs.length === 0;

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
        const cachedRuns = cacheRef.current[selectedFilter]?.runs ?? [];
        const nextRuns = replace
          ? page.scores
          : [
              ...cachedRuns,
              ...page.scores.filter(
                (run) => !cachedRuns.some((item) => item.id === run.id),
              ),
            ];
        cacheRef.current[selectedFilter] = {
          nextCursor: page.nextCursor,
          runs: nextRuns,
        };

        if (activeFilterRef.current === selectedFilter) {
          setRuns(nextRuns);
          setNextCursor(page.nextCursor);
        }
      } catch {
        if (
          requestId === requestIdRef.current &&
          activeFilterRef.current === selectedFilter
        ) {
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
    activeFilterRef.current = nextFilter;
    setFilter(nextFilter);
    setError(null);

    const url = new URL(window.location.href);
    url.searchParams.set('filter', nextFilter);
    window.history.replaceState(window.history.state, '', url);

    const cachedPage = cacheRef.current[nextFilter];
    if (cachedPage) {
      setRuns(cachedPage.runs);
      setNextCursor(cachedPage.nextCursor);
      setIsLoading(false);
      return;
    }

    setRuns([]);
    setNextCursor(null);
    void loadPage({ replace: true, selectedFilter: nextFilter });
  };

  const handleFilterClick = (
    event: MouseEvent<HTMLAnchorElement>,
    nextFilter: RunFilter,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    selectFilter(nextFilter);
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
          <Link
            aria-current={filter === item.value ? 'page' : undefined}
            className={[
              'inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-bold transition-colors',
              filter === item.value
                ? 'bg-primary text-primary-contrast shadow-button-primary'
                : 'text-muted hover:bg-accent/10 hover:text-foreground',
            ].join(' ')}
            href={`/runs?filter=${item.value}`}
            key={item.value}
            onClick={(event) => handleFilterClick(event, item.value)}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {runs.length > 0 ? (
        <RunHistoryList runs={runs} />
      ) : isReplacing ? (
        <RunHistorySkeleton count={4} />
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-surface/50 p-8 text-center">
          <h2 className="text-xl font-bold">No runs found</h2>
          <p className="mt-2 text-sm text-muted">
            Completed runs matching this filter will appear here.
          </p>
        </div>
      )}

      {isLoading && runs.length > 0 ? <RunHistorySkeleton count={2} /> : null}

      <div
        aria-live="polite"
        className="grid min-h-12 place-items-center text-sm font-bold text-muted"
        ref={loadMoreRef}
        role="status"
      >
        {isLoading
          ? 'Loading more runs...'
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
