'use client';

import { RotateCcw, Shuffle } from 'lucide-react';

type AutoPlayResultPanelProps = {
  level: number;
  onReset: () => void;
  onShuffle: () => void;
};

export function AutoPlayResultPanel({
  level,
  onReset,
  onShuffle,
}: AutoPlayResultPanelProps) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        aria-describedby="auto-play-result-summary"
        aria-labelledby="auto-play-result-title"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-line bg-panel p-5 text-foreground shadow-panel"
        role="dialog"
      >
        <p className="text-xs font-extrabold uppercase text-accent-strong">
          Auto Play complete
        </p>
        <h2 className="mt-1 text-xl font-extrabold" id="auto-play-result-title">
          The AI solved Level {level}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted" id="auto-play-result-summary">
          This was a demonstration solve, so it was not saved, ranked, or counted
          toward personal bests. The board stays here so you can study the final
          layout.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            autoFocus
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong"
            onClick={onReset}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Try this puzzle
          </button>
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-extrabold text-foreground transition-colors hover:bg-accent/10"
            onClick={onShuffle}
            type="button"
          >
            <Shuffle aria-hidden="true" className="size-4" />
            New shuffle
          </button>
        </div>
      </div>
    </div>
  );
}
