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
  solutionMoves: z
    .array(
      z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
    )
    .optional(),
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

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required.'),
});

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

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters.');

export const registerSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  name: nameSchema,
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

export const saveGameStateSchema = z.object({
  board: boardStateSchema,
});

export const completedLevelSchema = z.object({
  attemptType: z.enum(['original', 'replay']).default('original'),
  board: boardStateSchema,
  puzzleConfig: boardStateSchema.optional(),
  replayOfId: z.string().trim().min(1).optional(),
});

export const anonymousAnalyticsEventNames = [
  'game_opened',
  'level_started',
  'move_made',
  'level_completed',
  'level_abandoned',
  'timer_paused',
  'timer_resumed',
  'reset_level_clicked',
  'full_image_peeked',
  'auto_play_started',
  'auto_play_completed',
  'register_prompt_shown',
  'register_clicked',
] as const;

const anonymousAnalyticsEventSchema = z
  .object({
    anonymousPlayerId: z.string().uuid(),
    eventName: z.enum(anonymousAnalyticsEventNames),
    level: z.number().int().positive().max(100_000).optional(),
    moveCount: z.number().int().nonnegative().max(10_000_000).optional(),
    puzzleSize: z.string().regex(/^\d{1,3}x\d{1,3}$/).optional(),
    screenHeight: z.number().int().positive().max(100_000).optional(),
    screenWidth: z.number().int().positive().max(100_000).optional(),
    sessionId: z.string().uuid(),
    timerValueMs: z.number().int().nonnegative().max(604_800_000).optional(),
    timestamp: z.string().datetime(),
    userAgent: z.string().trim().max(512).optional(),
  })
  .strict();

export const anonymousAnalyticsBatchSchema = z
  .object({
    events: z.array(anonymousAnalyticsEventSchema).min(1).max(50),
  })
  .strict();
