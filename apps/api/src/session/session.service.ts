import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from './session.constants';
import { SessionPayload, SessionUser } from './session.types';

@Injectable()
export class SessionService {
  async createSession(user: SessionUser) {
    const { SignJWT } = await import('jose');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
    const token = await new SignJWT({
      ...user,
      expiresAt: expiresAt.toISOString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
      .sign(this.getSessionSecret());

    return { expiresAt, token };
  }

  setSessionCookie(response: Response, token: string, expiresAt: Date) {
    response.cookie(SESSION_COOKIE_NAME, token, {
      expires: expiresAt,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  clearSessionCookie(response: Response) {
    response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  }

  async getSessionFromRequest(request: Request): Promise<SessionUser | null> {
    const token = this.getBearerToken(request) ?? this.getCookieToken(request);
    if (!token) {
      return null;
    }

    return this.verifySessionToken(token);
  }

  async verifySessionToken(token: string): Promise<SessionUser | null> {
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(token, this.getSessionSecret());
      const session = payload as SessionPayload;

      return {
        email: session.email,
        id: session.id,
        name: session.name,
        username: session.username ?? session.name,
      };
    } catch {
      return null;
    }
  }

  private getBearerToken(request: Request) {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    return authorization.slice('Bearer '.length).trim();
  }

  private getCookieToken(request: Request) {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    return cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.slice(SESSION_COOKIE_NAME.length + 1);
  }

  private getSessionSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('SESSION_SECRET must be set to at least 32 characters.');
    }

    return new TextEncoder().encode(secret);
  }
}
