'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { routes, type AppRoute } from '@/lib/routes';

import { FrogLogo } from './FrogLogo';

type MainHeaderNavProps = {
  logout: () => Promise<void>;
  session: { name: string } | null;
};

const baseLinkClass =
  'inline-flex min-h-10 items-center justify-center rounded-[7px] border px-3.5 transition-colors';
const inactiveLinkClass =
  'border-transparent text-foreground hover:bg-accent/10';
const activeLinkClass = 'border-transparent bg-accent/6 text-accent-strong';
const drawerLinkClass =
  'group flex min-h-12 items-center justify-between rounded-[7px] border border-transparent px-3 text-left text-[1.05rem] transition-colors hover:bg-accent/8';
const drawerActiveLinkClass =
  'border-line bg-accent/8 font-bold text-accent-strong';
const drawerInactiveLinkClass = 'text-foreground';

function getNavLinkClass(isActive: boolean) {
  return [baseLinkClass, isActive ? activeLinkClass : inactiveLinkClass].join(
    ' ',
  );
}

function getDrawerLinkClass(isActive: boolean) {
  return [
    drawerLinkClass,
    isActive ? drawerActiveLinkClass : drawerInactiveLinkClass,
  ].join(' ');
}

function isRouteActive(pathname: string, href: AppRoute) {
  if (href === routes.home) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainHeaderNav({ logout, session }: MainHeaderNavProps) {
  const pathname = usePathname();
  const isHomePage = pathname === routes.home;
  const [hasScrolledHome, setHasScrolledHome] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const shouldRevealHeader = !isHomePage || hasScrolledHome;
  const closeDrawer = () => setIsDrawerOpen(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const updateScrolledState = () => {
      setHasScrolledHome(window.scrollY > 48);
    };

    const frameId = window.requestAnimationFrame(updateScrolledState);
    window.addEventListener('scroll', updateScrolledState, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', updateScrolledState);
    };
  }, [isHomePage]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsDrawerOpen(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  const desktopNavigationLinks = (
    <>
      <Link
        aria-current={isRouteActive(pathname, routes.play) ? 'page' : undefined}
        className={getNavLinkClass(isRouteActive(pathname, routes.play))}
        href={routes.play}
        onClick={closeDrawer}
      >
        Play
      </Link>
      <Link
        aria-current={
          isRouteActive(pathname, routes.leaderboard) ? 'page' : undefined
        }
        className={getNavLinkClass(isRouteActive(pathname, routes.leaderboard))}
        href={routes.leaderboard}
        onClick={closeDrawer}
      >
        Leaderboard
      </Link>
      {session ? (
        <>
          <Link
            aria-current={
              isRouteActive(pathname, routes.profile) ? 'page' : undefined
            }
            className={getNavLinkClass(isRouteActive(pathname, routes.profile))}
            href={routes.profile}
            onClick={closeDrawer}
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
            className={getNavLinkClass(isRouteActive(pathname, routes.login))}
            href={routes.login}
            onClick={closeDrawer}
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
            onClick={closeDrawer}
          >
            Sign up
          </Link>
        </>
      )}
    </>
  );

  const drawerNavigationLinks = (
    <>
      <Link
        aria-current={isRouteActive(pathname, routes.play) ? 'page' : undefined}
        className={getDrawerLinkClass(isRouteActive(pathname, routes.play))}
        href={routes.play}
        onClick={closeDrawer}
      >
        <span>Play</span>
        {isRouteActive(pathname, routes.play) ? (
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        ) : null}
      </Link>
      <Link
        aria-current={
          isRouteActive(pathname, routes.leaderboard) ? 'page' : undefined
        }
        className={getDrawerLinkClass(
          isRouteActive(pathname, routes.leaderboard),
        )}
        href={routes.leaderboard}
        onClick={closeDrawer}
      >
        <span>Leaderboard</span>
        {isRouteActive(pathname, routes.leaderboard) ? (
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        ) : null}
      </Link>
      {session ? (
        <>
          <Link
            aria-current={
              isRouteActive(pathname, routes.profile) ? 'page' : undefined
            }
            className={getDrawerLinkClass(
              isRouteActive(pathname, routes.profile),
            )}
            href={routes.profile}
            onClick={closeDrawer}
          >
            <span>Profile</span>
            {isRouteActive(pathname, routes.profile) ? (
              <span
                className="h-2 w-2 rounded-full bg-accent"
                aria-hidden="true"
              />
            ) : null}
          </Link>
          <form action={logout}>
            <button
              className="flex min-h-12 w-full cursor-pointer items-center rounded-[7px] px-3 text-left text-[1.05rem] font-bold text-danger transition-colors hover:bg-danger/8"
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
            className={getDrawerLinkClass(
              isRouteActive(pathname, routes.login),
            )}
            href={routes.login}
            onClick={closeDrawer}
          >
            <span>Log in</span>
            {isRouteActive(pathname, routes.login) ? (
              <span
                className="h-2 w-2 rounded-full bg-accent"
                aria-hidden="true"
              />
            ) : null}
          </Link>
          <Link
            aria-current={
              isRouteActive(pathname, routes.signup) ? 'page' : undefined
            }
            className="flex min-h-12 items-center rounded-[7px] bg-accent px-3 text-left text-[1.05rem] font-bold text-white transition-colors hover:bg-accent-strong"
            href={routes.signup}
            onClick={closeDrawer}
          >
            Sign up
          </Link>
        </>
      )}
    </>
  );

  return (
    <header
      className={[
        'top-0 z-30 border-b border-line bg-background/85 backdrop-blur transition-transform duration-300 ease-out',
        isHomePage ? 'fixed inset-x-0' : 'sticky',
        shouldRevealHeader
          ? 'translate-y-0'
          : 'pointer-events-none -translate-y-full',
      ].join(' ')}
    >
      <nav
        className="page-rail mx-auto flex min-h-18 items-center justify-between gap-6"
        aria-label="Primary navigation"
      >
        <Link className="flex items-center gap-3" href={routes.home}>
          <FrogLogo className="w-10 shrink-0" />
          <span className="grid gap-0.5">
            <strong className="text-[1.05rem]">Sliding Tiles</strong>
            <span className="text-[0.82rem] text-muted">
              {session ? `Playing as ${session.name}` : 'Play your way'}
            </span>
          </span>
        </Link>
        <div className="flex items-center justify-end gap-2 max-[760px]:hidden">
          {desktopNavigationLinks}
        </div>
        <button
          aria-controls="mobile-navigation"
          aria-expanded={isDrawerOpen}
          aria-label="Open navigation menu"
          className="hidden h-11 w-11 cursor-pointer place-items-center rounded-[7px] border border-line text-accent-strong max-[760px]:grid"
          onClick={() => setIsDrawerOpen(true)}
          type="button"
        >
          <span className="grid gap-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>
      </nav>
      {isMounted &&
        createPortal(
          <>
            <div
              className={[
                'fixed inset-0 z-40 bg-foreground/35 transition-opacity duration-200 min-[761px]:hidden',
                isDrawerOpen
                  ? 'pointer-events-auto opacity-100'
                  : 'pointer-events-none opacity-0',
              ].join(' ')}
              onClick={closeDrawer}
            />
            <aside
              className={[
                'fixed inset-y-0 left-0 z-50 grid w-[min(320px,calc(100%-40px))] content-start gap-6 border-r border-line bg-panel p-5 shadow-panel transition-transform duration-300 ease-out min-[761px]:hidden',
                isDrawerOpen ? 'translate-x-0' : '-translate-x-full',
              ].join(' ')}
              id="mobile-navigation"
            >
              <div className="flex items-center justify-between gap-4">
                <Link className="flex items-center gap-3" href={routes.home}>
                  <FrogLogo className="w-10 shrink-0" />
                  <span className="grid gap-0.5">
                    <strong>Sliding Tiles</strong>
                    <span className="text-[0.82rem] text-muted">
                      {session ? `Playing as ${session.name}` : 'Play your way'}
                    </span>
                  </span>
                </Link>
                <button
                  aria-label="Close navigation menu"
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-[7px] border border-line text-muted"
                  onClick={closeDrawer}
                  type="button"
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
              <div className="grid gap-5">
                <div className="grid gap-1">
                  <span className="px-3 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-accent-strong">
                    Navigation
                  </span>
                  <div className="grid gap-1">{drawerNavigationLinks}</div>
                </div>
              </div>
            </aside>
          </>,
          document.body,
        )}
    </header>
  );
}
