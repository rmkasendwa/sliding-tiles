import { Module } from '@nestjs/common';

import { AchievementsService } from './achievements.service';

@Module({
  exports: [AchievementsService],
  providers: [AchievementsService],
})
export class AchievementsModule {}
