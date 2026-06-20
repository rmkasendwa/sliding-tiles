import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SessionModule } from '../session/session.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  imports: [PrismaModule, SessionModule],
  providers: [AdminService],
})
export class AdminModule {}
