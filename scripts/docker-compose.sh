#!/usr/bin/env bash
# Resolve FE/BE Node image tags (empty → NODE_VERSION) then exec docker compose.
# Compose cannot nest ${FRONTEND_NODE_VERSION:-${NODE_VERSION}}; this is the thin wrapper.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_env_key() {
  local key=$1
  local file=$2
  local line
  line="$(grep -E "^${key}=" "$file" 2>/dev/null | tail -n1 || true)"
  [[ -n "$line" ]] || return 0
  # Strip optional surrounding quotes from value.
  local val="${line#*=}"
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  printf '%s' "$val"
}

# Prefer already-exported vars; else read from .env / example.env for NODE_VERSION fallback.
if [[ -z "${NODE_VERSION:-}" ]]; then
  if [[ -f .env ]]; then
    NODE_VERSION="$(load_env_key NODE_VERSION .env)"
  fi
  if [[ -z "${NODE_VERSION:-}" && -f example.env ]]; then
    NODE_VERSION="$(load_env_key NODE_VERSION example.env)"
  fi
fi

if [[ -z "${FRONTEND_NODE_VERSION:-}" && -f .env ]]; then
  FRONTEND_NODE_VERSION="$(load_env_key FRONTEND_NODE_VERSION .env)"
fi
if [[ -z "${BACKEND_NODE_VERSION:-}" && -f .env ]]; then
  BACKEND_NODE_VERSION="$(load_env_key BACKEND_NODE_VERSION .env)"
fi

: "${NODE_VERSION:?NODE_VERSION must be set in the environment or .env}"

# Empty override → shared pin (Architecture G / H).
if [[ -z "${FRONTEND_NODE_VERSION:-}" ]]; then
  FRONTEND_NODE_VERSION="$NODE_VERSION"
fi
if [[ -z "${BACKEND_NODE_VERSION:-}" ]]; then
  BACKEND_NODE_VERSION="$NODE_VERSION"
fi

export NODE_VERSION FRONTEND_NODE_VERSION BACKEND_NODE_VERSION

exec docker compose "$@"
