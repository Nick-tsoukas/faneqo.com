#!/usr/bin/env bash
# Root shape checks: scripts, mise, example.env, stack overlays, compose, docs.
# No FE/BE builds.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

fail() {
  echo "FAIL: $*"
  exit 1
}

ok() {
  echo "ok $*"
}

# --- package.json scripts ---
node --input-type=module <<'NODE' || fail "package.json script contracts"
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const s = pkg.scripts ?? {};

const exact = {
  dev: "NODE_ENV=development stackrun",
  staging: "NODE_ENV=staging stackrun",
  "build:frontend":
    "mise exec node@${FRONTEND_NODE_VERSION:-${NODE_VERSION}} -- npm run build --prefix frontend",
  "build:backend":
    "mise exec node@${BACKEND_NODE_VERSION:-${NODE_VERSION}} -- npm run build --prefix backend",
  build: "npm run build:backend && npm run build:frontend",
  "start:frontend":
    "mise exec node@${FRONTEND_NODE_VERSION:-${NODE_VERSION}} -- npm run start --prefix frontend",
  "start:backend":
    "mise exec node@${BACKEND_NODE_VERSION:-${NODE_VERSION}} -- npm run start --prefix backend",
  "test:stack": "bash tests/stackrun/check.sh",
  "test:root": "bash tests/root/check.sh",
};

for (const [name, want] of Object.entries(exact)) {
  if (s[name] !== want) {
    console.error(`script ${name}: want ${JSON.stringify(want)}, got ${JSON.stringify(s[name])}`);
    process.exit(1);
  }
}

const testScript = s.test ?? "";
if (!testScript.includes("test:stack") || !testScript.includes("test:root")) {
  console.error(`script test must run test:stack and test:root, got ${JSON.stringify(testScript)}`);
  process.exit(1);
}

console.log("ok package.json scripts");
NODE

# --- mise.toml ---
[[ -f mise.toml ]] || fail "mise.toml missing"
grep -Fq '_.file = ".env"' mise.toml || fail 'mise.toml must load .env via _.file = ".env"'
grep -Fq 'node = "{{ env.NODE_VERSION }}"' mise.toml || fail 'mise.toml must pin node = "{{ env.NODE_VERSION }}"'
ok mise.toml

# --- example.env Node pins + STAGING_* host ports ---
[[ -f example.env ]] || fail "example.env missing"
grep -Eq '^NODE_VERSION=' example.env || fail "example.env missing NODE_VERSION="
grep -Eq '^FRONTEND_NODE_VERSION=' example.env || fail "example.env missing FRONTEND_NODE_VERSION="
grep -Eq '^BACKEND_NODE_VERSION=' example.env || fail "example.env missing BACKEND_NODE_VERSION="
grep -Eq '^STAGING_STRAPI_PORT=' example.env || fail "example.env missing STAGING_STRAPI_PORT="
grep -Eq '^STAGING_NUXT_PORT=' example.env || fail "example.env missing STAGING_NUXT_PORT="
ok example.env Node pins + STAGING_* ports

# --- stack.config.ts overlays (text shape; stackrun suite loads it for real) ---
[[ -f stack.config.ts ]] || fail "stack.config.ts missing"
grep -Fq '$development' stack.config.ts || fail "stack.config.ts missing \$development"
grep -Fq '$staging' stack.config.ts || fail "stack.config.ts missing \$staging"
# Top-level commands would be indented two spaces; overlay commands use four+.
if grep -E '^  commands:' stack.config.ts >/dev/null; then
  fail "stack.config.ts must not declare top-level commands (overlays only)"
fi
# Dev = host SQLite (no compose). Staging ups all compose services. No Compose profiles.
grep -Fq 'docker compose up -d postgres' stack.config.ts \
  && fail "stack.config.ts \$development must not start postgres (Strapi uses SQLite in development)"
# Staging: host build in before; attached per-service `docker compose up … --no-log-prefix` (not -d / logs).
grep -Fq 'docker compose up -d' stack.config.ts \
  && fail "stack.config.ts must not use docker compose up -d (staging attaches with up)"
grep -Fq 'docker compose up postgres --no-log-prefix' stack.config.ts \
  || fail "stack.config.ts \$staging must up postgres with --no-log-prefix"
grep -Fq 'docker compose up backend --no-log-prefix' stack.config.ts \
  || fail "stack.config.ts \$staging must up backend with --no-log-prefix"
grep -Fq 'docker compose up frontend --no-log-prefix' stack.config.ts \
  || fail "stack.config.ts \$staging must up frontend with --no-log-prefix"
