# Sliding Tiles

A modernized sliding tile puzzle built with Next.js App Router, React, Prisma,
NestJS, and PostgreSQL.

## What is included

- `apps/web`: the Next.js App Router web client.
- `apps/api`: the NestJS API shared by web now and future clients later.
- Root-level Prisma, Docker, and orchestration scripts.
- Anonymous play with browser-local progress.
- Email/password signup and login with HTTP-only signed sessions.
- Signed-in game-state persistence in PostgreSQL.
- Leaderboard entries for completed signed-in levels.
- Pure board transitions that keep every generated puzzle solvable.

## Project layout

```text
apps/
  api/  NestJS API for auth, game state, leaderboard, and profile data
  web/  Next.js web app, public assets, UI components, and web helpers
prisma/ PostgreSQL schema and migrations
```

## Local setup

1. Use Node.js `22.12.0` or newer.
2. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

3. Update `.env`:

- Set `SESSION_SECRET` to any random string with at least 32 characters.
- Keep `DATABASE_URL` as-is when using the included Docker database.
- Set `WEB_PORT` if you want the web app on a non-default port. It defaults to
  `3000`.
- Set `NEXT_ALLOWED_DEV_ORIGINS` to your computer's LAN IP when testing the
  dev server from another device, such as a phone.
- Set `API_CORS_ORIGINS` to the web origins that may call the NestJS API. Keep
  the localhost value and add your LAN IP origin for phone testing. Match these
  origins to `WEB_PORT`.

4. Install dependencies and migrate:

```bash
npm install
npm run db:migrate
```

5. Run the full development stack:

```bash
npm run dev
```

This starts PostgreSQL, the NestJS API, and the Next.js web app. Open the URL
for your `WEB_PORT`, such as `http://localhost:3000`.

To run each service manually instead:

```bash
docker compose up -d postgres
npm run api:dev
npm run web:dev
```

When using the manual web command, pass a port inline or set it in your shell:

```bash
PORT=4000 npm run web:dev
```

## Development commands

```bash
npm run dev          # start Postgres, API, and web using .env
npm run api:dev      # start only the NestJS API on API_PORT, default 4001
npm run web:dev      # start only the Next.js web app from apps/web
npm run lint         # lint the full repository
npm run typecheck    # typecheck apps/web and apps/api
npm run build        # generate Prisma, build API, then build web
```

## Contributing Rules

Project conventions and contribution rules are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

### Shared API

The NestJS API lives in `apps/api` and currently exposes the backend surfaces
that future web and mobile clients can share:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/game-state`
- `PUT /api/game-state`
- `GET /api/leaderboard`
- `POST /api/leaderboard/completions`
- `GET /api/profile`

Run it separately from the Next.js app:

```bash
npm run api:dev
```

By default it listens on `http://localhost:4001`. Browser clients can use the
HTTP-only session cookie; mobile clients can use the `accessToken` returned by
login/signup as a bearer token.

### Testing on a phone

Find your computer's LAN IP address, set it in `.env`, then restart the dev
server:

```bash
WEB_PORT=3000
NEXT_ALLOWED_DEV_ORIGINS="192.168.1.100"
API_CORS_ORIGINS="http://localhost:3000,http://192.168.1.100:3000"
```

Open `http://YOUR_LAN_IP:WEB_PORT` on the phone while both devices are on the same
network. If you change `NEXT_ALLOWED_DEV_ORIGINS` or `API_CORS_ORIGINS`,
restart the dev servers so both apps pick up the new values.

## Attributions

- The sliding-door sound used for the tile fan-out effect comes from Mixkit:
  [mixkit-heavy-sliding-door-1523.wav](https://assets.mixkit.co/active_storage/sfx/1523/1523.wav)
