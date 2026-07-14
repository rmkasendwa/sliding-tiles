import { NextResponse } from 'next/server';

import { ApiRequestError, apiRequest } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await apiRequest<{ accepted: number }>(
      '/anonymous-analytics/events',
      {
        body,
        method: 'POST',
      },
    );

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Analytics event batch was not accepted.' },
      { status: error instanceof ApiRequestError ? error.status : 400 },
    );
  }
}
