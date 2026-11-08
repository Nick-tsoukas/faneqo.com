# Faneqo Messaging, Media, Fan Passport, and Relationship Platform — Start Here

**Status:** canonical audit and continuation guide  
**Audit date:** 2026-08-26  
**Frontend audited:** `Nick-tsoukas/musicbizqr` `main` at `d7f53e3c67fe96f742737df7a7bad363afbd35bc`  
**Backend audited:** `Nick-tsoukas/qrserver` `main` at `4b0e0fe5337d390a4a0891441749a497e06d942e`

This document is the entry point for the next messaging, media, Fan Passport, or relationship-intelligence task. It reconciles the current documentation with the code that is actually on `main`. It is an audit and plan, not proof of the current production environment.

## 1. Read order and source-of-truth rules

Overall precedence is owned by `musicbizqr/AGENTS.md`; this section only orders the messaging-domain reading. Note that this audit is pinned to 2026-08-26 commits — the live phase has moved on, so treat everything here as domain reference, not the current plan.

Read these before changing the system:

1. Backend `AGENTS.md` and frontend `AGENTS.md` for change discipline.
2. Backend `docs/FANEQO_RELATIONSHIP_PLATFORM.md` for locked architecture.
3. Backend `docs/FANEQO_CURRENT_PHASE.md` and `docs/FANEQO_NEXT_AGENT_HANDOFF.md` for phase status.
4. Frontend `FANEQO_EXPERIENCE_INTEGRATION_REVIEW.md`, `FANEQO_LABS.md`, and the visual/media-gallery documents for product intent.
5. This document for the cross-repository audit, known gaps, and recommended continuation order.

Older notes are supporting history, not current truth. In particular, the old messaging audit predates fan accounts and direct messaging. The current milestone copy is **YOU WROTE BACK**; older references to **THE CONVERSATION STARTED** are stale.

When documentation and code disagree, stop and classify the difference as one of:

- code has moved ahead and the document needs correction;
- code is only a Labs fixture and is not production-ready;
- the feature is implemented but operationally disabled;
- the code is legacy and must not define the new platform.

## 2. Product model: three lanes, one relationship layer

Do not collapse these into one feature.

| Lane | Purpose | Identity / audience | Delivery | Current state |
|---|---|---|---|---|
| Broadcast campaigns | Artist-to-list announcements and show recaps | Immutable `message-recipient` snapshot | Resend email | Implemented, but webhook/counter correctness needs repair before scale |
| Direct messaging | Private artist–fan conversation | One canonical band × fan-account pair | In-app conversation and protected images | Text is implemented; image UI exists; production image delivery is gated |
| Conversation requests | Fan asks to start a private conversation | Canonical fan account + band pair | Pending/accepted/declined request | Implemented |
| Relationship layer | Explain what happened between artist and fan | Canonical fan, attendance, account claim, messages | `RelationshipEvent`, sparse `Moment`, durable `Milestone` | Foundation implemented; product integration is incomplete |

Email unsubscribe and inbox eligibility are deliberately separate. An email-unsubscribed fan may still use direct messaging. Do not re-couple those permissions.

## 3. Locked architecture — preserve this

- `fan` remains canonical artist-owned fan identity.
- `fan-show-attendance` remains canonical attendance truth.
- `RelationshipEvent` is a thin, append-only observation ledger. It is not the canonical business object.
- New `Moment` rows are sparse derived indexes. They do not replace attendance.
- `Milestone` rows are durable semantic progression markers.
- Artist × fan progression is a prepared read model, not a persisted global score.
- `plugin::upload.file` ID is media identity. A signed URL is only a short-lived delivery capability.
- All media surfaces use the shared `MediaItem` read contract.
- Cover image is always the first ordered media item.
- Use the existing shared upload queue, grid, preview, and lightbox. Do not create a second queue or gallery system.
- Artist Updates may hold up to 60 images; a direct message may hold up to 4.
- Protected media must never silently fall back to public storage in production.
- The visual language is music-first and editorial: prove it at 390/430px mobile widths and at 1280px desktop. Do not turn it into a generic SaaS dashboard.
- Do not add a new `MediaAsset`, Passport, Moment, Milestone, or signal table without first proving that an existing canonical object cannot represent the need.

## 4. What is actually built

### Direct messaging

The core is substantial and should be extended, not replaced:

- canonical private conversation per band × fan account;
- artist and fan participants, read state, block state, and conversation requests;
- idempotent client message sends;
- artist permission check through `sendFanMessages`;
- fan account claim/create integration;
- text messages and up to four protected image attachments;
- conversation/message/attachment ownership checks;
- signed protected-media streaming through the backend;
- artist-message and fan-reply `RelationshipEvent` production;
- 30/minute user, 10/10-second conversation, and 8/15-minute fan-request rate limits;
- optimistic frontend sending with retry;
- reusable gallery and lightbox rendering in message bubbles.

The route files use `auth: false`, but the private controllers manually resolve and verify JWTs. That is intentional; it must remain covered by authorization tests because Strapi route metadata alone does not protect these endpoints.

### Shared media and gallery

The media UI is farther along than the product surface suggests:

- one normalized `MediaItem` contract;
- `useMediaUploadQueue` with size/type validation, concurrent uploads, abort, retry, remove, and reorder;
- explicit JPEG/PNG/WebP support and HEIC rejection copy;
- `FaneqoMediaGrid` with deterministic one-to-many layouts and overflow treatment;
- gallery preview with cover ordering and retry/remove states;
- keyboard-accessible lightbox, focus trap, zoom, swipe, route-close, and scroll lock;
- protected Artist Update delivery for `fan_list` and `show_attendees` visibility;
- protected Direct Message upload and streaming;
- 24-hour orphan cleanup for unreferenced protected files.

Labs uses these production components. The gallery is not a disposable mockup and must not be rebuilt.

### Labs

Labs is correctly isolated with authentication, an internal feature gate, noindex/nofollow, and 404 behavior for unauthorized or disabled access.

The hub currently mixes three different meanings of “available”:

- **Production-component previews:** gallery, Night Story, Share Photos, DM media, Artist × Fan.
- **Engineering inspectors:** Moments, RelationshipEvents, integrity views.
- **Future placeholders:** Passport, Signals, Share Studio.

The DM Media card can say **Ready** because the visual component is ready even when the production media-delivery endpoint says attachments are disabled. That label is misleading and should be split into **UI ready** and **delivery configured**.

`/labs/passport` is intentionally a placeholder. There is no finished Fan Passport product or Passport read API. Account claiming and the `passport_claimed` relationship event are foundation work, not a Passport product.

### Relationship intelligence

The new relationship stack is coherent:

- sanitized `RelationshipEvent` metadata;
- fan join/unsubscribe, attendance, return, DM, Passport-claim, Artist Update, and gallery event producers;
- sparse show Moments resolved from canonical attendance;
- `first_show`, `second_show`, and `first_reply` Milestones;
- an artist-scoped Artist × Fan progression read model combining fan identity, show summary, communication, Moments, and Milestones.

However, several older “intelligence” systems still coexist:

| Existing system | What it does | Classification for future work |
|---|---|---|
| `fan-interaction` engagement score/tier | Additive weights and tiers such as warm/engaged/superfan | Legacy context only; not canonical relationship truth |
| Fan Intelligence dashboard | CRM-style table, badges, scores, Superfans | Replace/reshape presentation around the relationship read model |
| `pulse.js` | Computes a separate 0–100 score and next-best action | Do not use as the canonical Signals design |
| Muse/band daily insights | Rule-based insights recomputed from broad data | Reuse facts selectively; do not create another competing truth |
| live signals | Current operational statistics | Potential input to Phase 08, not the Phase 08 model itself |
| legacy `fan-moment`/autoMoment | Threshold-driven share moments | Do not use for new relationship work |
| new `Moment` / `Milestone` / progression | Sparse narrative relationship layer | Canonical direction |

Phase 08 should unify observations from canonical facts. It must not add another score, another “fan intelligence” table, or another parallel insight engine.

## 5. Why message images are disabled

The frontend asks `GET /api/conversations/media/delivery`. The composer disables its photo picker when `attachmentsEnabled` is false and shows a generic text-only message.

The backend returns protected delivery as ready only when all of the following are present:

- `FANEQO_PROTECTED_MEDIA_ENABLED` is truthy;
- `AWS_BUCKET`;
- `AWS_REGION`;
- `AWS_ACCESS_KEY_ID`;
- `AWS_ACCESS_SECRET` — this exact variable name is what the current code reads;
- `FANEQO_PROTECTED_MEDIA_SECRET`, or `JWT_SECRET` as fallback.

`FANEQO_DM_PUBLIC_MEDIA_FALLBACK` is ignored in production by design. Do not “fix” production by enabling public upload fallback.

