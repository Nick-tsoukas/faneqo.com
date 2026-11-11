# Implementation Plan: Resolve audit issues

## Overview

Fix the product and copy problems listed in [`tasks/audit-issues.md`](audit-issues.md), one approved step at a time. Track progress by checking items in [`tasks/audit-issues-todo.md`](audit-issues-todo.md). This file is the **central plan** for that work.

This track is **parallel** to the monorepo/staging plan (`tasks/plan.md` / `tasks/todo.md`). Do not overwrite that plan. Monorepo Task 17 is the late gate that may authorize starting here; until then this plan stays design-only.

**Status: designing — do not start remediation yet.**

## How work runs

1. Human approves the next step (usually one issue id, or one small band).
2. Agent reads that issue’s section in `tasks/audit-issues.md` (description + acceptance criteria).
3. Agent implements only that step in the named product tree (`frontend/` ≈ musicbizqr, `backend/` ≈ qrserver).
4. Verify against that issue’s acceptance criteria.
5. Check off the issue in `tasks/audit-issues-todo.md`. Check off matching criteria on the issue page when done.
6. Stop. Wait for the next approval. No batching without an explicit go.

## Roles of the three files

| File | Role |
|------|------|
| `tasks/audit-issues-plan.md` | **This plan** — order, phases, gates, do-nots, risks |
| `tasks/audit-issues-todo.md` | **Progress** — check boxes as issues resolve |
| `tasks/audit-issues.md` | **Specs** — inventory + full acceptance criteria per id |

## Standing do-nots

- Do not change Stripe amounts, the 30-day trial, or Lifetime Pro / `plan=free` meaning.
- Do not charge fans; do not add a limited Free tier or a fan plan.
- Leave `POST /stripe/confirm-social` unregistered.
- Do not claim YouTube routes are reachable in production in issue or PR text.
- Do not publish toy band names.
- Do not treat marketing page-scan notes as extra issues.
- Do not file GitHub issues unless separately approved.
- Do not start the next priority band until the current checkpoint is reviewed.
- Do **not** hardcode CORS hosts in `middlewares.js` (including a one-off staging FE string). Origins = public-URL env SoT + optional comma-separated extras (`sec-009`).
- Do not ship a blind open Nitro proxy that forwards arbitrary Strapi paths without an allowlist / product route shape (`sec-008`).

## Architecture decisions

1. **One step, then stop.** Default unit = one draft id. Larger parents (`audit-parent`, `mkt-001`, `vocab-001`) are maps — work the children.
2. **Guards are verify-only** (`bill-001`, `bill-002`, `mkt-013`): confirm product rules stay correct; do not “fix” by changing billing meaning.
3. **Priority order is locked** unless a human reorders in writing:
   1. P1 security auth (`sec-001` → `sec-002` → `sec-005`)
   2. P1 security FE↔BE trust (`sec-006` map → `sec-007` → `sec-008` → `sec-009`) — browsers must not see or call Strapi; Nitro BFF; CORS origins from public-URL env SoT + optional comma-separated extras (**no hardcoded host list**). **Do not** patch staging by editing a string array in `middlewares.js` (supersedes staging Task 6b.4).
   3. P1 billing guard (`bill-001`)
   4. P1 data + live dead (`data-001`, `dead-004`, `dead-005`)
   5. P1 marketing children (`mkt-002`…`mkt-012`, `mkt-014`; `mkt-001` is the map)
   6. P1 vocabulary children (`vocab-002`…`vocab-004`; `vocab-001` is the map)
   7. P2 tooling first: `test-002` (FE test discover runner — stop `package.json` `&&` file lists / merge conflicts), then `sec-003`, `sec-004` if not closed by `sec-009`, `sec-010`, `sec-011`, `sec-012`, `bill-002`, `dead-002`, `dead-003`, `mkt-013`, `vocab-005`
   8. P3 (`arch-001-api`, `arch-001-app`, `dead-006`) — split only if one function clearly does two jobs
   9. P4 tests (`test-001-api`, `test-001-app`) after the rules they lock exist — **`test-002` before `test-001-app`**
