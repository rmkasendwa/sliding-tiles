import {
  Clock3,
  Compass,
  Expand,
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
  icon: LucideIcon;
  label: string;
  title?: string;
  tone?: string;
  value: string;
};

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
      label: 'Edge',
      tone: 'border-info/30 bg-info-soft text-info-strong',
    };
  }

  if (/Firefox\//.test(userAgent)) {
    return {
      label: 'Firefox',
      tone: 'border-warning/35 bg-warning-soft text-warning-strong',
    };
  }

  if (/Chrome\//.test(userAgent) && !/Chromium\//.test(userAgent)) {
    return {
      label: 'Chrome',
      tone: 'border-success/30 bg-success-soft text-success-strong',
    };
  }

  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
    return {
      label: 'Safari',
      tone: 'border-accent/30 bg-accent/10 text-accent-strong',
    };
  }

  return {
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

export function AdminEventMetadata({ event }: AdminEventMetadataProps) {
  const browser = getBrowserInfo(event.userAgent);
  const device = getDeviceInfo(event.userAgent, event.screenWidth);
  const metadataItems: Array<MetadataItem | null> = [
    browser
      ? {
          icon: Compass,
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
            <Icon aria-hidden="true" className="size-3.5" />
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
