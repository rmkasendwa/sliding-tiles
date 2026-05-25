import type { BoardState } from '@/lib/board';
import { SolutionPreview } from './SolutionPreview';

export type GameInfoPanelProps = {
  board: BoardState;
  columns: number;
  gameModeLabel: string;
  isModal?: boolean;
  isSignedIn: boolean;
  message: string;
  onClose?: () => void;
  rows: number;
};

export function GameInfoPanel({
  board,
  columns,
  gameModeLabel,
  isModal = false,
  isSignedIn,
  message,
  onClose,
  rows,
}: GameInfoPanelProps) {
  return (
    <div
      className={[
        'grid content-start gap-4 self-start border border-line bg-panel shadow-panel',
        isModal ? 'min-h-full rounded-xl p-4' : 'rounded-lg p-5',
      ].join(' ')}
    >
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            {gameModeLabel}
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent-strong">
              Level {board.level}
            </span>
            {onClose && (
              <button
                aria-label="Close run details"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-[7px] border border-line text-xl leading-none text-muted"
                onClick={onClose}
                type="button"
              >
                &times;
              </button>
            )}
          </div>
        </div>
        <h1
          className={[
            'leading-none',
            isModal
              ? 'text-[clamp(2rem,9vw,2.55rem)]'
              : 'text-[clamp(1.8rem,4vw,2rem)]',
          ].join(' ')}
        >
          Complete the pond
        </h1>
        <p className="text-sm leading-6 text-muted">
          Slide the pieces back together. Hold the board to peek at the full
          picture.
        </p>
      </div>
      <SolutionPreview columns={columns} isCompact={isModal} rows={rows} />
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[7px] border border-line bg-white/50 p-3">
          <span className="block text-[0.78rem] text-muted">Grid</span>
          <strong className="mt-1 block text-[1.4rem]">
            {columns}x{rows}
          </strong>
        </div>
        <div className="rounded-[7px] border border-line bg-white/50 p-3">
          <span className="block text-[0.78rem] text-muted">Moves</span>
          <strong className="mt-1 block text-[1.4rem]">{board.moves}</strong>
        </div>
      </div>
      <p className="rounded-lg border border-line bg-white/40 p-3 text-sm leading-6 text-muted">
        Use arrow keys or WASD. Click movable tiles to slide them, or click a
        locked tile to flash where it belongs.
      </p>
      {!isSignedIn && (
        <p className="leading-normal text-muted">
          Anonymous progress stays in this browser. Sign in to sync your board
          and post leaderboard times.
        </p>
      )}
      {message && (
        <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
          {message}
        </p>
      )}
    </div>
  );
}
