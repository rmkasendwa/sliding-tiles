import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { PrismaService } from '../prisma/prisma.service';
import { anonymousAnalyticsBatchSchema } from '../shared/zod';

type AnonymousAnalyticsBatch = z.infer<
  typeof anonymousAnalyticsBatchSchema
>;

@Injectable()
export class AnonymousAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordBatch({ events }: AnonymousAnalyticsBatch) {
    const result = await this.prisma.anonymousAnalyticsEvent.createMany({
      data: events.map((event) => ({
        anonymousPlayerId: event.anonymousPlayerId,
        eventName: event.eventName,
        level: event.level,
        moveCount: event.moveCount,
        occurredAt: new Date(event.timestamp),
        puzzleSize: event.puzzleSize,
        screenHeight: event.screenHeight,
        screenWidth: event.screenWidth,
        sessionId: event.sessionId,
        timerValueMs: event.timerValueMs,
      })),
    });

    return { accepted: result.count };
  }
}
