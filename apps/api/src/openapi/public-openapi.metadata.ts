import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { z } from 'zod';

import {
  anonymousAnalyticsEventInputSchema,
  boardStateSchema,
  changePasswordSchema,
  completedLevelSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  saveGameStateSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '../shared/zod';

type JsonSchema = Record<string, unknown>;

export function AuthenticatedApi() {
  return applyDecorators(
    ApiBearerAuth('bearerAuth'),
    ApiCookieAuth('sessionCookie'),
  );
}

export function schemaFromZod(schema: z.ZodType): JsonSchema {
  return removeDefaultsFromRequired(
    z.toJSONSchema(schema, { target: 'draft-2020-12' }) as JsonSchema,
  );
}

function removeDefaultsFromRequired(schema: JsonSchema): JsonSchema {
  if (schema.default !== undefined && schema.type !== 'object') {
    return schema;
  }

  if (schema.type === 'object' && typeof schema.properties === 'object') {
    const properties = schema.properties as Record<string, JsonSchema>;
    Object.values(properties).forEach(removeDefaultsFromRequired);

    if (Array.isArray(schema.required)) {
      schema.required = schema.required.filter((name) => {
        const property = properties[String(name)];
        return !property || property.default === undefined;
      });
    }
  }

  if (Array.isArray(schema.items)) {
    schema.items.forEach((item) => removeDefaultsFromRequired(item));
  } else if (schema.items && typeof schema.items === 'object') {
    removeDefaultsFromRequired(schema.items as JsonSchema);
  }

  if (Array.isArray(schema.prefixItems)) {
    schema.prefixItems.forEach((item) => removeDefaultsFromRequired(item));
  }

  delete schema.$schema;
  return schema;
}

export function ref(name: keyof typeof publicApiSchemas) {
  return { $ref: `#/components/schemas/${name}` };
}

export const userExample = {
  avatarUrl: 'https://www.gravatar.com/avatar/...',
  email: 'ada@example.com',
  emailVerified: true,
  id: 'clx_player_123',
  name: 'Ada Lovelace',
  role: 'USER',
  username: 'ada_l',
};

export const boardExample = {
  dimensions: [4, 4],
  emptySlot: [3, 3],
  elapsedTimeMs: 42000,
  level: 7,
  movableSlots: [
    [2, 3],
    [3, 2],
  ],
  moves: 64,
  solutionMoves: [
    [3, 2],
    [3, 1],
  ],
  startedAt: '2026-07-22T09:30:00.000Z',
  tileGrid: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, null],
  ],
};

export const scoreExample = {
  attemptType: 'original',
  completedAt: '2026-07-22T09:31:04.000Z',
  id: 'completion_123',
  level: 7,
  moves: 64,
  replayOfId: null,
  timeSeconds: 42,
  userId: 'clx_player_123',
};

function scoreProperties() {
  return {
    attemptType: { enum: ['original', 'replay'], type: 'string' },
    completedAt: { format: 'date-time', type: 'string' },
    id: { type: 'string' },
    level: { minimum: 1, type: 'integer' },
    moves: { minimum: 0, type: 'integer' },
    replayOfId: { nullable: true, type: 'string' },
    timeSeconds: { minimum: 1, type: 'integer' },
    userId: { type: 'string' },
  };
}

function scoreRequired() {
  return [
    'attemptType',
    'completedAt',
    'id',
    'level',
    'moves',
    'replayOfId',
    'timeSeconds',
    'userId',
  ];
}

