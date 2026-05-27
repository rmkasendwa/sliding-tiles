FROM node:22.12.0-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run db:generate
RUN npm run api:build
RUN npm run web:build

FROM node:22.12.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/apps/web/package.json apps/web/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/scripts ./scripts

EXPOSE 3000 4001
CMD ["node", "scripts/start-container.mjs"]
