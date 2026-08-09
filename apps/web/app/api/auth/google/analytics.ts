import { NextRequest } from 'next/server';

export const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_state';
export const GOOGLE_OAUTH_RETURN_COOKIE = 'google_oauth_return_to';
export const GOOGLE_OAUTH_ORIGIN_COOKIE = 'google_oauth_origin';
export const GOOGLE_OAUTH_ANALYTICS_ID_COOKIE =
  'google_oauth_analytics_anonymous_id';
export const GOOGLE_OAUTH_ANALYTICS_SESSION_COOKIE =
  'google_oauth_analytics_session_id';
export const GOOGLE_OAUTH_ANONYMOUS_PROGRESS_COOKIE =
  'google_oauth_anonymous_progress';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type GoogleAuthEntryPoint = 'login' | 'signup';
export type GoogleAuthOutcome =
  | 'new_account'
  | 'existing_google_account'
  | 'linked_existing_account';
export type GoogleAuthFailureCategory =
  | 'callback_failure'
  | 'cancelled'
  | 'invalid_state'
  | 'oauth_rejection'
  | 'unavailable';

export function getGoogleAuthEntryPoint(
  origin: string | undefined,
): GoogleAuthEntryPoint {
  return origin === 'register' || origin === 'signup' ? 'signup' : 'login';
}

export function getGoogleAuthPage(origin: string | undefined) {
  return getGoogleAuthEntryPoint(origin) === 'signup' ? 'register' : 'login';
}

export function getSafeAnalyticsId(value: string | null) {
  return value && UUID_PATTERN.test(value) ? value : null;
}

export function getSafeAnalyticsBoolean(value: string | null) {
  return value === 'true' ? true : value === 'false' ? false : undefined;
}

export function getOAuthFailureCategory(error: string | null) {
  if (!error) {
    return 'cancelled' satisfies GoogleAuthFailureCategory;
  }

  return error === 'access_denied'
    ? ('oauth_rejection' satisfies GoogleAuthFailureCategory)
    : ('cancelled' satisfies GoogleAuthFailureCategory);
}

export async function recordGoogleAuthAnalytics({
  anonymousId,
  anonymousProgressExisted,
  entryPoint,
  eventName,
  failureCategory,
  outcome,
  request,
  sessionId,
  token,
}: {
  anonymousId: string | null;
  anonymousProgressExisted?: boolean;
  entryPoint: GoogleAuthEntryPoint;
  eventName: 'google_auth_completed' | 'google_auth_failed';
  failureCategory?: GoogleAuthFailureCategory;
  outcome?: GoogleAuthOutcome;
  request: NextRequest;
  sessionId: string | null;
  token?: string;
}) {
  if (!anonymousId || !sessionId) {
    return;
  }

  try {
    const apiBaseUrl = (
      process.env.API_BASE_URL ?? 'http://localhost:4001/api'
    ).replace(/\/$/, '');
    await fetch(`${apiBaseUrl}/anonymous-analytics/events`, {
      body: JSON.stringify({
        events: [
          {
            anonymousId,
            eventName,
            metadata: {
              anonymousProgressExisted,
              entryPoint,
              failureCategory,
              outcome,
              provider: 'google',
            },
            pathname: request.nextUrl.pathname,
            referrer: request.headers.get('referer') ?? undefined,
            sessionId,
            timestamp: new Date().toISOString(),
            userAgent:
              request.headers.get('user-agent')?.slice(0, 512) ?? undefined,
          },
        ],
      }),
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      method: 'POST',
    });
  } catch {
    // Analytics must never interfere with authentication.
  }
}
