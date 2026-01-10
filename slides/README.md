# Slides Deployment

Deploys Slidev presentations via Cloudflare Tunnel + CDN for global edge caching and secure access.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge (200+ cities)                │
│  • Global CDN caching                                           │
│  • DDoS protection                                              │
│  • SSL termination                                              │
│  • Brotli/gzip compression                                      │
└─────────────────────────────┬────────────────────────────────────┘
                              │ Cloudflare Tunnel
                              │ (encrypted, outbound-only)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   cloudflared container                         │
│  Connects to Cloudflare edge, routes traffic internally        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   slides container                              │
│  Caddy serving static Slidev build on :80                      │
│  • CDN-optimized cache headers                                 │
│  • Pre-compression                                             │
│  • SPA fallback                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Deploy

```bash
# Deploy the default presentation (~/dev/talks/decoupling)
./deploy.sh

# Deploy a specific presentation
./deploy.sh ~/dev/talks/my-other-talk

# Clean build and deploy
./deploy.sh --clean
```

## Initial Setup: Cloudflare Tunnel

### 1. Create Tunnel in Cloudflare Dashboard

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to **Networks → Tunnels**
3. Click **Create a tunnel**
4. Choose **Cloudflared** connector
5. Name it (e.g., `arr-stack-slides`)
6. Copy the **tunnel token** (long string starting with `eyJ...`)

### 2. Add Token to Environment

Add to your `.env` file:

```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYWJjZGVmZzEyMzQ1Njc4OTAiLCJ0IjoiLi4uIiwicyI6Ii4uLiJ9
```

### 3. Configure Public Hostname

In the Cloudflare dashboard tunnel configuration, add:

| Public hostname | Service |
|-----------------|---------|
| `slides.knat.dev` | `http://slides:80` |

### 4. Enable Cloudflare CDN Caching

In Cloudflare dashboard for `knat.dev`:

1. Go to **Caching → Configuration**
2. Set **Caching Level** to "Standard"
3. Go to **Rules → Page Rules** (or Cache Rules)
4. Add rule for `slides.knat.dev/*`:
   - **Cache Level**: Cache Everything
   - **Edge Cache TTL**: 1 month (for static assets)
   - **Browser Cache TTL**: Respect Existing Headers

## Files

```
slides/
├── Dockerfile      # Multi-stage: node builds → caddy serves
├── Caddyfile       # CDN-optimized static file server
├── deploy.sh       # One-command deployment
├── README.md       # This file
└── build/          # (generated) Source copied here before build
```

## URL

**https://slides.knat.dev** — served globally via Cloudflare CDN

## Benefits of Tunnel + CDN

| Feature | Benefit |
|---------|---------|
| **No exposed ports** | Tunnel is outbound-only, no firewall rules needed |
| **Global CDN** | Static assets cached at 200+ edge locations |
| **Auto SSL** | Cloudflare handles certificates |
| **DDoS protection** | Cloudflare absorbs attacks |
| **Analytics** | Free traffic analytics in CF dashboard |
| **Fast deploys** | Just rebuild container, CDN purges automatically |

## Manual Commands

```bash
cd ~/arr-stack

# Rebuild and restart slides
docker compose build slides
docker compose up -d slides

# Restart tunnel (picks up new container)
docker compose restart cloudflared

# View logs
docker compose logs -f slides cloudflared

# Check tunnel status
docker compose logs cloudflared | grep -i connected
```

## Purge CDN Cache

After deploying, you can purge the cache if needed:

```bash
# Via Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

Or in the Cloudflare dashboard: **Caching → Configuration → Purge Everything**

## Troubleshooting

### Tunnel not connecting

```bash
# Check tunnel logs
docker compose logs cloudflared

# Verify token is set
docker compose config | grep TUNNEL_TOKEN
```

### Old content showing

1. Check if new container is running: `docker compose ps slides`
2. Purge Cloudflare cache
3. Hard refresh browser: `Ctrl+Shift+R`

### Build failing

```bash
# Check build logs
docker compose build slides --no-cache

# Verify source exists
ls -la ./slides/build/
```
