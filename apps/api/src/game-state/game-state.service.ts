import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { boardStateSchema } from '../shared/zod';

type BoardStateDto = z.infer<typeof boardStateSchema>;

@Injectable()
export class GameStateService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const gameState = await this.prisma.gameState.findUnique({
      where: { userId },
    });

    return { gameState };
  }

  async saveForUser(userId: string, board: BoardStateDto) {
    const gameState = await this.prisma.gameState.upsert({
      create: {
        board: board as unknown as Prisma.InputJsonValue,
        level: board.level,
        moves: board.moves,
        startedAt: new Date(board.startedAt),
        userId,
      },
      update: {
        board: board as unknown as Prisma.InputJsonValue,
        level: board.level,
        moves: board.moves,
        startedAt: new Date(board.startedAt),
      },
      where: { userId },
    });

    return { gameState };
  }
}
