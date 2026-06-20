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
  emailVerified: boolean;
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
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

export type ApiRun = Omit<ApiScore, 'puzzleConfig'> & {
  canReplay: boolean;
  levelBest: {
    moves: number;
    timeSeconds: number;
  } | null;
  replayComparison: string | null;
};

export type ApiRunPage = {
  nextCursor: string | null;
  scores: ApiRun[];
  totalCount: number;
};

export type AdminUser = {
  createdAt: string;
  email: string;
  id: string;
  name: string;
  promotedAt: string | null;
  promotedBy: {
    email: string;
    id: string;
    name: string;
    username: string;
  } | null;
  role: 'USER' | 'ADMIN';
  username: string;
};

export type AdminUsersResponse = {
  totalCount: number;
  users: AdminUser[];
};

export type AdminAnalyticsEventName =
  | 'game_started'
  | 'game_completed'
  | 'game_abandoned'
  | 'level_unlocked'
  | 'invalid_move'
  | 'tile_dragged'
  | 'reset_clicked'
  | 'auto_play_started'
  | 'auto_play_completed'
  | 'peek_image_clicked'
  | 'leaderboard_opened'
  | 'signup_prompt_shown'
  | 'signup_clicked';

export type AdminAnalyticsEvent = {
  eventName: AdminAnalyticsEventName;
  id: string;
  level: number | null;
  moveCount: number | null;
  occurredAt: string;
  puzzleSize: string | null;
  screenHeight: number | null;
  screenWidth: number | null;
  sessionId: string;
  timerValueMs: number | null;
};

export type AdminAnalyticsResponse = {
  eventCounts: Array<{
    count: number;
    eventName: AdminAnalyticsEventName;
    trend: number[];
  }>;
  eventNames: AdminAnalyticsEventName[];
  metrics: {
    averageActivePlayTimeMs: number | null;
    averageMovesPerCompletedGame: number | null;
    averageTotalPlayTimeMs: number | null;
    autoPlayUsage: number;
    completionRate: number;
    gamesCompleted: number;
    gamesStarted: number;
    leaderboardViews: number;
    peekImageUsage: number;
    replayUsage: number;
    signupClicks: number;
    totalAnonymousSessions: number;
  };
  nextCursor: string | null;
  recentEvents: AdminAnalyticsEvent[];
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
