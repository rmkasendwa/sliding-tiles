import { Prisma } from '@prisma/client';

export type AchievementCategory = 'completion' | 'speed' | 'leaderboard';

export type AchievementGrant = {
  achievementId: string;
  metadata?: Prisma.InputJsonValue;
};

export type AchievementView = {
  category: AchievementCategory;
  description: string;
  earnedAt: Date;
  icon: string;
  id: string;
  name: string;
};

export type AchievementContext = {
  board: {
    level: number;
    moves: number;
    timeSeconds: number;
    totalTimeSeconds: number | null;
    undoCount?: number;
  };
  completionCount: number;
  highestOriginalLevel: number;
  isOriginalAttempt: boolean;
  leaderboardRank: number | null;
  maxAvailableLevel: number | null;
};

type AchievementDefinition = {
  category: AchievementCategory;
  description: string;
  icon: string;
  id: string;
  isEarned: (context: AchievementContext) => boolean;
  metadata?: (context: AchievementContext) => Prisma.InputJsonValue;
  name: string;
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    category: 'completion',
    description: 'Complete your first signed-in puzzle.',
    icon: 'Trophy',
    id: 'first_puzzle_completed',
    isEarned: ({ completionCount, isOriginalAttempt }) =>
      isOriginalAttempt && completionCount >= 1,
    name: 'First Puzzle Completed',
  },
  {
    category: 'completion',
    description: 'Complete 10 original levels.',
    icon: 'Medal',
    id: 'complete_10_levels',
    isEarned: ({ completionCount, isOriginalAttempt }) =>
      isOriginalAttempt && completionCount >= 10,
    name: 'Complete 10 Levels',
  },
  {
    category: 'completion',
    description: 'Complete 100 original levels.',
    icon: 'Crown',
    id: 'complete_100_levels',
    isEarned: ({ completionCount, isOriginalAttempt }) =>
      isOriginalAttempt && completionCount >= 100,
    name: 'Complete 100 Levels',
  },
  {
    category: 'completion',
    description: 'Complete a level without using undo.',
    icon: 'ShieldCheck',
    id: 'complete_without_undo',
    isEarned: ({ board, isOriginalAttempt }) =>
      isOriginalAttempt && (board.undoCount ?? 0) === 0,
    name: 'Complete a Level Without Undo',
  },
  {
    category: 'speed',
    description: 'Complete a level in under 30 seconds of active time.',
    icon: 'Timer',
    id: 'complete_under_30_seconds',
    isEarned: ({ board, isOriginalAttempt }) =>
      isOriginalAttempt && board.timeSeconds < 30,
    name: 'Complete a Level Under 30 Seconds',
  },
  {
    category: 'leaderboard',
    description: 'Place in the top 10 on the public leaderboard.',
    icon: 'BadgeCheck',
    id: 'reach_top_10_leaderboard',
    isEarned: ({ leaderboardRank }) =>
      leaderboardRank !== null && leaderboardRank <= 10,
    metadata: ({ leaderboardRank }) => ({ leaderboardRank }),
    name: 'Reach Top 10 on Leaderboard',
  },
  {
    category: 'completion',
    description: 'Finish every configured level.',
    icon: 'Sparkles',
    id: 'finish_all_available_levels',
    isEarned: ({ highestOriginalLevel, maxAvailableLevel }) =>
      maxAvailableLevel !== null && highestOriginalLevel >= maxAvailableLevel,
    metadata: ({ maxAvailableLevel }) => ({ maxAvailableLevel }),
    name: 'Finish All Available Levels',
  },
];

const ACHIEVEMENT_DEFINITION_BY_ID = new Map(
  ACHIEVEMENT_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function getAchievementDefinition(achievementId: string) {
  return ACHIEVEMENT_DEFINITION_BY_ID.get(achievementId) ?? null;
}

export function getConfiguredMaxAvailableLevel() {
  const value = Number(process.env.ACHIEVEMENT_MAX_AVAILABLE_LEVEL);

  return Number.isInteger(value) && value > 0 ? value : null;
}

export function evaluateAchievements(
  context: AchievementContext,
): AchievementGrant[] {
  return ACHIEVEMENT_DEFINITIONS.filter((definition) =>
    definition.isEarned(context),
  ).map((definition) => ({
    achievementId: definition.id,
    metadata: definition.metadata?.(context),
  }));
}
