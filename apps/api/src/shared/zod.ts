import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    errors: result.error.flatten().fieldErrors,
    message: 'Request validation failed.',
  });
}

export const boardStateSchema = z.object({
  dimensions: z.tuple([
    z.number().int().positive(),
    z.number().int().positive(),
  ]),
  emptySlot: z.tuple([
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
  ]),
  elapsedTimeMs: z.number().int().nonnegative().default(0),
  level: z.number().int().positive(),
  movableSlots: z.array(
    z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
  ),
  moves: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
  tileGrid: z.array(z.array(z.unknown())),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username.'),
});

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(20, 'Username must be at most 20 characters.')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores.',
  );

export const signupSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  username: usernameSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-zA-Z]/, 'Password needs at least one letter.')
    .regex(/[0-9]/, 'Password needs at least one number.'),
});

export const usernameAvailabilityQuerySchema = z.object({
  username: usernameSchema,
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-zA-Z]/, 'Password needs at least one letter.')
    .regex(/[0-9]/, 'Password needs at least one number.'),
  token: z.string().trim().min(1, 'Reset token is required.'),
});

export const saveGameStateSchema = z.object({
  board: boardStateSchema,
});

export const completedLevelSchema = z.object({
  board: boardStateSchema,
});
