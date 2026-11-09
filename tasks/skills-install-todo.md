# Todo: Repo-root agent skills bootstrap

Checklist for [`skills-install-plan.md`](skills-install-plan.md). Migration `tasks/todo.md` stays separate.

**Locked:** project scope only · `npx skills` · packs `addyosmani/agent-skills` + `JuliusBrussee/caveman` · ignore FE/BE agent dirs · rerun updates latest.

**Status 2026-11-09:** Implemented. Scripts + project trees + Cursor rules + Claude project plugins landed. Commit when human asks.

---

## Phase 1: Smoke + scripts

### Task 1: Smoke `npx skills` project install flags

- [x] Both packs install under `.agents/skills/`; Claude symlinks under `.claude/skills/`
- [x] Project-only (no `-g`)
- [x] Argv recorded in scripts

### Task 2: `cursor-install-skills.sh`

- [x] Script executable
- [x] `.cursor/skills/*` → `../../.agents/skills/*`
- [x] Thin `.cursor/rules/{agent-skills,caveman}.mdc` (project paths)

### Task 3: `claude-install-skills.sh`

- [x] Skills via `npx skills -a claude-code`
- [x] Project plugins: `agent-skills@addy-agent-skills` + `caveman@caveman` → `.claude/settings.json`

### Task 4: `install-skills.sh` orchestrator

- [x] Calls cursor + claude scripts

## Checkpoint: Scripts

- [x] 47 skills in `.agents` / `.cursor` / `.claude`
- [x] FE/BE agent dirs untouched

## Phase 2: Wire rules + docs

- [x] `.gitignore`: `/.cursor/` removed (human)
- [x] Task 5: `.cursor/rules` written
- [x] Task 6: `AGENTS.md` layout row for scripts

## Checkpoint: Complete

- [x] Ready for human review / commit request
- [ ] Human: commit skill trees + `skills-lock.json` + `.claude/settings.json`? (default yes)
