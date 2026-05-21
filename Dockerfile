# BiblioScan — Railway production (Debian slim = lightningcss/Tailwind compatible)
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json .npmrc ./
# Instalar TODO (incl. optional natives de lightningcss) — NO usar --omit=optional
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV JWT_SECRET=build-time-jwt-secret-minimum-32-chars-long-for-next-build
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts/db-migrate.mjs ./scripts/db-migrate.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/seed-inventory.mjs ./scripts/seed-inventory.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start-production.mjs ./scripts/start-production.mjs

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "scripts/start-production.mjs"]
