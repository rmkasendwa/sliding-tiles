'use client';

import { useEffect } from 'react';

import { BoardState, Slot, slotKey } from '@/lib/board';

function isEditableKeyboardTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
      ),
    )
  );
}

type GameKeyboardControlsOptions = {
  board: BoardState;
  isInteractionBlocked: boolean;
  movableSlotKeys: ReadonlySet<string>;
  onMove: (slot: Slot) => void;
  onOpenShortcuts: () => void;
  onReset: () => void;
  onShuffle: () => void;
  onToggleTheme: () => void;
  onToggleFullscreen: () => void;
};

export function useGameKeyboardControls({
  board,
  isInteractionBlocked,
  movableSlotKeys,
  onMove,
  onOpenShortcuts,
  onReset,
  onShuffle,
  onToggleTheme,
  onToggleFullscreen,
}: GameKeyboardControlsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isEditableKeyboardTarget(event.target) ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
        isInteractionBlocked
      ) {
        return;
      }

      const [row, column] = board.emptySlot;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const slotToMove: Slot | null = (() => {
        switch (key) {
          case 'ArrowUp':
          case 'w':
            return [row + 1, column];
          case 'ArrowRight':
          case 'd':
            return [row, column - 1];
          case 'ArrowDown':
          case 's':
            return [row - 1, column];
          case 'ArrowLeft':
          case 'a':
            return [row, column + 1];
          default:
            return null;
        }
      })();

      if (slotToMove && movableSlotKeys.has(slotKey(slotToMove))) {
        event.preventDefault();
        onMove(slotToMove);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board.emptySlot, isInteractionBlocked, movableSlotKeys, onMove]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableKeyboardTarget(event.target) ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches
      ) {
        return;
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (key === '?') {
        event.preventDefault();
        onOpenShortcuts();
        return;
      }

      switch (key) {
        case 'r':
          if (event.shiftKey) {
            return;
          }
          if (isInteractionBlocked) {
            return;
          }
          event.preventDefault();
          onReset();
          break;
        case 's':
          if (!event.shiftKey) {
            return;
          }
          if (isInteractionBlocked) {
            return;
          }
          event.preventDefault();
          onShuffle();
          break;
        case 'f':
          if (event.shiftKey) {
            return;
          }
          if (isInteractionBlocked) {
            return;
          }
          event.preventDefault();
          onToggleFullscreen();
          break;
        case 't':
          if (event.shiftKey) {
            return;
          }
          if (isInteractionBlocked) {
            return;
          }
          event.preventDefault();
          onToggleTheme();
          break;
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [
    isInteractionBlocked,
    onOpenShortcuts,
    onReset,
    onShuffle,
    onToggleFullscreen,
    onToggleTheme,
  ]);
}
