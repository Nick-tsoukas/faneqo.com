# RelationshipEvent ledger

Thin durable facts: **what meaningful thing happened** between an artist and a fan.

Platform architecture: [`FANEQO_RELATIONSHIP_PLATFORM.md`](FANEQO_RELATIONSHIP_PLATFORM.md). Live phase: [`FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md).

Canonical objects remain source of truth. This table does **not** copy message bodies, email HTML, media, analytics, or provider payloads.

**Frontend visibility is not authorization.**

## Event types (V1 registry)

`src/utils/relationshipEvents/relationshipEventKeys.js`

Wired now: `fan_joined`, `fan_unsubscribed`, `show_checked_in`, `show_returned`, `artist_message_sent`, `fan_replied`, `passport_claimed`, `artist_update_published`, `show_gallery_added`.

Registry-only (no producer): `milestone_earned`, `support_received`.

## Write path

Canonical transaction succeeds → `recordRelationshipEventSafe` upsert by `idempotencyKey`.

Ledger failure **does not** fail the canonical write. Log `evt=relationship_event.write` and retry later via the same key.

## Idempotency

- `fan_joined:{fanId}`
- `fan_unsubscribed:{fanId}:{unsubscribedAt}`
- `show_checked_in:{attendanceId}`
- `show_returned:{attendanceId}`
- `artist_message_sent:{messageId}`
- `fan_replied:{messageId}`
- `passport_claimed:{fanId}:{accountUserId}`
- `artist_update_published:{updateId}`
- `show_gallery_added:{updateId}`

## Timeline

`getRelationshipTimeline({ bandId, fanId, viewer, includeFanOnly, cursor, limit })`

Fan rows ∪ eligible broadcasts (`fan_id` null). Broadcasts honor source visibility (`public` / `fan_list` / `show_attendees` via one attendance lookup). Cursor: `occurredAt|id`. Default limit 30, max 50.

Labs inspector: `internal_labs` + accessible band. **No extra product feature key in Phase 04.** `includeFanOnly=true` so `passport_claimed` is visible to the founder inspector. Artist product UI later must hide `fan_only` / cross-artist Passport.

## Labs

- `GET /api/labs/relationship-fans?bandId=&q=`
- `GET /api/labs/relationships?bandId=&fanId=&cursor=`

404 if unenrolled or band not accessible. Emails masked.

## Indexes

`UNIQUE (idempotency_key)`  
`(band_id, fan_id, occurred_at DESC)`  
`(band_id, occurred_at DESC) WHERE fan_id IS NULL`  
`(band_id, fan_id, type, occurred_at)` — Phase 07, earliest `fan_replied` at scale; skip-safe if FK columns are join-table

## Tests

```
node scripts/test-relationship-event-schema.js
node scripts/test-relationship-events.js
```
