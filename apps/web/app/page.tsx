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

function HomePuzzlePreview() {
  return (
    <div
      aria-label="Scrambled frog puzzle preview"
      className="rounded-lg border border-line bg-panel p-4.5 shadow-panel"
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
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="grid gap-0 overflow-x-clip">
      <section className="page-rail mx-auto grid min-h-svh grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)] items-center gap-20 py-10 max-[900px]:grid-cols-1">
        <div className="grid gap-6">
          <FrogLogo className="w-14" />
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Sliding Tiles
          </p>
          <h1 className="text-[clamp(3rem,6.6vw,6.1rem)] leading-[0.9]">
            Solve the pond
          </h1>
          <p className="max-w-[58ch] text-[1.12rem] leading-[1.7] text-muted">
            A calm little frog scene has been scrambled into sliding pieces.
            Move the tiles, find the picture, and see how few moves it takes to
            make the pond whole again.
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
          <ul className="grid max-w-[58ch] gap-2.5 pt-2 text-sm font-bold text-accent-strong">
            {heroSignals.map((signal) => (
              <li className="flex items-center gap-2" key={signal}>
                <span className="block h-2 w-2 rounded-full bg-accent" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
        <HomePuzzlePreview />
      </section>

      <section className="bg-[#17231f] py-16 text-white">
        <div className="page-rail mx-auto grid gap-8">
          <div className="grid max-w-215 gap-4">
            <p className="text-[0.78rem] font-extrabold uppercase text-[#aee686]">
              Your next board
            </p>
            <h2 className="text-[clamp(2.4rem,5vw,5rem)] leading-[0.94]">
              Slide into the pond
            </h2>
            <p className="max-w-[66ch] text-lg leading-8 text-white/72">
              Every puzzle starts as a scrambled pond scene. Move one tile at a
              time, peek when you need a hint, and bring the full picture back
              into place.
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
        <div className="page-rail mx-auto grid gap-8">
          <div className="grid max-w-240 gap-3">
            <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
              From shuffle to splash
            </p>
            <h2 className="whitespace-nowrap text-[clamp(2.4rem,5vw,5.2rem)] leading-none max-[700px]:whitespace-normal">
              Built for one more try
            </h2>
            <p className="max-w-[68ch] leading-7 text-muted">
              Keep your run moving with clear feedback, saved progress when you
              sign in, and a satisfying pause on the finished image before the
              next challenge begins.
            </p>
          </div>
          <ol className="grid grid-cols-3 gap-4 [counter-reset:step] max-[900px]:grid-cols-1">
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

      <section className="page-rail mx-auto grid grid-cols-[minmax(560px,0.78fr)_minmax(0,1.22fr)] items-center gap-8 py-16 max-[1180px]:grid-cols-1">
        <div className="grid gap-4">
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Ready when you are
          </p>
          <h2 className="whitespace-nowrap text-[clamp(2rem,3.5vw,3.5rem)] leading-none max-[640px]:whitespace-normal">
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
        <div className="grid grid-cols-3 gap-4 max-[760px]:grid-cols-1">
          {playModes.map((item) => (
            <div
              className="grid gap-2.5 rounded-lg border border-line bg-panel p-4 shadow-[0_12px_34px_rgba(35,35,28,0.07)] max-[760px]:grid-cols-[2.8rem_minmax(0,1fr)] max-[760px]:items-center max-[760px]:p-3"
              key={item.title}
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
