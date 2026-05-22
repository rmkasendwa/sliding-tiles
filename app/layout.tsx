import type { Metadata } from 'next';

import { MainFooter } from '@/components/MainFooter';
import { MainHeader } from '@/components/MainHeader';
import { SoundProvider } from '@/components/SoundProvider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Sliding Tiles',
  description: 'A sliding tile puzzle with accounts and leaderboards.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
      { url: '/logo192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/logo192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SoundProvider>
          <div className="flex min-h-screen flex-col">
            <MainHeader />
            <main className="flex-1">{children}</main>
            <MainFooter />
          </div>
        </SoundProvider>
      </body>
    </html>
  );
}
