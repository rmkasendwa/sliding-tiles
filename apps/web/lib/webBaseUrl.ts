const fallbackWebBaseUrl = 'http://localhost:3000';

export function getWebBaseUrl(requestUrl?: string | URL) {
  const configuredBaseUrl =
    process.env.WEB_BASE_URL ?? process.env.NEXT_PUBLIC_WEB_BASE_URL;

  if (configuredBaseUrl?.trim()) {
    return configuredBaseUrl.trim().replace(/\/$/, '');
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  return fallbackWebBaseUrl;
}
