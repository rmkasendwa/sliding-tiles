'use client';

import { useMemo, useState } from 'react';

import {
  ShareResultCardCanvas,
  type ShareResultCardData,
} from '@/components/GameBoard/ShareResultCard';

const SAMPLE_COMPLETED_AT = '2026-08-11T12:24:00.000Z';

const samples = [
  {
    label: 'Personal best',
    result: {
      completedAt: SAMPLE_COMPLETED_AT,
      level: 12,
      moves: 84,
      personalBestLabel: 'New personal best',
      timeLabel: '01:18',
    },
  },
  {
    label: 'Replay best',
    result: {
      completedAt: SAMPLE_COMPLETED_AT,
      level: 7,
      moves: 49,
      personalBestLabel: 'Replay best improved',
      timeLabel: '00:42',
    },
  },
  {
    label: 'Regular win',
    result: {
      completedAt: SAMPLE_COMPLETED_AT,
      level: 3,
      moves: 31,
      personalBestLabel: null,
      timeLabel: '00:26',
    },
  },
] satisfies Array<{
  label: string;
  result: ShareResultCardData;
}>;

export function ShareCardLab() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSample = samples[selectedIndex] ?? samples[0];
  const result = useMemo(
    () => selectedSample.result,
    [selectedSample.result],
  );

  return (
    <main className="mx-auto grid min-h-svh w-full max-w-6xl gap-6 px-4 py-8">
      <header className="grid gap-2">
        <p className="text-xs font-extrabold uppercase text-accent-strong">
          Component lab
        </p>
        <h1 className="text-2xl font-extrabold text-foreground">
          Share result card
        </h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {samples.map((sample, index) => (
          <button
            aria-pressed={selectedIndex === index}
            className={[
              'min-h-10 cursor-pointer rounded-md border px-4 text-sm font-extrabold transition-colors',
              selectedIndex === index
                ? 'border-primary bg-primary text-primary-contrast'
                : 'border-line bg-panel text-foreground hover:bg-accent/10',
            ].join(' ')}
            key={sample.label}
            onClick={() => setSelectedIndex(index)}
            type="button"
          >
            {sample.label}
          </button>
        ))}
      </div>

      <section
        aria-label={`${selectedSample.label} share card preview`}
        className="grid gap-3"
      >
        <ShareResultCardCanvas result={result} />
        <dl className="grid gap-2 rounded-lg border border-line bg-panel p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="font-bold text-muted">Level</dt>
            <dd className="mt-1 font-extrabold text-foreground">
              {result.level}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-muted">Time</dt>
            <dd className="mt-1 font-extrabold text-foreground">
              {result.timeLabel}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-muted">Moves</dt>
            <dd className="mt-1 font-extrabold text-foreground">
              {result.moves}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-muted">Indicator</dt>
            <dd className="mt-1 font-extrabold text-foreground">
              {result.personalBestLabel ?? 'Level completed'}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
