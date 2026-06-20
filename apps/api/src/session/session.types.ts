import type { Request } from 'express';

export type SessionUser = {
  avatarUrl: string;
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
  username: string;
};

export type SessionPayload = {
  id?: string;
  sub?: string;
};

export type AuthenticatedRequest = Request & {
  user?: SessionUser;
};
