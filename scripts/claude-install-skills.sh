#!/usr/bin/env bash
# Project-only Claude Code wiring for agent skills packs + recommended plugins.
# Skills: npx skills -a claude-code → .agents/skills/ + .claude/skills/ symlinks.
# Plugins: marketplace add + install, --scope project → .claude/settings.json.
# Skips Cursor-only ag-build. Never -g. Does not touch frontend/backend agent dirs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PACKS=(
  addyosmani/agent-skills
  JuliusBrussee/caveman
  DietrichGebert/ponytail
)

for pack in "${PACKS[@]}"; do
  echo "==> npx skills add $pack → claude-code (project)"
  npx --yes skills add "$pack" --skill '*' -a claude-code -y
done

echo "==> npx skills add cloudflare/skills --skill cloudflare → claude-code"
npx --yes skills add cloudflare/skills --skill cloudflare -a claude-code -y

echo "==> npx skills update -p"
npx --yes skills update -p -y || echo "warn: skills update exited $? (continuing)"

# Keep .claude/skills as symlinks into SoT (skills CLI sometimes materializes copies on update)
echo "==> link .agents/skills/* → .claude/skills/ (skip ag-build)"
mkdir -p .claude/skills
shopt -s nullglob
for src in .agents/skills/*/; do
  name="$(basename "$src")"
  [[ "$name" == "ag-build" ]] && continue
  # replace copy/dir with symlink
  if [[ -e ".claude/skills/${name}" && ! -L ".claude/skills/${name}" ]]; then
    rm -rf ".claude/skills/${name}"
  fi
  ln -sfn "../../.agents/skills/${name}" ".claude/skills/${name}"
done
shopt -u nullglob

if ! command -v claude >/dev/null 2>&1; then
  echo "skip: claude CLI not on PATH (.claude/skills/ still installed)"
  exit 0
fi

echo "==> claude plugin marketplaces (project)"
claude plugin marketplace add https://github.com/addyosmani/agent-skills.git --scope project
claude plugin marketplace add https://github.com/JuliusBrussee/caveman.git --scope project
claude plugin marketplace add https://github.com/DietrichGebert/ponytail.git --scope project
claude plugin marketplace add https://github.com/cloudflare/skills.git --scope project

echo "==> claude plugin install (project)"
claude plugin install agent-skills@addy-agent-skills -s project -y
claude plugin install caveman@caveman -s project -y
claude plugin install ponytail@ponytail -s project -y
claude plugin install cloudflare@cloudflare -s project -y

echo "OK: Claude skills + project plugins (.claude/settings.json) under $ROOT"
