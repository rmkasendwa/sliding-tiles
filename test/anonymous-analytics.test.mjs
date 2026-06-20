import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AnonymousAnalyticsService } from '../dist/api/anonymous-analytics/anonymous-analytics.service.js';
import { anonymousAnalyticsBatchSchema } from '../dist/api/shared/zod.js';

const validEvent = {
  anonymousPlayerId: '7242d01c-636b-42e9-84f1-ce1f75d5cf99',
  eventName: 'tile_dragged',
  level: 3,
  moveCount: 12,
  puzzleSize: '4x4',
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
  assert.deepEqual(createManyCalls[0].data[0], {
    anonymousPlayerId: validEvent.anonymousPlayerId,
    eventName: 'tile_dragged',
    level: 3,
    moveCount: 12,
    occurredAt: new Date(validEvent.timestamp),
    puzzleSize: '4x4',
    screenHeight: 900,
    screenWidth: 1440,
    sessionId: validEvent.sessionId,
    timerValueMs: 42000,
    userAgent: validEvent.userAgent,
  });
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
