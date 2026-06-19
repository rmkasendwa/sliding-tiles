'use client';

import { History, LogOut, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { routes, type AppRoute } from '@/lib/routes';
import { getUserDisplayName } from '@/lib/user-display';

import { FrogLogo } from '../FrogLogo';
import { ProfileAvatar } from '../ProfileAvatar';
import { ThemeControl } from '../ThemeControl';

type MainHeaderNavProps = {
  logout: () => Promise<void>;
  session: {
    avatarUrl?: string | null;
    email: string;
    name: string;
    username: string;
  } | null;
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
  const isPlayPage = pathname === routes.play;
  const [hasScrolledRevealPage, setHasScrolledRevealPage] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sessionDisplayName = session ? getUserDisplayName(session) : null;
  const shouldRevealHeader =
    !(isHomePage || isPlayPage) || hasScrolledRevealPage;
  const closeDrawer = () => setIsDrawerOpen(false);
  const closeAccountMenu = () => setIsAccountMenuOpen(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isHomePage && !isPlayPage) {
      return;
    }

    const updateScrolledState = () => {
      setHasScrolledRevealPage(window.scrollY > 48);
    };

    const frameId = window.requestAnimationFrame(updateScrolledState);
    window.addEventListener('scroll', updateScrolledState, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', updateScrolledState);
    };
  }, [isHomePage, isPlayPage]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsDrawerOpen(false);
      setIsAccountMenuOpen(false);
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

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        accountMenuRef.current?.contains(target) ||
        accountButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsAccountMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

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
      {!session ? (
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
              isRouteActive(pathname, routes.register) ? 'page' : undefined
            }
            className={[
              baseLinkClass,
              isRouteActive(pathname, routes.register)
                ? 'border-primary-strong/50 bg-primary-strong px-3.5 font-bold text-primary-contrast'
                : 'border-primary bg-primary font-bold text-primary-contrast',
            ].join(' ')}
            href={routes.register}
            onClick={closeDrawer}
          >
            Register
          </Link>
        </>
      ) : null}
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
          <Link
            aria-current={
              isRouteActive(pathname, routes.runs) ? 'page' : undefined
            }
            className={getDrawerLinkClass(
              isRouteActive(pathname, routes.runs),
            )}
            href={routes.runs}
            onClick={closeDrawer}
          >
            <span>Run History</span>
            {isRouteActive(pathname, routes.runs) ? (
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
              isRouteActive(pathname, routes.register) ? 'page' : undefined
            }
            className="flex min-h-12 items-center rounded-[7px] border border-primary bg-primary px-3 text-left text-[1.05rem] font-bold text-primary-contrast transition-colors hover:bg-primary-strong"
            href={routes.register}
            onClick={closeDrawer}
          >
            Register
          </Link>
        </>
      )}
    </>
  );

  return (
    <header
      className={[
        'top-0 z-50 border-b border-line bg-background/85 backdrop-blur transition-transform duration-300 ease-out',
        isHomePage || isPlayPage ? 'fixed inset-x-0' : 'sticky',
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
        <div className="flex items-center justify-end gap-2 max-[860px]:hidden">
          {desktopNavigationLinks}
          <ThemeControl />
          {session ? (
            <div className="relative">
              <button
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel py-0.5 pl-0.5 pr-2 text-left transition-colors hover:bg-accent/6"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                ref={accountButtonRef}
                type="button"
              >
                <ProfileAvatar
                  avatarUrl={session.avatarUrl}
                  className="text-[0.95rem] font-bold"
                  name={session.name}
                  size={40}
                />
                <span className="grid pr-1">
                  <strong className="max-w-48 truncate text-[0.95rem] text-foreground">
                    {session.name}
                  </strong>
                </span>
                <span className="mr-1 text-muted" aria-hidden="true">
                  ▾
                </span>
              </button>
              {isMounted ? (
                <div
                  className={[
                    'absolute right-0 top-full z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[18px] border border-line bg-panel shadow-panel transition-all duration-200',
                    isAccountMenuOpen
                      ? 'pointer-events-auto translate-y-0 opacity-100'
                      : 'pointer-events-none -translate-y-2 opacity-0',
                  ].join(' ')}
                  ref={accountMenuRef}
                  role="menu"
                >
                  <div className="border-b border-line px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        avatarUrl={session.avatarUrl}
                        className="text-sm font-bold"
                        name={session.name}
                        size={44}
                      />
                      <div className="min-w-0 grid gap-0.5">
                        <strong className="truncate text-[0.98rem] text-foreground">
                          {session.name}
                        </strong>
                        <span className="truncate text-[0.82rem] text-muted">
                          {sessionDisplayName && session.username
                            ? `@${sessionDisplayName}`
                            : sessionDisplayName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-1 p-2">
                    <Link
                      className="flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 text-[0.95rem] transition-colors hover:bg-accent/8"
                      href={routes.profile}
                      onClick={closeAccountMenu}
                      role="menuitem"
                    >
                      <User className="h-4 w-4 text-muted" aria-hidden="true" />
                      Profile
                    </Link>
                    <Link
                      className="flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 text-[0.95rem] transition-colors hover:bg-accent/8"
                      href={routes.runs}
                      onClick={closeAccountMenu}
                      role="menuitem"
                    >
                      <History
                        className="h-4 w-4 text-muted"
                        aria-hidden="true"
                      />
                      Run History
                    </Link>
                    <Link
                      className="flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 text-[0.95rem] transition-colors hover:bg-accent/8"
                      href={routes.leaderboard}
                      onClick={closeAccountMenu}
                      role="menuitem"
                    >
                      <Trophy
                        className="h-4 w-4 text-muted"
                        aria-hidden="true"
                      />
                      Leaderboard
                    </Link>
                    <form action={logout} onSubmit={closeAccountMenu}>
                      <button
                        className="flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[0.95rem] font-bold text-danger transition-colors hover:bg-danger/8"
                        type="submit"
                      >
                        <LogOut
                          className="h-4 w-4 text-danger/80"
                          aria-hidden="true"
                        />
                        Log out
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          aria-controls="mobile-navigation"
          aria-expanded={isDrawerOpen}
          aria-label="Open navigation menu"
          className="hidden h-11 w-11 cursor-pointer place-items-center rounded-[7px] border border-line text-accent-strong max-[860px]:grid"
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
                'fixed inset-0 z-50 bg-foreground/35 transition-opacity duration-200 min-[861px]:hidden',
                isDrawerOpen
                  ? 'pointer-events-auto opacity-100'
                  : 'pointer-events-none opacity-0',
              ].join(' ')}
              onClick={closeDrawer}
            />
            <aside
              className={[
                'fixed inset-y-0 left-0 z-50 grid w-[min(360px,calc(100%-40px))] content-start gap-6 border-r border-line bg-panel p-5 shadow-panel transition-transform duration-300 ease-out min-[861px]:hidden',
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
                <div className="grid gap-1">{drawerNavigationLinks}</div>
                <div className="grid gap-2 rounded-lg border border-line bg-surface/60 p-3">
                  <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                    Theme
                  </p>
                  <ThemeControl layout="drawer" />
                </div>
              </div>
            </aside>
          </>,
          document.body,
        )}
    </header>
  );
}
