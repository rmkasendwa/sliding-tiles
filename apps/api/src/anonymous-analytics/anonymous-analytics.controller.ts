import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import {
  anonymousAnalyticsBatchSchema,
  parseBody,
} from '../shared/zod';
import { AnonymousAnalyticsService } from './anonymous-analytics.service';

@Controller('anonymous-analytics')
export class AnonymousAnalyticsController {
  constructor(
    private readonly anonymousAnalyticsService: AnonymousAnalyticsService,
  ) {}

  @Post('events')
  recordEvents(@Body() body: unknown, @Req() request: Request) {
    return this.anonymousAnalyticsService.recordBatch(
      parseBody(anonymousAnalyticsBatchSchema, body),
      request,
    );
  }
}
