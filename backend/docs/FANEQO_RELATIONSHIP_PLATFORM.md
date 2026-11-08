# Faneqo Relationship + Intelligence Platform

Canonical architecture and product roadmap for the artist↔fan relationship layer.

This is not a Nuxt repo map. Frontend routing, QR, PWA, auth, and payments live in `musicbizqr/docs/FANEQO_ARCHITECTURE.md`.

This file is **architecture only**. Live phase status lives in `musicbizqr/docs/FANEQO_CURRENT_PHASE.md`; the `qrserver` copy is a backend slice log that may lag. Precedence when documents disagree: `musicbizqr/AGENTS.md`.

Paths like `qrserver/docs/...` and `musicbizqr/docs/...` are workspace-relative from `C:\code`. Same-folder `docs/` links work inside whichever product repo you are reading.

---

## 1. What this is

Faneqo is a music-first artist↔fan relationship platform.

Positioning: **Bands don't need more links. They need fans.**

The next chapter is a reusable relationship + intelligence platform that can power Artist × Fan views, durable Moments, milestones, Fan Passport, Artist Intelligence, Signals, show memories, galleries, recaps, Share Studio, Wrapped, external event intelligence, automatic event sync, setlists, and later loyalty and AI.

The core question is:

**Who is this fan to this artist?**

Then:

- What actually happened?
- How is the relationship changing?
- What is meaningful enough to remember?
- What should the artist do next?
- What should the fan experience?
- What is worth sharing?

---

## 2. Doctrine

**Build the truth once. Let many products read from it.**

Fan List, check-in, messaging, Passport, recaps, Wrapped, and Share Studio all read from one canonical relationship record. They do not each invent their own fan, show, or stamp.

**Open at the edges. Strict at the core.**

Strict core:

- fan identity
- artist identity
- attendance
- consent
- visibility
- ownership
- provenance
- uniqueness
- authorization
- idempotency

Open edges:

- new Moment kinds
- new milestones
- new Signal types
- new providers
- new observations
- new media experiences
- new recap types
- new share templates
- Rive experiences
- loyalty
- AI consumers
- automatic event providers

Do not turn Faneqo into an activity-log system. Meaning stays selective.

---

## 3. Two truths

These remain distinct.

### Faneqo relationship truth

- fan joined
- fan subscribed / unsubscribed
- fan attended
- fan returned
- artist messaged
- fan replied
- artist published an update
- fan claimed account / Passport
- future support relationship facts

### External music intelligence

- event listings
- setlists
- YouTube
- streaming
- charts
- playlist data
- releases
- radio
- venue information
- ticket links

External data may **enrich** Faneqo truth. External data must **never silently create** attendance, fan identity, consent, loyalty, or Passport stamps.

Example: a setlist provider saying Badflower played Ghost in Nashville does **not** mean Sarah heard Ghost.

Canonical attendance that Sarah attended that exact Nashville show, plus a setlist **explicitly matched** to that show, may later support: Sarah heard Ghost live.

---

## 4. Transformation pipeline

```
RAW ACTIVITY
    → CANONICAL DOMAIN FACT
    → RELATIONSHIP EVENT
    → SIGNAL / OBSERVATION
    → INSIGHT / MILESTONE
    → OPTIONAL MOMENT
    → PASSPORT / ARTIST INTELLIGENCE / RECAP
    → SHARE PROJECT
    → IMMUTABLE SHARE SNAPSHOT
    → RIVE / IMAGE / VIDEO / OG
```

Not every raw action becomes a RelationshipEvent.

Not every RelationshipEvent becomes a Signal.

Not every Signal becomes a Moment.

Not every Moment becomes a share.

---

## 5. Domain boundaries

For every feature, name these explicitly:

| Layer | Owns |
| --- | --- |
| Canonical owner | The row that is truth (fan, attendance, ArtistUpdate, message, …) |
| Derived data | Counts, returning, summaries computed from canonical rows |
| Read model | Prepared views for a screen (timeline, gallery items, recap payload) |
| Presentation | Vue layout, CSS, PhotoSwipe, Rive, renderers |

Example — gallery:

- file truth = Strapi Upload + S3
- owner = ArtistUpdate
- future Moment = reference
- Passport = read consumer
- Rive = presentation

