import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { FrogLogo } from '@/components/FrogLogo';
import { ScrollRevealObserver } from '@/components/ScrollRevealObserver';
import { ApiGameState, apiRequest } from '@/lib/api';
import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export const metadata = pageMetadata.home;

const heroTiles = [2, 0, 5, 3, 8, 1, 6, 4, null] as const;

const highlights = [
  {
    title: 'Quick runs',
    text: 'Start a board immediately and keep anonymous progress in this browser.',
  },
  {
    title: 'Saved boards',
    text: 'Sign in to sync the current puzzle state and come back without losing your place.',
  },
  {
    title: 'Leaderboard chase',
    text: 'Finish levels with fewer moves and cleaner times to climb the rankings.',
  },
];

const flow = [
  'Pick up a shuffled pond scene.',
  'Slide the open space until each crop belongs.',
  'Celebrate the solved image before the next board appears.',
];

const playModes = [
  {
    label: 'Jump in',
    title: 'Guest run',
    text: 'Start instantly and keep the board in this browser.',
  },
  {
    label: 'Come back',
    title: 'Saved run',
    text: 'Sign in to sync progress before the pond gets away.',
  },
  {
    label: 'Compete',
    title: 'Clean run',
    text: 'Finish with fewer moves and chase the leaderboard.',
  },
];

const heroSignals = [
  'Peek at the solved pond when you are stuck.',
  'Save the board when you sign in.',
  'Climb the leaderboard with cleaner runs.',
];

const heroStats = [
  { label: 'Puzzle size', value: '3x3' },
  { label: 'Entry time', value: '< 10 sec' },
  { label: 'Best for', value: 'Quick focus' },
];

type HomePuzzlePreviewProps = {
  footerText: string;
  label: string;
};

function HomePuzzlePreview({ footerText, label }: HomePuzzlePreviewProps) {
  return (
    <div
      aria-label="Scrambled frog puzzle preview"
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-[18px] border border-accent/18 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-accent)_20%,transparent),transparent_52%),linear-gradient(155deg,color-mix(in_srgb,var(--color-surface)_90%,transparent),color-mix(in_srgb,var(--color-panel-strong)_86%,transparent))] p-4 shadow-panel"
      role="img"
    >
      <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-accent/18 bg-surface/75 px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
        {label}
      </div>
      <div className="grid aspect-square grid-cols-3 gap-2 overflow-hidden rounded-[7px]">
        {heroTiles.map((homeIndex, index) => {
          const row = homeIndex === null ? 0 : Math.floor(homeIndex / 3);
          const column = homeIndex === null ? 0 : homeIndex % 3;

          return (
            <div
              className="min-w-0 rounded-[7px] border border-foreground/20 bg-no-repeat shadow-tile-preview"
              key={index}
              style={{
                background:
                  homeIndex === null
                    ? 'repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-foreground) 16%, transparent) 0 10px, color-mix(in srgb, var(--color-foreground) 16%, transparent) 10px 18px, color-mix(in srgb, var(--color-surface) 30%, transparent) 18px 28px, color-mix(in srgb, var(--color-surface) 30%, transparent) 28px 36px), var(--color-surface-sunken)'
                    : undefined,
                backgroundImage:
                  homeIndex === null ? undefined : "url('/frog.svg')",
                backgroundPosition:
                  homeIndex === null
                    ? undefined
                    : `${(column / 2) * 100}% ${(row / 2) * 100}%`,
                backgroundSize: homeIndex === null ? undefined : '300% 300%',
              }}
            />
          );
        })}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-accent-strong/85">
        {footerText}
      </p>
    </div>
  );
}

