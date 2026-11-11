#!/usr/bin/env bash
# Merge musicbizqr + qrserver commit history into Nick-tsoukas/faneqo.com.
#
# Tasks 7–10 (tasks/plan.md Architecture B). HOLD until human says go.
# Default = dry-run (no rewrite, no push). Pass --execute to run the merge.
#
# Branch map (important):
#   This monorepo often sits on branch staging.
#   Product remotes compared/imported from MAIN (FRONTEND_REF / BACKEND_REF).
#   Monorepo base for history-merge branch: MONOREPO_REF (default staging).
#
# Tree identity gate:
#   Workspace frontend/ must match musicbizqr@main (and backend/ ↔ qrserver@main)
#   aside from ignored paths (CI under .github/, build/cache junk, local env).
#   Dry-run and --execute both run this check when remotes are reachable.
#   --skip-tree-check bypasses (not recommended). --check-trees runs check only.
#
# First --execute (init): scratch clones → git filter-repo → merge unrelated
# into faneqo.com scratch on branch history-merge. Writes
# tasks/history-merge-state.env.
#
# Later --execute (update): git subtree pull if product main advanced; noop
# if tips match state file.
#
# Never force-pushes musicbizqr / qrserver. Never pushes faneqo.com unless
# --push.
#
# Usage:
#   bash scripts/merge-product-history.sh                 # dry-run + tree check
#   bash scripts/merge-product-history.sh --check-trees   # tree check only
#   bash scripts/merge-product-history.sh --execute
#   bash scripts/merge-product-history.sh --execute --push
#   bash scripts/merge-product-history.sh --help
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FRONTEND_REMOTE="${FRONTEND_REMOTE:-https://github.com/Nick-tsoukas/musicbizqr.git}"
BACKEND_REMOTE="${BACKEND_REMOTE:-https://github.com/Nick-tsoukas/qrserver.git}"
MONOREPO_REMOTE="${MONOREPO_REMOTE:-https://github.com/Nick-tsoukas/faneqo.com.git}"
# Product SoT branches = main. Monorepo work branch for staging content = staging.
FRONTEND_REF="${FRONTEND_REF:-main}"
BACKEND_REF="${BACKEND_REF:-main}"
MONOREPO_REF="${MONOREPO_REF:-staging}"
MERGE_BRANCH="${MERGE_BRANCH:-history-merge}"
SCRATCH="${SCRATCH:-${TMPDIR:-/tmp}/faneqo-history-merge}"
STATE_FILE="${STATE_FILE:-${ROOT}/tasks/history-merge-state.env}"

EXECUTE=0
PUSH=0
APPLY_WORKSPACE=0
FORCE_REINIT=0
SKIP_TREE_CHECK=0
CHECK_TREES_ONLY=0

# Paths that may differ without blocking history merge / tree identity.
# CI stays on product remotes until Task 11; build artifacts are local-only.
DIFF_EXCLUDES=(
  .git
  .github
  node_modules
  .output
  .nuxt
  .nitro
  .cache
  .data
  dist
  build
  .strapi
  .strapi-updater.json
  .tmp
  coverage
  logs
  exports
  .DS_Store
  .env
  .env.local
  .env.development
  .env.production
  .visual-review
)

usage() {
  sed -n '2,35p' "$0" | sed 's/^# \?//'
  echo "env overrides: FRONTEND_REMOTE BACKEND_REMOTE MONOREPO_REMOTE"
  echo "               FRONTEND_REF BACKEND_REF MONOREPO_REF MERGE_BRANCH SCRATCH STATE_FILE"
  echo "flags: --execute --push --check-trees --skip-tree-check --force-reinit --apply-to-workspace"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) EXECUTE=1; shift ;;
    --push) PUSH=1; shift ;;
    --apply-to-workspace) APPLY_WORKSPACE=1; shift ;;
    --force-reinit) FORCE_REINIT=1; shift ;;
    --skip-tree-check) SKIP_TREE_CHECK=1; shift ;;
    --check-trees) CHECK_TREES_ONLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "unknown arg: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

die() { echo "error: $*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing command: $1"
}

read_state() {
  FE_MERGED_SHA=""
  BE_MERGED_SHA=""
  if [[ -f "${STATE_FILE}" ]]; then
    # shellcheck disable=SC1090
    source "${STATE_FILE}"
    FE_MERGED_SHA="${FE_MERGED_SHA:-}"
    BE_MERGED_SHA="${BE_MERGED_SHA:-}"
  fi
}

