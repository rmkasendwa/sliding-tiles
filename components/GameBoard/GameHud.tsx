import { SolutionImage } from './SolutionPreview';

type GameHudProps = {
  columns: number;
  onOpenDetails: () => void | Promise<void>;
  rows: number;
  variant: 'compact' | 'fullscreen';
};

export function GameHud({
  columns,
  onOpenDetails,
  rows,
  variant,
}: GameHudProps) {
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
      </div>
    );
  }

  return (
    <div className="absolute right-4 top-4 z-20 hidden w-24 rounded-lg border border-white/20 bg-panel/92 p-1.5 shadow-panel backdrop-blur max-[900px]:grid">
      <button
        aria-label="Open run details"
        className="relative grid cursor-pointer text-left transition-transform hover:-translate-y-0.5"
        onClick={onOpenDetails}
        type="button"
      >
        <SolutionImage columns={columns} rows={rows} />
      </button>
    </div>
  );
}
