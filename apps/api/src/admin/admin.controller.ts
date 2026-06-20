import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../session/admin.guard';
import { AuthGuard } from '../session/auth.guard';
import { getAuthenticatedUser } from '../session/get-authenticated-user';
import type { AuthenticatedRequest } from '../session/session.types';
import {
  adminAnalyticsQuerySchema,
  adminUpdateUserRoleSchema,
  adminUserSearchSchema,
  parseBody,
  parseQuery,
} from '../shared/zod';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: unknown) {
    return this.adminService.listUsers(parseQuery(adminUserSearchSchema, query));
  }

  @Patch('users/:userId/role')
  updateUserRole(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    const actor = getAuthenticatedUser(request);
    return this.adminService.updateUserRole(
      actor.id,
      userId,
      parseBody(adminUpdateUserRoleSchema, body).role,
    );
  }

  @Get('analytics')
  getAnalytics(@Query() query: unknown) {
    return this.adminService.getAnalytics(
      parseQuery(adminAnalyticsQuerySchema, query),
    );
  }
}
