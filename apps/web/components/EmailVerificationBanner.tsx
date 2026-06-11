'use client';

import { MailWarning, Send } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useActionState } from 'react';

import { requestEmailVerification } from '@/app/actions/auth';
import type { SessionUser } from '@/lib/session';
import type { AuthFormState } from '@/lib/validation';

export function EmailVerificationBanner({
  session,
}: {
  session: SessionUser | null;
}) {
  const pathname = usePathname();
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    requestEmailVerification,
    {},
  );
  const isPlayPage = pathname === '/play';

  if (!session || session.emailVerified) {
    return null;
  }

  return (
    <aside
      aria-label="Email verification reminder"
      className={
        isPlayPage
          ? 'pointer-events-none fixed inset-x-0 top-18 z-40 px-3 pt-3'
          : 'w-full border-b border-info/30 bg-info/12'
      }
    >
      <div
        className={
          isPlayPage
            ? 'pointer-events-auto mx-auto flex w-fit max-w-full flex-col gap-2 rounded-xl border border-info/35 bg-background/92 px-3 py-2 text-sm text-foreground shadow-panel backdrop-blur sm:flex-row sm:flex-wrap sm:items-center'
            : 'page-rail mx-auto flex flex-col gap-2 py-2.5 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between'
        }
      >
        <div className="flex items-start gap-2.5 sm:flex-1">
          <MailWarning
            aria-hidden="true"
            className="mt-0.5 h-4.5 w-4.5 shrink-0 text-info-strong"
          />
          <p className={isPlayPage ? 'leading-5' : 'leading-6'}>
            {isPlayPage ? (
              <>
                Verify your email address to keep your account secure.
                <span className="hidden sm:inline"> Check your inbox or </span>
              </>
            ) : (
              <>
                Please verify your email address to keep your Sliding Tiles
                account secure. Check your inbox or resend the verification
                email.
              </>
            )}
          </p>
        </div>

        <form
          action={formAction}
          className={isPlayPage ? 'shrink-0 self-end sm:self-auto' : 'shrink-0'}
        >
          <button
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-info/45 bg-surface/80 font-bold text-foreground transition-colors hover:bg-surface disabled:cursor-wait disabled:opacity-65 ${
              isPlayPage ? 'min-h-8 px-2.5 text-xs' : 'min-h-9 px-3'
            }`}
            disabled={pending}
            type="submit"
          >
            <Send aria-hidden="true" className="h-3.5 w-3.5" />
            {pending
              ? 'Sending...'
              : isPlayPage
                ? 'Resend email'
                : 'Resend verification email'}
          </button>
        </form>

        {isPlayPage && state.message ? (
          <p
            aria-live="polite"
            className={`w-full basis-full border-t border-info/20 pt-2 text-[0.78rem] ${
              state.success ? 'text-accent-strong' : 'text-danger'
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>

      {!isPlayPage && state.message ? (
        <p
          aria-live="polite"
          className={`page-rail mx-auto pb-2 text-[0.8rem] ${
            state.success ? 'text-accent-strong' : 'text-danger'
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </aside>
  );
}
