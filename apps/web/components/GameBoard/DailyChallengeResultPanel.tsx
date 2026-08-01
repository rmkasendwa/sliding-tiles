'use client';

import { BarChart3, Lock, Trophy } from 'lucide-react';

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export type DailyChallengeResult = {
  moves: number;
  rank: number | null;
  timeSeconds: number;
  totalCount: number;
};

export function DailyChallengeResultPanel({
  onViewRankings,
  result,
}: {
  onViewRankings: () => void;
  result: DailyChallengeResult;
}) {
  return (
    <div className="auto-play-result-backdrop absolute inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        aria-describedby="daily-result-summary"
        aria-labelledby="daily-result-title"
        aria-modal="true"
        className="auto-play-result-dialog w-full max-w-md rounded-lg border border-line bg-panel p-5 text-foreground shadow-panel"
        role="dialog"
      >
        <p className="text-xs font-extrabold uppercase text-accent-strong">
          Daily challenge complete
        </p>
        <h2 className="mt-1 text-xl font-extrabold" id="daily-result-title">
          {result.rank ? `You placed #${result.rank}` : 'Score submitted'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted" id="daily-result-summary">
          Your first successful submission is locked for today. Come back after
          the next UTC reset for a fresh shared puzzle.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-line bg-background/70 p-3">
            <Trophy aria-hidden="true" className="size-4 text-accent-strong" />
            <p className="mt-2 text-xs font-bold text-muted">Rank</p>
            <p className="mt-1 text-lg font-extrabold">
              {result.rank ? `#${result.rank}` : '-'}
            </p>
          </div>
          <div className="rounded-md border border-line bg-background/70 p-3">
            <Lock aria-hidden="true" className="size-4 text-accent-strong" />
            <p className="mt-2 text-xs font-bold text-muted">Moves</p>
            <p className="mt-1 text-lg font-extrabold">{result.moves}</p>
          </div>
          <div className="rounded-md border border-line bg-background/70 p-3">
            <BarChart3
              aria-hidden="true"
              className="size-4 text-accent-strong"
            />
            <p className="mt-2 text-xs font-bold text-muted">Time</p>
            <p className="mt-1 text-lg font-extrabold">
              {formatDuration(result.timeSeconds)}
            </p>
          </div>
        </div>

        <button
          autoFocus
          className="mt-5 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong"
          onClick={onViewRankings}
          type="button"
        >
          <BarChart3 aria-hidden="true" className="size-4" />
          View today&apos;s rankings
        </button>
      </div>
    </div>
  );
}
