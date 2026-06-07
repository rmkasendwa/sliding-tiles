'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type GameToolButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  description: string;
  icon: ReactNode;
  tooltip: string;
};

export function GameToolButton({
  'aria-describedby': ariaDescribedBy,
  className = '',
  description,
  icon,
  onBlur,
  onFocus,
  onPointerCancel,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onPointerUp,
  tooltip,
  ...buttonProps
}: GameToolButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTouchInteractionRef = useRef(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const descriptionId = useId();
  const tooltipId = useId();
  const describedBy = [descriptionId, ariaDescribedBy]
    .filter(Boolean)
    .join(' ');
  const showTooltip = () => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const bounds = button.getBoundingClientRect();
    setTooltipPosition({
      left: Math.min(
        window.innerWidth - 112,
        Math.max(112, bounds.left + bounds.width / 2),
      ),
      top: bounds.top - 8,
    });
  };
  const hideTooltip = () => setTooltipPosition(null);

  return (
    <span className="relative inline-grid">
      <button
        {...buttonProps}
        aria-describedby={describedBy}
        className={[
          'grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-line transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent max-[480px]:h-11 max-[480px]:w-11',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onBlur={(event) => {
          hideTooltip();
          isTouchInteractionRef.current = false;
          onBlur?.(event);
        }}
        onFocus={(event) => {
          if (!isTouchInteractionRef.current) {
            showTooltip();
          }
          onFocus?.(event);
        }}
        onPointerCancel={(event) => {
          hideTooltip();
          onPointerCancel?.(event);
        }}
        onPointerDown={(event) => {
          isTouchInteractionRef.current = event.pointerType !== 'mouse';
          if (isTouchInteractionRef.current) {
            hideTooltip();
          }
          onPointerDown?.(event);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') {
            isTouchInteractionRef.current = false;
            showTooltip();
          }
          onPointerEnter?.(event);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            hideTooltip();
          }
          onPointerLeave?.(event);
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse') {
            hideTooltip();
          }
          onPointerUp?.(event);
        }}
        ref={buttonRef}
      >
        {icon}
        <span className="sr-only" id={descriptionId}>
          {description}
        </span>
      </button>
      {tooltipPosition
        ? createPortal(
            <span
              className="pointer-events-none fixed z-100 w-max max-w-52 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs font-bold leading-snug text-foreground shadow-panel"
              id={tooltipId}
              role="tooltip"
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top,
              }}
            >
              {tooltip}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
