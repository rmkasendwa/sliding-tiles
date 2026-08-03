import { NextRequest, NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/session';

function apiUrl(path = '') {
  return `${(process.env.API_BASE_URL ?? 'http://localhost:4001/api').replace(/\/$/, '')}/puzzle-images${path}`;
}

async function unauthorized() {
  return NextResponse.json({ message: 'Authentication is required.' }, { status: 401 });
}

export async function GET() {
  const token = await getSessionToken();
  if (!token) return unauthorized();
  const response = await fetch(apiUrl(), {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  return new NextResponse(response.body, {
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
    status: response.status,
  });
}

export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) return unauthorized();
  const response = await fetch(apiUrl(), {
    body: await request.formData(),
    headers: { Authorization: `Bearer ${token}` },
    method: 'POST',
  });
  return new NextResponse(response.body, {
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
    status: response.status,
  });
}

export async function PUT(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) return unauthorized();
  const response = await fetch(`${apiUrl()}/selection`, {
    body: await request.text(),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  });
  return new NextResponse(response.body, {
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
    status: response.status,
  });
}
