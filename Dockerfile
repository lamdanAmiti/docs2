# ─── Build stage ──────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 build-essential ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --no-audit --no-fund

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Runner stage ─────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r nextjs && useradd -r -g nextjs -d /app nextjs

COPY --from=builder --chown=nextjs:nextjs /app/.next         ./.next
COPY --from=builder --chown=nextjs:nextjs /app/public        ./public
COPY --from=builder --chown=nextjs:nextjs /app/node_modules  ./node_modules
COPY --from=builder --chown=nextjs:nextjs /app/package.json  ./package.json

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3000/ >/dev/null || exit 1

CMD ["npm", "run", "start"]
