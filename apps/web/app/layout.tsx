import type { Metadata } from 'next';

import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { MainFooter } from '@/components/MainFooter';
import { MainHeader } from '@/components/MainHeader';
import { RouteProgressBar } from '@/components/RouteProgressBar';
import { pageMetadata, siteUrl } from '@/lib/metadata';

import './globals.css';

export const metadata: Metadata = {
  ...pageMetadata.home,
  metadataBase: siteUrl,
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
        <RouteProgressBar />
        <div className="flex min-h-screen flex-col">
          <MainHeader />
          <main className="flex flex-1 flex-col items-start">{children}</main>
          <MainFooter />
        </div>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
