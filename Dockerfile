# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl curl && \
    rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run db:generate && \
    npm run api:build && \
    npm run web:build:ci && \
    node scripts/trace-runtime.mjs
RUN mkdir -p runtime/apps/web/.next && \
    cp -a apps/web/.next/standalone/node_modules/. runtime/node_modules/ && \
    cp -a apps/web/.next/standalone/apps/web/. runtime/apps/web/ && \
    cp -a apps/web/.next/static runtime/apps/web/.next/static && \
    cp -a apps/web/public runtime/apps/web/public && \
    cp -a prisma runtime/prisma && \
    cp prisma.config.ts runtime/prisma.config.ts && \
    mkdir -p runtime/scripts && \
    cp scripts/start-container.mjs runtime/scripts/start-container.mjs

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0

COPY --chown=node:node --from=build /app/runtime ./

EXPOSE 3000 4001
USER node
CMD ["node", "scripts/start-container.mjs"]
