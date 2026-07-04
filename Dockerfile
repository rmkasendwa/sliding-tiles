# syntax=docker/dockerfile:1.7

# Alpine is materially smaller than the Debian Node images while retaining npm
# and a shell for Prisma migrations and the two-process container supervisor.
ARG NODE_IMAGE=node:22-alpine3.22

FROM ${NODE_IMAGE} AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run db:generate && \
    npm run api:build && \
    npm run web:build

FROM ${NODE_IMAGE} AS production-deps
WORKDIR /app
COPY docker/runtime/package.json docker/runtime/package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev && \
    node node_modules/prisma/build/index.js generate && \
    npm cache clean --force

FROM production-deps AS runtime-files
COPY --from=build /app/apps/web/.next/standalone/node_modules ./node_modules

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0

COPY --chown=node:node --from=runtime-files /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist/api ./dist/api
COPY --chown=node:node --from=build /app/apps/web/.next/standalone/apps/web ./apps/web
COPY --chown=node:node --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --chown=node:node --from=build /app/apps/web/public ./apps/web/public
COPY --chown=node:node --from=build /app/prisma/migrations ./prisma/migrations
COPY --chown=node:node --from=build /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --chown=node:node --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node --from=build /app/scripts/start-container.mjs ./scripts/start-container.mjs

EXPOSE 3000 4001
USER node
CMD ["node", "scripts/start-container.mjs"]
