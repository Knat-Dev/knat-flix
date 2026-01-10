# Build stage - builds the Slidev presentation
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build the static site
RUN pnpm build --base /

# Production stage - serve with Caddy
FROM caddy:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /srv

# Caddyfile for static file serving with SPA support
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
