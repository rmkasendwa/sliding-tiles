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
  getGoogleAuthPage,
  getOAuthFailureCategory,
  getSafeAnalyticsBoolean,
  getSafeAnalyticsId,
  recordGoogleAuthAnalytics,
  type GoogleAuthFailureCategory,
  type GoogleAuthOutcome,
} from '../analytics';

function getAnalyticsContext(request: NextRequest) {
  const origin = request.cookies.get(GOOGLE_OAUTH_ORIGIN_COOKIE)?.value;
  return {
    anonymousId: getSafeAnalyticsId(
      request.cookies.get(GOOGLE_OAUTH_ANALYTICS_ID_COOKIE)?.value ?? null,
    ),
    anonymousProgressExisted: getSafeAnalyticsBoolean(
      request.cookies.get(GOOGLE_OAUTH_ANONYMOUS_PROGRESS_COOKIE)?.value ?? null,
    ),
    entryPoint: getGoogleAuthEntryPoint(origin),
    sessionId: getSafeAnalyticsId(
      request.cookies.get(GOOGLE_OAUTH_ANALYTICS_SESSION_COOKIE)?.value ?? null,
    ),
  };
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  response.cookies.delete(GOOGLE_OAUTH_RETURN_COOKIE);
  response.cookies.delete(GOOGLE_OAUTH_ORIGIN_COOKIE);
  response.cookies.delete(GOOGLE_OAUTH_ANALYTICS_ID_COOKIE);
  response.cookies.delete(GOOGLE_OAUTH_ANALYTICS_SESSION_COOKIE);
  response.cookies.delete(GOOGLE_OAUTH_ANONYMOUS_PROGRESS_COOKIE);
}

async function authPage(
  request: NextRequest,
  error: string,
  failureCategory: GoogleAuthFailureCategory,
) {
  const origin = request.cookies.get(GOOGLE_OAUTH_ORIGIN_COOKIE)?.value;
  const page = getGoogleAuthPage(origin);
  const returnTo = getSafeReturnTo(
    request.cookies.get(GOOGLE_OAUTH_RETURN_COOKIE)?.value,
  );
  const analyticsContext = getAnalyticsContext(request);
  await recordGoogleAuthAnalytics({
    ...analyticsContext,
    eventName: 'google_auth_failed',
    failureCategory,
    request,
  });
  const url = new URL(`/${page}`, getWebBaseUrl(request.url));
  url.searchParams.set('oauthError', error);
  url.searchParams.set('returnTo', returnTo);
  const response = NextResponse.redirect(url);
  clearOAuthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  const oauthError = request.nextUrl.searchParams.get('error');
  if (oauthError) {
    return authPage(request, 'cancelled', getOAuthFailureCategory(oauthError));
  }
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return authPage(request, 'invalid_state', 'invalid_state');
  }

  try {
    const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:4001/api').replace(/\/$/, '');
    const apiResponse = await fetch(`${apiBaseUrl}/auth/google`, {
      body: JSON.stringify({ code }),
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const body = (await apiResponse.json()) as {
      accessToken?: string;
      googleAuthOutcome?: GoogleAuthOutcome;
    };
    if (!apiResponse.ok || !body.accessToken) {
      return authPage(request, 'failed', 'callback_failure');
    }

    await recordGoogleAuthAnalytics({
      ...getAnalyticsContext(request),
      eventName: 'google_auth_completed',
      outcome: body.googleAuthOutcome,
      request,
      token: body.accessToken,
    });

    const returnTo = getSafeReturnTo(
      request.cookies.get(GOOGLE_OAUTH_RETURN_COOKIE)?.value,
    );
    const response = NextResponse.redirect(new URL(returnTo, getWebBaseUrl(request.url)));
    response.cookies.set('sliding_tiles_session', body.accessToken, {
      expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    clearOAuthCookies(response);
    return response;
  } catch {
    return authPage(request, 'failed', 'callback_failure');
  }
}
