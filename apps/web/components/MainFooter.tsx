import { ExternalLink, Trophy } from 'lucide-react';
import Link from 'next/link';

import { ApiScore, apiRequest } from '@/lib/api';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';
import { formatCopyright, siteConfig } from '@/lib/site';

import { FrogLogo } from './FrogLogo';
import { ProfileAvatar } from './ProfileAvatar';

const footerLinks = [
  { href: routes.play, label: 'Play' },
  { href: routes.leaderboard, label: 'Leaderboard' },
  { href: routes.login, label: 'Log in' },
  { href: routes.signup, label: 'Sign up' },
];

const utilityLinks = [
  { href: routes.privacy, label: 'Privacy Policy' },
  { href: routes.terms, label: 'Terms of Service' },
  { href: routes.contact, label: 'Contact' },
];

function formatScore(score: ApiScore) {
  const safeSeconds = Math.max(0, Math.floor(score.timeSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `Score: Level ${score.level} · ${score.moves} moves · ${minutes}:${String(seconds).padStart(2, '0')}`;
}

async function getChampion() {
  try {
    const response = await apiRequest<{ scores: ApiScore[] }>(
      '/leaderboard?take=1',
    );
    return response.scores[0] ?? null;
  } catch {
    return null;
  }
}

export async function MainFooter() {
  const [session, champion] = await Promise.all([getSession(), getChampion()]);
  const visibleFooterLinks = session
    ? footerLinks.filter(
        (link) => link.href !== routes.login && link.href !== routes.signup,
      )
    : footerLinks;
  const championName = champion?.user?.name ?? 'Unclaimed champion';

  return (
    <footer className="mt-8 border-t border-line bg-[linear-gradient(180deg,rgba(255,250,241,0.72),rgba(246,241,232,0.96))]">
      <section className="page-rail mx-auto -mt-8 pb-6">
        <div className="rounded-xl border border-[#d5a344]/32 bg-[radial-gradient(circle_at_10%_20%,rgba(246,207,130,0.35),transparent_30%),linear-gradient(135deg,#fff9e8,#f6fbef)] p-4 shadow-panel">
          <div className="grid items-center gap-4 min-[760px]:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="grid size-12 place-items-center rounded-lg border border-[#d5a344]/38 bg-white/72 text-[#8a621c] shadow-sm">
              <Trophy aria-hidden="true" className="size-6" strokeWidth={2.1} />
            </div>
            <div className="grid gap-2 min-[560px]:grid-cols-[minmax(0,1fr)_auto] min-[560px]:items-center min-[760px]:grid-cols-[minmax(0,1fr)]">
              <div>
                <p className="text-[0.76rem] font-extrabold uppercase tracking-[0.08em] text-[#8a621c]">
                  Current Champion
                </p>
                <div className="mt-2 flex min-w-0 items-center gap-3">
                  <ProfileAvatar
                    avatarUrl={champion?.user?.avatarUrl}
                    name={championName}
                    size={42}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold leading-tight text-foreground">
                      {championName}
                    </p>
                    <p className="text-sm leading-snug text-muted">
                      {champion
                        ? formatScore(champion)
                        : 'Post the first ranked run to claim the pond.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent bg-accent px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(37,111,90,0.2)] transition-colors hover:bg-accent-strong"
              href={routes.leaderboard}
            >
              View Leaderboard <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="page-rail mx-auto grid gap-8 py-8 text-sm text-muted min-[860px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid max-w-xl gap-3">
          <div className="flex items-center gap-3">
            <FrogLogo className="w-10 shrink-0" variant="monochrome" />
            <div>
              <Link
                className="font-bold text-foreground transition-colors hover:text-accent-strong"
                href={routes.home}
              >
                {siteConfig.name}
              </Link>
              <p className="font-extrabold text-accent-strong">
                {siteConfig.tagline}
              </p>
            </div>
          </div>
          <p className="max-w-[58ch] leading-6">{siteConfig.description}</p>
          <p className="text-xs">
            Built by Ronald Kasendwa <span aria-hidden="true">·</span>{' '}
            <a
              aria-label={`Open ${siteConfig.name} GitHub repository in a new tab`}
              className="inline-flex items-center gap-1 transition-colors hover:text-accent-strong"
              href={siteConfig.githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              GitHub
              <ExternalLink aria-hidden="true" className="size-3" />
            </a>
          </p>
          <p className="text-xs">{formatCopyright()}</p>
        </div>

        <nav aria-label="Site navigation">
          <p className="text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-foreground">
            Play
          </p>
          <ul className="mt-3 grid gap-2">
            {visibleFooterLinks.map((link) => (
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

        <nav aria-label="Utility navigation">
          <p className="text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-foreground">
            Community
          </p>
          <ul className="mt-3 grid gap-2">
            {utilityLinks.map((link) => (
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
