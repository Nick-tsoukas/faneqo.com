#!/usr/bin/env bash
# Droplet (and optional CI) FE/BE install+build — no mise, no stackrun, no compose.
# One-off stock Node containers matching compose image tags; --rm drops them after.
# Local `npm run staging` still builds on the host via mise (stack.config.ts before).
#
# Selective (Task 5.1):
#   BUILD_BACKEND=0|1  BUILD_FRONTEND=0|1   (default both 1)
#   --backend-only | --frontend-only | --all
#
# Speed (droplet):
#   - Host dirs frontend/node_modules + backend/node_modules persist across git
#     reset --hard (gitignored). Not wiped by deploy.
#   - Shared npm cache: NPM_CACHE_DIR (default <repo>/.cache/npm) mounted at
#     /root/.npm in build containers.
#   - Skip npm install when package-lock.json sha matches
#     node_modules/.faneqo-lock-sha (FORCE_NPM_INSTALL=1 to always install).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUILD_BACKEND="${BUILD_BACKEND:-1}"
BUILD_FRONTEND="${BUILD_FRONTEND:-1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-only)
      BUILD_BACKEND=1
      BUILD_FRONTEND=0
      shift
      ;;
    --frontend-only)
      BUILD_BACKEND=0
      BUILD_FRONTEND=1
      shift
      ;;
    --all)
      BUILD_BACKEND=1
      BUILD_FRONTEND=1
      shift
      ;;
    -h|--help)
      echo "usage: $0 [--all|--backend-only|--frontend-only]"
      echo "env: BUILD_BACKEND=0|1 BUILD_FRONTEND=0|1 (default 1)"
      echo "     FORCE_NPM_INSTALL=1  always npm install"
      echo "     NPM_CACHE_DIR=<repo>/.cache/npm"
      exit 0
      ;;
    *)
      echo "unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "${BUILD_BACKEND}" != "1" && "${BUILD_FRONTEND}" != "1" ]]; then
  echo "==> staging build skipped (BUILD_BACKEND=${BUILD_BACKEND} BUILD_FRONTEND=${BUILD_FRONTEND})"
  exit 0
fi

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

# Persistent npm download cache on the droplet (survives --rm build containers).
# Under the repo so the deploy user can write without root /var/cache.
NPM_CACHE_DIR="${NPM_CACHE_DIR:-${ROOT}/.cache/npm}"
mkdir -p "${NPM_CACHE_DIR}"

# Install when lock changed (or forced); always build. Runs inside the Node container.
# node_modules lives on the bind-mounted host tree and is gitignored — kept across deploys.
NPM_INSTALL_AND_BUILD="$(cat <<'EOS'
set -e
LOCK=package-lock.json
STAMP=node_modules/.faneqo-lock-sha
if [[ ! -f "$LOCK" ]]; then
  echo "missing $LOCK" >&2
  exit 1
fi
HASH="$(sha256sum "$LOCK" | awk '{print $1}')"
if [[ "${FORCE_NPM_INSTALL:-0}" != "1" ]] \
  && [[ -d node_modules ]] \
  && [[ -f "$STAMP" ]] \
  && [[ "$(cat "$STAMP")" == "$HASH" ]]; then
  echo "==> npm install skipped (package-lock unchanged; node_modules cache hit)"
else
  echo "==> npm install (lock=$HASH)"
  npm install
  mkdir -p node_modules
  echo "$HASH" > "$STAMP"
fi
npm run build
EOS
)"

if [[ "${BUILD_BACKEND}" == "1" ]]; then
  echo "==> backend install+build via ${BACKEND_IMAGE} (npm cache ${NPM_CACHE_DIR})"
  docker run --rm \
    "${ENV_FILE_ARGS[@]}" \
    -v "${ROOT}/backend:/app" \
    -v "${NPM_CACHE_DIR}:/root/.npm" \
    -w /app \
    -e NODE_ENV="${NODE_ENV:-staging}" \
    -e FORCE_NPM_INSTALL="${FORCE_NPM_INSTALL:-0}" \
    "${BACKEND_IMAGE}" \
    sh -c "${NPM_INSTALL_AND_BUILD}"
else
  echo "==> backend build skipped"
fi

if [[ "${BUILD_FRONTEND}" == "1" ]]; then
  # 2GB droplets: Nuxt vite build OOMs at default heap — cap below RAM+swap.
  FRONTEND_NODE_OPTIONS="${FRONTEND_NODE_OPTIONS:---max-old-space-size=1536}"

  echo "==> frontend install+build via ${FRONTEND_IMAGE} (NODE_OPTIONS=${FRONTEND_NODE_OPTIONS}; npm cache ${NPM_CACHE_DIR})"
  docker run --rm \
    "${ENV_FILE_ARGS[@]}" \
    -v "${ROOT}/frontend:/app" \
    -v "${NPM_CACHE_DIR}:/root/.npm" \
    -w /app \
    -e NODE_ENV="${NODE_ENV:-staging}" \
    -e NODE_OPTIONS="${FRONTEND_NODE_OPTIONS}" \
    -e FORCE_NPM_INSTALL="${FORCE_NPM_INSTALL:-0}" \
    "${FRONTEND_IMAGE}" \
    sh -c "${NPM_INSTALL_AND_BUILD}"
else
  echo "==> frontend build skipped"
fi

echo "==> staging build done (artifacts on host bind mounts)"
