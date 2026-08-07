import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getGravatarUrl } from '../shared/gravatar';
import {
  boardStateSchema,
  completedDailyChallengeSchema,
  completedLevelSchema,
} from '../shared/zod';

type BoardStateDto = z.infer<typeof boardStateSchema>;
type CompletedDailyChallengeDto = z.infer<
  typeof completedDailyChallengeSchema
>;
type CompletedLevelDto = z.infer<typeof completedLevelSchema>;

const STREAK_MILESTONES = [7, 30, 100, 365] as const;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDateKeyDelta(previousDateKey: string, nextDateKey: string) {
  const previousTime = Date.parse(`${previousDateKey}T00:00:00.000Z`);
  const nextTime = Date.parse(`${nextDateKey}T00:00:00.000Z`);

  if (!Number.isFinite(previousTime) || !Number.isFinite(nextTime)) {
    return 0;
  }

  return Math.round((nextTime - previousTime) / ONE_DAY_MS);
}

export function calculateStreakUpdate({
  celebratedMilestones,
  currentStreak,
  lastCompletionLocalDate,
  localDate,
  longestStreak,
}: {
  celebratedMilestones: number[];
  currentStreak: number;
  lastCompletionLocalDate: string | null;
  localDate: string;
  longestStreak: number;
}) {
  const dayDelta = lastCompletionLocalDate
    ? getDateKeyDelta(lastCompletionLocalDate, localDate)
    : null;
  const nextCurrentStreak =
    dayDelta === 0
      ? currentStreak
      : dayDelta === 1
        ? currentStreak + 1
        : 1;
  const nextLongestStreak = Math.max(longestStreak, nextCurrentStreak);
  const nextMilestone = STREAK_MILESTONES.find(
    (milestone) =>
      nextCurrentStreak >= milestone &&
      !celebratedMilestones.includes(milestone),
  );
  const newlyAchievedMilestone =
    nextMilestone &&
    dayDelta !== 0
      ? nextMilestone
      : null;
  const nextCelebratedMilestones = newlyAchievedMilestone
    ? [...celebratedMilestones, newlyAchievedMilestone].sort((a, b) => a - b)
    : celebratedMilestones;

  return {
    celebratedMilestones: nextCelebratedMilestones,
    currentStreak: nextCurrentStreak,
    longestStreak: nextLongestStreak,
    newlyAchievedMilestone,
  };
}

