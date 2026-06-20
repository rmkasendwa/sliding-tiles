import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

const SESSION_COOKIE_NAME = 'sliding_tiles_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  avatarUrl?: string | null;
  emailVerified: boolean;
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
  username: string;
  email: string;
};

function getApiBaseUrl() {
  return (process.env.API_BASE_URL ?? 'http://localhost:4001/api').replace(
    /\/$/,
    '',
  );
}

export async function setSessionToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + SESSION_DURATION_SECONDS * 1000),
    path: '/',
  });
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { user?: SessionUser };
    return body.user ?? null;
  } catch {
    return null;
  }
});

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    expires: new Date(0),
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
