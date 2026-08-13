import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { Prisma } from '@prisma/client';
import { AchievementsService } from '../achievements/achievements.service';
import { getConfiguredMaxAvailableLevel } from '../achievements/achievement-definitions';
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
type GhostRunDto = {
  moveHistory: NonNullable<BoardStateDto['moveHistory']>;
  moves: number;
  timeSeconds: number;
};
type MovementHeatmapCell = {
  intensity: number;
  moveCount: number;
  slot: [number, number];
};
type MovementHeatmapTransition = {
  count: number;
  from: [number, number];
  intensity: number;
  to: [number, number];
};

const HEATMAP_SAMPLE_SIZE = 150;

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

function getReplayBoardConfig(value: Prisma.JsonValue | null) {
  if (!value) {
    return null;
  }

  const parsedBoard = boardStateSchema.safeParse(value);

  return parsedBoard.success ? parsedBoard.data : null;
}

function getSlotFromKey(key: string): [number, number] | null {
  const [row, column] = key.split(',').map(Number);

  return Number.isInteger(row) && Number.isInteger(column)
    ? [row, column]
    : null;
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
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly prisma: PrismaService,
  ) {}

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

  async getStatisticsForUser(userId: string) {
    const [
      totals,
      originalCount,
      replayCount,
      bestTime,
      bestMoves,
      streak,
      recentAttempts,
    ] = await Promise.all([
      this.prisma.leaderboard.aggregate({
        _avg: {
          moves: true,
          timeSeconds: true,
        },
        _count: {
          _all: true,
        },
        _sum: {
          moves: true,
          timeSeconds: true,
          totalTimeSeconds: true,
        },
        where: { userId },
      }),
      this.prisma.leaderboard.count({
        where: { attemptType: 'original', userId },
      }),
      this.prisma.leaderboard.count({
        where: { attemptType: 'replay', userId },
      }),
      this.prisma.leaderboard.findFirst({
        orderBy: [
          { timeSeconds: 'asc' },
          { moves: 'asc' },
          { completedAt: 'asc' },
        ],
        select: {
          completedAt: true,
          id: true,
          level: true,
          moves: true,
          timeSeconds: true,
        },
        where: { userId },
      }),
      this.prisma.leaderboard.findFirst({
        orderBy: [
          { moves: 'asc' },
          { timeSeconds: 'asc' },
          { completedAt: 'asc' },
        ],
        select: {
          completedAt: true,
          id: true,
          level: true,
          moves: true,
          timeSeconds: true,
        },
        where: { userId },
      }),
      this.prisma.userStreak.findUnique({
        select: {
          currentStreak: true,
          lastCompletionLocalDate: true,
          lastCompletionTimeZone: true,
          longestStreak: true,
        },
        where: { userId },
      }),
      this.prisma.leaderboard.findMany({
        orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
        select: {
          attemptType: true,
          completedAt: true,
          id: true,
          level: true,
          moves: true,
          timeSeconds: true,
          totalTimeSeconds: true,
        },
        take: 20,
        where: { userId },
      }),
    ]);
    const trendAttempts = [...recentAttempts].reverse();
    const trend = trendAttempts
      .map((attempt, index) => ({
        attemptType: attempt.attemptType as 'original' | 'replay',
        completedAt: attempt.completedAt,
        completionNumber:
          Math.max(totals._count._all - trendAttempts.length, 0) + index + 1,
        id: attempt.id,
        level: attempt.level,
        moves: attempt.moves,
        timeSeconds: attempt.timeSeconds,
        totalTimeSeconds: attempt.totalTimeSeconds,
      }));

    return {
      averages: {
        moves: totals._avg.moves,
        timeSeconds: totals._avg.timeSeconds,
      },
      bests: {
        moves: bestMoves,
        time: bestTime,
      },
      counts: {
        levelsCompleted: originalCount,
        replayCount,
        totalRuns: totals._count._all,
      },
      streak: streak ?? {
        currentStreak: 0,
        lastCompletionLocalDate: null,
        lastCompletionTimeZone: null,
        longestStreak: 0,
      },
      totals: {
        moves: totals._sum.moves ?? 0,
        playTimeSeconds:
          totals._sum.totalTimeSeconds ?? totals._sum.timeSeconds ?? 0,
      },
      trend,
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

  async getPublicRun(runId: string) {
    const score = await this.prisma.leaderboard.findUnique({
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
        user: {
          select: {
            email: true,
            name: true,
            username: true,
          },
        },
      },
      where: { id: runId },
    });

    if (!score) {
      throw new NotFoundException('Shared run not found.');
    }

    const board = getReplayBoardConfig(score.puzzleConfig);

    const { puzzleConfig, ...publicScore } = score;

    return {
      ...publicScore,
      puzzle: board
        ? {
            dimensions: board.dimensions,
            level: board.level,
            tileCount: board.tileGrid.flat().length,
          }
        : {
            dimensions: null,
            level: score.level,
            tileCount: null,
          },
      user: {
        avatarUrl: getGravatarUrl(score.user.email),
        name: score.user.name,
        username: score.user.username,
      },
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

    const board = getReplayBoardConfig(score.puzzleConfig);
    if (!board) {
      throw new BadRequestException(
        'Replay snapshot is no longer readable for this completed level.',
      );
    }
    const replayRootId = score.replayOfId ?? score.id;
    const attempts = await this.prisma.leaderboard.findMany({
      where: {
        userId,
        OR: [{ id: replayRootId }, { replayOfId: replayRootId }],
      },
      select: {
        moves: true,
        puzzleConfig: true,
        timeSeconds: true,
      },
    });
    const ghostRun = attempts.reduce<GhostRunDto | null>((best, attempt) => {
      const config = getReplayBoardConfig(attempt.puzzleConfig);
      const moveHistory = config?.moveHistory;

      if (!moveHistory?.length) {
        return best;
      }

      if (
        !best ||
        attempt.timeSeconds < best.timeSeconds ||
        (attempt.timeSeconds === best.timeSeconds && attempt.moves < best.moves)
      ) {
        return {
          moveHistory,
          moves: attempt.moves,
          timeSeconds: attempt.timeSeconds,
        };
      }

      return best;
    }, null);

    return {
      bestMoves: Math.min(...attempts.map((attempt) => attempt.moves)),
      bestTimeSeconds: Math.min(
        ...attempts.map((attempt) => attempt.timeSeconds),
      ),
      board: {
        ...board,
        elapsedTimeMs: 0,
        moveHistory: [],
        moves: 0,
        pausedDurationMs: 0,
        startedAt: new Date().toISOString(),
        totalElapsedTimeMs: 0,
      } satisfies BoardStateDto,
      ghostRun,
      replayOfId: replayRootId,
    };
  }

  async getMovementHeatmaps(levels: number[]) {
    const requestedLevels = [...new Set(levels)]
      .filter((level) => Number.isInteger(level) && level > 0)
      .slice(0, 8);

    const heatmaps = await Promise.all(
      requestedLevels.map(async (level) => {
        const attempts = await this.prisma.leaderboard.findMany({
          orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
          select: {
            puzzleConfig: true,
          },
          take: HEATMAP_SAMPLE_SIZE,
          where: {
            attemptType: 'original',
            level,
            puzzleConfig: { not: Prisma.DbNull },
          },
        });
        const moveCounts = new Map<string, number>();
        const transitionCounts = new Map<string, number>();
        let dimensions: [number, number] | null = null;
        let sampleSize = 0;
        let totalMoves = 0;

        attempts.forEach((attempt) => {
          const board = getReplayBoardConfig(attempt.puzzleConfig);
          const moveHistory = board?.moveHistory;

          if (!board || !moveHistory?.length) {
            return;
          }

          dimensions ??= board.dimensions;
          sampleSize += 1;
          totalMoves += moveHistory.length;

          moveHistory.forEach((move, index) => {
            const key = move.slot.join(',');
            moveCounts.set(key, (moveCounts.get(key) ?? 0) + 1);

            const nextMove = moveHistory[index + 1];
            if (nextMove) {
              const transitionKey = `${key}>${nextMove.slot.join(',')}`;
              transitionCounts.set(
                transitionKey,
                (transitionCounts.get(transitionKey) ?? 0) + 1,
              );
            }
          });
        });

        const [columns, rows] = dimensions ?? [0, 0];
        const maxTileMoves = Math.max(0, ...moveCounts.values());
        const cells: MovementHeatmapCell[] = Array.from(
          { length: rows * columns },
          (_, index) => {
            const slot: [number, number] = [
              Math.floor(index / columns),
              index % columns,
            ];
            const moveCount = moveCounts.get(slot.join(',')) ?? 0;

            return {
              intensity: maxTileMoves > 0 ? moveCount / maxTileMoves : 0,
              moveCount,
              slot,
            };
          },
        );
        const maxTransitionCount = Math.max(0, ...transitionCounts.values());
        const transitions: MovementHeatmapTransition[] = Array.from(
          transitionCounts.entries(),
        )
          .map(([key, count]) => {
            const [fromKey, toKey] = key.split('>');
            const from = getSlotFromKey(fromKey);
            const to = getSlotFromKey(toKey);

            return from && to
              ? {
                  count,
                  from,
                  intensity:
                    maxTransitionCount > 0 ? count / maxTransitionCount : 0,
                  to,
                }
              : null;
          })
          .filter(
            (transition): transition is MovementHeatmapTransition =>
              Boolean(transition),
          )
          .sort((a, b) => b.count - a.count)
          .slice(0, 24);

        return {
          averageMoves:
            sampleSize > 0 ? Math.round((totalMoves / sampleSize) * 10) / 10 : 0,
          cells,
          dimensions: dimensions ?? [0, 0],
          level,
          maxTileMoves,
          sampleSize,
          totalMoves,
          transitions,
        };
      }),
    );

    return {
      generatedAt: new Date().toISOString(),
      heatmaps,
      sampleLimitPerLevel: HEATMAP_SAMPLE_SIZE,
    };
  }

  private async getLeaderboardRankForScore(
    tx: Prisma.TransactionClient,
    score: {
      completedAt: Date;
      id: string;
      level: number;
      moves: number;
      timeSeconds: number;
    },
  ) {
    const betterScoreCount = await tx.leaderboard.count({
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
      },
    });

    return betterScoreCount + 1;
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
    const storedPuzzleConfig = {
      ...(puzzleConfig ??
        getReplayBoardConfig(replaySource?.puzzleConfig ?? null) ??
        board),
      moveHistory: board.moveHistory,
    };
    const { achievements, score, streak } = await this.prisma.$transaction(async (tx) => {
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
      const [originalCompletionCount, highestOriginalCompletion] =
        await Promise.all([
          tx.leaderboard.count({
            where: { attemptType: 'original', userId },
          }),
          tx.leaderboard.aggregate({
            _max: { level: true },
            where: { attemptType: 'original', userId },
          }),
        ]);
      const leaderboardRank = await this.getLeaderboardRankForScore(tx, score);
      const achievements =
        await this.achievementsService.awardEarnedAchievements(tx, userId, {
          board: {
            level: board.level,
            moves: board.moves,
            timeSeconds,
            totalTimeSeconds,
            undoCount: board.undoCount,
          },
          completionCount: originalCompletionCount,
          highestOriginalLevel: highestOriginalCompletion._max.level ?? 0,
          isOriginalAttempt: attemptType === 'original',
          leaderboardRank,
          maxAvailableLevel: getConfiguredMaxAvailableLevel(),
        });

      return { achievements, score, streak };
    });

    return {
      achievements,
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
            puzzleConfig: {
              ...(puzzleConfig ?? board),
              moveHistory: board.moveHistory,
            } as unknown as Prisma.InputJsonValue,
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
