import { SolutionImage } from './SolutionPreview';

type GameHudProps = {
  columns: number;
  imageAspectRatio: number;
  imageUrl: string;
  onOpenDetails: () => void | Promise<void>;
  rows: number;
  variant: 'compact' | 'fullscreen';
};

export function GameHud({
  columns,
  imageAspectRatio,
  imageUrl,
  onOpenDetails,
  rows,
  variant,
}: GameHudProps) {
  if (variant === 'fullscreen') {
    return (
      <div className="fullscreen-game-hud">
        <button
          aria-label="Open run details"
          className="game-hud-preview fullscreen-game-hud__preview relative grid cursor-pointer text-left transition-transform hover:-translate-y-0.5"
          onClick={onOpenDetails}
          type="button"
        >
          <SolutionImage columns={columns} imageAspectRatio={imageAspectRatio} imageUrl={imageUrl} rows={rows} />
        </button>
      </div>
    );
  }

  return (
    <div className="board-overlay absolute right-4 top-4 z-20 hidden w-24 rounded-lg border p-1 max-[900px]:grid">
      <button
        aria-label="Open run details"
        className="game-hud-preview relative grid cursor-pointer text-left transition-transform hover:-translate-y-0.5"
        onClick={onOpenDetails}
        type="button"
      >
        <SolutionImage columns={columns} imageAspectRatio={imageAspectRatio} imageUrl={imageUrl} rows={rows} />
      </button>
    </div>
  );
}
