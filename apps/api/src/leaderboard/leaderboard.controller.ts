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

import { AuthGuard } from '../session/auth.guard';
import { getAuthenticatedUser } from '../session/get-authenticated-user';
import type { AuthenticatedRequest } from '../session/session.types';
import { completedLevelSchema, parseBody } from '../shared/zod';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  list(@Query('take') take?: string) {
    const parsedTake = Number(take ?? 20);
    return this.leaderboardService.list(
      Number.isFinite(parsedTake) ? Math.min(Math.max(parsedTake, 1), 100) : 20,
    );
  }

  @Post('completions')
  @UseGuards(AuthGuard)
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

  @Get('completions/:completionId/replay')
  @UseGuards(AuthGuard)
  getReplayBoard(
    @Param('completionId') completionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = getAuthenticatedUser(request);
    return this.leaderboardService.getReplayBoard(user.id, completionId);
  }
}
