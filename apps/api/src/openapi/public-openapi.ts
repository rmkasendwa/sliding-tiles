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
  return (
    process.env.PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    'http://localhost:4001'
  )
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
          radial-gradient(circle at 82% 22%, rgba(242, 201, 76, 0.22), transparent 26%),
          radial-gradient(circle at 18% 88%, rgba(52, 211, 153, 0.16), transparent 30%),
          linear-gradient(135deg, rgba(19, 65, 53, 0.98), rgba(14, 29, 27, 0.98)),
          repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px 68px),
          repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 68px);
        border-bottom: 1px solid rgba(242, 201, 76, 0.75);
        box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.08);
        color: #fbfcf8;
        overflow: hidden;
        position: relative;
      }

      .docs-brand::before,
      .docs-brand::after {
        content: "";
        pointer-events: none;
        position: absolute;
      }

      .docs-brand::before {
        background:
          linear-gradient(90deg, transparent, rgba(242, 201, 76, 0.75), transparent),
          linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.45), transparent);
        height: 1px;
        left: 46%;
        opacity: 0.85;
        top: 56%;
        transform: rotate(-14deg);
        width: 360px;
      }

      .docs-brand::after {
        background:
          linear-gradient(135deg, rgba(251, 252, 248, 0.14) 25%, transparent 25%) 0 0 / 44px 44px,
          linear-gradient(135deg, transparent 74%, rgba(251, 252, 248, 0.08) 74%) 0 0 / 44px 44px;
        height: 180px;
        opacity: 0.45;
        right: -44px;
        top: -30px;
        transform: rotate(-8deg);
        width: 360px;
      }

      .docs-brand-inner {
        align-items: center;
        display: flex;
        gap: clamp(18px, 4vw, 48px);
        justify-content: space-between;
        margin: 0 auto;
        max-width: 1280px;
        min-height: 142px;
        padding: 18px clamp(16px, 4vw, 44px);
        position: relative;
        z-index: 1;
      }

      .docs-brand-main {
        align-items: center;
        display: flex;
        gap: 16px;
        min-width: 0;
      }

      .docs-logo {
        background: rgba(247, 240, 213, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 12px;
        box-shadow:
          0 20px 44px rgba(0, 0, 0, 0.32),
          inset 0 1px 0 rgba(255, 255, 255, 0.72);
        display: grid;
        flex: 0 0 auto;
        gap: 4px;
        grid-template-columns: repeat(3, 17px);
        grid-template-rows: repeat(3, 17px);
        padding: 7px;
        transform: rotate(-3deg);
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

      .docs-logo span:nth-child(2),
      .docs-logo span:nth-child(5) {
        background: #16825d;
      }

      .docs-logo span:nth-child(3) {
        background: #f2c94c;
        color: #12352c;
      }

      .docs-logo span:nth-child(9) {
        background: transparent;
        border: 1px dashed rgba(19, 65, 53, 0.45);
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
        display: grid;
        flex: 0 0 min(36vw, 420px);
        gap: 12px;
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

      .docs-route-card {
        background: rgba(13, 15, 15, 0.42);
        border: 1px solid rgba(251, 252, 248, 0.14);
        border-radius: 12px;
        box-shadow:
          0 18px 44px rgba(0, 0, 0, 0.24),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
        display: grid;
        gap: 8px;
        padding: 12px;
      }

      .docs-route {
        align-items: center;
        color: #dcebe5;
        display: grid;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 0.76rem;
        gap: 8px;
        grid-template-columns: auto 1fr;
        min-width: 0;
      }

      .docs-method {
        border-radius: 6px;
        color: #12352c;
        font-family: var(--scalar-font);
        font-size: 0.64rem;
        font-weight: 850;
        padding: 4px 7px;
      }

      .docs-method.get {
        background: #67e8f9;
      }

      .docs-method.post {
        background: #34d399;
      }

      .docs-method.patch {
        background: #f2c94c;
      }

      .docs-route-path {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .docs-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
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
          grid-template-columns: repeat(3, 14px);
          grid-template-rows: repeat(3, 14px);
          transform: none;
        }

        .docs-logo span {
          font-size: 0.68rem;
        }

        .docs-meta {
          align-self: stretch;
          flex: 1 1 auto;
          width: 100%;
        }

        .docs-brand::before,
        .docs-brand::after {
          display: none;
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
            <span>8</span>
            <span>4</span>
            <span>7</span>
            <span>6</span>
            <span></span>
          </span>
          <div>
            <p class="docs-kicker">Public Developer Reference</p>
            <h1>Sliding Tiles API</h1>
            <p>Integrate accounts, saved game state, completions, leaderboards, profiles, and privacy-conscious gameplay analytics.</p>
          </div>
        </div>
        <div class="docs-meta" aria-label="API metadata">
          <div class="docs-route-card" aria-hidden="true">
            <div class="docs-route">
              <span class="docs-method get">GET</span>
              <span class="docs-route-path">/api/leaderboard/public</span>
            </div>
            <div class="docs-route">
              <span class="docs-method post">POST</span>
              <span class="docs-route-path">/api/game-state</span>
            </div>
            <div class="docs-route">
              <span class="docs-method patch">POST</span>
              <span class="docs-route-path">/api/anonymous-analytics/events</span>
            </div>
          </div>
          <div class="docs-chip-row">
            <span class="docs-chip">v1.0.0</span>
            <span class="docs-chip secondary">OpenAPI 3.1</span>
          </div>
        </div>
      </div>
    </header>
    <script id="api-reference" data-url="${specPath}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}
