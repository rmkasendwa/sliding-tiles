ARG NODE_IMAGE=node:22-alpine3.22

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN apk upgrade --no-cache

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run db:generate
RUN npm run api:build
RUN npm run web:build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk upgrade --no-cache

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/apps/web/package.json apps/web/package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
RUN npm ci --omit=dev && npm run db:generate && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/scripts ./scripts

EXPOSE 3000 4001
CMD ["node", "scripts/start-container.mjs"]
