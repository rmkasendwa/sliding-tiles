import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthGuard } from '../session/auth.guard';
import { SessionService } from '../session/session.service';
import type { AuthenticatedRequest } from '../session/session.types';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  parseBody,
  resetPasswordSchema,
  signupSchema,
  usernameAvailabilityQuerySchema,
} from '../shared/zod';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('signup')
  async signup(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.signup(parseBody(signupSchema, body));
    const session = await this.sessionService.createSession(user);
    this.sessionService.setSessionCookie(
      response,
      session.token,
      session.expiresAt,
    );

    return {
      accessToken: session.token,
      user,
    };
  }

  @Post('login')
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.login(parseBody(loginSchema, body));
    const session = await this.sessionService.createSession(user);
    this.sessionService.setSessionCookie(
      response,
      session.token,
      session.expiresAt,
    );

    return {
      accessToken: session.token,
      user,
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: unknown) {
    await this.authService.forgotPassword(
      parseBody(forgotPasswordSchema, body),
    );
    return { ok: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: unknown) {
    await this.authService.resetPassword(parseBody(resetPasswordSchema, body));
    return { ok: true };
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const { currentPassword, newPassword } = parseBody(
      changePasswordSchema,
      body,
    );

    await this.authService.changePassword(request.user!.id, {
      currentPassword,
      newPassword,
    });
    return { ok: true };
  }

  @Get('username-availability')
  async usernameAvailability(@Query() query: unknown) {
    const result = usernameAvailabilityQuerySchema.safeParse(query);
    if (!result.success) {
      throw new BadRequestException({
        errors: result.error.flatten().fieldErrors,
        message: 'Request validation failed.',
      });
    }

    return this.authService.getUsernameAvailability(result.data.username);
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
