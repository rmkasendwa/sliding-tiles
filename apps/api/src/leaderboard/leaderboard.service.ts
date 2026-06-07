import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getGravatarUrl } from '../shared/gravatar';
import { boardStateSchema, completedLevelSchema } from '../shared/zod';

type BoardStateDto = z.infer<typeof boardStateSchema>;
type CompletedLevelDto = z.infer<typeof completedLevelSchema>;

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

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
    const scores = await this.prisma.leaderboard.findMany({
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
      select: {
        attemptType: true,
        completedAt: true,
        id: true,
        level: true,
        moves: true,
        puzzleConfig: true,
        replayOfId: true,
        timeSeconds: true,
        userId: true,
      },
      skip: cursor ? 1 : 0,
      take: take + 1,
      where: {
        attemptType,
        userId,
      },
    });
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
        timeSeconds: true,
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
        startedAt: new Date().toISOString(),
      } satisfies BoardStateDto,
      replayOfId: replayRootId,
    };
  }

  async recordCompletedLevel(userId: string, data: CompletedLevelDto) {
    const { attemptType, board, puzzleConfig, replayOfId } = data;
    const elapsedMs =
      board.elapsedTimeMs > 0
        ? board.elapsedTimeMs
        : Math.max(0, Date.now() - new Date(board.startedAt).getTime());
    const timeSeconds = Math.max(1, Math.round(elapsedMs / 1000));
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
    const score = await this.prisma.leaderboard.create({
      data: {
        attemptType,
        level: board.level,
        moves: board.moves,
        puzzleConfig: storedPuzzleConfig as unknown as Prisma.InputJsonValue,
        replayOfId: attemptType === 'replay' ? replayRootId : null,
        timeSeconds,
        userId,
      },
    });

    return { score };
  }
}
