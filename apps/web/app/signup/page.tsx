import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/AuthForm';
import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export const metadata = pageMetadata.signup;

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect(routes.play);
  }

  return (
    <section className="page-rail mx-auto flex-1 grid place-items-center py-5 lg:py-8">
      <div className="relative w-full overflow-visible border-0 bg-transparent p-0 shadow-none lg:overflow-hidden lg:rounded-[26px] lg:border lg:border-line/90 lg:bg-surface-auth-gold lg:p-8 lg:shadow-panel">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden opacity-55 lg:block"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 14%, color-mix(in srgb, var(--color-primary-strong) 9%, transparent), transparent 34%), radial-gradient(circle at 86% 84%, color-mix(in srgb, var(--color-warning) 35%, transparent), transparent 32%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 hidden h-64 w-64 rounded-full bg-accent/17 blur-2xl lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 right-0 hidden h-64 w-64 rounded-full bg-warning/35 blur-2xl lg:block"
        />

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,500px)] lg:items-stretch lg:gap-6">
          <div className="profile-reveal order-2 hidden content-between gap-4 rounded-2xl border border-line/80 bg-linear-to-br from-surface/88 via-panel/85 to-surface-auth-gold/86 p-4 sm:p-5 lg:order-1 lg:grid lg:gap-6 lg:p-6">
            <div className="grid gap-4">
              <p className="inline-flex w-fit items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
                New challenger
              </p>
              <h1 className="auth-display-heading max-w-[16ch] text-foreground">
                Start your first streak in the pond.
              </h1>
              <p className="max-w-[34ch] text-[1rem] leading-7 text-foreground/72">
                Create your account to save progress automatically, climb the
                leaderboard, and build your own solve history.
              </p>
            </div>

            <div className="hidden gap-3 lg:grid xl:grid-cols-3">
              <div className="rounded-xl border border-line/85 bg-surface/78 p-3 shadow-inset-highlight">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Instant setup
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Under 1 min
                </p>
              </div>
              <div className="rounded-xl border border-line/85 bg-surface/78 p-3 shadow-inset-highlight">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Cloud sync
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Any device
                </p>
              </div>
              <div className="rounded-xl border border-line/85 bg-surface/78 p-3 shadow-inset-highlight">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Stats trail
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Every run
                </p>
              </div>
            </div>
          </div>

          <div className="play-panel-reveal relative order-1 mx-auto w-full max-w-125 lg:order-2 lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-2 hidden rounded-[20px] bg-linear-to-b from-warning/22 to-transparent blur-lg lg:block"
            />
            <div className="relative">
              <AuthForm mode="signup" />
              <p className="mt-4 text-center leading-normal text-muted">
                Already have an account?{' '}
                <Link
                  className="font-bold text-accent-strong transition-colors hover:text-accent"
                  href={routes.login}
                >
                  Log in
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
