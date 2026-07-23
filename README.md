# Sliding Tiles

A modernized sliding tile puzzle built with Next.js App Router, React, Prisma,
NestJS, and PostgreSQL.

## What is included

- `apps/web`: the Next.js App Router web client.
- `apps/api`: the NestJS API shared by web now and future clients later.
- Root-level Prisma, Docker, and orchestration scripts.
- Anonymous play with browser-local progress.
- Email/password registration and login with HTTP-only signed sessions.
- Email verification with expiring links sent through Resend.
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
- Set `RESEND_API_KEY` to a Resend API key and `RESEND_FROM_EMAIL` to a sender
  on a verified Resend domain. Resend's `onboarding@resend.dev` sender is useful
  for initial account testing.

4. Install dependencies:

```bash
npm install
```

5. Start the local database before running migrations:

```bash
docker compose up -d postgres
```

6. Run database migrations:

```bash
npm run db:migrate
```

7. Generate the Prisma Client:

```bash
npm run db:generate
```

8. Bootstrap the first admin only after that person has created an account
   through the normal Sliding Tiles registration flow. There is no default
   admin account.

```sql
UPDATE users
SET role = 'ADMIN',
    promoted_at = now()
WHERE email = 'your-email@example.com';
```

After this one-time database update, that admin can manage future promotions
and demotions from `/admin/users`. Role changes made in the admin UI record
`promoted_by_id` and `promoted_at`.

9. Run the full development stack:

```bash
npm run dev
```

This starts PostgreSQL, the NestJS API, and the Next.js web app. Open the URL
for your `WEB_PORT`, such as `http://localhost:3000`.

To run each service manually after the database is already running:

```bash
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
npm run docker:up    # build and run Postgres, migrations, API, and web
```

## Open Graph Images

Static social preview images are generated at build time with `next/og`.
The generator reads `apps/web/lib/og-pages.ts`, renders 1200x630 PNG files,
and writes them to `apps/web/public/og`.

Run the generator manually when changing social copy or the OG design:

```bash
npm run web:og
```

`npm run web:build` runs this automatically before `next build`, including in
CI/CD and Docker builds. Page metadata should reference files in `/og/*.png`.
Keep runtime `opengraph-image.tsx` routes only for pages whose preview content
is genuinely dynamic and cannot be known during the build.

## Contributing Rules

Project conventions and contribution rules are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

## Licensing

Sliding Tiles is licensed under **AGPL-3.0-only**.

This license was selected because Sliding Tiles is a networked multiplayer web
application with authentication, profiles, leaderboards, a shared API, and a
portable deployment image. AGPL-3.0 keeps the project open when modified
versions are offered to users over a network, while still allowing the official
project to be deployed and monetized.

See [LICENSE](LICENSE) for the repository license notice,
[NOTICE](NOTICE) for copyright and attribution notices, and
[docs/licensing.md](docs/licensing.md) for the project-specific licensing
rationale, contribution ownership rules, third-party asset notes, and future
relicensing considerations.

### Shared API

The NestJS API lives in `apps/api` and currently exposes the backend surfaces
that future web and mobile clients can share:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/analytics`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId/role`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification-email`
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
login/registration as a bearer token.

## Docker Deployment

The repository includes one production Docker image that runs both app
processes and can migrate the database on startup:

- `Dockerfile` builds the NestJS API and Next.js web app into one image.
- `scripts/start-container.mjs` runs `prisma migrate deploy`, then starts both
  the API and web server in that container.
- `docker-compose.yml` is only a convenience for running the image with a local
  PostgreSQL container.

Build the portable image (BuildKit is required for the dependency cache mount):

```bash
npm run docker:build
```

The production build uses separate dependency, build, and runtime stages.
Next.js runs from its standalone server bundle. The NestJS API and Prisma
migration CLI are file-traced during the build, so the final image receives
only modules they actually load instead of a full `node_modules` installation.
The final `node:22-bookworm-slim` image contains the two compiled servers,
static/public assets, Prisma Client and migrations, and traced runtime files.
It runs as the unprivileged `node` user.

Bookworm slim provides glibc compatibility for Node and Prisma without the
large build toolchain from the full `node:22` image. Distroless has a narrower
attack surface, but would complicate diagnostics and the current migration and
multi-process startup workflow.

To compare image sizes after a Dockerfile change, preserve the old image and
inspect both byte counts:

```bash
docker tag sliding-tiles:latest sliding-tiles:baseline
npm run docker:build
docker image inspect sliding-tiles:baseline sliding-tiles:latest \
  --format '{{index .RepoTags 0}}: {{.Size}} bytes'
```

On 2026-07-05, the original image measured `325,074,180` bytes (325.1 MB) and
the optimized `linux/arm64` image measured `136,776,428` bytes (136.8 MB): a
57.9% reduction. Registry transfer size may differ because layers are
compressed and target platforms can produce different native Prisma binaries.

Run it against any PostgreSQL database, including a managed database:

```bash
docker run --rm \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" \
  -e SESSION_SECRET="a-real-random-secret-with-at-least-32-characters" \
  -e WEB_BASE_URL="https://your-web-domain.example" \
  -e PUBLIC_API_BASE_URL="https://your-api-domain.example" \
  -e API_CORS_ORIGINS="https://your-web-domain.example" \
  -e RESEND_API_KEY="re_your_api_key" \
  -e RESEND_FROM_EMAIL="Sliding Tiles <accounts@your-domain.example>" \
  sliding-tiles:latest
```

By default the container runs database migrations before starting the app. Set
`RUN_MIGRATIONS=false` if your host runs migrations separately.

For a local production-style run with Docker Compose:

```bash
cp .env.example .env
npm run docker:up
```

The `app` compose profile starts:

- `postgres`
- `app`, a single container that runs migrations, then starts the API on
  internal port `4001` and web on `WEB_PORT`

Use Docker-specific connection variables inside compose because the app
container talks to Postgres by service name, while the web process talks to the
API process through localhost inside the same container. Keep the public API
URL separate so generated OpenAPI docs and client-facing metadata do not point
at container-local localhost in production:

```bash
DOCKER_DATABASE_URL="postgresql://sliding_tiles:sliding_tiles@postgres:5432/sliding_tiles?schema=public"
DOCKER_API_BASE_URL="http://localhost:4001/api"
PUBLIC_API_BASE_URL="https://your-api-domain.example"
```

For a real deployment, set at least:

```bash
SESSION_SECRET="a-real-random-secret-with-at-least-32-characters"
WEB_PORT=3000
API_CORS_ORIGINS="https://your-web-domain.example"
PUBLIC_API_BASE_URL="https://your-api-domain.example"
WEB_BASE_URL="https://your-web-domain.example"
RUN_MIGRATIONS=true
```

Stop the Docker stack with:

```bash
npm run docker:down
```

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

Third-party assets and dependencies remain under their own licenses. See
[NOTICE](NOTICE) and [docs/licensing.md](docs/licensing.md) for how
project-owned code, branding, and third-party material are treated.
