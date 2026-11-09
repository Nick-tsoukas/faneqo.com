# Implementation Plan: Repo-root agent skills bootstrap

## Overview

Add three root scripts that install **addyosmani/agent-skills** and **JuliusBrussee/caveman** into **this repo only** (not `~/`). Use `npx skills` (project scope). Rerun = refresh to latest. Wire thin project rules under `.cursor/rules/`. Do **not** touch `frontend/` or `backend/` agent dirs (post–history-merge).

**Separate from** migration `tasks/plan.md` / `tasks/todo.md` — those stay untouched.

**Status 2026-11-09:** Implemented. Packs: agent-skills, caveman, ponytail (full), cloudflare (`cloudflare` skill only), Cursor-only `ag-build`. Claude project plugins for all four remotes. Awaiting human commit.

## Scope (locked)

| In | Out |
|----|-----|
| Repo-root `scripts/{install,claude-install,cursor-install}-skills.sh` | User-global `~/.agents`, `~/.cursor`, `~/.claude` |
| Project `.agents/skills/`, `.claude/skills/`, `.cursor/` **as needed** | Editing `frontend/**/.cursor`, `backend/**/.cursor`, FE/BE skills |
| `npx skills add` / `update` against the two GitHub packs | Caveman full CLI / proxy / Cloud |
| Thin `.cursor/rules/*.mdc` pointing at **project** skills | Pasting full `SKILL.md` into rules |

## Architecture Decisions

1. **Installer = `npx skills` (project default, never `-g`).** Canonical paths from [vercel-labs/skills agents table](https://github.com/vercel-labs/skills/blob/main/docs/agents.md):
   - Cursor → `.agents/skills/`
   - Claude Code → `.claude/skills/`
   - Cursor also reads `.agents/skills/`, `.cursor/skills/`, `.claude/skills/` ([Cursor skills docs](https://cursor.com/docs/skills)).

2. **Script split**
   - `scripts/install-skills.sh` — cd repo root; install/update both packs for Cursor + Claude; ensure thin Cursor rules.
   - `scripts/cursor-install-skills.sh` — same packs, `-a cursor` only; ensure `.cursor/rules/{agent-skills,caveman}.mdc` with **project** paths (`.agents/skills/…`, not `~/`).
   - `scripts/claude-install-skills.sh` — same packs, `-a claude-code` only.

3. **Rerun = latest.** Non-interactive:
   ```bash
   npx skills add addyosmani/agent-skills --skill '*' -a <agents> -y
   npx skills add JuliusBrussee/caveman --skill '*' -a <agents> -y
   npx skills update -p -y
   ```
   Prefer `add` then `update -p -y` so first run installs and later runs refresh. Exact flag combo verified in Task 1 smoke.

4. **`.cursor/skills/`** — not required by `npx skills -a cursor` (writes `.agents/skills/`). Leave for **repo-local custom** skills only; do not mirror whole packs unless smoke shows Cursor missing `.agents/skills/`. Rules live under `.cursor/rules/`.

5. **Git tracking** — scripts write trees + `skills-lock.json` under repo root. **Done by human:** root `.gitignore` no longer ignores `/.cursor/`, so `.cursor/rules/` (and optional `.cursor/skills/`) ship upstream in this slice. Whether to commit generated skill trees vs lock-only: default **commit lock + rules; commit skill trees too** so clone works offline — confirm at review if trees too large.

6. **FE/BE ignore (agent discipline, not gitignore change for this task).** No reads/writes under `frontend/.cursor`, `backend/.cursor`, or nested product skill dirs until after history merge.

## Target layout (repo root)

```text
faneqo/
├── scripts/
│   ├── install-skills.sh
│   ├── cursor-install-skills.sh
│   └── claude-install-skills.sh
├── .agents/skills/          # from -a cursor (and universal SoT)
├── .claude/skills/          # from -a claude-code
├── .cursor/
│   ├── rules/
│   │   ├── agent-skills.mdc
│   │   └── caveman.mdc
│   └── skills/              # optional; custom only
└── skills-lock.json         # written by npx skills
```

## Task List

### Phase 1: Smoke + scripts

- [ ] Task 1: Smoke `npx skills` project install flags
- [ ] Task 2: `cursor-install-skills.sh`
- [ ] Task 3: `claude-install-skills.sh`
- [ ] Task 4: `install-skills.sh` orchestrator

### Checkpoint: Scripts

- [ ] Dry run from repo root installs both packs under project paths only
- [ ] Second run refreshes / does not write under `~/`
- [ ] `frontend/` / `backend/` agent trees untouched

### Phase 2: Wire rules + docs

- [x] `.gitignore`: `/.cursor/` removed (human) — root `.cursor/` trackable
- [ ] Task 5: Project `.cursor/rules` (trackable; no gitignore work left)
- [ ] Task 6: One-line docs pointer (`AGENTS.md` or `README`)

### Checkpoint: Complete

- [ ] Acceptance criteria met
- [ ] Human review before committing large skill trees

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Interactive `npx skills` prompts break CI/scripts | Med | Always `-y`; pin agents with `-a`; smoke in Task 1 |
| Huge skill trees in git | Med | Measure size after first install; optional lock-only + `experimental_install` later |
| Cursor looks only at `.cursor/skills/` in some builds | Low | Docs say `.agents/skills/` works; if not, symlink or `--copy` into `.cursor/skills/` |
| Accidental FE/BE edits | Med | Scripts `cd` to repo root via `$0`; never `find` under frontend/backend |
| Overwrite migration plan | High | This file is `tasks/skills-install-*.md` only |

## Open Questions

- Commit full `.agents/skills` + `.claude/skills` trees, or lockfile + restore script only? **Default: commit trees + lock** unless size complains.
- Any extra packs beyond the two named? **No** for v1.
