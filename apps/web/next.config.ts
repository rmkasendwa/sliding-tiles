import 'dotenv/config';

import type { NextConfig } from 'next';

const allowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
  output: 'standalone',
  reactStrictMode: true,
  async redirects() {
    return [
      {
        destination: '/admin/analytics',
        permanent: false,
        source: '/admin',
      },
    ];
  },
};

export default nextConfig;
