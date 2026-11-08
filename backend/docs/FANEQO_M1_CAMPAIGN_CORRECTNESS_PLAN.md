# Faneqo M1 — Campaign Delivery Correctness and Recovery Plan

**Status:** implementation outline  
**Prepared:** 2026-08-26  
**Backend baseline:** `qrserver/main` at `ee4f2b12add25566083f83a6831e659c4ae1a27e`  
**Depends on:** `docs/FANEQO_MESSAGING_RELATIONSHIP_START_HERE.md`

M1 makes broadcast email campaigns trustworthy before Faneqo increases message volume. It does not change Direct Message eligibility, fan account identity, canonical attendance, protected media, Moments, Milestones, or the relationship-event contract.

## 1. Outcome

At the end of M1:

- a campaign cannot become sendable until its complete immutable recipient snapshot exists;
- overlapping campaign requests are rejected by a database-owned claim, not only a read-before-write check;
- every recipient snapshot row has database-enforced campaign identity;
- Resend webhook delivery is verified, durable, replay-safe, and order-safe;
- transient webhook processing failures return 5xx so Resend retries them;
- soft/transient delivery problems never globally suppress a fan;
- hard bounce and complaint suppression is idempotent;
- campaign counters have documented semantics and cannot drift from duplicate events;
- the worker does not rescan as many as 10,000 recipients after every five sends;
- stale worker recovery and provider idempotency remain intact;
- all changes can be rolled back without altering canonical fan or attendance truth.

## 2. Confirmed current strengths

Preserve these:

- raw-body Svix signature verification;
- unsigned webhook rejection when `RESEND_WEBHOOK_SECRET` is absent;
- immutable campaign recipient snapshots;
- per-recipient Resend idempotency keys;
- conditional `pending` → `sending` recipient claims;
- pre-send unsubscribe/bounce/complaint suppression recheck;
- stale `sending` recipient recovery;
- immediate worker plus cron recovery;
- separation of email suppression from Direct Message eligibility;
- production campaign test-mode allowlists;
- safe campaign history DTOs without recipient PII.

## 3. Confirmed risks

### C1 — campaign is queued before the snapshot is complete

`createAndQueueCampaign` currently:

1. updates `show-recap.lastMessageSentAt`;
2. creates the campaign with `status: queued`;
3. creates recipient rows in chunks;
4. starts the immediate worker.

The cron worker can discover the queued campaign between steps 2 and 3. It could deliver and finalize a partial snapshot while later recipient rows are still being created. A snapshot failure can also leave a queued campaign with only some intended recipients.

### C2 — cooldown can be consumed without a campaign

The show recap timestamp is updated before campaign and snapshot creation succeeds. A failure can make the UI believe a message was sent even when there is no complete deliverable campaign.

### C3 — active-campaign checks race

`hasActiveShowCampaign` and `hasActiveAudienceCampaign` perform a read before campaign creation. Two concurrent requests can both see no active row and both create campaigns.

### C4 — recipient idempotency is not database-owned

`message-recipient.idempotencyKey` is populated but is not `unique`, and no migration currently owns that invariant. Concurrent retries can bypass application-level existence checks.

### C5 — webhook processing is at-least-once but no event ID is stored

Resend documents webhook delivery as at-least-once, potentially duplicated and out of order. It recommends using the unique `svix-id` header for deduplication. The current endpoint does not persist it.

### C6 — verified webhook failures are acknowledged

Recipient mapping and fan suppression errors are caught and the endpoint still returns success. Resend retries 5xx responses for up to 24 hours; returning 2xx after a transient database failure can permanently lose an event.

### C7 — provider lifecycle coverage is incomplete

The current controller handles delivered, bounced, complained, opened, and clicked. It does not map `email.sent`, `email.failed`, `email.suppressed`, or `email.delivery_delayed`.

### C8 — counter meaning and implementation disagree

