export default function RunsLoading() {
  return (
    <section
      aria-label="Loading run history"
      className="page-rail mx-auto grid w-full max-w-240 gap-5 py-6 sm:py-8"
      role="status"
    >
      <header className="grid gap-3 border-b border-line pb-4">
        <span className="h-3 w-32 animate-pulse rounded bg-line/60 motion-reduce:animate-none" />
        <span className="h-11 w-64 max-w-full animate-pulse rounded bg-line/70 motion-reduce:animate-none" />
        <span className="h-5 w-full max-w-xl animate-pulse rounded bg-line/50 motion-reduce:animate-none" />
      </header>

      <span className="h-12 w-64 max-w-full animate-pulse rounded-[7px] bg-line/60 motion-reduce:animate-none" />

      <div aria-hidden="true" className="grid gap-2.5">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="relative pl-4" key={index}>
            <span className="absolute -left-1 top-2 size-2.5 rounded-full bg-line" />
            <div className="grid gap-3 rounded-lg border border-line bg-surface/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="grid gap-2">
                  <span className="h-4 w-24 animate-pulse rounded bg-line/70 motion-reduce:animate-none" />
                  <span className="h-3 w-36 animate-pulse rounded bg-line/50 motion-reduce:animate-none" />
                </div>
                <span className="h-7 w-20 animate-pulse rounded-full bg-line/60 motion-reduce:animate-none" />
              </div>
              <div className="grid grid-cols-3 gap-2 max-[620px]:grid-cols-1">
                {Array.from({ length: 3 }, (_, metricIndex) => (
                  <span
                    className="h-9 animate-pulse rounded-md bg-line/50 motion-reduce:animate-none"
                    key={metricIndex}
                  />
                ))}
              </div>
              <span className="h-14 animate-pulse rounded-md bg-line/45 motion-reduce:animate-none" />
              <span className="h-9 w-32 animate-pulse rounded-md bg-line/60 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading runs...</span>
    </section>
  );
}
