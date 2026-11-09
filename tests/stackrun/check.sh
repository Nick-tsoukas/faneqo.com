#!/usr/bin/env bash
# Prove $development / $staging overlays from root stack.config.ts.
# Ports live in root .env (inherited); command env port blocks are absent.
# Dev: host FE/BE + postgres only. Staging: all compose services (not host develop/dev).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CFG="$ROOT/tests/stackrun/stack.config.ts"
cd "$ROOT"

# Simulate root .env inheritance (stackrun loads .env before config).
export STRAPI_PORT=1337
export NUXT_PORT=3000
# Compose may use STAGING_* separately; must NOT remap into command env.
export STAGING_STRAPI_PORT=1338
export STAGING_NUXT_PORT=3001

check() {
  local env_name=$1
  shift
  local out
  out="$(NODE_ENV="$env_name" npx stackrun -c "$CFG" 2>&1)" || {
    echo "FAIL $env_name: stackrun exit $?"
    printf '%s\n' "$out"
    exit 1
  }
  local needle
  for needle in "$@"; do
    if ! printf '%s\n' "$out" | grep -Fq "$needle"; then
      echo "FAIL $env_name: missing $needle"
      printf '%s\n' "$out"
      exit 1
    fi
  done
  echo "ok $env_name"
}

# No command-level env map → fixture echoes inherited .env ports.
check development \
  "no-command-env" \
  "STRAPI_PORT=1337" \
  "NUXT_PORT=3000"

check staging \
  "no-command-env" \
  "STRAPI_PORT=1337" \
  "NUXT_PORT=3000"

# Staging must not inject STAGING_* remaps into command env.
# STAGING_* host ports belong to compose (see tests/root/check.sh), not stackrun command env.
stg_out="$(NODE_ENV=staging npx stackrun -c "$CFG" 2>&1)" || {
  echo "FAIL staging remap check: stackrun exit $?"
  printf '%s\n' "$stg_out"
  exit 1
}
if printf '%s\n' "$stg_out" | grep -Fq "STRAPI_PORT=1338"; then
  echo "FAIL staging: command env still remaps STAGING_STRAPI_PORT"
  printf '%s\n' "$stg_out"
  exit 1
fi
if printf '%s\n' "$stg_out" | grep -Fq "NUXT_PORT=3001"; then
  echo "FAIL staging: command env still remaps STAGING_NUXT_PORT"
  printf '%s\n' "$stg_out"
  exit 1
fi
# Fixture must still see unprefixed inheritance (dotenv), not blank ports.
if ! printf '%s\n' "$stg_out" | grep -Fq "STRAPI_PORT=1337"; then
  echo "FAIL staging: expected inherited STRAPI_PORT=1337 without remap"
  printf '%s\n' "$stg_out"
  exit 1
fi
if ! printf '%s\n' "$stg_out" | grep -Fq "NUXT_PORT=3000"; then
  echo "FAIL staging: expected inherited NUXT_PORT=3000 without remap"
  printf '%s\n' "$stg_out"
  exit 1
fi
echo "ok staging no STAGING_* command-env remap (compose owns STAGING_* ports)"

# Root config: command env port blocks must stay commented (not active).
if grep -E '^[[:space:]]+env:[[:space:]]*\{[[:space:]]*(STRAPI_PORT|NUXT_PORT)' \
  "$ROOT/stack.config.ts" >/dev/null; then
  echo "FAIL stack.config.ts has active command env port blocks"
  exit 1
fi
echo "ok stack.config.ts command env ports commented"

# Dry-run root config: staging ups all services; development stays db-only + host apps.
dev_dry="$(NODE_ENV=development npx stackrun --dry-run 2>/dev/null)"
printf '%s\n' "$dev_dry" | grep -Fq 'docker compose up -d postgres' \
  || { echo "FAIL development dry-run missing db-only compose up postgres"; printf '%s\n' "$dev_dry"; exit 1; }
printf '%s\n' "$dev_dry" | grep -Fq 'npm run develop' \
  || { echo "FAIL development dry-run missing host backend develop"; printf '%s\n' "$dev_dry"; exit 1; }
printf '%s\n' "$dev_dry" | grep -Fq 'npm run dev' \
  || { echo "FAIL development dry-run missing host frontend dev"; printf '%s\n' "$dev_dry"; exit 1; }
printf '%s\n' "$dev_dry" | grep -Fq 'mise exec' \
  || { echo "FAIL development dry-run missing mise exec host Node pin"; printf '%s\n' "$dev_dry"; exit 1; }
printf '%s\n' "$dev_dry" | grep -Fq 'BACKEND_NODE_VERSION' \
  || { echo "FAIL development dry-run missing BACKEND_NODE_VERSION fallback"; printf '%s\n' "$dev_dry"; exit 1; }
printf '%s\n' "$dev_dry" | grep -Fq 'FRONTEND_NODE_VERSION' \
  || { echo "FAIL development dry-run missing FRONTEND_NODE_VERSION fallback"; printf '%s\n' "$dev_dry"; exit 1; }

stg_dry="$(NODE_ENV=staging npx stackrun --dry-run 2>/dev/null)"
printf '%s\n' "$stg_dry" | grep -Fq 'docker compose up -d postgres' \
  && { echo "FAIL staging dry-run must up all services, not postgres only"; printf '%s\n' "$stg_dry"; exit 1; }
printf '%s\n' "$stg_dry" | grep -Fq 'docker compose up -d' \
  || { echo "FAIL staging dry-run missing docker compose up -d"; printf '%s\n' "$stg_dry"; exit 1; }
printf '%s\n' "$stg_dry" | grep -Fq -- '--profile' \
  && { echo "FAIL staging dry-run still uses Compose --profile"; printf '%s\n' "$stg_dry"; exit 1; }
printf '%s\n' "$stg_dry" | grep -Fq 'mise exec' \
  || { echo "FAIL staging dry-run missing mise exec for host install/build"; printf '%s\n' "$stg_dry"; exit 1; }
if printf '%s\n' "$stg_dry" | grep -Fq '"run": "npm run develop"'; then
  echo "FAIL staging dry-run still hosts npm run develop"
  printf '%s\n' "$stg_dry"
  exit 1
fi
if printf '%s\n' "$stg_dry" | grep -Fq '"run": "npm run dev"'; then
  echo "FAIL staging dry-run still hosts npm run dev"
  printf '%s\n' "$stg_dry"
  exit 1
fi
echo "ok staging all-services compose path (dry-run)"

echo "stackrun overlay env checks passed"
