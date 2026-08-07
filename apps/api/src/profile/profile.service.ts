import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const [gameState, scores, streak] = await Promise.all([
      this.prisma.gameState.findUnique({
        where: { userId },
      }),
      this.prisma.leaderboard.findMany({
        orderBy: [{ completedAt: 'desc' }],
        where: { userId },
      }),
      this.prisma.userStreak.findUnique({
        where: { userId },
      }),
    ]);

    return {
      gameState,
      scores,
      streak: {
        currentStreak: streak?.currentStreak ?? 0,
        lastCompletionLocalDate: streak?.lastCompletionLocalDate ?? null,
        lastCompletionTimeZone: streak?.lastCompletionTimeZone ?? null,
        longestStreak: streak?.longestStreak ?? 0,
        newlyAchievedMilestone: null,
      },
    };
  }
}
