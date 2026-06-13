import { Module } from '@nestjs/common';

import { AnonymousAnalyticsController } from './anonymous-analytics.controller';
import { AnonymousAnalyticsService } from './anonymous-analytics.service';

@Module({
  controllers: [AnonymousAnalyticsController],
  providers: [AnonymousAnalyticsService],
})
export class AnonymousAnalyticsModule {}
