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
  "build:frontend": "npm run build --prefix frontend",
  "build:backend": "npm run build --prefix backend",
  build: "npm run build:backend && npm run build:frontend",
  "start:frontend": "npm run start --prefix frontend",
  "start:backend": "npm run start --prefix backend",
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

# --- example.env Node pins ---
[[ -f example.env ]] || fail "example.env missing"
grep -Eq '^NODE_VERSION=' example.env || fail "example.env missing NODE_VERSION="
grep -Eq '^FRONTEND_NODE_VERSION=' example.env || fail "example.env missing FRONTEND_NODE_VERSION="
grep -Eq '^BACKEND_NODE_VERSION=' example.env || fail "example.env missing BACKEND_NODE_VERSION="
ok example.env Node pins

# --- stack.config.ts overlays (text shape; stackrun suite loads it for real) ---
[[ -f stack.config.ts ]] || fail "stack.config.ts missing"
grep -Fq '$development' stack.config.ts || fail "stack.config.ts missing \$development"
grep -Fq '$staging' stack.config.ts || fail "stack.config.ts missing \$staging"
# Top-level commands would be indented two spaces; overlay commands use four+.
if grep -E '^  commands:' stack.config.ts >/dev/null; then
  fail "stack.config.ts must not declare top-level commands (overlays only)"
fi
# Staging must drive compose profile containers, not host develop/dev servers.
grep -Fq -- '--profile staging' stack.config.ts || fail "stack.config.ts \$staging must use --profile staging"
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
ok stack.config.ts overlays

# --- docker-compose.yml: postgres always; FE/BE under staging profile ---
[[ -f docker-compose.yml ]] || fail "docker-compose.yml missing"
grep -Eq '^[[:space:]]*postgres:' docker-compose.yml || fail "docker-compose.yml missing postgres service"
grep -Fq 'image: postgres:16' docker-compose.yml || fail "docker-compose.yml expected postgres:16"
grep -Eq '^[[:space:]]*frontend:' docker-compose.yml || fail "docker-compose.yml missing frontend service"
grep -Eq '^[[:space:]]*backend:' docker-compose.yml || fail "docker-compose.yml missing backend service"
grep -Fq 'profiles:' docker-compose.yml || fail "docker-compose.yml missing profiles"
grep -Fq 'staging' docker-compose.yml || fail "docker-compose.yml missing staging profile"
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
ok docker-compose services + profiles

# --- compose service selection (db-only vs staging profile) ---
mapfile -t default_services < <(docker compose config --services | sort)
default_joined=$(IFS=,; echo "${default_services[*]}")
[[ "$default_joined" == "postgres" ]] \
  || fail "default compose services want only postgres, got: ${default_services[*]}"

mapfile -t staging_services < <(docker compose --profile staging config --services | sort)
staging_joined=$(IFS=,; echo "${staging_services[*]}")
printf '%s\n' "${staging_services[@]}" | grep -Fxq postgres || fail "staging profile missing postgres"
printf '%s\n' "${staging_services[@]}" | grep -Fxq frontend || fail "staging profile missing frontend"
printf '%s\n' "${staging_services[@]}" | grep -Fxq backend || fail "staging profile missing backend"
ok "compose services default=[${default_joined}] staging=[${staging_joined}]"

# Dual Node tags + empty FE falls back to NODE_VERSION; bare defaults → 22.11.0
dual_cfg="$(
  NODE_VERSION=22.11.0 \
  FRONTEND_NODE_VERSION= \
  BACKEND_NODE_VERSION=20.18.0 \
  docker compose --profile staging config
)"
printf '%s\n' "$dual_cfg" | grep -Fq 'image: node:22.11.0' || fail "empty FRONTEND must fall back to NODE_VERSION node:22.11.0"
printf '%s\n' "$dual_cfg" | grep -Fq 'image: node:20.18.0' || fail "backend image tag missing node:20.18.0"
# No project .env pins: --env-file empty + unset shell pins → literal 22.11.0
literal_env="$(mktemp)"
literal_cfg="$(
  env -u NODE_VERSION -u FRONTEND_NODE_VERSION -u BACKEND_NODE_VERSION \
    docker compose --env-file "$literal_env" --profile staging config
)"
rm -f "$literal_env"
printf '%s\n' "$literal_cfg" | grep -Fq 'image: node:22.11.0' \
  || fail "unset NODE_VERSION + FE/BE must fall back to node:22.11.0"
# Built-app volume mounts present
printf '%s\n' "$dual_cfg" | grep -Eq '\.output|/app' || fail "staging config missing built-app volume mounts"
# Dev overlay pins postgres service explicitly
grep -Fq 'docker compose up -d postgres' stack.config.ts \
  || fail "stack.config.ts \$development must up postgres only"
grep -Fq 'scripts/docker-compose.sh' stack.config.ts \
  && fail "stack.config.ts must not reference scripts/docker-compose.sh"
ok compose node tags + volume mounts

# --- cheap docs presence + staging modes described ---
[[ -f README.md ]] || fail "README.md missing"
[[ -f AGENTS.md ]] || fail "AGENTS.md missing"
grep -Fiq 'mise' README.md || fail "README.md should mention mise"
grep -Fiq 'profile staging' README.md || fail "README.md should describe --profile staging"
grep -Fiq 'mise' AGENTS.md || fail "AGENTS.md should mention mise"
grep -Fiq 'profile staging' AGENTS.md || fail "AGENTS.md should describe --profile staging"
# Droplet/containers do not need mise
if ! grep -Ei 'droplet|container' README.md | grep -Eiq 'not.*(mise)|do not.*mise|no mise|without mise|not need mise|not required'; then
  # allow either README phrasing above or AGENTS
  if ! grep -Ei 'droplet|container' AGENTS.md | grep -Eiq 'not.*(mise)|do not.*mise|no mise|without mise|not need mise|not required'; then
    fail "docs must state droplet/containers do not need mise"
  fi
fi
ok docs presence + staging modes

echo "root shape checks passed"
