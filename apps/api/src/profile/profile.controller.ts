import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../session/auth.guard';
import { getAuthenticatedUser } from '../session/get-authenticated-user';
import type { AuthenticatedRequest } from '../session/session.types';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@Req() request: AuthenticatedRequest) {
    const user = getAuthenticatedUser(request);
    return this.profileService.getForUser(user.id);
  }
}
