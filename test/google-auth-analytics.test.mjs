import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { AuthService } from '../dist/api/auth/auth.service.js';

const previousEnv = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  WEB_BASE_URL: process.env.WEB_BASE_URL,
};
const originalFetch = globalThis.fetch;

const googleUser = {
  email: 'player@example.com',
  emailVerifiedAt: new Date('2026-08-01T00:00:00.000Z'),
  id: 'user_123',
  name: 'Player One',
  role: 'USER',
  username: 'player',
};

function response(body) {
  return {
    json: async () => body,
    ok: true,
  };
}

function installGoogleFetch() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ init, url: String(url) });
    if (String(url).includes('/token')) {
      return response({ access_token: 'access-token' });
    }

    return response({
      email: googleUser.email,
      email_verified: true,
      name: googleUser.name,
      sub: 'google-subject',
    });
  };
  return calls;
}

function createService(prisma) {
  return new AuthService(prisma, {
    sendEmailVerification: async () => {},
  });
}

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = 'client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
  process.env.WEB_BASE_URL = 'https://sliding-tiles.example';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

test('classifies Google login for an existing Google account', async () => {
  installGoogleFetch();
  const service = createService({
    oAuthAccount: {
      findUnique: async () => ({ user: googleUser }),
    },
  });

  const result = await service.loginWithGoogle('authorization-code');

  assert.equal(result.outcome, 'existing_google_account');
  assert.equal(result.user.id, googleUser.id);
});

test('classifies Google login when linking an existing password account', async () => {
  installGoogleFetch();
  const createCalls = [];
  const service = createService({
    oAuthAccount: {
      create: async (input) => {
        createCalls.push(input);
        return {};
      },
      findUnique: async () => null,
    },
    user: {
      findFirst: async () => googleUser,
      update: async () => googleUser,
    },
  });

  const result = await service.loginWithGoogle('authorization-code');

  assert.equal(result.outcome, 'linked_existing_account');
  assert.equal(createCalls[0].data.provider, 'google');
  assert.equal(createCalls[0].data.userId, googleUser.id);
});

test('classifies Google login when creating a new account', async () => {
  installGoogleFetch();
  const service = createService({
    oAuthAccount: {
      findUnique: async () => null,
    },
    user: {
      create: async ({ data }) => ({
        ...googleUser,
        email: data.email,
        name: data.name,
        username: data.username,
      }),
      findFirst: async () => null,
    },
  });

  const result = await service.loginWithGoogle('authorization-code');

  assert.equal(result.outcome, 'new_account');
  assert.equal(result.user.email, 'player@example.com');
});
