import { Module } from '@nestjs/common';

import { SessionModule } from '../session/session.module';
import { AnonymousAnalyticsController } from './anonymous-analytics.controller';
import { AnonymousAnalyticsService } from './anonymous-analytics.service';

@Module({
  imports: [SessionModule],
  controllers: [AnonymousAnalyticsController],
  providers: [AnonymousAnalyticsService],
})
export class AnonymousAnalyticsModule {}
