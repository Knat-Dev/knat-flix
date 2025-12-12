# 🎬 Arr Stack

A complete, self-hosted media automation stack powered by Docker Compose. Automatically find, download, organize, and stream your movies, TV shows, and audiobooks.

---

## 📦 Services

| Service            | Description                        | Port                   |
| ------------------ | ---------------------------------- | ---------------------- |
| **Plex**           | Media server for streaming         | `32400` (host network) |
| **Sonarr**         | TV show management & automation    | `8989`                 |
| **Radarr**         | Movie management & automation      | `7878`                 |
| **Bazarr**         | Automatic subtitle downloads       | `6767`                 |
| **Prowlarr**       | Indexer manager for Sonarr/Radarr  | `9696`                 |
| **qBittorrent**    | Download client                    | `8080`                 |
| **Audiobookshelf** | Audiobook & podcast server         | `13378`                |
| **Caddy**          | Reverse proxy with automatic HTTPS | `80`, `443`            |
| **Uptime Kuma**    | Service monitoring dashboard       | `3001`                 |

---

## 🚀 Quick Start

### 1. Clone & Configure

```bash
git clone <your-repo-url> arr-stack
cd arr-stack
```

### 2. Create Environment File

Create a `.env` file in the project root:

```env
# User/Group IDs (run `id` to find yours)
PUID=1000
PGID=1000

# Timezone
TZ=America/New_York

# Paths
CONFIG_ROOT=/path/to/your/config
HOST_MEDIA_PATH=/path/to/your/media

# Caddy/Cloudflare (optional, for reverse proxy)
DOMAIN=example.com
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

### 3. Launch the Stack

```bash
docker compose up -d
```

---

## 📁 Directory Structure

```
HOST_MEDIA_PATH/
├── Movies/
├── TV/
├── Audiobooks/
└── Downloads/
    ├── complete/
    └── incomplete/
```

---

## 🔧 Configuration Tips

### First-Time Setup Order

1. **Prowlarr** → Add your indexers
2. **qBittorrent** → Configure download paths
3. **Sonarr/Radarr** → Connect to Prowlarr & qBittorrent
4. **Bazarr** → Link to Sonarr & Radarr for subtitles
5. **Plex** → Point to your media libraries
6. **Uptime Kuma** → Add monitors for each service

### Hardlinks & Atomic Moves

For instant moves and space efficiency, ensure all services share the same `HOST_MEDIA_PATH` mount point. This enables hardlinks instead of slow copy+delete operations.

### Finding PUID/PGID

```bash
id $(whoami)
# uid=1000(user) gid=1000(user) ...
```

---

## 🌐 Default Service URLs

After starting, access your services at:

- Plex: `http://localhost:32400/web`
- Sonarr: `http://localhost:8989`
- Radarr: `http://localhost:7878`
- Bazarr: `http://localhost:6767`
- Prowlarr: `http://localhost:9696`
- qBittorrent: `http://localhost:8080`
- Audiobookshelf: `http://localhost:13378`
- Uptime Kuma: `http://localhost:3001`

---

## 🛠️ Common Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f [service_name]

# Update all images
docker compose pull && docker compose up -d

# Restart a single service
docker compose restart sonarr
```

---

## 📜 License

MIT
