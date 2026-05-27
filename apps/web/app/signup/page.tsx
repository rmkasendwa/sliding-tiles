import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/AuthForm';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect(routes.play);
  }

  return (
    <section className="page-rail mx-auto my-7 px-4 pb-14 pt-10 sm:my-9 sm:px-6 sm:pt-11">
      <div className="relative overflow-hidden rounded-[26px] border border-line/90 bg-[#efe3cd] p-4 shadow-panel sm:p-6 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 14%, rgba(37,111,90,0.09), transparent 34%), radial-gradient(circle at 86% 84%, rgba(246,207,130,0.35), transparent 32%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/17 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-[#f4d692]/35 blur-2xl"
        />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,500px)] lg:items-stretch">
          <div className="profile-reveal grid content-between gap-6 rounded-2xl border border-line/80 bg-linear-to-br from-white/88 via-panel/85 to-[#eadfc6]/86 p-5 sm:p-6">
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

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line/85 bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Instant setup
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Under 1 min
                </p>
              </div>
              <div className="rounded-xl border border-line/85 bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Cloud sync
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Any device
                </p>
              </div>
              <div className="rounded-xl border border-line/85 bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  Stats trail
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Every run
                </p>
              </div>
            </div>
          </div>

          <div className="play-panel-reveal relative">
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-[20px] bg-linear-to-b from-[#b37a37]/22 to-transparent blur-lg"
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
