'use client';

import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Shuffle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { PointerEventHandler } from 'react';

import { GameToolButton } from './GameToolButton';

type GameToolbarProps = {
  columns: number;
  elapsedTimeLabel: string;
  isBoardFullscreen: boolean;
  isCelebrating: boolean;
  isFocusPaused: boolean;
  isMuted: boolean;
  isShuffleAnimationRunning: boolean;
  isSoundEnabled: boolean;
  level: number;
  moves: number;
  onPeekCancel: PointerEventHandler<HTMLButtonElement>;
  onPeekDown: PointerEventHandler<HTMLButtonElement>;
  onPeekLeave: PointerEventHandler<HTMLButtonElement>;
  onPeekUp: PointerEventHandler<HTMLButtonElement>;
  onReset: () => void;
  onShuffle: () => void;
  onToggleFullscreen: () => void;
  onToggleMuted: () => void;
  rows: number;
};

export function GameToolbar({
  columns,
  elapsedTimeLabel,
  isBoardFullscreen,
  isCelebrating,
  isFocusPaused,
  isMuted,
  isShuffleAnimationRunning,
  isSoundEnabled,
  level,
  moves,
  onPeekCancel,
  onPeekDown,
  onPeekLeave,
  onPeekUp,
  onReset,
  onShuffle,
  onToggleFullscreen,
  onToggleMuted,
  rows,
}: GameToolbarProps) {
  const FullscreenIcon = isBoardFullscreen ? Minimize2 : Maximize2;
  const SoundIcon = isMuted ? VolumeX : Volume2;

  return (
    <>
      <div
        aria-label={`Level ${level}, ${columns} by ${rows} grid`}
        className="play-overlay-float board-overlay absolute left-4 top-4 z-40 rounded-[7px] border px-3 py-2 text-sm font-bold text-accent-strong max-[480px]:hidden"
      >
        Level {level} · {columns}x{rows}
      </div>
      {isFocusPaused ? (
        <div
          aria-live="polite"
          className="board-overlay absolute bottom-18 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-[7px] border px-3 py-2 text-center text-xs font-bold text-foreground max-[480px]:bottom-33 max-[480px]:max-w-[calc(100%-2rem)] max-[480px]:whitespace-normal"
          role="status"
        >
          Game paused. Make your next move to continue.
        </div>
      ) : null}
      <div className="absolute inset-x-4 bottom-4 z-40 flex items-end justify-between gap-2 max-[480px]:flex-col max-[480px]:items-stretch">
        <div className="max-[480px]:flex max-[480px]:items-center max-[480px]:justify-center max-[480px]:gap-2">
          <div
            aria-label={`Level ${level}, ${columns} by ${rows} grid`}
            className="board-overlay hidden whitespace-nowrap rounded-[7px] border px-2.5 py-2 text-xs font-bold text-accent-strong max-[480px]:block"
          >
            Level {level} · {columns}x{rows}
          </div>
          <div
            aria-label={`${moves} ${moves === 1 ? 'move' : 'moves'}, elapsed time ${elapsedTimeLabel}`}
            className="play-overlay-float board-overlay self-start whitespace-nowrap rounded-[7px] border px-3 py-2 text-sm font-bold text-accent-strong max-[480px]:self-auto max-[480px]:px-2.5 max-[480px]:text-xs"
          >
            {moves} {moves === 1 ? 'move' : 'moves'} · {elapsedTimeLabel}
          </div>
        </div>
        <div className="board-overlay flex shrink-0 self-end gap-1 rounded-[7px] border p-1 text-accent-strong max-[480px]:self-center">
          <GameToolButton
            aria-label={
              isShuffleAnimationRunning
                ? 'Puzzle is updating'
                : 'Reset current puzzle'
            }
            className={
              isShuffleAnimationRunning ? 'disabled:cursor-wait' : undefined
            }
            description="Return the current puzzle to its starting configuration."
            disabled={isShuffleAnimationRunning}
            icon={
              <RotateCcw
                aria-hidden="true"
                className={[
                  'size-4',
                  isShuffleAnimationRunning
                    ? 'animate-spin motion-reduce:animate-none'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                strokeWidth={2.2}
              />
            }
            onClick={onReset}
            tooltip={
              isShuffleAnimationRunning
                ? 'Updating the puzzle'
                : 'Reset the current puzzle (R)'
            }
            type="button"
          />
          <GameToolButton
            aria-label={
              isShuffleAnimationRunning
                ? 'Puzzle is shuffling'
                : 'Shuffle puzzle'
            }
            className={
              isShuffleAnimationRunning ? 'disabled:cursor-wait' : undefined
            }
            description="Create a new puzzle configuration for this level."
            disabled={isShuffleAnimationRunning}
            icon={
              <Shuffle
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.2}
              />
            }
            onClick={onShuffle}
            tooltip={
              isShuffleAnimationRunning
                ? 'Shuffling the puzzle'
                : 'Shuffle the puzzle (S)'
            }
            type="button"
          />
          {isSoundEnabled ? (
            <GameToolButton
              aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'}
              aria-pressed={!isMuted}
              description={
                isMuted
                  ? 'Enable music and game sound effects.'
                  : 'Mute music and game sound effects.'
              }
              icon={
                <SoundIcon
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2.2}
                />
              }
              onClick={onToggleMuted}
              tooltip={isMuted ? 'Enable game sounds' : 'Mute game sounds'}
              type="button"
            />
          ) : null}
          <GameToolButton
            aria-label="Peek full image"
            className="active:bg-accent/15"
            description="Temporarily reveal the complete puzzle image while pressed."
            disabled={isCelebrating || isShuffleAnimationRunning}
            icon={
              <Search aria-hidden="true" className="size-4" strokeWidth={2.2} />
            }
            onClick={(event) => event.preventDefault()}
            onPointerCancel={onPeekCancel}
            onPointerDown={onPeekDown}
            onPointerLeave={onPeekLeave}
            onPointerUp={onPeekUp}
            tooltip="Hold to preview the full image"
            type="button"
          />
          <GameToolButton
            aria-label={
              isBoardFullscreen
                ? 'Exit fullscreen board'
                : 'Enter fullscreen board'
            }
            description={
              isBoardFullscreen
                ? 'Return the board to the page layout.'
                : 'Expand the board to fill the screen.'
            }
            icon={
              <FullscreenIcon
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.2}
              />
            }
            onClick={onToggleFullscreen}
            tooltip={
              isBoardFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'
            }
            type="button"
          />
        </div>
      </div>
    </>
  );
}
