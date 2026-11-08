#!/usr/bin/env bash
# Root shape checks: scripts, mise, example.env, stack overlays, compose, docs.
# No FE/BE builds. No staging-profile asserts until Task 3.6.
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
ok stack.config.ts overlays

# --- docker-compose.yml current truth: postgres only (no staging profile yet) ---
[[ -f docker-compose.yml ]] || fail "docker-compose.yml missing"
grep -Eq '^[[:space:]]*postgres:' docker-compose.yml || fail "docker-compose.yml missing postgres service"
grep -Fq 'image: postgres:16' docker-compose.yml || fail "docker-compose.yml expected postgres:16"
ok docker-compose postgres

# --- cheap docs presence ---
[[ -f README.md ]] || fail "README.md missing"
[[ -f AGENTS.md ]] || fail "AGENTS.md missing"
ok docs presence

echo "root shape checks passed"
