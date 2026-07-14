import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { z } from 'zod';

import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../session/session.service';
import { anonymousAnalyticsBatchSchema } from '../shared/zod';

type AnonymousAnalyticsBatch = z.infer<
  typeof anonymousAnalyticsBatchSchema
>;

type RequestMetadata = {
  browser?: string;
  city?: string;
  country?: string;
  deviceType?: string;
  ipAddress?: string;
  operatingSystem?: string;
};

@Injectable()
export class AnonymousAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService?: SessionService,
  ) {}

  async recordBatch({ events }: AnonymousAnalyticsBatch, request?: Request) {
    const session = request
      ? await this.sessionService?.getSessionFromRequest(request)
      : null;
    const requestMetadata: RequestMetadata = request
      ? getRequestMetadata(request)
      : {};

    const result = await this.prisma.anonymousAnalyticsEvent.createMany({
      data: events.map((event) => {
        const userAgentMetadata = parseUserAgent(event.userAgent);

        return {
          anonymousId: event.anonymousId ?? '',
          browser: requestMetadata.browser ?? userAgentMetadata.browser,
          city: requestMetadata.city,
          country: requestMetadata.country,
          deviceType:
            requestMetadata.deviceType ?? userAgentMetadata.deviceType,
          eventName: event.eventName,
          ipAddress: requestMetadata.ipAddress,
          level: event.level,
          metadata: event.metadata as Prisma.InputJsonValue | undefined,
          moveCount: event.moveCount,
          occurredAt: new Date(event.timestamp),
          operatingSystem:
            requestMetadata.operatingSystem ??
            userAgentMetadata.operatingSystem,
          pathname: event.pathname,
          puzzleSize: event.puzzleSize,
          referrer: event.referrer,
          screenHeight: event.screenHeight,
          screenWidth: event.screenWidth,
          sessionId: event.sessionId,
          signedIn: Boolean(session),
          timerValueMs: event.timerValueMs,
          userId: session?.id,
          userAgent: event.userAgent,
        };
      }),
    });

    return { accepted: result.count };
  }
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function firstForwardedValue(value: string | string[] | undefined) {
  return firstHeader(value)?.split(',')[0]?.trim();
}

function getRequestMetadata(request: Request) {
  const userAgent = firstHeader(request.headers['user-agent']);
  const parsed = parseUserAgent(userAgent);

  return {
    ...parsed,
    city: firstHeader(request.headers['x-vercel-ip-city']),
    country:
      firstHeader(request.headers['x-vercel-ip-country']) ??
      firstHeader(request.headers['cf-ipcountry']),
    ipAddress:
      firstForwardedValue(request.headers['x-forwarded-for']) ??
      request.ip,
  };
}

function parseUserAgent(userAgent: string | undefined) {
  const value = userAgent ?? '';
  const lower = value.toLowerCase();

  return {
    browser: parseBrowser(value),
    deviceType: /ipad|tablet/.test(lower)
      ? 'tablet'
      : /mobile|iphone|android/.test(lower)
        ? 'mobile'
        : value
          ? 'desktop'
          : undefined,
    operatingSystem: parseOperatingSystem(value),
  };
}

function parseBrowser(userAgent: string) {
  if (/Edg\//.test(userAgent)) {
    return 'Edge';
  }
  if (/OPR\//.test(userAgent)) {
    return 'Opera';
  }
  if (/Chrome\//.test(userAgent) && !/Chromium\//.test(userAgent)) {
    return 'Chrome';
  }
  if (/Firefox\//.test(userAgent)) {
    return 'Firefox';
  }
  if (/Safari\//.test(userAgent) && /Version\//.test(userAgent)) {
    return 'Safari';
  }

  return userAgent ? 'Other' : undefined;
}

function parseOperatingSystem(userAgent: string) {
  if (/Windows NT/.test(userAgent)) {
    return 'Windows';
  }
  if (/Android/.test(userAgent)) {
    return 'Android';
  }
  if (/(iPhone|iPad|iPod)/.test(userAgent)) {
    return 'iOS';
  }
  if (/Mac OS X/.test(userAgent)) {
    return 'macOS';
  }
  if (/Linux/.test(userAgent)) {
    return 'Linux';
  }

  return userAgent ? 'Other' : undefined;
}
