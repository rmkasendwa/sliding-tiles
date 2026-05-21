'use client';

import { useActionState } from 'react';

import { login, signup } from '@/app/actions/auth';
import { AuthFormState } from '@/lib/validation';

type AuthFormProps = {
  mode: 'login' | 'signup';
};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === 'signup' ? signup : login;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    {}
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-line bg-panel p-6 shadow-panel"
    >
      <div>
        <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
          {mode === 'signup' ? 'Create account' : 'Welcome back'}
        </p>
        <h1 className="text-[clamp(2.4rem,7vw,5.7rem)] leading-[0.94]">
          {mode === 'signup' ? 'Sign up' : 'Log in'}
        </h1>
      </div>

      {mode === 'signup' && (
        <div className="grid gap-2">
          <label className="font-bold" htmlFor="name">
            Name
          </label>
          <input
            className="min-h-11 rounded-[7px] border border-line bg-white px-3 text-foreground"
            id="name"
            name="name"
            autoComplete="name"
          />
          {state.errors?.name && (
            <p className="text-[0.9rem] text-danger">
              {state.errors.name.join(' ')}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <label className="font-bold" htmlFor="email">
          Email
        </label>
        <input
          className="min-h-11 rounded-[7px] border border-line bg-white px-3 text-foreground"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
        />
        {state.errors?.email && (
          <p className="text-[0.9rem] text-danger">
            {state.errors.email.join(' ')}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label className="font-bold" htmlFor="password">
          Password
        </label>
        <input
          className="min-h-11 rounded-[7px] border border-line bg-white px-3 text-foreground"
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />
        {state.errors?.password && (
          <p className="text-[0.9rem] text-danger">
            {state.errors.password.join(' ')}
          </p>
        )}
      </div>

      {state.message && (
        <p className="text-[0.9rem] text-danger">{state.message}</p>
      )}

      <button
        className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[7px] border border-accent bg-accent px-3.5 font-bold text-white disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending
          ? 'Working...'
          : mode === 'signup'
            ? 'Create account'
            : 'Log in'}
      </button>
    </form>
  );
}
