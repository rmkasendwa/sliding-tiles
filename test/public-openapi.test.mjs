import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../dist/api/app.module.js';
import { createPublicOpenApiDocument } from '../dist/api/openapi/public-openapi.js';

async function createSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  const spec = createPublicOpenApiDocument(app);
  await app.close();
  return spec;
}

test('documents only the public Sliding Tiles API surface', async () => {
  process.env.API_BASE_URL = 'https://api.example.test/api';
  const spec = await createSpec();
  const paths = Object.keys(spec.paths);

  assert.equal(spec.openapi, '3.1.0');
  assert.deepEqual(
    spec.servers.map((server) => server.url),
    ['https://api.example.test'],
  );
  assert.ok(paths.includes('/api/auth/login'));
  assert.ok(paths.includes('/api/game-state'));
  assert.ok(paths.includes('/api/leaderboard/completions'));
  assert.ok(paths.includes('/api/anonymous-analytics/events'));
  assert.equal(paths.some((path) => path.startsWith('/api/admin')), false);
});

test('marks authenticated public endpoints and keeps schemas close to validators', async () => {
  const spec = await createSpec();

  assert.deepEqual(spec.paths['/api/game-state'].get.security, [
    { bearerAuth: [] },
    { sessionCookie: [] },
  ]);
  assert.equal(
    spec.components.securitySchemes.sessionCookie.name,
    'sliding_tiles_session',
  );
  assert.equal(
    spec.components.schemas.RegisterRequest.properties.username.pattern,
    '^[a-zA-Z0-9_]+$',
  );
  assert.equal(
    spec.components.schemas.AnonymousAnalyticsBatchRequest.properties.events
      .maxItems,
    50,
  );
});
