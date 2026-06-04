import { pageMetadata } from '@/lib/metadata';
import { siteConfig } from '@/lib/site';

export const metadata = pageMetadata.terms;

const sections = [
  {
    heading: 'Use of the service',
    body: `${siteConfig.name} is provided for people who want to play, improve, and compete in sliding tile puzzles. Use the service in a way that respects other players and keeps the game enjoyable.`,
  },
  {
    heading: 'User accounts',
    body: 'You are responsible for your account activity and for keeping your sign-in details private. Choose a username and profile details that are appropriate for a shared game space.',
  },
  {
    heading: 'Leaderboards and rankings',
    body: 'Leaderboards are part of the competitive experience. Scores may be recalculated, hidden, or removed if they appear broken, duplicated, abusive, or unfair.',
  },
  {
    heading: 'Fair play',
    body: 'Do not cheat, automate gameplay, exploit bugs, tamper with requests, or interfere with other players. Report issues if you find something that could affect competitive fairness.',
  },
  {
    heading: 'Availability of the service',
    body: `${siteConfig.name} may change, pause, or go offline while the game is being improved, maintained, or repaired. We will try to keep interruptions reasonable for an indie project.`,
  },
  {
    heading: 'Intellectual property',
    body: `Project-owned ${siteConfig.name} application code is available under ${siteConfig.license.name}. Third-party assets and dependencies keep their own license terms. The ${siteConfig.name} name, branding, and official service identity may not be used in a way that suggests you own or operate the official project.`,
  },
  {
    heading: 'Limitation of liability',
    body: `${siteConfig.name} is provided as-is. We are not responsible for indirect losses, lost progress, or service interruptions beyond what applicable law requires.`,
  },
  {
    heading: 'Changes to the service',
    body: `The game and these terms may evolve as ${siteConfig.name} grows. Continued use after updates means you accept the current version of the service.`,
  },
];

export default function TermsPage() {
  return (
    <section className="page-rail mx-auto grid max-w-300 gap-6 pt-6 pb-12">
      <div className="rounded-xl border border-accent/20 bg-[radial-gradient(circle_at_82%_14%,rgba(246,207,130,0.28),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,250,241,0.92))] p-5 shadow-panel">
        <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
          Terms of Service
        </p>
        <h1 className="mt-2 text-[clamp(2.3rem,6vw,4.6rem)] leading-[0.94]">
          Play fair. Keep the pond fun.
        </h1>
        <p className="mt-4 max-w-[68ch] text-muted">
          These terms are intentionally human-readable. They explain the basic
          expectations for playing {siteConfig.name} and joining the
          leaderboard.
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
          <h2 className="text-lg font-bold text-foreground">Questions</h2>
          <p className="mt-2 leading-6 text-muted">
            For questions about these terms, contact{' '}
            <a
              className="font-bold text-accent-strong hover:text-accent"
              href={`mailto:${siteConfig.contactEmail}`}
            >
              {siteConfig.contactEmail}
            </a>
            .
          </p>
        </article>
      </div>
    </section>
  );
}
