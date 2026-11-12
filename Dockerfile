
# syntax=docker/dockerfile:1

# ---------------------------------------------------------------
# Stage 1: Base — Node.js 22 LTS
# ---------------------------------------------------------------
FROM node:22-bookworm-slim AS base

WORKDIR /app

# ---------------------------------------------------------------
# Stage 2: Dependencies
# ---------------------------------------------------------------
FROM base AS deps

# Native build tools for better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

# ---------------------------------------------------------------
# Stage 3: Build
# ---------------------------------------------------------------
FROM base AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------
# Stage 4: Production Runner
# ---------------------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENV PORT=1516
ENV LOCALDROP_PORT=1516
ENV LOCALDROP_HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0

# Runtime library for native modules
RUN apt-get update && \
    apt-get install -y --no-install-recommends libstdc++6 && \
    rm -rf /var/lib/apt/lists/*

# Non-root user
RUN addgroup --system --gid 1001 localdrop && \
    adduser --system --uid 1001 --ingroup localdrop localdrop

# Next.js standalone output
COPY --from=build --chown=localdrop:localdrop /app/.next/standalone ./
COPY --from=build --chown=localdrop:localdrop /app/.next/static ./.next/static
COPY --from=build --chown=localdrop:localdrop /app/public ./public

# Persistent storage directory
RUN mkdir -p /app/data/uploads && \
    chown -R localdrop:localdrop /app/data

USER localdrop

EXPOSE 1516

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:1516/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