export default async function HomePage() {
  const session = await getSession();
  let savedGameState: ApiGameState | null = null;

  if (session) {
    const savedState = await apiRequest<{ gameState: ApiGameState | null }>(
      '/game-state',
    );
    savedGameState = savedState.gameState;
  }

  const hasSavedBoard = Boolean(savedGameState);
  const playCtaLabel = hasSavedBoard ? 'Continue playing' : 'Start playing';
  const previewLabel = hasSavedBoard
    ? `Saved board · Level ${savedGameState?.level}`
    : 'Demo board';
  const previewFooter = hasSavedBoard
    ? `${savedGameState?.moves ?? 0} moves logged. The pond remembers.`
    : 'One empty slot. Infinite retries.';
  const progressLine = hasSavedBoard
    ? `Your saved board is waiting at Level ${savedGameState?.level} with ${savedGameState?.moves} moves.`
    : null;

  return (
    <div className="w-full relative grid gap-0 overflow-x-clip" id="home-page">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-120 bg-[radial-gradient(circle_at_18%_28%,color-mix(in_srgb,var(--color-accent)_23%,transparent),transparent_42%),radial-gradient(circle_at_86%_12%,color-mix(in_srgb,var(--color-primary-strong)_16%,transparent),transparent_38%)]"
      />
      <ScrollRevealObserver targetId="home-page" />
      <section className="page-rail mx-auto grid min-h-svh grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)] items-center gap-12 py-10 xl:gap-14 max-[900px]:grid-cols-1">
        <div
          className="scroll-reveal grid gap-6 rounded-[18px] border border-accent/10 bg-surface/38 p-7 shadow-card-lift backdrop-blur-[2px] max-[620px]:p-5"
          style={{ animationDelay: '40ms' }}
        >
          <div className="flex items-center justify-between gap-4 max-[540px]:grid">
            <div className="flex items-center gap-3">
              <FrogLogo className="w-14" />
              <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
                Sliding Tiles
              </p>
            </div>
            <span className="inline-flex h-8 items-center rounded-full border border-accent/20 bg-surface/72 px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
              Calm speedrun puzzle
            </span>
          </div>
          <h1 className="text-[clamp(1.9rem,3.6vw,3.4rem)] leading-[0.92]">
            Solve the pond
          </h1>
          {session && (
            <p className="text-[0.92rem] font-bold text-accent-strong">
              Welcome back, {session.name}
            </p>
          )}
          <p className="max-w-[58ch] text-[1.12rem] leading-[1.7] text-muted">
            A calm little frog scene has been scrambled into sliding pieces.
            Move the tiles, find the picture, and see how few moves it takes to
            make the pond whole again.
          </p>
          {progressLine && (
            <p className="max-w-[52ch] rounded-[9px] border border-accent/16 bg-surface/55 px-3 py-2 text-sm font-bold text-accent-strong">
              {progressLine}
            </p>
          )}
          <div className="flex flex-wrap gap-3 max-[560px]:grid">
            <Link
              className="inline-flex min-h-11 min-w-42 items-center justify-center gap-2 rounded-[7px] border border-accent bg-accent px-4 font-bold text-white shadow-button-primary transition-[background-color,transform] hover:bg-accent-strong active:translate-y-px max-[560px]:w-full"
              href={routes.play}
            >
              {playCtaLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent/30 px-3.5 font-bold text-accent-strong max-[560px]:w-full"
              href={routes.leaderboard}
            >
              View leaderboard
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-y border-accent/12 py-3">
            {heroStats.map((stat) => (
              <article
                className="grid grid-cols-[auto_auto] items-baseline gap-1.5"
                key={stat.label}
              >
                <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  {stat.label}
                </p>
                <p className="text-sm font-bold text-accent-strong">
                  {stat.value}
                </p>
              </article>
            ))}
          </div>
          <ul className="grid max-w-[58ch] gap-2.5 pt-2 text-sm font-bold text-accent-strong">
            {heroSignals.map((signal) => (
              <li className="flex items-center gap-2" key={signal}>
                <span className="block h-2 w-2 rounded-full bg-accent" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="scroll-reveal" style={{ animationDelay: '80ms' }}>
          <HomePuzzlePreview footerText={previewFooter} label={previewLabel} />
        </div>
      </section>

      <section className="bg-night py-16 text-white">
        <div
          className="page-rail scroll-reveal mx-auto grid gap-8"
          style={{ animationDelay: '120ms' }}
        >
          <div className="grid max-w-215 gap-4">
            <p className="text-[0.78rem] font-extrabold uppercase text-night-accent">
              Your next board
            </p>
            <h2 className="text-[clamp(1.9rem,3.6vw,3.4rem)] leading-[0.94]">
              Slide into the pond
            </h2>
            <p className="max-w-[66ch] text-lg leading-8 text-white/72">
              Every puzzle starts as a scrambled pond scene. Move one tile at a
              time, peek when you need a hint, and bring the full picture back
              into place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
            {highlights.map((item, index) => (
              <article
                className="scroll-reveal rounded-xl border border-surface/12 bg-[linear-gradient(170deg,color-mix(in_srgb,var(--color-surface)_13%,transparent),color-mix(in_srgb,var(--color-surface)_5%,transparent))] p-5 shadow-night-card"
                key={item.title}
                style={{ animationDelay: `${160 + index * 30}ms` }}
              >
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-night-accent">
                  0{index + 1}
                </p>
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-3 leading-7 text-white/68">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-meadow py-16">
        <div
          className="page-rail scroll-reveal mx-auto grid gap-8"
          style={{ animationDelay: '200ms' }}
        >
          <div className="grid max-w-240 gap-3">
            <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
              From shuffle to splash
            </p>
            <h2 className="text-[clamp(1.9rem,3.6vw,3.4rem)] leading-none">
              Built for one more try
            </h2>
            <p className="max-w-[68ch] leading-7 text-muted">
              Keep your run moving with clear feedback, saved progress when you
              sign in, and a satisfying pause on the finished image before the
              next challenge begins.
            </p>
          </div>
          <ol className="grid grid-cols-3 gap-4 [counter-reset:step] max-[900px]:grid-cols-1">
            {flow.map((item, index) => (
              <li
                className="scroll-reveal grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-[11px] border border-accent/16 bg-[linear-gradient(165deg,color-mix(in_srgb,var(--color-surface)_86%,transparent),color-mix(in_srgb,var(--color-surface)_58%,transparent))] p-3 [counter-increment:step] shadow-card-soft before:grid before:aspect-square before:place-items-center before:rounded-full before:bg-accent before:text-sm before:font-bold before:text-white before:content-[counter(step)]"
                key={item}
                style={{ animationDelay: `${240 + index * 30}ms` }}
              >
                <span className="leading-6 text-muted">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="page-rail scroll-reveal mx-auto grid grid-cols-[minmax(560px,0.78fr)_minmax(0,1.22fr)] items-center gap-8 py-16 max-[1180px]:grid-cols-1"
        style={{ animationDelay: '280ms' }}
      >
        <div
          className="scroll-reveal grid gap-4"
          style={{ animationDelay: '300ms' }}
        >
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Ready when you are
          </p>
          <h2 className="text-[clamp(1.9rem,3.6vw,3.4rem)] leading-none">
            Start with a quick board
          </h2>
          <p className="max-w-[60ch] leading-7 text-muted">
            No account is required to play. Sign up later when you want saved
            progress and leaderboard entries attached to your name.
          </p>
          <div className="flex flex-wrap gap-3 max-[560px]:grid">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent bg-accent px-3.5 font-bold text-white max-[560px]:w-full"
              href={routes.play}
            >
              {playCtaLabel}
            </Link>
            {!session ? (
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent/30 px-3.5 font-bold text-accent-strong max-[560px]:w-full"
                href={routes.signup}
              >
                Create account
              </Link>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 max-[760px]:grid-cols-1">
          {playModes.map((item, index) => (
            <div
              className="scroll-reveal grid gap-2.5 rounded-xl border border-accent/14 bg-[linear-gradient(168deg,color-mix(in_srgb,var(--color-surface)_96%,transparent),color-mix(in_srgb,var(--color-panel-strong)_90%,transparent))] p-4 shadow-card-soft max-[760px]:grid-cols-[2.8rem_minmax(0,1fr)] max-[760px]:items-center max-[760px]:p-3"
              key={item.title}
              style={{ animationDelay: `${330 + index * 30}ms` }}
            >
              <span className="grid aspect-square w-9 place-items-center rounded-full bg-accent/10 text-xs font-extrabold text-accent-strong max-[760px]:w-auto">
                {item.label.slice(0, 1)}
              </span>
              <span className="grid gap-1">
                <span className="text-xs font-extrabold uppercase text-accent-strong">
                  {item.label}
                </span>
                <strong className="text-lg leading-tight">{item.title}</strong>
                <span className="text-sm leading-6 text-muted">
                  {item.text}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
