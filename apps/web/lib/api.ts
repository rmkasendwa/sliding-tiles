import 'server-only';

import { BoardState } from './board';
import { getSessionToken } from './session';

type ApiRequestOptions = {
  body?: unknown;
  method?: string;
  token?: string | null;
};

type ApiErrorBody = {
  errors?: Record<string, string[]>;
  message?: string | string[];
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export type ApiUser = {
  avatarUrl: string;
  email: string;
  id: string;
  name: string;
  username: string;
};

export type AuthResponse = {
  accessToken: string;
  user: ApiUser;
};

export type ApiGameState = {
  board: BoardState;
  id: string;
  level: number;
  moves: number;
  startedAt: string;
  updatedAt: string;
  userId: string;
};

export type ApiScore = {
  attemptType: 'original' | 'replay';
  completedAt: string;
  id: string;
  level: number;
  moves: number;
  puzzleConfig?: BoardState | null;
  replayOfId?: string | null;
  timeSeconds: number;
  user?: {
    avatarUrl: string;
    name: string;
  };
  userId: string;
};

function getApiBaseUrl() {
  return (process.env.API_BASE_URL ?? 'http://localhost:4001/api').replace(
    /\/$/,
    '',
  );
}

export async function apiRequest<T>(
  path: string,
  { body, method = 'GET', token }: ApiRequestOptions = {},
): Promise<T> {
  const sessionToken = token === undefined ? await getSessionToken() : token;
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    method,
  });

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorBody | null;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(' ')
      : errorBody?.message;

    throw new ApiRequestError(
      message ?? `API request failed with status ${response.status}.`,
      response.status,
      errorBody ?? undefined,
    );
  }

  return (await response.json()) as T;
}

export function getApiFieldErrors(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error.body?.errors;
  }

  return undefined;
}

export function getApiMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    const message = error.body?.message;
    return Array.isArray(message) ? message.join(' ') : message;
  }

  return undefined;
}