---

## 6. Completed foundation

Treat this as accepted unless current code proves otherwise. Implementation detail lives in the specialist docs linked below — this table is status, not a second spec.

| Phase | What | Status |
| --- | --- | --- |
| 01 | Existing domain audit | Complete |
| 02 | Canonical architecture | Complete |
| 03 | Private Labs + FeatureEnrollment | Complete in code |
| 03.5 | Data-flow / performance validation | Complete / validated |
| 04 | RelationshipEvent ledger | Complete |
| 05A | Canonical fan + attendance integrity | Complete |
| 05B.1 | Shared media architecture audit | Complete / accepted |
| 05B.2 | Shared media core | Complete in code / not deployed |
| 05B.3 | Elite Artist Gallery + Lightbox | Complete in code / not deployed |
| 05B.4 | Show Photos / Night Story | Complete in code / not deployed |
| 05B.5 | Show Recap → Share Photos | Complete in code / not deployed |
| 05B.6 | DM Media Convergence | Complete in code / not deployed |
| 05B.7 | Shared media hardening | Complete in code / not deployed |
| 06 | Durable Moments + Artist × Fan progression | Complete in code / not deployed |
| 07 | Milestones | Complete in code / not deployed |

Production uniqueness is **ACTIVE**. Live counts and index names: `docs/FANEQO_CURRENT_PHASE.md`. Re-verify procedure: `qrserver/docs/FANEQO_DATA_INTEGRITY.md`.

Canonical show-count contract (shared helper `qrserver/src/utils/fans/canonicalShowSummary.js`, including bulk summaries to avoid N+1):

```
showCount    = COUNT(unsuppressed attendance rows)
firstShowAt  = MIN(checkedInAt)
latestShowAt = MAX(checkedInAt)
returning    = showCount >= 2
```

`fans.checkedInShowCount` is a write-side cache, not canonical truth. Recap `checkedInShowCount` is that night's room, not lifetime shows.

Specialist docs:

- Integrity keys, join-table layout, unique indexes, merge policy: `qrserver/docs/FANEQO_DATA_INTEGRITY.md`
- Thin ledger, event types, idempotency, timeline: `qrserver/docs/FANEQO_RELATIONSHIP_EVENTS.md`
- Sparse Moment index + ArtistFanProgression: `qrserver/docs/FANEQO_MOMENTS.md`
- Milestones: `qrserver/docs/FANEQO_MILESTONES.md`
- FeatureEnrollment, fail-closed Labs, founder seed: `qrserver/docs/FANEQO_LABS.md`
- Frontend Labs routes: `musicbizqr/docs/FANEQO_LABS.md`
- 2026-08-19 code snapshot (superseded for live status and sequencing): `qrserver/docs/FANEQO_RESUME_AUDIT.md`

---

## 7. Locked decisions

Do not casually reopen these.

### Fan identity

One fan per `band + email.trim().toLowerCase()`.

The same email across different artists is allowed.

Integrity keys are SHA-256 hex materializations, private, not public IDs. See the integrity specialist doc for join-table layout and key formulas.

### Attendance

One canonical unsuppressed `fan-show-attendance` row = one attended show.

A row containing both campaign and event is still **one** show.

Manual attendance with neither campaign nor event has no DB unique key; do not invent a 24-hour identity key.

`suppressedDuplicate` is written `false` on create. 05A does not set it true. Do not auto-merge fans.

`show_attendees` authorization (05B.4) reads that same canonical row. A valid match is attendance.event == resolved eventId **or** attendance.campaignId == resolved Show Mode campaignId (`sm_…`). Both identifiers on one night still count as one show. Do not authorize from ArtistUpdate.campaign (message-campaign). Persist night identity on existing `event` + `showRecap` relations. Fail closed on identifier mismatch. Cross-band denied.

### Moment

Moment is a **sparse derived relationship-history index**, not canonical activity truth and not a presentation document.

Canonical unsuppressed `fan-show-attendance` remains show truth. **One show Moment per canonical unsuppressed attendance.** Identity is `sourceType=fan_show_attendance` + `sourceId=attendance.id`. Do not create attendance because a Moment exists. Do not calculate `showCount` from Moments.

ArtistFanProgression is a **prepared read model**, not a persisted score or engagement number.

