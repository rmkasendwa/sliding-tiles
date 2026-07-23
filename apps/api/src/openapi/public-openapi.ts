import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { AnonymousAnalyticsModule } from '../anonymous-analytics/anonymous-analytics.module';
import { AuthModule } from '../auth/auth.module';
import { GameStateModule } from '../game-state/game-state.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { ProfileModule } from '../profile/profile.module';
import { SESSION_COOKIE_NAME } from '../session/session.constants';
import { publicApiSchemas } from './public-openapi.metadata';

const specPath = '/openapi.json';
const apiSpecPath = '/api/openapi.json';
const docsPaths = ['/', '/docs', '/api-docs'];
const faviconPaths = [
  join(process.cwd(), 'apps/web/public/favicon.ico'),
  join(process.cwd(), 'public/favicon.ico'),
];

function getDocsFaviconHref() {
  const webBaseUrl = (
    process.env.WEB_BASE_URL ??
    process.env.NEXT_PUBLIC_WEB_BASE_URL ??
    ''
  )
    .trim()
    .replace(/\/$/, '');

  return webBaseUrl ? `${webBaseUrl}/favicon.ico` : '/favicon.ico';
}

function getApiServerUrl() {
  return (process.env.API_BASE_URL ?? 'http://localhost:4001')
    .trim()
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
}

export function createPublicOpenApiDocument(
  app: INestApplication,
): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Sliding Tiles API')
    .setDescription(
      'Public API for Sliding Tiles accounts, saved game state, leaderboard completions, profile data, and privacy-conscious anonymous gameplay analytics. Admin and internal routes are intentionally omitted.',
    )
    .setVersion('1.0.0')
    .addServer(getApiServerUrl(), 'Configured API server')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        scheme: 'bearer',
        type: 'http',
      },
      'bearerAuth',
    )
    .addCookieAuth(
      SESSION_COOKIE_NAME,
      {
        in: 'cookie',
        type: 'apiKey',
      },
      'sessionCookie',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: [],
    include: [
      AnonymousAnalyticsModule,
      AuthModule,
      GameStateModule,
      LeaderboardModule,
      ProfileModule,
    ],
  });

  document.components = {
    ...document.components,
    schemas: {
      ...publicApiSchemas,
      ...document.components?.schemas,
    },
  };

  document.openapi = '3.1.0';
  (document as OpenAPIObject & { jsonSchemaDialect: string })
    .jsonSchemaDialect = 'https://json-schema.org/draft/2020-12/schema';

  return document;
}

export function registerOpenApiDocs(app: INestApplication) {
  const server = app.getHttpAdapter().getInstance() as {
    get: (
      path: string,
      handler: (request: Request, response: Response) => void,
    ) => void;
  };

  const sendSpec = (_request: Request, response: Response) => {
    response.json(createPublicOpenApiDocument(app));
  };
  server.get(specPath, sendSpec);
  server.get(apiSpecPath, sendSpec);
  server.get('/favicon.ico', (_request: Request, response: Response) => {
    const faviconPath = faviconPaths.find((path) => existsSync(path));

    if (!faviconPath) {
      response.sendStatus(404);
      return;
    }

    response.type('image/x-icon').sendFile(faviconPath);
  });

  docsPaths.forEach((path) => {
    server.get(path, (_request: Request, response: Response) => {
      response.type('html').send(renderDocsHtml());
    });
  });
}

function renderDocsHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sliding Tiles API Docs</title>
    <link rel="icon" href="${getDocsFaviconHref()}" sizes="any" />
    <style>
      :root {
        color-scheme: light;
        --scalar-color-accent: #16825d;
        --scalar-color-1: #17211d;
        --scalar-font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        margin: 0;
        background: #fbfcf8;
      }

      .docs-brand {
        align-items: center;
        background: #12352c;
        border-bottom: 4px solid #f2c94c;
        color: #fbfcf8;
        display: flex;
        gap: 14px;
        min-height: 72px;
        padding: 14px clamp(16px, 4vw, 40px);
      }

      .docs-logo {
        align-items: center;
        background: #fbfcf8;
        border-radius: 8px;
        color: #12352c;
        display: inline-flex;
        font-size: 28px;
        font-weight: 900;
        height: 44px;
        justify-content: center;
        line-height: 1;
        width: 44px;
      }

      .docs-brand h1 {
        font-size: clamp(1.15rem, 2vw, 1.55rem);
        line-height: 1.1;
        margin: 0;
      }

      .docs-brand p {
        color: #d8efe5;
        font-size: 0.95rem;
        margin: 4px 0 0;
      }

      @media (max-width: 560px) {
        .docs-brand {
          align-items: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <header class="docs-brand">
      <span class="docs-logo">15</span>
      <div>
        <h1>Sliding Tiles API</h1>
        <p>Public integration docs for accounts, game state, completions, leaderboards, and analytics.</p>
      </div>
    </header>
    <script id="api-reference" data-url="${specPath}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}
