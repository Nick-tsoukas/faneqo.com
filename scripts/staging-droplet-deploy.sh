#!/usr/bin/env bash
# Droplet (CI or manual): sync tree to a commit, rebuild FE/BE, recreate app containers.
# Leaves postgres running. No mise. No stackrun. Intended for /opt/faneqo on the droplet.
# Usage:
#   bash scripts/staging-droplet-deploy.sh <git-sha>
#   GITHUB_SHA=<sha> bash scripts/staging-droplet-deploy.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SHA="${1:-${GITHUB_SHA:-${DEPLOY_SHA:-}}}"
if [[ -z "${SHA}" ]]; then
  echo "usage: $0 <git-sha>   (or set GITHUB_SHA / DEPLOY_SHA)" >&2
  exit 1
fi

echo "==> fetch + reset --hard ${SHA}"
git fetch origin
git reset --hard "${SHA}"
echo "==> tree $(git rev-parse HEAD)"

bash "${ROOT}/scripts/staging-build.sh"

echo "==> recreate backend + frontend (postgres untouched)"
docker compose up -d --force-recreate --no-deps backend frontend
docker compose ps
echo "==> running $(git rev-parse HEAD)"