export const publicApiSchemas = {
  AnalyticsAcceptedResponse: {
    additionalProperties: false,
    properties: {
      accepted: { example: 1, minimum: 0, type: 'integer' },
    },
    required: ['accepted'],
    type: 'object',
  },
  AnonymousAnalyticsBatchRequest: schemaFromZod(
    z.object({
      events: z.array(anonymousAnalyticsEventInputSchema).min(1).max(50),
    }),
  ),
  AuthResponse: {
    additionalProperties: false,
    properties: {
      accessToken: { type: 'string' },
      user: { $ref: '#/components/schemas/SessionUser' },
    },
    required: ['accessToken', 'user'],
    type: 'object',
  },
  BoardState: schemaFromZod(boardStateSchema),
  ChangePasswordRequest: schemaFromZod(changePasswordSchema),
  CompletedLevelRequest: schemaFromZod(completedLevelSchema),
  ErrorResponse: {
    additionalProperties: true,
    properties: {
      error: { example: 'Bad Request', type: 'string' },
      errors: {
        additionalProperties: {
          items: { type: 'string' },
          type: 'array',
        },
        type: 'object',
      },
      message: {
        oneOf: [
          { example: 'Request validation failed.', type: 'string' },
          { items: { type: 'string' }, type: 'array' },
        ],
      },
      statusCode: { example: 400, type: 'integer' },
    },
    type: 'object',
  },
  ForgotPasswordRequest: schemaFromZod(forgotPasswordSchema),
  GameState: {
    additionalProperties: false,
    properties: {
      board: { $ref: '#/components/schemas/BoardState' },
      id: { type: 'string' },
      level: { minimum: 1, type: 'integer' },
      moves: { minimum: 0, type: 'integer' },
      startedAt: { format: 'date-time', type: 'string' },
      updatedAt: { format: 'date-time', type: 'string' },
      userId: { type: 'string' },
    },
    required: [
      'board',
      'id',
      'level',
      'moves',
      'startedAt',
      'updatedAt',
      'userId',
    ],
    type: 'object',
  },
  GameStateResponse: {
    additionalProperties: false,
    properties: {
      gameState: {
        nullable: true,
        oneOf: [{ $ref: '#/components/schemas/GameState' }],
      },
      highestReachedLevel: { minimum: 1, type: 'integer' },
    },
    required: ['gameState', 'highestReachedLevel'],
    type: 'object',
  },
  LeaderboardRecord: {
    additionalProperties: true,
    properties: {
      ...scoreProperties(),
      puzzleConfig: {
        nullable: true,
        oneOf: [{ $ref: '#/components/schemas/BoardState' }],
      },
    },
    required: scoreRequired(),
    type: 'object',
  },
  LeaderboardResponse: {
    additionalProperties: false,
    properties: {
      generatedAt: { format: 'date-time', type: 'string' },
      scores: {
        items: { $ref: '#/components/schemas/PublicLeaderboardScore' },
        type: 'array',
      },
    },
    required: ['generatedAt', 'scores'],
    type: 'object',
  },
  LoginRequest: schemaFromZod(loginSchema),
  OkResponse: {
    additionalProperties: false,
    properties: {
      ok: { example: true, type: 'boolean' },
    },
    required: ['ok'],
    type: 'object',
  },
  ProfileResponse: {
    additionalProperties: false,
    properties: {
      gameState: {
        nullable: true,
        oneOf: [{ $ref: '#/components/schemas/GameState' }],
      },
      scores: {
        items: { $ref: '#/components/schemas/LeaderboardRecord' },
        type: 'array',
      },
    },
    required: ['gameState', 'scores'],
    type: 'object',
  },
  PublicLeaderboardScore: {
    additionalProperties: false,
    properties: {
      ...scoreProperties(),
      user: {
        additionalProperties: false,
        properties: {
          avatarUrl: { format: 'uri', type: 'string' },
          name: { type: 'string' },
        },
        required: ['avatarUrl', 'name'],
        type: 'object',
      },
    },
    required: [...scoreRequired(), 'user'],
    type: 'object',
  },
  RegisterRequest: schemaFromZod(registerSchema),
  ReplayBoardResponse: {
    additionalProperties: false,
    properties: {
      bestMoves: { minimum: 0, type: 'integer' },
      bestTimeSeconds: { minimum: 1, type: 'integer' },
      board: { $ref: '#/components/schemas/BoardState' },
      replayOfId: { type: 'string' },
    },
    required: ['bestMoves', 'bestTimeSeconds', 'board', 'replayOfId'],
    type: 'object',
  },
  ResetPasswordRequest: schemaFromZod(resetPasswordSchema),
  SaveGameStateRequest: schemaFromZod(saveGameStateSchema),
  SaveGameStateResponse: {
    additionalProperties: false,
    properties: {
      gameState: { $ref: '#/components/schemas/GameState' },
    },
    required: ['gameState'],
    type: 'object',
  },
  SessionUser: {
    additionalProperties: false,
    properties: {
      avatarUrl: { format: 'uri', type: 'string' },
      email: { format: 'email', type: 'string' },
      emailVerified: { type: 'boolean' },
      id: { type: 'string' },
      name: { type: 'string' },
      role: { enum: ['USER', 'ADMIN'], type: 'string' },
      username: { type: 'string' },
    },
    required: [
      'avatarUrl',
      'email',
      'emailVerified',
      'id',
      'name',
      'role',
      'username',
    ],
    type: 'object',
  },
  UpdateProfileRequest: schemaFromZod(updateProfileSchema),
  UserCompletionResponse: {
    additionalProperties: false,
    properties: {
      nextCursor: { nullable: true, type: 'string' },
      scores: {
        items: { $ref: '#/components/schemas/UserCompletionSummary' },
        type: 'array',
      },
      totalCount: { minimum: 0, type: 'integer' },
    },
    required: ['nextCursor', 'scores', 'totalCount'],
    type: 'object',
  },
  UserCompletionSummary: {
    additionalProperties: false,
    properties: {
      ...scoreProperties(),
      canReplay: { type: 'boolean' },
      levelBest: {
        nullable: true,
        oneOf: [
          {
            additionalProperties: false,
            properties: {
              moves: { minimum: 0, type: 'integer' },
              timeSeconds: { minimum: 1, type: 'integer' },
            },
            required: ['moves', 'timeSeconds'],
            type: 'object',
          },
        ],
      },
      replayComparison: { nullable: true, type: 'string' },
    },
    required: [
      ...scoreRequired(),
      'canReplay',
      'levelBest',
      'replayComparison',
    ],
    type: 'object',
  },
  UsernameAvailabilityResponse: {
    additionalProperties: false,
    properties: {
      available: { type: 'boolean' },
      suggestions: {
        items: { type: 'string' },
        type: 'array',
      },
    },
    required: ['available', 'suggestions'],
    type: 'object',
  },
  VerifyEmailRequest: schemaFromZod(verifyEmailSchema),
};
