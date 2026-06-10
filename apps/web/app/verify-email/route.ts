import { NextResponse } from 'next/server';

import { ApiRequestError, AuthResponse, apiRequest } from '@/lib/api';
import { routes } from '@/lib/routes';
import { setSessionToken } from '@/lib/session';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get('token')?.trim();
  const resultUrl = new URL(routes.emailVerification, requestUrl.origin);

  if (!token) {
    resultUrl.searchParams.set('status', 'invalid');
    return NextResponse.redirect(resultUrl);
  }

  try {
    const response = await apiRequest<AuthResponse>('/auth/verify-email', {
      body: { token },
      method: 'POST',
      token: null,
    });
    await setSessionToken(response.accessToken);
    resultUrl.searchParams.set('status', 'success');
  } catch (error) {
    resultUrl.searchParams.set(
      'status',
      error instanceof ApiRequestError && error.status === 400
        ? 'invalid'
        : 'error',
    );
  }

  return NextResponse.redirect(resultUrl);
}
