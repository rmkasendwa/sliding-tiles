import { NextRequest, NextResponse } from 'next/server';

import { getSafeReturnTo } from '@/lib/authRedirect';
import { getWebBaseUrl } from '@/lib/webBaseUrl';

const STATE_COOKIE = 'google_oauth_state';
const RETURN_COOKIE = 'google_oauth_return_to';
const ORIGIN_COOKIE = 'google_oauth_origin';

function authPage(request: NextRequest, error: string) {
  const origin = request.cookies.get(ORIGIN_COOKIE)?.value === 'register' ? 'register' : 'login';
  const returnTo = getSafeReturnTo(request.cookies.get(RETURN_COOKIE)?.value);
  const url = new URL(`/${origin}`, getWebBaseUrl(request.url));
  url.searchParams.set('oauthError', error);
  url.searchParams.set('returnTo', returnTo);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(RETURN_COOKIE);
  response.cookies.delete(ORIGIN_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('error')) {
    return authPage(request, 'cancelled');
  }
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return authPage(request, 'invalid_state');
  }

  try {
    const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:4001/api').replace(/\/$/, '');
    const apiResponse = await fetch(`${apiBaseUrl}/auth/google`, {
      body: JSON.stringify({ code }),
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const body = (await apiResponse.json()) as { accessToken?: string };
    if (!apiResponse.ok || !body.accessToken) return authPage(request, 'failed');

    const returnTo = getSafeReturnTo(request.cookies.get(RETURN_COOKIE)?.value);
    const response = NextResponse.redirect(new URL(returnTo, getWebBaseUrl(request.url)));
    response.cookies.set('sliding_tiles_session', body.accessToken, {
      expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    response.cookies.delete(STATE_COOKIE);
    response.cookies.delete(RETURN_COOKIE);
    response.cookies.delete(ORIGIN_COOKIE);
    return response;
  } catch {
    return authPage(request, 'failed');
  }
}
