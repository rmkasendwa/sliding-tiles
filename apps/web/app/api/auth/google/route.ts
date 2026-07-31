import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { getSafeReturnTo } from '@/lib/authRedirect';

const STATE_COOKIE = 'google_oauth_state';
const RETURN_COOKIE = 'google_oauth_return_to';
const ORIGIN_COOKIE = 'google_oauth_origin';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const returnTo = getSafeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const origin = request.nextUrl.searchParams.get('origin') === 'register' ? 'register' : 'login';
  if (!clientId) {
    return NextResponse.redirect(new URL(`/${origin}?oauthError=unavailable`, request.url));
  }

  const state = randomBytes(32).toString('base64url');
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
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
  response.cookies.set(STATE_COOKIE, state, cookieOptions);
  response.cookies.set(RETURN_COOKIE, returnTo, cookieOptions);
  response.cookies.set(ORIGIN_COOKIE, origin, cookieOptions);
  return response;
}
