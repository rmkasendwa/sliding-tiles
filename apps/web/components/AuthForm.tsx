'use client';

import {
  useActionState,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { login, signup } from '@/app/actions/auth';
import { AuthFormState } from '@/lib/validation';

type AuthFormProps = {
  mode: 'login' | 'signup';
};

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === 'signup';
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const fieldLabelClass = isSignup
    ? 'font-bold'
    : 'text-[0.76rem] font-extrabold uppercase tracking-[0.07em] text-foreground/72';

  const validateField = (fieldName: string, rawValue: string) => {
    const value = rawValue.trim();

    if (fieldName === 'name') {
      if (!isSignup) {
        return undefined;
      }

      if (value.length < 2) {
        return 'Name must be at least 2 characters.';
      }

      return undefined;
    }

    if (fieldName === 'email') {
      if (!value) {
        return 'Enter a valid email address.';
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return 'Enter a valid email address.';
      }

      return undefined;
    }

    if (fieldName === 'password') {
      if (!value) {
        return 'Enter your password.';
      }

      if (isSignup) {
        if (value.length < 8) {
          return 'Password must be at least 8 characters.';
        }

        if (!/[a-zA-Z]/.test(value)) {
          return 'Password needs at least one letter.';
        }

        if (!/[0-9]/.test(value)) {
          return 'Password needs at least one number.';
        }
      }

      return undefined;
    }

    return undefined;
  };

  const getFieldError = (fieldName: string) => {
    return clientErrors[fieldName] ?? state.errors?.[fieldName]?.[0];
  };

  const getInputClass = (fieldName: string) => {
    const hasError = Boolean(getFieldError(fieldName));
    return [
      'min-h-11 rounded-[9px] border bg-white px-3 text-foreground outline-none transition-[border-color,box-shadow,background-color]',
      hasError
        ? 'border-danger/65 focus:border-danger/75 focus:shadow-[0_0_0_3px_rgba(154,46,46,0.16)]'
        : 'border-line focus:border-accent/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,111,90,0.14)]',
    ].join(' ');
  };

  const updateClientValidation = (fieldName: string, value: string) => {
    const error = validateField(fieldName, value);
    setClientErrors((previous) => {
      if (!error) {
        if (!(fieldName in previous)) {
          return previous;
        }

        const remaining = { ...previous };
        delete remaining[fieldName];
        return remaining;
      }

      return { ...previous, [fieldName]: error };
    });
  };

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateClientValidation(event.target.name, event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const fieldsToValidate = isSignup
      ? ['name', 'email', 'password']
      : ['email', 'password'];
    const nextErrors: Record<string, string> = {};

    for (const fieldName of fieldsToValidate) {
      const value = String(formData.get(fieldName) ?? '');
      const error = validateField(fieldName, value);
      if (error) {
        nextErrors[fieldName] = error;
      }
    }

    setClientErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  };

  const action = mode === 'signup' ? signup : login;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className={[
        'grid gap-4 border shadow-panel',
        isSignup
          ? 'rounded-lg border-line bg-panel p-6'
          : 'rounded-2xl border-line bg-white/95 p-5 shadow-[0_24px_64px_rgba(35,35,28,0.2)] backdrop-blur-[2px] sm:p-6',
      ].join(' ')}
    >
      <div className="grid gap-1.5">
        <p className="text-[0.73rem] font-extrabold uppercase tracking-[0.08em] text-accent-strong">
          {isSignup ? 'Create account' : 'Welcome back'}
        </p>
        <h1
          className={[
            'leading-[0.94] tracking-[-0.02em]',
            isSignup
              ? 'text-[clamp(2.4rem,7vw,5.7rem)]'
              : 'text-[clamp(1.7rem,3.8vw,2.3rem)]',
          ].join(' ')}
        >
          {isSignup ? 'Sign up' : 'Log in'}
        </h1>
        {!isSignup && (
          <p className="text-[0.95rem] leading-6 text-foreground/68">
            Pick up your progress and chase a cleaner solve.
          </p>
        )}
      </div>

      {isSignup && (
        <div className="grid gap-2">
          <label className={fieldLabelClass} htmlFor="name">
            Name
          </label>
          <input
            aria-describedby={getFieldError('name') ? 'name-error' : undefined}
            aria-invalid={Boolean(getFieldError('name'))}
            className={getInputClass('name')}
            id="name"
            name="name"
            autoComplete="name"
            minLength={2}
            onChange={handleFieldChange}
            placeholder="Ada Lovelace"
            required
          />
          {getFieldError('name') && (
            <p className="text-[0.9rem] text-danger" id="name-error">
              {getFieldError('name')}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <label className={fieldLabelClass} htmlFor="email">
          Email
        </label>
        <input
          aria-describedby={getFieldError('email') ? 'email-error' : undefined}
          aria-invalid={Boolean(getFieldError('email'))}
          className={getInputClass('email')}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          onChange={handleFieldChange}
          placeholder="you@example.com"
          required
        />
        {getFieldError('email') && (
          <p className="text-[0.9rem] text-danger" id="email-error">
            {getFieldError('email')}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label className={fieldLabelClass} htmlFor="password">
          Password
        </label>
        <input
          aria-describedby={
            getFieldError('password') ? 'password-error' : undefined
          }
          aria-invalid={Boolean(getFieldError('password'))}
          className={getInputClass('password')}
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          minLength={isSignup ? 8 : 1}
          onChange={handleFieldChange}
          placeholder={
            isSignup ? 'At least 8 chars, letters + numbers' : 'Your password'
          }
          required
        />
        {getFieldError('password') && (
          <p className="text-[0.9rem] text-danger" id="password-error">
            {getFieldError('password')}
          </p>
        )}
      </div>

      {state.message && (
        <p className="text-[0.9rem] text-danger">{state.message}</p>
      )}

      <button
        className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[9px] border border-accent bg-accent px-3.5 font-bold text-white shadow-[0_10px_20px_rgba(37,111,90,0.24)] transition-[background-color,transform] hover:bg-accent-strong active:translate-y-px disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Working...' : isSignup ? 'Create account' : 'Enter pond'}
      </button>
    </form>
  );
}
