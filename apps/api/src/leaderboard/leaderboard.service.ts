import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { PrismaService } from '../prisma/prisma.service';
import { getGravatarUrl } from '../shared/gravatar';
import { boardStateSchema } from '../shared/zod';

type BoardStateDto = z.infer<typeof boardStateSchema>;

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async list(take = 20) {
    const scores = await this.prisma.leaderboard.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: [{ level: 'desc' }, { timeSeconds: 'asc' }, { moves: 'asc' }],
      take,
    });

    return {
      scores: scores.map(({ user, ...score }) => ({
        ...score,
        user: {
          avatarUrl: getGravatarUrl(user.email),
          name: user.name,
        },
      })),
    };
  }

  async recordCompletedLevel(userId: string, board: BoardStateDto) {
    const elapsedMs =
      board.elapsedTimeMs > 0
        ? board.elapsedTimeMs
        : Math.max(0, Date.now() - new Date(board.startedAt).getTime());
    const timeSeconds = Math.max(1, Math.round(elapsedMs / 1000));
    const score = await this.prisma.leaderboard.create({
      data: {
        level: board.level,
        moves: board.moves,
        timeSeconds,
        userId,
      },
    });

    return { score };
  }
}
