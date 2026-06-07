'use client';

import { ArrowUpRight, RotateCcw } from 'lucide-react';

export type ReplayPerformance = {
  moves: number;
  timeSeconds: number;
};

export type ReplayResult = {
  latest: ReplayPerformance;
  previousBest: ReplayPerformance;
};

function formatTimeDifference(seconds: number) {
  const absoluteSeconds = Math.abs(seconds);
  return `${absoluteSeconds} ${absoluteSeconds === 1 ? 'second' : 'seconds'}`;
}

function getTimeComparison(result: ReplayResult) {
  const difference =
    result.latest.timeSeconds - result.previousBest.timeSeconds;

  if (difference < 0) {
    return {
      className: 'text-primary-strong',
      label: `${formatTimeDifference(difference)} faster`,
    };
  }
  if (difference > 0) {
    return {
      className: 'text-warning-strong',
      label: `${formatTimeDifference(difference)} slower`,
    };
  }

  return { className: 'text-muted', label: 'Matched your best time' };
}

function getMovesComparison(result: ReplayResult) {
  const difference = result.latest.moves - result.previousBest.moves;
  const absoluteMoves = Math.abs(difference);
  const moveLabel = `${absoluteMoves} ${absoluteMoves === 1 ? 'move' : 'moves'}`;

  if (difference < 0) {
    return {
      className: 'text-primary-strong',
      label: `${moveLabel} fewer`,
    };
  }
  if (difference > 0) {
    return {
      className: 'text-warning-strong',
      label: `${moveLabel} more`,
    };
  }

  return { className: 'text-muted', label: 'Matched your best moves' };
}

export function ReplayResultPanel({
  continueLevel,
  onContinue,
  onReplayAgain,
  result,
}: {
  continueLevel: number;
  onContinue: () => void;
  onReplayAgain: () => void;
  result: ReplayResult;
}) {
  const timeComparison = getTimeComparison(result);
  const movesComparison = getMovesComparison(result);
  const improved =
    result.latest.timeSeconds < result.previousBest.timeSeconds ||
    result.latest.moves < result.previousBest.moves;
  const worsened =
    result.latest.timeSeconds > result.previousBest.timeSeconds ||
    result.latest.moves > result.previousBest.moves;
  const resultHeading =
    improved && worsened
      ? 'A mixed result'
      : improved
        ? 'You set a new best'
        : worsened
          ? 'Behind your previous best'
          : 'You matched your best';

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        aria-describedby="replay-result-summary"
        aria-labelledby="replay-result-title"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-line bg-panel p-5 text-foreground shadow-panel"
        role="dialog"
      >
        <p className="text-xs font-extrabold uppercase text-accent-strong">
          Replay complete
        </p>
        <h2 className="mt-1 text-xl font-extrabold" id="replay-result-title">
          {resultHeading}
        </h2>
        <p className="mt-2 text-sm text-muted" id="replay-result-summary">
          Previous best: {result.previousBest.timeSeconds}s ·{' '}
          {result.previousBest.moves} moves
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-md border border-line bg-background/70 p-3">
            <p className="text-xs font-bold text-muted">Time</p>
            <p className="mt-1 text-lg font-extrabold">
              {result.latest.timeSeconds}s
            </p>
            <p className={`mt-1 text-xs font-bold ${timeComparison.className}`}>
              {timeComparison.label}
            </p>
          </div>
          <div className="rounded-md border border-line bg-background/70 p-3">
            <p className="text-xs font-bold text-muted">Moves</p>
            <p className="mt-1 text-lg font-extrabold">
              {result.latest.moves}
            </p>
            <p className={`mt-1 text-xs font-bold ${movesComparison.className}`}>
              {movesComparison.label}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            autoFocus
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong"
            onClick={onContinue}
            type="button"
          >
            Continue at Level {continueLevel}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </button>
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-extrabold text-foreground transition-colors hover:bg-accent/10"
            onClick={onReplayAgain}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Replay Again
          </button>
        </div>
      </div>
    </div>
  );
}
