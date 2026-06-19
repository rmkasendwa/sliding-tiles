import { ImageResponse } from 'next/og';

import { OpenGraphImage, ogImageSize } from '@/lib/og-image';

export const alt = 'Sliding Tiles: Fast. Simple. Competitive.';
export const contentType = 'image/png';
export const runtime = 'edge';
export const size = ogImageSize;

export default function Image() {
  return new ImageResponse(<OpenGraphImage />, {
    ...ogImageSize,
  });
}
