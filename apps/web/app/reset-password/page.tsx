import Link from 'next/link';
import { Suspense } from 'react';
import { KeyRound } from 'lucide-react';

import { ResetPasswordForm } from '@/components/ResetPasswordForm';
import { routes } from '@/lib/routes';

export default function ResetPasswordPage() {
  return (
    <section className="page-rail mx-auto my-7 px-4 pb-14 pt-10 sm:my-9 sm:px-6 sm:pt-11">
      <div className="relative overflow-hidden rounded-[26px] border border-line/90 bg-[#f3ead8] p-4 shadow-panel sm:p-6 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(30,37,34,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(30,37,34,0.03) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto grid w-full max-w-xl gap-4 rounded-2xl border border-line bg-[#f2f3ef] p-6 shadow-panel">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-foreground/75">
            <KeyRound className="h-3.5 w-3.5 text-accent-strong" />
            Secure reset
          </p>
          <h1 className="auth-display-heading text-foreground">
            Create a new password
          </h1>
          <p className="text-[0.96rem] leading-7 text-foreground/72">
            Choose a strong password to secure your account before your next
            run.
          </p>

          <Suspense
            fallback={
              <div className="min-h-28 rounded-[9px] border border-line bg-white/55 p-3 text-[0.9rem] text-muted">
                Loading reset form...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

          <p className="text-center text-[0.9rem] text-muted">
            Need a new link?{' '}
            <Link
              className="font-bold text-accent-strong transition-colors hover:text-accent"
              href={routes.forgotPassword}
            >
              Request reset email
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
