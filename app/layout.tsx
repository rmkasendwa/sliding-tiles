import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { logout } from '@/app/actions/auth';
import { getSession } from '@/lib/session';

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

const criticalCss = readFileSync(
  path.join(process.cwd(), 'app', 'globals.css'),
  'utf8'
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <head>
        <style
          data-critical-css="true"
          dangerouslySetInnerHTML={{ __html: criticalCss }}
        />
      </head>
      <body>
        <header className="site-header">
          <nav className="shell nav" aria-label="Primary navigation">
            <Link className="brand" href="/">
              <strong>Sliding Tiles</strong>
              <span>
                {session ? `Playing as ${session.name}` : 'Play your way'}
              </span>
            </Link>
            <div className="nav-links">
              <Link className="nav-link" href="/play">
                Play
              </Link>
              <Link className="nav-link" href="/leaderboard">
                Leaderboard
              </Link>
              {session ? (
                <>
                  <Link className="nav-link" href="/profile">
                    Profile
                  </Link>
                  <form action={logout}>
                    <button className="button danger" type="submit">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="nav-link" href="/login">
                    Log in
                  </Link>
                  <Link className="button" href="/signup">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
