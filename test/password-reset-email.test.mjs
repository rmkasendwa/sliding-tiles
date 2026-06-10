import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import { AuthService } from '../dist/api/auth/auth.service.js';
import { EmailService } from '../dist/api/email/email.service.js';

function createPasswordResetService({ deliveryError, userExists = true } = {}) {
  const user = {
    email: 'player@example.com',
    id: 'user-1',
    name: 'Player One',
    username: 'player_one',
  };
  const sentEmails = [];
  const updates = [];
  const prisma = {
    user: {
      findFirst: async () => (userExists ? user : null),
      update: async ({ data }) => {
        updates.push(data);
        return user;
      },
    },
  };
  const emailService = {
    sendPasswordReset: async (message) => {
      sentEmails.push(message);
      if (deliveryError) {
        throw deliveryError;
      }
    },
  };

  return {
    sentEmails,
    service: new AuthService(prisma, emailService),
    updates,
  };
}

test('creates a password reset token and sends a reset email', async () => {
  const previousWebBaseUrl = process.env.WEB_BASE_URL;
  process.env.WEB_BASE_URL = 'https://sliding-tiles.example/';

  try {
    const { sentEmails, service, updates } = createPasswordResetService();

    await service.forgotPassword({ identifier: 'player@example.com' });

    assert.equal(updates.length, 1);
    assert.equal(sentEmails.length, 1);
    assert.equal(sentEmails[0].email, 'player@example.com');
    assert.equal(sentEmails[0].name, 'Player One');
    assert.equal(sentEmails[0].expiresInMinutes, 30);
    assert.match(
      sentEmails[0].resetLink,
      /^https:\/\/sliding-tiles\.example\/reset-password\?token=[a-f0-9]{64}$/,
    );

    const token = new URL(sentEmails[0].resetLink).searchParams.get('token');
    assert.equal(
      updates[0].resetPasswordTokenHash,
      createHash('sha256').update(token).digest('hex'),
    );
    assert.ok(
      updates[0].resetPasswordTokenExpiresAt.getTime() > Date.now(),
    );
  } finally {
    if (previousWebBaseUrl === undefined) {
      delete process.env.WEB_BASE_URL;
    } else {
      process.env.WEB_BASE_URL = previousWebBaseUrl;
    }
  }
});

test('does not send an email or reveal that an account is missing', async () => {
  const { sentEmails, service, updates } = createPasswordResetService({
    userExists: false,
  });

  const result = await service.forgotPassword({
    identifier: 'missing@example.com',
  });

  assert.equal(result, undefined);
  assert.equal(sentEmails.length, 0);
  assert.equal(updates.length, 0);
});

test('logs password reset delivery failures without failing the request', async () => {
  const deliveryError = new Error('Provider unavailable');
  const originalConsoleError = console.error;
  const loggedErrors = [];
  console.error = (...args) => loggedErrors.push(args);

  try {
    const { service } = createPasswordResetService({ deliveryError });

    const result = await service.forgotPassword({
      identifier: 'player@example.com',
    });

    assert.equal(result, undefined);
    assert.equal(loggedErrors.length, 1);
    assert.match(loggedErrors[0][0], /delivery failed for user user-1/i);
    assert.equal(loggedErrors[0][1], deliveryError);
  } finally {
    console.error = originalConsoleError;
  }
});

test('password reset template contains branded reset instructions', () => {
  const emailService = new EmailService();
  const message = {
    expiresInMinutes: 30,
    name: 'Player <One>',
    resetLink: 'https://example.com/reset-password?token=abc&next=<home>',
  };

  const html = emailService.buildPasswordResetHtml(message);
  const text = emailService.buildPasswordResetText(message);

  assert.match(html, /SLIDING TILES/);
  assert.match(html, /Reset your password/);
  assert.match(html, /expires in 30 minutes/i);
  assert.match(html, /safely ignore this email/i);
  assert.match(html, /Player &lt;One&gt;/);
  assert.match(html, /token=abc&amp;next=&lt;home&gt;/);

  assert.match(text, /reset your Sliding Tiles password/i);
  assert.match(text, /https:\/\/example\.com\/reset-password\?token=abc/);
  assert.match(text, /expires in 30 minutes/i);
  assert.match(text, /ignore this email/i);
});

test('sends password reset email through Resend with configured sender', async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousFromEmail = process.env.RESEND_FROM_EMAIL;
  process.env.RESEND_API_KEY = 'test-api-key';
  process.env.RESEND_FROM_EMAIL = 'Sliding Tiles <accounts@example.com>';

  try {
    const emailService = new EmailService();
    const providerMessages = [];
    emailService.createClient = () => ({
      emails: {
        send: async (message) => {
          providerMessages.push(message);
          return { data: { id: 'email-1' }, error: null };
        },
      },
    });

    await emailService.sendPasswordReset({
      email: 'player@example.com',
      expiresInMinutes: 30,
      name: 'Player One',
      resetLink: 'https://example.com/reset-password?token=abc',
    });

    assert.equal(providerMessages.length, 1);
    assert.equal(
      providerMessages[0].subject,
      'Reset your Sliding Tiles password',
    );
    assert.equal(
      providerMessages[0].from,
      'Sliding Tiles <accounts@example.com>',
    );
    assert.deepEqual(providerMessages[0].to, ['player@example.com']);
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previousApiKey;
    }
    if (previousFromEmail === undefined) {
      delete process.env.RESEND_FROM_EMAIL;
    } else {
      process.env.RESEND_FROM_EMAIL = previousFromEmail;
    }
  }
});
