# Implementation Plan: Audit findings → prioritized issues task page

## Overview

Leave `.audit/` untouched (including HTML, Netlify deploy, and page-cards). Extract the **37 draft issues** already in `.audit/github-issues.json` (backed by `FINDINGS.md` / `REMEDIATION_PLAN.md`) into **tracked workspace docs** that match how this repo already runs work: `docs/` for durable notes, `tasks/` for ordered checklists with acceptance criteria and verification. End state: one prioritized **issues task page** humans and agents can execute without opening the Netlify site or mining page-cards.

This plan does **not** overwrite the incomplete monorepo/staging plan in `tasks/plan.md` + `tasks/todo.md`. Those stay canonical for staging/history/cutover. Audit extraction is a **parallel track** under the filenames below. Monorepo Phase 9 / Task 17 can later point here once staging is ready; this work does not wait on cutover for **documentation only**.

**Out of scope for this plan:** product code under `frontend/` / `backend/`, filing GitHub issues, Netlify republish, page-card rescans, editing `.audit/` files, Stripe/price changes, fan charges.

## Current state (verified 2026-11-08)

| Fact | Evidence |
|------|----------|
| Audit tree is `.audit/` (gitignored), not `audit/` | Root listing; `.gitignore` has `.audit/` |
| Issue drafts: **37** in `.audit/github-issues.json` | `publish: false`; parent `audit-parent` + children |
| Priority mix | P0×1 map; P1×24; P2×7; P3×3; P4×2 |
| Prefixes | `sec` 5, `bill` 2, `mkt` 14, `vocab` 5, `dead` 5, `data` 1, `arch` 2, `test` 2 + parent |
| Remediation order already written | `.audit/REMEDIATION_PLAN.md` (sec → bill guard → mkt → vocab → dead/data → arch → test) |
| Page-cards = reading notes, not bug list | `FINDINGS.md` + remediation “Do not file each note” |
| Workspace task style | `tasks/todo.md` Task blocks: Description / Acceptance / Verification / Dependencies / Files / Scope |
| Docs style today | Short durable notes under `docs/` (e.g. `mise-install.md`) |
| Monorepo Task 17 | “Begin audit work from `.audit/`” — late; Netlify-oriented; incomplete open item on audit-in-repo |

## Architecture Decisions

1. **Parallel task files, no overwrite.** Write `tasks/audit-issues-plan.md` (this file) and `tasks/audit-issues-todo.md`. Do not replace monorepo `tasks/plan.md` / `tasks/todo.md`.
2. **Single issues task page = `tasks/audit-issues.md`.** One checklist ordered by remediation priority (not by JSON array order). Each draft id (`sec-001`, `mkt-002`, …) becomes one Task-shaped section with acceptance criteria copied/adapted from `github-issues.json` `acceptanceCriteria` + body constraints. Parent `audit-parent` and umbrella `mkt-001` / `vocab-001` stay as map/parent tasks, not duplicate work.
3. **Companion index in docs (optional thin pointer).** `docs/audit-issues.md` = short human index: what the task page is, source `.audit/` paths, do-not list, link to `tasks/audit-issues.md`. Keeps `docs/` for orientation; `tasks/` for executable checkboxes. Avoid duplicating full issue bodies in both places.
4. **Source of truth for evidence stays `.audit/`.** New files cite draft ids and finding ids; they do not invent new findings or re-score page-cards. Page-cards and `index.html` / `DEPLOY.md` are ignored for extraction.
5. **Priority sort rule (locked for the issues page):**
   1. P0 map (`audit-parent`)
   2. P1 security (`sec-001`, `sec-002`, `sec-005`) then P1 billing guards (`bill-001`) then remaining P1 (`data-001`, dead live-site leaks, mkt children, vocab) following `REMEDIATION_PLAN.md` order inside the same priority
   3. P2 (remaining sec/bill/dead/vocab/mkt-013)
   4. P3 architecture splits
   5. P4 tests (after the rules they lock)
6. **No product fixes in this track.** Checkbox “done” on the issues page means the **doc task** extracted/verified that issue’s text — not that the product bug is fixed. Product remediation remains separate (and still gated by monorepo Task 17 / explicit approval).
7. **FE/BE paths in issue text stay as citations.** Issues name `musicbizqr/...` and `qrserver/...` paths; this plan does not open those trees to re-verify code. Re-verify only when a later remediation task starts.