write_state() {
  local fe="$1" be="$2"
  mkdir -p "$(dirname "${STATE_FILE}")"
  cat >"${STATE_FILE}" <<EOF
# Last product tips imported into faneqo.com via scripts/merge-product-history.sh
# Re-run the script after new pushes on musicbizqr / qrserver main.
FE_MERGED_SHA=${fe}
BE_MERGED_SHA=${be}
MERGED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MERGE_BRANCH=${MERGE_BRANCH}
FRONTEND_REMOTE=${FRONTEND_REMOTE}
BACKEND_REMOTE=${BACKEND_REMOTE}
FRONTEND_REF=${FRONTEND_REF}
BACKEND_REF=${BACKEND_REF}
EOF
  echo "==> wrote ${STATE_FILE}"
}

ls_remote_sha() {
  local url="$1" ref="$2"
  git ls-remote "$url" "refs/heads/${ref}" | awk '{print $1}'
}

# Compare workspace tree to product remote@ref (default main). Ignores CI + junk.
compare_workspace_to_remote() {
  local local_dir="$1" url="$2" ref="$3" tip="$4" label="$5"
  local refdir="${SCRATCH}/compare-${label}"
  local report="${SCRATCH}/diff-${label}.txt"
  [[ -d "${local_dir}" ]] || die "missing workspace tree: ${local_dir}"

  rm -rf "${refdir}"
  mkdir -p "${SCRATCH}"
  echo "==> compare ${local_dir} ↔ ${url} (${ref})"
  git clone --no-tags --depth 1 --branch "${ref}" --single-branch "${url}" "${refdir}"
  local got
  got="$(git -C "${refdir}" rev-parse HEAD)"
  if [[ -n "${tip}" && "${got}" != "${tip}" ]]; then
    echo "    WARN: compare clone HEAD ${got} != ls-remote tip ${tip}"
  else
    echo "    remote HEAD ${got}"
  fi

  local diff_args=()
  local x
  for x in "${DIFF_EXCLUDES[@]}"; do
    diff_args+=(-x "${x}")
  done

  set +e
  diff -rq "${diff_args[@]}" "${local_dir}" "${refdir}" >"${report}" 2>&1
  local rc=$?
  set -e
  # diff: 0 identical, 1 differ, 2 error
  if [[ "${rc}" -eq 0 ]]; then
    echo "==> ${label}: OK — identical to ${ref} (excluding CI/build/env junk)"
    return 0
  fi
  if [[ "${rc}" -ge 2 ]]; then
    echo "==> ${label}: diff failed (exit ${rc}); see ${report}" >&2
    head -50 "${report}" >&2 || true
    return 2
  fi
  echo "==> ${label}: DIFFER from ${url} ${ref} (excluding ignored paths)" >&2
  echo "    full report: ${report}" >&2
  head -80 "${report}" >&2 || true
  local n
  n="$(wc -l <"${report}" | tr -d ' ')"
  echo "    (${n} diff lines; ignored: ${DIFF_EXCLUDES[*]})" >&2
  return 1
}

run_tree_checks() {
  local fe_tip="$1" be_tip="$2"
  local rc=0
  compare_workspace_to_remote \
    "${ROOT}/frontend" "${FRONTEND_REMOTE}" "${FRONTEND_REF}" "${fe_tip}" "frontend" \
    || rc=1
  compare_workspace_to_remote \
    "${ROOT}/backend" "${BACKEND_REMOTE}" "${BACKEND_REF}" "${be_tip}" "backend" \
    || rc=1
  return "${rc}"
}

echo "==> merge-product-history (Tasks 7–10)"
echo "    FE  ${FRONTEND_REMOTE} (${FRONTEND_REF})  ← product SoT branch"
echo "    BE  ${BACKEND_REMOTE} (${BACKEND_REF})  ← product SoT branch"
echo "    mono ${MONOREPO_REMOTE} (base ${MONOREPO_REF} → branch ${MERGE_BRANCH})"
echo "    scratch ${SCRATCH}"
echo "    state ${STATE_FILE}"
echo "    note: monorepo may be on staging; product sync/compare uses main"

need_cmd git
need_cmd awk
need_cmd diff

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "==> WARN: git-filter-repo not on PATH (required for --execute first import)"
  echo "    install: pipx install git-filter-repo   # or brew install git-filter-repo"
fi