The worker treats `delivered` as both sent and delivered. The webhook increments counters independently. Later transitions do not consistently reconcile earlier counters. `lastMessageRecipientCount` adds `sentCount + deliveredCount`, which double-counts delivered recipients under the worker’s current definition.

### C9 — campaign counter rebuilding scales poorly

The worker reloads up to 10,000 recipient rows after every batch of five. A 10,000-recipient campaign can trigger thousands of broad recounts.

### C10 — campaign lock acquisition is best-effort

Two workers can overwrite `workerLockToken` on the same queued campaign before either verifies ownership. Conditional recipient claims prevent most duplicate sends, but campaign ownership, finalization, and counters can still race.

## 4. Provider facts this design must honor

Official Resend documentation states:

- webhooks are delivered at least once and may be duplicated;
- delivery order is not guaranteed;
- `svix-id` uniquely identifies an event delivery and should be stored for deduplication;
- event `created_at` should be used when order matters;
- a 5xx response is retried for up to 24 hours;
- `email.bounced` represents a permanent rejection;
- temporary delivery trouble is represented by `email.delivery_delayed`;
- `email.complained` means a delivered message was marked as spam.

References:

- https://resend.com/docs/webhooks/introduction
- https://resend.com/docs/webhooks/event-types
- https://resend.com/docs/webhooks/emails/bounced
- https://resend.com/docs/dashboard/webhooks/how-to-store-webhooks-data

## 5. Locked counter semantics

Campaign counters are lifecycle facts, not mutually exclusive buckets. The UI must never add them together and compare that sum with `recipientCount`.

| Field | Meaning | Durable source |
|---|---|---|
| `recipientCount` | Immutable sendable audience snapshot size | recipient rows at queue publication |
| `sentCount` | Provider accepted the send at least once | `sentAt IS NOT NULL` |
| `deliveredCount` | Provider reported delivery at least once | `deliveredAt IS NOT NULL` |
| `failedCount` | Delivery failed before a stronger successful outcome | `failedAt` plus transition rules |
| `suppressedCount` | Suppressed before send or by provider/compliance event | `suppressedAt IS NOT NULL` |
| `bouncedCount` | Provider reported a permanent bounce | `bouncedAt IS NOT NULL` |
| `skippedCount` | Excluded from the immutable snapshot during audience resolution | campaign snapshot metadata |

`sentCount` and `deliveredCount` intentionally overlap. A delivered email was sent. `lastMessageRecipientCount` must use the intended successful audience definition once—not `sentCount + deliveredCount`.

## 6. Recipient state policy

Provider delivery can be out of order. Store `lastProviderEventAt` and never let an older/weaker event erase a stronger fact.

| Event | Recipient effect | Fan suppression effect |
|---|---|---|
| `email.sent` | Set `sentAt` once; status at least `sent` | None |
| `email.delivered` | Set `deliveredAt` once; status at least `delivered` | None |
| `email.delivery_delayed` | Persist event; do not terminally change recipient | None |
| `email.failed` | Set failure only when no stronger terminal outcome exists | None unless a documented permanent reason is present |
| `email.bounced` | Set `bouncedAt`; terminal `bounced` unless complaint already won | Suppress as `bounced` |
| `email.suppressed` | Set `suppressedAt`; terminal `suppressed` | Do not invent a global reason when the payload does not supply one |
| `email.complained` | Set `suppressedAt`; terminal `suppressed`, `failureCode: complained` | Suppress as `complained` |
| `email.opened` | Set earliest/first `openedAt`; no status downgrade | None |
| `email.clicked` | Set earliest/first `clickedAt`; no status downgrade | None |

Manual `canceled` must not be overwritten by a late provider event. Complaint must not be downgraded by a late delivered/bounced event. Open and click events are engagement facts, not delivery-state transitions.

## 7. Implementation phases

### M1.0 — read-only production integrity audit

Add `scripts/audit-message-campaign-integrity.js`. Its default and initial version must be read-only and must not print emails, tokens, message bodies, or webhook payloads.

