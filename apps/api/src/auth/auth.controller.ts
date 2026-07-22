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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';

import {
  AuthenticatedApi,
  ref,
  userExample,
} from '../openapi/public-openapi.metadata';
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
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Create an account' })
  @ApiBody({
    examples: {
      common: {
        value: {
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          password: 'sliding7tiles',
          username: 'ada_l',
        },
      },
    },
    schema: ref('RegisterRequest'),
  })
  @ApiCreatedResponse({
    description: 'Account created. Also sets an HTTP-only session cookie.',
    schema: ref('AuthResponse'),
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
    schema: ref('ErrorResponse'),
  })
  @ApiConflictResponse({
    description: 'The email or username already exists.',
    schema: ref('ErrorResponse'),
  })
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.createRegistrationSession(body, response);
  }

  @Post('signup')
  @ApiOperation({
    deprecated: true,
    description: 'Legacy alias for POST /api/auth/register.',
    summary: 'Create an account (legacy)',
  })
  @ApiBody({
    examples: {
      common: {
        value: {
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          password: 'sliding7tiles',
          username: 'ada_l',
        },
      },
    },
    schema: ref('RegisterRequest'),
  })
  @ApiCreatedResponse({
    description: 'Account created. Also sets an HTTP-only session cookie.',
    schema: ref('AuthResponse'),
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
    schema: ref('ErrorResponse'),
  })
  @ApiConflictResponse({
    description: 'The email or username already exists.',
    schema: ref('ErrorResponse'),
  })
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
  @ApiOperation({ summary: 'Sign in' })
  @ApiBody({
    examples: {
      common: {
        value: {
          identifier: 'ada@example.com',
          password: 'correct-horse-7',
        },
      },
    },
    schema: ref('LoginRequest'),
  })
  @ApiCreatedResponse({
    description: 'Signed in. Also sets an HTTP-only session cookie.',
    schema: {
      ...ref('AuthResponse'),
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        user: userExample,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
    schema: ref('ErrorResponse'),
  })
  @ApiUnauthorizedResponse({
    description: 'The credentials are incorrect.',
    schema: ref('ErrorResponse'),
  })
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
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({
    examples: {
      common: { value: { identifier: 'ada@example.com' } },
    },
    schema: ref('ForgotPasswordRequest'),
  })
  @ApiCreatedResponse({
    description: 'Request accepted even if no account exists.',
    schema: { ...ref('OkResponse'), example: { ok: true } },
  })
  @ApiBadRequestResponse({
    description: 'The identifier is missing.',
    schema: ref('ErrorResponse'),
  })
  async forgotPassword(@Body() body: unknown) {
    await this.authService.forgotPassword(
      parseBody(forgotPasswordSchema, body),
    );
    return { ok: true };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({
    examples: {
      common: {
        value: {
          password: 'n3w-password',
          token: 'reset-token-from-email',
        },
      },
    },
    schema: ref('ResetPasswordRequest'),
  })
  @ApiCreatedResponse({
    description: 'Password reset.',
    schema: { ...ref('OkResponse'), example: { ok: true } },
  })
  @ApiBadRequestResponse({
    description: 'The token is invalid, expired, or the password is invalid.',
    schema: ref('ErrorResponse'),
  })
  async resetPassword(@Body() body: unknown) {
    await this.authService.resetPassword(parseBody(resetPasswordSchema, body));
    return { ok: true };
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email' })
  @ApiBody({
    examples: {
      common: { value: { token: 'verification-token-from-email' } },
    },
    schema: ref('VerifyEmailRequest'),
  })
  @ApiCreatedResponse({
    description: 'Email verified. Also sets an HTTP-only session cookie.',
    schema: ref('AuthResponse'),
  })
  @ApiBadRequestResponse({
    description: 'The verification link is invalid, expired, or already used.',
    schema: ref('ErrorResponse'),
  })
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
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiCreatedResponse({
    description: 'Verification email state.',
    schema: {
      oneOf: [
        {
          additionalProperties: false,
          properties: { alreadyVerified: { enum: [false], type: 'boolean' } },
          required: ['alreadyVerified'],
          type: 'object',
        },
        {
          additionalProperties: false,
          properties: {
            accessToken: { type: 'string' },
            alreadyVerified: { enum: [true], type: 'boolean' },
            user: ref('SessionUser'),
          },
          required: ['accessToken', 'alreadyVerified', 'user'],
          type: 'object',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  @ApiTooManyRequestsResponse({
    description: 'A verification email was sent recently.',
    schema: ref('ErrorResponse'),
  })
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
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Change password' })
  @ApiBody({
    examples: {
      common: {
        value: {
          confirmPassword: 'n3w-password',
          currentPassword: 'old-password',
          newPassword: 'n3w-password',
        },
      },
    },
    schema: ref('ChangePasswordRequest'),
  })
  @ApiCreatedResponse({
    description: 'Password changed.',
    schema: { ...ref('OkResponse'), example: { ok: true } },
  })
  @ApiBadRequestResponse({
    description: 'The current password is wrong or the request is invalid.',
    schema: ref('ErrorResponse'),
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
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
  @ApiOperation({ summary: 'Check username availability' })
  @ApiQuery({
    example: 'ada_l',
    name: 'username',
    required: true,
    schema: {
      maxLength: 20,
      minLength: 3,
      pattern: '^[a-zA-Z0-9_]+$',
      type: 'string',
    },
  })
  @ApiOkResponse({
    description: 'Availability result.',
    schema: {
      ...ref('UsernameAvailabilityResponse'),
      example: {
        available: false,
        suggestions: ['ada_l_2', 'ada_l_3'],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The username failed validation.',
    schema: ref('ErrorResponse'),
  })
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
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Update account profile' })
  @ApiBody({
    examples: {
      common: {
        value: {
          name: 'Ada Lovelace',
          username: 'ada_l',
        },
      },
    },
    schema: ref('UpdateProfileRequest'),
  })
  @ApiOkResponse({
    description: 'Profile updated. Also refreshes the session cookie.',
    schema: ref('AuthResponse'),
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
    schema: ref('ErrorResponse'),
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  @ApiConflictResponse({
    description: 'The username is already taken.',
    schema: ref('ErrorResponse'),
  })
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
  @ApiOperation({ summary: 'Sign out' })
  @ApiCreatedResponse({
    description: 'Session cookie cleared.',
    schema: { ...ref('OkResponse'), example: { ok: true } },
  })
  logout(@Res({ passthrough: true }) response: Response) {
    this.sessionService.clearSessionCookie(response);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({
    description: 'Current user.',
    schema: {
      additionalProperties: false,
      example: { user: userExample },
      properties: { user: ref('SessionUser') },
      required: ['user'],
      type: 'object',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }
}
