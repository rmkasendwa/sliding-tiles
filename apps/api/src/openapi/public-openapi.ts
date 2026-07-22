import type { INestApplication } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { SESSION_COOKIE_NAME } from '../session/session.constants';
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
  usernameAvailabilityQuerySchema,
  verifyEmailSchema,
} from '../shared/zod';

type JsonSchema = Record<string, unknown>;
type OpenApiOperation = Record<string, unknown>;

const specPath = '/openapi.json';
const apiSpecPath = '/api/openapi.json';
const docsPaths = ['/', '/docs', '/api-docs'];

function schemaFromZod(schema: z.ZodType): JsonSchema {
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

function ref(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

function jsonContent(schema: JsonSchema) {
  return {
    content: {
      'application/json': {
        schema,
      },
    },
  };
}

function jsonContentWithExample(schema: JsonSchema, example: unknown) {
  return {
    content: {
      'application/json': {
        example,
        schema,
      },
    },
  };
}

function requestBody(schema: JsonSchema, example: unknown) {
  return {
    required: true,
    ...jsonContentWithExample(schema, example),
  };
}

function response(description: string, schema: JsonSchema, example?: unknown) {
  return {
    description,
    ...(example === undefined
      ? jsonContent(schema)
      : jsonContentWithExample(schema, example)),
  };
}

function errorResponse(description: string) {
  return {
    description,
    ...jsonContent(ref('ErrorResponse')),
  };
}

function authenticated(operation: OpenApiOperation): OpenApiOperation {
  return {
    ...operation,
    security: [{ bearerAuth: [] }, { sessionCookie: [] }],
  };
}

const userExample = {
  avatarUrl: 'https://www.gravatar.com/avatar/...',
  email: 'ada@example.com',
  emailVerified: true,
  id: 'clx_player_123',
  name: 'Ada Lovelace',
  role: 'USER',
  username: 'ada_l',
};

const boardExample = {
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

const scoreExample = {
  attemptType: 'original',
  completedAt: '2026-07-22T09:31:04.000Z',
  id: 'completion_123',
  level: 7,
  moves: 64,
  replayOfId: null,
  timeSeconds: 42,
  userId: 'clx_player_123',
};

const schemas = {
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
      user: ref('SessionUser'),
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
      board: ref('BoardState'),
      id: { type: 'string' },
      level: { minimum: 1, type: 'integer' },
      moves: { minimum: 0, type: 'integer' },
      startedAt: { format: 'date-time', type: 'string' },
      updatedAt: { format: 'date-time', type: 'string' },
      userId: { type: 'string' },
    },
    required: ['board', 'id', 'level', 'moves', 'startedAt', 'updatedAt', 'userId'],
    type: 'object',
  },
  GameStateResponse: {
    additionalProperties: false,
    properties: {
      gameState: {
        nullable: true,
        oneOf: [ref('GameState')],
      },
      highestReachedLevel: { minimum: 1, type: 'integer' },
    },
    required: ['gameState', 'highestReachedLevel'],
    type: 'object',
  },
  LeaderboardResponse: {
    additionalProperties: false,
    properties: {
      generatedAt: { format: 'date-time', type: 'string' },
      scores: {
        items: ref('PublicLeaderboardScore'),
        type: 'array',
      },
    },
    required: ['generatedAt', 'scores'],
    type: 'object',
  },
  LoginRequest: schemaFromZod(loginSchema),
  LeaderboardRecord: {
    additionalProperties: true,
    properties: {
      ...scoreProperties(),
      puzzleConfig: {
        nullable: true,
        oneOf: [ref('BoardState')],
      },
    },
    required: scoreRequired(),
    type: 'object',
  },
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
        oneOf: [ref('GameState')],
      },
      scores: {
        items: ref('LeaderboardRecord'),
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
      board: ref('BoardState'),
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
      gameState: ref('GameState'),
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
        items: ref('UserCompletionSummary'),
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
  UsernameAvailabilityQuery: schemaFromZod(usernameAvailabilityQuerySchema),
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

export function buildPublicOpenApiSpec() {
  return {
    components: {
      securitySchemes: {
        bearerAuth: {
          bearerFormat: 'JWT',
          scheme: 'bearer',
          type: 'http',
        },
        sessionCookie: {
          in: 'cookie',
          name: SESSION_COOKIE_NAME,
          type: 'apiKey',
        },
      },
      schemas,
    },
    info: {
      description:
        'Public API for Sliding Tiles accounts, saved game state, leaderboard completions, profile data, and privacy-conscious anonymous gameplay analytics. Admin and internal routes are intentionally omitted.',
      title: 'Sliding Tiles API',
      version: '1.0.0',
    },
    jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
    openapi: '3.1.0',
    paths: {
      '/api/anonymous-analytics/events': {
        post: {
          description:
            'Accepts batches of anonymous gameplay events. Authenticated users may include their session cookie or bearer token so events can be associated server-side.',
          operationId: 'recordAnonymousAnalyticsEvents',
          requestBody: requestBody(ref('AnonymousAnalyticsBatchRequest'), {
            events: [
              {
                anonymousId: '7242d01c-636b-42e9-84f1-ce1f75d5cf99',
                eventName: 'level_completed',
                level: 7,
                metadata: { boardSize: '4x4' },
                moveCount: 64,
                pathname: '/play',
                puzzleSize: '4x4',
                screenHeight: 900,
                screenWidth: 1440,
                sessionId: 'e3c512bd-2330-4d20-9e9e-10e1be9eeed6',
                timerValueMs: 42000,
                timestamp: '2026-07-22T09:31:04.000Z',
              },
            ],
          }),
          responses: {
            '201': response('Events accepted.', ref('AnalyticsAcceptedResponse'), {
              accepted: 1,
            }),
            '400': errorResponse('The batch failed validation.'),
          },
          security: [{ bearerAuth: [] }, { sessionCookie: [] }, {}],
          summary: 'Record anonymous analytics events',
          tags: ['Analytics'],
        },
      },
      '/api/auth/change-password': {
        post: authenticated({
          operationId: 'changePassword',
          requestBody: requestBody(ref('ChangePasswordRequest'), {
            confirmPassword: 'n3w-password',
            currentPassword: 'old-password',
            newPassword: 'n3w-password',
          }),
          responses: {
            '201': response('Password changed.', ref('OkResponse'), { ok: true }),
            '400': errorResponse('The current password is wrong or the request is invalid.'),
            '401': errorResponse('Authentication is required.'),
          },
          summary: 'Change password',
          tags: ['Auth'],
        }),
      },
      '/api/auth/forgot-password': {
        post: {
          operationId: 'forgotPassword',
          requestBody: requestBody(ref('ForgotPasswordRequest'), {
            identifier: 'ada@example.com',
          }),
          responses: {
            '201': response('Request accepted even if no account exists.', ref('OkResponse'), {
              ok: true,
            }),
            '400': errorResponse('The identifier is missing.'),
          },
          summary: 'Request a password reset email',
          tags: ['Auth'],
        },
      },
      '/api/auth/login': {
        post: {
          operationId: 'login',
          requestBody: requestBody(ref('LoginRequest'), {
            identifier: 'ada@example.com',
            password: 'correct-horse-7',
          }),
          responses: {
            '201': response('Signed in. Also sets an HTTP-only session cookie.', ref('AuthResponse'), {
              accessToken: 'eyJhbGciOiJIUzI1NiIs...',
              user: userExample,
            }),
            '400': errorResponse('The request body failed validation.'),
            '401': errorResponse('The credentials are incorrect.'),
          },
          summary: 'Sign in',
          tags: ['Auth'],
        },
      },
      '/api/auth/logout': {
        post: {
          operationId: 'logout',
          responses: {
            '201': response('Session cookie cleared.', ref('OkResponse'), { ok: true }),
          },
          security: [{ bearerAuth: [] }, { sessionCookie: [] }, {}],
          summary: 'Sign out',
          tags: ['Auth'],
        },
      },
      '/api/auth/me': {
        get: authenticated({
          operationId: 'getCurrentUser',
          responses: {
            '200': response('Current user.', {
              additionalProperties: false,
              properties: { user: ref('SessionUser') },
              required: ['user'],
              type: 'object',
            }, { user: userExample }),
            '401': errorResponse('Authentication is required.'),
          },
          summary: 'Get current user',
          tags: ['Auth'],
        }),
      },
      '/api/auth/profile': {
        patch: authenticated({
          operationId: 'updateAuthProfile',
          requestBody: requestBody(ref('UpdateProfileRequest'), {
            name: 'Ada Lovelace',
            username: 'ada_l',
          }),
          responses: {
            '200': response('Profile updated. Also refreshes the session cookie.', ref('AuthResponse'), {
              accessToken: 'eyJhbGciOiJIUzI1NiIs...',
              user: userExample,
            }),
            '400': errorResponse('The request body failed validation.'),
            '401': errorResponse('Authentication is required.'),
            '409': errorResponse('The username is already taken.'),
          },
          summary: 'Update account profile',
          tags: ['Auth'],
        }),
      },
      '/api/auth/register': {
        post: {
          operationId: 'register',
          requestBody: requestBody(ref('RegisterRequest'), {
            email: 'ada@example.com',
            name: 'Ada Lovelace',
            password: 'sliding7tiles',
            username: 'ada_l',
          }),
          responses: {
            '201': response('Account created. Also sets an HTTP-only session cookie.', ref('AuthResponse'), {
              accessToken: 'eyJhbGciOiJIUzI1NiIs...',
              user: { ...userExample, emailVerified: false },
            }),
            '400': errorResponse('The request body failed validation.'),
            '409': errorResponse('The email or username already exists.'),
          },
          summary: 'Create an account',
          tags: ['Auth'],
        },
      },
      '/api/auth/resend-verification-email': {
        post: authenticated({
          operationId: 'resendVerificationEmail',
          responses: {
            '201': response('Verification email state.', {
              oneOf: [
                {
                  additionalProperties: false,
                  properties: { alreadyVerified: { const: false } },
                  required: ['alreadyVerified'],
                  type: 'object',
                },
                {
                  additionalProperties: false,
                  properties: {
                    accessToken: { type: 'string' },
                    alreadyVerified: { const: true },
                    user: ref('SessionUser'),
                  },
                  required: ['accessToken', 'alreadyVerified', 'user'],
                  type: 'object',
                },
              ],
            }, { alreadyVerified: false }),
            '401': errorResponse('Authentication is required.'),
            '429': errorResponse('A verification email was sent recently.'),
          },
          summary: 'Resend verification email',
          tags: ['Auth'],
        }),
      },
      '/api/auth/reset-password': {
        post: {
          operationId: 'resetPassword',
          requestBody: requestBody(ref('ResetPasswordRequest'), {
            password: 'n3w-password',
            token: 'reset-token-from-email',
          }),
          responses: {
            '201': response('Password reset.', ref('OkResponse'), { ok: true }),
            '400': errorResponse('The token is invalid, expired, or the password is invalid.'),
          },
          summary: 'Reset password',
          tags: ['Auth'],
        },
      },
      '/api/auth/signup': {
        post: {
          deprecated: true,
          description: 'Legacy alias for POST /api/auth/register.',
          operationId: 'legacyRegister',
          requestBody: requestBody(ref('RegisterRequest'), {
            email: 'ada@example.com',
            name: 'Ada Lovelace',
            password: 'sliding7tiles',
            username: 'ada_l',
          }),
          responses: {
            '201': response('Account created.', ref('AuthResponse')),
            '400': errorResponse('The request body failed validation.'),
            '409': errorResponse('The email or username already exists.'),
          },
          summary: 'Create an account (legacy)',
          tags: ['Auth'],
        },
      },
      '/api/auth/username-availability': {
        get: {
          operationId: 'getUsernameAvailability',
          parameters: [
            {
              example: 'ada_l',
              in: 'query',
              name: 'username',
              required: true,
              schema: {
                maxLength: 20,
                minLength: 3,
                pattern: '^[a-zA-Z0-9_]+$',
                type: 'string',
              },
            },
          ],
          responses: {
            '200': response('Availability result.', ref('UsernameAvailabilityResponse'), {
              available: false,
              suggestions: ['ada_l_2', 'ada_l_3'],
            }),
            '400': errorResponse('The username failed validation.'),
          },
          summary: 'Check username availability',
          tags: ['Auth'],
        },
      },
      '/api/auth/verify-email': {
        post: {
          operationId: 'verifyEmail',
          requestBody: requestBody(ref('VerifyEmailRequest'), {
            token: 'verification-token-from-email',
          }),
          responses: {
            '201': response('Email verified. Also sets an HTTP-only session cookie.', ref('AuthResponse'), {
              accessToken: 'eyJhbGciOiJIUzI1NiIs...',
              user: userExample,
            }),
            '400': errorResponse('The verification link is invalid, expired, or already used.'),
          },
          summary: 'Verify email',
          tags: ['Auth'],
        },
      },
      '/api/game-state': {
        get: authenticated({
          operationId: 'getGameState',
          responses: {
            '200': response('Saved game state.', ref('GameStateResponse'), {
              gameState: null,
              highestReachedLevel: 8,
            }),
            '401': errorResponse('Authentication is required.'),
          },
          summary: 'Get saved game state',
          tags: ['Game State'],
        }),
        put: authenticated({
          operationId: 'saveGameState',
          requestBody: requestBody(ref('SaveGameStateRequest'), {
            board: boardExample,
          }),
          responses: {
            '200': response('Saved game state.', ref('SaveGameStateResponse')),
            '400': errorResponse('The board state failed validation.'),
            '401': errorResponse('Authentication is required.'),
          },
          summary: 'Save game state',
          tags: ['Game State'],
        }),
      },
      '/api/leaderboard': {
        get: {
          operationId: 'listLeaderboard',
          parameters: [
            {
              description: 'Number of scores to return. Values are clamped from 1 to 100.',
              example: 20,
              in: 'query',
              name: 'take',
              required: false,
              schema: { default: 20, maximum: 100, minimum: 1, type: 'integer' },
            },
          ],
          responses: {
            '200': response('Leaderboard scores.', ref('LeaderboardResponse'), {
              generatedAt: '2026-07-22T09:31:05.000Z',
              scores: [{ ...scoreExample, user: { avatarUrl: userExample.avatarUrl, name: userExample.name } }],
            }),
          },
          summary: 'List public leaderboard',
          tags: ['Leaderboard'],
        },
      },
      '/api/leaderboard/completions': {
        post: authenticated({
          operationId: 'recordCompletedLevel',
          requestBody: requestBody(ref('CompletedLevelRequest'), {
            attemptType: 'original',
            board: boardExample,
            puzzleConfig: boardExample,
          }),
          responses: {
            '201': response('Completion recorded.', {
              additionalProperties: false,
              properties: { score: ref('LeaderboardRecord') },
              required: ['score'],
              type: 'object',
            }),
            '400': errorResponse('The board failed validation or replay source is missing.'),
            '401': errorResponse('Authentication is required.'),
          },
          summary: 'Record a completed level',
          tags: ['Leaderboard'],
        }),
      },
      '/api/leaderboard/completions/{completionId}/replay': {
        get: authenticated({
          operationId: 'getReplayBoard',
          parameters: [
            {
              in: 'path',
              name: 'completionId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': response('Replay board.', ref('ReplayBoardResponse')),
            '400': errorResponse('The replay snapshot is unavailable or unreadable.'),
            '401': errorResponse('Authentication is required.'),
            '404': errorResponse('The completed level was not found.'),
          },
          summary: 'Get a replay board',
          tags: ['Leaderboard'],
        }),
      },
      '/api/leaderboard/mine': {
        get: authenticated({
          operationId: 'listMyCompletions',
          parameters: [
            {
              in: 'query',
              name: 'attemptType',
              required: false,
              schema: { enum: ['original', 'replay'], type: 'string' },
            },
            {
              in: 'query',
              name: 'cursor',
              required: false,
              schema: { type: 'string' },
            },
            {
              description: 'Number of completions to return. Values are clamped from 1 to 30.',
              in: 'query',
              name: 'take',
              required: false,
              schema: { default: 12, maximum: 30, minimum: 1, type: 'integer' },
            },
          ],
          responses: {
            '200': response('Your completions.', ref('UserCompletionResponse'), {
              nextCursor: null,
              scores: [{ ...scoreExample, canReplay: true, levelBest: { moves: 64, timeSeconds: 42 }, replayComparison: null }],
              totalCount: 1,
            }),
            '401': errorResponse('Authentication is required.'),
          },
          summary: 'List current user completions',
          tags: ['Leaderboard'],
        }),
      },
      '/api/profile': {
        get: authenticated({
          operationId: 'getProfile',
          responses: {
            '200': response('Current user profile.', ref('ProfileResponse'), {
              gameState: null,
              scores: [scoreExample],
            }),
            '401': errorResponse('Authentication is required.'),
          },
          summary: 'Get profile',
          tags: ['Profile'],
        }),
      },
    },
    servers: [
      {
        description: 'Production API subdomain',
        url: 'https://api.slidingtiles',
      },
      {
        description: 'Local development API',
        url: 'http://localhost:4001',
      },
    ],
    tags: [
      { name: 'Auth' },
      { name: 'Game State' },
      { name: 'Leaderboard' },
      { name: 'Profile' },
      { name: 'Analytics' },
    ],
  };
}

export function registerOpenApiDocs(app: INestApplication) {
  const server = app.getHttpAdapter().getInstance() as {
    get: (path: string, handler: (request: Request, response: Response) => void) => void;
  };

  const spec = buildPublicOpenApiSpec();
  const sendSpec = (_request: Request, response: Response) => response.json(spec);
  server.get(specPath, sendSpec);
  server.get(apiSpecPath, sendSpec);

  docsPaths.forEach((path) => {
    server.get(path, (_request: Request, response: Response) => {
      response.type('html').send(renderDocsHtml());
    });
  });
}

function renderDocsHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sliding Tiles API Docs</title>
    <style>
      :root {
        color-scheme: light;
        --scalar-color-accent: #16825d;
        --scalar-color-1: #17211d;
        --scalar-font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        margin: 0;
        background: #fbfcf8;
      }

      .docs-brand {
        align-items: center;
        background: #12352c;
        border-bottom: 4px solid #f2c94c;
        color: #fbfcf8;
        display: flex;
        gap: 14px;
        min-height: 72px;
        padding: 14px clamp(16px, 4vw, 40px);
      }

      .docs-logo {
        align-items: center;
        background: #fbfcf8;
        border-radius: 8px;
        color: #12352c;
        display: inline-flex;
        font-size: 28px;
        font-weight: 900;
        height: 44px;
        justify-content: center;
        line-height: 1;
        width: 44px;
      }

      .docs-brand h1 {
        font-size: clamp(1.15rem, 2vw, 1.55rem);
        line-height: 1.1;
        margin: 0;
      }

      .docs-brand p {
        color: #d8efe5;
        font-size: 0.95rem;
        margin: 4px 0 0;
      }

      @media (max-width: 560px) {
        .docs-brand {
          align-items: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <header class="docs-brand">
      <span class="docs-logo">15</span>
      <div>
        <h1>Sliding Tiles API</h1>
        <p>Public integration docs for accounts, game state, completions, leaderboards, and analytics.</p>
      </div>
    </header>
    <script id="api-reference" data-url="${specPath}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}
