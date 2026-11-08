#!/usr/bin/env bash
# Prove $development / $staging overlays from root stack.config.ts.
# Dev: host FE/BE env ports. Staging: compose profile path (not host develop/dev).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CFG="$ROOT/tests/stackrun/stack.config.ts"
cd "$ROOT"

export STRAPI_PORT=1337
export NUXT_PORT=3000
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

check development \
  "STRAPI_PORT=1337" \
  "NUXT_PORT=3000"

check staging \
  "STRAPI_PORT=1338" \
  "NUXT_PORT=3001"

# Dry-run root config: staging uses profile containers; development stays db-only + host apps.
dev_dry="$(NODE_ENV=development npx stackrun --dry-run 2>/dev/null)"
printf '%s\n' "$dev_dry" | grep -Fq 'docker compose up -d' \
  || { echo "FAIL development dry-run missing db-only compose up"; printf '%s\n' "$dev_dry"; exit 1; }
printf '%s\n' "$dev_dry" | grep -Fq 'npm run develop' \
  || { echo "FAIL development dry-run missing host backend develop"; printf '%s\n' "$dev_dry"; exit 1; }
printf '%s\n' "$dev_dry" | grep -Fq 'npm run dev' \
  || { echo "FAIL development dry-run missing host frontend dev"; printf '%s\n' "$dev_dry"; exit 1; }

stg_dry="$(NODE_ENV=staging npx stackrun --dry-run 2>/dev/null)"
printf '%s\n' "$stg_dry" | grep -Fq -- '--profile staging' \
  || { echo "FAIL staging dry-run missing --profile staging"; printf '%s\n' "$stg_dry"; exit 1; }
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
echo "ok staging compose-profile path (dry-run)"

echo "stackrun overlay env checks passed"
