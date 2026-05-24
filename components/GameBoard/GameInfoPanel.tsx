import { Volume2, VolumeX } from 'lucide-react';

import type { BoardState } from '@/lib/board';
import { SolutionPreview } from './SolutionPreview';

export type GameInfoPanelProps = {
  board: BoardState;
  columns: number;
  gameModeLabel: string;
  isMuted: boolean;
  isModal?: boolean;
  isCelebrating: boolean;
  isSignedIn: boolean;
  message: string;
  onClose?: () => void;
  onRestart: () => void;
  onToggleMuted: () => void;
  rows: number;
};

export function GameInfoPanel({
  board,
  columns,
  gameModeLabel,
  isMuted,
  isModal = false,
  isCelebrating,
  isSignedIn,
  message,
  onClose,
  onRestart,
  onToggleMuted,
  rows,
}: GameInfoPanelProps) {
  const SoundIcon = isMuted ? VolumeX : Volume2;

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
      <div className="grid grid-cols-2 gap-2.5">
        <button
          aria-pressed={!isMuted}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[7px] border border-line px-3.5 font-bold text-muted transition-colors hover:bg-accent/10 hover:text-accent-strong"
          onClick={onToggleMuted}
          type="button"
        >
          <SoundIcon aria-hidden="true" className="size-4" strokeWidth={2.2} />
          {isMuted ? 'Sound off' : 'Sound on'}
        </button>
        <button
          className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[7px] border border-accent/30 px-3.5 font-bold text-accent-strong"
          disabled={isCelebrating}
          onClick={onRestart}
          type="button"
        >
          Restart level
        </button>
      </div>
      {message && (
        <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
          {message}
        </p>
      )}
    </div>
  );
}
