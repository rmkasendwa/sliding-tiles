import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { getSafeReturnTo } from '@/lib/authRedirect';
import { getWebBaseUrl } from '@/lib/webBaseUrl';

import {
  GOOGLE_OAUTH_ANALYTICS_ID_COOKIE,
  GOOGLE_OAUTH_ANALYTICS_SESSION_COOKIE,
  GOOGLE_OAUTH_ANONYMOUS_PROGRESS_COOKIE,
  GOOGLE_OAUTH_ORIGIN_COOKIE,
  GOOGLE_OAUTH_RETURN_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  getGoogleAuthEntryPoint,
  getSafeAnalyticsBoolean,
  getSafeAnalyticsId,
  getGoogleAuthPage,
  recordGoogleAuthAnalytics,
} from './analytics';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const returnTo = getSafeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const requestedOrigin = request.nextUrl.searchParams.get('origin') ?? undefined;
  const origin = getGoogleAuthPage(
    requestedOrigin,
  );
  const analyticsAnonymousId = getSafeAnalyticsId(
    request.nextUrl.searchParams.get('analyticsAnonymousId'),
  );
  const analyticsSessionId = getSafeAnalyticsId(
    request.nextUrl.searchParams.get('analyticsSessionId'),
  );
  const anonymousProgressExisted = getSafeAnalyticsBoolean(
    request.nextUrl.searchParams.get('anonymousProgressExisted'),
  );
  if (!clientId) {
    await recordGoogleAuthAnalytics({
      anonymousId: analyticsAnonymousId,
      anonymousProgressExisted,
      entryPoint: getGoogleAuthEntryPoint(requestedOrigin),
      eventName: 'google_auth_failed',
      failureCategory: 'unavailable',
      request,
      sessionId: analyticsSessionId,
    });
    return NextResponse.redirect(new URL(`/${origin}?oauthError=unavailable`, request.url));
  }

  const state = randomBytes(32).toString('base64url');
  const webBaseUrl = getWebBaseUrl(request.url);
  const redirectUri = `${webBaseUrl}/api/auth/google/callback`;
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_RETURN_COOKIE, returnTo, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_ORIGIN_COOKIE, origin, cookieOptions);
  if (analyticsAnonymousId) {
    response.cookies.set(
      GOOGLE_OAUTH_ANALYTICS_ID_COOKIE,
      analyticsAnonymousId,
      cookieOptions,
    );
  }
  if (analyticsSessionId) {
    response.cookies.set(
      GOOGLE_OAUTH_ANALYTICS_SESSION_COOKIE,
      analyticsSessionId,
      cookieOptions,
    );
  }
  if (anonymousProgressExisted !== undefined) {
    response.cookies.set(
      GOOGLE_OAUTH_ANONYMOUS_PROGRESS_COOKIE,
      String(anonymousProgressExisted),
      cookieOptions,
    );
  }
  return response;
}