Report:

- duplicate non-null recipient `idempotencyKey` values;
- duplicate campaign × fan recipient rows;
- duplicate non-null `providerMessageId` values;
- queued/sending campaigns with zero recipients;
- campaign `recipientCount` versus actual snapshot count mismatches;
- more than one active campaign for the same dispatch scope;
- stale draft, queued, sending, and recipient-sending rows;
- campaign counters versus timestamp-derived facts;
- show recap cooldown timestamps without a related campaign;
- partial snapshot candidates.

**Gate:** do not add unique constraints until this audit reports zero conflicting rows or a separately reviewed repair plan exists.

### M1.1 — pure provider-event state machine

Create a pure module with no Strapi I/O that:

- normalizes supported Resend events;
- compares event time and transition precedence;
- returns recipient field changes;
- returns exactly-once counter facts;
- distinguishes permanent bounce, delayed delivery, provider suppression, and complaint;
- treats replayed and weaker out-of-order events as no-ops.

Add table-driven tests for every state/event pair before wiring the controller to it.

**Gate:** duplicate and out-of-order fixtures produce the same final state regardless of delivery order.

### M1.2 — durable webhook event ingestion

Add a minimal `message-delivery-event` collection:

- `eventKey` — unique, private `svix-id`;
- `provider` — `resend`;
- `type`;
- `providerMessageId`;
- `occurredAt`;
- processing status: received/processing/processed/failed/ignored;
- attempt count, processed timestamp, sanitized error code;
- optional resolved campaign and recipient relations.

Do not store the full webhook payload or recipient email.

Flow:

1. Verify signature against the raw body.
2. Validate `svix-id`, event type, event time, and provider message ID.
3. Create or resume the durable event claim.
4. Apply recipient transition and fan suppression idempotently.
5. Mark the event processed.
6. Return 2xx only after durable success or a documented permanent ignore.
7. Return 5xx for transient database/processing errors so Resend retries.

**Gate:** concurrent duplicate `svix-id`, retry-after-failure, and replay tests pass.

### M1.3 — two-phase campaign preparation

Use the existing `draft` status as non-sendable preparation state.

1. Create a draft campaign with a unique nullable `dispatchKey` claim.
2. Snapshot recipients in chunks while the worker cannot see the campaign.
3. Verify actual snapshot count matches the intended count.
4. Publish draft → queued only after the snapshot is complete.
5. Set show recap cooldown at publication, not before preparation.
6. On preparation failure, mark the campaign failed, clear its active claim, and clean or quarantine partial rows.
7. Add stale-draft recovery that fails closed and never sends a partial snapshot.

Suggested dispatch keys:

- all fans: `band:{bandId}:all_fans`;
- show audience: `band:{bandId}:show_recap:{showRecapId}`.

The key remains present while draft/queued/sending and is cleared only on terminal completion/failure/cancel. Database uniqueness owns overlap prevention.

**Gate:** a forced snapshot failure and a cron tick during preparation send zero messages and leave an explainable recoverable state.

### M1.4 — database invariants and indexes

After M1.0 audit approval:

- make recipient `idempotencyKey` unique;
- make campaign `dispatchKey` unique when non-null;
- make delivery-event `eventKey` unique;
- index recipient provider message ID;
- index recipient campaign/status/id for worker cursor reads;
- index campaign status/queuedAt and stale lock lookup;
- add migrations with explicit up/down behavior and preflight duplicate checks.

Do not rely only on `unique: true` schema metadata. Confirm the production database owns each invariant after deployment.

### M1.5 — worker claim and counter hardening

- Replace read/update/verify campaign claim with a conditional database update.
- Preserve conditional recipient claims and provider idempotency keys.
- Update lifecycle counters once when the corresponding timestamp is first set.
- Remove full 10,000-row recounts after each five-recipient batch.
- Perform at most one final reconciliation per campaign.
- Correct show recap `lastMessageRecipientCount` so delivered recipients are not counted twice.
- Keep stale-lock recovery, but add concurrency/failure-injection coverage.

