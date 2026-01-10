#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Slides Deployment Script
# Deploy Slidev presentations via Cloudflare Tunnel + CDN
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build"
ARR_STACK_DIR="$(dirname "${SCRIPT_DIR}")"

# Default source - can be overridden
DEFAULT_SOURCE="${HOME}/dev/talks/decoupling"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS] [SOURCE_PATH]

Deploy a Slidev presentation via Cloudflare Tunnel + CDN.

Arguments:
    SOURCE_PATH     Path to the Slidev presentation (default: ${DEFAULT_SOURCE})

Options:
    -h, --help       Show this help message
    -n, --no-restart Build only, don't restart the container
    -c, --clean      Clean build directory before copying
    -p, --purge      Purge Cloudflare CDN cache after deploy
    -f, --force      Force rebuild even if no changes detected

Examples:
    $(basename "$0")                              # Deploy default presentation
    $(basename "$0") ~/dev/talks/my-talk         # Deploy specific presentation
    $(basename "$0") --clean --purge             # Clean build, deploy, purge CDN

EOF
}

# Parse arguments
NO_RESTART=false
CLEAN=false
FORCE=false
PURGE_CDN=false
SOURCE_PATH=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -n|--no-restart)
            NO_RESTART=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -p|--purge)
            PURGE_CDN=true
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            SOURCE_PATH="$1"
            shift
            ;;
    esac
done

# Use default if no source specified
SOURCE_PATH="${SOURCE_PATH:-${DEFAULT_SOURCE}}"

# Validate source
if [[ ! -d "${SOURCE_PATH}" ]]; then
    log_error "Source directory not found: ${SOURCE_PATH}"
    exit 1
fi

if [[ ! -f "${SOURCE_PATH}/package.json" ]]; then
    log_error "Not a valid Slidev project (no package.json): ${SOURCE_PATH}"
    exit 1
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}       📽️  Slides Deployment (Cloudflare CDN)       ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "Source: ${SOURCE_PATH}"

# Clean build directory if requested
if [[ "${CLEAN}" == true ]] && [[ -d "${BUILD_DIR}" ]]; then
    log_step "Cleaning build directory..."
    rm -rf "${BUILD_DIR}"
fi

# Create build directory
mkdir -p "${BUILD_DIR}"

# Sync source to build directory (excluding node_modules and dist)
log_step "Syncing source files..."
rsync -av --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '*.log' \
    "${SOURCE_PATH}/" "${BUILD_DIR}/"

# Copy Caddyfile to build directory for Docker build
cp "${SCRIPT_DIR}/Caddyfile" "${BUILD_DIR}/Caddyfile"

log_success "Source synced"

# Change to arr-stack directory for docker compose commands
cd "${ARR_STACK_DIR}"

# Build the Docker image
log_step "Building Docker image..."
docker compose build slides

log_success "Docker image built"

# Restart the container unless --no-restart was specified
if [[ "${NO_RESTART}" == false ]]; then
    log_step "Deploying slides container..."
    docker compose up -d slides
    
    # Wait a moment and check health
    sleep 2
    
    if docker compose ps slides | grep -q "Up"; then
        log_success "Slides container is running"
    else
        log_error "Container failed to start. Check logs:"
        log_error "  docker compose logs slides"
        exit 1
    fi
    
    # Check tunnel status
    log_step "Checking Cloudflare tunnel..."
    if docker compose ps cloudflared 2>/dev/null | grep -q "Up"; then
        log_success "Tunnel is connected"
    else
        log_warn "Tunnel not running. Starting..."
        docker compose up -d cloudflared
        sleep 3
        if docker compose ps cloudflared | grep -q "Up"; then
            log_success "Tunnel started"
        else
            log_warn "Tunnel may not be configured. Check CLOUDFLARE_TUNNEL_TOKEN"
        fi
    fi
else
    log_info "Skipping container restart (--no-restart)"
fi

# Purge CDN cache if requested
if [[ "${PURGE_CDN}" == true ]]; then
    log_step "Purging Cloudflare CDN cache..."
    
    # Check for required env vars
    if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] || [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
        log_warn "CDN purge skipped - set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID"
        log_info "You can purge manually in Cloudflare dashboard"
    else
        PURGE_RESPONSE=$(curl -s -X POST \
            "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
            -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
            -H "Content-Type: application/json" \
            --data '{"hosts":["slides.knat.dev"]}')
        
        if echo "${PURGE_RESPONSE}" | grep -q '"success":true'; then
            log_success "CDN cache purged for slides.knat.dev"
        else
            log_warn "CDN purge may have failed. Response: ${PURGE_RESPONSE}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}              ✅ Deployment Complete!               ${GREEN}║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  🌐 https://slides.knat.dev                        ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
