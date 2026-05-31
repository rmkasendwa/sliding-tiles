'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { changePassword } from '@/app/actions/auth';
import { AuthFormState, changePasswordSchema } from '@/lib/validation';

import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const initialState: AuthFormState = {};

type FormValues = {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
};

type ChangePasswordFormProps = {
  compact?: boolean;
};

export function ChangePasswordForm({
  compact = false,
}: ChangePasswordFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    changePassword,
    initialState,
  );
  const [visible, setVisible] = useState({
    confirmPassword: false,
    currentPassword: false,
    newPassword: false,
  });
  const [formValues, setFormValues] = useState<FormValues>({
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    const timeout = window.setTimeout(() => {
      setFormValues({
        confirmPassword: '',
        currentPassword: '',
        newPassword: '',
      });
      setClientErrors({});
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [state.success]);

  const getInputClass = (fieldName: keyof FormValues) => {
    const hasError = Boolean(
      clientErrors[fieldName] || state.errors?.[fieldName]?.[0],
    );
    return [
      'min-h-11 w-full rounded-[9px] border bg-white px-3 text-foreground placeholder:text-[0.85rem] outline-none transition-[border-color,box-shadow,background-color]',
      hasError
        ? 'border-danger/65 focus:border-danger/75 focus:shadow-[0_0_0_3px_rgba(154,46,46,0.16)]'
        : 'border-line focus:border-accent/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,111,90,0.14)]',
    ].join(' ');
  };

  const validateForm = (values = formValues) => {
    const result = changePasswordSchema.safeParse(values);
    if (result.success) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(result.error.flatten().fieldErrors)
        .map(([field, errors]) => [field, errors?.[0]])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
  };

  const updateValue = (fieldName: keyof FormValues, value: string) => {
    const nextValues = { ...formValues, [fieldName]: value };
    setFormValues(nextValues);
    setClientErrors(validateForm(nextValues));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const nextErrors = validateForm();
    setClientErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  };

  const renderPasswordField = (
    fieldName: keyof FormValues,
    label: string,
    placeholder: string,
    autoComplete: string,
  ) => {
    const error = clientErrors[fieldName] || state.errors?.[fieldName]?.[0];

    return (
      <div className="grid gap-2">
        <label
          className="text-[0.78rem] font-medium tracking-[0.01em] text-foreground/76"
          htmlFor={fieldName}
        >
          {label}
        </label>
        <div className="relative">
          <input
            aria-describedby={error ? `${fieldName}-error` : undefined}
            aria-invalid={Boolean(error)}
            autoComplete={autoComplete}
            className={`${getInputClass(fieldName)} pr-11`}
            id={fieldName}
            minLength={fieldName === 'currentPassword' ? 1 : 8}
            name={fieldName}
            onChange={(event) => updateValue(fieldName, event.target.value)}
            placeholder={placeholder}
            required
            type={visible[fieldName] ? 'text' : 'password'}
            value={formValues[fieldName]}
          />
          <button
            aria-label={visible[fieldName] ? `Hide ${label}` : `Show ${label}`}
            className="absolute inset-y-0 right-2 inline-flex w-8 items-center justify-center text-muted transition-colors hover:text-accent-strong"
            onClick={() =>
              setVisible((previous) => ({
                ...previous,
                [fieldName]: !previous[fieldName],
              }))
            }
            type="button"
          >
            {visible[fieldName] ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
        {fieldName === 'newPassword' ? (
          <PasswordStrengthMeter password={formValues.newPassword} />
        ) : null}
        {error ? (
          <p className="text-[0.9rem] text-danger" id={`${fieldName}-error`}>
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  const hasClientErrors = Object.keys(clientErrors).length > 0;
  const isFormComplete =
    formValues.currentPassword.length > 0 &&
    formValues.newPassword.length > 0 &&
    formValues.confirmPassword.length > 0;

  const formFields = (
    <>
      <div className={compact ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
        {renderPasswordField(
          'currentPassword',
          'Current password',
          'Your current password',
          'current-password',
        )}
        {renderPasswordField(
          'newPassword',
          'New password',
          '8+ chars, letters & numbers',
          'new-password',
        )}
      </div>

      {renderPasswordField(
        'confirmPassword',
        'Confirm new password',
        'Re-enter your new password',
        'new-password',
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

      <button
        className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[9px] border border-accent bg-accent px-3.5 font-bold text-white shadow-[0_10px_20px_rgba(37,111,90,0.24)] transition-[background-color,transform] hover:bg-accent-strong active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit"
        disabled={pending || !isFormComplete || hasClientErrors}
        type="submit"
      >
        {pending ? 'Updating...' : 'Update password'}
      </button>
    </>
  );

  if (compact) {
    return (
      <details className="group w-full max-w-140 rounded-[10px] border border-line bg-white/62">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-bold text-foreground marker:content-none">
          Change password
          <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted">
            <span>Security</span>
            <span className="relative grid h-5 w-5 place-items-center rounded-full border border-line/80 bg-white/80 text-foreground/70">
              <span className="absolute transition-all duration-200 group-open:translate-y-1 group-open:opacity-0">
                +
              </span>
              <span className="absolute opacity-0 transition-all duration-200 group-open:translate-y-0 group-open:opacity-100">
                -
              </span>
            </span>
          </span>
        </summary>
        <form
          action={formAction}
          className="grid gap-4 border-t border-line/70 p-3"
          noValidate
          onSubmit={handleSubmit}
          ref={formRef}
        >
          {formFields}
        </form>
      </details>
    );
  }

  return (
    <form
      action={formAction}
      className="grid gap-4"
      noValidate
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {formFields}
    </form>
  );
}
