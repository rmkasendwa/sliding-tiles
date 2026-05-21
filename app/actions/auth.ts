'use server';

import { redirect } from 'next/navigation';

import { hashPassword, verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { routes } from '@/lib/routes';
import { createSession, destroySession } from '@/lib/session';
import {
  AuthFormState,
  loginSchema,
  signupSchema,
} from '@/lib/validation';

export async function signup(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validatedFields = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await createSession(user);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        errors: {
          email: ['An account with this email already exists.'],
        },
      };
    }

    return {
      message: 'Could not create your account. Try again in a moment.',
    };
  }

  redirect(routes.play);
}

export async function login(
  _state: AuthFormState,
  formData: FormData
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
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return {
      message: 'Email or password is incorrect.',
    };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  redirect(routes.play);
}

export async function logout() {
  await destroySession();
  redirect(routes.home);
}
