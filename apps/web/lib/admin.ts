export function getAnalyticsParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function buildAnalyticsEventsQuery(
  params: Record<string, string | string[] | undefined>,
  take = '5',
  includeCursor = true,
) {
  const query = new URLSearchParams({ take });
  for (const key of [
    'boardSize',
    ...(includeCursor ? ['cursor'] : []),
    'dateFrom',
    'dateTo',
    'eventName',
    'level',
    'sessionId',
  ]) {
    const value = getAnalyticsParam(params[key]);
    if (value) {
      query.set(key, value);
    }
  }

  return query;
}

export function formatAnalyticsMetric(
  value: number | null,
  type: 'duration' | 'number' | 'percent' = 'number',
) {
  if (value === null) {
    return 'n/a';
  }

  if (type === 'percent') {
    return `${value.toFixed(1)}%`;
  }

  if (type === 'duration') {
    const seconds = Math.round(value / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

export function humanizeAnalyticsEventName(eventName: string) {
  return eventName.replaceAll('_', ' ');
}
