import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  AchievementContext,
  AchievementView,
  evaluateAchievements,
  getAchievementDefinition,
} from './achievement-definitions';

@Injectable()
export class AchievementsService {
  async awardEarnedAchievements(
    tx: Prisma.TransactionClient,
    userId: string,
    context: AchievementContext,
  ): Promise<AchievementView[]> {
    const earnedCandidates = evaluateAchievements(context);
    if (earnedCandidates.length === 0) {
      return [];
    }

    const existing = await tx.userAchievement.findMany({
      select: { achievementId: true },
      where: {
        achievementId: {
          in: earnedCandidates.map((candidate) => candidate.achievementId),
        },
        userId,
      },
    });
    const existingIds = new Set(
      existing.map((achievement) => achievement.achievementId),
    );
    const newCandidates = earnedCandidates.filter(
      (candidate) => !existingIds.has(candidate.achievementId),
    );
    if (newCandidates.length === 0) {
      return [];
    }

    const created = await Promise.all(
      newCandidates.map((candidate) =>
        tx.userAchievement.create({
          data: {
            achievementId: candidate.achievementId,
            metadata: candidate.metadata,
            userId,
          },
        }),
      ),
    );

    return created.flatMap((achievement) => {
      const definition = getAchievementDefinition(achievement.achievementId);
      if (!definition) {
        return [];
      }

      return {
        category: definition.category,
        description: definition.description,
        earnedAt: achievement.earnedAt,
        icon: definition.icon,
        id: definition.id,
        name: definition.name,
      };
    });
  }

  toAchievementViews(
    achievements: Array<{ achievementId: string; earnedAt: Date }>,
  ): AchievementView[] {
    return achievements.flatMap((achievement) => {
      const definition = getAchievementDefinition(achievement.achievementId);
      if (!definition) {
        return [];
      }

      return {
        category: definition.category,
        description: definition.description,
        earnedAt: achievement.earnedAt,
        icon: definition.icon,
        id: definition.id,
        name: definition.name,
      };
    });
  }
}
