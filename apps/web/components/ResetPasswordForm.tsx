'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { resetPassword } from '@/app/actions/auth';
import { routes } from '@/lib/routes';
import { AuthFormState } from '@/lib/validation';

import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resetPassword,
    {},
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  if (!token) {
    return (
      <div className="grid gap-3 rounded-[9px] border border-danger/30 bg-danger/6 p-3 text-danger">
        <p className="text-[0.9rem]">
          This reset link is missing a token. Request a fresh one.
        </p>
        <Link
          className="text-[0.9rem] font-bold underline"
          href={routes.forgotPassword}
        >
          Request reset link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input name="token" type="hidden" value={token} />

      <div className="grid gap-2">
        <label
          className="text-[0.78rem] font-medium tracking-[0.01em] text-foreground/76"
          htmlFor="password"
        >
          New password
        </label>
        <div className="relative">
          <input
            aria-describedby={
              state.errors?.password ? 'reset-password-error' : undefined
            }
            aria-invalid={Boolean(state.errors?.password)}
            autoComplete="new-password"
            className="min-h-11 w-full rounded-[9px] border border-line bg-surface px-3 pr-11 text-foreground placeholder:text-[0.85rem] outline-none transition-[border-color,box-shadow,background-color] focus:border-accent/60 focus:bg-surface focus:shadow-focus-primary"
            id="password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8+ chars, letters & numbers"
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 inline-flex w-8 items-center justify-center text-muted transition-colors hover:text-accent-strong"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
        <PasswordStrengthMeter password={password} />
        {state.errors?.password?.[0] && (
          <p className="text-[0.9rem] text-danger" id="reset-password-error">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label
          className="text-[0.78rem] font-medium tracking-[0.01em] text-foreground/76"
          htmlFor="confirmPassword"
        >
          Confirm new password
        </label>
        <div className="relative">
          <input
            aria-describedby={
              state.errors?.confirmPassword
                ? 'reset-confirm-password-error'
                : undefined
            }
            aria-invalid={Boolean(state.errors?.confirmPassword)}
            autoComplete="new-password"
            className="min-h-11 w-full rounded-[9px] border border-line bg-surface px-3 pr-11 text-foreground placeholder:text-[0.85rem] outline-none transition-[border-color,box-shadow,background-color] focus:border-accent/60 focus:bg-surface focus:shadow-focus-primary"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Re-enter your password"
            required
            type={showConfirmPassword ? 'text' : 'password'}
          />
          <button
            aria-label={
              showConfirmPassword
                ? 'Hide confirm password'
                : 'Show confirm password'
            }
            className="absolute inset-y-0 right-2 inline-flex w-8 items-center justify-center text-muted transition-colors hover:text-accent-strong"
            onClick={() => setShowConfirmPassword((value) => !value)}
            type="button"
          >
            {showConfirmPassword ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
        {state.errors?.confirmPassword?.[0] && (
          <p
            className="text-[0.9rem] text-danger"
            id="reset-confirm-password-error"
          >
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      {state.errors?.token?.[0] && (
        <p className="text-[0.9rem] text-danger">{state.errors.token[0]}</p>
      )}

      {state.message && (
        <p
          className={
            state.success
              ? 'text-[0.9rem] text-accent-strong'
              : 'text-[0.9rem] text-danger'
          }
        >
          {state.message}
        </p>
      )}

      {state.success && (
        <p className="text-[0.9rem] text-muted">
          Ready to continue?{' '}
          <Link
            className="font-bold text-accent-strong hover:text-accent"
            href={routes.login}
          >
            Go to login
          </Link>
          .
        </p>
      )}

      <button
        className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[9px] border border-primary bg-primary px-3.5 font-bold text-primary-contrast shadow-button-primary transition-[background-color,transform] hover:bg-primary-strong active:translate-y-px disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Updating...' : 'Reset password'}
      </button>
    </form>
  );
}
