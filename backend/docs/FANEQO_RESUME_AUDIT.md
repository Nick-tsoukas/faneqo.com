# Faneqo relationship platform — resume audit

> **Superseded for live production status and next-phase sequencing as of 2026-08-20.**
>
> Production unique indexes were independently inspected in Postgres (`pg_indexes`) and confirmed ACTIVE. Live status lives in [`docs/FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md). The next phase is **05B.1 Shared Media Architecture Audit**, not further 05A uniqueness work.
>
> This document remains a useful **2026-08-19 code-state snapshot**. Do not treat the tables below as current production or roadmap truth.
>
> Canonical architecture: [`docs/FANEQO_RELATIONSHIP_PLATFORM.md`](FANEQO_RELATIONSHIP_PLATFORM.md)

**Date:** 2026-08-19  
**Repos:** `qrserver` @ `ff7f747` plus local Phase 05A count-convergence, `musicbizqr` Labs inspector labels  
**Verdict (snapshot):** Integrity keys are in git and deployed as `d4a92f3` or later (`ff7f747` contains them). Production unique-index activation is **not proven** *as of this snapshot*. Canonical show-count contract is locked in application code.

---

## Why this exists

Faneqo is not a Passport feature, a Show Moments feature, or a renderer.

It is a system of record for:

**who this fan is to this artist — and what actually happened.**

Build that truth once. Fan List, check-in, messaging, Passport, recaps, Wrapped, and Share Studio all read from it. External setlists and charts may enrich it. They must never invent a fan, a show, or a stamp.

---

## Current status

| Phase | In git | On production |
| --- | --- | --- |
| 01 Domain audit | Complete | n/a |
| 02 Canonical design | Complete | n/a |
| 03 Labs + FeatureEnrollment | Complete | Unknown until founder seed + deploy confirmed |
| 03.5 Data-flow / performance writeup | Partial (fail-closed Labs exists; no separate 03.5 doc) | n/a |
| 04 RelationshipEvent ledger | Complete | Unknown until deploy confirmed |
| 05A Fan + attendance integrity (app-level) | Complete | App paths ship with the commit; **DB unique indexes not proven** |
| **05A.1 Integrity keys** | **Implemented** | **Deployed code contains keys; index activation pending** |
| 05A show-count contract | Implemented in git | Needs deploy of this overlay |
| 05B Shared Media | Not started | — |
| 06+ Moment / Milestone / Signal / Passport / Share / External engine | Not started as the new model | Legacy objects exist; do not extend them |

Local Cursor cannot see Railway Postgres (`postgres.railway.internal`). Duplicate status on production is **UNKNOWN**.

---

## What is actually in the code

### Labs and feature gates (03)

Private `/labs` and `/api/labs/*`. Default deny. `hasFeature` / `assertFeature` fail closed. Unknown keys deny. Frontend 404 is not authorization — Strapi still 404s the API.

### RelationshipEvent (04)

Thin durable fact ledger. Canonical rows remain truth. No message bodies, no media blobs, no analytics dumps. Broadcast artist updates stored once (`fanId` null). Timeline paginated. Idempotency unique index. Labs inspector gated.

Wired facts: joined, unsubscribed, checked in, returned (from **unsuppressed attendance count ≥ 2**), artist message, fan reply, artist update published, show gallery added, passport claimed.

Registered but not produced (correct): `milestone_earned`, `support_received`.

### Integrity keys (05A.1)

Relation-storage-independent hashes so Postgres can unique-index without `fans.band_id` on the fans table (Strapi v4 uses join tables).

| Row | Field | Built from | Stored |
| --- | --- | --- | --- |
| Fan | `canonicalIdentityKey` | `fan:v1:{bandId}:{normalizedEmail}` | SHA-256 hex only |
| Attendance | `campaignIdentityKey` | `attendance:campaign:v1:{fanId}:{campaignId}` | SHA-256 hex, or null |
| Attendance | `eventIdentityKey` | `attendance:event:v1:{fanId}:{eventId}` | SHA-256 hex, or null |

These are not public IDs, Passport fields, or analytics dimensions.

Unique indexes are **skip-safe**. They create only when the connected database is CLEAN, key coverage is complete, and duplicate key groups are zero.

Email identity is `trim().toLowerCase()`. Fan email/band are not mutated on product write paths; attendance fan/campaign/event are create-only. Admin could still edit a fan — `beforeUpdate` recomputes the key.

`suppressedDuplicate` is written `false` on create and is never set true in this phase.

---

## Count contracts (locked)

**Fan list size:** `fans` with `status = subscribed`.

**Show count:** unsuppressed `fan_show_attendances` (`suppressedDuplicate IS NOT TRUE`).

**Do not use** as canonical truth:

- `fans.checkedInShowCount` (write-side cache; Inbox/Fan List overlay canonical attendance)
- `fan-interaction` check-in rows
- RelationshipEvent row counts
- QR scans / page views
- recap `checkedInShowCount` (that night’s room, not lifetime)
- any future external observation

Shared read: `getCanonicalFanShowSummary` / `getCanonicalFanShowSummaries`. Dashboard repeat attendees use `countCanonicalReturningFans` (canonical showCount >= 2). `show_returned` already counts unsuppressed attendance. Inbox now uses the same contract.

---

## Legacy objects — do not extend

| Existing | What it is | What it is not |
| --- | --- | --- |
| `fan-moment` | Shareable participation card with copy and expiry | The thin durable Moment index |
| `band-share` / analytics shareables | Current share plumbing | ShareSnapshot / Story Engine |
| `band-external-metric` | YouTube/Muse snapshots | ExternalArtistIdentity / ExternalObservation |

Phase 06 Moments should be a **new** collection. Morphing `fan-moment` would bake share copy into canonical history.

---

## Recommendations

### 1. Close production uniqueness before anything new

Wrong Sarahs and double check-ins poison every later product. More schema will not fix that.

Operator loop (Railway **backend** service, which already has `DATABASE_URL`):

```text
railway login
railway run --service qrserver node scripts/audit-fan-attendance-integrity.js
railway run --service qrserver node scripts/backfill-canonical-integrity-keys.js
railway run --service qrserver node scripts/backfill-canonical-integrity-keys.js --apply
```

Then re-audit. Classify leftover duplicates SAFE / CONFLICTING / UNKNOWN. **Do not auto-merge.** Unique indexes activate when coverage is complete and duplicate key groups are 0.

Confirm Labs founder enrollment exists (`FANEQO_LABS_FOUNDER_USER_ID` or `FANEQO_LABS_FOUNDER_EMAIL`). If unset, Labs is a 404 for everyone.

Do not invent a connection string. Do not add a public repair API.

### 2. One show-count number everywhere

Done in git: Inbox, Fan List, and fan detail overlay `getCanonicalFanShowSummaries` (one grouped query per list). `checkedInShowCount` is a cache, not a second product number. Recap `checkedInShowCount` is that night’s room and stays separate.

### 3. First artist-visible win is the relationship, not a renderer

Once uniqueness is real, the highest-value screen is: **this artist × this fan** — joined, shows, cities, messages, return. Labs already has a timeline inspector. Productize that before Share Studio.

Artists pay for “I can reach the people who were there.” Wrapped is a poster of that fact.

Suggested order after 05A is actually closed:

1. Labs relationship view (already started)
2. Message people who were at a show / who came back
3. First milestones: `fan_artist.first_show`, `second_show`, `first_reply` (type / value / evidence — never store “You came back.”)
4. Then Moments / Passport
5. Then Share Studio (one ShareSnapshot, many renderers; Rive is presentation only)

### 4. Keep the two truths brutal

Faneqo relationship truth: join, attendance, message, support, claim.  
External music intelligence: setlists, YouTube, charts.

A matched setlist may show songs heard live **only if** canonical attendance exists for that show. Scrapers never stamp a Passport.

### 5. Stay on Strapi + Postgres

First bottlenecks will be enrollment-query size, timeline pagination, and attendance counts — not a need for Kafka, Redis, or microservices. Add indexes and workers when a query is slow. Do not add a platform because the architecture diagram got longer.

---

## Do not build yet

- `MediaAsset` table
- Moment / Milestone / Signal / ExternalObservation / ShareSnapshot tables
- `IntelligenceEngine.js`
- Kafka / Redis / event sourcing / a data lake
- Rive in the backend
- Public integrity-repair endpoints
- Automatic fan merge
- Extending `fan-moment`, `band-external-metric`, or `band-share` into the new engine

05B Shared Media (reuse Strapi Upload / S3; Moment later references existing owners) is the right *next product phase* **after** unique indexes are active. Not before.

---

## Acceptance scenario (Sarah × Badflower)

The architecture can already represent:

Join → Nashville check-in → message/reply → Knoxville return.

`show_returned` uses real attendance count. Message facts do not copy bodies. Galleries stay on artist-update. Later setlists cannot invent attendance.

Not built: milestone rows, durable Moments, Passport UI, Share Studio. Those are presentation on top of facts that must stay unique.

Concurrent join/check-in is only airtight **after** production unique indexes exist.

---

## Exact next phase

**Phase 05A.1 implemented / production activation pending.**

Not 05B. Not Moments. Not Share Studio.

Implementation order when starting that work:

1. Confirm Railway backend is on `d4a92f3`
2. Confirm Labs founder enrollment
3. Production duplicate audit
4. Classify duplicates — no auto-merge
5. Integrity-key backfill dry-run, then apply
6. Re-audit (coverage 100%, duplicate key groups 0)
7. Confirm unique indexes **ACTIVE**
8. Only then: 05A complete → 05B Shared Media Foundation

---

## Related docs

- `docs/FANEQO_LABS.md`
- `docs/FANEQO_RELATIONSHIP_EVENTS.md`
- `docs/FANEQO_DATA_INTEGRITY.md`
