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
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({
      select: {
        email: true,
        id: true,
        name: true,
        passwordHash: true,
        username: true,
      },
      where: { email: email.toLowerCase() },
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
