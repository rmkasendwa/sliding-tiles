import { UnauthorizedException } from '@nestjs/common';

import { AuthenticatedRequest, SessionUser } from './session.types';

export function getAuthenticatedUser(request: AuthenticatedRequest): SessionUser {
  if (!request.user) {
    throw new UnauthorizedException('Authentication is required.');
  }

  return request.user;
}
