import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  AuthenticatedApi,
  boardExample,
  ref,
  scoreExample,
  userExample,
} from '../openapi/public-openapi.metadata';
import { AuthGuard } from '../session/auth.guard';
import { getAuthenticatedUser } from '../session/get-authenticated-user';
import type { AuthenticatedRequest } from '../session/session.types';
import {
  completedDailyChallengeSchema,
  completedLevelSchema,
  dailyChallengeDateSchema,
  parseBody,
} from '../shared/zod';
import { LeaderboardService } from './leaderboard.service';

function getCurrentChallengeDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseChallengeDate(date: string | undefined) {
  return parseBody(dailyChallengeDateSchema, date ?? getCurrentChallengeDate());
}

@Controller('leaderboard')
@ApiTags('Leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'List public leaderboard' })
  @ApiQuery({
    description: 'Number of scores to return. Values are clamped from 1 to 100.',
    example: 20,
    name: 'take',
    required: false,
    schema: { default: 20, maximum: 100, minimum: 1, type: 'integer' },
  })
  @ApiOkResponse({
    description: 'Leaderboard scores.',
    schema: {
      ...ref('LeaderboardResponse'),
      example: {
        generatedAt: '2026-07-22T09:31:05.000Z',
        scores: [
          {
            ...scoreExample,
            user: {
              avatarUrl: userExample.avatarUrl,
              name: userExample.name,
            },
          },
        ],
      },
    },
  })
  list(@Query('take') take?: string) {
    const parsedTake = Number(take ?? 20);
    return this.leaderboardService.list(
      Number.isFinite(parsedTake) ? Math.min(Math.max(parsedTake, 1), 100) : 20,
    );
  }

  @Get('daily')
  @ApiOperation({ summary: 'List daily challenge rankings' })
  @ApiQuery({
    description: 'Challenge date in UTC, formatted as YYYY-MM-DD.',
    name: 'date',
    required: false,
    schema: { type: 'string' },
  })
  @ApiQuery({
    description: 'Number of scores to return. Values are clamped from 1 to 100.',
    example: 50,
    name: 'take',
    required: false,
    schema: { default: 50, maximum: 100, minimum: 1, type: 'integer' },
  })
  @ApiOkResponse({ description: 'Daily challenge rankings.' })
  listDaily(@Query('date') date?: string, @Query('take') take?: string) {
    const parsedTake = Number(take ?? 50);

    return this.leaderboardService.listDaily(
      parseChallengeDate(date),
      Number.isFinite(parsedTake) ? Math.min(Math.max(parsedTake, 1), 100) : 50,
    );
  }

  @Get('daily/mine')
  @UseGuards(AuthGuard)
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Get current user daily challenge rank' })
  @ApiQuery({
    description: 'Challenge date in UTC, formatted as YYYY-MM-DD.',
    name: 'date',
    required: false,
    schema: { type: 'string' },
  })
  @ApiOkResponse({ description: 'Current user daily challenge rank.' })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  getDailyForUser(
    @Query('date') date: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = getAuthenticatedUser(request);
    return this.leaderboardService.getDailyForUser(
      user.id,
      parseChallengeDate(date),
    );
  }

  @Post('daily/completions')
  @UseGuards(AuthGuard)
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Record a completed daily challenge' })
  @ApiBody({
    examples: {
      common: {
        value: {
          board: boardExample,
          challengeDate: getCurrentChallengeDate(),
          puzzleConfig: boardExample,
        },
      },
    },
    schema: {
      properties: {
        board: ref('BoardState'),
        challengeDate: {
          example: getCurrentChallengeDate(),
          type: 'string',
        },
        puzzleConfig: ref('BoardState'),
      },
      required: ['board', 'challengeDate'],
      type: 'object',
    },
  })
  @ApiCreatedResponse({ description: 'Daily challenge completion recorded.' })
  @ApiBadRequestResponse({
    description: 'The board failed validation or the challenge was already submitted.',
    schema: ref('ErrorResponse'),
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  recordCompletedDailyChallenge(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = getAuthenticatedUser(request);
    const completedDailyChallenge = parseBody(
      completedDailyChallengeSchema,
      body,
    );
    return this.leaderboardService.recordCompletedDailyChallenge(
      user.id,
      completedDailyChallenge,
    );
  }

  @Post('completions')
  @UseGuards(AuthGuard)
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Record a completed level' })
  @ApiBody({
    examples: {
      common: {
        value: {
          attemptType: 'original',
          board: boardExample,
          puzzleConfig: boardExample,
        },
      },
    },
    schema: ref('CompletedLevelRequest'),
  })
  @ApiCreatedResponse({
    description: 'Completion recorded.',
    schema: ref('LeaderboardRecordResponse'),
  })
  @ApiBadRequestResponse({
    description: 'The board failed validation or replay source is missing.',
    schema: ref('ErrorResponse'),
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  recordCompletedLevel(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = getAuthenticatedUser(request);
    const completedLevel = parseBody(completedLevelSchema, body);
    return this.leaderboardService.recordCompletedLevel(
      user.id,
      completedLevel,
    );
  }

  @Get('mine/statistics')
  @UseGuards(AuthGuard)
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Get current user performance statistics' })
  @ApiOkResponse({ description: 'Your performance statistics.' })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  getStatisticsForUser(@Req() request: AuthenticatedRequest) {
    const user = getAuthenticatedUser(request);
    return this.leaderboardService.getStatisticsForUser(user.id);
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  @AuthenticatedApi()
  @ApiOperation({ summary: 'List current user completions' })
  @ApiQuery({
    enum: ['original', 'replay'],
    name: 'attemptType',
    required: false,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    schema: { type: 'string' },
  })
  @ApiQuery({
    description: 'Number of completions to return. Values are clamped from 1 to 30.',
    name: 'take',
    required: false,
    schema: { default: 12, maximum: 30, minimum: 1, type: 'integer' },
  })
  @ApiOkResponse({
    description: 'Your completions.',
    schema: {
      ...ref('UserCompletionResponse'),
      example: {
        nextCursor: null,
        scores: [
          {
            ...scoreExample,
            canReplay: true,
            levelBest: { moves: 64, timeSeconds: 42 },
            replayComparison: null,
          },
        ],
        totalCount: 1,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  listForUser(
    @Query('attemptType') attemptType: string | undefined,
    @Query('cursor') cursor: string | undefined,
    @Query('take') take: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = getAuthenticatedUser(request);
    const parsedTake = Number(take ?? 12);

    return this.leaderboardService.listForUser(user.id, {
      attemptType:
        attemptType === 'original' || attemptType === 'replay'
          ? attemptType
          : undefined,
      cursor,
      take: Number.isFinite(parsedTake)
        ? Math.min(Math.max(parsedTake, 1), 30)
        : 12,
    });
  }

  @Get('completions/:completionId/replay')
  @UseGuards(AuthGuard)
  @AuthenticatedApi()
  @ApiOperation({ summary: 'Get a replay board' })
  @ApiParam({
    name: 'completionId',
    required: true,
    schema: { type: 'string' },
  })
  @ApiOkResponse({
    description: 'Replay board.',
    schema: ref('ReplayBoardResponse'),
  })
  @ApiBadRequestResponse({
    description: 'The replay snapshot is unavailable or unreadable.',
    schema: ref('ErrorResponse'),
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  @ApiNotFoundResponse({
    description: 'The completed level was not found.',
    schema: ref('ErrorResponse'),
  })
  getReplayBoard(
    @Param('completionId') completionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = getAuthenticatedUser(request);
    return this.leaderboardService.getReplayBoard(user.id, completionId);
  }
}
