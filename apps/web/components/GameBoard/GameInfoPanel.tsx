import Link from 'next/link';

import { routes } from '@/lib/routes';

import { SolutionPreview } from './SolutionPreview';

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export type GameInfoPanelProps = {
  columns: number;
  gameModeLabel: string;
  isModal?: boolean;
  playerName?: string;
  isSignedIn: boolean;
  onClose?: () => void;
  rows: number;
};

export function GameInfoPanel({
  columns,
  gameModeLabel,
  isModal = false,
  playerName,
  isSignedIn,
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
            {isSignedIn && playerName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 py-0.5 pl-0.5 pr-2 text-sm font-bold text-accent-strong">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-strong text-[0.65rem] font-extrabold tracking-[0.08em] text-white">
                  {getInitials(playerName)}
                </span>
                <span className="max-w-44 text-[0.85rem] truncate">
                  {playerName}
                </span>
              </span>
            )}
            {!isSignedIn && (
              <Link
                className="inline-flex min-h-8 items-center justify-center rounded-full bg-accent-strong px-3 text-sm font-bold text-white transition-colors hover:bg-accent"
                href={routes.login}
              >
                Login
              </Link>
            )}
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
    </div>
  );
}
