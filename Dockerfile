# BiblioScan — Production Docker image for Railway
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=optional

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV JWT_SECRET=build-time-jwt-secret-minimum-32-chars
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Migraciones PostgreSQL (Railway)
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts/db-migrate.mjs ./scripts/db-migrate.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start-production.mjs ./scripts/start-production.mjs

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "scripts/start-production.mjs"]
