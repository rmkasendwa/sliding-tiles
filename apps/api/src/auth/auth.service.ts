import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

import { Prisma } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionUser } from '../session/session.types';
import { getGravatarUrl } from '../shared/gravatar';
import { hashPassword, verifyPassword } from './password';

const EMAIL_ALREADY_EXISTS_MESSAGE =
  'An account with this email address already exists.';
const EMAIL_VERIFICATION_TOKEN_DURATION_MS = 1000 * 60 * 60 * 24;
const VERIFICATION_EMAIL_COOLDOWN_MS = 1000 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private toSessionUser(user: {
    email: string;
    emailVerifiedAt: Date | null;
    id: string;
    name: string;
    username: string;
  }): SessionUser {
    return {
      avatarUrl: getGravatarUrl(user.email),
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      id: user.id,
      name: user.name,
      username: user.username,
    };
  }

  async changePassword(
    userId: string,
    {
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      select: {
        id: true,
        passwordHash: true,
      },
      where: { id: userId },
    });

    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new BadRequestException({
        errors: {
          currentPassword: ['Current password is incorrect.'],
        },
        message: 'Request validation failed.',
      });
    }

    if (await verifyPassword(newPassword, user.passwordHash)) {
      throw new BadRequestException({
        errors: {
          newPassword: [
            'New password must be different from current password.',
          ],
        },
        message: 'Request validation failed.',
      });
    }

    await this.prisma.user.update({
      data: {
        passwordHash: await hashPassword(newPassword),
        resetPasswordTokenExpiresAt: null,
        resetPasswordTokenHash: null,
      },
      where: { id: userId },
    });
  }

  async forgotPassword({ identifier }: { identifier: string }) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      select: {
        email: true,
        id: true,
      },
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier },
        ],
      },
    });

    if (!user) {
      return;
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = this.hashResetToken(resetToken);
    const resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.user.update({
      data: {
        resetPasswordTokenExpiresAt: resetTokenExpiresAt,
        resetPasswordTokenHash: resetTokenHash,
      },
      where: { id: user.id },
    });

    const webBaseUrl = (process.env.WEB_BASE_URL ?? 'http://localhost:3000')
      .trim()
      .replace(/\/$/, '');
    const resetLink = `${webBaseUrl}/reset-password?token=${resetToken}`;

    console.info(`[auth] Password reset link for ${user.email}: ${resetLink}`);
  }

  async resetPassword({
    password,
    token,
  }: {
    password: string;
    token: string;
  }) {
    const now = new Date();
    const resetTokenHash = this.hashResetToken(token);

    const user = await this.prisma.user.findFirst({
      select: { id: true },
      where: {
        resetPasswordTokenExpiresAt: {
          gt: now,
        },
        resetPasswordTokenHash: resetTokenHash,
      },
    });

    if (!user) {
      throw new BadRequestException({
        errors: {
          token: ['This password reset link is invalid or expired.'],
        },
        message: 'Request validation failed.',
      });
    }

    await this.prisma.user.update({
      data: {
        passwordHash: await hashPassword(password),
        resetPasswordTokenExpiresAt: null,
        resetPasswordTokenHash: null,
      },
      where: { id: user.id },
    });
  }

  async getUsernameAvailability(username: string) {
    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      select: { id: true },
      where: { username: normalizedUsername },
    });

    if (!existingUser) {
      return {
        available: true,
        suggestions: [] as string[],
      };
    }

    const suggestions =
      await this.generateUsernameSuggestions(normalizedUsername);

    return {
      available: false,
      suggestions,
    };
  }

  async updateProfile(
    userId: string,
    {
      name,
      username,
    }: {
      name: string;
      username: string;
    },
  ): Promise<SessionUser> {
    try {
      const user = await this.prisma.user.update({
        data: {
          name,
          username: username.toLowerCase(),
        },
        select: {
          email: true,
          emailVerifiedAt: true,
          id: true,
          name: true,
          username: true,
        },
        where: { id: userId },
      });

      return this.toSessionUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          errors: {
            username: ['This username is already taken.'],
          },
          message: 'Request validation failed.',
        });
      }

      throw error;
    }
  }

  private async generateUsernameSuggestions(username: string) {
    const sanitizedBase = this.sanitizeUsernameBase(username);
    const existingUsers = await this.prisma.user.findMany({
      select: { username: true },
      where: {
        username: {
          startsWith: sanitizedBase,
        },
      },
    });

    const takenUsernames = new Set(
      existingUsers.map((user) => user.username.toLowerCase()),
    );
    const suggestions: string[] = [];
    let suffix = 2;

    while (suggestions.length < 4 && suffix < 10000) {
      const suffixText = `_${suffix}`;
      const baseLength = Math.max(1, 20 - suffixText.length);
      const base = sanitizedBase.slice(0, baseLength).replace(/_+$/g, '');
      const candidate = `${base || 'user'}${suffixText}`;

      if (!takenUsernames.has(candidate)) {
        takenUsernames.add(candidate);
        suggestions.push(candidate);
      }

      suffix += 1;
    }

    return suggestions;
  }

  private sanitizeUsernameBase(username: string) {
    const sanitized = username
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const bounded = sanitized.slice(0, 20);
    if (bounded.length >= 3) {
      return bounded;
    }

    return 'player';
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashEmailVerificationToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getWebBaseUrl() {
    return (process.env.WEB_BASE_URL ?? 'http://localhost:3000')
      .trim()
      .replace(/\/$/, '');
  }

  private async issueVerificationEmail(
    user: {
      email: string;
      id: string;
      name: string;
    },
    { enforceCooldown = true }: { enforceCooldown?: boolean } = {},
  ) {
    const now = new Date();
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash =
      this.hashEmailVerificationToken(verificationToken);
    const verificationTokenExpiresAt = new Date(
      now.getTime() + EMAIL_VERIFICATION_TOKEN_DURATION_MS,
    );

    if (enforceCooldown) {
      const cooldownCutoff = new Date(
        now.getTime() - VERIFICATION_EMAIL_COOLDOWN_MS,
      );
      const updated = await this.prisma.user.updateMany({
        data: {
          emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
          emailVerificationTokenHash: verificationTokenHash,
          verificationEmailSentAt: now,
        },
        where: {
          emailVerifiedAt: null,
          id: user.id,
          OR: [
            { verificationEmailSentAt: null },
            { verificationEmailSentAt: { lte: cooldownCutoff } },
          ],
        },
      });

      if (updated.count === 0) {
        throw new HttpException(
          'A verification email was sent recently. Please wait a minute before trying again.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      await this.prisma.user.update({
        data: {
          emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
          emailVerificationTokenHash: verificationTokenHash,
          verificationEmailSentAt: now,
        },
        where: { id: user.id },
      });
    }

    const verificationLink = `${this.getWebBaseUrl()}/verify-email?token=${verificationToken}`;

    try {
      await this.emailService.sendEmailVerification({
        email: user.email,
        name: user.name,
        verificationLink,
      });
    } catch (error) {
      await this.prisma.user.updateMany({
        data: { verificationEmailSentAt: null },
        where: {
          emailVerificationTokenHash: verificationTokenHash,
          id: user.id,
        },
      });
      throw error;
    }
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      select: {
        email: true,
        emailVerifiedAt: true,
        id: true,
        name: true,
        username: true,
      },
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Authentication is required.');
    }

    if (user.emailVerifiedAt) {
      return {
        alreadyVerified: true,
        user: this.toSessionUser(user),
      };
    }

    await this.issueVerificationEmail(user);
    return { alreadyVerified: false, user: null };
  }

  async verifyEmail(token: string): Promise<SessionUser> {
    const now = new Date();
    const verificationTokenHash =
      this.hashEmailVerificationToken(token.trim());
    const user = await this.prisma.user.findFirst({
      select: {
        email: true,
        emailVerifiedAt: true,
        id: true,
        name: true,
        username: true,
      },
      where: {
        emailVerificationTokenExpiresAt: { gt: now },
        emailVerificationTokenHash: verificationTokenHash,
        emailVerifiedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'This verification link is invalid, expired, or has already been used.',
      );
    }

    const updated = await this.prisma.user.updateMany({
      data: {
        emailVerificationTokenExpiresAt: null,
        emailVerificationTokenHash: null,
        emailVerifiedAt: now,
      },
      where: {
        emailVerificationTokenExpiresAt: { gt: now },
        emailVerificationTokenHash: verificationTokenHash,
        emailVerifiedAt: null,
        id: user.id,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        'This verification link is invalid, expired, or has already been used.',
      );
    }

    return this.toSessionUser({
      ...user,
      emailVerifiedAt: now,
    });
  }

  async signup({
    email,
    name,
    username,
    password,
  }: {
    email: string;
    name: string;
    username: string;
    password: string;
  }): Promise<SessionUser> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedUsername = username.toLowerCase();
    const existingEmailUser = await this.prisma.user.findFirst({
      select: { id: true },
      where: { email: normalizedEmail },
    });

    if (existingEmailUser) {
      throw new ConflictException({
        errors: {
          email: [EMAIL_ALREADY_EXISTS_MESSAGE],
        },
        message: 'Request validation failed.',
      });
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          username: normalizedUsername,
          passwordHash: await hashPassword(password),
        },
        select: {
          email: true,
          emailVerifiedAt: true,
          id: true,
          name: true,
          username: true,
        },
      });

      try {
        await this.issueVerificationEmail(user, { enforceCooldown: false });
      } catch (error) {
        console.error(
          `[auth] Could not send signup verification email to ${user.email}.`,
          error,
        );
      }

      return this.toSessionUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target
          : typeof error.meta?.target === 'string'
            ? [error.meta.target]
          : [];
        const hasEmailConflict = target.some((value) =>
          String(value).toLowerCase().includes('email'),
        );
        const hasUsernameConflict = target.some((value) =>
          String(value).toLowerCase().includes('username'),
        );

        if (hasEmailConflict) {
          throw new ConflictException({
            errors: {
              email: [EMAIL_ALREADY_EXISTS_MESSAGE],
            },
            message: 'Request validation failed.',
          });
        }

        if (hasUsernameConflict) {
          throw new ConflictException({
            errors: {
              username: ['This username is already taken.'],
            },
            message: 'Request validation failed.',
          });
        }

        throw new ConflictException(
          'An account with these details already exists.',
        );
      }

      throw error;
    }
  }

  async login({
    identifier,
    password,
  }: {
    identifier: string;
    password: string;
  }): Promise<SessionUser> {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      select: {
        email: true,
        emailVerifiedAt: true,
        id: true,
        name: true,
        passwordHash: true,
        username: true,
      },
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier },
        ],
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }

    return this.toSessionUser(user);
  }
}
