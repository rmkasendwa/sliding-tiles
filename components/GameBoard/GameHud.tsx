import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { SolutionImage } from './SolutionPreview';

type GameHudProps = {
  columns: number;
  isFullscreen: boolean;
  isMuted: boolean;
  level: number;
  moves: number;
  onOpenDetails: () => void;
  onRestart: () => void;
  onToggleFullscreen: () => void;
  onToggleMuted: () => void;
  rows: number;
  variant: 'compact' | 'fullscreen';
};

export function GameHud({
  columns,
  isFullscreen,
  isMuted,
  level,
  moves,
  onOpenDetails,
  onRestart,
  onToggleFullscreen,
  onToggleMuted,
  rows,
  variant,
}: GameHudProps) {
  const SoundIcon = isMuted ? VolumeX : Volume2;
  const FullscreenIcon = isFullscreen ? Minimize2 : Maximize2;
  const moveLabel = `${moves} ${moves === 1 ? 'move' : 'moves'}`;

  if (variant === 'fullscreen') {
    return (
      <div className="fullscreen-game-hud">
        <button
          aria-label="Open run details"
          className="fullscreen-game-hud__preview relative grid cursor-pointer text-left transition-transform hover:-translate-y-0.5"
          onClick={onOpenDetails}
          type="button"
        >
          <SolutionImage columns={columns} rows={rows} />
        </button>
        <div className="fullscreen-game-hud__stats grid grid-cols-2 gap-2">
          <div className="rounded-[7px] bg-accent/8 p-2">
            <span className="block text-[0.65rem] font-bold uppercase text-muted">
              Level
            </span>
            <strong className="mt-0.5 block text-lg leading-none text-accent-strong">
              {level}
            </strong>
          </div>
          <div className="rounded-[7px] bg-accent/8 p-2">
            <span className="block text-[0.65rem] font-bold uppercase text-muted">
              Moves
            </span>
            <strong className="mt-0.5 block truncate text-lg leading-none text-accent-strong">
              {moves}
            </strong>
          </div>
        </div>
        <div className="fullscreen-game-hud__actions grid grid-cols-3 gap-2">
          <button
            aria-label="Restart level"
            className="grid h-10 cursor-pointer place-items-center rounded-[7px] border border-line text-accent-strong transition-colors hover:bg-accent/10"
            onClick={onRestart}
            type="button"
          >
            <RotateCcw
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
          </button>
          <button
            aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'}
            aria-pressed={!isMuted}
            className="grid h-10 cursor-pointer place-items-center rounded-[7px] border border-line text-accent-strong transition-colors hover:bg-accent/10"
            onClick={onToggleMuted}
            type="button"
          >
            <SoundIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
          </button>
          <button
            aria-label={
              isFullscreen ? 'Exit fullscreen board' : 'Enter fullscreen board'
            }
            className="grid h-10 cursor-pointer place-items-center rounded-[7px] border border-line text-accent-strong transition-colors hover:bg-accent/10"
            onClick={onToggleFullscreen}
            type="button"
          >
            <FullscreenIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2.2}
            />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-4 top-4 z-20 hidden w-32 rounded-lg border border-white/20 bg-panel/92 p-1.5 shadow-panel backdrop-blur max-[900px]:grid">
      <button
        aria-label="Open run details"
        className="relative grid cursor-pointer text-left transition-transform hover:-translate-y-0.5"
        onClick={onOpenDetails}
        type="button"
      >
        <SolutionImage columns={columns} rows={rows} />
        <span className="absolute right-1 top-1 rounded-full bg-panel/90 px-2 py-0.5 text-[0.65rem] font-bold text-accent-strong backdrop-blur">
          L{level}
        </span>
      </button>
      <div className="mt-1.5 flex items-center justify-between gap-1.5">
        <span
          aria-label={moveLabel}
          className="inline-flex h-8 min-w-0 items-center justify-center truncate whitespace-nowrap rounded-[6px] bg-accent/8 px-2 text-[0.78rem] font-bold text-accent-strong"
          title={moveLabel}
        >
          {moveLabel}
        </span>
        <button
          aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'}
          aria-pressed={!isMuted}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-[6px] border border-line text-accent-strong transition-colors hover:bg-accent/10"
          onClick={onToggleMuted}
          type="button"
        >
          <SoundIcon
            aria-hidden="true"
            className="size-4"
            strokeWidth={2.2}
          />
        </button>
      </div>
    </div>
  );
}