grep -Fq 'docker compose logs' stack.config.ts \
  && fail "stack.config.ts \$staging must not tail compose logs (use attached up)"
grep -Fq -- '--profile' stack.config.ts \
  && fail "stack.config.ts must not use Compose --profile"
if grep -E "run: \"npm run (develop|dev)\"" stack.config.ts | grep -q .; then
  # allow develop/dev only under $development block — fail if staging still hosts them
  # crude: after $staging marker, develop/dev run lines are forbidden
  awk '
    /\$staging/ { in_staging=1 }
    in_staging && /run: "npm run develop"/ { found=1 }
    in_staging && /run: "npm run dev"/ { found=1 }
    END { exit found ? 0 : 1 }
  ' stack.config.ts && fail "stack.config.ts \$staging must not host npm run develop/dev"
fi
# Host dual Node (Task 3.9): mise exec with FE/BE → NODE_VERSION fallbacks
# SoT = root .env (via stackrun / compose / mise _.file) — no hardcoded Node in mise.toml.
grep -Fq 'FRONTEND_NODE_VERSION:-${NODE_VERSION}' stack.config.ts \
  || fail "stack.config.ts must mise-exec frontend with FRONTEND_NODE_VERSION:-NODE_VERSION"
grep -Fq 'BACKEND_NODE_VERSION:-${NODE_VERSION}' stack.config.ts \
  || fail "stack.config.ts must mise-exec backend with BACKEND_NODE_VERSION:-NODE_VERSION"
grep -Fq 'mise exec' stack.config.ts || fail "stack.config.ts must use mise exec for host Node pins"
if grep -E 'node[[:space:]]*=[[:space:]]*"[0-9]' mise.toml >/dev/null; then
  fail "mise.toml must not hardcode node version; SoT is .env NODE_VERSION via {{ env.NODE_VERSION }}"
fi
ok stack.config.ts overlays

# --- docker-compose.yml: all services eligible; no Compose profiles ---
[[ -f docker-compose.yml ]] || fail "docker-compose.yml missing"
grep -Eq '^[[:space:]]*postgres:' docker-compose.yml || fail "docker-compose.yml missing postgres service"
grep -Fq 'image: postgres:16' docker-compose.yml || fail "docker-compose.yml expected postgres:16"
grep -Eq '^[[:space:]]*frontend:' docker-compose.yml || fail "docker-compose.yml missing frontend service"
grep -Eq '^[[:space:]]*backend:' docker-compose.yml || fail "docker-compose.yml missing backend service"
grep -Fq 'profiles:' docker-compose.yml \
  && fail "docker-compose.yml must not use Compose profiles (staging ups all services)"
# Stock Node nested defaults: FE/BE → NODE_VERSION → 22.11.0 (no wrapper script)
grep -Fq 'node:${FRONTEND_NODE_VERSION:-${NODE_VERSION:-22.11.0}}' docker-compose.yml \
  || fail "frontend must use nested image: node:\${FRONTEND_NODE_VERSION:-\${NODE_VERSION:-22.11.0}}"
grep -Fq 'node:${BACKEND_NODE_VERSION:-${NODE_VERSION:-22.11.0}}' docker-compose.yml \
  || fail "backend must use nested image: node:\${BACKEND_NODE_VERSION:-\${NODE_VERSION:-22.11.0}}"
# No custom app Dockerfiles at root for staging
if compgen -G 'docker/Dockerfile*' >/dev/null; then
  fail "unexpected docker/Dockerfile* (stock Node only unless escape hatch)"
fi
[[ ! -e scripts/docker-compose.sh ]] || fail "scripts/docker-compose.sh must be removed (use nested compose defaults)"
ok "docker-compose services (no profiles)"

# --- compose service inventory (all three always eligible) ---
mapfile -t all_services < <(docker compose config --services | sort)
all_joined=$(IFS=,; echo "${all_services[*]}")
printf '%s\n' "${all_services[@]}" | grep -Fxq postgres || fail "compose missing postgres"
printf '%s\n' "${all_services[@]}" | grep -Fxq frontend || fail "compose missing frontend"
printf '%s\n' "${all_services[@]}" | grep -Fxq backend || fail "compose missing backend"
ok "compose services=[${all_joined}]"

# Dual Node tags + empty FE falls back to NODE_VERSION.
# Shell env beats project .env (Compose v5). Retry: concurrent compose can flake.
dual_ok=0
for _try in 1 2 3; do
  dual_cfg="$(
    env \
      NODE_VERSION=22.11.0 \
      FRONTEND_NODE_VERSION= \
      BACKEND_NODE_VERSION=20.18.0 \
      docker compose config
  )" || continue
  printf '%s\n' "$dual_cfg" | grep -Fq 'image: node:22.11.0' || continue
  printf '%s\n' "$dual_cfg" | grep -Fq 'image: node:20.18.0' || continue
  dual_ok=1
  break