4. **Path citations are starting points.** Re-verify against current `frontend/` / `backend/` at implement time.
5. **Staging / monorepo plan stays the migration SoT.** Audit progress lives under `tasks/audit-issues-*.md`. CORS/BFF work is **this** track, not Task 6b.4.

## Dependency graph

```
Human approval to start (Task 17 or explicit go)
    │
    ├── Phase 1: Security (auth)
    │       sec-001 → sec-002 → sec-005
    │
    ├── Phase 1b: Security (hide Strapi / Nitro BFF / CORS lock)
    │       sec-006 (map)
    │           └── sec-007 → sec-008 → sec-009
    │       (P2 relatives: sec-004, sec-010, sec-011, sec-012)
    │
    ├── Phase 2: Billing guard
    │       bill-001
    │
    ├── Phase 3: Data + live exposure
    │       data-001 → dead-004 → dead-005
    │
    ├── Phase 4: Marketing children
    │       mkt-002 … mkt-012, mkt-014  (mkt-001 = map)
    │
    ├── Phase 5: Vocabulary children
    │       vocab-002 … vocab-004  (vocab-001 = map)
    │
    ├── Phase 6: P2 — test runner first, then cleanup + guards
    │       test-002 → sec-003 / sec-004 / sec-010… / bill-002 / dead-002… / vocab-005
    │
    ├── Phase 7: Architecture / dead code (only if justified)
    │
    └── Phase 8: Tests locking the rules above
            (test-001-app after test-002)
```

## Phases (index — check progress in todo)

### Phase 0 — Plan design (now)

- [ ] Human OK with this plan shape and priority order
- [ ] Explicit **do not start** until a later go (default)

### Phase 1 — Security (auth)

- [ ] `sec-001` YouTube caller checks; remove debug routes
- [ ] `sec-002` user-admin secret only (`USER_ADMIN_SECRET`)
- [ ] `sec-005` explicit auth on four Stripe signup routes

### Checkpoint: Security (auth)

- [ ] Phase 1 auth acceptance criteria pass
- [ ] Human review before Phase 1b (or explicit skip to billing if reordered)

### Phase 1b — Security (FE↔BE: hide Strapi / Nitro BFF / CORS)

Target: browser never learns Strapi URL/IP; browser only talks same-origin to Nuxt; Nuxt server talks to Strapi; Strapi CORS origins come from public-URL env + optional extras (one SoT all envs; no hardcoded list). Added 2026-11-09 from staging CORS dig.

- [ ] `sec-006` map accepted (children ordered below)
- [ ] `sec-007` Strapi URL out of `public` / client payload
- [ ] `sec-008` Nitro same-origin proxy for product traffic
- [ ] `sec-009` CORS from public-URL env + comma-separated extras (closes durable `sec-004` path)

### Checkpoint: Security (BFF / CORS)

- [ ] Phase 1b acceptance criteria pass
- [ ] Human review before Phase 2

### Phase 2 — Billing guard

- [ ] `bill-001` confirm `free` = Lifetime Pro; no limited Free tier

### Checkpoint: Billing

- [ ] Guard still holds; no Stripe amount changes
- [ ] Human review before Phase 3

### Phase 3 — Data + live exposure

- [ ] `data-001` musicbizqr / musicbizqr.com → faneqo / faneqo.com in files + DB (SQL SoT; not article dump)
- [ ] `dead-004` test/preview pages off live site
- [ ] `dead-005` lab pages 404 in production

### Checkpoint: Data / exposure

- [ ] Phase 3 criteria pass
- [ ] Human review before Phase 4

### Phase 4 — Marketing

