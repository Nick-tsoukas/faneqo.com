# Moments + Artist × Fan progression (Phase 06)

Thin derived relationship history. Canonical domain rows remain truth.

Platform architecture: [`FANEQO_RELATIONSHIP_PLATFORM.md`](FANEQO_RELATIONSHIP_PLATFORM.md). Live phase: [`FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md).

**Frontend visibility is not authorization.**  
**Moment reference does not grant media access.**

## Layers

| Layer | Owner |
| --- | --- |
| Canonical show | unsuppressed `fan-show-attendance` |
| Fact ledger | RelationshipEvent (`show_checked_in`, `fan_replied`, …) |
| Sparse history | Moment (`kind=show`, one per canonical attendance) |
| Prepared view | ArtistFanProgression (not persisted) |
| Presentation | Labs `/labs/relationship`, later Passport |

Do not calculate `showCount` from Moments. Do not copy media onto Moment. Do not morph legacy `fan-moment`.

## Moment schema (persisted)

Collection `moments`. No public REST (`routes: []`).

| Field | Why |
| --- | --- |
| `kind` | What class of meaningful occurrence. Phase 06 writes `show` only. |
| `status` | `candidate` (Labs/internal) / `published` / `archived`. Phase 06 show Moments start as `candidate`. |
| `visibility` | Authorization, not decoration. See below. |
| `band` | Artist scope. Required for cross-artist denial. |
| `subjectFan` | Canonical fan id. Never email / `_vid` / signed URL. |
| `occurredAt` | Meaningful event time (attendance `checkedInAt`). Not insert time. |
| `createdByType` | `system` for generated show Moments. |
| `createdByUserId` | Optional actor for later manual Moments. |
| `sourceType` / `sourceId` | Pointer to canonical owner. Show: `fan_show_attendance` + attendance id. |
| `idempotencyKey` | Retry-safe identity. DB unique. |
| `shareable` | Share Studio later. Show Moments default `false`. |
| `publishedAt` / `archivedAt` | Status timestamps. |
| `schemaVersion` | Additive evolution. |

Not persisted: title, headline, body, display copy, share text, layout, Rive, media URLs, email, gallery JSON.

## Visibility semantics

Reuses the existing relationship-authorization idea from RelationshipEvent, plus reserved content visibilities for later kinds.

| Value | Server meaning |
| --- | --- |
| `artist_fan` | Owning-band authorized viewers **and** the subject fan (when that fan's `accountUser` is authenticated). Not other fans. Not anonymous. Not other bands. **Phase 06 show Moments use this.** |
| `artist_only` | Owning-band authorized viewers only. |
| `fan_only` | Subject fan only. |
| `show_attendees` / `fan_list` / `public` | Reserved. Phase 06 does not emit them. |

Labs Phase 06 reads as the artist (`internal_labs` + band access). Subject-fan Passport reads are later.

## First producer

`ensureShowMomentForAttendance` / `ensureShowMomentForAttendanceSafe`.

Identity:

```
sourceType = fan_show_attendance
sourceId = attendance.id
idempotencyKey = show:fan_show_attendance:{attendanceId}
occurredAt = attendance.checkedInAt
```

Event-backed and manual Show Mode (`campaignId`, no Event) are the same product concept: a night with the artist.

`suppressedDuplicate === true` does not create a Moment. If a Moment already exists, it is archived.

A show is meaningful without ArtistUpdate / gallery. Uniqueness does not depend on ArtistUpdate. Multiple updates per night may later appear on the same MomentView.

## Failure / repair

Canonical attendance wins. Moment write is best-effort after check-in (`produceShowAttendance` → `ensureShowMomentForAttendanceSafe`). Failure is logged and repairable via backfill. Attendance is never rolled back.

If attendance is later suppressed: archive the derived Moment. Resolvers also omit Moments whose source attendance is suppressed.

Moment is durable, not a ShareSnapshot. Status/archive/reference repair are allowed.

## ArtistFanProgression

Prepared read. Not a score.

```
{
  band, fan,
  joinedAt,
  shows: { count, firstShowAt, latestShowAt, returning },
  communication: { artistMessagesSent, fanReplies, lastArtistMessageAt, lastReplyAt },
  moments: MomentView[],
  lastRelationshipActivityAt
}
```

Phase 07 extends this read model with `milestones: MilestoneView[]`. See `FANEQO_MILESTONES.md`. Moment `kind=milestone` remains reserved and is not emitted.

- `joinedAt` = earlier of `fan.subscribedAt` and `fan.createdAt` (subscribedAt is the required join timestamp; createdAt is fallback).
- Shows reuse `getCanonicalFanShowSummary`.
- Communication is a bounded RelationshipEvent read (`artist_message_sent`, `fan_replied`), not a full message-body scan.
- Timeline sort: `occurredAt` asc, then `id` asc.

## Authorization

Artist/editor may inspect **this band's** relationship with that fan only. Same global user may own multiple artist-scoped fan rows; they are not merged.

Labs: `GET /api/labs/relationship?bandId=&fanId=` requires `internal_labs` + band access. Wrong pair / other band / anonymous → 404. No `GET /moments`. Guessing a Moment id has no public endpoint.

Media on MomentView runs `decideArtistUpdateAccess`. Locked updates expose no media bytes.

## Indexes

Skip-safe `CREATE UNIQUE INDEX IF NOT EXISTS`:

- `moments_idempotency_key_unique` on `idempotency_key` (required for concurrent create)
- `moments_occurred_id` `(occurred_at, id)`
- `moments_kind_status`
- `moments_source`
- `moments_band_fan_occurred` when `band_id` / `subject_fan_id` columns exist

Boot also strips public + authenticated CRUD on `api::moment.moment`.

## Backfill

```
node scripts/backfill-show-moments.js
node scripts/backfill-show-moments.js --apply
```

Default dry-run. Reports scanned / eligible / existing / wouldCreate / created / duplicatesSkipped / suppressedSkipped / errors. No PII. Do not run `--apply` against production unless asked.

## Query shape (one artist × one fan)

1. Fan `findOne` (band + accountUser)
2. Band role
3. Canonical show summary (1 grouped SQL, or 1 attendance findMany fallback)
4. RelationshipEvent communication (1 bounded findMany, limit 200)
5. Moments list (1 findMany, limit 200)
6. Attendances by source ids (1 batched findMany)
7. Show recaps by event/campaign (1 batched findMany)
8. Artist updates by event/recap (1 batched findMany)

No query-per-Moment. No materialized view.

## Labs

`/labs/relationship` — proving surface for artist × fan history. `/labs/relationships` remains the ledger inspector. `/labs/moments` points here. `/labs/passport` stays a later-phase placeholder.

## Tests

```
node scripts/test-moment-schema.js
node scripts/test-show-moments.js
node scripts/test-artist-fan-progression.js
node scripts/test-labs-boot-requires.js
```
