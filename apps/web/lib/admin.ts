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
