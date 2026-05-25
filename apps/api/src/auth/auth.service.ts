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
    password,
  }: {
    email: string;
    name: string;
    password: string;
  }): Promise<SessionUser> {
    try {
      return await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          passwordHash: await hashPassword(password),
        },
        select: {
          email: true,
          id: true,
          name: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account with this email already exists.');
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
    };
  }
}