export function calculateCompletionTiming(board: BoardStateDto, now = Date.now()) {
  const fallbackTotalElapsedMs = Math.max(
    0,
    now - new Date(board.startedAt).getTime(),
  );
  const activeElapsedMs =
    board.elapsedTimeMs > 0 ? board.elapsedTimeMs : fallbackTotalElapsedMs;
  const totalElapsedMs = Math.max(
    activeElapsedMs,
    board.totalElapsedTimeMs ?? activeElapsedMs + (board.pausedDurationMs ?? 0),
  );
  const pausedDurationMs = Math.max(
    board.pausedDurationMs ?? 0,
    totalElapsedMs - activeElapsedMs,
  );

  return {
    pausedDurationSeconds: Math.round(pausedDurationMs / 1000),
    timeSeconds: Math.max(1, Math.round(activeElapsedMs / 1000)),
    totalTimeSeconds: Math.max(1, Math.round(totalElapsedMs / 1000)),
  };
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async updateStreakForCompletion(
    tx: Prisma.TransactionClient,
    userId: string,
    completion?: { localDate: string; timeZone?: string },
  ) {
    const localDate = completion?.localDate ?? getUtcDateKey();
    const timeZone = completion?.timeZone ?? null;
    const existing = await tx.userStreak.findUnique({ where: { userId } });
    const streakUpdate = calculateStreakUpdate({
      celebratedMilestones: existing?.celebratedMilestones ?? [],
      currentStreak: existing?.currentStreak ?? 0,
      lastCompletionLocalDate: existing?.lastCompletionLocalDate ?? null,
      localDate,
      longestStreak: existing?.longestStreak ?? 0,
    });

    const streak = await tx.userStreak.upsert({
      create: {
        celebratedMilestones: streakUpdate.celebratedMilestones,
        currentStreak: streakUpdate.currentStreak,
        lastCompletionLocalDate: localDate,
        lastCompletionTimeZone: timeZone,
        longestStreak: streakUpdate.longestStreak,
        userId,
      },
      update: {
        celebratedMilestones: streakUpdate.celebratedMilestones,
        currentStreak: streakUpdate.currentStreak,
        lastCompletionLocalDate: localDate,
        lastCompletionTimeZone: timeZone,
        longestStreak: streakUpdate.longestStreak,
      },
      where: { userId },
    });

    return {
      currentStreak: streak.currentStreak,
      lastCompletionLocalDate: streak.lastCompletionLocalDate,
      lastCompletionTimeZone: streak.lastCompletionTimeZone,
      longestStreak: streak.longestStreak,
      newlyAchievedMilestone: streakUpdate.newlyAchievedMilestone,
    };
  }

  async listForUser(
    userId: string,
    {
      attemptType,
      cursor,
      take = 12,
    }: {
      attemptType?: 'original' | 'replay';
      cursor?: string;
      take?: number;
    },
  ) {
    const [scores, totalCount] = await Promise.all([
      this.prisma.leaderboard.findMany({
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
        select: {
          attemptType: true,
          completedAt: true,
          id: true,
          level: true,
          moves: true,
          pausedDurationSeconds: true,
          puzzleConfig: true,
          replayOfId: true,
          timeSeconds: true,
          totalTimeSeconds: true,
          userId: true,
        },
        skip: cursor ? 1 : 0,
        take: take + 1,
        where: {
          attemptType,
          userId,
        },
      }),
      this.prisma.leaderboard.count({
        where: {
          attemptType,
          userId,
        },
      }),
    ]);
    const hasMore = scores.length > take;
    const pageScores = hasMore ? scores.slice(0, take) : scores;
    const levels = [...new Set(pageScores.map((score) => score.level))];
    const replayRootIds = [
      ...new Set(
        pageScores
          .filter((score) => score.attemptType === 'replay')
          .map((score) => score.replayOfId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const [levelAttempts, replayAttempts] = await Promise.all([
      levels.length
        ? this.prisma.leaderboard.findMany({
            select: { level: true, moves: true, timeSeconds: true },
            where: { level: { in: levels }, userId },
          })
        : [],
      replayRootIds.length
        ? this.prisma.leaderboard.findMany({
            orderBy: [{ completedAt: 'asc' }, { id: 'asc' }],
            where: {
              userId,
              OR: [
                { id: { in: replayRootIds } },
                { replayOfId: { in: replayRootIds } },
              ],
            },
          })
        : [],
    ]);
    const levelBests = new Map<
      number,
      { moves: number; timeSeconds: number }
    >();

    levelAttempts.forEach((attempt) => {
      const current = levelBests.get(attempt.level);
      levelBests.set(attempt.level, {
        moves: Math.min(current?.moves ?? attempt.moves, attempt.moves),
        timeSeconds: Math.min(
          current?.timeSeconds ?? attempt.timeSeconds,
          attempt.timeSeconds,
        ),
      });
    });

    return {
      nextCursor: hasMore ? pageScores.at(-1)?.id ?? null : null,
      scores: pageScores.map(({ puzzleConfig, ...score }) => {
        const previousAttempts =
          score.attemptType === 'replay' && score.replayOfId
            ? replayAttempts.filter(
                (attempt) =>
                  (attempt.id === score.replayOfId ||
                    attempt.replayOfId === score.replayOfId) &&
                  attempt.id !== score.id &&
                  attempt.completedAt.getTime() < score.completedAt.getTime(),
              )
            : [];
        const previousBest = previousAttempts.reduce<
          (typeof previousAttempts)[number] | null
        >((best, attempt) => {
          if (!best) {
            return attempt;
          }
          return attempt.timeSeconds < best.timeSeconds ||
            (attempt.timeSeconds === best.timeSeconds &&
              attempt.moves < best.moves)
            ? attempt
            : best;
        }, null);
        const replayComparison =
          score.attemptType !== 'replay'
            ? null
            : !previousBest
              ? 'First replay baseline'
              : score.timeSeconds < previousBest.timeSeconds ||
                  (score.timeSeconds === previousBest.timeSeconds &&
                    score.moves < previousBest.moves)
                ? 'Improved previous best'
                : score.timeSeconds === previousBest.timeSeconds &&
                    score.moves === previousBest.moves
                  ? 'Matched previous best'
                  : 'Behind previous best';

        return {
          ...score,
          canReplay: Boolean(puzzleConfig),
          levelBest: levelBests.get(score.level) ?? null,
          replayComparison,
        };
      }),
      totalCount,
    };
  }

  async list(take = 20) {
    const scores = await this.prisma.leaderboard.findMany({
      select: {
        attemptType: true,
        completedAt: true,
        id: true,
        level: true,
        moves: true,
        replayOfId: true,
        pausedDurationSeconds: true,
        timeSeconds: true,
        totalTimeSeconds: true,
        userId: true,
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
      generatedAt: new Date().toISOString(),
      scores: scores.map(({ user, ...score }) => ({
        ...score,
        user: {
          avatarUrl: getGravatarUrl(user.email),
          name: user.name,
        },
      })),
    };
  }

  async listDaily(challengeDate: string, take = 50) {
    const scores = await this.prisma.dailyChallengeScore.findMany({
      select: {
        challengeDate: true,
        completedAt: true,
        id: true,
        level: true,
        moves: true,
        pausedDurationSeconds: true,
        timeSeconds: true,
        totalTimeSeconds: true,
        userId: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: [
        { timeSeconds: 'asc' },
        { moves: 'asc' },
        { completedAt: 'asc' },
      ],
      take,
      where: { challengeDate },
    });

    return {
      challengeDate,
      generatedAt: new Date().toISOString(),
      scores: scores.map(({ user, ...score }) => ({
        ...score,
        user: {
          avatarUrl: getGravatarUrl(user.email),
          name: user.name,
        },
      })),
    };
  }

  async getDailyForUser(userId: string, challengeDate: string) {
    const scores = await this.prisma.dailyChallengeScore.findMany({
      orderBy: [
        { timeSeconds: 'asc' },
        { moves: 'asc' },
        { completedAt: 'asc' },
      ],
      select: {
        challengeDate: true,
        completedAt: true,
        id: true,
        level: true,
        moves: true,
        pausedDurationSeconds: true,
        timeSeconds: true,
        totalTimeSeconds: true,
        userId: true,
      },
      where: { challengeDate },
    });
    const index = scores.findIndex((score) => score.userId === userId);

    return {
      rank: index >= 0 ? index + 1 : null,
      score: index >= 0 ? scores[index] : null,
      totalCount: scores.length,
    };
  }

  async getReplayBoard(userId: string, completionId: string) {
    const score = await this.prisma.leaderboard.findFirst({
      where: {
        id: completionId,
        userId,
      },
    });

    if (!score) {
      throw new NotFoundException('Completed level not found.');
    }

    if (!score.puzzleConfig) {
      throw new BadRequestException(
        'This completed level was saved before replay snapshots were available.',
      );
    }

    const parsedBoard = boardStateSchema.safeParse(score.puzzleConfig);
    if (!parsedBoard.success) {
      throw new BadRequestException(
        'Replay snapshot is no longer readable for this completed level.',
      );
    }
    const board = parsedBoard.data;
    const replayRootId = score.replayOfId ?? score.id;
    const attempts = await this.prisma.leaderboard.findMany({
      where: {
        userId,
        OR: [{ id: replayRootId }, { replayOfId: replayRootId }],
      },
      select: {
        moves: true,
        timeSeconds: true,
      },
    });

    return {
      bestMoves: Math.min(...attempts.map((attempt) => attempt.moves)),
      bestTimeSeconds: Math.min(
        ...attempts.map((attempt) => attempt.timeSeconds),
      ),
      board: {
        ...board,
        elapsedTimeMs: 0,
        moves: 0,
        pausedDurationMs: 0,
        startedAt: new Date().toISOString(),
        totalElapsedTimeMs: 0,
      } satisfies BoardStateDto,
      replayOfId: replayRootId,
    };
  }

  async recordCompletedLevel(userId: string, data: CompletedLevelDto) {
    const { attemptType, board, completion, puzzleConfig, replayOfId } = data;
    const { pausedDurationSeconds, timeSeconds, totalTimeSeconds } =
      calculateCompletionTiming(board);
    const previousBest = await this.prisma.leaderboard.findFirst({
      orderBy: [
        { timeSeconds: 'asc' },
        { moves: 'asc' },
        { completedAt: 'asc' },
      ],
      select: { moves: true, timeSeconds: true },
      where: {
        level: board.level,
        userId,
      },
    });
    const replaySource = replayOfId
      ? await this.prisma.leaderboard.findFirst({
          where: {
            id: replayOfId,
            userId,
          },
        })
      : null;

    if (attemptType === 'replay' && !replaySource) {
      throw new BadRequestException('Replay source could not be found.');
    }

    const replayRootId = replaySource?.replayOfId ?? replaySource?.id ?? null;
    const storedPuzzleConfig =
      replaySource?.puzzleConfig ?? puzzleConfig ?? board;
    const { score, streak } = await this.prisma.$transaction(async (tx) => {
      const score = await tx.leaderboard.create({
        data: {
          attemptType,
          level: board.level,
          moves: board.moves,
          pausedDurationSeconds,
          puzzleConfig: storedPuzzleConfig as unknown as Prisma.InputJsonValue,
          replayOfId: attemptType === 'replay' ? replayRootId : null,
          timeSeconds,
          totalTimeSeconds,
          userId,
        },
      });
      const streak = await this.updateStreakForCompletion(
        tx,
        userId,
        completion,
      );

      return { score, streak };
    });

    return {
      personalBest:
        previousBest && timeSeconds < previousBest.timeSeconds
          ? {
              improvementSeconds: previousBest.timeSeconds - timeSeconds,
              previousBest,
            }
          : null,
      score,
      streak,
    };
  }

  async recordCompletedDailyChallenge(
    userId: string,
    data: CompletedDailyChallengeDto,
  ) {
    const { board, challengeDate, completion, puzzleConfig } = data;
    const { pausedDurationSeconds, timeSeconds, totalTimeSeconds } =
      calculateCompletionTiming(board);

    try {
      const { score, streak } = await this.prisma.$transaction(async (tx) => {
        const score = await tx.dailyChallengeScore.create({
          data: {
            challengeDate,
            level: board.level,
            moves: board.moves,
            pausedDurationSeconds,
            puzzleConfig: (puzzleConfig ?? board) as unknown as Prisma.InputJsonValue,
            timeSeconds,
            totalTimeSeconds,
            userId,
          },
        });
        const streak = await this.updateStreakForCompletion(
          tx,
          userId,
          completion,
        );

        return { score, streak };
      });
      const ranking = await this.getDailyForUser(userId, challengeDate);

      return {
        rank: ranking.rank,
        score,
        streak,
        totalCount: ranking.totalCount,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          "You have already submitted today's challenge.",
        );
      }

      throw error;
    }
  }
}
