import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  AuthenticatedApi,
  ref,
  scoreExample,
} from '../openapi/public-openapi.metadata';
import { AuthGuard } from '../session/auth.guard';
import { getAuthenticatedUser } from '../session/get-authenticated-user';
import type { AuthenticatedRequest } from '../session/session.types';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(AuthGuard)
@AuthenticatedApi()
@ApiTags('Profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get profile' })
  @ApiOkResponse({
    description: 'Current user profile.',
    schema: {
      ...ref('ProfileResponse'),
      example: {
        gameState: null,
        scores: [scoreExample],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: ref('ErrorResponse'),
  })
  getProfile(@Req() request: AuthenticatedRequest) {
    const user = getAuthenticatedUser(request);
    return this.profileService.getForUser(user.id);
  }
}
