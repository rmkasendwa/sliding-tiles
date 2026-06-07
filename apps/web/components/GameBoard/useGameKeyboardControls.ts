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
  onReset: () => void;
  onShuffle: () => void;
  onToggleFullscreen: () => void;
};

export function useGameKeyboardControls({
  board,
  isInteractionBlocked,
  movableSlotKeys,
  onMove,
  onReset,
  onShuffle,
  onToggleFullscreen,
}: GameKeyboardControlsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
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

      switch (event.key.toLowerCase()) {
        case 'r':
          event.preventDefault();
          onReset();
          break;
        case 's':
          event.preventDefault();
          onShuffle();
          break;
        case 'f':
          event.preventDefault();
          onToggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [onReset, onShuffle, onToggleFullscreen]);
}
