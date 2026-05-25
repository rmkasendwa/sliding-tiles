import type { Request } from 'express';

export type SessionUser = {
  email: string;
  id: string;
  name: string;
};

export type SessionPayload = SessionUser & {
  expiresAt: string;
};

export type AuthenticatedRequest = Request & {
  user?: SessionUser;
};
