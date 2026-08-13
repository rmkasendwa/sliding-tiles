import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';
import {
  getAchievementProgressViews,
  getConfiguredMaxAvailableLevel,
} from '../achievements/achievement-definitions';
import { AchievementsService } from '../achievements/achievements.service';
import { PrismaService } from '../prisma/prisma.service';
import { boardStateSchema } from '../shared/zod';

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

    const originalScores = scores.filter(
      (score) => score.attemptType === 'original',
    );
    const completionCount = originalScores.length;
    const highestOriginalLevel = originalScores.reduce(
      (maxLevel, score) => Math.max(maxLevel, score.level),
      0,
    );
    const bestActiveTimeSeconds =
      scores.length > 0
        ? Math.min(...scores.map((score) => score.timeSeconds))
        : null;
    const hasNoUndoCompletion = originalScores.some((score) => {
      const parsedBoard = boardStateSchema.safeParse(score.puzzleConfig);

      return parsedBoard.success && (parsedBoard.data.undoCount ?? 0) === 0;
    });
    const bestRankedScore = this.getBestRankedScore(scores);
    const leaderboardRank = bestRankedScore
      ? await this.getLeaderboardRankForScore(bestRankedScore)
      : null;

    return {
      achievements: this.achievementsService.toAchievementViews(achievements),
      achievementProgress: getAchievementProgressViews(
        {
          board: {
            level: highestOriginalLevel || 1,
            moves: 0,
            timeSeconds: bestActiveTimeSeconds ?? Number.MAX_SAFE_INTEGER,
            totalTimeSeconds: null,
          },
          bestActiveTimeSeconds,
          completionCount,
          hasNoUndoCompletion,
          highestOriginalLevel,
          isOriginalAttempt: true,
          leaderboardRank,
          maxAvailableLevel: getConfiguredMaxAvailableLevel(),
        },
        achievements,
      ),
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

  private getBestRankedScore(
    scores: Array<{
      completedAt: Date;
      id: string;
      level: number;
      moves: number;
      timeSeconds: number;
    }>,
  ) {
    return (
      [...scores].sort((a, b) => {
        if (a.level !== b.level) {
          return b.level - a.level;
        }
        if (a.timeSeconds !== b.timeSeconds) {
          return a.timeSeconds - b.timeSeconds;
        }
        if (a.moves !== b.moves) {
          return a.moves - b.moves;
        }
        const completedAtDelta =
          a.completedAt.getTime() - b.completedAt.getTime();
        if (completedAtDelta !== 0) {
          return completedAtDelta;
        }

        return a.id.localeCompare(b.id);
      })[0] ?? null
    );
  }

  private async getLeaderboardRankForScore(score: {
    completedAt: Date;
    id: string;
    level: number;
    moves: number;
    timeSeconds: number;
  }) {
    const betterScoreCount = await this.prisma.leaderboard.count({
      where: {
        OR: [
          { level: { gt: score.level } },
          {
            level: score.level,
            timeSeconds: { lt: score.timeSeconds },
          },
          {
            level: score.level,
            timeSeconds: score.timeSeconds,
            moves: { lt: score.moves },
          },
          {
            completedAt: { lt: score.completedAt },
            level: score.level,
            moves: score.moves,
            timeSeconds: score.timeSeconds,
          },
          {
            completedAt: score.completedAt,
            id: { lt: score.id },
            level: score.level,
            moves: score.moves,
            timeSeconds: score.timeSeconds,
          },
        ],
      } satisfies Prisma.LeaderboardWhereInput,
    });

    return betterScoreCount + 1;
  }
}
