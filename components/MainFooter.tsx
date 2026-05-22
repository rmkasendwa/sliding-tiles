import Link from 'next/link';

import { routes } from '@/lib/routes';

import { FrogLogo } from './FrogLogo';

const footerLinks = [
  { href: routes.play, label: 'Play' },
  { href: routes.leaderboard, label: 'Leaderboard' },
  { href: routes.login, label: 'Log in' },
  { href: routes.signup, label: 'Sign up' },
];

export function MainFooter() {
  return (
    <footer className="border-t border-line bg-background/70">
      <div className="mx-auto flex w-[min(1600px,calc(100%-40px))] flex-wrap items-center justify-between gap-4 py-4 text-sm text-muted">
        <div className="flex items-center gap-3">
          <FrogLogo className="w-9 shrink-0" variant="monochrome" />
          <div className="grid gap-1">
          <Link
            className="font-bold text-foreground transition-colors hover:text-accent-strong"
            href={routes.home}
          >
            Sliding Tiles
          </Link>
          <p>Built by Ronald M. Kasendwa</p>
          </div>
        </div>
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap items-center gap-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="transition-colors hover:text-accent-strong"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