echo "==> resolving remote tips (read-only)…"
FE_TIP="$(ls_remote_sha "${FRONTEND_REMOTE}" "${FRONTEND_REF}" 2>/dev/null || true)"
BE_TIP="$(ls_remote_sha "${BACKEND_REMOTE}" "${BACKEND_REF}" 2>/dev/null || true)"
if [[ -z "${FE_TIP}" || -z "${BE_TIP}" ]]; then
  echo "    WARN: could not resolve one or both tips (auth/network)."
  echo "    FE tip ${FE_TIP:-"(unresolved)"}"
  echo "    BE tip ${BE_TIP:-"(unresolved)"}"
  if [[ "${EXECUTE}" == "1" || "${CHECK_TREES_ONLY}" == "1" ]]; then
    die "need reachable remotes for --execute / --check-trees"
  fi
else
  echo "    FE tip ${FE_TIP}"
  echo "    BE tip ${BE_TIP}"
fi

read_state
if [[ -n "${FE_MERGED_SHA}" || -n "${BE_MERGED_SHA}" ]]; then
  echo "    last merged FE ${FE_MERGED_SHA:-"(none)"}"
  echo "    last merged BE ${BE_MERGED_SHA:-"(none)"}"
fi

MODE="init"
if [[ "${FORCE_REINIT}" == "1" ]]; then
  MODE="init"
elif [[ -n "${FE_TIP}" && -n "${BE_TIP}" && -n "${FE_MERGED_SHA}" && -n "${BE_MERGED_SHA}" ]]; then
  if [[ "${FE_TIP}" == "${FE_MERGED_SHA}" && "${BE_TIP}" == "${BE_MERGED_SHA}" ]]; then
    MODE="noop"
  else
    MODE="update"
  fi
elif [[ -z "${FE_TIP}" || -z "${BE_TIP}" ]]; then
  MODE="unknown-until-network"
fi
echo "==> planned mode: ${MODE}"

# --- tree identity (workspace ↔ product main) ---
if [[ "${SKIP_TREE_CHECK}" == "1" ]]; then
  echo "==> tree check SKIPPED (--skip-tree-check)"
elif [[ -n "${FE_TIP}" && -n "${BE_TIP}" ]]; then
  echo "==> tree identity: workspace frontend/backend vs product ${FRONTEND_REF}/${BACKEND_REF}"
  if ! run_tree_checks "${FE_TIP}" "${BE_TIP}"; then
    die "workspace trees differ from product remotes (see reports under ${SCRATCH}/diff-*). Sync or justify, then re-run. CI (.github/) and build dirs are ignored."
  fi
else
  echo "==> tree check deferred (no network tips)"
fi

if [[ "${CHECK_TREES_ONLY}" == "1" ]]; then
  echo "==> --check-trees done (no merge)"
  exit 0
fi

if [[ "${EXECUTE}" != "1" ]]; then
  echo "==> dry-run only (pass --execute to run). No filter-repo, no push."
  echo "    tree-only:     bash scripts/merge-product-history.sh --check-trees"
  echo "    first import:  bash scripts/merge-product-history.sh --execute"
  echo "    after review:  bash scripts/merge-product-history.sh --execute --push"
  echo "    later tips:    re-run --execute (subtree pull); no-op if tips unchanged"
  exit 0
fi

# --- execute path ---
need_cmd git-filter-repo
[[ -n "${FE_TIP}" && -n "${BE_TIP}" ]] || die "unresolved tips"

if [[ "${MODE}" == "noop" ]]; then
  echo "==> already at FE/BE tips recorded in state — nothing to do"
  exit 0
fi

rm -rf "${SCRATCH}/monorepo" "${SCRATCH}/musicbizqr" "${SCRATCH}/qrserver"
mkdir -p "${SCRATCH}"
MONO="${SCRATCH}/monorepo"
FE_SCRATCH="${SCRATCH}/musicbizqr"
BE_SCRATCH="${SCRATCH}/qrserver"

echo "==> clone monorepo ${MONOREPO_REMOTE} (${MONOREPO_REF}) → ${MONO}"
git clone --no-tags --branch "${MONOREPO_REF}" --single-branch "${MONOREPO_REMOTE}" "${MONO}"
git -C "${MONO}" checkout -B "${MERGE_BRANCH}"

if ! git -C "${MONO}" rev-parse -q --verify "refs/tags/backup/content-only-before-history" >/dev/null; then
  git -C "${MONO}" tag "backup/content-only-before-history" HEAD
  echo "==> tagged backup/content-only-before-history at $(git -C "${MONO}" rev-parse --short HEAD)"
fi

