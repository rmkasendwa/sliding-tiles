import { ImageResponse } from 'next/og';

import { OpenGraphImage, ogImageSize } from '@/lib/og-image';

export const alt = 'Sliding Tiles: Fast. Simple. Competitive.';
export const contentType = 'image/png';
export const runtime = 'edge';
export const size = ogImageSize;

function getDisplayUrl() {
  const fallbackHostname = 'slidingtiles.infinitedebugger.com';
  const baseUrl =
    process.env.WEB_BASE_URL ??
    process.env.NEXT_PUBLIC_WEB_BASE_URL ??
    `https://${fallbackHostname}`;
  const hostname = new URL(baseUrl).hostname.replace(/^www\./, '');

  return hostname === 'localhost' || hostname === '127.0.0.1'
    ? fallbackHostname
    : hostname;
}

export default function Image() {
  return new ImageResponse(<OpenGraphImage url={getDisplayUrl()} />, {
    ...ogImageSize,
  });
}
