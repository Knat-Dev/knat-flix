FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY package.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy PWA package
COPY apps/pwa ./apps/pwa

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build shared package first
WORKDIR /app/packages/shared
RUN pnpm build

# Build PWA
WORKDIR /app/apps/pwa
# Set API URL for build-time environment variable
ARG PUBLIC_API_URL=http://localhost:3006
ENV PUBLIC_API_URL=${PUBLIC_API_URL}
RUN pnpm build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=base /app/apps/pwa/build /usr/share/nginx/html

# Copy nginx config (optional, uses default)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

