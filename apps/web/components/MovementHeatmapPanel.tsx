'use client';

import { Activity, MoveRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ApiMovementHeatmap } from '@/lib/api';

function formatSlot([row, column]: [number, number]) {
  return `R${row + 1} C${column + 1}`;
}

export function MovementHeatmapPanel({
  heatmaps,
  sampleLimitPerLevel,
}: {
  heatmaps: ApiMovementHeatmap[];
  sampleLimitPerLevel: number;
}) {
  const populatedHeatmaps = heatmaps.filter(
    (heatmap) => heatmap.sampleSize > 0 && heatmap.dimensions[0] > 0,
  );
  const [selectedLevel, setSelectedLevel] = useState(
    populatedHeatmaps[0]?.level ?? heatmaps[0]?.level ?? 1,
  );
  const activeHeatmap = useMemo(
    () =>
      populatedHeatmaps.find((heatmap) => heatmap.level === selectedLevel) ??
      populatedHeatmaps[0] ??
      null,
    [populatedHeatmaps, selectedLevel],
  );

  if (populatedHeatmaps.length === 0 || !activeHeatmap) {
    return null;
  }

  const [columns] = activeHeatmap.dimensions;
  const topTransitions = activeHeatmap.transitions.slice(0, 5);

  return (
    <section
      aria-labelledby="movement-heatmap-heading"
      className="profile-reveal overflow-hidden rounded-lg border border-info/18 bg-panel shadow-panel"
      style={{ animationDelay: '125ms' }}
    >
      <header className="grid gap-3 border-b border-info/16 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-info)_18%,transparent),color-mix(in_srgb,var(--color-warning)_12%,transparent),color-mix(in_srgb,var(--color-surface)_45%,transparent))] px-4 py-3 min-[760px]:grid-cols-[minmax(0,1fr)_auto] min-[760px]:items-center">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[0.74rem] font-extrabold uppercase text-info-strong">
            <Activity aria-hidden="true" className="size-4" />
            Movement heatmap
          </p>
          <h2
            className="mt-1 text-xl font-bold leading-tight text-foreground"
            id="movement-heatmap-heading"
          >
            Common paths by level
          </h2>
        </div>
        <div
          aria-label="Choose heatmap level"
          className="flex flex-wrap gap-1.5"
          role="tablist"
        >
          {populatedHeatmaps.map((heatmap) => {
            const isSelected = heatmap.level === activeHeatmap.level;

            return (
              <button
                aria-selected={isSelected}
                className={[
                  'min-h-9 rounded-[7px] border px-3 text-sm font-bold transition-colors',
                  isSelected
                    ? 'border-info bg-info text-primary-contrast'
                    : 'border-info/22 bg-surface/72 text-info-strong hover:bg-info-soft',
                ].join(' ')}
                key={heatmap.level}
                onClick={() => setSelectedLevel(heatmap.level)}
                role="tab"
                type="button"
              >
                Level {heatmap.level}
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid gap-5 p-4 min-[900px]:grid-cols-[minmax(260px,0.85fr)_minmax(0,1fr)]">
        <div>
          <div
            aria-label={`Level ${activeHeatmap.level} tile movement heatmap`}
            className="grid gap-1.5 rounded-lg border border-line bg-surface p-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {activeHeatmap.cells.map((cell) => {
              const alpha = 0.12 + cell.intensity * 0.72;
              const isEmpty = cell.moveCount === 0;

              return (
                <div
                  aria-label={`${formatSlot(cell.slot)} moved ${cell.moveCount} times`}
                  className="grid aspect-square min-h-11 place-items-center rounded-md border text-center text-[0.72rem] font-extrabold leading-none"
                  key={cell.slot.join(',')}
                  style={{
                    backgroundColor: isEmpty
                      ? 'color-mix(in srgb, var(--color-surface), var(--color-muted) 7%)'
                      : `color-mix(in srgb, var(--color-warning) ${Math.round(alpha * 100)}%, var(--color-info-soft))`,
                    borderColor: isEmpty
                      ? 'var(--color-line)'
                      : 'color-mix(in srgb, var(--color-warning), var(--color-info) 35%)',
                    color: isEmpty
                      ? 'var(--color-muted)'
                      : 'var(--color-foreground)',
                  }}
                  title={`${formatSlot(cell.slot)}: ${cell.moveCount} moves`}
                >
                  {cell.moveCount}
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <p className="rounded-md border border-info/18 bg-info-soft px-2 py-1.5">
              {activeHeatmap.sampleSize}/{sampleLimitPerLevel} runs
            </p>
            <p className="rounded-md border border-warning/24 bg-warning-soft px-2 py-1.5">
              {activeHeatmap.totalMoves} moves
            </p>
            <p className="rounded-md border border-accent/18 bg-primary-soft px-2 py-1.5">
              {activeHeatmap.averageMoves} avg
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[0.74rem] font-extrabold uppercase text-muted">
            Strongest movement links
          </p>
          <ol className="mt-2 grid gap-2">
            {topTransitions.map((transition, index) => (
              <li
                className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-line bg-surface/70 px-3 py-2"
                key={`${transition.from.join(',')}-${transition.to.join(',')}`}
              >
                <span className="text-sm font-bold text-muted">
                  #{index + 1}
                </span>
                <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{formatSlot(transition.from)}</span>
                  <MoveRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-info-strong"
                  />
                  <span>{formatSlot(transition.to)}</span>
                </span>
                <span className="rounded-md bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning-strong">
                  {transition.count}
                </span>
              </li>
            ))}
          </ol>
          {topTransitions.length === 0 ? (
            <p className="mt-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
              More completed paths will make transitions visible here.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
