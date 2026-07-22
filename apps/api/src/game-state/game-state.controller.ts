import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  AuthenticatedApi,
  boardExample,
  ref,
} from '../openapi/public-openapi.metadata';
import { AuthGuard } from '../session/auth.guard';
import { getAuthenticatedUser } from '../session/get-authenticated-user';
import type { AuthenticatedRequest } from '../session/session.types';
import { parseBody, saveGameStateSchema } from '../shared/zod';
import { GameStateService } from './game-state.service';

@Controller('game-state')
@UseGuards(AuthGuard)
@AuthenticatedApi()
@ApiTags('Game State')
export class GameStateController {
  constructor(private readonly gameStateService: GameStateService) {}

  @Get()
  @ApiOperation({ summary: 'Get saved game state' })
  @ApiOkResponse({
    description: 'Saved game state.',
    schema: {
      ...ref('GameStateResponse'),
      example: {
        gameState: null,
        highestReachedLevel: 8,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  getGameState(@Req() request: AuthenticatedRequest) {
    const user = getAuthenticatedUser(request);
    return this.gameStateService.getForUser(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Save game state' })
  @ApiBody({
    examples: {
      common: { value: { board: boardExample } },
    },
    schema: ref('SaveGameStateRequest'),
  })
  @ApiOkResponse({
    description: 'Saved game state.',
    schema: ref('SaveGameStateResponse'),
  })
  @ApiBadRequestResponse({
    description: 'The board state failed validation.',
    schema: ref('ErrorResponse'),
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  saveGameState(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const user = getAuthenticatedUser(request);
    const { board } = parseBody(saveGameStateSchema, body);
    return this.gameStateService.saveForUser(user.id, board);
  }
}
