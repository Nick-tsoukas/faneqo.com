#!/usr/bin/env bash
# Droplet (CI or manual): sync tree to a commit, selectively rebuild FE/BE, recreate containers.
# Leaves postgres running. No mise. No stackrun. Intended for /opt/faneqo on the droplet.
# Usage:
#   bash scripts/staging-droplet-deploy.sh <git-sha>
#   GITHUB_SHA=<sha> bash scripts/staging-droplet-deploy.sh
#   FORCE_FULL_BUILD=1 bash scripts/staging-droplet-deploy.sh <sha>   # always both
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SHA="${1:-${GITHUB_SHA:-${DEPLOY_SHA:-}}}"
if [[ -z "${SHA}" ]]; then
  echo "usage: $0 <git-sha>   (or set GITHUB_SHA / DEPLOY_SHA)" >&2
  exit 1
fi

PREV="$(git rev-parse HEAD)"
echo "==> fetch + reset --hard ${SHA} (was ${PREV})"
git fetch origin
git reset --hard "${SHA}"
NEW="$(git rev-parse HEAD)"
echo "==> tree ${NEW}"

BUILD_BACKEND=0
BUILD_FRONTEND=0

classify_file() {
  case "$1" in
    backend|backend/*)
      BUILD_BACKEND=1
      ;;
    frontend|frontend/*)
      BUILD_FRONTEND=1
      ;;
    scripts/staging-*.sh|docker-compose.yml|.github/workflows/deploy-staging.yml)
      BUILD_BACKEND=1
      BUILD_FRONTEND=1
      ;;
  esac
}

if [[ "${FORCE_FULL_BUILD:-0}" == "1" ]]; then
  echo "==> FORCE_FULL_BUILD=1 — rebuild both"
  BUILD_BACKEND=1
  BUILD_FRONTEND=1
elif [[ "${PREV}" == "${NEW}" ]]; then
  echo "==> already at ${NEW} — skip build/recreate"
elif ! git cat-file -e "${PREV}^{commit}" 2>/dev/null; then
  echo "==> previous HEAD missing — full rebuild"
  BUILD_BACKEND=1
  BUILD_FRONTEND=1
else
  echo "==> changed paths ${PREV}..${NEW}:"
  CHANGED="$(git diff --name-only "${PREV}" "${NEW}" || true)"
  if [[ -z "${CHANGED}" ]]; then
    echo "  (none)"
  else
    while IFS= read -r f; do
      [[ -z "${f}" ]] && continue
      printf '  %s\n' "${f}"
      classify_file "${f}"
    done <<<"${CHANGED}"
  fi
  if [[ "${BUILD_BACKEND}" != "1" && "${BUILD_FRONTEND}" != "1" ]]; then
    echo "==> no FE/BE/stack paths changed — git synced; skip build/recreate"
  fi
fi

export BUILD_BACKEND BUILD_FRONTEND
bash "${ROOT}/scripts/staging-build.sh"

SERVICES=()
[[ "${BUILD_BACKEND}" == "1" ]] && SERVICES+=("backend")
[[ "${BUILD_FRONTEND}" == "1" ]] && SERVICES+=("frontend")

if ((${#SERVICES[@]} > 0)); then
  echo "==> recreate ${SERVICES[*]} (postgres untouched)"
  docker compose up -d --force-recreate --no-deps "${SERVICES[@]}"
else
  echo "==> no container recreate"
fi

docker compose ps
echo "==> running $(git rev-parse HEAD) BUILD_BACKEND=${BUILD_BACKEND} BUILD_FRONTEND=${BUILD_FRONTEND}"
