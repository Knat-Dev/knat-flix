# Arr-Stack Control Plane

Unified management interface for the Arr-Stack home media server stack.

## Architecture

This is a Turborepo monorepo containing:

- **`apps/api`** - Backend API (Hono + Node.js)
- **`apps/pwa`** - Frontend PWA (Svelte 5)
- **`packages/shared`** - Shared TypeScript types and Zod schemas

## Development

### Prerequisites

- Node.js 22 (LTS)
- pnpm 10+

### Setup

```bash
# Install dependencies
pnpm install

# Run all services in development mode
pnpm dev

# Build all packages
pnpm build
```

### Individual Services

```bash
# Run API only
cd apps/api
pnpm dev

# Run PWA only
cd apps/pwa
pnpm dev
```

## Deployment

The services are configured in the root `docker-compose.yml`. Build and start:

```bash
docker compose build stack-api stack-pwa
docker compose up -d stack-api stack-pwa
```

Access the UI at `http://localhost:3005`

## Features

- Real-time container monitoring via WebSocket
- Container restart capabilities
- Snapshot backup system (gzip level 6 for gaming-friendly compression)
- One-click restore functionality
- Resource usage tracking (CPU/Memory)

