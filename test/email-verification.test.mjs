import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import { BadRequestException, HttpException } from '@nestjs/common';

import { AuthService } from '../dist/api/auth/auth.service.js';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function createVerificationService({
  emailVerifiedAt = null,
  expiresAt = new Date(Date.now() + 60_000),
  token = 'valid-token',
  verificationEmailSentAt = null,
} = {}) {
  const user = {
    email: 'player@example.com',
    emailVerifiedAt,
    emailVerificationTokenExpiresAt: expiresAt,
    emailVerificationTokenHash: hashToken(token),
    id: 'user-1',
    name: 'Player One',
    username: 'player_one',
    verificationEmailSentAt,
  };
  const sentEmails = [];
  const prisma = {
    user: {
      findFirst: async ({ where }) => {
        const validHash =
          where.emailVerificationTokenHash ===
          user.emailVerificationTokenHash;
        const validExpiry =
          user.emailVerificationTokenExpiresAt &&
          user.emailVerificationTokenExpiresAt > where.emailVerificationTokenExpiresAt.gt;

        return validHash && validExpiry && !user.emailVerifiedAt ? user : null;
      },
      findUnique: async () => user,
      update: async ({ data }) => {
        Object.assign(user, data);
        return user;
      },
      updateMany: async ({ data, where }) => {
        if (where.emailVerificationTokenHash) {
          if (
            where.emailVerificationTokenHash !==
            user.emailVerificationTokenHash
          ) {
            return { count: 0 };
          }
        } else if (
          user.emailVerifiedAt ||
          (user.verificationEmailSentAt &&
            user.verificationEmailSentAt >
              where.OR[1].verificationEmailSentAt.lte)
        ) {
          return { count: 0 };
        }

        Object.assign(user, data);
        return { count: 1 };
      },
    },
  };
  const emailService = {
    sendEmailVerification: async (message) => {
      sentEmails.push(message);
    },
  };

  return {
    sentEmails,
    service: new AuthService(prisma, emailService),
    user,
  };
}

test('verifies a valid email token and consumes it', async () => {
  const { service, user } = createVerificationService();

  const sessionUser = await service.verifyEmail('valid-token');

  assert.equal(sessionUser.emailVerified, true);
  assert.ok(user.emailVerifiedAt instanceof Date);
  assert.equal(user.emailVerificationTokenHash, null);
  assert.equal(user.emailVerificationTokenExpiresAt, null);
});

test('rejects expired or already-used email verification tokens', async () => {
  const expired = createVerificationService({
    expiresAt: new Date(Date.now() - 1_000),
  });
  await assert.rejects(
    expired.service.verifyEmail('valid-token'),
    BadRequestException,
  );

  const verified = createVerificationService({
    emailVerifiedAt: new Date(),
  });
  await assert.rejects(
    verified.service.verifyEmail('valid-token'),
    BadRequestException,
  );
});

test('resends verification email and rate limits repeated requests', async () => {
  const { sentEmails, service, user } = createVerificationService();

  const result = await service.resendVerificationEmail(user.id);

  assert.equal(result.alreadyVerified, false);
  assert.equal(sentEmails.length, 1);
  assert.match(sentEmails[0].verificationLink, /verify-email\?token=/);

  await assert.rejects(
    service.resendVerificationEmail(user.id),
    (error) => error instanceof HttpException && error.getStatus() === 429,
  );
});
