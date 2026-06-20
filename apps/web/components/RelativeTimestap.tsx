function formatCompletedAt(isoDate: string, now: number) {
  const completedAt = new Date(isoDate);
  const elapsedMs = Math.max(0, now - completedAt.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);

  if (elapsedMinutes < 1) {
    return 'Just now';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} ${elapsedMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} ${elapsedHours === 1 ? 'hour' : 'hours'} ago`;
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(completedAt);
}

function formatFullCompletedAt(isoDate: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(new Date(isoDate));
}

export function RelativeTimestap({
  isoDate,
  now,
}: {
  isoDate: string;
  now: number;
}) {
  return (
    <time dateTime={isoDate} title={formatFullCompletedAt(isoDate)}>
      {formatCompletedAt(isoDate, now)}
    </time>
  );
}
