'use client';

import {
  Gauge,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Pause,
  Play,
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
  isAutoPlayActive: boolean;
  isAutoPlayBlocked: boolean;
  isAutoPlaySolving: boolean;
  autoPlaySpeed: {
    delayMs: number;
    fastestDelayMs: number;
    slowestDelayMs: number;
  };
  autoPlayStats: {
    elapsedMs: number;
    moves: number;
  };
  autoPlayStatusMessage: string | null;
  isShuffleAnimationRunning: boolean;
  isSoundEnabled: boolean;
  level: number;
  moves: number;
  onAutoPlayToggle: () => void;
  onAutoPlaySpeedChange: (delayMs: number) => void;
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
  isAutoPlayActive,
  isAutoPlayBlocked,
  isAutoPlaySolving,
  autoPlaySpeed,
  autoPlayStats,
  autoPlayStatusMessage,
  isShuffleAnimationRunning,
  isSoundEnabled,
  level,
  moves,
  onAutoPlayToggle,
  onAutoPlaySpeedChange,
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
  const AutoPlayIcon = isAutoPlaySolving
    ? LoaderCircle
    : isAutoPlayActive
      ? Pause
      : Play;
  const controlsLocked = isShuffleAnimationRunning || isAutoPlayActive;
  const speedPercent = Math.round(
    ((autoPlaySpeed.slowestDelayMs - autoPlaySpeed.delayMs) /
      (autoPlaySpeed.slowestDelayMs - autoPlaySpeed.fastestDelayMs)) *
      100,
  );
  const isAutoPlayAssisted =
    isAutoPlaySolving ||
    isAutoPlayActive ||
    autoPlayStats.moves > 0 ||
    autoPlayStats.elapsedMs > 0;
  const autoPlaySeconds = Math.floor(autoPlayStats.elapsedMs / 1000);
  const autoPlayTimeLabel = `${Math.floor(autoPlaySeconds / 60)}:${String(
    autoPlaySeconds % 60,
  ).padStart(2, '0')}`;

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
      {isAutoPlayAssisted ? (
        <div
          aria-live="polite"
          className="board-overlay absolute left-1/2 top-4 z-40 max-w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 rounded-[7px] border px-3 py-2 text-center text-xs font-bold leading-snug text-accent-strong max-[480px]:top-17"
          role="status"
        >
          {isAutoPlaySolving
            ? 'Auto Play is planning a route. The board is still responsive.'
            : isAutoPlayActive
              ? 'Auto Play demo active. Moves are not ranked. Pause anytime.'
              : 'Auto Play paused. This attempt is still AI-assisted.'}
        </div>
      ) : null}
      {autoPlayStatusMessage ? (
        <div
          aria-live="polite"
          className="board-overlay absolute left-1/2 top-4 z-40 max-w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-[7px] border px-3 py-2 text-center text-xs font-bold leading-snug text-warning-strong max-[480px]:top-17"
          role="status"
        >
          {autoPlayStatusMessage}
        </div>
      ) : null}
      <div className="absolute inset-x-4 bottom-4 z-40 flex items-end justify-between gap-2 max-[560px]:flex-col max-[560px]:items-stretch">
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
        <div className="board-overlay flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1 self-end rounded-[7px] border p-1 text-accent-strong max-[560px]:w-full max-[560px]:justify-center max-[560px]:self-center">
          <GameToolButton
            aria-label={
              controlsLocked ? 'Puzzle is updating' : 'Reset current puzzle'
            }
            className={controlsLocked ? 'disabled:cursor-wait' : undefined}
            description="Return the current puzzle to its starting configuration."
            disabled={controlsLocked}
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
              controlsLocked
                ? 'Updating the puzzle'
                : 'Reset the current puzzle (R)'
            }
            type="button"
          />
          <GameToolButton
            aria-label={
              controlsLocked ? 'Puzzle is shuffling' : 'Shuffle puzzle'
            }
            className={controlsLocked ? 'disabled:cursor-wait' : undefined}
            description="Create a new puzzle configuration for this level."
            disabled={controlsLocked}
            icon={
              <Shuffle
                aria-hidden="true"
                className="size-4"
                strokeWidth={2.2}
              />
            }
            onClick={onShuffle}
            tooltip={
              controlsLocked ? 'Shuffling the puzzle' : 'Shuffle the puzzle (S)'
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
            aria-label={
              isAutoPlayActive
                ? 'Pause Auto Play'
                : isAutoPlaySolving
                  ? 'Auto Play is planning'
                : isAutoPlayAssisted
                  ? 'Resume Auto Play'
                  : 'Start Auto Play'
            }
            aria-pressed={isAutoPlayActive}
            className={
              isAutoPlayActive ? 'bg-accent/15 text-accent-strong' : ''
            }
            description={
              isAutoPlayActive
                ? 'Pause the AI demonstration.'
                : isAutoPlaySolving
                  ? 'Wait for the AI to finish planning this route.'
                : isAutoPlayAssisted
                  ? 'Continue the AI demonstration from the current board.'
                  : 'Let the built-in AI solve the current puzzle.'
            }
            disabled={
              isAutoPlaySolving || (!isAutoPlayActive && isAutoPlayBlocked)
            }
            icon={
              <AutoPlayIcon
                aria-hidden="true"
                className={[
                  'size-4',
                  isAutoPlaySolving
                    ? 'animate-spin motion-reduce:animate-none'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                strokeWidth={2.2}
              />
            }
            onClick={onAutoPlayToggle}
            tooltip={
              isAutoPlayActive
                ? 'Pause Auto Play'
                : isAutoPlaySolving
                  ? 'Planning Auto Play'
                : isAutoPlayAssisted
                  ? 'Resume Auto Play'
                  : 'Auto Play'
            }
            type="button"
          />
          <GameToolButton
            aria-label="Peek full image"
            className="active:bg-accent/15"
            description="Temporarily reveal the complete puzzle image while pressed."
            disabled={isCelebrating || controlsLocked}
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
          {isAutoPlayAssisted ? (
            <label className="flex h-8 min-w-0 flex-[1_1_9.5rem] items-center gap-2 rounded-md border border-line px-2 text-accent-strong max-[560px]:order-last max-[560px]:h-11 max-[560px]:basis-full">
              <Gauge
                aria-hidden="true"
                className="size-4 shrink-0"
                strokeWidth={2.2}
              />
              <span className="sr-only">Auto Play speed</span>
              <input
                aria-label="Auto Play speed"
                className="h-4 min-w-0 flex-1 cursor-pointer accent-(--color-accent)"
                max={100}
                min={0}
                onChange={(event) => {
                  const nextPercent = Number(event.currentTarget.value);
                  const nextDelay =
                    autoPlaySpeed.slowestDelayMs -
                    ((autoPlaySpeed.slowestDelayMs -
                      autoPlaySpeed.fastestDelayMs) *
                      nextPercent) /
                      100;

                  onAutoPlaySpeedChange(nextDelay);
                }}
                step={5}
                type="range"
                value={speedPercent}
              />
              <output
                aria-label={`Auto Play speed ${speedPercent} percent`}
                className="w-8 shrink-0 text-right text-[0.68rem] font-extrabold tabular-nums"
              >
                {speedPercent}%
              </output>
            </label>
          ) : null}
          {isAutoPlayAssisted ? (
            <div
              aria-label={`Auto Play assisted moves ${autoPlayStats.moves}, assisted time ${autoPlayTimeLabel}`}
              className="flex h-8 shrink-0 items-center rounded-md border border-line px-2 text-[0.68rem] font-extrabold tabular-nums text-accent-strong max-[560px]:order-last max-[560px]:h-11"
            >
              AI {autoPlayStats.moves} · {autoPlayTimeLabel}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