import_tree_filter_repo() {
  local url="$1" tip="$2" dest="$3" prefix="$4"
  echo "==> clone ${url} @ ${tip} → ${dest}"
  git clone --no-tags "${url}" "${dest}"
  git -C "${dest}" checkout --detach "${tip}"
  echo "==> filter-repo --to-subdirectory-filter ${prefix}"
  git -C "${dest}" filter-repo --force --to-subdirectory-filter "${prefix}"
}

merge_unrelated_prefix() {
  local scratch="$1" remote_name="$2" prefix="$3"
  git -C "${MONO}" remote remove "${remote_name}" 2>/dev/null || true
  git -C "${MONO}" remote add "${remote_name}" "${scratch}"
  git -C "${MONO}" fetch "${remote_name}"
  local tip
  tip="$(git -C "${MONO}" rev-parse "${remote_name}/HEAD" 2>/dev/null \
    || git -C "${MONO}" rev-parse "${remote_name}/main" 2>/dev/null \
    || git -C "${scratch}" rev-parse HEAD)"
  echo "==> merge unrelated ${remote_name} (${prefix}/) @ ${tip}"
  if ! git -C "${MONO}" merge --allow-unrelated-histories --no-edit -m \
    "merge(${prefix}): import ${remote_name} history via filter-repo" "${tip}"; then
    echo "==> merge conflict — resolve in ${MONO}, then continue manually" >&2
    die "unresolved merge for ${prefix}"
  fi
}

subtree_pull_prefix() {
  local url="$1" ref="$2" tip="$3" prefix="$4" remote_name="$5"
  git -C "${MONO}" remote remove "${remote_name}" 2>/dev/null || true
  git -C "${MONO}" remote add "${remote_name}" "${url}"
  git -C "${MONO}" fetch "${remote_name}" "${ref}"
  echo "==> subtree pull --prefix=${prefix} ${remote_name}/${ref} (${tip})"
  if ! git -C "${MONO}" subtree pull --prefix="${prefix}" "${remote_name}" "${ref}" \
    -m "merge(${prefix}): subtree pull ${remote_name} ${ref} @ ${tip}"; then
    die "subtree pull failed for ${prefix} — fix conflicts in ${MONO}"
  fi
}

if [[ "${MODE}" == "init" ]]; then
  import_tree_filter_repo "${FRONTEND_REMOTE}" "${FE_TIP}" "${FE_SCRATCH}" "frontend"
  import_tree_filter_repo "${BACKEND_REMOTE}" "${BE_TIP}" "${BE_SCRATCH}" "backend"
  merge_unrelated_prefix "${FE_SCRATCH}" "import-frontend" "frontend"
  merge_unrelated_prefix "${BE_SCRATCH}" "import-backend" "backend"
elif [[ "${MODE}" == "update" ]]; then
  if [[ "${FE_TIP}" != "${FE_MERGED_SHA}" ]]; then
    subtree_pull_prefix "${FRONTEND_REMOTE}" "${FRONTEND_REF}" "${FE_TIP}" "frontend" "musicbizqr"
  else
    echo "==> frontend tip unchanged — skip"
  fi
  if [[ "${BE_TIP}" != "${BE_MERGED_SHA}" ]]; then
    subtree_pull_prefix "${BACKEND_REMOTE}" "${BACKEND_REF}" "${BE_TIP}" "backend" "qrserver"
  else
    echo "==> backend tip unchanged — skip"
  fi
fi

write_state "${FE_TIP}" "${BE_TIP}"

echo "==> verify log prefixes in ${MONO}"
git -C "${MONO}" log --oneline -5 -- frontend/ || true
git -C "${MONO}" log --oneline -5 -- backend/ || true

if [[ "${PUSH}" == "1" ]]; then
  echo "==> push ${MERGE_BRANCH} (+ backup tag) to ${MONOREPO_REMOTE}"
  git -C "${MONO}" push -u origin "refs/heads/${MERGE_BRANCH}:refs/heads/${MERGE_BRANCH}"
  git -C "${MONO}" push origin "refs/tags/backup/content-only-before-history" || true
  echo "==> pushed. Open PR ${MERGE_BRANCH} → main (or fast-forward main) after review."
  echo "    Do NOT force-push musicbizqr / qrserver."
else
  echo "==> scratch ready at ${MONO} (branch ${MERGE_BRANCH}). Review, then re-run with --push"
fi

if [[ "${APPLY_WORKSPACE}" == "1" ]]; then
  die "--apply-to-workspace not implemented — push history-merge and re-clone workspace from faneqo.com instead"
fi

echo "==> done (mode=${MODE}). Product remotes untouched."
