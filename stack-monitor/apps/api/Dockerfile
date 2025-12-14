# --- BASE STAGE ---
FROM node:20-slim AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# --- BUILDER STAGE ---
FROM base AS builder

# Copy only config files first
COPY pnpm-workspace.yaml pnpm-lock.yaml turbo.json package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install deps (including devDeps for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build
WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/apps/api
RUN pnpm build

# --- PROD DEPS STAGE ---
FROM base AS prod-deps

WORKDIR /app

# Install compilation tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHON=/usr/bin/python3
ENV npm_config_build_from_source=true

COPY pnpm-workspace.yaml pnpm-lock.yaml turbo.json package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install prod dependencies - better-sqlite3 will build due to onlyBuiltDependencies in package.json
RUN pnpm install --prod --frozen-lockfile && \
    pnpm rebuild better-sqlite3

# --- RUNNER STAGE ---
FROM base AS runner

WORKDIR /app

# Copy workspace config
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Copy compiled JS from builder
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy node_modules from prod-deps
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/apps/api/src/index.js"]