Protected image URLs expire after 15 minutes. They proxy through Faneqo; storage URLs must not leak into API responses. The uploader generates 480px, 960px, and 1600px WebP variants, writes private objects, and probes public candidate URLs. If the object is publicly readable, the upload is deleted and the request fails.

### Safe activation checklist

1. Confirm the actual backend environment contains the exact variables above without copying secrets into logs or tickets.
2. Confirm the S3 bucket/object prefix is private and direct anonymous object GET is denied.
3. Restart/redeploy only the backend after environment validation.
4. Verify `/api/conversations/media/delivery` reports `attachmentsEnabled: true` and the configured reason.
5. Send one-image and four-image messages as the artist and as a fan.
6. Confirm the intended participant can load the image, an unrelated user is denied, an invalid/expired token is denied, and a current signed token works.
7. Confirm direct S3/CDN URLs do not appear in the message payload or browser network response.
8. Leave the 24-hour orphan cleanup enabled and verify one cleanup run.

Do not call the image feature finished until this authenticated production smoke test passes. Labs fixtures can bypass delivery readiness and therefore are not proof.

## 6. High-risk findings

### P0 — repair before scaling broadcast messaging

1. **Soft-bounce state bug.** The Resend webhook applies a `bounced` recipient transition before deciding whether the bounce is hard or soft. A soft bounce can therefore mark the recipient/campaign as bounced even though the fan is correctly not globally suppressed.
2. **Counters are not a reliable state machine.** Webhook updates use separate read-modify-write counter changes and recipient updates. Concurrent events can lose increments; retries can double-increment; later delivery/bounce transitions can leave old counters in place, allowing totals to exceed `recipientCount`.
3. **Recipient idempotency is not database-enforced.** `message-recipient.idempotencyKey` is private but not `unique`, and no matching migration was found. Application checks alone do not prevent races.
4. **Campaign creation is only partially atomic.** The show-recap cooldown timestamp can be claimed before campaign/snapshot creation completes. A failure can consume the cooldown without a deliverable campaign. Snapshot creation can also fail after a partial set of recipients exists.

Required direction: define allowed provider-event transitions, make recipient transition + campaign aggregates transactional or derive aggregates from recipient state, persist/dedupe provider webhook event IDs, and add database uniqueness for campaign-recipient identity.

### P1 — repair before large DM/fan volumes

1. **Conversation list/unread N+1.** Listing conversations loads graphs and up to 5,000 messages per conversation to compute unread state.
2. **Message pagination is in memory.** The backend loads up to 5,000 messages, then applies cursor/limit logic in JavaScript.
3. **Polling multiplies the cost.** The frontend polls an active thread about every 3.5 seconds and the list about every 12 seconds. There is no realtime transport.
4. **Rate limits are process-local.** They reset on restart and do not coordinate across multiple backend instances.
5. **DM candidate GET performs writes.** The candidate read path can claim fan accounts. Move canonicalization/claiming to an explicit or safe idempotent write path.
6. **Potential duplicate thread selection.** The chat row emits both `select-conversation` and `fetch-messages`, while the parent maps both to the same selection handler.
7. **Signed media can expire in a long-open chat.** Payload URLs have a 15-minute lifetime; the visible image has no explicit refresh-on-403/expiry behavior.
8. **Transaction semantics need proof.** The send path opens `strapi.db.transaction`, but entity-service operations do not visibly receive a transaction handle. Verify Strapi 4.24 behavior with a failure-injection test before describing message + attachments as atomic.

Required direction: database-level cursor pagination and unread aggregates; stop scanning full histories; reduce polling only after queries are efficient; then evaluate SSE/WebSocket only if product usage justifies it.

### P1 — fan intelligence correctness

1. **Tier filtering occurs after database pagination.** A Superfan/engagement tab can appear empty while matching fans exist on another page, and response totals describe all fans rather than the filtered result.
2. **Engagement sorting occurs after pagination.** It sorts only the current page, not the complete filtered set.
3. **Analytics recomputes broad fan and interaction sets per request.** This will become expensive with real fan volume.
4. **Progression communication totals are capped.** Artist × Fan progression reads the latest 200 communication events and reports their counts as `artistMessagesSent` and `fanReplies`; those totals become incomplete after 200 events.
5. **Product integration points at the legacy dashboard.** “View fan” in messaging navigates to the old Fan Intelligence section instead of the new Artist × Fan progression experience.

