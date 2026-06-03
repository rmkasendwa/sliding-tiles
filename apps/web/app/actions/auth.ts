'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import {
  ApiRequestError,
  AuthResponse,
  apiRequest,
  getApiFieldErrors,
  getApiMessage,
} from '@/lib/api';
import { routes } from '@/lib/routes';
import { destroySession, setSessionToken } from '@/lib/session';
import {
  AuthFormState,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  updateProfileSchema,
} from '@/lib/validation';

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
          email: ['An account with this email address already exists.'],
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
    identifier: formData.get('identifier'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { identifier, password } = validatedFields.data;
  try {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      body: { identifier, password },
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

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = forgotPasswordSchema.safeParse({
    identifier: formData.get('identifier'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { identifier } = validatedFields.data;
  try {
    await apiRequest<{ ok: true }>('/auth/forgot-password', {
      body: { identifier },
      method: 'POST',
      token: null,
    });
  } catch (error) {
    return {
      errors: getApiFieldErrors(error),
      message:
        getApiMessage(error) ??
        'Could not send a reset link right now. Please try again shortly.',
      success: false,
    };
  }

  return {
    message:
      'If an account matches that email or username, a reset link is on its way.',
    success: true,
  };
}

export async function resetPassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = resetPasswordSchema.safeParse({
    confirmPassword: formData.get('confirmPassword'),
    password: formData.get('password'),
    token: formData.get('token'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { password, token } = validatedFields.data;
  try {
    await apiRequest<{ ok: true }>('/auth/reset-password', {
      body: { password, token },
      method: 'POST',
      token: null,
    });
  } catch (error) {
    return {
      errors: getApiFieldErrors(error),
      message:
        getApiMessage(error) ??
        'That reset link is invalid or expired. Request a new one.',
      success: false,
    };
  }

  return {
    message: 'Password updated. You can log in with your new password now.',
    success: true,
  };
}

export async function changePassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = changePasswordSchema.safeParse({
    confirmPassword: formData.get('confirmPassword'),
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { confirmPassword, currentPassword, newPassword } =
    validatedFields.data;
  try {
    await apiRequest<{ ok: true }>('/auth/change-password', {
      body: { confirmPassword, currentPassword, newPassword },
      method: 'POST',
    });
  } catch (error) {
    return {
      errors: getApiFieldErrors(error),
      message:
        getApiMessage(error) ??
        'Could not update your password right now. Try again shortly.',
      success: false,
    };
  }

  return {
    message: 'Password changed successfully.',
    success: true,
  };
}

export async function updateProfile(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = updateProfileSchema.safeParse({
    name: formData.get('name'),
    username: formData.get('username'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { name, username } = validatedFields.data;
  try {
    const response = await apiRequest<AuthResponse>('/auth/profile', {
      body: { name, username },
      method: 'PATCH',
    });

    await setSessionToken(response.accessToken);
    revalidatePath(routes.profile);
  } catch (error) {
    return {
      errors: getApiFieldErrors(error),
      message:
        getApiMessage(error) ??
        'Could not update your profile right now. Try again shortly.',
      success: false,
    };
  }

  return {
    message: 'Profile updated successfully.',
    success: true,
  };
}

export async function logout() {
  await destroySession();
  redirect(routes.home);
}
