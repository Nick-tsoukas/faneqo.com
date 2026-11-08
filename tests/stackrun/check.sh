#!/usr/bin/env bash
# Prove $development / $staging overlays from root stack.config.ts pass expected ports.
# Test config imports root, strips docker/tunnels, replaces run with echo of env keys.
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

echo "stackrun overlay env checks passed"
