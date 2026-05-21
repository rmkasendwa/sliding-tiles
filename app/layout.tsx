import type { Metadata } from 'next';
import Link from 'next/link';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-line bg-background/85 backdrop-blur">
          <nav
            className="mx-auto flex min-h-18 w-[min(1180px,calc(100%_-_32px))] items-center justify-between gap-6 max-[820px]:flex-col max-[820px]:items-start max-[820px]:py-3.5"
            aria-label="Primary navigation"
          >
            <Link className="grid gap-0.5" href="/">
              <strong className="text-[1.05rem]">Sliding Tiles</strong>
              <span className="text-[0.82rem] text-muted">
                {session ? `Playing as ${session.name}` : 'Play your way'}
              </span>
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-2 max-[820px]:justify-start">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-transparent px-3.5 text-foreground hover:bg-accent/10"
                href="/play"
              >
                Play
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-transparent px-3.5 text-foreground hover:bg-accent/10"
                href="/leaderboard"
              >
                Leaderboard
              </Link>
              {session ? (
                <>
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-transparent px-3.5 text-foreground hover:bg-accent/10"
                    href="/profile"
                  >
                    Profile
                  </Link>
                  <form action={logout}>
                    <button
                      className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[7px] border border-danger/30 px-3.5 font-bold text-danger"
                      type="submit"
                    >
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-transparent px-3.5 text-foreground hover:bg-accent/10"
                    href="/login"
                  >
                    Log in
                  </Link>
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent bg-accent px-3.5 font-bold text-white"
                    href="/signup"
                  >
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
