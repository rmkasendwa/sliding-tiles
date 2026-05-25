import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { SessionService } from './session.service';
import { AuthenticatedRequest } from './session.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await this.sessionService.getSessionFromRequest(request);

    if (!session) {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.user = session;
    return true;
  }
}
