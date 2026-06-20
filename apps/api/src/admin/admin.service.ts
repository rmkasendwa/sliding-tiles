import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  adminAnalyticsQuerySchema,
  adminUserSearchSchema,
  anonymousAnalyticsEventNames,
} from '../shared/zod';
import type { z } from 'zod';

type AdminUserSearch = z.infer<typeof adminUserSearchSchema>;
type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;

const primaryEventNames = [
  'game_started',
  'game_completed',
  'game_abandoned',
  'level_unlocked',
  'invalid_move',
  'tile_dragged',
  'reset_clicked',
  'auto_play_started',
  'auto_play_completed',
  'peek_image_clicked',
  'leaderboard_opened',
  'signup_prompt_shown',
  'signup_clicked',
] as const;

const eventAliases: Record<string, string[]> = {
  game_abandoned: ['game_abandoned', 'level_abandoned'],
  game_completed: ['game_completed', 'level_completed'],
  game_started: ['game_started', 'level_started', 'game_opened'],
  peek_image_clicked: ['peek_image_clicked', 'full_image_peeked'],
  reset_clicked: ['reset_clicked', 'reset_level_clicked'],
  signup_clicked: ['signup_clicked', 'register_clicked'],
  signup_prompt_shown: ['signup_prompt_shown', 'register_prompt_shown'],
  tile_dragged: ['tile_dragged', 'move_made'],
};

function parseDateFilter(value: string | undefined, fallback?: Date) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid analytics date range.');
  }

  return date;
}

function canonicalEventName(eventName: string) {
  for (const [canonical, aliases] of Object.entries(eventAliases)) {
    if (aliases.includes(eventName)) {
      return canonical;
    }
  }

  return eventName;
}

