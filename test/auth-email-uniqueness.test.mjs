import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuthService } from '../dist/api/auth/auth.service.js';

const EMAIL_EXISTS_MESSAGE =
  'An account with this email address already exists.';

function uniqueEmailError(target = 'users_email_lower_key') {
  return new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on email',
    {
      clientVersion: 'test',
      code: 'P2002',
      meta: { target },
    },
  );
}

function createAuthService({
  createThrows,
  existingEmails = [],
} = {}) {
  const users = new Map(
    existingEmails.map((email, index) => [
      email.trim().toLowerCase(),
      { id: `existing-${index + 1}` },
    ]),
  );
  const createCalls = [];
  const prisma = {
    user: {
      create: async ({ data, select }) => {
        createCalls.push({ data, select });
        if (createThrows) {
          throw createThrows;
        }

        const normalizedEmail = data.email.trim().toLowerCase();
        if (users.has(normalizedEmail)) {
          throw uniqueEmailError();
        }

        users.set(normalizedEmail, { id: `user-${users.size + 1}` });
        return {
          email: data.email,
          id: `user-${users.size}`,
          name: data.name,
          username: data.username,
        };
      },
      findFirst: async ({ where }) => {
        const email = where.email?.trim().toLowerCase();
        return email && users.has(email) ? users.get(email) : null;
      },
    },
  };

  return {
    createCalls,
    service: new AuthService(prisma),
  };
}

async function expectEmailConflict(promise) {
  await assert.rejects(
    promise,
    (error) => {
      assert.ok(error instanceof ConflictException);
      assert.deepEqual(error.getResponse(), {
        errors: {
          email: [EMAIL_EXISTS_MESSAGE],
        },
        message: 'Request validation failed.',
      });
      return true;
    },
  );
}

test('registers a user with a new normalized email', async () => {
  const { createCalls, service } = createAuthService();

  const user = await service.signup({
    email: ' NewUser@Example.COM ',
    name: 'New User',
    password: 'password123',
    username: 'New_User',
  });

  assert.equal(user.email, 'newuser@example.com');
  assert.equal(user.username, 'new_user');
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].data.email, 'newuser@example.com');
});

test('rejects signup when the normalized email already exists', async () => {
  const { createCalls, service } = createAuthService({
    existingEmails: ['user@example.com'],
  });

  await expectEmailConflict(
    service.signup({
      email: 'user@example.com',
      name: 'Duplicate User',
      password: 'password123',
      username: 'duplicate_user',
    }),
  );

  assert.equal(createCalls.length, 0);
});

test('treats email duplicates case-insensitively', async () => {
  const { createCalls, service } = createAuthService({
    existingEmails: ['user@example.com'],
  });

  await expectEmailConflict(
    service.signup({
      email: 'USER@EXAMPLE.COM',
      name: 'Case Duplicate',
      password: 'password123',
      username: 'case_duplicate',
    }),
  );

  assert.equal(createCalls.length, 0);
});

test('maps database unique email conflicts to signup validation errors', async () => {
  const { createCalls, service } = createAuthService({
    createThrows: uniqueEmailError(),
  });

  await expectEmailConflict(
    service.signup({
      email: 'race@example.com',
      name: 'Race User',
      password: 'password123',
      username: 'race_user',
    }),
  );

  assert.equal(createCalls.length, 1);
});

test('migration enforces a case-insensitive unique email index', async () => {
  const migration = await readFile(
    'prisma/migrations/20260603120000_enforce_case_insensitive_unique_user_emails/migration.sql',
    'utf8',
  );

  assert.match(migration, /CREATE UNIQUE INDEX users_email_lower_key/i);
  assert.match(migration, /LOWER\(email\)/i);
});
