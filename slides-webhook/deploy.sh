#!/usr/bin/env bash
set -euo pipefail

# Webhook Deploy Script - runs inside container
# Clones repo, syncs to build dir, rebuilds slides container

REPO_URL="${REPO_URL:-https://github.com/Knat-Dev/talks.git}"
SLIDES_SUBDIR="${SLIDES_SUBDIR:-decoupling}"
WORK_DIR="/tmp/slides-source"
BUILD_DIR="/slides-build"
ARR_STACK_DIR="/arr-stack"

log() { echo "[$(date '+%H:%M:%S')] $1"; }

log "Starting deploy..."

# Clone or pull
if [[ -d "${WORK_DIR}/.git" ]]; then
    log "Pulling latest changes..."
    cd "${WORK_DIR}"
    git fetch origin
    git reset --hard origin/master || git reset --hard origin/main
else
    log "Cloning repository..."
    rm -rf "${WORK_DIR}"
    git clone --depth 1 "${REPO_URL}" "${WORK_DIR}"
fi

# Determine source directory (subdirectory if specified)
if [[ -n "${SLIDES_SUBDIR}" ]] && [[ -d "${WORK_DIR}/${SLIDES_SUBDIR}" ]]; then
    SOURCE_DIR="${WORK_DIR}/${SLIDES_SUBDIR}"
    log "Using subdirectory: ${SLIDES_SUBDIR}"
else
    SOURCE_DIR="${WORK_DIR}"
fi

# Sync to build directory (excluding node_modules, dist, .git)
log "Syncing source to build directory..."
mkdir -p "${BUILD_DIR}"
rsync -av --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '*.log' \
    "${SOURCE_DIR}/" "${BUILD_DIR}/"

# Copy Caddyfile for docker build
cp "${ARR_STACK_DIR}/slides/Caddyfile" "${BUILD_DIR}/Caddyfile"

# Build and restart slides container
log "Building slides docker image..."
cd "${ARR_STACK_DIR}"
docker compose build slides

log "Restarting slides container..."
docker compose up -d slides

# Wait and verify
sleep 3
if docker compose ps slides | grep -q "Up"; then
    log "Slides container is running"
else
    log "ERROR: Container failed to start"
    docker compose logs --tail 20 slides
    exit 1
fi

log "Deploy complete!"
