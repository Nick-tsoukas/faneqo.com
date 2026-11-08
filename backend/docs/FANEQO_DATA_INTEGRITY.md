# Fan + attendance data integrity (Phase 05A / 05A.1)

Audit-first uniqueness for canonical fans and show attendance. No Shared Media, Moments, or destructive remediation in this phase.

Live status: [`FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md). Platform architecture: [`FANEQO_RELATIONSHIP_PLATFORM.md`](FANEQO_RELATIONSHIP_PLATFORM.md).

**Phase 05A.1** adds hashed scalar integrity keys so Postgres can enforce uniqueness without depending on Strapi join-table layout. These fields are integrity materializations only — not public API fields, product IDs, analytics dimensions, Passport fields, or RelationshipEvent metadata.

## Relation storage

Local SQLite (and this Strapi v4 schema) stores:

| Domain relation | Physical storage |
| --- | --- |
| fan → band | `fans_band_links (fan_id, band_id)` — no `fans.band_id` |
| attendance → fan | `fan_show_attendances_fan_links` — no `fan_show_attendances.fan_id` |
| attendance → event | `fan_show_attendances_event_links` — no `event_id` on the attendance table |
| attendance campaign | scalar `campaign_id` on `fan_show_attendances` |

Therefore `UNIQUE (band_id, lower(email))` and `UNIQUE (fan_id, campaign_id)` cannot be expressed on the canonical tables. Phase 05A does **not** invent a FanIdentity table, duplicate raw FK columns, or Postgres cross-table triggers.

## Mutability

Inspected write paths:

- **Fan email and band are not mutated after create.** Updates change status, lastSeenAt, accountUser, visitor, names, source, checkedInShowCount. Claim links `accountUser` only. Restore/remove change status only.
- **Attendance fan, campaignId, and event are create-only.** There is no `entityService.update` on attendance.

If email or band is ever written after create, `fan` `beforeUpdate` recomputes `canonicalIdentityKey` in the same write so the key cannot go stale.

## Integrity keys

Built in Node with SHA-256 hex (no `pgcrypto`). Stored keys never contain the raw or normalized email.

| Row | Field | Input | Null when |
| --- | --- | --- | --- |
| fan | `canonicalIdentityKey` | `fan:v1:{bandId}:{normalizedEmail}` | missing band or email |
| attendance | `campaignIdentityKey` | `attendance:campaign:v1:{fanId}:{campaignId}` | no campaign, or `suppressedDuplicate === true` |
| attendance | `eventIdentityKey` | `attendance:event:v1:{fanId}:{eventId}` | no event, or suppressed |

A row with both campaign and event gets both keys. Manual attendance with neither gets neither. Do not invent a 24-hour identity key.

Future historical suppression: canonical row keeps its key; a suppressed duplicate may clear keys to NULL so unique indexes still allow one canonical identity. This phase does **not** suppress rows.

Utility: `src/utils/integrity/canonicalIdentityKeys.js`  
Write path: `createFanIdempotent` / `createAttendanceIdempotent` (subscribe, import, check-in, Inbox/DM).

Fields are Strapi `private: true` (64-char hex). Fan List / export / Labs inspector do not return them.

## Unique indexes

Applied only when the **connected** database is CLEAN (zero duplicate identity groups), key coverage is complete, and duplicate keys are zero:

```
UNIQUE (canonical_identity_key) WHERE canonical_identity_key IS NOT NULL
UNIQUE (campaign_identity_key) WHERE campaign_identity_key IS NOT NULL
UNIQUE (event_identity_key) WHERE event_identity_key IS NOT NULL
```

Index names:

- `fans_canonical_identity_key_unique`
- `fan_show_attendances_campaign_identity_key_unique`
- `fan_show_attendances_event_identity_key_unique`

Join-table unique indexes from Phase 05A remain skipped. Production must keep `forceMigration: false` so Strapi schema sync does not `DROP CONSTRAINT` bootstrap unique indexes (that crashes boot, or wipes uniqueness after they are converted to constraints). Local empty SQLite can activate unique indexes once columns exist (0 eligible rows = complete coverage).

## Conflict / refetch

Unique violation (Postgres `23505`, SQLite unique constraint, identity-key index names) → refetch:

- Fan: by `canonicalIdentityKey`, then band + normalized email (`$eqi`, oldest id)
- Attendance: by campaign/event identity key, then fan + campaign or fan + event

Unrelated DB errors still throw. Duplicate attendance returns `alreadyCheckedIn` without inserting a second row.

`checkedInShowCount` increments only after a genuinely new attendance insert (`shouldIncrementCheckedInShowCount`). Unique-conflict refetch does not increment.

RelationshipEvent `show_checked_in:{attendanceId}` / `show_returned:{attendanceId}` stay idempotent on attendance id. A duplicate request does not create another ledger row.

## Canonical fan identity (lookup)

```
email.trim().toLowerCase()
```

The same email on two bands is allowed (different keys).

## Fan create paths

| Path | Module |
| --- | --- |
| Subscribe / add | `fan.service.createFan` |
| Import | `fan.service.importFans` |
| Show check-in | `fan-interaction.processShowCheckIn` |
| Inbox / message request | `directMessaging.createFan` via `conversationRequests.ensureBandScopedFan` |
| Account claim | `fanAccount.claimFanRelationships` — links existing rows (`$eqi`), does not create fans |

## Canonical attendance

A row counts if `suppressed_duplicate IS NOT TRUE` (null and false are both canonical).

- Show Mode night with `campaignId`: one valid row per fan + campaign
- Event-backed show: one valid row per fan + event
- Manual attendance with neither campaign nor event: **no DB unique key**. The 24-hour heuristic stays application-only.

`suppressedDuplicate` is written `false` on create. This phase does not set it true.

## Show count (Passport / milestones / Inbox)

Canonical contract:

```
showCount    = COUNT(unsuppressed fan_show_attendances for that fan)
firstShowAt  = MIN(checkedInAt)
latestShowAt = MAX(checkedInAt)
returning    = showCount >= 2
```

One attendance row = one show, even if the row has both campaign and event.

Shared read path: `getCanonicalFanShowSummary({ bandId, fanId })` and bulk `getCanonicalFanShowSummaries({ fanIds })` in `src/utils/fans/canonicalShowSummary.js`.

Inbox, Fan List, and fan detail overlay this summary onto `showCount` / `checkedInShowCount` for display. `fans.checkedInShowCount` remains a write-side cache and is not independent truth.

Do **not** count RelationshipEvents, fan-interactions, QR scans, or recap `checkedInShowCount` (that field is that night’s room, not lifetime shows).

## Fan merge (not implemented)

If duplicates exist, classify SAFE / CONFLICTING / UNKNOWN. Do not auto-merge. Keep the oldest row as the proposed survivor unless CONFLICTING. Re-point child fan refs; never silently delete RelationshipEvent history.

## Tooling

Read-only duplicate audit:

```
node scripts/audit-fan-attendance-integrity.js
```

Integrity-key dry run (default, no mutation):

```
node scripts/backfill-canonical-integrity-keys.js
```

Apply (stops on duplicates; never merges or suppresses):

```
node scripts/backfill-canonical-integrity-keys.js --apply
```

Apply order: re-audit → STOP if duplicate groups → populate keys in batches → verify coverage and zero duplicate keys → create unique indexes → verify.

Labs inspector (no mutation UI): `GET /api/labs/integrity` → `/labs/data`  
Shows duplicate groups, key coverage %, identity-key index `ACTIVE / PENDING / BLOCKED / UNKNOWN`, and honest environment labeling. No “Fix”.

Product check-in does **not** run the duplicate-audit queries.

## Production audit

Local processes cannot resolve `postgres.railway.internal`. Do not infer production cleanliness from empty SQLite.

**Live status:** [`docs/FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md)

