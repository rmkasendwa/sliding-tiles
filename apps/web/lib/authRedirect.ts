import { routes } from './routes';

export function getSafeReturnTo(
  value: string | string[] | null | undefined,
  fallback = routes.play,
) {
  const returnTo = Array.isArray(value) ? value[0] : value;

  if (
    !returnTo ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.includes('\\')
  ) {
    return fallback;
  }

  const pathname = returnTo.split(/[?#]/, 1)[0];
  if (pathname === routes.login || pathname === routes.register) {
    return fallback;
  }

  return returnTo;
}

export function getLoginUrl(returnTo: string) {
  const params = new URLSearchParams({ returnTo });
  return `${routes.login}?${params}`;
}