### P1 — delivery safety and engineering process

1. Neither repository contains a GitHub Actions workflow for build/tests.
2. The many backend smoke/unit scripts are not exposed as normal package scripts.
3. `main` is not branch-protected and has no required status checks.
4. Labs visual readiness can be mistaken for runtime readiness.

This combination makes regressions and broken deployments much more likely. Add a small, mandatory CI baseline before broad refactors.

### P2 — finish and polish

- Show the protected-media readiness reason in Labs/admin diagnostics while keeping the public composer message generic.
- Refresh expired signed media or refresh the thread safely after a media 401/403.
- Revoke optimistic object URLs after confirmation to avoid long-session browser memory growth.
- Consider mobile HEIC conversion later; current explicit rejection is acceptable.
- Make Artist Update visibility controls reflect real backend readiness instead of permanently disabled generic controls.
- Change Labs status wording to distinguish component, API, environment, and production-smoke readiness.

## 7. Reuse / extend / replace / do not use

### Reuse unchanged unless a test proves a defect

- `MediaItem` normalization and Upload.file identity.
- `useMediaUploadQueue`.
- `FaneqoMediaGrid`, preview, and lightbox.
- protected-media S3 normalization, public-read probe, signed proxy, and orphan cleanup.
- conversation, participant, request, and message ownership model.
- canonical fan identity and attendance summary.
- sanitized RelationshipEvent producers.
- new Moment, Milestone, and Artist × Fan progression direction.

### Extend

- protected-media operational status and authenticated smoke coverage;
- database message pagination and unread aggregation;
- a durable/distributed rate-limit strategy if multiple backend instances are introduced;
- messaging “View fan” into the Artist × Fan progression drawer/page;
- Signals as a read/observation layer over canonical events and summaries.

### Replace or materially refactor

- email webhook recipient-state and counter handling;
- campaign snapshot/cooldown atomicity;
- engagement-tier filtering/sorting after pagination;
- legacy score-first Fan Intelligence presentation;
- misleading single-word Labs readiness labels.

### Do not use for new work

- legacy `fan-moment` / autoMoment;
- a new media table or a second gallery/uploader;
- public DM image storage in production;
- Pulse score, legacy engagement tier, or Muse insight as universal relationship truth;
- a Passport UI that invents Passport state before the read model and access rules are defined;
- new backfills or production schema changes without explicit review and rollback steps.

## 8. Recommended continuation plan

### M0 — put guardrails under the work

- Add frontend build and backend build/test workflows.
- Expose the existing focused test scripts through package scripts.
- Require checks on pull requests before merge; then enable branch protection.
- Add a small authenticated regression matrix for artist, subject fan, unrelated user, anonymous user, and disabled Labs user.

**Exit:** a failing build or focused messaging/media test blocks merge.

### M1 — make campaign delivery accounting trustworthy

- Formalize provider-event transition rules.
- Ignore soft bounce as a terminal bounced transition unless provider semantics say otherwise.
- Add webhook event persistence/deduplication.
- Make recipient state and campaign aggregates atomic, or derive aggregates from recipient state.
- Add database uniqueness for campaign × fan/recipient identity.
- Make campaign + snapshot + show-recap cooldown creation recoverable and failure-tested.
- Replace repeated full-recipient counter rebuilds after every batch.

**Exit:** replayed, concurrent, out-of-order, delivered-then-bounced, hard-bounce, soft-bounce, complaint, and partial-creation tests all produce one consistent final state.

### M2 — activate and finish DM images

- Validate the production protected-media environment using the safe checklist in section 5.
- Expose operational delivery status in Labs.
- Run one/four-image, reorder, cancel, retry, orphan, cross-user denial, expired-token, and private-bucket tests.
- Add client recovery for an expired signed URL.
- Remove the duplicate selection event path and confirm optimistic URL cleanup.
- Perform authenticated visual QA at 390px, 430px, and 1280px.

**Exit:** images work in a real artist–fan conversation, remain private, recover from expiry/failure, and match the quality of the mobile profile/gallery experience.

### M3 — make direct messaging scale safely

- Replace in-memory message slicing with indexed database cursor queries.
- Replace per-conversation history scans with unread counters or bounded aggregate queries.
- Make list endpoints return only the graph needed by the UI.
- Stop write side effects in candidate GET.
- Measure query count and latency at 10, 100, and 500 conversations before considering realtime transport.
- If multiple instances are used, move rate-limit state to shared infrastructure.

