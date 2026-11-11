# Todo: Resolve audit issues

Progress checklist for [`tasks/audit-issues-plan.md`](audit-issues-plan.md). Specs and acceptance criteria: [`tasks/audit-issues.md`](audit-issues.md). Does **not** replace monorepo [`tasks/todo.md`](todo.md).

**Status: not started.** Check an item only when that issue’s acceptance criteria pass in product code (or a guard is verified unchanged). After each check, stop for the next human approval unless told otherwise.

---

## Phase 0: Plan design

- [ ] Human approved [`tasks/audit-issues-plan.md`](audit-issues-plan.md) shape and priority order
- [ ] Explicit go to start Phase 1 (default: wait)

---

## Phase 1: Security (auth)

- [ ] `sec-001` — YouTube routes check the caller; debug routes gone
- [ ] `sec-002` — user-admin accepts only `USER_ADMIN_SECRET`
- [ ] `sec-005` — explicit auth on four Stripe signup routes

### Checkpoint: Security (auth)

- [ ] Phase 1 auth criteria pass
- [ ] Human review before Phase 1b

---

## Phase 1b: Security (hide Strapi / Nitro BFF / CORS)

Browsers must not see or call Strapi. Nuxt server proxies. CORS origins from public-URL env + optional comma-separated extras (no hardcoded list). Supersedes migration Task 6b.4.

- [ ] `sec-006` — map: FE↔BE trust boundary (children below)
- [ ] `sec-007` — Strapi URL out of public client payload
- [ ] `sec-008` — Nitro same-origin proxy for product traffic
- [ ] `sec-009` — CORS from public-URL env SoT + comma-separated extras

### Checkpoint: Security (BFF / CORS)

- [ ] Phase 1b criteria pass
- [ ] Human review before Phase 2

---

## Phase 2: Billing guard

- [ ] `bill-001` — `free` means Lifetime Pro; no limited Free tier shipped

### Checkpoint: Billing

- [ ] Guard holds; Stripe amounts / trial unchanged
- [ ] Human review before Phase 3

---

## Phase 3: Data + live exposure

- [ ] `data-001` — musicbizqr / musicbizqr.com → faneqo / faneqo.com in files + DB (`scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql`)
- [ ] `dead-004` — test/internal preview pages not on the live site
- [ ] `dead-005` — lab pages 404 in production

### Checkpoint: Data / exposure

- [ ] Phase 3 criteria pass
- [ ] Human review before Phase 4

---

## Phase 4: Marketing

- [ ] `mkt-002` — article CTAs / hosts → faneqo.com (+ signup)
- [ ] `mkt-003` — pricing page + sitemap entries
- [ ] `mkt-004` — article close box sells the band page
- [ ] `mkt-005` — post-trial subscribe prompt on dashboard
- [ ] `mkt-006` — Connect fee note when fee env valid; buttons stay off by default
- [ ] `mkt-007` — no agency price while sample data
- [ ] `mkt-008` — strip false free offers; fix merch redirects
- [ ] `mkt-009` — Lifetime Pro comps skip checkout
- [ ] `mkt-010` — `/bands/all` hides toy; says Faneqo; loads all bands
- [ ] `mkt-011` — band editor missing-block checklist
- [ ] `mkt-012` — one completion email to thin-page owners (not fans)
- [ ] `mkt-014` — public copy: customer is a band; owner pays
- [ ] `mkt-001` — map closed (all Phase 4 children done)

### Checkpoint: Marketing

- [ ] Phase 4 criteria pass
- [ ] Human review before Phase 5

---

## Phase 5: Vocabulary

- [ ] `vocab-002` — live pages say Faneqo (legal pages only if company name confirmed)
- [ ] `vocab-003` — visible copy: band / band page / band owner; fan nav Bands
- [ ] `vocab-004` — “free” only for the 30-day Pro trial
- [ ] `vocab-001` — map closed (all Phase 5 children done)

### Checkpoint: Vocabulary

- [ ] Phase 5 criteria pass
- [ ] Human review before Phase 6

---

## Phase 6: P2

High tooling first, then the rest of the band:

- [ ] `test-002` — FE tests in one dir; `npm test` discovers (no `package.json` `&&` file lists)
- [ ] `sec-003` — Stripe webhook failure returns fixed string
- [ ] `sec-004` — fanecco / LAN off allowlist (or already closed by `sec-009`)
- [ ] `sec-010` — no hardcoded Railway / api.musicbizqr.com in client pages
- [ ] `sec-011` — production middlewares: real CSP + upload-enumeration block
- [ ] `sec-012` — staging admin / :1337 not needlessly public
- [ ] `bill-002` — Connect fee / buttons / trial / subscription-check guard verified
- [ ] `dead-002` — unused pages/components removed or justified kept
- [ ] `dead-003` — old homepages off live site
- [ ] `mkt-013` — toy pages never emailed (guard with mkt-012)
- [ ] `vocab-005` — team copy: manager and viewer only

### Checkpoint: P2

- [ ] Phase 6 criteria pass
- [ ] Human review before Phase 7

---

## Phase 7: Architecture / unused code

- [ ] `arch-001-api` — split only if band permission / inbox / artist update clearly two jobs
- [ ] `arch-001-app` — live-show gallery split only if two jobs
- [ ] `dead-006` — unreferenced components handled with evidence

### Checkpoint: P3

- [ ] No speculative refactors
- [ ] Human review before Phase 8

---

## Phase 8: Tests

- [ ] `test-001-api` — tests lock YouTube caller check + user-admin secret rule
- [ ] `test-001-app` — tests lock `free` = Lifetime Pro (after `test-002`)

### Checkpoint: Complete

- [ ] All actionable items above checked
- [ ] Standing do-nots in the plan still true
- [ ] Human sign-off

---

## Map-only (no separate product step)

- [ ] `audit-parent` — closed when child work tracked above is done (navigation map only)
- [ ] `sec-006` — closed when `sec-007`–`sec-009` done (FE↔BE trust map)
