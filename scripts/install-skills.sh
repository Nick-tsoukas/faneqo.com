#!/usr/bin/env bash
# Install/update agent-skills + caveman for Cursor and Claude in this repo only.
# Rerun to refresh latest. See cursor-install-skills.sh / claude-install-skills.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "$ROOT/scripts/cursor-install-skills.sh"
bash "$ROOT/scripts/claude-install-skills.sh"

echo "OK: all project skills installed under $ROOT"
