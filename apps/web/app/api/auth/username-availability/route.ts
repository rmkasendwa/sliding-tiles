import { NextResponse } from 'next/server';

import {
  ApiRequestError,
  apiRequest,
  getApiFieldErrors,
  getApiMessage,
} from '@/lib/api';

type UsernameAvailabilityResponse = {
  available: boolean;
  suggestions: string[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') ?? '';

  try {
    const result = await apiRequest<UsernameAvailabilityResponse>(
      `/auth/username-availability?username=${encodeURIComponent(username)}`,
      { token: null },
    );

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;

    return NextResponse.json(
      {
        available: false,
        errors: getApiFieldErrors(error),
        message:
          getApiMessage(error) ??
          'Could not validate username availability right now.',
        suggestions: [],
      },
      { status },
    );
  }
}
