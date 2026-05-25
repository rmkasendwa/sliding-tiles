import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const [gameState, scores] = await Promise.all([
      this.prisma.gameState.findUnique({
        where: { userId },
      }),
      this.prisma.leaderboard.findMany({
        orderBy: [{ completedAt: 'desc' }],
        take: 10,
        where: { userId },
      }),
    ]);

    return {
      gameState,
      scores,
    };
  }
}
