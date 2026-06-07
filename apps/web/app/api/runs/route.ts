import { NextResponse } from 'next/server';

import {
  ApiRequestError,
  type ApiRunPage,
  apiRequest,
  getApiMessage,
} from '@/lib/api';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { message: 'Authentication required.' },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();

  for (const key of ['attemptType', 'cursor', 'take']) {
    const value = searchParams.get(key);
    if (value) {
      params.set(key, value);
    }
  }

  try {
    const page = await apiRequest<ApiRunPage>(
      `/leaderboard/mine?${params.toString()}`,
    );
    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json(
      { message: getApiMessage(error) ?? 'Unable to load run history.' },
      { status: error instanceof ApiRequestError ? error.status : 500 },
    );
  }
}
