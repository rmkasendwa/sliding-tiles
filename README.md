# Sliding Tiles

A modernized sliding tile puzzle built with Next.js App Router, React, Prisma,
and PostgreSQL.

## What is included

- SSR pages and filesystem routing through Next.js.
- Anonymous play with browser-local progress.
- Email/password signup and login with HTTP-only signed sessions.
- Signed-in game-state persistence in PostgreSQL.
- Leaderboard entries for completed signed-in levels.
- Pure board transitions that keep every generated puzzle solvable.

## Local setup

1. Use Node.js `22.12.0` or newer.
2. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

3. Update `.env`:

- Set `SESSION_SECRET` to any random string with at least 32 characters.
- Keep `DATABASE_URL` as-is when using the included Docker database.
- Set `NEXT_ALLOWED_DEV_ORIGINS` to your computer's LAN IP when testing the
  dev server from another device, such as a phone.

4. Start PostgreSQL:

```bash
docker compose up -d postgres
```

5. Install dependencies and migrate:

```bash
npm install
npm run db:migrate
```

6. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Testing on a phone

Find your computer's LAN IP address, set it in `.env`, then restart the dev
server:

```bash
NEXT_ALLOWED_DEV_ORIGINS="192.168.1.100"
```

Open `http://YOUR_LAN_IP:3000` on the phone while both devices are on the same
network. If you change `NEXT_ALLOWED_DEV_ORIGINS`, restart `npm run dev` so
Next.js picks up the new value.
