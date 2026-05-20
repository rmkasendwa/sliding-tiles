import type { Metadata } from 'next';
import Link from 'next/link';

import { logout } from '@/app/actions/auth';
import { getSession } from '@/lib/session';

import './globals.css';

export const metadata: Metadata = {
  title: 'Sliding Tiles',
  description: 'A sliding tile puzzle with accounts and leaderboards.',
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
        <header className="site-header">
          <nav className="shell nav" aria-label="Primary navigation">
            <Link className="brand" href="/">
              <strong>Sliding Tiles</strong>
              <span>
                {session ? `Playing as ${session.name}` : 'Play your way'}
              </span>
            </Link>
            <div className="nav-links">
              <a className="nav-link" href="/play">
                Play
              </a>
              <a className="nav-link" href="/leaderboard">
                Leaderboard
              </a>
              {session ? (
                <>
                  <a className="nav-link" href="/profile">
                    Profile
                  </a>
                  <form action={logout}>
                    <button className="button danger" type="submit">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <a className="nav-link" href="/login">
                    Log in
                  </a>
                  <a className="button" href="/signup">
                    Sign up
                  </a>
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
