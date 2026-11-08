# Audit issues (tracked extracts)

Workspace track for the product/code/copy audit that lives under gitignored `.audit/`. Durable pointer only — the executable prioritized checklist is [`tasks/audit-issues.md`](../tasks/audit-issues.md). How we got here: [`tasks/audit-issues-plan.md`](../tasks/audit-issues-plan.md), extraction checklist [`tasks/audit-issues-todo.md`](../tasks/audit-issues-todo.md).

## Source (leave as-is)

| Path | Role |
|------|------|
| `.audit/github-issues.json` | 37 local draft issues (`publish: false`) |
| `.audit/FINDINGS.md` | Evidence |
| `.audit/REMEDIATION_PLAN.md` | Fix order / do-nots |
| `.audit/GLOSSARY.md` | Band / Pro / Lifetime Pro vocabulary |
| `.audit/PRODUCT.md` | Band-as-customer + public-page notes |
| `.audit/REVIEW_CHECKLIST.md` | Private production probes (status codes only) |

`.audit/` stays gitignored. Do not rewrite those files for this track. Netlify HTML (`index.html`, `DEPLOY.md`) and `page-cards/` are reading notes / a site — **not** the work queue.

## Work queue

Open [`tasks/audit-issues.md`](../tasks/audit-issues.md). Order: P0 map → P1 security → billing guard → data / live dead pages → marketing → vocabulary → P2 → P3 architecture → P4 tests.

A checked box there means the draft is **tracked**, not that product code is fixed. Product remediation and GitHub filing need separate explicit approval (monorepo Task 17 still gates late audit *action* on staging/cutover readiness).

## Do not

- Change Stripe amounts, the 30-day trial, or the meaning of `plan` / `free` (Lifetime Pro).
- Charge fans or add a limited Free tier.
- Register `POST /stripe/confirm-social`.
- Claim YouTube routes are reachable in production (probes stay on the private checklist).
- Publish toy band names or treat each page-card as its own issue.
- Edit `frontend/` / `backend/` from this documentation track alone.
