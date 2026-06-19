import { z } from 'zod';

export const reservedUsernames = new Set([
  'admin',
  'api',
  'auth',
  'contact',
  'forgot_password',
  'forgot-password',
  'leaderboard',
  'login',
  'play',
  'privacy',
  'profile',
  'register',
  'reset_password',
  'reset-password',
  'settings',
  'support',
  'terms',
]);

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters.');

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(20, 'Username must be at most 20 characters.')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores.',
  )
  .refine(
    (username) => !reservedUsernames.has(username.trim().toLowerCase()),
    'This username is reserved.',
  );

export const registerSchema = z
  .object({
    name: nameSchema,
    username: usernameSchema,
    email: z.string().trim().email('Enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[a-zA-Z]/, 'Password needs at least one letter.')
      .regex(/[0-9]/, 'Password needs at least one number.'),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your email or username.')
    .refine((value) => {
      if (value.includes('@')) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }

      return /^[a-zA-Z0-9_]{3,20}$/.test(value);
    }, 'Enter a valid email or username.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your email or username.')
    .refine((value) => {
      if (value.includes('@')) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }

      return /^[a-zA-Z0-9_]{3,20}$/.test(value);
    }, 'Enter a valid email or username.'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset token is required.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[a-zA-Z]/, 'Password needs at least one letter.')
      .regex(/[0-9]/, 'Password needs at least one number.'),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[a-zA-Z]/, 'Password needs at least one letter.')
      .regex(/[0-9]/, 'Password needs at least one number.'),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
});

export type AuthFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};