Moment **references** the media owner (ArtistUpdate) rather than copying media. A Moment reference never elevates media access.

Fan-scoped show Moments use `visibility=artist_fan`: owning-band authorized viewers and the subject fan (when that fan's accountUser is authenticated). Visibility is authorization, not frontend decoration. Phase 06 generated show Moments are `status=candidate` and `shareable=false`.

Do **not** morph legacy `fan-moment`.

### Milestone

Milestone is **semantic derived truth**, not canonical fact and not a presentation document.

Persist `type`, `value`, `evidence`, `occurredAt`, `version`. Do **not** store copy like "YOU CAME BACK."

Evidence points at canonical rows (attendance id, RelationshipEvent id). Do not duplicate attendance, media, or message bodies onto Milestone.

One semantic milestone per artist × subject × type. Fan-scoped identity: `fan:{bandId}:{fanId}:{type}`. Artist-scoped later: `band:{bandId}:{type}` with `subjectFan` null. Version is stored on the row, not in the identity key.

Milestones are reconcilable if canonical evidence changes. Archive when the threshold is no longer true.

Canonical attendance and reply writes never depend on milestone success.

Phase 07 persists `fan_artist.first_show`, `fan_artist.second_show`, `fan_artist.first_reply`. Moment `kind=milestone` remains reserved; Phase 07 does not emit Moment rows for milestones. ArtistFanProgression reads Milestone directly.

### RelationshipEvent

A thin durable fact ledger. It is not a generic event bus, a copy of domain objects, message storage, media storage, or analytics storage.

Canonical rows remain truth. Ledger writes are best-effort after canonical success and must stay idempotent.

### Legacy fan-moment

Existing `fan-moment` is a shareable participation card with copy and expiry. It is **not** the future durable Moment system.

**Do not morph it.** Future Moment is a new domain collection.

Also do not extend `band-external-metric` into the external-intelligence engine, or `band-share` into ShareSnapshot.

### Media

Do **not** create a global `MediaAsset` table in V1.

Strapi Upload + S3 remain file truth. Parent domain owns usage and authorization.

V1 cover is the first ordered media item. Do not add `coverImageId`.

Show Recap-origin Share Photos (05B.5) publishes a protected `show_attendees` ArtistUpdate. Visibility is preselected and locked in that flow. Do not allow a recap-origin composer to downgrade those photos to public. Canonical night identity is ShowRecap (optional Event). Do not persist Show Mode `sm_…` into `ArtistUpdate.campaign`.

Private DM media (05B.6) is owned by **ConversationMessage** and authorized **conversation participants**. It is not owned by MediaItem, Upload.file, or ArtistUpdate. There is no `GET /protected-media/:mediaId`. Delivery resolves conversation → participant → message → attachment, then streams. Legacy public Upload.file attachments remain readable. Do not attach ArtistUpdate-domain protected files to DMs.

Gated or private media never silently downgrades to public storage or public CDN URLs. Public ArtistUpdate media may remain public. Missing protected-delivery config disables new private attachments; it does not publish them publicly.

A signed image URL is an img-tag capability for its TTL (~15 minutes). `mediaId` remains identity. Anonymous without a valid token is denied. Any holder of an unexpired valid token can retrieve that authorized derivative. Thumbnail tokens do not authorize other sizes, owners, domains, or media ids.

Layer 2 (`faneqoMedia` + `useMediaUploadQueue` + `FaneqoMedia*`) is presentation-agnostic. Domain owners inject `uploadFn`. The queue must not contain artist/show/Passport logic.

`plugin::upload.file.size` is persisted in **kilobytes** (bytes / 1000). Compare it against byte caps only after converting units. The 8 MB product limit is unchanged.

Read-layer identity is Upload.file id (`mediaId`). A rotating signed URL is not identity.

### External intelligence

External providers cannot manufacture attendance, identity, or consent.

### Rive

Rive is presentation only. Never put Rive state or layout into canonical domain facts.

Runtime split (GSAP owns page choreography; Rive owns self-contained branded graphics): `musicbizqr/docs/rive.md`

### ShareSnapshot

Future ShareSnapshot is immutable truth for a share/render. Do not re-query mutable truth during render.

### Passport privacy

Fan Passport is private by default.

An artist can see only **its** relationship with that fan.

An artist must **never** see the fan's cross-artist Passport.

Frontend visibility is not authorization.

---

## 8. Acceptance story — Sarah × Badflower

Use this scenario to test future architecture.

Sarah discovers Badflower and joins the Fan List. Faneqo knows: relationship exists, attendance = 0.

Badflower plays Nashville. Sarah checks in.

Canonical attendance: `showCount = 1`, `returning = false`.

Artist uploads show photos. **Artist Update owns those photos.** Visibility: `show_attendees`. A future Show Moment references that update — it does not duplicate the gallery.

Sarah sees: BADFLOWER × YOU / NASHVILLE / Your first show / actual photos.

Badflower messages Sarah. Sarah replies.

Knoxville show. Sarah checks in.

Canonical attendance: `showCount = 2`, `returning = true`.

Milestone: `fan_artist.second_show`. Presentation may say "YOU CAME BACK." That copy is not stored on the milestone.

Passport now shows two nights. Artist relationship view shows: Returning fan, 2 shows.

Future Intelligence may determine Nashville returning fans are rising. Future Share Studio may offer SHOW #2.

Later external setlist data may enrich the Nashville/Knoxville memories **only after explicit show matching**.

Throughout:

**One fan. Two attendance rows. One canonical relationship truth.**

Everything else is interpretation or presentation.

---

## 9. Roadmap

Live phase: `docs/FANEQO_CURRENT_PHASE.md`. Do not start a later phase because it is listed here.

### 05B — Shared media / visual memory

Reusable visual-memory foundation. Media eventually powers Artist Updates, galleries, DM attachments, Show Photos, Moments, Passport memories, recaps, Share Studio, Wrapped, OG, social images/video, and future fan memories.

Subphases:

- **05B.1** Current media architecture audit — complete / accepted
- **05B.2** Shared media core — complete in code / not deployed
- **05B.3** Elite Artist Gallery + Lightbox — complete in code / not deployed
- **05B.4** Show Photos / Night Story — complete in code / not deployed
- **05B.5** Show Recap → Share Photos — complete in code / not deployed
- **05B.6** DM attachment convergence onto shared mechanics — complete in code / not deployed
- **05B.7** Shared media hardening — complete in code / not deployed

No `MediaAsset` V1. File truth stays Upload + S3. Domain owners stay on the parent object.

See [§10 Media direction](#10-media-direction).

### 06 — Durable Moments + Artist × Fan progression

Complete in code / not deployed. Specialist: `qrserver/docs/FANEQO_MOMENTS.md`.

New thin durable Moment collection. Phase 06 persists `kind=show` from canonical attendance. Other kinds remain reserved.

A Moment does not duplicate gallery contents, message body, analytics dumps, Rive layout, or share copy.

Labs proving ground: `musicbizqr` `/labs/relationship`.

### 07 — Milestones

Complete in code / not deployed. Specialist: `qrserver/docs/FANEQO_MILESTONES.md`.

Persist `type`, `value`, `evidence`, `occurredAt`, `version`.

Do **not** store copy like "You came back."

Phase 07 evaluators: `fan_artist.first_show`, `fan_artist.second_show`, `fan_artist.first_reply`.

Later examples remain reserved: `fan_artist.fifth_show`, `artist.fans.100`, `artist.fans.500`, `artist.returning_fans.100`, `tour.completed`.

### 08 — Faneqo Intelligence

Sparse Signals first: `city.growth`, `fan.returning`, `audience.reactivated`, `fan.relationship.deepening`, `list.growth`, `content.momentum`, `show.room_captured`.

Small evaluators. Do **not** create `IntelligenceEngine.js`. Interactive requests read prepared data. No external provider calls during normal dashboard requests.

### 09 — Fan Passport

**Your history with the artists you care about.**

Not a badge wall, CRM card, generic social profile, or concert checklist.

Visual direction: Artist Relationship Universe + Music Memory Journal.

Core object: **BADFLOWER × YOU** — connected since, shows, cities, Moments, milestones, relationship timeline, show memories, artist galleries, later setlists/songs heard live.

Privacy: [§7 Passport privacy](#passport-privacy).

### 10 — Recap + Story Engine / Share Studio

Composition services later: `buildShowRecap`, `buildFanArtistRecap`, `buildArtistPeriodRecap`, `buildTourRecap`, `buildMilestoneRecap`, `buildArtistGrowthRecap`.

Share architecture:

```
ShareProject   (mutable workspace)
    → ShareSnapshot  (immutable truth)
    → ShareRender
    → ShareAction
```

One snapshot should eventually render 1200×630 OG, 1080×1920 Story, 1080×1350 Feed, 1080×1080 Square, 1080×1920 Video.

Existing show-recap product (campaign freeze, Message the Room) is phase-specific supporting context, not this engine: `musicbizqr/docs/SHOW-RECAP-FLOW-AUDIT.md`, `musicbizqr/docs/SHOW-MODE.md`.

### 11 — Rive motion language maturation

Reusable primitives: Echo, Connection, Verified, Return, Milestone, Memory, Pulse.

Rive handles meaningful state. Vue/CSS handles layout. PhotoSwipe handles photo physics. Video renderer handles portable video. Static renderer handles image/OG output.

This phase is systematization, not first-ever Rive use. Prototypes earlier are allowed.

### 12 — External identity + observations

Provider-neutral: `ExternalArtistIdentity`, later `ExternalWorkIdentity`, `ExternalObservation`, `ExternalProviderAdapter`.

Store provider, type, value, observedAt, effectiveAt if needed, freshness, provenance, license/share policy.

Do **not** extend legacy `band-external-metric` into this engine.

### 13 — Automatic event sync

Possible providers: Bandsintown, Ticketmaster, booking/tour systems, later others.

Pipeline: external event → normalize → match → Faneqo event.

Artist settings may later support auto-publish of trusted events, or review before publishing.

### 14 — Setlists + music intelligence

Setlists require canonical attendance **plus** explicit show match. Then Passport may derive songs heard live, unique songs heard live, show setlists.

Also expand YouTube / release / catalog intelligence.

### 15 — Wrapped / loyalty / deeper intelligence

Fan Wrapped, Artist Wrapped, relationship milestones, optional meaningful loyalty/rewards, deeper actionable artist intelligence.

### Later — AI artist/fan intelligence assistant

AI consumes canonical facts, Signals, Insights, Moments, normalized external observations, recap context.

Not huge raw telemetry dumps.

---

## 10. Media direction

Current immediate work: **EXPERIENCE INTEGRATION REVIEW complete**. Next is **08 Signals + Artist Intelligence** (not started).

Principle: **media becomes Faneqo's visual memory layer.**

| Role | Owner |
| --- | --- |
| File truth | Strapi Upload + S3 |
| Artist gallery | ArtistUpdate |
| DM attachments | ConversationMessage |
| Future fan media | FanMemory |
| Future Moment | normally reference owner/source |
| Future ShareSnapshot | freeze authorized selected media |

A normalized **read-layer** shape (not automatically a database table). 05B.2 implements this as `mediaId` (Upload.file id), with `fileId` treated as a synonym in docs only:

```
MediaItem {
  id
  mediaId
  url
  thumbnailUrl
  largeUrl?
  previewUrl?
  mime?
  width?
  height?
  aspectRatio?
  order
  caption?
  alt?
  formats?
  protected?
}
```

### Elite gallery

- Vue/Nuxt: gallery layout / composition
- PhotoSwipe: fullscreen swipe / pinch / zoom / pan
- Nuxt Image: responsive delivery where appropriate
- Swiper: only where an actual carousel is useful
- Rive: meaningful verification / memory transitions only

Layout language:

- 1 photo: large editorial
- 2: intentional pair
- 3: hero + two supporting
- 4: mosaic
- 5+: curated preview + count

Prove compositions at `musicbizqr` `/labs/gallery` (`LabsEliteGallery`) before changing production `FaneqoMediaGrid`. Visual language: `musicbizqr/docs/design/FANEQO_VISUAL_LANGUAGE.md`.

Do not dump everything into generic masonry.

### Show Photos / Night Story

Target flow: show ends → show recap → share photos from tonight → select ~8 → instant local previews → upload progress → retry only failed items → reorder → first image = cover → `show_attendees` visibility preselected → publish → attendee sees the show gallery → future Moment references the same Artist Update → future Passport presents the same memory.

No duplicated gallery.

---

## 11. Performance principles

- Avoid N+1. Prefer grouped/bulk helpers (`getCanonicalFanShowSummaries` is the pattern).
- Interactive requests do not call external provider APIs.
- Do not introduce Redis, Kafka, materialized views, or microservices unless measured need exists.
- First realistic bottlenecks: enrollment-query size, timeline pagination, attendance counts — fix with indexes and workers when a query is slow.
- Every phase reports: normal query count, N+1 risk, first bottleneck, largest payload risk, whether any provider sits in an interactive path.

---

## 12. Privacy and authorization

- Fail closed.
- Frontend visibility is not authorization.
- Artist A cannot request Artist B's fan relationship.
- Non-attendees cannot access attendee-only galleries.
- Moments cannot expose protected ArtistUpdate media.
- DM images are not public because the same mediaId appears elsewhere. Conversation ownership controls access.
- One fan cannot access another fan's Passport.
- Share export cannot leak private media.
- Feature gates complement band ownership; they do not replace it.

Labs: default deny. Enrollment specialist: `qrserver/docs/FANEQO_LABS.md`.

---

## 13. Process

Process is owned by `musicbizqr/AGENTS.md` (precedence, operating loop, safety) and `musicbizqr/docs/FANEQO_CURSOR_OPERATING_SYSTEM.md` (work modes, evidence, tools, handoff standard). The summary below stays because it is the architecture-side view; where it differs, those two win.

Every major phase:

**Audit → Plan → Implement → Test → Adversarial review → Self-critique → Handoff.**

Do not skip the audit in mature code.

Before coding:

1. Why this exists, what UX it enables, what it must never become
2. Search the codebase; classify findings REUSE / EXTEND / REPLACE / DO NOT USE
3. Expected file map: REUSE / EXTEND / NEW / DO NOT TOUCH
4. Persistence challenge for every new field/table/entity
5. Failure-first design
6. Mobile acceptance (320–430, plus 768 / 1024 / 1280+ where relevant)

After coding: actual files touched; explain every unexpected file; domain boundary report; security adversary pass; performance pass; boot-path tests for boot-critical backend modules; `/api/health` after backend deploy.

GitHub/deploy success alone does not prove Strapi is healthy.

Stop if investigation finds a foundational mismatch. Do not silently redesign architecture mid-task.

End phases with `docs/FANEQO_NEXT_AGENT_HANDOFF.md`.

Improvements: up to five, classified **DO NOW / NEXT PHASE / LATER / REJECT**. Do not automatically implement discovered ideas.

Recommended agent split for substantial work: Agent A read-only audit, Agent B implementation, Agent C fresh read-only adversarial diff review. Two agents must not concurrently edit the same shared files.

Do not deploy, push, commit, reset, restore, or stash unless explicitly instructed.

---

## 14. Related docs

| Class | Doc |
| --- | --- |
| Canonical (this) | `docs/FANEQO_RELATIONSHIP_PLATFORM.md` (mirrored in both product repos) |
| Live status | `docs/FANEQO_CURRENT_PHASE.md` |
| Handoff template | `docs/FANEQO_NEXT_AGENT_HANDOFF.md` |
| Canonical specialist | `qrserver/docs/FANEQO_DATA_INTEGRITY.md` |
| Canonical specialist | `qrserver/docs/FANEQO_RELATIONSHIP_EVENTS.md` |
| Canonical specialist | `qrserver/docs/FANEQO_MOMENTS.md` |
| Canonical specialist | `qrserver/docs/FANEQO_MILESTONES.md` |
| Canonical specialist | `qrserver/docs/FANEQO_LABS.md` |
| Canonical specialist (presentation) | `musicbizqr/docs/rive.md` |
| Supporting frontend map | `musicbizqr/docs/FANEQO_ARCHITECTURE.md` |
| Supporting | `musicbizqr/docs/FANEQO_LABS.md` |
| Stale snapshot | `qrserver/docs/FANEQO_RESUME_AUDIT.md` |
| Stale | `musicbizqr/docs/FANS.md` (older MBQ notes; identity truth is this document) |
| Phase-specific | Show Mode / recap / messaging / QR / PWA / share audits under `musicbizqr/docs/` |
