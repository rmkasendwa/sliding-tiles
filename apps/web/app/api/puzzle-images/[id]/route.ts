import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/session';

function apiUrl(id: string, suffix = '') {
  const base = (process.env.API_BASE_URL ?? 'http://localhost:4001/api').replace(/\/$/, '');
  return `${base}/puzzle-images/${encodeURIComponent(id)}${suffix}`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: 'Authentication is required.' }, { status: 401 });
  const { id } = await context.params;
  const response = await fetch(apiUrl(id, '/content'), {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  return new NextResponse(response.body, {
    headers: {
      'Cache-Control': response.headers.get('Cache-Control') ?? 'private, max-age=31536000, immutable',
      'Content-Length': response.headers.get('Content-Length') ?? '',
      'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream',
    },
    status: response.status,
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: 'Authentication is required.' }, { status: 401 });
  const { id } = await context.params;
  const response = await fetch(apiUrl(id), {
    headers: { Authorization: `Bearer ${token}` },
    method: 'DELETE',
  });
  return new NextResponse(response.body, {
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
    status: response.status,
  });
}
