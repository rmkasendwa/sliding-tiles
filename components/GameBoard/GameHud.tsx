import { SolutionImage } from './SolutionPreview';

type GameHudProps = {
  columns: number;
  level: number;
  moves: number;
  onOpenDetails: () => void | Promise<void>;
  rows: number;
  variant: 'compact' | 'fullscreen';
};

export function GameHud({
  columns,
  level,
  moves,
  onOpenDetails,
  rows,
  variant,
}: GameHudProps) {
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
        <button
          aria-label="Open run details"
          className="fullscreen-game-hud__stats grid cursor-pointer grid-cols-2 gap-2 text-left transition-transform hover:-translate-y-0.5"
          onClick={onOpenDetails}
          type="button"
        >
          <div className="fullscreen-game-hud__stat rounded-[7px] bg-accent/8 p-2">
            <span className="block text-[0.65rem] font-bold uppercase text-muted">
              Level
            </span>
            <strong className="mt-0.5 block text-lg leading-none text-accent-strong">
              {level}
            </strong>
          </div>
          <div className="fullscreen-game-hud__stat rounded-[7px] bg-accent/8 p-2">
            <span className="block text-[0.65rem] font-bold uppercase text-muted">
              Moves
            </span>
            <strong className="mt-0.5 block truncate text-lg leading-none text-accent-strong">
              {moves}
            </strong>
          </div>
        </button>
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
          className="inline-flex h-8 min-w-0 flex-1 items-center justify-center truncate whitespace-nowrap rounded-[6px] bg-accent/8 px-2 text-[0.78rem] font-bold text-accent-strong"
          title={moveLabel}
        >
          {moveLabel}
        </span>
      </div>
    </div>
  );
}
