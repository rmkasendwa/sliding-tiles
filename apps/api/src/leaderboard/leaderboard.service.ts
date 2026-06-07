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
