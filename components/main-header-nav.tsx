'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { routes, type AppRoute } from '@/lib/routes';

import { useSound } from './sound-provider';

type MainHeaderNavProps = {
  logout: () => Promise<void>;
  session: { name: string } | null;
};

const baseLinkClass =
  'inline-flex min-h-10 items-center justify-center rounded-[7px] border px-3.5 transition-colors';
const inactiveLinkClass =
  'border-transparent text-foreground hover:bg-accent/10';
const activeLinkClass = 'border-transparent bg-accent/6 text-accent-strong';

function getNavLinkClass(isActive: boolean) {
  return [baseLinkClass, isActive ? activeLinkClass : inactiveLinkClass].join(
    ' ',
  );
}

function isRouteActive(pathname: string, href: AppRoute) {
  if (href === routes.home) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainHeaderNav({ logout, session }: MainHeaderNavProps) {
  const pathname = usePathname();
  const { isMuted, toggleMuted } = useSound();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/85 backdrop-blur">
      <nav
        className="mx-auto flex min-h-18 w-[min(1600px,calc(100%-40px))] items-center justify-between gap-6 max-[820px]:flex-col max-[820px]:items-start max-[820px]:py-3.5"
        aria-label="Primary navigation"
      >
        <Link className="grid gap-0.5" href={routes.home}>
          <strong className="text-[1.05rem]">Sliding Tiles</strong>
          <span className="text-[0.82rem] text-muted">
            {session ? `Playing as ${session.name}` : 'Play your way'}
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 max-[820px]:justify-start">
          <Link
            aria-current={
              isRouteActive(pathname, routes.play) ? 'page' : undefined
            }
            className={getNavLinkClass(isRouteActive(pathname, routes.play))}
            href={routes.play}
          >
            Play
          </Link>
          <Link
            aria-current={
              isRouteActive(pathname, routes.leaderboard) ? 'page' : undefined
            }
            className={getNavLinkClass(
              isRouteActive(pathname, routes.leaderboard),
            )}
            href={routes.leaderboard}
          >
            Leaderboard
          </Link>
          {session ? (
            <>
              <Link
                aria-current={
                  isRouteActive(pathname, routes.profile) ? 'page' : undefined
                }
                className={getNavLinkClass(
                  isRouteActive(pathname, routes.profile),
                )}
                href={routes.profile}
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
                aria-current={
                  isRouteActive(pathname, routes.login) ? 'page' : undefined
                }
                className={getNavLinkClass(
                  isRouteActive(pathname, routes.login),
                )}
                href={routes.login}
              >
                Log in
              </Link>
              <Link
                aria-current={
                  isRouteActive(pathname, routes.signup) ? 'page' : undefined
                }
                className={[
                  baseLinkClass,
                  isRouteActive(pathname, routes.signup)
                    ? 'border-accent-strong/40 bg-accent-strong px-3.5 font-bold text-white'
                    : 'border-accent bg-accent font-bold text-white',
                ].join(' ')}
                href={routes.signup}
              >
                Sign up
              </Link>
            </>
          )}
          <button
            aria-pressed={!isMuted}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[7px] border border-line px-3.5 text-muted transition-colors hover:bg-accent/10 hover:text-accent-strong"
            onClick={toggleMuted}
            type="button"
          >
            {isMuted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
      </nav>
    </header>
  );
}
