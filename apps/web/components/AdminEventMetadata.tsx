import {
  Clock3,
  Expand,
  Globe,
  Monitor,
  MonitorSmartphone,
  MousePointer2,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

type AdminEventMetadataProps = {
  event: {
    moveCount: number | null;
    screenHeight: number | null;
    screenWidth: number | null;
    timerValueMs: number | null;
    userAgent: string | null;
  };
};

type MetadataItem = {
  browserIcon?: BrowserIconName;
  icon: LucideIcon;
  label: string;
  title?: string;
  tone?: string;
  value: string;
};

type BrowserIconName = 'chrome' | 'edge' | 'firefox' | 'safari' | 'unknown';

function formatDuration(valueMs: number) {
  const seconds = Math.round(valueMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function getBrowserInfo(userAgent: string | null) {
  if (!userAgent) {
    return null;
  }

  if (/Edg\//.test(userAgent)) {
    return {
      icon: 'edge' as const,
      label: 'Edge',
      tone: 'border-info/30 bg-info-soft text-info-strong',
    };
  }

  if (/Firefox\//.test(userAgent)) {
    return {
      icon: 'firefox' as const,
      label: 'Firefox',
      tone: 'border-warning/35 bg-warning-soft text-warning-strong',
    };
  }

  if (/Chrome\//.test(userAgent) && !/Chromium\//.test(userAgent)) {
    return {
      icon: 'chrome' as const,
      label: 'Chrome',
      tone: 'border-success/30 bg-success-soft text-success-strong',
    };
  }

  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
    return {
      icon: 'safari' as const,
      label: 'Safari',
      tone: 'border-accent/30 bg-accent/10 text-accent-strong',
    };
  }

  return {
    icon: 'unknown' as const,
    label: 'Browser',
    tone: 'border-line bg-panel text-foreground',
  };
}

function getDeviceInfo(userAgent: string | null, screenWidth: number | null) {
  const ua = userAgent ?? '';
  if (/Mobi|Android|iPhone|iPod/i.test(ua) || (screenWidth ?? 0) < 640) {
    return { icon: Smartphone, value: 'Phone' };
  }

  if (
    /iPad|Tablet/i.test(ua) ||
    ((screenWidth ?? 0) >= 640 && (screenWidth ?? 0) < 1024)
  ) {
    return { icon: MonitorSmartphone, value: 'Tablet' };
  }

  return { icon: Monitor, value: 'Desktop' };
}

function BrowserIcon({ name }: { name: BrowserIconName }) {
  if (name === 'chrome') {
    return (
      <span
        aria-hidden="true"
        className="relative size-4 rounded-full bg-[conic-gradient(#e94635_0_33%,#f4c542_0_66%,#2ba84a_0_100%)]"
      >
        <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-[#2f7de1]" />
      </span>
    );
  }

  if (name === 'firefox') {
    return (
      <span
        aria-hidden="true"
        className="relative size-4 rounded-full bg-[radial-gradient(circle_at_62%_62%,#673ab7_0_28%,transparent_29%),conic-gradient(from_225deg,#ffb000,#ff6b2f,#d7386c,#6b3cc8,#ffb000)]"
      >
        <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-[#ff8a1f]" />
      </span>
    );
  }

  if (name === 'safari') {
    return (
      <span
        aria-hidden="true"
        className="relative grid size-4 place-items-center rounded-full bg-[#1c8ee8]"
      >
        <span className="absolute size-3 rounded-full border border-white/90" />
        <span className="h-3 w-0.5 rotate-45 rounded-full bg-[#ef3d3d]" />
      </span>
    );
  }

  if (name === 'edge') {
    return (
      <span
        aria-hidden="true"
        className="relative size-4 overflow-hidden rounded-full bg-[conic-gradient(from_215deg,#28c2a0,#2c92dc,#2354a6,#28c2a0)]"
      >
        <span className="absolute bottom-0 left-1 size-2.5 rounded-full bg-info-soft/90" />
      </span>
    );
  }

  return <Globe aria-hidden="true" className="size-3.5" />;
}

export function AdminEventMetadata({ event }: AdminEventMetadataProps) {
  const browser = getBrowserInfo(event.userAgent);
  const device = getDeviceInfo(event.userAgent, event.screenWidth);
  const metadataItems: Array<MetadataItem | null> = [
    browser
      ? {
          browserIcon: browser.icon,
          icon: Globe,
          label: 'Browser',
          title: event.userAgent ?? browser.label,
          tone: browser.tone,
          value: browser.label,
        }
      : null,
    {
      icon: device.icon,
      label: 'Device',
      value: device.value,
    },
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
  ];
  const metadata = metadataItems.filter(
    (item): item is MetadataItem => Boolean(item),
  );

  if (metadata.length === 0) {
    return <span className="text-muted">No extra metadata</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {metadata.map((item) => {
        const Icon = item.icon;
        return (
          <span
            className={[
              'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold',
              item.tone ?? 'border-line bg-panel text-foreground',
            ].join(' ')}
            key={item.label}
            title={item.title ?? item.label}
          >
            {item.browserIcon ? (
              <BrowserIcon name={item.browserIcon} />
            ) : (
              <Icon aria-hidden="true" className="size-3.5" />
            )}
            <span className={item.tone ? 'opacity-75' : 'text-muted'}>
              {item.label}
            </span>
            <span>{item.value}</span>
          </span>
        );
      })}
    </div>
  );
}
