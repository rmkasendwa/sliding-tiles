import { CircleAlert, CircleCheck, MailCheck } from 'lucide-react';
import Link from 'next/link';

import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';

export const metadata = pageMetadata.emailVerification;

type EmailVerificationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const states = {
  error: {
    description:
      'We could not verify your email address right now. Please try the link again in a moment.',
    icon: CircleAlert,
    title: 'Verification is temporarily unavailable',
  },
  invalid: {
    description:
      'This verification link is invalid, expired, or has already been used. You can request a fresh link from the reminder banner after logging in.',
    icon: CircleAlert,
    title: 'This verification link cannot be used',
  },
  success: {
    description:
      'Your email address is verified. Your account is ready, and you can keep playing normally.',
    icon: CircleCheck,
    title: 'Email address verified',
  },
} as const;

export default async function EmailVerificationPage({
  searchParams,
}: EmailVerificationPageProps) {
  const params = (await searchParams) ?? {};
  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const status =
    rawStatus === 'success' || rawStatus === 'error' ? rawStatus : 'invalid';
  const state = states[status];
  const StatusIcon = state.icon;

  return (
    <section className="page-rail mx-auto grid flex-1 place-items-center py-8">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 text-center shadow-panel sm:p-8">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent-strong">
          {status === 'success' ? (
            <MailCheck aria-hidden="true" className="h-7 w-7" />
          ) : (
            <StatusIcon aria-hidden="true" className="h-7 w-7" />
          )}
        </div>
        <h1 className="auth-display-heading text-foreground">{state.title}</h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-foreground/72">
          {state.description}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-[9px] border border-primary bg-primary px-4 font-bold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong"
            href={routes.play}
          >
            Play Sliding Tiles
          </Link>
          {status !== 'success' ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[9px] border border-line bg-panel px-4 font-bold text-foreground transition-colors hover:bg-accent/8"
              href={routes.login}
            >
              Log in
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
