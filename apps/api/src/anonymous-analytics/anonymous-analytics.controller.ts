import { Body, Controller, Post } from '@nestjs/common';

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
  recordEvents(@Body() body: unknown) {
    return this.anonymousAnalyticsService.recordBatch(
      parseBody(anonymousAnalyticsBatchSchema, body),
    );
  }
}
