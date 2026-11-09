#!/usr/bin/env bash
# Pull musicbizqr + qrserver into ~/dev, then mirror into faneqo frontend/backend (no .git).
# Preserves backend/.tmp (local sqlite data.db) across backend mirrors.
set -euo pipefail

DEV_ROOT="${DEV_ROOT:-$HOME/dev}"
MONOREPO="${MONOREPO:-$DEV_ROOT/faneqo}"

declare -A REPOS=(
  [musicbizqr]=https://github.com/Nick-tsoukas/musicbizqr
  [qrserver]=https://github.com/Nick-tsoukas/qrserver
)

declare -A DEST=(
  [musicbizqr]=frontend
  [qrserver]=backend
)

clone_or_pull() {
  local name="$1" url="$2" dir="$DEV_ROOT/$name"
  if [[ -d "$dir/.git" ]]; then
    echo "pull $name"
    git -C "$dir" pull --ff-only
  elif [[ -d "$dir" ]]; then
    echo "error: $dir exists but has no .git" >&2
    exit 1
  else
    echo "clone $name"
    git clone "$url" "$dir"
  fi
}

mirror_into_monorepo() {
  local name="$1" dest_name="${DEST[$name]}"
  local src="$DEV_ROOT/$name"
  local dest="$MONOREPO/$dest_name"
  local tmp
  local saved_tmp=""

  [[ -d "$src" ]] || { echo "error: missing $src" >&2; exit 1; }
  [[ -d "$MONOREPO" ]] || { echo "error: missing monorepo $MONOREPO" >&2; exit 1; }

  # Keep local Strapi sqlite (.tmp/data.db) when replacing backend/.
  if [[ "$dest_name" == "backend" && -d "$dest/.tmp" ]]; then
    saved_tmp="$(mktemp -d "$MONOREPO/.preserve-backend-tmp.XXXXXX")"
    mv "$dest/.tmp" "$saved_tmp/.tmp"
    echo "preserved backend/.tmp"
  fi

  tmp="$(mktemp -d "$MONOREPO/.sync-$dest_name.XXXXXX")"
  # Exact tree copy, then strip nested git metadata from the staging copy.
  rsync -a --delete --exclude '.git' "$src"/ "$tmp"/
  rm -rf "$dest"
  mv "$tmp" "$dest"

  if [[ -n "$saved_tmp" && -d "$saved_tmp/.tmp" ]]; then
    rm -rf "$dest/.tmp"
    mv "$saved_tmp/.tmp" "$dest/.tmp"
    rm -rf "$saved_tmp"
    echo "restored backend/.tmp"
  fi

  echo "mirrored $name -> $dest"
}

main() {
  for name in musicbizqr qrserver; do
    clone_or_pull "$name" "${REPOS[$name]}"
  done
  for name in musicbizqr qrserver; do
    mirror_into_monorepo "$name"
  done
  echo "done"
}

main "$@"
