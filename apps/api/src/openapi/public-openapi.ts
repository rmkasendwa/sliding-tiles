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
        background: #0d0f0f;
        font-family: var(--scalar-font);
      }

      .docs-brand {
        background:
          linear-gradient(135deg, rgba(19, 65, 53, 0.98), rgba(14, 29, 27, 0.98)),
          repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px 68px),
          repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 68px);
        border-bottom: 1px solid rgba(242, 201, 76, 0.75);
        box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.08);
        color: #fbfcf8;
      }

      .docs-brand-inner {
        align-items: center;
        display: flex;
        gap: clamp(18px, 4vw, 48px);
        justify-content: space-between;
        margin: 0 auto;
        max-width: 1280px;
        min-height: 118px;
        padding: 18px clamp(16px, 4vw, 44px);
      }

      .docs-brand-main {
        align-items: center;
        display: flex;
        gap: 16px;
        min-width: 0;
      }

      .docs-logo {
        background: #f7f0d5;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 10px;
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
        display: grid;
        flex: 0 0 auto;
        gap: 4px;
        grid-template-columns: repeat(2, 18px);
        grid-template-rows: repeat(2, 18px);
        padding: 8px;
      }

      .docs-logo span {
        align-items: center;
        background: #134135;
        border-radius: 5px;
        color: #f7f0d5;
        display: inline-flex;
        font-size: 0.78rem;
        font-weight: 850;
        justify-content: center;
        line-height: 1;
      }

      .docs-brand h1 {
        font-size: clamp(1.35rem, 3vw, 2.15rem);
        font-weight: 780;
        letter-spacing: 0;
        line-height: 1;
        margin: 0;
      }

      .docs-brand p {
        color: #dcebe5;
        font-size: clamp(0.92rem, 1.4vw, 1rem);
        line-height: 1.45;
        margin: 8px 0 0;
        max-width: 680px;
      }

      .docs-kicker {
        color: #f2c94c;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        margin: 0 0 8px;
        text-transform: uppercase;
      }

      .docs-meta {
        align-items: center;
        align-self: center;
        display: flex;
        flex: 0 0 auto;
        gap: 10px;
      }

      .docs-chip {
        align-items: center;
        background: rgba(251, 252, 248, 0.08);
        border: 1px solid rgba(251, 252, 248, 0.16);
        border-radius: 999px;
        color: #edf5f1;
        display: inline-flex;
        font-size: 0.82rem;
        font-weight: 650;
        gap: 8px;
        min-height: 34px;
        padding: 0 12px;
        white-space: nowrap;
      }

      .docs-chip::before {
        background: #34d399;
        border-radius: 999px;
        box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.14);
        content: "";
        height: 7px;
        width: 7px;
      }

      .docs-chip.secondary::before {
        background: #f2c94c;
        box-shadow: 0 0 0 4px rgba(242, 201, 76, 0.14);
      }

      @media (max-width: 760px) {
        .docs-brand-inner {
          align-items: flex-start;
          flex-direction: column;
          gap: 14px;
          min-height: 0;
        }

        .docs-brand-main {
          align-items: flex-start;
        }

        .docs-logo {
          grid-template-columns: repeat(2, 15px);
          grid-template-rows: repeat(2, 15px);
          padding: 7px;
        }

        .docs-logo span {
          font-size: 0.68rem;
        }

        .docs-meta {
          align-self: stretch;
          flex-wrap: wrap;
        }
      }
    </style>
  </head>
  <body>
    <header class="docs-brand">
      <div class="docs-brand-inner">
        <div class="docs-brand-main">
          <span class="docs-logo" aria-hidden="true">
            <span>1</span>
            <span>5</span>
            <span>2</span>
            <span>3</span>
          </span>
          <div>
            <p class="docs-kicker">Public Developer Reference</p>
            <h1>Sliding Tiles API</h1>
            <p>Integrate accounts, saved game state, completions, leaderboards, profiles, and privacy-conscious gameplay analytics.</p>
          </div>
        </div>
        <div class="docs-meta" aria-label="API metadata">
          <span class="docs-chip">v1.0.0</span>
          <span class="docs-chip secondary">OpenAPI 3.1</span>
        </div>
      </div>
    </header>
    <script id="api-reference" data-url="${specPath}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}