done
[[ "$dual_ok" -eq 1 ]] || fail "dual Node image tags not rendered (want FE node:22.11.0 BE node:20.18.0)"
# Nested literal default is asserted via docker-compose.yml image lines above (`:-22.11.0`).
# Built-app volume mounts: trust compose file (rendered config flakes under concurrent compose).
grep -Fq './frontend/.output:/app/.output' docker-compose.yml \
  || fail "docker-compose.yml missing frontend .output volume mount"
grep -Fq './backend:/app' docker-compose.yml \
  || fail "docker-compose.yml missing backend /app volume mount"
# Droplet + local: restart unless-stopped (Ctrl+C on attached compose up still stops; policy helps droplet reboots)
# Service keys are indented two spaces; properties are deeper — do not treat properties as new services.
for svc in postgres backend frontend; do
  awk -v svc="$svc" '
    /^  [a-zA-Z0-9_-]+:/ {
      in_svc = ($0 ~ "^  " svc ":")
      next
    }
    in_svc && /restart:[[:space:]]*unless-stopped/ { found=1 }
    END { exit found ? 0 : 1 }
  ' docker-compose.yml || fail "docker-compose.yml $svc missing restart: unless-stopped"
done
ok compose restart unless-stopped
# Host publish ports use STAGING_* (not remapped unprefixed names in stack.config)
grep -Fq '"${STAGING_STRAPI_PORT:-1337}:1337"' docker-compose.yml \
  || fail "backend host port must interpolate STAGING_STRAPI_PORT"
grep -Fq '"${STAGING_NUXT_PORT:-3000}:3000"' docker-compose.yml \
  || fail "frontend host port must interpolate STAGING_NUXT_PORT"
# Prove STAGING_* host publishes (shell env). Retry under concurrent compose.
port_ok=0
backend_pub=""
frontend_pub=""
for _try in 1 2 3; do
  port_cfg="$(
    env \
      STAGING_STRAPI_PORT=1338 \
      STAGING_NUXT_PORT=3001 \
      docker compose config
  )" || continue
  backend_pub="$(printf '%s\n' "$port_cfg" | awk '
    /^  backend:/ { in_be=1; next }
    in_be && /^  [a-z]/ { in_be=0 }
    in_be && /published:/ { print; exit }
  ')"
  frontend_pub="$(printf '%s\n' "$port_cfg" | awk '
    /^  frontend:/ { in_fe=1; next }
    in_fe && /^  [a-z]/ { in_fe=0 }
    in_fe && /published:/ { print; exit }
  ')"
  [[ "$backend_pub" == *1338* ]] || continue
  [[ "$frontend_pub" == *3001* ]] || continue
  port_ok=1
  break
done
[[ "$port_ok" -eq 1 ]] \
  || fail "STAGING_* host publishes want 1338/3001, got be=${backend_pub:-<empty>} fe=${frontend_pub:-<empty>}"
grep -Fq 'scripts/docker-compose.sh' stack.config.ts \
  && fail "stack.config.ts must not reference scripts/docker-compose.sh"
ok compose node tags + volume mounts + STAGING_* host ports

# --- cheap docs presence + staging modes described ---
[[ -f README.md ]] || fail "README.md missing"
[[ -f AGENTS.md ]] || fail "AGENTS.md missing"
grep -Fiq 'mise' README.md || fail "README.md should mention mise"
grep -Fiq 'SQLite' README.md || fail "README.md should describe SQLite for local development"
grep -Fiq 'mise' AGENTS.md || fail "AGENTS.md should mention mise"
grep -Fiq 'SQLite' AGENTS.md || fail "AGENTS.md should describe SQLite for local development"
# Droplet/containers do not need mise
if ! grep -Ei 'droplet|container' README.md | grep -Eiq 'not.*(mise)|do not.*mise|no mise|without mise|not need mise|not required'; then
  # allow either README phrasing above or AGENTS
  if ! grep -Ei 'droplet|container' AGENTS.md | grep -Eiq 'not.*(mise)|do not.*mise|no mise|without mise|not need mise|not required'; then
    fail "docs must state droplet/containers do not need mise"
  fi
fi
ok docs presence + staging modes

# --- droplet staging scripts (no mise / no stackrun; one-off stock Node containers) ---
[[ -x scripts/staging-build.sh ]] || [[ -f scripts/staging-build.sh ]] \
  || fail "scripts/staging-build.sh missing"
