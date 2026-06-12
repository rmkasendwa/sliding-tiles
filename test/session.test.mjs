import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decodeJwt, SignJWT } from 'jose';

import { SessionService } from '../dist/api/session/session.service.js';

const SESSION_SECRET = 'test-session-secret-that-is-at-least-32-characters';

function createService(user) {
  const prisma = {
    user: {
      findUnique: async ({ where }) => (where.id === user?.id ? user : null),
    },
  };

  return new SessionService(prisma);
}

test('issues minimal session tokens without user profile data', async () => {
  process.env.SESSION_SECRET = SESSION_SECRET;
  const service = createService(null);
  const { token } = await service.createSession({
    avatarUrl: 'https://example.com/avatar.png',
    email: 'player@example.com',
    emailVerified: false,
    id: 'user-1',
    name: 'Player One',
    username: 'player_one',
  });

  const payload = decodeJwt(token);

  assert.equal(payload.sub, 'user-1');
  assert.equal(payload.email, undefined);
  assert.equal(payload.emailVerified, undefined);
  assert.equal(payload.name, undefined);
  assert.equal(payload.username, undefined);
});

test('hydrates current user state for an existing token', async () => {
  process.env.SESSION_SECRET = SESSION_SECRET;
  const user = {
    email: 'player@example.com',
    emailVerifiedAt: null,
    id: 'user-1',
    name: 'Player One',
    username: 'player_one',
  };
  const service = createService(user);
  const token = await new SignJWT({
    email: user.email,
    emailVerified: false,
    id: user.id,
    name: user.name,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(SESSION_SECRET));

  user.emailVerifiedAt = new Date();
  user.name = 'Updated Player';

  const session = await service.verifySessionToken(token);

  assert.equal(session?.emailVerified, true);
  assert.equal(session?.name, 'Updated Player');
});
