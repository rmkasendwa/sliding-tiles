import { Injectable } from '@nestjs/common';

import { AchievementsService } from '../achievements/achievements.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly prisma: PrismaService,
  ) {}

  async getForUser(userId: string) {
    const [achievements, gameState, scores, streak] = await Promise.all([
      this.prisma.userAchievement.findMany({
        orderBy: [{ earnedAt: 'desc' }],
        select: {
          achievementId: true,
          earnedAt: true,
        },
        where: { userId },
      }),
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
      achievements: this.achievementsService.toAchievementViews(achievements),
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
