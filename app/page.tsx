import Link from 'next/link';

import { FrogLogo } from '@/components/FrogLogo';
import { routes } from '@/lib/routes';

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

const stats = [
  { label: 'Play mode', value: 'Guest' },
  { label: 'Account mode', value: 'Saved' },
  { label: 'Challenge', value: 'Moves' },
];

function HomePuzzlePreview() {
  return (
    <div
      aria-label="Scrambled frog puzzle preview"
      className="rounded-lg border border-line bg-panel p-[18px] shadow-panel"
      role="img"
    >
      <div className="grid aspect-square grid-cols-3 gap-2 overflow-hidden rounded-[7px]">
        {heroTiles.map((homeIndex, index) => {
          const row = homeIndex === null ? 0 : Math.floor(homeIndex / 3);
          const column = homeIndex === null ? 0 : homeIndex % 3;

          return (
            <div
              className="min-w-0 rounded-[7px] border border-black/20 bg-no-repeat shadow-[inset_0_-4px_5px_rgba(0,0,0,0.24),inset_0_3px_4px_rgba(255,255,255,0.28)]"
              key={index}
              style={{
                background:
                  homeIndex === null
                    ? 'repeating-linear-gradient(-45deg, rgba(30, 37, 34, 0.16) 0 10px, rgba(30, 37, 34, 0.16) 10px 18px, rgba(255, 255, 255, 0.3) 18px 28px, rgba(255, 255, 255, 0.3) 28px 36px), #ece4d3'
                    : undefined,
                backgroundImage:
                  homeIndex === null ? undefined : "url('/api/assets/frog')",
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
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="grid gap-0 overflow-x-clip">
      <section className="mx-auto grid min-h-svh w-[min(1600px,calc(100%-40px))] grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)] items-center gap-12 py-10 max-[900px]:grid-cols-1">
        <div className="grid gap-5">
          <FrogLogo className="w-14" />
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Froggy puzzle runs
          </p>
          <h1 className="max-w-[9ch] text-[clamp(3rem,8vw,7rem)] leading-[0.9]">
            Sliding Tiles
          </h1>
          <p className="max-w-[58ch] text-[1.08rem] leading-[1.7] text-muted">
            Rebuild a bright pond scene one sliding crop at a time. Play a quick
            anonymous board, or sign in to save progress and compete for cleaner
            finishes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent bg-accent px-3.5 font-bold text-white"
              href={routes.play}
            >
              Start playing
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent/30 px-3.5 font-bold text-accent-strong"
              href={routes.leaderboard}
            >
              View leaderboard
            </Link>
          </div>
        </div>
        <HomePuzzlePreview />
      </section>

      <section className="bg-[#17231f] py-16 text-white">
        <div className="mx-auto grid w-[min(1600px,calc(100%-40px))] gap-8">
          <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] items-end gap-8 max-[900px]:grid-cols-1">
            <div className="grid gap-3">
              <p className="text-[0.78rem] font-extrabold uppercase text-[#aee686]">
                Built around the board
              </p>
              <h2 className="max-w-[12ch] text-[clamp(2.4rem,5vw,5rem)] leading-[0.94]">
                Slide into the pond
              </h2>
            </div>
            <p className="max-w-[66ch] text-lg leading-8 text-white/72">
              The homepage now follows the game itself: darker pond sections,
              stronger contrast, and a real preview of the image you solve
              during play.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
            {highlights.map((item) => (
              <article
                className="rounded-lg border border-white/12 bg-white/8 p-5"
                key={item.title}
              >
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-3 leading-7 text-white/68">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#dfeccf] py-16">
        <div className="mx-auto grid w-[min(1600px,calc(100%-40px))] grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] items-center gap-8 max-[900px]:grid-cols-1">
          <div className="grid gap-3">
            <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
              From shuffle to splash
            </p>
            <h2 className="max-w-[12ch] text-[clamp(2.2rem,4vw,4.4rem)] leading-none">
              Built for one more try
            </h2>
            <p className="max-w-[58ch] leading-7 text-muted">
              The board keeps the original sliding-tile feel, now wrapped with
              saved state, themed sound, and a short solved-image celebration.
            </p>
          </div>
          <ol className="grid gap-3 [counter-reset:step]">
            {flow.map((item) => (
              <li
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-[7px] border border-accent/16 bg-white/55 p-3 [counter-increment:step] before:grid before:aspect-square before:place-items-center before:rounded-full before:bg-accent before:text-sm before:font-bold before:text-white before:content-[counter(step)]"
                key={item}
              >
                <span className="leading-6 text-muted">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid w-[min(1600px,calc(100%-40px))] grid-cols-[minmax(0,1fr)_auto] items-center gap-8 py-16 max-[900px]:grid-cols-1">
        <div className="grid gap-4">
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Ready when you are
          </p>
          <h2 className="text-[clamp(2rem,4vw,4rem)] leading-none">
            Start with a quick board
          </h2>
          <p className="max-w-[60ch] leading-7 text-muted">
            No account is required to play. Sign up later when you want saved
            progress and leaderboard entries attached to your name.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent bg-accent px-3.5 font-bold text-white"
              href={routes.play}
            >
              Play now
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent/30 px-3.5 font-bold text-accent-strong"
              href={routes.signup}
            >
              Create account
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center max-[520px]:grid-cols-1">
          {stats.map((item) => (
            <div
              className="min-w-28 rounded-lg border border-line bg-panel px-4 py-3 shadow-[0_16px_44px_rgba(35,35,28,0.08)]"
              key={item.label}
            >
              <strong className="block text-xl text-accent-strong">
                {item.value}
              </strong>
              <span className="mt-1 block text-xs uppercase text-muted">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
