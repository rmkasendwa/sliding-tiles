import type { ReactNode } from 'react';

import { ArrowRight, Home, type LucideIcon, Trophy } from 'lucide-react';
import Link from 'next/link';

import { FrogLogo } from '@/components/FrogLogo';
import { routes } from '@/lib/routes';

type ErrorStateAction = {
  href?: string;
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
  tone?: 'primary' | 'secondary';
};

type ErrorStateProps = {
  actions?: ErrorStateAction[];
  eyebrow: string;
  message: string;
  status: string;
  title: string;
  children?: ReactNode;
};

const previewTiles = [2, 4, 1, 5, null, 0, 6, 3, 8] as const;

function getActionClass(tone: ErrorStateAction['tone'] = 'secondary') {
  if (tone === 'primary') {
    return 'border-primary bg-primary text-primary-contrast shadow-button-primary hover:bg-primary-strong';
  }

  return 'border-accent/28 bg-surface/55 text-accent-strong hover:bg-accent/8';
}

function ScrambledPreview() {
  return (
    <div
      aria-hidden="true"
      className="grid aspect-square w-full max-w-72 grid-cols-3 gap-2 rounded-[14px] border border-accent/18 bg-panel/74 p-3 shadow-panel"
    >
      {previewTiles.map((tile, index) => {
        const row = tile === null ? 0 : Math.floor(tile / 3);
        const column = tile === null ? 0 : tile % 3;

        return (
          <span
            className={[
              'min-w-0 rounded-[7px] border border-foreground/18 bg-no-repeat shadow-tile-preview',
              tile === null
                ? 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-panel-strong)_88%,transparent),color-mix(in_srgb,var(--color-surface-sunken)_92%,transparent))]'
                : 'bg-surface',
            ].join(' ')}
            key={`${tile ?? 'empty'}-${index}`}
            style={{
              backgroundImage: tile === null ? undefined : "url('/frog.svg')",
              backgroundPosition:
                tile === null
                  ? undefined
                  : `${(column / 2) * 100}% ${(row / 2) * 100}%`,
              backgroundSize: tile === null ? undefined : '300% 300%',
            }}
          />
        );
      })}
    </div>
  );
}

function ErrorAction({ action }: { action: ErrorStateAction }) {
  const Icon = action.icon;
  const className = [
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] border px-4 text-sm font-bold transition-[background-color,transform] active:translate-y-px max-[560px]:w-full',
    getActionClass(action.tone),
  ].join(' ');
  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Link className={className} href={action.href}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} onClick={action.onClick} type="button">
      {content}
    </button>
  );
}

export function ErrorState({
  actions = [],
  children,
  eyebrow,
  message,
  status,
  title,
}: ErrorStateProps) {
  return (
    <section className="relative isolate grid min-h-[calc(100svh-8rem)] w-full place-items-center overflow-hidden py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-2/3 bg-[radial-gradient(circle_at_18%_18%,color-mix(in_srgb,var(--color-accent)_23%,transparent),transparent_42%),radial-gradient(circle_at_86%_18%,color-mix(in_srgb,var(--color-clay)_18%,transparent),transparent_38%)]"
      />
      <div className="page-rail mx-auto grid grid-cols-[minmax(0,1fr)_minmax(220px,0.62fr)] items-center gap-10 max-[820px]:grid-cols-1">
        <div className="grid gap-6 rounded-[18px] border border-accent/12 bg-surface/58 p-7 shadow-card-lift backdrop-blur-[2px] max-[620px]:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FrogLogo className="w-13" />
              <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
                {eyebrow}
              </p>
            </div>
            <span className="inline-flex min-h-8 items-center rounded-full border border-accent/20 bg-surface/72 px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
              {status}
            </span>
          </div>
          <div className="grid gap-3">
            <h1 className="max-w-2xl text-[clamp(2rem,5vw,4.4rem)] leading-[0.92]">
              {title}
            </h1>
            <p className="max-w-[58ch] text-[1.04rem] leading-7 text-muted">
              {message}
            </p>
          </div>
          {children ? <div>{children}</div> : null}
          <div className="flex flex-wrap gap-3 max-[560px]:grid">
            {actions.map((action) => (
              <ErrorAction action={action} key={action.label} />
            ))}
          </div>
        </div>
        <div className="grid justify-items-center gap-3">
          <ScrambledPreview />
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.08em] text-accent-strong/85">
            The board is still waiting
          </p>
        </div>
      </div>
    </section>
  );
}

export function NotFoundErrorState() {
  return (
    <ErrorState
      actions={[
        { href: routes.home, icon: Home, label: 'Home', tone: 'primary' },
        {
          href: routes.play,
          icon: ArrowRight,
          label: 'Play',
          tone: 'secondary',
        },
        {
          href: routes.leaderboard,
          icon: Trophy,
          label: 'Leaderboard',
          tone: 'secondary',
        },
      ]}
      eyebrow="Sliding Tiles"
      message="That route does not exist, or the tile you followed moved somewhere else. Head back into the game from here."
      status="404"
      title="This page is missing"
    />
  );
}
