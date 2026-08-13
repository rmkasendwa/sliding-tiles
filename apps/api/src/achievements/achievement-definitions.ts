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

export type AchievementProgress = {
  current: number;
  label: string;
  target: number;
};

export type AchievementProgressView = Omit<AchievementView, 'earnedAt'> & {
  earnedAt: Date | null;
  progress: AchievementProgress | null;
  unlocked: boolean;
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
  bestActiveTimeSeconds?: number | null;
  hasNoUndoCompletion?: boolean;
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
  progress?: (context: AchievementContext) => AchievementProgress | null;
};

function completionProgress(
  current: number,
  target: number,
): AchievementProgress {
  return {
    current: Math.min(current, target),
    label: `${Math.min(current, target)} / ${target} original levels`,
    target,
  };
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    category: 'completion',
    description: 'Complete your first signed-in puzzle.',
    icon: 'Trophy',
    id: 'first_puzzle_completed',
    isEarned: ({ completionCount, isOriginalAttempt }) =>
      isOriginalAttempt && completionCount >= 1,
    name: 'First Puzzle Completed',
    progress: ({ completionCount }) => completionProgress(completionCount, 1),
  },
  {
    category: 'completion',
    description: 'Complete 10 original levels.',
    icon: 'Medal',
    id: 'complete_10_levels',
    isEarned: ({ completionCount, isOriginalAttempt }) =>
      isOriginalAttempt && completionCount >= 10,
    name: 'Complete 10 Levels',
    progress: ({ completionCount }) => completionProgress(completionCount, 10),
  },
  {
    category: 'completion',
    description: 'Complete 100 original levels.',
    icon: 'Crown',
    id: 'complete_100_levels',
    isEarned: ({ completionCount, isOriginalAttempt }) =>
      isOriginalAttempt && completionCount >= 100,
    name: 'Complete 100 Levels',
    progress: ({ completionCount }) => completionProgress(completionCount, 100),
  },
  {
    category: 'completion',
    description: 'Complete a level without using undo.',
    icon: 'ShieldCheck',
    id: 'complete_without_undo',
    isEarned: ({ board, isOriginalAttempt }) =>
      isOriginalAttempt && (board.undoCount ?? 0) === 0,
    name: 'Complete a Level Without Undo',
    progress: ({ hasNoUndoCompletion }) => ({
      current: hasNoUndoCompletion ? 1 : 0,
      label: hasNoUndoCompletion ? 'Clean run complete' : 'Clean run pending',
      target: 1,
    }),
  },
  {
    category: 'speed',
    description: 'Complete a level in under 30 seconds of active time.',
    icon: 'Timer',
    id: 'complete_under_30_seconds',
    isEarned: ({ board, isOriginalAttempt }) =>
      isOriginalAttempt && board.timeSeconds < 30,
    name: 'Complete a Level Under 30 Seconds',
    progress: ({ bestActiveTimeSeconds }) => {
      if (
        bestActiveTimeSeconds === null ||
        bestActiveTimeSeconds === undefined
      ) {
        return {
          current: 0,
          label: 'No timed run yet',
          target: 30,
        };
      }

      return {
        current:
          bestActiveTimeSeconds < 30
            ? 30
            : Math.max(0, 60 - bestActiveTimeSeconds),
        label: `Best ${formatDuration(bestActiveTimeSeconds)} / under 00:30`,
        target: 30,
      };
    },
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
    progress: ({ leaderboardRank }) => ({
      current:
        leaderboardRank === null
          ? 0
          : leaderboardRank <= 10
            ? 10
            : Math.max(0, 20 - leaderboardRank),
      label:
        leaderboardRank === null
          ? 'No ranked run yet'
          : `Best rank #${leaderboardRank} / top 10`,
      target: 10,
    }),
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
    progress: ({ highestOriginalLevel, maxAvailableLevel }) =>
      maxAvailableLevel === null
        ? null
        : completionProgress(highestOriginalLevel, maxAvailableLevel),
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

export function getAchievementProgressViews(
  context: AchievementContext,
  earnedAchievements: Array<{ achievementId: string; earnedAt: Date }>,
): AchievementProgressView[] {
  const earnedById = new Map(
    earnedAchievements.map((achievement) => [
      achievement.achievementId,
      achievement.earnedAt,
    ]),
  );

  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const earnedAt = earnedById.get(definition.id) ?? null;

    return {
      category: definition.category,
      description: definition.description,
      earnedAt,
      icon: definition.icon,
      id: definition.id,
      name: definition.name,
      progress: definition.progress?.(context) ?? null,
      unlocked: earnedAt !== null,
    };
  });
}
