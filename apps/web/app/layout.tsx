import type { Metadata } from 'next';

import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { MainFooter } from '@/components/MainFooter';
import { MainHeader } from '@/components/MainHeader';
import { RouteProgressBar } from '@/components/RouteProgressBar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { pageMetadata, siteUrl } from '@/lib/metadata';
import { getSession } from '@/lib/session';
import { themeInitScript } from '@/lib/theme';

import './globals.css';

export const metadata: Metadata = {
  ...pageMetadata.home,
  metadataBase: siteUrl,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <RouteProgressBar />
          <div className="flex min-h-screen flex-col">
            <MainHeader session={session} />
            <EmailVerificationBanner session={session} />
            <main className="flex flex-1 flex-col items-start">{children}</main>
            <MainFooter />
          </div>
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