[[ -f scripts/staging-up.sh ]] || fail "scripts/staging-up.sh missing"
grep -Fq 'docker run --rm' scripts/staging-build.sh \
  || fail "staging-build.sh must use docker run --rm one-off containers"
grep -Fq -- '--env-file' scripts/staging-build.sh \
  || fail "staging-build.sh must pass --env-file .env into build containers"
grep -Fq 'npm install' scripts/staging-build.sh \
  || fail "staging-build.sh must run npm install"
grep -Fq 'npm run build' scripts/staging-build.sh \
  || fail "staging-build.sh must run npm run build"
grep -Fq '/root/.npm' scripts/staging-build.sh \
  || fail "staging-build.sh must mount persistent npm cache at /root/.npm"
grep -Fq '.faneqo-lock-sha' scripts/staging-build.sh \
  || fail "staging-build.sh must stamp package-lock hash to skip install"
grep -Fq 'FORCE_NPM_INSTALL' scripts/staging-build.sh \
  || fail "staging-build.sh must support FORCE_NPM_INSTALL override"
grep -Fq '.cache/npm' scripts/staging-build.sh \
  || fail "staging-build.sh must default npm cache under .cache/npm"
grep -Fq 'BUILD_BACKEND' scripts/staging-build.sh \
  || fail "staging-build.sh must support BUILD_BACKEND selective build"
grep -Fq 'BUILD_FRONTEND' scripts/staging-build.sh \
  || fail "staging-build.sh must support BUILD_FRONTEND selective build"
grep -Fq -- '--backend-only' scripts/staging-build.sh \
  || fail "staging-build.sh must support --backend-only"
grep -Fq -- '--frontend-only' scripts/staging-build.sh \
  || fail "staging-build.sh must support --frontend-only"
grep -Fq 'BACKEND_NODE_VERSION:-${NODE_VERSION:-22.11.0}' scripts/staging-build.sh \
  || fail "staging-build.sh must nest BACKEND_NODE_VERSION → NODE_VERSION → 22.11.0"
grep -Fq 'FRONTEND_NODE_VERSION:-${NODE_VERSION:-22.11.0}' scripts/staging-build.sh \
  || fail "staging-build.sh must nest FRONTEND_NODE_VERSION → NODE_VERSION → 22.11.0"
# Selective skip: both flags 0 exits without docker
if ! BUILD_BACKEND=0 BUILD_FRONTEND=0 bash scripts/staging-build.sh 2>&1 | grep -Fq 'staging build skipped'; then
  fail "staging-build.sh with BUILD_BACKEND=0 BUILD_FRONTEND=0 must skip"
fi
# Comments may mention mise/stackrun as "do not use"; forbid live invocations only.
if grep -vE '^[[:space:]]*#' scripts/staging-build.sh | grep -Eq '\bmise\b'; then
  fail "staging-build.sh must not invoke mise (droplet path)"
fi
if grep -vE '^[[:space:]]*#' scripts/staging-build.sh | grep -Eq '\bstackrun\b'; then
  fail "staging-build.sh must not invoke stackrun"
fi
if grep -vE '^[[:space:]]*#' scripts/staging-up.sh | grep -Eq '\bmise\b|\bstackrun\b'; then
  fail "staging-up.sh must not invoke mise or stackrun"
fi
grep -Fq 'staging-build.sh' scripts/staging-up.sh \
  || fail "staging-up.sh must call staging-build.sh"
grep -Fq 'docker compose up -d' scripts/staging-up.sh \
  || fail "staging-up.sh must docker compose up -d"
[[ -f scripts/staging-droplet-deploy.sh ]] || fail "scripts/staging-droplet-deploy.sh missing"
grep -Fq 'git reset --hard' scripts/staging-droplet-deploy.sh \
  || fail "staging-droplet-deploy.sh must git reset --hard to deploy SHA"
grep -Fq 'staging-build.sh' scripts/staging-droplet-deploy.sh \
  || fail "staging-droplet-deploy.sh must call staging-build.sh"
grep -Fq 'git diff --name-only' scripts/staging-droplet-deploy.sh \
  || fail "staging-droplet-deploy.sh must diff paths for selective rebuild"
grep -Fq 'PREV_SHA' scripts/staging-droplet-deploy.sh \
  || fail "staging-droplet-deploy.sh must honor PREV_SHA when caller already reset"
grep -Fq 'FORCE_FULL_BUILD' scripts/staging-droplet-deploy.sh \
  || fail "staging-droplet-deploy.sh must allow FORCE_FULL_BUILD"
