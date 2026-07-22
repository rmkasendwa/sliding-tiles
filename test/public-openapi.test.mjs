import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPublicOpenApiSpec } from '../dist/api/openapi/public-openapi.js';

test('documents only the public Sliding Tiles API surface', () => {
  const spec = buildPublicOpenApiSpec();
  const paths = Object.keys(spec.paths);

  assert.equal(spec.openapi, '3.1.0');
  assert.ok(paths.includes('/api/auth/login'));
  assert.ok(paths.includes('/api/game-state'));
  assert.ok(paths.includes('/api/leaderboard/completions'));
  assert.ok(paths.includes('/api/anonymous-analytics/events'));
  assert.equal(paths.some((path) => path.startsWith('/api/admin')), false);
});

test('marks authenticated public endpoints and keeps schemas close to validators', () => {
  const spec = buildPublicOpenApiSpec();

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