**Exit:** query count is bounded, cursor behavior is deterministic, polling does not scan message history, and authorization remains unchanged.

### M4 — connect messaging to the relationship product

- Route “View fan” to the Artist × Fan progression experience.
- Fix fan-list filter/sort semantics before using it as the selector.
- Separate recent communication preview from lifetime communication totals.
- Decide which legacy engagement labels remain helpful context and clearly label them non-canonical.
- Keep the product narrative: joined, showed up, came back, artist wrote, fan replied.

**Exit:** an artist can move from conversation to a trustworthy relationship journal without encountering conflicting scores or incomplete totals.

### M5 — then begin Phase 08 Signals and Phase 09 Passport

- Signals should answer focused product questions from canonical data, not create a new score universe.
- Define each signal’s source facts, freshness, access scope, explanation, and failure behavior.
- Define Passport read model and access boundaries before building Passport UI.
- Keep Passport identity/account claiming distinct from artist-owned fan records.

## 9. Minimum acceptance matrix

| Scenario | Artist | Subject fan | Other signed-in user | Anonymous |
|---|---:|---:|---:|---:|
| List/open private conversation | Allow | Allow | Deny | Deny |
| Send text | Allow with permission | Allow if eligible | Deny | Deny |
| Upload protected DM image | Allow when delivery ready | Allow when delivery ready | Deny | Deny |
| Load current protected image | Allow | Allow | Deny unless holding a valid short-lived capability URL | Valid signed capability only |
| Load expired/forged image URL | Deny | Deny | Deny | Deny |
| View Artist × Fan progression | Owning artist/manager only | Future explicit fan view only | Deny | Deny |
| Use Labs | Enrolled internal user | Only if enrolled and intended | Deny/404 | Deny/404 |

Also test: email unsubscribe does not block inbox access; fan block does block DM; campaign suppression does not alter canonical attendance; duplicate retries do not create duplicate messages or recipients.

## 10. Known unknowns requiring runtime verification

This audit did not inspect live backend secrets, bucket policy, deployed database indexes, current data volume, Resend webhook configuration, or an authenticated production browser session. Therefore:

- “images are disabled” is explained by the code path, but the exact live reason must be read from the delivery-status response or deployment environment;
- repository migrations being present does not prove they ran in production;
- static inspection does not prove Strapi transaction participation;
- Labs screenshots/fixtures do not prove production delivery;
- build success was not executed from a local clone during this audit.

Do not erase these unknowns with assumptions. Convert each one into a small, observable check before changing architecture.

## 11. Starting instruction for the next agent

Start with this sentence:

> Continue the Faneqo relationship platform from `FANEQO_MESSAGING_RELATIONSHIP_START_HERE.md`. Preserve the locked identity, attendance, relationship-event, Moment/Milestone, and shared-media contracts. First identify whether the requested work belongs to campaigns, private messaging, protected media, Labs, relationship progression, Signals, or Passport. Classify touched code as REUSE, EXTEND, REPLACE, or DO NOT USE. Do not deploy, push, backfill, or change production schema/environment without explicit authorization. Prove authorization, query behavior, failure recovery, and mobile/desktop UX before handoff.

## 12. Relevant source index

Backend:

- `docs/FANEQO_RELATIONSHIP_PLATFORM.md`
- `docs/FANEQO_CURRENT_PHASE.md`
- `docs/FANEQO_NEXT_AGENT_HANDOFF.md`
- `src/utils/inbox/directMessaging.js`
- `src/utils/inbox/conversationRequests.js`
- `src/utils/messaging/campaignService.js`
- `src/utils/messaging/campaignWorker.js`
- Resend webhook controller/routes under `src/api`
- `src/utils/artistUpdates/protectedMediaPure.js`
- `src/utils/artistUpdates/protectedMedia.js`
- `src/utils/moments/artistFanProgression.js`
- `src/utils/moments/momentPure.js`
- `src/api/message-recipient/content-types/message-recipient/schema.json`
- `database/migrations/`

Frontend:

- `FANEQO_EXPERIENCE_INTEGRATION_REVIEW.md`
- `FANEQO_LABS.md`
- current media/gallery and visual-language documents
- Labs hub, gallery, DM media, Artist × Fan, Passport, and Signals pages
- `FaneqoChatEngine`, message composer, `FaneqoMediaGrid`, gallery preview, and lightbox
- the shared media upload queue composable

