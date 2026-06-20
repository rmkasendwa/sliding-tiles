'use client';

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { useState } from 'react';

type AdminEventTrendBarProps = {
  dateLabel: string;
  delta: number | null;
  eventLabel: string;
  max: number;
  value: number;
};

export function AdminEventTrendBar({
  dateLabel,
  delta,
  eventLabel,
  max,
  value,
}: AdminEventTrendBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { context, floatingStyles, refs } = useFloating({
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ['top', 'bottom', 'left', 'right'],
        padding: 12,
      }),
      shift({ padding: 12 }),
    ],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
  });
  const setFloating = refs.setFloating;
  const setReference = refs.setReference;
  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getFloatingProps, getReferenceProps } = useInteractions([
    hover,
    focus,
    role,
  ]);

  return (
    <div className="relative flex h-10 items-end justify-center">
      <button
        aria-label={`${eventLabel}, ${dateLabel}, ${value} events`}
        className="block w-full cursor-default rounded-t-[3px] bg-accent/70 transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
        // eslint-disable-next-line react-hooks/refs -- Floating UI exposes stable callback refs for render assignment.
        ref={setReference}
        style={{
          height: `${Math.max(10, (value / max) * 100)}%`,
        }}
        type="button"
        {...getReferenceProps()}
      />
      {isOpen ? (
        <div
          className="z-50 min-w-36 rounded-lg border border-line bg-surface p-2 text-xs shadow-panel"
          // eslint-disable-next-line react-hooks/refs -- Floating UI exposes stable callback refs for render assignment.
          ref={setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <div className="grid gap-1">
            <p className="font-extrabold uppercase text-accent-strong">
              {dateLabel}
            </p>
            <p className="text-muted">{eventLabel}</p>
            <p className="text-lg font-black leading-none text-foreground">
              {value.toLocaleString()}
            </p>
            <p className="text-muted">
              {delta === null ? (
                'Start of range'
              ) : (
                <>
                  vs prior day:{' '}
                  <strong
                    className={
                      delta >= 0 ? 'text-success-strong' : 'text-danger'
                    }
                  >
                    {delta >= 0 ? '+' : ''}
                    {delta.toLocaleString()}
                  </strong>
                </>
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
