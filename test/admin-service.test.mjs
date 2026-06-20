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
