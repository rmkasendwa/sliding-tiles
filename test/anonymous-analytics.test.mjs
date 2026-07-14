import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AnonymousAnalyticsService } from '../dist/api/anonymous-analytics/anonymous-analytics.service.js';
import { anonymousAnalyticsBatchSchema } from '../dist/api/shared/zod.js';

const validEvent = {
  anonymousId: '7242d01c-636b-42e9-84f1-ce1f75d5cf99',
  eventName: 'tile_dragged',
  level: 3,
  metadata: { input: 'drag' },
  moveCount: 12,
  pathname: '/play',
  puzzleSize: '4x4',
  referrer: 'https://example.com/',
  screenHeight: 900,
  screenWidth: 1440,
  sessionId: 'e3c512bd-2330-4d20-9e9e-10e1be9eeed6',
  timerValueMs: 42000,
  timestamp: '2026-06-13T12:00:00.000Z',
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
};

test('validates and stores anonymous gameplay event batches', async () => {
  const createManyCalls = [];
  const service = new AnonymousAnalyticsService({
    anonymousAnalyticsEvent: {
      createMany: async (input) => {
        createManyCalls.push(input);
        return { count: input.data.length };
      },
    },
  });
  const batch = anonymousAnalyticsBatchSchema.parse({
    events: [validEvent],
  });

  const result = await service.recordBatch(batch);

  assert.deepEqual(result, { accepted: 1 });
  assert.equal(createManyCalls.length, 1);
  const storedEvent = createManyCalls[0].data[0];
  assert.equal(storedEvent.anonymousId, validEvent.anonymousId);
  assert.equal(storedEvent.browser, 'Chrome');
  assert.equal(storedEvent.deviceType, 'desktop');
  assert.equal(storedEvent.eventName, 'tile_dragged');
  assert.equal(storedEvent.level, 3);
  assert.deepEqual(storedEvent.metadata, { input: 'drag' });
  assert.equal(storedEvent.moveCount, 12);
  assert.deepEqual(storedEvent.occurredAt, new Date(validEvent.timestamp));
  assert.equal(storedEvent.operatingSystem, 'macOS');
  assert.equal(storedEvent.pathname, '/play');
  assert.equal(storedEvent.puzzleSize, '4x4');
  assert.equal(storedEvent.referrer, 'https://example.com/');
  assert.equal(storedEvent.screenHeight, 900);
  assert.equal(storedEvent.screenWidth, 1440);
  assert.equal(storedEvent.sessionId, validEvent.sessionId);
  assert.equal(storedEvent.signedIn, false);
  assert.equal(storedEvent.timerValueMs, 42000);
  assert.equal(storedEvent.userAgent, validEvent.userAgent);
});

test('accepts legacy anonymousPlayerId payloads', () => {
  const result = anonymousAnalyticsBatchSchema.safeParse({
    events: [
      {
        ...validEvent,
        anonymousId: undefined,
        anonymousPlayerId: validEvent.anonymousId,
      },
    ],
  });

  assert.equal(result.success, true);
  assert.equal(result.data.events[0].anonymousId, validEvent.anonymousId);
});

test('associates authenticated batches with the session user', async () => {
  const createManyCalls = [];
  const service = new AnonymousAnalyticsService(
    {
      anonymousAnalyticsEvent: {
        createMany: async (input) => {
          createManyCalls.push(input);
          return { count: input.data.length };
        },
      },
    },
    {
      getSessionFromRequest: async () => ({ id: 'user_123' }),
    },
  );
  const batch = anonymousAnalyticsBatchSchema.parse({
    events: [{ ...validEvent, eventName: 'login_completed' }],
  });

  await service.recordBatch(batch, {
    headers: {
      'cf-ipcountry': 'UG',
      'user-agent': validEvent.userAgent,
      'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      'x-vercel-ip-city': 'Kampala',
    },
    ip: '127.0.0.1',
  });

  const storedEvent = createManyCalls[0].data[0];
  assert.equal(storedEvent.city, 'Kampala');
  assert.equal(storedEvent.country, 'UG');
  assert.equal(storedEvent.ipAddress, '203.0.113.10');
  assert.equal(storedEvent.signedIn, true);
  assert.equal(storedEvent.userId, 'user_123');
});

test('rejects personal or unknown analytics fields', () => {
  const result = anonymousAnalyticsBatchSchema.safeParse({
    events: [{ ...validEvent, email: 'player@example.com' }],
  });

  assert.equal(result.success, false);
});

test('rejects unsupported event names and oversized batches', () => {
  assert.equal(
    anonymousAnalyticsBatchSchema.safeParse({
      events: [{ ...validEvent, eventName: 'email_captured' }],
    }).success,
    false,
  );
  assert.equal(
    anonymousAnalyticsBatchSchema.safeParse({
      events: Array.from({ length: 51 }, () => validEvent),
    }).success,
    false,
  );
});
