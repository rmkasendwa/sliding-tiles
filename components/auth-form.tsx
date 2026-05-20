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
    <form action={formAction} className="panel auth-form">
      <div>
        <p className="eyebrow">
          {mode === 'signup' ? 'Create account' : 'Welcome back'}
        </p>
        <h1>{mode === 'signup' ? 'Sign up' : 'Log in'}</h1>
      </div>

      {mode === 'signup' && (
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" autoComplete="name" />
          {state.errors?.name && (
            <p className="form-error">{state.errors.name.join(' ')}</p>
          )}
        </div>
      )}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" />
        {state.errors?.email && (
          <p className="form-error">{state.errors.email.join(' ')}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />
        {state.errors?.password && (
          <p className="form-error">{state.errors.password.join(' ')}</p>
        )}
      </div>

      {state.message && <p className="form-error">{state.message}</p>}

      <button className="button" disabled={pending} type="submit">
        {pending
          ? 'Working...'
          : mode === 'signup'
            ? 'Create account'
            : 'Log in'}
      </button>
    </form>
  );
}