**Verified 2026-08-20** (manual Railway/Postgres inspection):

| Check | Result |
| --- | --- |
| Fans scanned | 178 |
| Duplicate fan groups | 0 |
| Conflicting / unknown fan groups | 0 |
| Fan integrity-key coverage | 100% |
| Attendance rows scanned | 16 |
| Duplicate campaign attendance groups | 0 |
| Duplicate event attendance groups | 0 |
| Campaign key coverage | 100% where applicable |
| Event key coverage | 100% where applicable |

Indexes confirmed **ACTIVE** as `CREATE UNIQUE INDEX` definitions in `pg_indexes`:

- `fans_canonical_identity_key_unique`
- `fan_show_attendances_campaign_identity_key_unique`
- `fan_show_attendances_event_identity_key_unique`

Do not auto-merge fans. If a future audit finds leftovers, classify SAFE / CONFLICTING / UNKNOWN.

To **re-verify** (do not copy credentials; do not add a public integrity endpoint), run on the **Railway backend service `qrserver`** (GitHub deploy context `lovely-benevolence - qrserver`; project `lovely-benevolence`):

```
# After `railway login` on a machine that can reach the project:
railway run --service qrserver node scripts/audit-fan-attendance-integrity.js
railway run --service qrserver node scripts/backfill-canonical-integrity-keys.js
```

Only if that host reports CLEAN and coverage is complete (and keys still need applying):

```
railway run --service qrserver node scripts/backfill-canonical-integrity-keys.js --apply
```

Then verify indexes in Postgres (`pg_indexes`), not from the script log alone:

```
SELECT indexname, indexdef
FROM pg_indexes
WHERE indexname IN (
  'fans_canonical_identity_key_unique',
  'fan_show_attendances_campaign_identity_key_unique',
  'fan_show_attendances_event_identity_key_unique'
);
```

Earlier snapshot (2026-08-19): `/api/health` 200. That day's UNKNOWN / PENDING live-status is superseded by the 2026-08-20 inspection above.

Dashboard **repeat attendees** (`getMyFansAnalytics.repeatShowAttendees`) counts subscribed fans with canonical `showCount >= 2` via `countCanonicalReturningFans`. It does not use `fans.checkedInShowCount`. Recap `checkedInShowCount` remains that night’s room.

Labs founder seed (set once on the backend service; do not print values):

```
FANEQO_LABS_FOUNDER_USER_ID
# or
FANEQO_LABS_FOUNDER_EMAIL
```

If neither is set, founder Labs stays 404. Request auth never reads these env values.

## Tests

```
node scripts/test-canonical-identity-keys.js
node scripts/test-canonical-show-summary.js
node scripts/test-fan-email-normalization.js
node scripts/test-fan-attendance-integrity.js
node scripts/test-fan-attendance-integrity-schema.js
node scripts/test-direct-messaging.js
node scripts/test-labs-boot-requires.js
```
