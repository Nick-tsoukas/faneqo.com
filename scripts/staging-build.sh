#!/usr/bin/env bash
# Droplet (and optional CI) FE/BE install+build — no mise, no stackrun, no compose.
# One-off stock Node containers matching compose image tags; --rm drops them after.
# Local `npm run staging` still builds on the host via mise (stack.config.ts before).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BACKEND_IMAGE="node:${BACKEND_NODE_VERSION:-${NODE_VERSION:-22.11.0}}"
FRONTEND_IMAGE="node:${FRONTEND_NODE_VERSION:-${NODE_VERSION:-22.11.0}}"

# Pass root .env into one-off builds (Strapi loads cron-tasks → Stripe needs STRIPE_SECRET_KEY).
# Local stackrun/mise inherits .env; droplet docker run does not unless --env-file.
ENV_FILE_ARGS=()
if [[ -f "${ROOT}/.env" ]]; then
  ENV_FILE_ARGS+=(--env-file "${ROOT}/.env")
fi

echo "==> backend install+build via ${BACKEND_IMAGE}"
docker run --rm \
  "${ENV_FILE_ARGS[@]}" \
  -v "${ROOT}/backend:/app" \
  -w /app \
  -e NODE_ENV="${NODE_ENV:-staging}" \
  "${BACKEND_IMAGE}" \
  sh -c 'npm install && npm run build'

# 2GB droplets: Nuxt vite build OOMs at default heap — cap below RAM+swap.
FRONTEND_NODE_OPTIONS="${FRONTEND_NODE_OPTIONS:---max-old-space-size=1536}"

echo "==> frontend install+build via ${FRONTEND_IMAGE} (NODE_OPTIONS=${FRONTEND_NODE_OPTIONS})"
docker run --rm \
  "${ENV_FILE_ARGS[@]}" \
  -v "${ROOT}/frontend:/app" \
  -w /app \
  -e NODE_ENV="${NODE_ENV:-staging}" \
  -e NODE_OPTIONS="${FRONTEND_NODE_OPTIONS}" \
  "${FRONTEND_IMAGE}" \
  sh -c 'npm install && npm run build'

echo "==> staging build done (artifacts on host bind mounts)"
