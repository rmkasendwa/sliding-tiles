import type { Request } from 'express';

export type SessionUser = {
  avatarUrl: string;
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  username: string;
};

export type SessionPayload = SessionUser & {
  expiresAt: string;
};

export type AuthenticatedRequest = Request & {
  user?: SessionUser;
};
