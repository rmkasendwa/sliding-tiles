import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionUser } from '../session/session.types';
import { hashPassword, verifyPassword } from './password';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
    try {
      return await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          username: username.toLowerCase(),
          passwordHash: await hashPassword(password),
        },
        select: {
          email: true,
          id: true,
          name: true,
          username: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target
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
              email: ['An account with this email already exists.'],
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

    return {
      email: user.email,
      id: user.id,
      name: user.name,
      username: user.username,
    };
  }
}
