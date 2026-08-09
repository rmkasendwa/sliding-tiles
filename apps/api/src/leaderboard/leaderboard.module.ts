import { Module } from '@nestjs/common';

import { AchievementsModule } from '../achievements/achievements.module';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({
  controllers: [LeaderboardController],
  imports: [AchievementsModule],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
