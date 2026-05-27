'use client';

import { useActionState } from 'react';

import { requestPasswordReset } from '@/app/actions/auth';
import { AuthFormState } from '@/lib/validation';

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <label
          className="text-[0.78rem] font-medium tracking-[0.01em] text-foreground/76"
          htmlFor="identifier"
        >
          Email or username
        </label>
        <input
          aria-describedby={
            state.errors?.identifier ? 'forgot-identifier-error' : undefined
          }
          aria-invalid={Boolean(state.errors?.identifier)}
          autoCapitalize="none"
          autoComplete="username"
          className="min-h-11 w-full rounded-[9px] border border-line bg-white px-3 text-foreground placeholder:text-[0.85rem] outline-none transition-[border-color,box-shadow,background-color] focus:border-accent/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,111,90,0.14)]"
          id="identifier"
          name="identifier"
          placeholder="name@example.com or handle"
          required
          type="text"
        />
        {state.errors?.identifier?.[0] && (
          <p className="text-[0.9rem] text-danger" id="forgot-identifier-error">
            {state.errors.identifier[0]}
          </p>
        )}
      </div>

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

      <button
        className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[9px] border border-accent bg-accent px-3.5 font-bold text-white shadow-[0_10px_20px_rgba(37,111,90,0.24)] transition-[background-color,transform] hover:bg-accent-strong active:translate-y-px disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Sending...' : 'Email reset link'}
      </button>
    </form>
  );
}
