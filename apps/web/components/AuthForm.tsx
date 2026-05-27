'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { login, signup } from '@/app/actions/auth';
import { AuthFormState } from '@/lib/validation';

type AuthFormProps = {
  mode: 'login' | 'signup';
};

type FormValues = {
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
  username: string;
};

type UsernameAvailabilityStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'error';

type UsernameAvailabilityState = {
  checkedUsername: string;
  status: UsernameAvailabilityStatus;
  suggestions: string[];
};

type UsernameAvailabilityResponse = {
  available: boolean;
  suggestions: string[];
};

function getPasswordStrength(password: string) {
  if (!password) {
    return 0;
  }

  let score = 0;
  if (password.length >= 8) {
    score += 1;
  }
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  }
  if (/[0-9]/.test(password)) {
    score += 1;
  }
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  }

  return score;
}

function getPasswordStrengthLabel(strength: number) {
  if (strength <= 1) {
    return 'Weak';
  }

  if (strength <= 2) {
    return 'Fair';
  }

  if (strength <= 3) {
    return 'Good';
  }

  return 'Strong';
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === 'signup';
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [editedFields, setEditedFields] = useState<Record<string, boolean>>({});
  const [dismissServerMessage, setDismissServerMessage] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({
    confirmPassword: false,
    password: false,
  });
  const usernameRequestIdRef = useRef(0);
  const [formValues, setFormValues] = useState<FormValues>({
    confirmPassword: '',
    email: '',
    name: '',
    password: '',
    username: '',
  });
  const [usernameAvailability, setUsernameAvailability] =
    useState<UsernameAvailabilityState>({
      checkedUsername: '',
      status: 'idle',
      suggestions: [],
    });
  const passwordStrength = getPasswordStrength(formValues.password);
  const passwordStrengthLabel = getPasswordStrengthLabel(passwordStrength);
  const passwordStrengthClass =
    passwordStrength <= 1
      ? 'text-danger'
      : passwordStrength <= 2
        ? 'text-[#9a5d21]'
        : passwordStrength <= 3
          ? 'text-accent-strong'
          : 'text-accent';
  const fieldLabelClass = isSignup
    ? 'text-[0.78rem] font-medium tracking-[0.01em] text-foreground/76'
    : 'text-[0.68rem] font-bold uppercase tracking-[0.08em] text-foreground/64';

  const validateField = (
    fieldName: keyof FormValues,
    rawValue: string,
    values: FormValues,
  ) => {
    const value = rawValue.trim();

    if (fieldName === 'name') {
      if (!isSignup) {
        return undefined;
      }

      if (!value) {
        return 'Name is required.';
      }

      if (value.length < 2) {
        return 'Name must be at least 2 characters.';
      }

      return undefined;
    }

    if (fieldName === 'email') {
      if (!value) {
        return 'Email is required.';
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return 'Enter a valid email address.';
      }

      return undefined;
    }

    if (fieldName === 'username') {
      if (!isSignup) {
        return undefined;
      }

      if (!value) {
        return 'Username is required.';
      }

      if (value.length < 3) {
        return 'Username must be at least 3 characters.';
      }

      if (value.length > 20) {
        return 'Username must be at most 20 characters.';
      }

      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username can only contain letters, numbers, and underscores.';
      }

      return undefined;
    }

    if (fieldName === 'password') {
      if (!value) {
        return 'Password is required.';
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

    if (fieldName === 'confirmPassword') {
      if (!isSignup) {
        return undefined;
      }

      if (!value) {
        return 'Confirm your password.';
      }

      if (value !== values.password) {
        return 'Passwords do not match.';
      }

      return undefined;
    }

    return undefined;
  };

  const getFieldError = (fieldName: string) => {
    if (clientErrors[fieldName]) {
      return clientErrors[fieldName];
    }

    if (editedFields[fieldName]) {
      return undefined;
    }

    return state.errors?.[fieldName]?.[0];
  };

  const getInputClass = (fieldName: string) => {
    const hasError = Boolean(getFieldError(fieldName));
    return [
      'min-h-11 w-full rounded-[9px] border bg-white px-3 text-foreground outline-none transition-[border-color,box-shadow,background-color]',
      hasError
        ? 'border-danger/65 focus:border-danger/75 focus:shadow-[0_0_0_3px_rgba(154,46,46,0.16)]'
        : 'border-line focus:border-accent/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,111,90,0.14)]',
    ].join(' ');
  };

  const togglePasswordVisibility = (
    fieldName: 'password' | 'confirmPassword',
  ) => {
    setVisiblePasswords((previous) => ({
      ...previous,
      [fieldName]: !previous[fieldName],
    }));
  };

  const updateClientValidation = (
    fieldName: keyof FormValues,
    value: string,
    values: FormValues,
  ) => {
    const error = validateField(fieldName, value, values);
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
    const fieldName = event.target.name as keyof FormValues;
    const { value } = event.target;
    const nextValues = {
      ...formValues,
      [fieldName]: value,
    };

    setFormValues(nextValues);
    setEditedFields((previous) => ({ ...previous, [fieldName]: true }));
    setDismissServerMessage(true);
    updateClientValidation(fieldName, value, nextValues);

    if (isSignup && fieldName === 'username') {
      const candidate = value.trim();
      const isUsernameFormatValid =
        candidate.length >= 3 &&
        candidate.length <= 20 &&
        /^[a-zA-Z0-9_]+$/.test(candidate);

      setUsernameAvailability({
        checkedUsername: isUsernameFormatValid ? candidate.toLowerCase() : '',
        status: isUsernameFormatValid ? 'checking' : 'idle',
        suggestions: [],
      });
    }

    if (isSignup && fieldName === 'password' && nextValues.confirmPassword) {
      updateClientValidation(
        'confirmPassword',
        nextValues.confirmPassword,
        nextValues,
      );
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setEditedFields({});
    setDismissServerMessage(false);

    const formData = new FormData(event.currentTarget);
    const submitValues: FormValues = {
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
      email: String(formData.get('email') ?? ''),
      name: String(formData.get('name') ?? ''),
      password: String(formData.get('password') ?? ''),
      username: String(formData.get('username') ?? ''),
    };
    const fieldsToValidate: Array<keyof FormValues> = isSignup
      ? ['name', 'username', 'email', 'password', 'confirmPassword']
      : ['email', 'password'];
    const nextErrors: Record<string, string> = {};

    for (const fieldName of fieldsToValidate) {
      const value = submitValues[fieldName];
      const error = validateField(fieldName, value, submitValues);
      if (error) {
        nextErrors[fieldName] = error;
      }
    }

    if (isSignup) {
      const normalizedUsername = submitValues.username.trim().toLowerCase();
      if (
        usernameAvailability.checkedUsername === normalizedUsername &&
        usernameAvailability.status === 'taken'
      ) {
        nextErrors.username = 'This username is already taken.';
      }

      if (
        usernameAvailability.checkedUsername === normalizedUsername &&
        usernameAvailability.status === 'checking'
      ) {
        nextErrors.username = 'Checking username availability...';
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

  useEffect(() => {
    if (!isSignup) {
      return;
    }

    const candidate = formValues.username.trim();
    const normalizedUsername = candidate.toLowerCase();
    const isUsernameFormatValid =
      candidate.length >= 3 &&
      candidate.length <= 20 &&
      /^[a-zA-Z0-9_]+$/.test(candidate);

    if (!isUsernameFormatValid) {
      usernameRequestIdRef.current += 1;
      return;
    }

    const requestId = usernameRequestIdRef.current + 1;
    usernameRequestIdRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/username-availability?username=${encodeURIComponent(normalizedUsername)}`,
          {
            cache: 'no-store',
          },
        );
        const result =
          (await response.json()) as Partial<UsernameAvailabilityResponse>;

        if (usernameRequestIdRef.current !== requestId) {
          return;
        }

        if (!response.ok) {
          setUsernameAvailability({
            checkedUsername: normalizedUsername,
            status: 'error',
            suggestions: [],
          });
          return;
        }

        if (result.available) {
          setUsernameAvailability({
            checkedUsername: normalizedUsername,
            status: 'available',
            suggestions: [],
          });
          setClientErrors((previous) => {
            if (previous.username !== 'This username is already taken.') {
              return previous;
            }

            const remaining = { ...previous };
            delete remaining.username;
            return remaining;
          });
          return;
        }

        setUsernameAvailability({
          checkedUsername: normalizedUsername,
          status: 'taken',
          suggestions: Array.isArray(result.suggestions)
            ? result.suggestions
            : [],
        });
        setClientErrors((previous) => ({
          ...previous,
          username: 'This username is already taken.',
        }));
      } catch {
        if (usernameRequestIdRef.current !== requestId) {
          return;
        }

        setUsernameAvailability({
          checkedUsername: normalizedUsername,
          status: 'error',
          suggestions: [],
        });
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [formValues.username, isSignup]);

  const applySuggestedUsername = (suggestedUsername: string) => {
    const nextValues = {
      ...formValues,
      username: suggestedUsername,
    };

    setFormValues(nextValues);
    setEditedFields((previous) => ({ ...previous, username: true }));
    setDismissServerMessage(true);
    updateClientValidation('username', suggestedUsername, nextValues);
  };

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={handleSubmit}
      className={[
        'grid gap-4 border shadow-panel',
        isSignup
          ? 'rounded-lg border-line bg-panel p-6'
          : 'rounded-2xl border-line bg-white/95 p-5 shadow-[0_24px_64px_rgba(35,35,28,0.2)] backdrop-blur-[2px] sm:p-6',
      ].join(' ')}
    >
      <div className="grid gap-1.5">
        <p className="text-[0.62rem] font-bold uppercase tracking-widest text-accent-strong/90">
          {isSignup ? 'Create account' : 'Welcome back'}
        </p>
        <h1 className="auth-display-heading">
          {isSignup ? 'Sign up' : 'Log in'}
        </h1>
        {!isSignup && (
          <p className="text-[0.95rem] leading-6 text-foreground/68">
            Pick up your progress and chase a cleaner solve.
          </p>
        )}
      </div>

      {isSignup && (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className={fieldLabelClass} htmlFor="name">
              Name{' '}
              <span aria-hidden="true" className="text-danger">
                *
              </span>
            </label>
            <input
              aria-describedby={
                getFieldError('name') ? 'name-error' : undefined
              }
              aria-invalid={Boolean(getFieldError('name'))}
              className={getInputClass('name')}
              id="name"
              name="name"
              autoComplete="name"
              minLength={2}
              onChange={handleFieldChange}
              placeholder="Ada Lovelace"
              required
              value={formValues.name}
            />
            {getFieldError('name') && (
              <p className="text-[0.9rem] text-danger" id="name-error">
                {getFieldError('name')}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <label className={fieldLabelClass} htmlFor="username">
              Username{' '}
              <span aria-hidden="true" className="text-danger">
                *
              </span>
            </label>
            <input
              aria-describedby={
                getFieldError('username') ? 'username-error' : undefined
              }
              aria-invalid={Boolean(getFieldError('username'))}
              className={getInputClass('username')}
              id="username"
              name="username"
              autoCapitalize="none"
              autoComplete="username"
              maxLength={20}
              minLength={3}
              onChange={handleFieldChange}
              placeholder="frog_runner"
              required
              value={formValues.username}
            />
            {getFieldError('username') && (
              <p className="text-[0.9rem] text-danger" id="username-error">
                {getFieldError('username')}
              </p>
            )}
            {!getFieldError('username') &&
              formValues.username.trim().length >= 3 &&
              usernameAvailability.status === 'checking' && (
                <p className="text-[0.8rem] text-muted">
                  Checking username availability...
                </p>
              )}
            {!getFieldError('username') &&
              usernameAvailability.status === 'available' && (
                <p className="text-[0.8rem] font-medium text-accent-strong">
                  Username is available.
                </p>
              )}
            {!getFieldError('username') &&
              usernameAvailability.status === 'taken' && (
                <div className="grid gap-2">
                  <p className="text-[0.8rem] text-danger">
                    That username is taken. Try one of these:
                  </p>
                  {usernameAvailability.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {usernameAvailability.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.75rem] font-medium text-foreground/78 transition-colors hover:border-accent/45 hover:text-accent-strong"
                          onClick={() => applySuggestedUsername(suggestion)}
                          type="button"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            {!getFieldError('username') &&
              usernameAvailability.status === 'error' && (
                <p className="text-[0.8rem] text-muted">
                  Could not check username availability right now.
                </p>
              )}
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <label className={fieldLabelClass} htmlFor="email">
          Email{' '}
          <span aria-hidden="true" className="text-danger">
            *
          </span>
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
          value={formValues.email}
        />
        {getFieldError('email') && (
          <p className="text-[0.9rem] text-danger" id="email-error">
            {getFieldError('email')}
          </p>
        )}
      </div>

      <div className={isSignup ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-2'}>
        <div className="grid gap-2">
          <label className={fieldLabelClass} htmlFor="password">
            Password{' '}
            <span aria-hidden="true" className="text-danger">
              *
            </span>
          </label>
          <div className="relative">
            <input
              aria-describedby={
                getFieldError('password') ? 'password-error' : undefined
              }
              aria-invalid={Boolean(getFieldError('password'))}
              className={`${getInputClass('password')} pr-11`}
              id="password"
              name="password"
              type={visiblePasswords.password ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={isSignup ? 8 : 1}
              onChange={handleFieldChange}
              placeholder={
                isSignup
                  ? 'At least 8 chars, letters + numbers'
                  : 'Your password'
              }
              required
              value={formValues.password}
            />
            <button
              aria-label={
                visiblePasswords.password ? 'Hide password' : 'Show password'
              }
              className="absolute inset-y-0 right-2 inline-flex w-8 items-center justify-center text-muted transition-colors hover:text-accent-strong"
              onClick={() => togglePasswordVisibility('password')}
              type="button"
            >
              {visiblePasswords.password ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {isSignup && formValues.password.length > 0 && (
            <div className="mt-1 grid gap-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-strong/60">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-200',
                    passwordStrength <= 1
                      ? 'bg-danger'
                      : passwordStrength <= 2
                        ? 'bg-[#b37a37]'
                        : passwordStrength <= 3
                          ? 'bg-accent-strong'
                          : 'bg-accent',
                  ].join(' ')}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </div>
              <p
                className={[
                  'text-[0.78rem] font-bold',
                  passwordStrengthClass,
                ].join(' ')}
              >
                Password strength: {passwordStrengthLabel}
              </p>
            </div>
          )}
          {getFieldError('password') && (
            <p className="text-[0.9rem] text-danger" id="password-error">
              {getFieldError('password')}
            </p>
          )}
        </div>
        {isSignup && (
          <div className="grid gap-2">
            <label className={fieldLabelClass} htmlFor="confirmPassword">
              Confirm Password{' '}
              <span aria-hidden="true" className="text-danger">
                *
              </span>
            </label>
            <div className="relative">
              <input
                aria-describedby={
                  getFieldError('confirmPassword')
                    ? 'confirm-password-error'
                    : undefined
                }
                aria-invalid={Boolean(getFieldError('confirmPassword'))}
                className={`${getInputClass('confirmPassword')} pr-11`}
                id="confirmPassword"
                name="confirmPassword"
                type={visiblePasswords.confirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                onChange={handleFieldChange}
                placeholder="Re-enter your password"
                required
                value={formValues.confirmPassword}
              />
              <button
                aria-label={
                  visiblePasswords.confirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
                className="absolute inset-y-0 right-2 inline-flex w-8 items-center justify-center text-muted transition-colors hover:text-accent-strong"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                type="button"
              >
                {visiblePasswords.confirmPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {getFieldError('confirmPassword') && (
              <p
                className="text-[0.9rem] text-danger"
                id="confirm-password-error"
              >
                {getFieldError('confirmPassword')}
              </p>
            )}
          </div>
        )}
      </div>

      {state.message && !dismissServerMessage && (
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
