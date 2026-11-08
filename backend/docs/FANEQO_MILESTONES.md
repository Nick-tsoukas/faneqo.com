# Milestones (Phase 07)

Durable semantic interpretation that a relationship crossed a meaningful threshold. Canonical domain rows remain truth.

Platform architecture: [`FANEQO_RELATIONSHIP_PLATFORM.md`](FANEQO_RELATIONSHIP_PLATFORM.md). Live phase: [`FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md).

**Frontend visibility is not authorization.**  
**Milestone reference does not grant media, Night Story, DM, or ArtistUpdate access.**  
**Presentation copy is not stored on Milestone.**

## Layers

| Layer | Owner |
| --- | --- |
| Canonical show | unsuppressed `fan-show-attendance` |
| Canonical reply | RelationshipEvent `fan_replied` |
| Semantic interpretation | Milestone (`fan_artist.first_show`, `second_show`, `first_reply`) |
| Sparse history | Moment (`kind=show` only in Phase 06/07) |
| Prepared view | ArtistFanProgression.milestones[] (not persisted) |
| Presentation | Labs `/labs/relationship` mapper |

Milestone is **not** Moment, RelationshipEvent, attendance, a score, or Passport.

`kind=milestone` on Moment remains reserved. Phase 07 does **not** emit Moment rows for milestones. Progression reads Milestone directly so there is one semantic owner.

## Schema (persisted)

Collection `milestones`. No public REST (`routes: []`).

| Field | Why |
| --- | --- |
| `type` | Semantic identity (`fan_artist.second_show`). Not display copy. |
| `value` | Ordinal/count where meaningful (`1`, `2`, `1`). Not a score. |
| `evidence` | Stable canonical ids only. Audit / reconcile / explain. |
| `occurredAt` | When the threshold was crossed. Historical backfill keeps historical time. |
| `version` | Evaluator/schema semantics. Reconcile in place; do not duplicate. |
| `status` | `active` / `archived`. Correction can invalidate a previously earned row. |
| `band` | Artist scope. Required for cross-artist denial. |
| `subjectFan` | Fan-scoped subject. Null later for artist-scoped types (`artist.fans.100`). |
| `idempotencyKey` | Retry-safe identity. DB unique. |
| `archivedAt` | When canonical truth no longer supports the row. |

Not persisted: title, headline, body, display copy, “YOU CAME BACK”, emoji, gradient, Rive, email, message body, media URLs, score, level, rank, visibility.

Strapi `createdAt` / `updatedAt` are row timestamps, not occurrence time.

## Types implemented

```
fan_artist.first_show
fan_artist.second_show
fan_artist.first_reply
```

Reserved in the type registry, **not** evaluated: `fan_artist.fifth_show`, `artist.fans.100`, `artist.fans.500`, `artist.returning_fans.100`, `tour.completed`.

## Evidence

```
first_show  → { attendanceId }
second_show → { attendanceId, priorAttendanceId?, ordinal: 2 }
first_reply → { relationshipEventId }
```

Forbidden in evidence: email, message body, media URL, display text, PII.

## Identity

One semantic milestone per artist × subject × type.

```
fan-scoped:     fan:{bandId}:{fanId}:{type}
artist-scoped:  band:{bandId}:{type}
```

Version is **not** in the key. A version change updates the existing row.

## Evaluators

Pure functions. No rules engine.

- `evaluateFirstShow(attendances)` — earliest unsuppressed canonical attendance. Not Moment count, not `checkedInShowCount`.
- `evaluateSecondShow(attendances)` — second chronological unsuppressed attendance. `returning === true` is a sanity check, not the occurrence.
- `evaluateFirstReply(event)` — earliest `fan_replied` RelationshipEvent for that band × fan. Targeted query (`type=fan_replied`, `occurredAt asc`, `limit 1`). Not the 200-event progression slice. Artist messages do not count. Cross-band replies do not count.

## Reconciliation

`reconcileFanArtistMilestones({ bandId, fanId })`

Creates missing valid rows, updates evidence/`occurredAt` when canonical order changes, archives rows the current facts no longer support. Idempotent.

Safe wrapper: `reconcileFanArtistMilestonesSafe` — never throws into check-in or reply writes.

### Correction

Attendance A + B → `second_show` evidence B. If A is later suppressed and only B remains, `second_show` is archived and `first_show` reconciles to B. If C also exists, sequence becomes B, C and `second_show` reconciles to C.

There is **no product write path today** that sets `suppressedDuplicate = true` (05A writes `false` on create only). Reconciliation + backfill exist so a future suppression path can repair derived rows. Do not invent suppression in Phase 07.

## Write integration

After canonical show attendance succeeds: Moment (existing) then milestone reconcile. Both best-effort.

After canonical `fan_replied`: milestone reconcile. Best-effort.

Failure is logged (`evt=milestone.write`) and repairable via backfill. Attendance / reply remain true.

## ArtistFanProgression

Prepared read. Adds `milestones: MilestoneView[]`. Still no score, level, rank, or presentation copy.

MilestoneView: `{ id, type, value, occurredAt, version, status, evidence, subjectFanId, bandId, relatedShow? }`.

`relatedShow` is batched from attendance ids already loaded for show Moments. No query per milestone.

## Authorization

Same as artist × fan progression: owning-band role (Labs: any band role + `internal_labs`). Wrong band / wrong fan pairing / anonymous → 404. No `GET /milestones`. No public CRUD. Guessing a milestone id has no endpoint.

Milestone access follows relationship ownership. No second visibility system.

## Indexes

Skip-safe `CREATE UNIQUE INDEX IF NOT EXISTS`:

- `milestones_idempotency_key_unique` on `idempotency_key` (**required** for concurrent create)
- `milestones_occurred_id` `(occurred_at, id)`
- `milestones_type_status`
- `milestones_band_fan_type` when `band_id` / `subject_fan_id` columns exist

RelationshipEvent: `relationship_events_band_fan_type_occurred` `(band_id, fan_id, type, occurred_at)` when those columns exist — smallest justified index for earliest `fan_replied` at scale. Existing `(band_id, fan_id, occurred_at)` can still serve LIMIT 1 with a type filter. Skip if join-table layout.

Strapi `unique: true` is **not** enough by itself.

## Backfill

```
node scripts/backfill-fan-milestones.js
node scripts/backfill-fan-milestones.js --apply
```

Default dry-run. Reports scanned / eligibleFirstShow / eligibleSecondShow / eligibleFirstReply / existing / wouldCreate / wouldUpdate / wouldArchive / errors. No PII. Does not require Phase 06 Moment backfill. Do not run `--apply` against production unless asked.

## Query shape (one artist × one fan)

1. Fan `findOne`
2. Band role
3. Canonical show summary
4. RelationshipEvent communication (bounded 200, counts only)
5. Moments list (limit 200)
6. Milestones list (limit 50)
7. Attendances batched by Moment source ids + milestone evidence ids
8. Show recaps batched
9. Artist updates batched

Earliest `fan_replied` for **write/reconcile** is a separate targeted LIMIT 1 query, not step 4.

## Labs

`/labs/relationship` — editorial timeline. Presentation mapper (`musicbizqr/utils/milestones/milestonePresentation.js`):

- `fan_artist.first_show` → IT STARTED HERE.
- `fan_artist.second_show` → YOU CAME BACK.
- `fan_artist.first_reply` → THE CONVERSATION STARTED.

Not a badge wall. Not Passport. Not Share Studio. No Rive.

## Tests

```
node scripts/test-milestone-schema.js
node scripts/test-milestones.js
node scripts/test-artist-fan-progression.js
node scripts/test-labs-boot-requires.js
```
