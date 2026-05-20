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
2. Copy `.env.example` to `.env` and adjust values if needed.
3. Start PostgreSQL:

```bash
docker compose up -d postgres
```

4. Install dependencies and migrate:

```bash
npm install
npm run db:migrate
```

5. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.
