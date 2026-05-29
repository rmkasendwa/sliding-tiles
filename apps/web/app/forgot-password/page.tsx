import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { routes } from '@/lib/routes';

export default function ForgotPasswordPage() {
  return (
    <section className="page-rail mx-auto flex-1 grid place-items-center py-5 lg:py-8">
      <div className="relative w-full overflow-visible border-0 bg-transparent p-0 shadow-none lg:overflow-hidden lg:rounded-[26px] lg:border lg:border-line/90 lg:bg-[#e8eef2] lg:p-8 lg:shadow-panel">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden opacity-55 lg:block"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 14%, rgba(23,79,67,0.09), transparent 34%), radial-gradient(circle at 86% 84%, rgba(113,157,186,0.28), transparent 38%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 hidden h-64 w-64 rounded-full bg-[#5f87a8]/28 blur-2xl lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-8 hidden h-56 w-56 rounded-full bg-accent/15 blur-2xl lg:block"
        />

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,460px)] lg:items-stretch lg:gap-6">
          <div className="profile-reveal order-2 hidden content-between gap-4 rounded-2xl border border-line/80 bg-linear-to-br from-white/88 via-panel/86 to-[#dce8ef]/92 p-4 sm:p-5 lg:order-1 lg:grid lg:gap-6 lg:p-6">
            <div className="grid gap-4">
              <h1 className="auth-display-heading max-w-[14ch] text-foreground">
                Reset access in a single step.
              </h1>
              <p className="max-w-[34ch] text-[1rem] leading-7 text-foreground/72">
                Enter your email or username and we&apos;ll send a secure link
                to create a fresh password before your next run.
              </p>
            </div>

            <div className="hidden gap-3 lg:grid xl:grid-cols-3">
              <div className="rounded-xl border border-line/85 bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="inline-flex items-center gap-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent-strong" />
                  Secure link
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Time-limited and hashed
                </p>
              </div>
              <div className="rounded-xl border border-line/85 bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="inline-flex items-center gap-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  <Mail className="h-3.5 w-3.5 text-accent-strong" />
                  Fast reply
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Check inbox and spam
                </p>
              </div>
              <div className="rounded-xl border border-line/85 bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="inline-flex items-center gap-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                  <ArrowRight className="h-3.5 w-3.5 text-accent-strong" />
                  Return to login
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Log back in after reset
                </p>
              </div>
            </div>
          </div>

          <div className="play-panel-reveal relative order-1 mx-auto w-full max-w-125 lg:order-2 lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-2 hidden rounded-[20px] bg-linear-to-b from-[#486b89]/24 to-transparent blur-lg lg:block"
            />
            <div className="relative grid gap-4 rounded-2xl border border-line bg-[#eef5fb] p-4 shadow-panel sm:p-6">
              <p className="hidden w-fit items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-foreground/75 lg:inline-flex">
                <Mail className="h-3.5 w-3.5 text-accent-strong" />
                Reset request
              </p>
              <div className="grid gap-2">
                <h2 className="auth-display-heading text-foreground">
                  Forgot password
                </h2>
                <p className="text-[0.96rem] leading-7 text-foreground/72">
                  We&apos;ll send a one-time reset link if the account exists.
                </p>
              </div>

              <ForgotPasswordForm />

              <p className="text-center text-[0.9rem] text-muted">
                Remembered it?{' '}
                <Link
                  className="font-bold text-accent-strong transition-colors hover:text-accent"
                  href={routes.login}
                >
                  Back to login
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
