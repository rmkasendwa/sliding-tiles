import {
  Clock3,
  Expand,
  Monitor,
  MousePointer2,
  type LucideIcon,
} from 'lucide-react';

type AdminEventMetadataProps = {
  event: {
    moveCount: number | null;
    screenHeight: number | null;
    screenWidth: number | null;
    timerValueMs: number | null;
  };
};

function formatDuration(valueMs: number) {
  const seconds = Math.round(valueMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function AdminEventMetadata({ event }: AdminEventMetadataProps) {
  const metadata = [
    event.moveCount === null
      ? null
      : {
          icon: MousePointer2,
          label: 'Moves',
          value: event.moveCount.toLocaleString(),
        },
    event.timerValueMs === null
      ? null
      : {
          icon: Clock3,
          label: 'Timer',
          value: formatDuration(event.timerValueMs),
        },
    event.screenWidth === null || event.screenHeight === null
      ? null
      : {
          icon: Monitor,
          label: 'Screen',
          value: `${event.screenWidth}x${event.screenHeight}`,
        },
    event.screenWidth === null || event.screenHeight === null
      ? null
      : {
          icon: Expand,
          label: 'Viewport class',
          value: event.screenWidth >= 1024 ? 'Desktop' : 'Small screen',
        },
  ].filter(
    (
      item,
    ): item is {
      icon: LucideIcon;
      label: string;
      value: string;
    } => Boolean(item),
  );

  if (metadata.length === 0) {
    return <span className="text-muted">No extra metadata</span>;
  }

  return (
    <div className="flex min-w-64 flex-wrap gap-2">
      {metadata.map((item) => {
        const Icon = item.icon;
        return (
          <span
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 text-xs font-bold text-foreground"
            key={item.label}
            title={item.label}
          >
            <Icon aria-hidden="true" className="size-3.5 text-accent" />
            <span className="text-muted">{item.label}</span>
            <span>{item.value}</span>
          </span>
        );
      })}
    </div>
  );
}
