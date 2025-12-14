# Quick Start Guide

## Prerequisites

- Node.js 22+ and pnpm installed
- Docker and Docker Compose
- Access to `/var/run/docker.sock` (for container management)

## Initial Setup

1. **Install dependencies:**
   ```bash
   cd stack-monitor
   pnpm install
   ```

2. **Build shared package:**
   ```bash
   cd packages/shared
   pnpm build
   ```

## Development Mode

Run both services in development:

```bash
# From stack-monitor root
pnpm dev
```

Or run individually:

```bash
# API (port 3000)
cd apps/api
pnpm dev

# PWA (port 3005)
cd apps/pwa
pnpm dev
```

## Production Deployment

1. **Build and start with Docker Compose:**
   ```bash
   # From arr-stack root
   docker compose build stack-api stack-pwa
   docker compose up -d stack-api stack-pwa
   ```

2. **Access the UI:**
   - Frontend: http://localhost:3005
   - API: http://localhost:3000

## Environment Variables

The API service uses these environment variables (set in docker-compose.yml):

- `PORT` - API server port (default: 3000)
- `DATABASE_PATH` - SQLite database path (default: /data/stack.db)
- `CONFIG_ROOT` - Path to configs for backup (mounted from host)

The PWA uses:

- `PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000)

## Troubleshooting

### Shared package not found
If you see import errors for `@arr/shared`, build it first:
```bash
cd packages/shared && pnpm build
```

### Docker socket permission denied
Ensure your user has access to `/var/run/docker.sock`:
```bash
sudo usermod -aG docker $USER
# Then log out and back in
```

### Port already in use
Change ports in:
- `apps/pwa/vite.config.ts` (dev server)
- `docker-compose.yml` (production ports)

