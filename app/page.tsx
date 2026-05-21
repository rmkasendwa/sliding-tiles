import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-154px)] w-[min(1180px,calc(100%_-_32px))] grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] items-center gap-9 py-11 pb-14 max-[820px]:min-h-0 max-[820px]:grid-cols-1">
      <div className="grid gap-5">
        <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
          Modernized puzzle engine
        </p>
        <h1 className="text-[clamp(2.4rem,7vw,5.7rem)] leading-[0.94]">
          Sliding Tiles
        </h1>
        <p className="max-w-[56ch] text-[1.08rem] leading-[1.7] text-muted">
          Play anonymously for a quick run, or create an account to save your
          board and compete on the leaderboard.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent bg-accent px-3.5 font-bold text-white"
            href="/play"
          >
            Start playing
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent/30 px-3.5 font-bold text-accent-strong"
            href="/leaderboard"
          >
            View leaderboard
          </Link>
        </div>
      </div>
      <div
        className="rounded-lg border border-line bg-panel p-[18px] shadow-panel"
        aria-hidden="true"
      >
        <div className="grid aspect-square grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              className="rounded-[7px] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.18)]"
              key={index}
              style={{
                background:
                  index === 8
                    ? 'repeating-linear-gradient(-45deg, rgba(30, 37, 34, 0.18) 0 8px, transparent 8px 16px)'
                    : index % 2 === 1
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.64), transparent), #b28c35'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.72), transparent), #256f5a',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