## Dependency graph

```
.audit/github-issues.json  (+ FINDINGS / REMEDIATION / GLOSSARY / PRODUCT)
        │
        ├── Task A: inventory + priority table (read-only)
        │
        ├── Task B: docs/audit-issues.md pointer
        │
        └── Task C: tasks/audit-issues.md (full prioritized task page)
                │
                └── Task D: wire pointers (AGENTS.md note + optional monorepo Task 17 cross-link)
                        │
                        └── Checkpoint: human review before any GitHub file / product fix
```

## Task List (extraction work)

### Phase 1: Inventory

- [ ] Task A: Build priority inventory from drafts (see `tasks/audit-issues-todo.md`)

### Checkpoint: Inventory

- [ ] All 37 draft ids listed once with P / effort / repo / parent
- [ ] Drops confirmed: page-cards, HTML, Netlify, REL/PERF leads with no draft

### Phase 2: Documents

- [ ] Task B: Write `docs/audit-issues.md` pointer
- [ ] Task C: Write `tasks/audit-issues.md` single issues task page

### Checkpoint: Docs match house style

- [ ] Issues page uses same Task block shape as `tasks/todo.md`
- [ ] Sorted per Architecture Decision 5
- [ ] `.audit/` unchanged; no FE/BE edits

### Phase 3: Discovery wiring

- [ ] Task D: Point AGENTS.md (and optionally monorepo Task 17 text) at the new files without rewriting the staging plan

### Checkpoint: Complete (this plan)

- [ ] Human reviewed `tasks/audit-issues.md`
- [ ] No GitHub publish / no product remediation started from this track unless separately approved

## Priority map (draft → issues page order)

| Order band | Draft ids | Notes |
|------------|-----------|--------|
| Map | `audit-parent` | Navigation only |
| P1 Security | `sec-001`, `sec-002`, `sec-005` | Remediaton §1; probes stay in `.audit/REVIEW_CHECKLIST.md` |
| P1 Billing guard | `bill-001` | Do not change rules; document/lock |
| P1 Data | `data-001` | Strapi one-time host fix; not article dump |
| P1 Dead (live leak) | `dead-004`, `dead-005` | Live/preview exposure |
| P1 Marketing | `mkt-001` (parent) then `mkt-002`…`mkt-012`, `mkt-014` | Skip filing page-cards; `mkt-013` is P2 guard |
| P1 Vocabulary | `vocab-001` then `vocab-002`…`vocab-004` | Glossary-driven copy only |
| P2 | `sec-003`, `sec-004`, `bill-002`, `dead-002`, `dead-003`, `vocab-005`, `mkt-013` | |
| P3 | `arch-001-api`, `arch-001-app`, `dead-006` | Split only if two jobs confirmed |
| P4 | `test-001-api`, `test-001-app` | After rules exist |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Overwriting monorepo `tasks/todo.md` | High — lose staging progress | Parallel filenames only |
| Duplicating / rewriting `.audit/` | Med — drift | Cite ids; leave `.audit/` frozen |
| Treating page-cards as issues | High — noise | Explicit ignore; MKT evidence only via existing drafts |
| Agents start product fixes from new checklist | High | Issues page marks items as **doc-tracked drafts**; product work needs separate approval |
| Stale tips vs current FE/BE | Med | Findings cite old SHAs; re-verify at remediation time |

## Open Questions (non-blocking for doc extraction)

- When to flip Decision log “Audit in git?” (un-ignore `.audit/` vs keep gitignored + tracked extracts only). Default for this plan: **tracked extracts only**; `.audit/` stays gitignored.
- Whether monorepo Task 17 should be rewritten now or only cross-linked. Default: **one-line cross-link** in Task 17 description after human OK; no phase reorder.

## Assumptions (proceed unless corrected)

1. Parallel files `tasks/audit-issues-*.md` + deliverable `tasks/audit-issues.md` + `docs/audit-issues.md` are correct homes.
2. “Update all of the audit documents” means **extract into new docs/tasks files**, not edit inside `.audit/`.
3. Single issues task page covers all 37 drafts once, prioritized; does not create GitHub issues.
4. Ignoring frontend/backend means no code exploration for this plan beyond path citations already in drafts.
