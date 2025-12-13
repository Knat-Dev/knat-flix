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
| **Watchtower**     | Automatic container updates        | `8088`                 |
| **arr-bot**        | Discord bot for stack control      | -                      |

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

# Discord Bot (optional)
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id

# Watchtower
WATCHTOWER_API_TOKEN=your_secure_random_token

# Discord Webhook (for Watchtower notifications)
DISCORD_WEBHOOK_ID=your_webhook_id
DISCORD_WEBHOOK_TOKEN=your_webhook_token
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

## 🤖 Discord Bot Setup

The stack includes a Discord bot for managing container updates from your phone.

### How It Works

1. **Watchtower** checks for new container images daily at 4am (monitor-only mode)
2. When updates are available, a **webhook notification** is sent to your Discord channel
3. You receive the notification on your phone and can decide when to update
4. Use `/arr update` to apply the pending updates
5. Use `/arr status` to check container health

### Setup Steps

1. **Create a Discord Application**

   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to **Bot** → Create bot → Copy the token → Set as `DISCORD_BOT_TOKEN`
   - Copy the Application ID → Set as `DISCORD_CLIENT_ID`

2. **Create a Discord Webhook**

   - In your Discord server, go to channel settings → Integrations → Webhooks
   - Create a webhook and copy the URL
   - Extract the ID and token from the URL: `https://discord.com/api/webhooks/{ID}/{TOKEN}`
   - Set `DISCORD_WEBHOOK_ID` and `DISCORD_WEBHOOK_TOKEN`

3. **Invite the Bot**

   - Go to OAuth2 → URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Embed Links`
   - Use the generated URL to invite the bot to your server

4. **Generate Watchtower Token**
   ```bash
   openssl rand -hex 32
   ```
   Set this as `WATCHTOWER_API_TOKEN`

### Commands

| Command       | Description                     |
| ------------- | ------------------------------- |
| `/arr status` | Show status of all containers   |
| `/arr update` | Apply pending container updates |

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
