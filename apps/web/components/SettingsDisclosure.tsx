import type { ReactNode } from 'react';

type SettingsDisclosureProps = {
  badge: string;
  children: ReactNode;
  description: string;
  title: string;
};

export function SettingsDisclosure({
  badge,
  children,
  description,
  title,
}: SettingsDisclosureProps) {
  return (
    <details className="group w-full rounded-lg border border-line bg-white/62">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
        <span className="grid gap-0.5">
          <span className="text-[1.03rem] font-bold text-foreground">
            {title}
          </span>
          <span className="text-sm font-normal text-muted">{description}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">
          <span>{badge}</span>
          <span className="relative grid h-5 w-5 place-items-center rounded-full border border-line/80 bg-white/80 text-foreground/70">
            <span className="absolute transition-all duration-200 group-open:translate-y-1 group-open:opacity-0">
              +
            </span>
            <span className="absolute opacity-0 transition-all duration-200 group-open:translate-y-0 group-open:opacity-100">
              -
            </span>
          </span>
        </span>
      </summary>
      <div className="border-t border-line/70 p-4">{children}</div>
    </details>
  );
}
