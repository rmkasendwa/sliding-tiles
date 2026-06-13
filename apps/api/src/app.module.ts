import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AnonymousAnalyticsModule } from './anonymous-analytics/anonymous-analytics.module';
import { AuthModule } from './auth/auth.module';
import { GameStateModule } from './game-state/game-state.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SessionModule,
    AnonymousAnalyticsModule,
    AuthModule,
    GameStateModule,
    LeaderboardModule,
    ProfileModule,
  ],
})
export class AppModule {}
