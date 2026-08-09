import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AdminService } from '../dist/api/admin/admin.service.js';

test('records promoter audit fields when promoting an admin', async () => {
  const calls = [];
  const service = new AdminService({
    user: {
      findUnique: async () => ({ id: 'target-user', role: 'USER' }),
      update: async (input) => {
        calls.push(input);
        return {
          createdAt: new Date('2026-06-20T10:00:00.000Z'),
          email: 'target@example.com',
          id: 'target-user',
          name: 'Target User',
          promotedAt: input.data.promotedAt,
          promotedBy: null,
          role: input.data.role,
          username: 'target',
        };
      },
    },
  });

  const result = await service.updateUserRole(
    'actor-admin',
    'target-user',
    'ADMIN',
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].data.role, 'ADMIN');
  assert.equal(calls[0].data.promotedById, 'actor-admin');
  assert.ok(calls[0].data.promotedAt instanceof Date);
  assert.equal(result.user.role, 'ADMIN');
});

test('clears promoter audit fields when demoting an admin', async () => {
  const calls = [];
  const service = new AdminService({
    user: {
      findUnique: async () => ({ id: 'target-admin', role: 'ADMIN' }),
      update: async (input) => {
        calls.push(input);
        return {
          createdAt: new Date('2026-06-20T10:00:00.000Z'),
          email: 'target@example.com',
          id: 'target-admin',
          name: 'Target User',
          promotedAt: input.data.promotedAt,
          promotedBy: null,
          role: input.data.role,
          username: 'target',
        };
      },
    },
  });

  await service.updateUserRole('actor-admin', 'target-admin', 'USER');

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].data, {
    promotedAt: null,
    promotedById: null,
    role: 'USER',
  });
});

test('summarizes Google auth analytics for the admin dashboard', async () => {
  const events = [
    {
      eventName: 'google_auth_started',
      metadata: { entryPoint: 'login', previouslyPlayingAnonymously: true },
      occurredAt: new Date('2026-08-09T10:00:00.000Z'),
    },
    {
      eventName: 'google_auth_started',
      metadata: { entryPoint: 'signup', previouslyPlayingAnonymously: false },
      occurredAt: new Date('2026-08-09T10:01:00.000Z'),
    },
    {
      eventName: 'google_auth_completed',
      metadata: {
        anonymousProgressExisted: true,
        entryPoint: 'login',
        outcome: 'existing_google_account',
      },
      occurredAt: new Date('2026-08-09T10:02:00.000Z'),
    },
    {
      eventName: 'google_auth_completed',
      metadata: {
        anonymousProgressExisted: false,
        entryPoint: 'signup',
        outcome: 'new_account',
      },
      occurredAt: new Date('2026-08-09T10:03:00.000Z'),
    },
    {
      eventName: 'google_auth_failed',
      metadata: { entryPoint: 'login', failureCategory: 'invalid_state' },
      occurredAt: new Date('2026-08-09T10:04:00.000Z'),
    },
  ];
  const service = new AdminService({
    anonymousAnalyticsEvent: {
      count: async () => 0,
      findMany: async (input) => {
        if (input.select?.metadata && !input.select?.id) {
          return events;
        }

        return [];
      },
      groupBy: async (input) => {
        if (input.by?.includes('eventName')) {
          return [];
        }

        return [];
      },
    },
  });

  const analytics = await service.getAnalytics({ take: 5 });

  assert.equal(analytics.googleAuth.started, 2);
  assert.equal(analytics.googleAuth.completed, 2);
  assert.equal(analytics.googleAuth.failed, 1);
  assert.equal(analytics.googleAuth.successRate, 100);
  assert.equal(analytics.googleAuth.startedByEntryPoint.login, 1);
  assert.equal(analytics.googleAuth.startedByEntryPoint.signup, 1);
  assert.equal(analytics.googleAuth.anonymousProgressCompletions, 1);
  assert.equal(analytics.googleAuth.outcomes.new_account, 1);
  assert.equal(analytics.googleAuth.outcomes.existing_google_account, 1);
  assert.equal(analytics.googleAuth.failureCategories.invalid_state, 1);
});
