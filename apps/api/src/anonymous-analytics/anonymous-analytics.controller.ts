import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { ref } from '../openapi/public-openapi.metadata';
import {
  anonymousAnalyticsBatchSchema,
  parseBody,
} from '../shared/zod';
import { AnonymousAnalyticsService } from './anonymous-analytics.service';

@Controller('anonymous-analytics')
@ApiTags('Analytics')
export class AnonymousAnalyticsController {
  constructor(
    private readonly anonymousAnalyticsService: AnonymousAnalyticsService,
  ) {}

  @Post('events')
  @ApiBearerAuth('bearerAuth')
  @ApiCookieAuth('sessionCookie')
  @ApiOperation({
    description:
      'Accepts batches of anonymous gameplay events. Authenticated users may include their session cookie or bearer token so events can be associated server-side.',
    summary: 'Record anonymous analytics events',
  })
  @ApiBody({
    examples: {
      common: {
        value: {
          events: [
            {
              anonymousId: '7242d01c-636b-42e9-84f1-ce1f75d5cf99',
              eventName: 'level_completed',
              level: 7,
              metadata: { boardSize: '4x4' },
              moveCount: 64,
              pathname: '/play',
              puzzleSize: '4x4',
              screenHeight: 900,
              screenWidth: 1440,
              sessionId: 'e3c512bd-2330-4d20-9e9e-10e1be9eeed6',
              timerValueMs: 42000,
              timestamp: '2026-07-22T09:31:04.000Z',
            },
          ],
        },
      },
    },
    schema: ref('AnonymousAnalyticsBatchRequest'),
  })
  @ApiCreatedResponse({
    description: 'Events accepted.',
    schema: {
      ...ref('AnalyticsAcceptedResponse'),
      example: { accepted: 1 },
    },
  })
  @ApiBadRequestResponse({
    description: 'The batch failed validation.',
    schema: ref('ErrorResponse'),
  })
  recordEvents(@Body() body: unknown, @Req() request: Request) {
    return this.anonymousAnalyticsService.recordBatch(
      parseBody(anonymousAnalyticsBatchSchema, body),
      request,
    );
  }
}
