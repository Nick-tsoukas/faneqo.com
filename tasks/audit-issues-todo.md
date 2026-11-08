# Todo: Audit findings → prioritized issues task page

Canonical checklist for [`tasks/audit-issues-plan.md`](audit-issues-plan.md). Does **not** replace monorepo [`tasks/todo.md`](todo.md).

Leave `.audit/` as-is. Ignore `index.html`, Netlify/`DEPLOY.md`, and `page-cards/`. No `frontend/` / `backend/` edits. No GitHub issue publish in this track.

---

## Phase 1: Inventory

### Task A: Priority inventory from drafts

**Description:** Read `.audit/github-issues.json` (37 issues) plus order cues in `.audit/REMEDIATION_PLAN.md`. Produce a one-table inventory (id, priority, severity, effort, repo, parent, title) sorted by the plan’s priority rule. Confirm drops: no REL/PERF drafts; page-cards not listed as issues.

**Acceptance criteria:**

- [x] All 37 draft ids appear exactly once in the inventory
- [x] Sort matches Architecture Decision 5 in `tasks/audit-issues-plan.md`
- [x] Explicit “ignored sources” note lists HTML, Netlify, page-cards

**Verification:**

- [x] Manual check: `python3` count of `issues` in `github-issues.json` equals inventory rows (37)
- [x] Manual check: no page-card filename appears as an issue id

**Dependencies:** None

**Files likely touched:** inventory section inside `tasks/audit-issues.md`

**Estimated scope:** S

**Done notes (2026-11-08):** Inventory table at top of `tasks/audit-issues.md`; order P0 → P1 sec → bill → data → dead-live → mkt → vocab → P2 → P3 → P4.

---

## Checkpoint: Inventory

- [x] Task A done
- [x] Human skim of priority bands OK (or corrections noted in plan Open Questions)

---

## Phase 2: Documents

### Task B: Write `docs/audit-issues.md` pointer

**Description:** Short durable index in `docs/` matching the house note style. Explain what was audited, where drafts live (`.audit/`, gitignored), what to ignore, and point to `tasks/audit-issues.md` as the executable checklist.

**Acceptance criteria:**

- [x] File exists at `docs/audit-issues.md`
- [x] Links to `tasks/audit-issues.md`, `.audit/FINDINGS.md`, `.audit/REMEDIATION_PLAN.md`, `.audit/GLOSSARY.md`
- [x] States page-cards / HTML / Netlify are out of scope for the task page
- [x] Does not duplicate full issue bodies

**Verification:**

- [x] Manual check: links resolve relative to repo root
- [x] Manual check: `.audit/` files unchanged (mtime/hash spot-check on `github-issues.json`)

**Dependencies:** Task A

**Files likely touched:** `docs/audit-issues.md`

**Estimated scope:** S

---

### Task C: Write `tasks/audit-issues.md` single issues task page

**Description:** One prioritized task page covering every draft in `github-issues.json`, same Task block shape as monorepo `tasks/todo.md`.

**Acceptance criteria:**

- [x] `tasks/audit-issues.md` exists
- [x] All 37 draft ids present as sections
- [x] Order follows plan priority bands
- [x] Each actionable child has acceptance criteria from the JSON draft
- [x] No page-card-derived extra issues invented
- [x] Header states: leave `.audit/` frozen; product fixes need separate approval

**Verification:**

- [x] Manual check: id set equals JSON id set (37 sections)
- [x] Manual check: sample `sec-001`, `mkt-002`, `vocab` sections present with AC
- [x] Manual check: no edits under `frontend/`, `backend/`, or `.audit/`

**Dependencies:** Task A

**Files likely touched:** `tasks/audit-issues.md`

**Estimated scope:** M

---

## Checkpoint: Docs match house style

- [x] Tasks B–C done
- [x] Issues page readable as a work queue
- [x] Review with human before Phase 3 wiring / any remediation — **go 2026-11-08**

---

## Phase 3: Discovery wiring

### Task D: Point workspace entry docs at the new files

**Description:** Pointers in `AGENTS.md` and a one-line cross-link under monorepo Task 17 without rewriting the staging plan.

**Acceptance criteria:**

- [x] `AGENTS.md` links the audit-issues plan + issues page
- [x] Monorepo `tasks/todo.md` Task 17 has a cross-link only
- [x] Staging plan body in `tasks/plan.md` left intact

**Verification:**

- [x] Manual check: pointers in `AGENTS.md` and Task 17
- [x] Manual check: staging checklist not replaced

**Dependencies:** Checkpoint Docs

**Files likely touched:** `AGENTS.md`, `tasks/todo.md` (Task 17 note only)

**Estimated scope:** XS

---

## Checkpoint: Complete

- [x] Tasks A–D done
- [ ] Human reviewed `tasks/audit-issues.md` (product remediation still gated)
- [x] No GitHub issues filed; no product remediation started from this track
- [x] Decision “Audit in git?” still open in monorepo Decisions log

---

## Draft id checklist (Task C completeness)

**P0:** audit-parent

**P1:** sec-001, sec-002, sec-005, bill-001, data-001, dead-004, dead-005, mkt-001, mkt-002, mkt-003, mkt-004, mkt-005, mkt-006, mkt-007, mkt-008, mkt-009, mkt-010, mkt-011, mkt-012, mkt-014, vocab-001, vocab-002, vocab-003, vocab-004

**P2:** sec-003, sec-004, bill-002, dead-002, dead-003, mkt-013, vocab-005

**P3:** arch-001-api, arch-001-app, dead-006

**P4:** test-001-api, test-001-app
