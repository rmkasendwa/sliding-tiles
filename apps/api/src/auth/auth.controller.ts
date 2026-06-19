import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
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
  registerSchema,
  updateProfileSchema,
  verifyEmailSchema,
  usernameAvailabilityQuerySchema,
} from '../shared/zod';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register')
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.createRegistrationSession(body, response);
  }

  @Post('signup')
  async legacyRegister(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.createRegistrationSession(body, response);
  }

  private async createRegistrationSession(body: unknown, response: Response) {
    const user = await this.authService.register(parseBody(registerSchema, body));
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

  @Post('verify-email')
  async verifyEmail(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token } = parseBody(verifyEmailSchema, body);
    const user = await this.authService.verifyEmail(token);
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

  @Post('resend-verification-email')
  @UseGuards(AuthGuard)
  async resendVerificationEmail(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.resendVerificationEmail(
      request.user!.id,
    );
    if (!result.user) {
      return { alreadyVerified: false };
    }

    const session = await this.sessionService.createSession(result.user);
    this.sessionService.setSessionCookie(
      response,
      session.token,
      session.expiresAt,
    );

    return {
      accessToken: session.token,
      alreadyVerified: true,
      user: result.user,
    };
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

  @Patch('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.updateProfile(
      request.user!.id,
      parseBody(updateProfileSchema, body),
    );
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