function average(values: Array<number | null | undefined>) {
  const usable = values.filter((value): value is number => typeof value === 'number');
  if (usable.length === 0) {
    return null;
  }

  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers({ search, take }: AdminUserSearch) {
    const where: Prisma.UserWhereInput = search
      ? {
          email: {
            contains: search.trim().toLowerCase(),
            mode: 'insensitive',
          },
        }
      : {};

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          email: true,
          id: true,
          name: true,
          promotedAt: true,
          promotedBy: {
            select: {
              email: true,
              id: true,
              name: true,
              username: true,
            },
          },
          role: true,
          username: true,
        },
        take,
        where,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { totalCount, users };
  }

  async updateUserRole(actorId: string, userId: string, role: UserRole) {
    const target = await this.prisma.user.findUnique({
      select: { id: true, role: true },
      where: { id: userId },
    });

    if (!target) {
      throw new NotFoundException();
    }

    const data =
      role === UserRole.ADMIN
        ? { promotedAt: new Date(), promotedById: actorId, role }
        : { promotedAt: null, promotedById: null, role };

    const user = await this.prisma.user.update({
      data,
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        promotedAt: true,
        promotedBy: {
          select: {
            email: true,
            id: true,
            name: true,
            username: true,
          },
        },
        role: true,
        username: true,
      },
      where: { id: userId },
    });

    return { user };
  }

  async getAnalytics(query: AdminAnalyticsQuery) {
    const where = this.getAnalyticsWhere(query);
    const completedWhere = {
      ...where,
      eventName: { in: eventAliases.game_completed },
    };
    const startedWhere = {
      ...where,
      eventName: { in: eventAliases.game_started },
    };
    const recentTake = query.take;

    const [
      totalSessions,
      gamesStarted,
      gamesCompleted,
      completedStats,
      usageCounts,
      eventCounts,
      recentEvents,
    ] = await Promise.all([
      this.countDistinctSessions(where),
      this.prisma.anonymousAnalyticsEvent.count({ where: startedWhere }),
      this.prisma.anonymousAnalyticsEvent.count({ where: completedWhere }),
      this.prisma.anonymousAnalyticsEvent.findMany({
        select: {
          moveCount: true,
          timerValueMs: true,
        },
        take: 1000,
        where: completedWhere,
      }),
      this.getUsageCounts(where),
      this.getEventCounts(where),
      this.prisma.anonymousAnalyticsEvent.findMany({
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          eventName: true,
          level: true,
          moveCount: true,
          occurredAt: true,
          puzzleSize: true,
          screenHeight: true,
          screenWidth: true,
          sessionId: true,
          timerValueMs: true,
        },
        skip: query.cursor ? 1 : 0,
        take: recentTake + 1,
        where,
        ...(query.cursor ? { cursor: { id: query.cursor } } : {}),
      }),
    ]);

    const sessionDurations = await this.getSessionDurations(where);
    const visibleEvents = recentEvents.slice(0, recentTake);
    const nextCursor =
      recentEvents.length > recentTake
        ? (recentEvents[recentTake]?.id ?? null)
        : null;

    return {
      eventCounts,
      eventNames: primaryEventNames,
      filters: query,
      metrics: {
        averageActivePlayTimeMs: average(
          completedStats.map((event) => event.timerValueMs),
        ),
        averageMovesPerCompletedGame: average(
          completedStats.map((event) => event.moveCount),
        ),
        averageTotalPlayTimeMs: average(sessionDurations),
        autoPlayUsage: usageCounts.autoPlayUsage,
        completionRate:
          gamesStarted > 0 ? (gamesCompleted / gamesStarted) * 100 : 0,
        gamesCompleted,
        gamesStarted,
        leaderboardViews: usageCounts.leaderboardViews,
        peekImageUsage: usageCounts.peekImageUsage,
        replayUsage: usageCounts.replayUsage,
        signupClicks: usageCounts.signupClicks,
        totalAnonymousSessions: totalSessions,
      },
      recentEvents: visibleEvents.map((event) => ({
        ...event,
        eventName: canonicalEventName(event.eventName),
      })),
      nextCursor,
    };
  }

  private getAnalyticsWhere(query: AdminAnalyticsQuery) {
    const occurredAt: Prisma.DateTimeFilter = {};
    const from = parseDateFilter(query.dateFrom);
    const to = parseDateFilter(query.dateTo);
    if (from) {
      occurredAt.gte = from;
    }
    if (to) {
      occurredAt.lte = to;
    }

    const where: Prisma.AnonymousAnalyticsEventWhereInput = {
      ...(Object.keys(occurredAt).length > 0 ? { occurredAt } : {}),
      ...(query.boardSize ? { puzzleSize: query.boardSize } : {}),
      ...(query.eventName
        ? { eventName: { in: eventAliases[query.eventName] ?? [query.eventName] } }
        : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.sessionId ? { sessionId: query.sessionId } : {}),
    };

    return where;
  }

  private async countDistinctSessions(
    where: Prisma.AnonymousAnalyticsEventWhereInput,
  ) {
    const sessions = await this.prisma.anonymousAnalyticsEvent.groupBy({
      by: ['sessionId'],
      where,
    });

    return sessions.length;
  }

  private async getUsageCounts(where: Prisma.AnonymousAnalyticsEventWhereInput) {
    const counts = await this.prisma.anonymousAnalyticsEvent.groupBy({
      by: ['eventName'],
      _count: { _all: true },
      where: {
        ...where,
        eventName: {
          in: [
            'auto_play_started',
            'auto_play_completed',
            'peek_image_clicked',
            'full_image_peeked',
            'leaderboard_opened',
            'signup_clicked',
            'register_clicked',
          ],
        },
      },
    });
    const byName = new Map(
      counts.map((count) => [count.eventName, count._count._all]),
    );
    const sum = (names: string[]) =>
      names.reduce((total, name) => total + (byName.get(name) ?? 0), 0);

    return {
      autoPlayUsage: sum(['auto_play_started']),
      leaderboardViews: sum(['leaderboard_opened']),
      peekImageUsage: sum(['peek_image_clicked', 'full_image_peeked']),
      replayUsage: sum(['auto_play_completed']),
      signupClicks: sum(['signup_clicked', 'register_clicked']),
    };
  }

  private async getEventCounts(where: Prisma.AnonymousAnalyticsEventWhereInput) {
    const trendStart = new Date();
    trendStart.setUTCHours(0, 0, 0, 0);
    trendStart.setUTCDate(trendStart.getUTCDate() - 6);
    const [counts, trendEvents] = await Promise.all([
      this.prisma.anonymousAnalyticsEvent.groupBy({
        by: ['eventName'],
        _count: { _all: true },
        where: {
          ...where,
          eventName: { in: [...anonymousAnalyticsEventNames] },
        },
      }),
      this.prisma.anonymousAnalyticsEvent.findMany({
        orderBy: { occurredAt: 'desc' },
        select: {
          eventName: true,
          occurredAt: true,
        },
        take: 5000,
        where: {
          ...where,
          eventName: { in: [...anonymousAnalyticsEventNames] },
          occurredAt: {
            ...(typeof where.occurredAt === 'object' &&
            !Array.isArray(where.occurredAt)
              ? where.occurredAt
              : {}),
            gte: trendStart,
          },
        },
      }),
    ]);
    const byName = new Map<string, number>();
    for (const count of counts) {
      const name = canonicalEventName(count.eventName);
      byName.set(name, (byName.get(name) ?? 0) + count._count._all);
    }
    const trendDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(trendStart);
      date.setUTCDate(trendStart.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });
    const trendByName = new Map<string, Map<string, number>>();
    for (const event of trendEvents) {
      const name = canonicalEventName(event.eventName);
      const day = event.occurredAt.toISOString().slice(0, 10);
      const countsByDay = trendByName.get(name) ?? new Map<string, number>();
      countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
      trendByName.set(name, countsByDay);
    }

    return primaryEventNames.map((eventName) => ({
      count: byName.get(eventName) ?? 0,
      eventName,
      trend: trendDates.map(
        (day) => trendByName.get(eventName)?.get(day) ?? 0,
      ),
    }));
  }

  private async getSessionDurations(
    where: Prisma.AnonymousAnalyticsEventWhereInput,
  ) {
    const sessions = await this.prisma.anonymousAnalyticsEvent.groupBy({
      by: ['sessionId'],
      _max: { occurredAt: true },
      _min: { occurredAt: true },
      orderBy: { _max: { occurredAt: 'desc' } },
      take: 1000,
      where,
    });

    return sessions.map((session) => {
      const min = session._min.occurredAt?.getTime();
      const max = session._max.occurredAt?.getTime();
      return min === undefined || max === undefined ? null : max - min;
    });
  }
}
