#!/usr/bin/env bash
# Project-only Cursor wiring for agent skills packs + local ag-build.
# SoT: .agents/skills/ (npx skills -a cursor). Discover: .cursor/skills/ symlinks + thin .cursor/rules.
# Rerun refreshes latest. Never -g. Does not touch frontend/backend agent dirs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Full packs (all skills)
PACKS=(
  addyosmani/agent-skills
  JuliusBrussee/caveman
  DietrichGebert/ponytail
)

for pack in "${PACKS[@]}"; do
  echo "==> npx skills add $pack → cursor (project)"
  npx --yes skills add "$pack" --skill '*' -a cursor -y
done

# Cloudflare hub skill only (not whole cloudflare/skills pack)
echo "==> npx skills add cloudflare/skills --skill cloudflare → cursor"
npx --yes skills add cloudflare/skills --skill cloudflare -a cursor -y

echo "==> npx skills update -p"
npx --yes skills update -p -y || echo "warn: skills update exited $? (continuing)"

# Cursor-only: vendored ag-build (agent-skills /build slash wrapper; not upstream as a skill)
echo "==> vendor ag-build (cursor only)"
mkdir -p .agents/skills/ag-build
cp -f "$ROOT/scripts/vendor-skills/ag-build/SKILL.md" .agents/skills/ag-build/SKILL.md

echo "==> link .agents/skills/* → .cursor/skills/"
mkdir -p .cursor/skills
shopt -s nullglob
for src in .agents/skills/*/; do
  name="$(basename "$src")"
  ln -sfn "../../.agents/skills/${name}" ".cursor/skills/${name}"
done
shopt -u nullglob

mkdir -p .cursor/rules

cat > .cursor/rules/agent-skills.mdc <<'EOF'
---
description: Use agent-skills workflows from .cursor/skills
alwaysApply: true
---

Before non-trivial technical work:

1. Route via `.cursor/skills/using-agent-skills/SKILL.md`.
2. Read and follow the matching skill under `.cursor/skills/<name>/SKILL.md`.
3. Open `reference.md` in that folder when the skill links to it.
4. Prefer project skills over guessing; user does not need to say "read skill" each time.

Skills live under `.agents/skills/` (npx skills) and are symlinked into `.cursor/skills/`.
For `/build` / `/ag-build` on Cursor, use `.cursor/skills/ag-build/SKILL.md`.
Do not paste full skill bodies into rules or replies.
EOF

cat > .cursor/rules/caveman.mdc <<'EOF'
---
description: Load and follow the caveman skill on every prompt and response.
alwaysApply: true
---

Before every reply, read and follow `.cursor/skills/caveman/SKILL.md`. Apply that style to this prompt and every response until the user says "stop caveman" or "normal mode". Do not paste the skill into this rule.
EOF

# Thin pointer (full always-on ladder lives in the skill). Upstream also ships a fat .mdc / hooks — we keep rules thin like caveman.
cat > .cursor/rules/ponytail.mdc <<'EOF'
---
description: Load and follow the ponytail skill on every prompt and response.
alwaysApply: true
---

Before every reply, read and follow `.cursor/skills/ponytail/SKILL.md`. Apply that style to this prompt and every response until the user says "stop ponytail" or "normal mode". Switch level: `/ponytail lite|full|ultra`. Do not paste the skill into this rule.
EOF

echo "OK: Cursor skills ($(ls .cursor/skills | wc -l)) + rules under $ROOT/.cursor"