grep -Fq -- '--force-recreate' scripts/staging-droplet-deploy.sh \
  || fail "staging-droplet-deploy.sh must force-recreate app containers"
grep -Fq -- '--no-deps' scripts/staging-droplet-deploy.sh \
  || fail "staging-droplet-deploy.sh must use --no-deps (leave postgres)"
if grep -vE '^[[:space:]]*#' scripts/staging-droplet-deploy.sh | grep -Eq '\bmise\b|\bstackrun\b'; then
  fail "staging-droplet-deploy.sh must not invoke mise or stackrun"
fi
grep -Fiq 'droplet' docs/staging-droplet.md || fail "docs/staging-droplet.md missing droplet guidance"
grep -Fiq 'staging-build' README.md || fail "README.md must link droplet staging-build path"
grep -Fiq 'staging-droplet-deploy' docs/staging-droplet.md \
  || fail "docs/staging-droplet.md must document staging-droplet-deploy"
grep -Fiq 'Rollback' docs/staging-droplet.md \
  || fail "docs/staging-droplet.md must document Rollback"
grep -Eiq 'selective|path-aware|BUILD_BACKEND|only rebuild' docs/staging-droplet.md \
  || fail "docs/staging-droplet.md must document selective FE/BE rebuild"
# Staging data strategy (Task 6)
[[ -f docs/staging-data.md ]] || fail "docs/staging-data.md missing"
grep -Fiq 'chalk-volume' docs/staging-data.md \
  || fail "docs/staging-data.md must mention chalk-volume (never attach)"
grep -Eiq 'empty migrate|Empty migrate' docs/staging-data.md \
  || fail "docs/staging-data.md must document empty migrate dogfood model"
grep -Fiq 'mbq-cron' docs/staging-data.md \
  || fail "docs/staging-data.md must keep mbq-cron off"
grep -Fiq 'staging-data' README.md \
  || fail "README.md must link staging-data docs"
# Root GH Actions deploy (Task 5) — SSH thin wrapper; build stays on droplet
[[ -f .github/workflows/deploy-staging.yml ]] || fail ".github/workflows/deploy-staging.yml missing"
grep -Fq 'branches: [staging]' .github/workflows/deploy-staging.yml \
  || grep -Fq $'branches:\n      - staging' .github/workflows/deploy-staging.yml \
  || grep -Eq 'branches:[[:space:]]*\[staging\]|-\s*staging' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must trigger on staging branch"
grep -Fq 'staging-droplet-deploy.sh' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must invoke staging-droplet-deploy.sh"
grep -Fq 'PREV_SHA="$(git rev-parse HEAD)"' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must capture PREV_SHA from HEAD before reset --hard"
grep -Fq 'PREV_SHA="${PREV_SHA}" bash scripts/staging-droplet-deploy.sh' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must pass PREV_SHA into staging-droplet-deploy.sh"
grep -Fq 'STAGING_HOST' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must use STAGING_HOST secret"
grep -Fq 'STAGING_SSH_PRIVATE_KEY' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must use STAGING_SSH_PRIVATE_KEY secret"
grep -Fq 'STAGING_USER' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must use STAGING_USER secret"
grep -Fq 'needs: root-test' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must gate deploy on needs: root-test"
grep -Fq 'uses: ./.github/workflows/root-ci.yml' .github/workflows/deploy-staging.yml \
  || fail "deploy-staging.yml must call root-ci.yml as reusable workflow"
# Root CI (Task 12) — wires existing npm test; no FE/BE builds
[[ -f .github/workflows/root-ci.yml ]] || fail ".github/workflows/root-ci.yml missing"
grep -Fq 'workflow_call:' .github/workflows/root-ci.yml \
  || fail "root-ci.yml must support workflow_call for deploy gate"
grep -Fq 'npm test' .github/workflows/root-ci.yml \
  || fail "root-ci.yml must run npm test"
grep -Fq 'tests/**' .github/workflows/root-ci.yml \
  || fail "root-ci.yml must path-filter on tests/**"
grep -Fq 'docker-compose.yml' .github/workflows/root-ci.yml \
  || fail "root-ci.yml must path-filter on docker-compose.yml"
grep -Fq 'stack.config.ts' .github/workflows/root-ci.yml \
  || fail "root-ci.yml must path-filter on stack.config.ts"
grep -Fiq 'Architecture I' .github/workflows/root-ci.yml \
  || fail "root-ci.yml must document Architecture I / Task 3.7 scope"
ok droplet staging-build scripts + docs + root-ci.yml

echo "root shape checks passed"
