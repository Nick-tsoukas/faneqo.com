#!/usr/bin/env bash
# Droplet staging bring-up: one-off Node builds, then detached compose.
# No stackrun. No mise. Same docker-compose.yml as local staging.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "${ROOT}/scripts/staging-build.sh"
docker compose up -d
docker compose ps
