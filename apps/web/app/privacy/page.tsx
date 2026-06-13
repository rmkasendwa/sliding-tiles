import Link from 'next/link';

import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { siteConfig } from '@/lib/site';

export const metadata = pageMetadata.privacy;

const sections = [
  {
    heading: 'Information collected',
    body: `${siteConfig.name} collects the information needed to run the game, keep accounts working, and show competitive progress. This may include account details, gameplay records, device/browser basics, and technical logs.`,
  },
  {
    heading: 'Account information',
    body: 'When you create an account, we store information such as your name, username, and email address. We do not store your actual password. Passwords are processed using a secure one-way hashing algorithm before being stored. Because hashing cannot be reversed, neither administrators nor developers can view or recover your password, so we do not know it.',
  },
  {
    heading: 'Gameplay statistics and leaderboard data',
    body: 'We store puzzle progress, completed runs, levels, moves, completion times, and leaderboard rankings. Leaderboard responses are designed to show public player identity and scores, not email addresses.',
  },
  {
    heading: 'Cookies and local storage',
    body: 'The app uses cookies for signed-in sessions and local storage for browser-only game progress, preferences, consent, and a random anonymous player ID. Anonymous analytics storage and sending begin only after you accept the storage notice.',
  },
  {
    heading: 'Analytics usage',
    body: 'For anonymous players who accept storage, we collect lightweight gameplay events such as level starts, moves, completions, resets, pauses, and signup prompt interactions. Events may include a random player ID, a per-play session ID, level and puzzle details, timer and move counts, timestamp, screen size, and browser user agent. We do not intentionally include names, email addresses, account IDs, or other contact details in these events.',
  },
  {
    heading: 'Data retention',
    body: 'We keep account and gameplay data while your account is active or while it is useful for game integrity, leaderboard history, debugging, and service operation.',
  },
  {
    heading: 'User rights',
    body: 'You can ask about your account data, request corrections, or request deletion where possible. Some leaderboard or integrity records may need to remain in limited form to keep the game fair.',
  },
];

export default function PrivacyPage() {
  return (
    <section className="page-rail mx-auto grid max-w-300 gap-6 pt-6 pb-12">
      <div className="rounded-xl border border-accent/20 bg-[radial-gradient(circle_at_86%_12%,color-mix(in_srgb,var(--color-accent)_24%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_srgb,var(--color-surface)_62%,transparent),color-mix(in_srgb,var(--color-panel)_92%,transparent))] p-5 shadow-panel">
        <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
          Privacy Policy
        </p>
        <h1 className="mt-2 text-[clamp(2.3rem,6vw,4.6rem)] leading-[0.94]">
          Your game data, clearly handled.
        </h1>
        <p className="mt-4 max-w-[68ch] text-muted">
          {siteConfig.name} is an indie multiplayer puzzle game. This policy
          keeps the privacy side readable and focused on what the game actually
          needs.
        </p>
      </div>

      <div className="grid gap-3">
        {sections.map((section) => (
          <article
            className="rounded-lg border border-line bg-panel p-4 shadow-sm"
            key={section.heading}
          >
            <h2 className="text-lg font-bold text-foreground">
              {section.heading}
            </h2>
            <p className="mt-2 leading-6 text-muted">{section.body}</p>
          </article>
        ))}
        <article className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">
            Contact information
          </h2>
          <p className="mt-2 leading-6 text-muted">
            Questions about privacy can be sent to{' '}
            <a
              className="font-bold text-accent-strong hover:text-accent"
              href={`mailto:${siteConfig.contactEmail}`}
            >
              {siteConfig.contactEmail}
            </a>
            . You can also visit the{' '}
            <Link
              className="font-bold text-accent-strong hover:text-accent"
              href={routes.contact}
            >
              contact page
            </Link>
            .
          </p>
        </article>
      </div>
    </section>
  );
}
