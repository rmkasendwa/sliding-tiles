import Link from 'next/link';
import { useId } from 'react';

import { routes } from '@/lib/routes';

import { ProfileAvatar } from '../ProfileAvatar';
import { SolutionPreview } from './SolutionPreview';

export type GameInfoPanelProps = {
  columns: number;
  gameModeLabel: string;
  highestReachedLevel: number;
  isModal?: boolean;
  isLevelSelectDisabled?: boolean;
  playerAvatarUrl?: string | null;
  playerName?: string;
  isSignedIn: boolean;
  level: number;
  onClose?: () => void;
  onSelectLevel: (level: number) => void;
  rows: number;
};

export function GameInfoPanel({
  columns,
  gameModeLabel,
  highestReachedLevel,
  isModal = false,
  isLevelSelectDisabled = false,
  playerAvatarUrl,
  playerName,
  isSignedIn,
  level,
  onClose,
  onSelectLevel,
  rows,
}: GameInfoPanelProps) {
  const levelSelectId = useId();
  const levelOptions = Array.from(
    { length: Math.max(highestReachedLevel, level) },
    (_, index) => index + 1,
  );

  return (
    <div
      className={[
        'border border-line bg-panel shadow-panel',
        isModal
          ? 'grid max-h-[calc(100dvh-28px)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl'
          : 'grid content-start gap-4 self-start rounded-lg p-5',
      ].join(' ')}
    >
      <div
        className={
          isModal
            ? 'sticky top-0 z-10 grid gap-2 border-b border-line bg-panel p-4'
            : 'grid gap-2'
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            {gameModeLabel}
          </p>
          <div className="flex items-center gap-2">
            {isSignedIn && playerName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 py-0.5 pl-0.5 pr-2 text-sm font-bold text-accent-strong">
                <ProfileAvatar
                  avatarUrl={playerAvatarUrl}
                  className="text-[0.65rem] tracking-[0.08em]"
                  name={playerName}
                  size={24}
                />
                <span className="max-w-44 text-[0.85rem] truncate">
                  {playerName}
                </span>
              </span>
            )}
            {!isSignedIn && (
              <Link
                className="inline-flex min-h-8 items-center justify-center rounded-full border border-primary bg-primary px-3 text-sm font-bold text-primary-contrast transition-colors hover:bg-primary-strong"
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
      <div
        className={
          isModal
            ? 'grid min-h-0 content-start gap-4 overflow-y-auto p-4'
            : 'grid content-start gap-4'
        }
      >
        <SolutionPreview columns={columns} isCompact={isModal} rows={rows} />
        <form
          className="grid gap-2 rounded-lg border border-accent/18 bg-primary-soft/55 p-3"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="flex items-end justify-between gap-3">
            <label
              className="text-[0.74rem] font-extrabold uppercase text-accent-strong"
              htmlFor={levelSelectId}
            >
              Level select
            </label>
            <span className="text-xs font-bold text-muted">
              Max {Math.max(highestReachedLevel, level)}
            </span>
          </div>
          <select
            className="min-h-10 w-full cursor-pointer rounded-[7px] border border-line bg-surface px-3 text-sm font-bold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLevelSelectDisabled}
            id={levelSelectId}
            onChange={(event) => onSelectLevel(Number(event.target.value))}
            value={level}
          >
            {levelOptions.map((levelOption) => (
              <option key={levelOption} value={levelOption}>
                Level {levelOption}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-muted">
            Jumping levels starts a fresh puzzle and resets the timer and move
            counter.
          </p>
        </form>
        <p className="rounded-lg border border-line bg-surface/40 p-3 text-sm leading-6 text-muted">
          Use the arrow keys to move tiles. Click movable tiles to slide them,
          or click a locked tile to flash where it belongs.
        </p>
        {!isModal ? (
          <section
            aria-labelledby="game-shortcuts-heading"
            className="grid gap-2 rounded-lg border border-info/18 bg-info-surface p-3"
          >
            <p
              className="text-[0.74rem] font-extrabold uppercase text-info-strong"
              id="game-shortcuts-heading"
            >
              Keyboard shortcuts
            </p>
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
              <dt>
                <kbd className="inline-grid min-w-7 place-items-center rounded-md border border-line bg-surface px-1.5 py-0.5 font-bold text-foreground shadow-sm">
                  R
                </kbd>
              </dt>
              <dd className="text-muted">Reset current puzzle</dd>
              <dt>
                <kbd className="inline-grid min-w-7 place-items-center rounded-md border border-line bg-surface px-1.5 py-0.5 font-bold text-foreground shadow-sm">
                  S
                </kbd>
              </dt>
              <dd className="text-muted">Shuffle puzzle</dd>
              <dt>
                <kbd className="inline-grid min-w-7 place-items-center rounded-md border border-line bg-surface px-1.5 py-0.5 font-bold text-foreground shadow-sm">
                  F
                </kbd>
              </dt>
              <dd className="text-muted">Toggle fullscreen</dd>
            </dl>
          </section>
        ) : null}
        {!isSignedIn && (
          <p className="leading-normal text-muted">
            Anonymous progress stays in this browser. Sign in to sync your board
            and post leaderboard times.
          </p>
        )}
      </div>
    </div>
  );
}
