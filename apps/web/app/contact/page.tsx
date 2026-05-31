import type { Metadata } from 'next';
import { ExternalLink, GitFork, Mail } from 'lucide-react';

import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: `Contact | ${siteConfig.name}`,
  description: `Contact ${siteConfig.name} for support, bugs, and ideas.`,
};

export default function ContactPage() {
  return (
    <section className="page-rail mx-auto grid max-w-300 gap-6 pt-6 pb-12">
      <div className="rounded-xl border border-accent/20 bg-[radial-gradient(circle_at_88%_12%,rgba(128,196,78,0.24),transparent_34%),radial-gradient(circle_at_12%_100%,rgba(246,207,130,0.3),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,250,241,0.92))] p-5 shadow-panel">
        <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
          Contact
        </p>
        <h1 className="mt-2 text-[clamp(2.3rem,6vw,4.6rem)] leading-[0.94]">
          Help shape the next run.
        </h1>
        <p className="mt-4 max-w-[68ch] text-muted">
          Reach out for account help, bug reports, leaderboard concerns,
          accessibility issues, or feature ideas that would make {siteConfig.name}
          more fun to play.
        </p>
      </div>

      <div className="grid gap-4 min-[820px]:grid-cols-2">
        <article className="rounded-lg border border-line bg-panel p-5 shadow-panel">
          <div className="grid size-10 place-items-center rounded-[7px] border border-accent/20 bg-accent/10 text-accent-strong">
            <Mail aria-hidden="true" className="size-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            Email the project
          </h2>
          <p className="mt-2 leading-6 text-muted">
            Use email for account questions, privacy requests, or anything that
            should not live in a public issue.
          </p>
          <a
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-[7px] border border-accent bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
            href={`mailto:${siteConfig.contactEmail}`}
          >
            {siteConfig.contactEmail}
          </a>
        </article>

        <article className="rounded-lg border border-line bg-panel p-5 shadow-panel">
          <div className="grid size-10 place-items-center rounded-[7px] border border-[#5f87a8]/24 bg-[#eef6ff]/78 text-[#486b89]">
            <GitFork aria-hidden="true" className="size-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">
            Bug reports and feature requests
          </h2>
          <p className="mt-2 leading-6 text-muted">
            GitHub is the best place for gameplay bugs, UI polish ideas, setup
            issues, and feature discussions that other players or contributors
            can follow.
          </p>
          <a
            aria-label={`Open ${siteConfig.name} GitHub repository in a new tab`}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border border-[#5f87a8]/30 bg-[#eef6ff]/78 px-4 text-sm font-bold text-[#486b89] transition-colors hover:bg-[#dfefff]"
            href={siteConfig.githubUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open GitHub
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </article>
      </div>
    </section>
  );
}
