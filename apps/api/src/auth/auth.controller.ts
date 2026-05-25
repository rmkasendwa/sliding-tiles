import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { AuthGuard } from '../session/auth.guard';
import { SessionService } from '../session/session.service';
import type { AuthenticatedRequest } from '../session/session.types';
import { loginSchema, parseBody, signupSchema } from '../shared/zod';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('signup')
  async signup(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.signup(parseBody(signupSchema, body));
    const session = await this.sessionService.createSession(user);
    this.sessionService.setSessionCookie(response, session.token, session.expiresAt);

    return {
      accessToken: session.token,
      user,
    };
  }

  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.login(parseBody(loginSchema, body));
    const session = await this.sessionService.createSession(user);
    this.sessionService.setSessionCookie(response, session.token, session.expiresAt);

    return {
      accessToken: session.token,
      user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    this.sessionService.clearSessionCookie(response);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }
}
