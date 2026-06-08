import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

import { AuthForm } from '@/components/AuthForm';
import { getSafeReturnTo } from '@/lib/authRedirect';
import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export const metadata = pageMetadata.login;

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const returnTo = getSafeReturnTo(params.returnTo);
  const session = await getSession();
  if (session) {
    redirect(returnTo);
  }

  return (
    <section className="page-rail mx-auto flex-1 grid place-items-center py-5 lg:py-8">
      <div className="relative w-full overflow-visible border-0 bg-transparent p-0 shadow-none lg:overflow-hidden lg:rounded-[26px] lg:border lg:border-line/90 lg:bg-surface-auth-warm lg:p-8 lg:shadow-panel">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden opacity-60 lg:block"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--color-foreground) 3%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-foreground) 3%, transparent) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 hidden h-64 w-64 rounded-full bg-accent/18 blur-2xl lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-8 hidden h-56 w-56 rounded-full bg-warning/30 blur-2xl lg:block"
        />

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,460px)] lg:items-stretch lg:gap-6">
          <div className="profile-reveal order-2 hidden content-between gap-4 rounded-2xl border border-line/80 bg-linear-to-br from-surface/88 via-panel/86 to-surface-auth-gold/88 p-4 sm:p-5 lg:order-1 lg:grid lg:gap-6 lg:p-6">
            <div className="grid gap-4">
              <p className="inline-flex w-fit items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
                Pond access
              </p>
              <h1 className="auth-display-heading max-w-[14ch] text-foreground">
                Jump back into your best run.
              </h1>
              <p className="max-w-[34ch] text-[1rem] leading-7 text-foreground/72">
                Sign in to keep your board synced, track faster clears, and see
                where you rank when the tiles lock in.
              </p>
            </div>

            <div className="hidden gap-3 lg:grid xl:grid-cols-3">
              <div className="rounded-xl border border-line/85 bg-surface/78 p-3">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Save state
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Always on
                </p>
              </div>
              <div className="rounded-xl border border-line/85 bg-surface/78 p-3">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Leaderboards
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Live stats
                </p>
              </div>
              <div className="rounded-xl border border-line/85 bg-surface/78 p-3">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Progress
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Personal best
                </p>
              </div>
            </div>
          </div>

          <div className="play-panel-reveal relative order-1 mx-auto w-full max-w-100 lg:order-2 lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-2 hidden rounded-[20px] bg-linear-to-b from-accent/18 to-transparent blur-lg lg:block"
            />
            <div className="relative">
              <p className="mb-3 hidden items-center gap-1.5 rounded-full border border-line/80 bg-surface/75 px-2.5 py-1 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-foreground/75 lg:inline-flex">
                <Lock className="h-3.5 w-3.5 text-accent-strong" />
                Secure sign-in
              </p>
              <AuthForm mode="login" returnTo={returnTo} />
              <p className="mt-4 text-center text-[0.9rem] leading-normal text-muted">
                No account yet?{' '}
                <Link
                  className="font-bold text-accent-strong transition-colors hover:text-accent"
                  href={`${routes.signup}?${new URLSearchParams({ returnTo })}`}
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
