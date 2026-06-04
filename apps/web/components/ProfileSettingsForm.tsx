'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { updateProfile } from '@/app/actions/auth';
import {
  AuthFormState,
  nameSchema,
  usernameSchema,
} from '@/lib/validation';

import { SettingsDisclosure } from './SettingsDisclosure';

type ProfileSettingsFormProps = {
  compact?: boolean;
  email: string;
  name: string;
  username: string;
};

type UsernameAvailabilityResponse = {
  available: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  suggestions: string[];
};

type UsernameAvailabilityState = {
  checkedUsername: string;
  status: 'idle' | 'checking' | 'available' | 'taken' | 'error';
  suggestions: string[];
};

const initialState: AuthFormState = {};

export function ProfileSettingsForm({
  compact = false,
  email,
  name,
  username,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const normalizedInitialUsername = username.trim().toLowerCase();
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updateProfile,
    initialState,
  );
  const usernameRequestIdRef = useRef(0);
  const [formValues, setFormValues] = useState({
    name,
    username,
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [usernameAvailability, setUsernameAvailability] =
    useState<UsernameAvailabilityState>({
      checkedUsername: normalizedInitialUsername,
      status: 'idle',
      suggestions: [],
    });

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  useEffect(() => {
    const candidate = formValues.username.trim();
    const normalizedUsername = candidate.toLowerCase();

    if (normalizedUsername === normalizedInitialUsername) {
      usernameRequestIdRef.current += 1;
      const timeoutId = window.setTimeout(() => {
        setUsernameAvailability({
          checkedUsername: normalizedUsername,
          status: 'idle',
          suggestions: [],
        });
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const usernameResult = usernameSchema.safeParse(candidate);
    if (!usernameResult.success) {
      usernameRequestIdRef.current += 1;
      const timeoutId = window.setTimeout(() => {
        setUsernameAvailability({
          checkedUsername: normalizedUsername,
          status: 'idle',
          suggestions: [],
        });
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const requestId = usernameRequestIdRef.current + 1;
    usernameRequestIdRef.current = requestId;
    const checkingTimeoutId = window.setTimeout(() => {
      setUsernameAvailability({
        checkedUsername: normalizedUsername,
        status: 'checking',
        suggestions: [],
      });
    }, 0);

    const timeoutId = window.setTimeout(async () => {
      window.clearTimeout(checkingTimeoutId);
      try {
        const response = await fetch(
          `/api/auth/username-availability?username=${encodeURIComponent(normalizedUsername)}`,
          { cache: 'no-store' },
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

        setUsernameAvailability({
          checkedUsername: normalizedUsername,
          status: result.available ? 'available' : 'taken',
          suggestions: Array.isArray(result.suggestions)
            ? result.suggestions
            : [],
        });
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
      window.clearTimeout(checkingTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [formValues.username, normalizedInitialUsername]);

  const validateForm = (values = formValues) => {
    const nextErrors: Record<string, string> = {};
    const nameResult = nameSchema.safeParse(values.name);
    const usernameResult = usernameSchema.safeParse(values.username);
    const normalizedUsername = values.username.trim().toLowerCase();

    if (!nameResult.success) {
      nextErrors.name = nameResult.error.flatten().formErrors[0] ?? '';
    }

    if (!usernameResult.success) {
      nextErrors.username =
        usernameResult.error.flatten().formErrors[0] ?? '';
    }

    if (
      normalizedUsername !== normalizedInitialUsername &&
      usernameAvailability.checkedUsername === normalizedUsername &&
      usernameAvailability.status === 'taken'
    ) {
      nextErrors.username = 'This username is already taken.';
    }

    if (
      normalizedUsername !== normalizedInitialUsername &&
      usernameAvailability.checkedUsername === normalizedUsername &&
      usernameAvailability.status === 'checking'
    ) {
      nextErrors.username = 'Checking username availability...';
    }

    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const nextErrors = validateForm();
    setClientErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  };

  const updateValue = (field: 'name' | 'username', value: string) => {
    const nextValues = { ...formValues, [field]: value };
    setFormValues(nextValues);
    setClientErrors(validateForm(nextValues));
  };

  const applySuggestedUsername = (suggestedUsername: string) => {
    updateValue('username', suggestedUsername);
  };

  const nameError = clientErrors.name || state.errors?.name?.[0];
  const usernameError = clientErrors.username || state.errors?.username?.[0];
  const hasChanges =
    formValues.name.trim() !== name.trim() ||
    formValues.username.trim().toLowerCase() !== normalizedInitialUsername;
  const canSubmit =
    hasChanges &&
    !pending &&
    !nameError &&
    !usernameError &&
    usernameAvailability.status !== 'checking';

  const form = (
    <form action={formAction} className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label
          className="text-[0.78rem] font-medium tracking-[0.01em] text-foreground/76"
          htmlFor="profile-name"
        >
          Display name
        </label>
        <input
          aria-describedby={nameError ? 'profile-name-error' : undefined}
          aria-invalid={Boolean(nameError)}
          autoComplete="name"
          className={[
            'min-h-11 w-full rounded-[9px] border bg-surface px-3 text-foreground placeholder:text-[0.85rem] outline-none transition-[border-color,box-shadow,background-color]',
            nameError
              ? 'border-danger/65 focus:border-danger/75 focus:shadow-focus-danger'
              : 'border-line focus:border-accent/60 focus:bg-surface focus:shadow-focus-primary',
          ].join(' ')}
          id="profile-name"
          minLength={2}
          name="name"
          onChange={(event) => updateValue('name', event.target.value)}
          required
          type="text"
          value={formValues.name}
        />
        {nameError ? (
          <p className="text-[0.9rem] text-danger" id="profile-name-error">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label
          className="text-[0.78rem] font-medium tracking-[0.01em] text-foreground/76"
          htmlFor="profile-username"
        >
          Username
        </label>
        <input
          aria-describedby={
            usernameError ? 'profile-username-error' : 'profile-username-help'
          }
          aria-invalid={Boolean(usernameError)}
          autoComplete="username"
          className={[
            'min-h-11 w-full rounded-[9px] border bg-surface px-3 text-foreground placeholder:text-[0.85rem] outline-none transition-[border-color,box-shadow,background-color]',
            usernameError
              ? 'border-danger/65 focus:border-danger/75 focus:shadow-focus-danger'
              : 'border-line focus:border-accent/60 focus:bg-surface focus:shadow-focus-primary',
          ].join(' ')}
          id="profile-username"
          maxLength={20}
          minLength={3}
          name="username"
          onChange={(event) => updateValue('username', event.target.value)}
          pattern="[A-Za-z0-9_]+"
          required
          type="text"
          value={formValues.username}
        />
        {usernameError ? (
          <p className="text-[0.9rem] text-danger" id="profile-username-error">
            {usernameError}
          </p>
        ) : (
          <p className="text-[0.82rem] text-muted" id="profile-username-help">
            3-20 letters, numbers, or underscores.
          </p>
        )}
        {usernameAvailability.status === 'available' ? (
          <p className="text-[0.82rem] font-bold text-accent-strong">
            Username is available.
          </p>
        ) : null}
        {usernameAvailability.status === 'error' ? (
          <p className="text-[0.82rem] text-muted">
            Could not check availability right now. We will verify on save.
          </p>
        ) : null}
        {usernameAvailability.suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {usernameAvailability.suggestions.map((suggestion) => (
              <button
                className="rounded-full border border-accent/20 bg-accent/8 px-2.5 py-1 text-xs font-bold text-accent-strong"
                key={suggestion}
                onClick={() => applySuggestedUsername(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label
          className="text-[0.78rem] font-medium tracking-[0.01em] text-foreground/76"
          htmlFor="profile-email"
        >
          Email address
        </label>
        <input
          className="min-h-11 w-full rounded-[9px] border border-line bg-panel-strong/45 px-3 text-muted outline-none"
          id="profile-email"
          readOnly
          type="email"
          value={email}
        />
        <p className="text-[0.82rem] leading-5 text-muted">
          Email changes require current-password confirmation and verification
          of the new address. This account keeps the current email active until
          that flow is available.
        </p>
      </div>

      {state.message ? (
        <p
          role={state.success ? 'status' : 'alert'}
          className={
            state.success
              ? 'rounded-[9px] border border-accent/24 bg-accent/8 px-3 py-2 text-[0.9rem] font-bold text-accent-strong'
              : 'rounded-[9px] border border-danger/24 bg-danger/6 px-3 py-2 text-[0.9rem] font-bold text-danger'
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[9px] border border-accent bg-accent px-3.5 font-bold text-white shadow-button-primary transition-[background-color,transform] hover:bg-accent-strong active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65 sm:w-fit"
        disabled={!canSubmit}
        type="submit"
      >
        {pending ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  );

  if (compact) {
    return (
      <SettingsDisclosure
        badge="Public"
        description="Update your public player identity."
        title="Profile settings"
      >
        {form}
      </SettingsDisclosure>
    );
  }

  return form;
}
