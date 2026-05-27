'use server';

import { redirect } from 'next/navigation';

import {
  ApiRequestError,
  AuthResponse,
  apiRequest,
  getApiFieldErrors,
  getApiMessage,
} from '@/lib/api';
import { routes } from '@/lib/routes';
import { destroySession, setSessionToken } from '@/lib/session';
import { AuthFormState, loginSchema, signupSchema } from '@/lib/validation';

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = signupSchema.safeParse({
    name: formData.get('name'),
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, username, email, password } = validatedFields.data;

  try {
    const response = await apiRequest<AuthResponse>('/auth/signup', {
      body: { email, name, password, username },
      method: 'POST',
      token: null,
    });

    await setSessionToken(response.accessToken);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 409) {
      const fieldErrors = getApiFieldErrors(error);
      if (fieldErrors) {
        return { errors: fieldErrors };
      }

      return {
        errors: {
          email: ['An account with this email already exists.'],
        },
      };
    }

    return {
      errors: getApiFieldErrors(error),
      message:
        getApiMessage(error) ??
        'Could not create your account. Try again in a moment.',
    };
  }

  redirect(routes.play);
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  try {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      body: { email, password },
      method: 'POST',
      token: null,
    });

    await setSessionToken(response.accessToken);
  } catch (error) {
    return {
      errors: getApiFieldErrors(error),
      message: getApiMessage(error) ?? 'Email or password is incorrect.',
    };
  }

  redirect(routes.play);
}

export async function logout() {
  await destroySession();
  redirect(routes.home);
}
