import { Module } from '@nestjs/common';

import { AchievementsModule } from '../achievements/achievements.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  imports: [AchievementsModule],
  providers: [ProfileService],
})
export class ProfileModule {}
