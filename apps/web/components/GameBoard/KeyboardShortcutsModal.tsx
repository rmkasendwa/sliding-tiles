'use client';

import { X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type Shortcut = {
  action: string;
  keys: string[];
};

const shortcutGroups: { shortcuts: Shortcut[]; title: string }[] = [
  {
    title: 'Movement',
    shortcuts: [
      {
        action: 'Move a neighboring tile into the empty space',
        keys: ['Arrow Keys'],
      },
      { action: 'Move with WASD', keys: ['W', 'A', 'S', 'D'] },
    ],
  },
  {
    title: 'Puzzle',
    shortcuts: [
      { action: 'Reset Level', keys: ['R'] },
      { action: 'Shuffle Level', keys: ['Shift', 'S'] },
    ],
  },
  {
    title: 'Display',
    shortcuts: [
      { action: 'Enter or exit fullscreen board', keys: ['F'] },
      { action: 'Toggle Theme', keys: ['T'] },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { action: 'Open Help', keys: ['?'] },
      { action: 'Close this reference', keys: ['Esc'] },
    ],
  },
];

function ShortcutKey({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-md border border-line bg-surface px-2 text-xs font-extrabold text-accent-strong shadow-[inset_0_-1px_0_var(--color-line)]">
      {children}
    </kbd>
  );
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('hidden'));
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab' || !dialogRef.current) {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/72 p-3 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
    >
      <button
        aria-label="Close keyboard shortcuts"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 grid max-h-[min(42rem,calc(100svh-2rem))] w-full max-w-2xl overflow-hidden rounded-lg border border-line bg-panel text-foreground shadow-panel"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold leading-tight" id={titleId}>
              Keyboard shortcuts
            </h2>
            <p
              className="mt-1 text-sm font-medium leading-5 text-muted"
              id={descriptionId}
            >
              Desktop controls for the puzzle board.
            </p>
          </div>
          <button
            aria-label="Close keyboard shortcuts"
            className="grid size-9 shrink-0 place-items-center rounded-md border border-line text-accent-strong transition-colors hover:bg-accent/10"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          {shortcutGroups.map((group) => (
            <section className="grid gap-2" key={group.title}>
              <h3 className="text-sm font-extrabold text-accent-strong">
                {group.title}
              </h3>
              <dl className="grid overflow-hidden rounded-lg border border-line">
                {group.shortcuts.map((shortcut) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-line px-3 py-2.5 last:border-b-0 max-[520px]:grid-cols-1 max-[520px]:gap-2"
                    key={`${group.title}-${shortcut.action}`}
                  >
                    <dt className="text-sm font-bold leading-5 text-foreground">
                      {shortcut.action}
                    </dt>
                    <dd className="flex flex-wrap items-center gap-1.5">
                      {shortcut.keys.map((key, index) => (
                        <span
                          className="contents"
                          key={`${shortcut.action}-${key}`}
                        >
                          {index > 0 ? (
                            <span className="text-xs font-bold text-muted">
                              +
                            </span>
                          ) : null}
                          <ShortcutKey>{key}</ShortcutKey>
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