- [ ] Children `mkt-002` … `mkt-012`, `mkt-014` (see todo for full list)
- [ ] `mkt-001` map closed when children done

### Checkpoint: Marketing

- [ ] Public copy matches band-as-customer offer without false free claims
- [ ] Human review before Phase 5

### Phase 5 — Vocabulary

- [ ] Children `vocab-002` … `vocab-004`
- [ ] `vocab-001` map closed when children done

### Checkpoint: Vocabulary

- [ ] Visible strings use band / band page / band owner / Pro / Lifetime Pro as specified
- [ ] Human review before Phase 6

### Phase 6 — P2

Order inside the band (High tooling first):

- [ ] `test-002` FE tests in one dir; `npm test` discovers (no `package.json` `&&` file lists)
- [ ] `sec-003`, `sec-004` (if not already closed by `sec-009`), `sec-010`, `sec-011`, `sec-012`, `bill-002`, `dead-002`, `dead-003`, `mkt-013`, `vocab-005`

### Checkpoint: P2

- [ ] Phase 6 criteria pass
- [ ] Human review before Phase 7

### Phase 7 — Architecture / unused code

- [ ] `arch-001-api`, `arch-001-app` only if two-job split confirmed
- [ ] `dead-006` unused components (careful; evidence first)

### Checkpoint: P3

- [ ] No speculative refactors
- [ ] Human review before Phase 8

### Phase 8 — Tests

- [ ] `test-001-api`, `test-001-app` (`test-001-app` after `test-002`)

### Checkpoint: Complete

- [ ] All actionable todo items checked (maps/guards as defined)
- [ ] Standing do-nots still true
- [ ] Human sign-off

## Priority map (quick)

| Band | Ids |
|------|-----|
| Map | `audit-parent` |
| P1 Security (auth) | `sec-001`, `sec-002`, `sec-005` |
| P1 Security (BFF/CORS) | `sec-006` (map), `sec-007`, `sec-008`, `sec-009` |
| P1 Billing guard | `bill-001` |
| P1 Data / live dead | `data-001`, `dead-004`, `dead-005` |
| P1 Marketing | `mkt-001` (map), `mkt-002`…`mkt-012`, `mkt-014` |
| P1 Vocabulary | `vocab-001` (map), `vocab-002`…`vocab-004` |
| P2 | `test-002` (first), `sec-003`, `sec-004`, `sec-010`, `sec-011`, `sec-012`, `bill-002`, `dead-002`, `dead-003`, `mkt-013`, `vocab-005` |
| P3 | `arch-001-api`, `arch-001-app`, `dead-006` |
| P4 | `test-001-api`, `test-001-app` (after `test-002`) |

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Start before staging/Task 17 intent | Med | Status = designing; require explicit go |
| Drift from staging monorepo plan | High | Separate files; never overwrite `tasks/todo.md` |
| Accidental billing/Stripe change | High | Standing do-nots; guards are verify-only |
| Speculative P3 refactors | Med | Split only with evidence of two jobs |
| Scope creep across bands | Med | One approved id (or named set) per session |
| “Fix” staging CORS by hardcoding FE in middlewares | High | Forbidden — set public-URL env (`sec-009`); 6b.4 deferred |
| Blind open `/api` proxy | High | `sec-008` requires allowlisted / product-shaped Nitro routes |
| Hardcoded CORS host drift (fanecco / LAN) | Med | Env SoT only; empty env = empty allowlist |
| FE `package.json` `&&` test lists | High | `test-002` discover runner; do not lengthen lists |

## Open questions

- Start audit remediation before monorepo Task 17, or only after? Default: **wait for explicit go** (Task 17 or earlier override).
- File GitHub issues when fixing, or fix in product remotes only? Default: **product remotes / monorepo as directed; no GitHub audit filing unless asked**.
- Start Phase 1b (BFF/CORS) before or after Phase 1 auth? Default: **after auth checkpoint**, unless human reorders (BFF is large).
