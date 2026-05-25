import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../session/auth.guard';
import { getAuthenticatedUser } from '../session/get-authenticated-user';
import type { AuthenticatedRequest } from '../session/session.types';
import { parseBody, saveGameStateSchema } from '../shared/zod';
import { GameStateService } from './game-state.service';

@Controller('game-state')
@UseGuards(AuthGuard)
export class GameStateController {
  constructor(private readonly gameStateService: GameStateService) {}

  @Get()
  getGameState(@Req() request: AuthenticatedRequest) {
    const user = getAuthenticatedUser(request);
    return this.gameStateService.getForUser(user.id);
  }

  @Put()
  saveGameState(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const user = getAuthenticatedUser(request);
    const { board } = parseBody(saveGameStateSchema, body);
    return this.gameStateService.saveForUser(user.id, board);
  }
}