**Gate:** two workers racing the same campaign produce one final campaign state, one recipient send per idempotency key, and stable counters.

### M1.6 — controlled production proof

- Run migrations only after a backup and the read-only audit.
- Deploy with webhook processing fail-closed.
- Use the existing production campaign allowlist and one owned test band.
- Send to one address, then a small allowlisted set.
- replay a signed event fixture in staging/test;
- verify Resend dashboard IDs match recipient rows without exposing emails in logs;
- verify unsubscribe, complaint, bounce, delayed delivery, and Direct Message separation;
- monitor stuck rows, webhook failures, and counter drift.

**Gate:** no full-fan campaign until the allowlisted proof is clean.

## 8. Required tests

### Pure transition tests

- duplicate delivered event;
- opened before delivered;
- clicked before delivered;
- delivered after bounced;
- bounced after delivered;
- complained after delivered;
- bounced after complained;
- delayed delivery never suppresses;
- provider-suppressed event does not invent bounce/complaint reason;
- older event cannot erase newer terminal state;
- manual canceled cannot be reopened.

### Webhook integration tests

- missing/invalid signature rejected;
- valid raw-body signature accepted;
- duplicate `svix-id` processed once;
- first attempt fails, returns 5xx, retry resumes;
- recipient mapping failure does not return 2xx;
- fan suppression failure is retryable and idempotent;
- unknown event stored/ignored safely;
- payload/log output contains no email/body/token.

### Campaign preparation tests

- two simultaneous all-fans creates;
- two simultaneous same-show creates;
- snapshot row failure in the first/middle/final chunk;
- cron worker runs while draft snapshot is being created;
- retry after partial snapshot;
- cooldown timestamp only after publication;
- zero-recipient campaign cannot queue;
- actual snapshot count must equal `recipientCount`.

### Worker tests

- two workers race one queued campaign;
- lock lost before and after provider send;
- crash after provider acceptance but before recipient update;
- stuck sending reclaim uses same provider idempotency key;
- final counters match lifecycle timestamps;
- finalization runs once;
- no full recount after each five-recipient batch.

## 9. Pull-request boundaries

Keep the work reviewable:

1. **M1-A:** read-only audit script, pure state machine, and tests. No runtime behavior change.
2. **M1-B:** durable delivery-event schema/migration and webhook processing behind focused tests.
3. **M1-C:** two-phase campaign preparation, dispatch claim, recipient uniqueness, and failure recovery.
4. **M1-D:** worker claim/counter performance hardening and final reconciliation.
5. **M1-E:** production audit evidence, allowlisted smoke report, and documentation update.

Each PR must pass `npm test` and `npm run build`. Do not combine M1 with Direct Message images, fan intelligence, Signals, Passport, SEO, or homepage work.

## 10. Rollback rules

- Never delete canonical fans or attendance rows.
- Never rewrite message bodies or recipient email snapshots during repair.
- Keep migrations reversible until production verification completes.
- A code rollback must leave new event/audit tables harmless and unread by old code.
- If webhook V2 fails, return to the prior controller only after disabling new processing safely; do not acknowledge events that were not durably processed.
- If campaign preparation fails, leave the campaign non-sendable and explainable rather than guessing or sending a partial audience.

## 11. After M1

Proceed to M2 protected Direct Message images:

1. runtime delivery-status diagnostics in Labs;
2. exact protected-media environment validation;
3. private bucket/public-read probe verification;
4. one/four-image authenticated artist and fan smoke tests;
5. signed-URL expiry recovery;
6. duplicate thread-selection cleanup and optimistic preview cleanup;
7. visual QA at 390px, 430px, and 1280px.

Only after M2 should the work move to M3 Direct Message query scaling, M4 Artist × Fan progression integration, Phase 08 Signals, and Phase 09 Fan Passport.
