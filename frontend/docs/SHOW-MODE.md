# Faneqo Show Mode — System Documentation & Audit

**Last updated:** September 5, 2026
**Scope:** Show Mode, fan check-in, attendance verification, and Show Recaps, across both repos.
**Audience:** engineers (human or AI) who need to understand, debug, or extend this system.

Companion docs:
- `docs/SHOW-MODE-BADGE-CONTEXT.md` — the share/badge layer built on top of check-in records.
- `docs/SHOW-CHECKIN-MODAL-AUDIT.md` — the fan-facing check-in modal: July 2026 layout fixes, open risks, and the badge-as-separate-modal question.
- `docs/SHOW-RECAP-FLOW-AUDIT.md` — what happens between ending a show and a recap appearing.
- `docs/FAN-MESSAGING-AUDIT.md` — post-show email, limits, and deliverability.

This doc covers the engine underneath all of them.

---

## 1. What Show Mode is

Show Mode is a temporary state on a band record that turns the public artist page into a live-show fan-capture surface.

The product logic: a band plays a show, the audience is standing right there with phones, and that is the single best moment to convert an anonymous listener into a reachable fan. When Show Mode is live, the artist page adds check-in prompts, every fan captured is tagged with the show's identity, and when the show ends the band gets a **Show Recap** — a scoreboard of what that specific night produced.

Four things make it work:

1. **A time window.** Show Mode turns on and, critically, turns itself off.
2. **A campaign ID.** Every fan, interaction, and check-in recorded during the window carries the same ID, which is what makes a per-show recap possible.
3. **A recap.** When the window closes, the metrics for that campaign ID are frozen into a `show-recap` record.
4. **A way to reach them again.** From the recap, the band can email everyone who checked in — see §16. Without this step the rest is just analytics.

---

## 2. Where the code lives

Show Mode spans two repos. The backend owns all state and timing; the frontend is a control surface and a display layer.

### Backend — `C:\code\qrserver` (Strapi v4.24.4, Postgres, Railway, **server clock is UTC**)

| File | Role |
| --- | --- |
| `src/api/band/services/showMode.js` | The state machine. All activation, deactivation, and cron processing. |
| `src/api/band/routes/show-mode.js` | The four dashboard routes. |
| `src/api/band/controllers/show-mode.js` | Auth + ownership checks, request payload parsing. |
| `src/utils/showTime.js` | Timezone-aware date math (added July 2026). |
| `src/api/show-recap/services/show-recap.js` | Recap generation and read-time enrichment. |
| `src/api/show-recap/controllers/show-recap.js` | Dashboard recap endpoints. |
| `src/api/fan-show-attendance/services/fan-show-attendance.js` | Verification scoring, dedupe, event-window classification. |
| `src/api/fan-interaction/services/fan-interaction.js` | `processShowCheckIn` — the check-in transaction. |
| `src/api/fan-interaction/routes/custom-routes.js` | The public check-in and track endpoints. |
| `src/api/fan/controllers/fan.js` | Fan capture; stamps show context onto new fans. |
| `config/cron-tasks.js` | The 15-minute Show Mode job. |
| `scripts/check-show-time.js` | Standalone sanity checks for the timezone helpers. |

### Frontend — `C:\code\musicbizqr` (Nuxt 3)

| File | Role | Mounted on |
| --- | --- | --- |
| `components/dashboard/ShowModeCard.vue` | Band-facing control panel: start, end, activate-now. | `pages/dashboard.vue` (always, when the user has a band) |
| `pages/[bandSlug]/index.vue` | Public artist page; decides whether show UI is visible. | — |
| `components/band/ShowCheckInModal.vue` | The check-in modal state machine and the POST. | `pages/[bandSlug]/index.vue` |
| `components/band/ShowCheckInButton.vue` | Trigger button; emits `open-check-in-modal` upward. | inside `FanCaptureSection` |
| `components/band/ShowCheckInBadgeModal.vue` | Dedicated badge surface: generation, share, download, copy. | `pages/[bandSlug]/index.vue` |
| `components/band/FanCaptureSection.vue` | Email capture; offers check-in follow-up during a show. | four template slots on the artist page |
| `composables/useShowCheckInQueue.js` | Offline queue that replays check-ins that couldn't reach the server. | `ShowCheckInModal`, artist page |
| `pages/show-live.vue` | Full-screen live counter, check-in feed and wake lock for the venue. | route `/show-live` |
| `composables/useShowCheckIn.js` | Deprecated duplicate check-in state machine (see §13). | nothing |
| `composables/useFanInteractionTracker.js` | All interaction tracking, including campaign tagging. | artist page |
| `composables/useShowRecaps.js` | Dashboard recap fetching. | `pages/fans/index.vue`, `pages/fans/recaps/[id].vue` |
| `components/dashboard/fans/ShowRecapCard.vue` | Recap summary card, links to the recap page. | `pages/fans/index.vue` |
| `pages/fans/recaps/[id].vue` | Dedicated full-page recap. | route `/fans/recaps/:id` |
| `components/dashboard/fans/ShowRecapDetailContent.vue` | Recap body: stats, actions, composer. | `pages/fans/recaps/[id].vue` |

Everything talks to Strapi directly from the browser. There are **no Nitro proxy routes** for show mode, check-in, or recaps.

---

## 3. The campaign ID is the spine

Nothing else in this system makes sense without this concept.

On every activation the backend generates one:

```js
generateCampaignId() {
  return `sm_${Date.now()}_${uuidv4().slice(0, 8)}`;
}
```

It is written to `band.showModeCampaignId` and then copied onto every record produced during the window:

- `fan.captureCampaignId` — fans who gave their email during the show
- `fan-interaction.campaignId` — every click, play, share, and check-in
- `fan-show-attendance.campaignId` — verified attendance records
- `show-recap.campaignId` — the recap itself (this is also the idempotency key)

A recap is simply "everything with this campaign ID, counted." Because the recap is keyed by campaign ID, regenerating is safe: `generateShowRecap` updates the existing row rather than creating a duplicate.

**On deactivation the ID is cleared from `showModeCampaignId` and archived in `showModeLastCampaignId`.** The clearing matters because several code paths fall back to `band.showModeCampaignId` when a request does not supply one — if the ID lingered, fans captured the next morning would be silently counted into last night's show. The archive matters because the recap cron needs to know which campaign just ended.

---

## 3A. Performance time vs Show Mode session time

A night has two clocks. Do not collapse them.

**Performance time** is when the musical set is intended to start and end.

- Live band fields: `showModePerformanceStartsAt`, `showModePerformanceEndsAt`
- Durable recap fields: `performanceStartsAt`, `performanceEndsAt`

**Show Mode session time** is when Faneqo capture is actually live.

- `showModeStartedAt` — session opened (artist tapped Start / from-event)
- `showModeEndsAt` — effective session expiry (drives cron and client gating)
- Recap `showStartedAt` / `showEndedAt` — session open/close, not the set times

**6:00 AM local** is the absolute safety ceiling, not the normal intended end.

```
effectiveEndsAt = min(performanceEndsAt, nextLocal6AM)
showModeEndsAt  = effectiveEndsAt
```

An explicit 10:30 PM performance end expires the session at 10:30 PM. A bug or a late payload cannot keep Show Mode running past the next local 6 AM from session start.

Legacy callers that omit performance times still get next-local-6-AM for both the intended end and the session expiry. The current dashboard does not send performance fields yet; `POST /show-mode/manual` must keep working without them.

Event-backed activation copies a usable Event `date` + `time` into `performanceStartsAt`. Events have no canonical end, so a missing end becomes Event start + 4 hours, then the 6 AM ceiling.

Event-backed Show Mode is an **immediate live action, never a scheduling action**. An Event may only start a session inside a bounded activation window:

```
opensAt  = eventStart - 24h
closesAt = min(eventStart + 4h, next 6 AM local after eventStart)
```

Before `opensAt` the Event is upcoming but not ready; at or after `closesAt` it is historical and must not create a new campaign, attendance window, or recap. The window is owned by `qrserver/src/utils/showMode/eventActivationPure.js` and enforced inside `activateFromEvent`, so it holds regardless of what the client renders. Refusals are `event_time_missing`, `event_activation_not_open`, and `event_activation_closed`, all 400; 409 stays reserved for `already_live`.

An Event with no usable `date` **and** `time` is not activatable at all. Manual Show Mode remains available on the Show Mode card for those nights.

**The server owns the clock.** Event `date`/`time` carry no timezone, so the dashboard must not reconstruct the Event's start instant: a browser in Los Angeles reading a Chicago show would hide the Start button on a night the backend considers eligible. Instead `GET /api/bands/:id/show-mode?eventIds=1,2,3` returns a batched, band-scoped `eventActivation` array — one request for every displayed Event, never one per Event — with the server-resolved `timezone` and absolute `eventStartsAt` / `opensAt` / `closesAt` instants plus a stable `reason`. `utils/show-mode/eventShowModeActivation.js` compares those instants against `Date.now()` on the existing one-minute tick and decides which control to draw: Start, "Show Mode Live", "Another show is live", a quiet "Show Mode available …" status, "Add an event time to use Show Mode.", or a subtle "Past event". Without a server answer it draws nothing rather than guess. A session that started in-window may legitimately still be live after `closesAt`, so the live check wins over the window.

Timezone authority, most trustworthy first: the Event's own location (`state` → IANA zone), then the band's stored `showModeTimezone`, then the browser's zone as a last resort, then the server clock. The Event schema has no timezone column, so venue location is the most canonical signal we own.

`PATCH /api/bands/:id/show-mode/timing` can extend `performanceEndsAt` on the **current live session only**. It does not create a campaign, Event, or recap.

Future artist-controlled **Schedule** (start later, reuse `scheduled`) is deferred. A performance start more than 24 hours in the future is rejected. Do not revive Event auto-activation.

---

## 4. States and lifecycle

`band.showModeStatus` is an enum: `off`, `scheduled`, `live`. `band.showModeEnabled` is a boolean that tracks `live`. Both exist and both are read in different places, which is a wart worth knowing about.

```
                  ┌──────────────────────────────┐
                  │             off              │
                  └──────────────────────────────┘
                     │                        ▲
      manual / from-event                     │ deactivate (manual)
      (dashboard)    │                        │ or cron expiry
                     ▼                        │   (performance_end /
                  ┌──────────────────────────────┐  safety_expiry)
                  │            live              │──► recap generated
                  └──────────────────────────────┘
                     ▲
                     │ scheduled → activate-now (unused in production)
                  ┌──────────────────────────────┐
                  │      scheduled (unused)      │
                  └──────────────────────────────┘
```

### Activation paths

**Manual** (`activateManualShowMode`) — the band taps "Start Show Mode" in the dashboard, optionally supplying title, venue, city, region, country, timezone, and (later) performance start/end. Status goes straight to `live`. Session `showModeStartedAt` is now. Without performance fields, both `showModePerformanceEndsAt` and `showModeEndsAt` default to **6:00 AM the next morning in the band's timezone**. With an explicit `performanceEndsAt`, the session expires at `min(performanceEndsAt, nextLocal6AM)`. `showModeSourceDetail` is `manual_dashboard`. If Show Mode is already live, this path returns the same `already_live` 409 as Event-backed activation and does not mint a new campaign. A cover image is Night-owned: it does **not** create an Event. See `qrserver/docs/FANEQO_NIGHT_SYSTEM.md`.

**From Event** (`activateFromEvent`) — the artist starts Show Mode from an existing Event, and only inside that Event's activation window (§3A). Context is copied; Event remains optional for other nights. A usable Event `date`+`time` becomes `performanceStartsAt`. A missing Event end gets a 4-hour default, then the 6 AM ceiling. Event auto-activation is disabled.

**Event auto-activation** (`activateEventShowMode`) — leftover helper. Cron no longer calls it, and it now obeys the same activation window. Do not revive.

**Scheduled** (`scheduleEventShowMode` → `activateScheduledShowMode`) — sets `scheduled` three hours before the event and lets the cron promote it to `live`. **This path currently has no caller.** `processUpcomingEvents` calls `activateEventShowMode` directly, so the `scheduled` state is effectively unreachable in production even though the code, the cron step, and the dashboard UI for it all exist. See §13.

### Deactivation

Either the band taps "End Show" or the one-minute expiry job finds `showModeEndsAt` in the past. Both go through `deactivateShowMode(bandId, reason)` (`manual`, `performance_end`, `safety_expiry`, or `auto`), which:

1. Reads the band's current show context and **snapshots it in memory and on `showModeLastContext`**.
2. Clears live `showMode*` fields, sets status `off`, stamps `showModeEndedAt`, and archives the campaign ID to `showModeLastCampaignId`.
3. Fires recap generation via `setImmediate`, passing the snapshot.

The snapshot in step 1 is essential: by the time the recap job runs, the live band fields are gone. Cron recovery reconstructs the same night from `showModeLastContext` when its campaign id matches. A live session cannot be replaced by another activation; that request returns `already_live` without creating an Event or recap.

---

## 5. The fan-facing flow

```
Fan scans QR / opens artist page
        │
        ▼
pages/[bandSlug]/index.vue fetches GET /api/bands/slug/:slug
        │  (returns every scalar field, including all showMode* fields)
        ▼
isShowModeLive computed:
   showModeEnabled === true
   AND showModeStatus is 'live' (or unset)
   AND now < showModeEndsAt
        │
        ├─ false ──► normal artist page
        │
        └─ true ───► FanCaptureSection gets show context
                     Analytics calls carry campaignId + context 'show_mode'
                              │
                              │  three triggers, one handler:
                              │  auto-open (once per campaign) /
                              │  ShowCheckInButton / post-signup prompt
                              │  → openCheckInModal()  (gated on canOfferCheckIn)
                              ▼
                     ShowCheckInModal
                     (idle → identity_needed → submitting → success)
                     idle skips straight to submit when mbq_fan_email is known
                     submit retries 3x, then queues locally and still succeeds
                              │
                              ▼
                     POST /api/fan-interactions/check-in   (public, no auth)
```

The client checks the end time itself rather than trusting `showModeEnabled` alone, because the deactivation cron only runs every 15 minutes. The computed re-evaluates every 60 seconds.

Check-in payload (from `components/band/ShowCheckInModal.vue`):

```js
{
  bandId, fanEmail, eventId, campaignId,
  surface: 'band_page',
  interactionContext: 'show_mode',
  metadata: { showTitle, venue, city, checkInMethod, firstName }
}
```

### Surviving the venue

A check-in that fails in a packed room is gone for good — the fan puts their phone away and does not try again. So the submit path is deliberately stubborn:

- Each attempt is aborted after 12s; failures retry at 0s, 1.5s and 4s.
- A 4xx stops immediately. It will fail identically no matter how many times we ask.
- If every attempt fails on network or 5xx, the payload goes into `mbq_checkin_queue` in `localStorage` and **the fan is still shown success**, with a line explaining it will finish syncing. They physically checked in; the transport is our problem, not theirs.
- The artist page drains that queue on mount and on the `online` event. Replay is safe because attendance is deduped per campaign + fan.
- The queue holds 20 entries max and drops anything older than 24 hours.

### Local marks

| Key | Meaning |
| --- | --- |
| `mbq_fan_email` | Last email used, for prefill. Written by fan capture and by a successful check-in. |
| `mbq_checkin_queue` | Check-ins waiting to be replayed. |
| `mbq_show_checkin:<campaignId>` | This device checked in to this show. Suppresses the auto-open and marks the capture section as done. |
| `mbq_show_checkin_dismissed:<campaignId>` | This device closed the modal without checking in. Suppresses the auto-open for the rest of the show. |

The modal auto-opens 1.2s after a live show is detected, once per campaign per device, and never when returning from a payment redirect (`?paid`/`?canceled`).

---

## 6. What a check-in actually does

`processShowCheckIn` in `src/api/fan-interaction/services/fan-interaction.js` is the heart of it. In order:

1. Loads the band's show mode fields.
2. **Resolves effective context** — request values win, then band show mode values fill the gaps (`campaignId`, `eventId`, `venue`, `city`, `showTitle`).
3. Loads the linked event, if any.
4. **Upgrades verification level** — `self_reported` becomes `show_mode_live` when show mode is active.
5. **Classifies the moment** via `determineEventStatus`: `before_show`, `during_show`, `after_show`, or `unknown`.
6. Finds or creates the fan (creating one marks `isNewFan`).
7. **Dedupe check** — by campaign, then event, then a 24-hour window.
8. Scores confidence, builds a timeline label, updates fan counters.
9. Creates a `fan-interaction` row (`checked_in_show`).
10. Creates a `fan-show-attendance` row — the durable record badges and recaps read from.

### Timing windows (`CHECK_IN_WINDOW`)

- 6 hours before show start counts as `before_show`
- Shows are assumed to run 3 hours
- 4 hours of grace after the assumed end
- 24-hour dedupe window when there is no campaign or event to key on

### Confidence scoring (`CONFIDENCE_WEIGHTS`)

Base 50, plus: show mode live +30, during show +25, linked event +15, campaign ID +10, venue +10, city +5, new fan +5. Verification bonuses: `event_qr_scan` +15, `geo_supported` +10, `staff_verified` +25. Clamped to 0–100.

A typical honest check-in during a live manual show lands around 95–100; a self-reported check-in with no context sits near 50.

**Controller gap worth knowing:** the public check-in endpoint reads `bandId`, `fanEmail`, `eventId`, `campaignId`, `surface`, `metadata`, and geo headers — but it does *not* forward `checkInSource`, `verificationLevel`, or `showModeSessionId` from the request body, even though the service accepts all three. Every check-in therefore lands with the default `direct_checkin_button` source and an empty session ID. Adding a QR-scan or staff-verified flow means widening the controller first.

---

## 7. Show Recap generation

Recaps are generated **twice over**, deliberately: an immediate attempt and a cron safety net.

### What the band sees when a show ends

Manual deactivation returns `{ status, enabled, campaignId, endedAt, recapQueued }`. `ShowModeCard` keeps that campaign id, shows "Generating your show recap…", and polls `GET /api/show-recaps/latest/me` every 2.5s for up to 45s, matching on `campaignId` so it cannot latch onto an older recap.

On success it shows "Show recap ready." with a check-in and fan count, plus **View Recap** (`/fans/recaps/<id>`) and **Message the Room** (`/fans/recaps/<id>?message=1`, hidden when nobody checked in). The recap is its own page, not a modal; `?message=1` expands the composer and scrolls to it once the data loads. Old `/fans?recap=<id>` links still work — `pages/fans/index.vue` forwards them to the new route on mount. On timeout it offers "Try generating recap", which calls `POST /api/show-recaps/generate` and restarts the watch.

The pending campaign is stored in `localStorage` under `mbq_pending_recap` and expires after six hours, so ending a show and then reloading the dashboard still lands on the recap rather than an empty card.

### Path A — immediate (the normal case)

`deactivateShowMode` fires `generateShowRecap({ bandId, campaignId, showContext })` through `setImmediate`, so the dashboard's "End Show" request returns without waiting. If it throws, the error is logged and path B picks it up.

### Path B — cron fallback (the safety net)

Every 15 minutes, `findCampaignsNeedingRecap()` looks for bands where show mode is off, `showModeEndedAt` is within the last 24 hours, and a campaign ID is archived — then checks whether a recap row exists for it. Missing ones are generated. Scheduled-but-not-yet-run campaigns are skipped.

### What gets computed

From **fans** (`captureCampaignId` = campaign): `fansCaptured`, `fansCapturedDuringShowMode`, `captureSurfaceBreakdown`, `topCaptureSurface`, `cityBreakdown`, `topCity`.

From **interactions** (`campaignId` = campaign): `interactionCount`, `interactionBreakdown`, and the per-type counters — `spotifyClicks`, `appleMusicClicks`, `youtubeClicks`, `ticketClicks`, `merchClicks`, `shareClicks`, `followClicks`, `saveClicks`, `featuredSongPlays`, `videoClicks`, `checkedInShowCount`.

From **engagement scoring** (`calculateBatchEngagementScores`): `averageEngagementScore` plus tier counts. Tiers are score thresholds, computed from interaction history rather than stored on the fan: `new` 0–9, `warm` 10–19, `engaged` 20–39, `superfan_signal` 40+.

From **attendance rows**, computed at read time rather than stored: `newFanCheckIns`, `knownFanCheckIns`, `averageCheckInConfidence`, and a corrected `checkedInShowCount`. These are merged in by `withCheckInStats()` in the latest/list/detail service methods, which is why they appear in the API response but not in the `show-recap` schema.

### Show identity resolution

The recap tries, in order: the deactivation snapshot → the linked event record → the first attendance row for the campaign → the first captured fan. On regeneration, previously stored identity fields are preserved rather than overwritten with nulls.

---

## 8. Data model reference

### `api::band.band` — Show Mode fields

| Field | Type | Purpose |
| --- | --- | --- |
| `showModeEnabled` | boolean | True while live. Most read paths gate on this. |
| `showModeStatus` | enum `off` / `scheduled` / `live` | Finer-grained state. |
| `showModeType` | enum `manual` / `event` | How it was started. |
| `showModeStartedAt` | datetime | When the **session** opened. |
| `showModeEndsAt` | datetime | Effective **session** expiry. Drives cron expiry and client gating. |
| `showModePerformanceStartsAt` | datetime | Intended musical start. Nullable for legacy rows. |
| `showModePerformanceEndsAt` | datetime | Intended musical end. Nullable for legacy rows. |
| `showModeLastDeactivationReason` | enum `manual` / `performance_end` / `safety_expiry` / `auto` | Why the last session ended. |
| `showModeActivatedAt` | datetime | Activation stamp. |
| `showModeEndedAt` | datetime | Survives deactivation; used by the recap fallback query. |
| `showModeEventId` | integer | Linked event (not a relation — a plain ID). |
| `showModeTitle` / `showModeVenue` / `showModeCity` / `showModeRegion` / `showModeCountry` | string | Show identity, copied onto captured fans. |
| `showModeTimezone` | string | IANA zone. Drives end-time and check-in-window math. |
| `showModeSourceDetail` | enum | Which surface started it (`manual_dashboard`, `event_auto`, `qr_poster`, …). |
| `showModeCampaignId` | string | Active campaign. Cleared on deactivation. |
| `showModeLastCampaignId` | string | Archived campaign for recap recovery. **Added July 2026.** |
| `showModeLastContext` | json | Last-night identity snapshot for recap recovery parity. System fields only. **Added Slice 1.1.** |
| `showModeMetadata` | json | Free-form. |
| `showModeAutoManaged` | boolean | True when the cron owns this session. |
| `showModeScheduledStartAt` / `showModeScheduledEndAt` | datetime | Only used by the currently-unreachable scheduled path. |
| `showModeLastAutoDeactivatedAt` / `showModeLastManualOverrideAt` | datetime | Guards against the cron fighting the band. |

### `api::show-recap.show-recap`

`band` (relation), `eventId`, `campaignId` (required, idempotency key), `showTitle`, `venue`, `city`, `region`, `country`, `timezone`, `showModeType`, `showStartedAt`, `showEndedAt`, `performanceStartsAt`, `performanceEndsAt`, `recapGeneratedAt` (required), plus the metric fields listed in §7 and three JSON breakdowns (`captureSurfaceBreakdown`, `cityBreakdown`, `interactionBreakdown`) and `metadata`.

Artist-authored Night fields (Slice 2): `publicStory` (text), `privateArtistNote` (text, owner/manager only), `lineup` (json snapshot), `nightSlug` (stable, nullable), `coverImage` (public-safe Night media). Regeneration must not overwrite them. Canonical contract: `qrserver/docs/FANEQO_NIGHT_SYSTEM.md`.

`showStartedAt` / `showEndedAt` remain session timestamps. `performanceStartsAt` / `performanceEndsAt` are the durable set times. Regeneration must not overwrite a stored performance time with null. Old recaps without the new fields still serialize; read-time fallback uses the legacy session stamps.

Post-show messaging adds `messagesSentCount` (default 0), `lastMessageSentAt`, and `lastMessageRecipientCount`. These are a send log summary, not a quota — the actual limit lives on the fan (`lastMessagedAt`). If you need real message history, add a content type rather than overloading these.

Note: `newFanCheckIns`, `knownFanCheckIns`, and `averageCheckInConfidence` are **not** columns. They are derived on read.

### `api::fan-show-attendance.fan-show-attendance`

`fan`, `band`, `event`, `fanInteraction` (relations), `campaignId`, `checkedInAt` (required), `venue`, `city`, `region`, `country`, `timezone`, `showTitle`, `showDate`, `verificationLevel`, `checkInSource`, `eventStatus`, `showModeSessionId`, `confidenceScore` (0–100, default 50), `isNewFanAtCheckIn`, `suppressedDuplicate`, `badgeEligible`, `badgeIssuedAt`, `timelineLabel`, `metadata`.

This is the record to build badges and fan-passport features from — it carries its own copy of the show context, so it stays meaningful even after the band record is cleared.

### `api::event.event` — important caveats

The event model stores **`date` (date-only)**, **`time` (time-only)**, and **`doorsTime` (time-only)**, with no timezone. It has `state` but **no `region`, no `country`, no `timezone`, and no `startDate`/`endDate`**. Any code that wants an event's start instant must combine `date` + `time` against an external timezone — that is exactly what `resolveEventStart` does. Show Mode maps `event.state` onto `showModeRegion` and leaves `showModeCountry` null for event-driven sessions.

### `api::fan-interaction.fan-interaction` — `interactionType` values

`joined_fan_list`, `viewed_band_page`, `viewed_show_mode_page`, `clicked_spotify`, `clicked_apple_music`, `clicked_youtube`, `clicked_ticket_link`, `clicked_merch`, `clicked_share`, `clicked_follow`, `clicked_save`, `played_featured_song`, `clicked_video`, `checked_in_show`, `opened_follow_modal`.

Recap counters map one-to-one onto these, so adding a new interaction type means adding a recap column if you want it counted.

---

## 9. API reference

### Dashboard (authenticated, ownership-checked)

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/bands/:id/show-mode` | `eventIds?` (comma list, max 100), `timezone?` | Rich status: `status`, `enabled`, `active`, `type`, `title`, `venue`, `city`, `campaignId`, `startedAt`, `endsAt`, `effectiveEndsAt`, `performanceStartsAt`, `performanceEndsAt`, `timezone`, `timeUntilStart`, `timeUntilEnd`, … plus `fansCaptured` and `checkIns` while a campaign is active. With `eventIds`, also `eventActivation[]` — batched authoritative Event activation timing (§3A), presentation only. |
| POST | `/api/bands/:id/show-mode/manual` | `title`, `venue`, `city`, `region`, `country`, `timezone`, optional `performanceStartsAt`, `performanceEndsAt`, optional `coverMediaId` | Live session summary. Cover is Night-owned and does not create an Event. Legacy body without performance fields still succeeds. |
| POST | `/api/bands/:id/show-mode/from-event` | `eventId`, `timezone?` | Live session from an existing Event, only inside its activation window (§3A). Outside it: 400 `event_time_missing` / `event_activation_not_open` / `event_activation_closed`, each with an `activation` block. |
| POST | `/api/bands/:id/show-mode/deactivate` | — | `{ status: 'off', enabled: false, campaignId, recapQueued }` |
| POST | `/api/bands/:id/show-mode/activate-now` | — | Promotes a scheduled session to live |
| PATCH | `/api/bands/:id/show-mode/timing` | `performanceEndsAt` (required unless start is sent), optional `performanceStartsAt`, `timezone` | Updates the live session only. Preserves `campaignId`. |

### Recaps (authenticated, scoped to the caller's band)

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/show-recaps/my-recaps?page=&pageSize=` | Paginated recaps, enriched with check-in stats |
| GET | `/api/show-recaps/latest/me` | Most recent recap, enriched |
| GET | `/api/show-recaps/:id` | Recap detail plus `topFans` (top 20 by engagement) |
| POST | `/api/show-recaps/generate` | Manual regeneration by `campaignId` |
| GET | `/api/show-recaps/:id/night` | Artist/team Night detail. Owner/manager see `privateArtistNote`; viewer does not. |
| PATCH | `/api/show-recaps/:id/night` | Partial enrichment: `publicStory`, `privateArtistNote`, `lineup`, `coverMediaId`. Owner/manager (`editBand`) only. |
| GET | `/api/show-recaps/:id/message` | Recipient count, band name, and send eligibility for the post-show message |
| POST | `/api/show-recaps/:id/message` | Body `{ note }`. Emails everyone who checked in. See §16. |

Night and message routes are declared **before** `/show-recaps/:id` in the router so the literal segments win. There is no public Night endpoint.

### Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/bands/slug/:slug` | Returns all scalar band fields, including every `showMode*` field. This is how the artist page knows a show is live. |
| POST | `/api/fan-interactions/check-in` | The check-in endpoint. No auth. |
| POST | `/api/fan-interactions/track` | Interaction tracking; accepts `campaignId` and `interactionContext`. |
| POST | `/api/fans/subscribe` | Fan capture; stamps show context when show mode is live. |
| POST | `/api/fans/unsubscribe` | Body `{ token }`. One-click opt-out from a mailed link. POST-only on purpose — see §16. |
| POST | `/api/fans/resubscribe` | Body `{ token }`. Undo, offered on the same page. |

### Campaign-scoped analytics (authenticated)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/fan-interactions/recent/:bandId?limit=` | Recent interactions. Powers the live check-in feed on `/show-live`. |
| GET | `/api/fan-interactions/breakdown/:bandId?campaignId=&eventId=` | Interaction counts, filterable by campaign. No frontend consumer yet. |
| GET | `/api/fan-interactions/session/:bandId?campaignId=` | Live session stats; defaults to the band's active campaign. No frontend consumer yet. |

Note that `show-recap` and `fan-show-attendance` also expose Strapi's default CRUD routers. The custom routes above are the intended surface; the default ones are only reachable if role permissions are opened up.

---

## 10. Cron reference

Two jobs, both in `config/cron-tasks.js`. Event auto-activation stays disabled.

1. **Live session expiry** — every minute, on the existing `* * * * *` slot (shared with message campaigns; two identical cron keys cannot coexist). `processExpiredShowModes()` selects at most 100 live bands whose `showModeEndsAt` is past (or a live session with a null end older than 24 hours). Each row goes through canonical `deactivateShowMode`.
2. **Recap fallback** — every 15 minutes. `findCampaignsNeedingRecap()` generates any recap that should exist and does not.

A 10:30 PM performance end should not stay live until 10:45. The artist page still compensates client-side by reading `showModeEndsAt`.

---

## 11. Timezone rules — read this before touching dates

The production server clock is **UTC**. Venues are not. Nearly every historical bug in this system traces back to that gap.

There is **no date library available in the backend** — luxon and date-fns are not dependencies. `src/utils/showTime.js` does the math with built-in `Intl`:

- `resolveEventStart(event, timeZone)` — combines `date` + `time` into a real instant in `timeZone`. Defaults to 8:00 PM when `time` is missing. Returns `null` for an unparseable date. Falls back to the server clock when the timezone is unknown or invalid.
- `getNextMorning6AM(timeZone, from)` — the next calendar day at 6:00 AM in `timeZone`, handling DST and month/year rollover.
- `resolveShowTimeZone({ event, band })` — the resolution order below.
- `timeZoneFromRegion(state)` — US state name or abbreviation to IANA zone.
- `zonedTimeToUtc`, `getZonedParts`, `getTimeZoneOffsetMs`, `toDateString` — lower-level helpers.
- `isValidTimeZone(tz)` — every entry point tolerates garbage timezone strings by falling back rather than throwing.

Verify changes with `node scripts/check-show-time.js` and `node scripts/test-show-mode-timing.js` from the backend repo. Coverage includes EDT/EST/PDT, DST spring-forward, overnight shows, invalid zones, malformed timestamps, legacy 6 AM defaults, and recap timing preservation.

**Where the timezone comes from**, most venue-specific first:

1. **Manual activation** sends `Intl.DateTimeFormat().resolvedOptions().timeZone` from the browser — the most accurate signal available, since someone is standing at the venue.
2. **Event auto-activation** calls `resolveShowTimeZone`, which maps the event's `state` to a zone. This is the venue's location, so it stays correct on tour even when the band lives three zones away.
3. **`band.showModeTimezone`** — whatever was learned last time. Used when the state is missing or not a US state.
4. **Server clock (UTC)** — logged as a warning. Wrong, but not broken.

Nine US states span two zones; each is mapped to its dominant zone. That risks being an hour off in places like El Paso or the Florida panhandle, which is a far smaller error than the six-hour miss you get by falling through to UTC. Whatever zone is resolved is written to `band.showModeTimezone` on activation, so it also feeds check-in classification for that show.

---

## 12. Audit — July 2026

A full trace of the system found seven defects. All are fixed; the fixes are described here so the reasoning survives.

**1. Recaps lost their show identity.** `deactivateShowMode` cleared the band's show fields, then `generateShowRecap` re-read the band asynchronously and found nulls. Every recap came out with no venue, no start time, no event link. *Fix:* snapshot the context before clearing and pass it into the recap job.

**2. The cron recap fallback could never match anything.** The fallback query required `showModeCampaignId` to be non-null, but deactivation set it to null. The safety net had been dead since it was written. *Fix:* archive the ID in a new `showModeLastCampaignId` field and query that. Leaving the original field populated was rejected because `fan-interaction.js` falls back to it without checking whether the show is live, which would mis-tag post-show fans.

**3. The cron threw on every run.** `processUpcomingEvents` filtered on `event.startDate`, a field that does not exist; Strapi v4 rejects unknown filter keys. The throw propagated to the top-level catch, so steps that ran after it — including the recap fallback — never executed. *Fix:* query the real `date` column across the surrounding calendar days and compute exact start times in JS. Each cron step now has its own error boundary. The same function's references to `event.region` and `event.country` (also nonexistent) were corrected to `event.state`.

**4. Every show ended at 6 AM UTC.** `getNextMorning6AM` accepted a `timezone` parameter and ignored it, using `setHours` against the server clock. For an East Coast band that meant 1 AM; for the West Coast, 10 PM — show mode shut off mid-set. *Fix:* real timezone math, plus plumbing so the timezone actually arrives — the controller now reads it from the request body and the dashboard sends the browser zone.

**5. Check-ins during the show were classified `after_show`.** `determineEventStatus` parsed `event.date` as UTC midnight and then applied `setHours` in server-local time. *Fix:* resolve the event's wall-clock time against the band's timezone.

**6. The dashboard displayed fields the backend never produced.** The recap detail view reads `newFanCheckIns`, `knownFanCheckIns`, and `averageCheckInConfidence`; none existed in the schema or the service. *Fix:* derive them from attendance rows at read time, so existing recaps benefit too.

**7. Fans could check in after the show ended.** The artist page gated purely on `showModeEnabled`, ignoring `showModeEndsAt`. With the cron failing (bug 3), that meant sessions that never closed at all. *Fix:* the `isShowModeLive` computed described in §5.

A related hazard surfaced while fixing these: regenerating a recap would have overwritten good venue and timing data with nulls, since the band fields are gone by then. Regeneration now preserves stored identity and can recover context from attendance rows.

### Files changed

Backend: `src/utils/showTime.js` (new), `scripts/check-show-time.js` (new), `src/api/band/services/showMode.js`, `src/api/band/controllers/show-mode.js`, `src/api/band/content-types/band/schema.json`, `src/api/show-recap/services/show-recap.js`, `src/api/fan-show-attendance/services/fan-show-attendance.js`, `src/api/fan-interaction/services/fan-interaction.js`, `config/cron-tasks.js`.

Frontend: `components/dashboard/ShowModeCard.vue`, `pages/[bandSlug]/index.vue`.

**Deployment note:** the new `showModeLastCampaignId` column is created by Strapi on boot. The backend must restart before the recap fallback works.

---

## 13. Known gaps and open questions

These are unresolved as of this writing. None are fixed.

### Backend

**The `scheduled` state is unreachable.** `scheduleEventShowMode` has no caller, so `processScheduledShowModes` and `activateScheduledShowMode` never fire, and the dashboard's "activate now" button and scheduled UI state target a condition that cannot occur. Either wire scheduling into event creation, or delete the path and the UI that implies it exists.

**~~Three ownership checks are broken.~~ Fixed July 2026.** `fan-interaction.recent`, `.breakdown`, and `.session` populated `{ user: true }` and compared `band.user?.id`, but the band relation is `users_permissions_user`, so all three returned 403 to every caller. They now populate and compare the correct relation. No frontend calls them yet, so this only unblocks future use — the endpoints changed from "always deny" to "deny unless you own the band".

**~~`getFansCapturedDuringCampaign` is dead.~~ Fixed July 2026.** Now called by `show-mode.getStatus` to populate the dashboard card's live session counters.

**The cron fallback produces thinner recaps than the immediate path.** It only knows `showEndedAt`; venue and title come from attendance rows if any check-ins happened, and are lost otherwise. A recap generated by the fallback for a show with zero check-ins will be anonymous.

### Frontend

**~~The in-page check-in button does not work.~~ Fixed July 2026.** `ShowCheckInButton` now emits `open-check-in-modal`, `FanCaptureSection` forwards it, and the page opens the one real modal. All remaining entry points (auto-open, embedded button, post-signup prompt) call `openCheckInModal()`. The floating artist-page CTA was removed in Sep 2026.

**~~`useShowCheckIn.js` duplicates `ShowCheckInModal.vue`.~~ Bypassed July 2026.** The composable now has no consumers and is marked deprecated in its header. The page-level `ShowCheckInModal` is the source of truth. The file still exists and can be deleted once nothing references it in a release.

**~~`checkInFanEmail` is always empty.~~ Fixed July 2026.** The page reads `mbq_fan_email` on mount and again when opening the modal; the modal writes it back after a successful check-in. The idle state shows "Checking in as <email>" with a "Use a different email" escape hatch.

**Check-ins are not tracked as interactions from the client.** `trackShowCheckIn` exists in the tracker composable and is never called; `onCheckInSuccess` only sets local state. The backend creates its own `checked_in_show` interaction, so recap counts are fine — calling the client tracker would double-count them. Leave it uncalled unless the backend write is removed first.

**~~Analytics gating and UI gating disagree.~~ Fixed July 2026.** Every tracking call on the artist page now goes through `showTrackingContext()`, which reads the same `isShowModeLive` computed the UI uses. Campaign tagging also stops when the show is over — previously `campaignId` was attached even when the context was `normal`, which let post-show interactions land in a finished show's recap.

**~~`FanCaptureSection.handleCheckIn` is dead code~~ Removed July 2026.** The section no longer posts check-ins itself; it only emits `open-check-in-modal` upward.

**~~`ShowModeCard.fansCapturedThisSession` is never populated.~~ Fixed July 2026.** `GET /api/bands/:id/show-mode` now returns `fansCaptured` (fans whose `captureCampaignId` matches, via the previously dead `getFansCapturedDuringCampaign`) and `checkIns` (deduped attendance rows, via the recap service's `getCheckInStats`). The card renders both and polls the status endpoint every 60s while live or scheduled, silently so a failed refresh doesn't blank the numbers.

**Two recap systems coexist.** `/api/show-recaps/*` (documented here, live on `/fans`) and `/api/fan-moments/recap-active`. The latter is consumed by `AfterShowRecapPanel.vue` and `ShareablesHub.vue` — neither of which is mounted anywhere, so the whole branch is currently unreachable. It generates shareable recap imagery rather than dashboard analytics, so it may be complementary rather than competing. Decide whether to mount it or delete it.

**~~Unused recap client methods.~~ Partly fixed July 2026.** `getRecaps` now backs the show recap archive at `/fans/recaps`, so a band can browse every past show. It also rethrows on failure instead of returning an empty page, so the archive can tell "no shows yet" apart from "the request failed". `generateRecap` still has only one entry point — the retry button on the post-show alert — so there is no way to force regeneration of an older recap without hitting the API by hand.

**Recap discovery.** A recap is a permanent show record, so it has three doorways: the persistent `LatestShowRecapPanel` inside `ShowModeCard`, the archive at `/fans/recaps`, and the latest-recap card on `/fans`. Dismissing the post-show alert records the ended `campaignId` under `mbq_recap_alert_dismissed:<bandId>` and collapses the alert only — the recap stays reachable through the persistent panel, and a later show has a different `campaignId` so its alert still fires. Recap detail links carry `?from=dashboard` or `?from=fans` so the back link returns where the band came from, defaulting to the archive.

**The show-day banner is not Show Mode.** `ShowDayHeader` / `NowBanner` / `MomentBadges` run off the event calendar and demo flags, entirely independently of `showModeEnabled`. They can disagree with each other on screen. Related: `useSmartLinkPageMode` and `useSmartLinkLiveSurface` exist but are unused, with their logic duplicated inline on the artist page.

**`docs/SHOW-MODE-BADGE-CONTEXT.md` is stale** — it describes `ShowCheckInRewardSlot` as an empty placeholder. That component was deleted in July 2026; badge generation is implemented, live, and now lives on its own surface in `ShowCheckInBadgeModal.vue`.

### System-level

**`showModeEnabled` and `showModeStatus` are redundant** and can disagree. Different call sites check different ones. A single source of truth would remove a class of bugs.

**Events carry no timezone.** Check-in windows for event-driven shows lean on `band.showModeTimezone`, which is only populated if the band previously started a manual show from a browser in that zone. A per-event timezone (or a band home timezone) would make event automation trustworthy.

**Recap metrics are computed once and frozen.** Late-arriving interactions after recap generation are not reflected unless someone regenerates. Acceptable today; worth revisiting if recaps become fan-facing.

Show Mode timing now has `scripts/check-show-time.js` plus `scripts/test-show-mode-timing.js`. The check-in path is still verified by hand.

---

## 14. How to extend it

**Add a metric to the recap.** If it can be counted from existing rows, add it to `generateShowRecap` and a column to `src/api/show-recap/content-types/show-recap/schema.json`. If it should also apply to already-generated recaps, compute it in `withCheckInStats` instead and skip the schema change.

**Add a new check-in source.** Extend the `checkInSource` enum on `fan-show-attendance`, pass the value through `processShowCheckIn`, and consider whether it deserves a `verificationLevel` bonus in `calculateConfidenceScore`.

**Change when a show ends.** All end-time logic funnels through `getNextMorning6AM`. Change it there, add cases to `scripts/check-show-time.js`, and remember the cron only checks every 15 minutes.

**Add show context to a new record type.** Copy the pattern from `fan-show-attendance`: store the campaign ID *and* a denormalized copy of venue/city/title/timezone. Do not rely on reading it back off the band — it will be gone.

**Add a field the artist page needs.** `GET /api/bands/slug/:slug` returns all scalar fields automatically, so a new band column is available on the public page with no controller change. That also means anything stored there is public — never put private data on the band record.

---

## 15. Debug playbook

**A show did not produce a recap.** Check `showModeLastCampaignId` and `showModeEndedAt` on the band. If both are set and no `show-recap` row exists for that campaign, the cron fallback should catch it within 15 minutes — look for `[cron] Generated missing show recap`. To force it, `POST /api/show-recaps/generate` with the campaign ID.

**The recap has no venue or start time.** Generated before the July 2026 fix, or generated by the cron for a session whose context was already lost. Regeneration now recovers context from attendance rows if any check-ins exist.

**Show Mode ended at a strange hour.** Inspect `band.showModeTimezone`. If null, the end time was computed on the UTC server clock. Have the band restart show mode from a browser in the venue's timezone.

**Check-ins are landing as `after_show`.** Compare the event's `date` + `time` against `band.showModeTimezone`. An event with no time defaults to 8:00 PM.

**Fans are being counted into the wrong show.** Look for a non-null `showModeCampaignId` on a band that is not live — that should never happen, and it means something wrote the field outside `activate*`/`deactivateShowMode`.

**Useful log prefixes:** `[ShowMode]` for state transitions, `[cron]` for the scheduled job, `[CheckIn V2]` for check-in processing, `[ShowMessage]` for post-show sends.

---

## 16. Post-show messaging

This is the payoff for everything above: the band emails the people who were actually in the room.

### Fans have no accounts

Nothing here asks a fan to sign in, and nothing should. The email typed at check-in *is* the relationship — a `fan` row carrying `status`, `consentVersion`, `consentTextSnapshot`, and `captureCampaignId`. Messages arrive in an inbox; the only interactive surface is a tokenized unsubscribe link.

### Who receives a message

`fan-show-attendance` rows for the recap's `campaignId`, minus rows flagged `suppressedDuplicate`, deduplicated by fan, minus anyone whose `status` is `unsubscribed`. Attendance is deliberately the source of truth: it means "was verifiably at *this* show," not "is on the band's list."

### Send limits are per fan, not per show

There is **no quota on how many messages a band may send about a show**. The limit is on the receiving end: a fan is skipped if they were emailed within `FAN_COOLDOWN_HOURS` (24), tracked by `lastMessagedAt` on the fan row.

This axis matters. An earlier design capped sends per show, which constrained a band playing one show while doing nothing about a band with eight recaps mailing the same overlapping people. The cooldown follows the person instead, so it holds no matter which show the message comes from.

The reason a limit exists at all is that **every band shares one sending domain** (`mail.faneqo.com`). Spam complaints attach to the domain, not the band, so one band's behavior sets inbox placement for all of them. That is also why unsubscribe is non-negotiable.

The composer shows the split before the band writes anything ("18 can be emailed right now · 7 of the 25 who checked in already heard from you"). Two other blocks live in `getSendEligibility`: a two-minute double-submit guard, and a **recency guard** — a show older than `MAX_SHOW_AGE_DAYS` (60) is closed to messaging, because a crowd that no longer remembers the band is the fastest route to spam complaints.

`messagesSentCount` on the recap is now history, not a quota.

### Deliverability controls

Reputation is the shared resource this whole feature spends, so three things guard it beyond the cooldown.

**Sender identity.** `buildFromHeader(bandName)` sends as `"The Powerlines via Faneqo" <address>`. Recognition is the strongest predictor of not being marked spam, and a fan has never heard of Faneqo. The address comes from `SHOW_MAIL_FROM` when set, falling back to `EMAIL_DEFAULT_FROM`.

**Isolating bulk from transactional.** Band mail currently shares a sender with account confirmations and Stripe receipts, so complaints earned by a band's message can push password resets into spam. Setting `SHOW_MAIL_FROM` to an address on a separate verified subdomain (for example `shows@shows.faneqo.com`) splits the two reputations. The code already reads it; what remains is a Resend sending domain plus its DNS records. **This is a deliberate open item, not an oversight.**

**Bounce and complaint handling.** `POST /api/email-events/resend` consumes Resend webhooks. A hard bounce or a spam complaint suppresses that address via `fan.suppressByEmail`, which sets `status: 'unsubscribed'` and records `suppressionReason`. Suppression applies across **every band**, on purpose: a dead mailbox is dead for everyone, and someone who reports our mail as spam is reporting the shared domain. Soft bounces are ignored — a full mailbox will accept mail next week.

Requires `RESEND_WEBHOOK_SECRET`. The handler refuses to run without it rather than trusting an unsigned caller with suppression powers. Signatures are verified in `src/utils/svixSignature.js` (Svix scheme, implemented on `crypto` with no new dependency), using the raw body via `Symbol.for('unparsedBody')` — the same mechanism the Stripe webhook uses, which works because `includeUnparsed: true` is set globally in `config/middlewares.js`. Verified by `scripts/check-svix-signature.js`.

### The email

The band writes the **subject line** (prefilled with `Thanks for coming out to <venue>`, overwritable, 140 char max) and the body. Faneqo adds only the envelope: a greeting, a signature, and a footer naming the show they checked in at plus the unsubscribe link. **`replyTo` is the band owner's account email**, so a fan replying reaches the band, not a noreply void. Subject and note are escaped before being interpolated into HTML.

### Unsubscribe

`unsubscribeToken` on the fan is minted lazily, the first time that fan is actually mailed, so it exists for fans captured long before this feature.

The mailed link points at the **frontend** page `/unsubscribe?token=…`, which POSTs to `/api/fans/unsubscribe` on mount. This indirection is load-bearing: inbox providers and security scanners prefetch links in email, so a plain `GET` unsubscribe endpoint would silently unsubscribe people who never clicked. Scanners do not execute page JavaScript. The same page offers a one-click resubscribe.

Unsubscribing sets `status: 'unsubscribed'` and `unsubscribedAt`. It is scoped to the fan row, which is per-band — a fan who saw two different bands unsubscribes from them independently. The same is true of `lastMessagedAt`: the cooldown is per band-fan pair, so two bands' sends never block each other.

### Files

Backend: `src/api/show-recap/services/show-message.js`, the `messagePreview` / `sendMessage` / `resolveOwnedRecap` handlers in `src/api/show-recap/controllers/show-recap.js`, `unsubscribeByToken` / `resubscribeByToken` / `ensureUnsubscribeToken` / `suppressByEmail` in `src/api/fan/services/fan.js`, `src/api/email-event/` for the webhook, `src/utils/svixSignature.js`, and `scripts/check-show-message.js` plus `scripts/check-svix-signature.js` for the pure rules.

Frontend: `components/dashboard/fans/ShowMessageComposer.vue` (mounted inline on `/fans/recaps/:id`), `pages/unsubscribe.vue`, and the two new methods on `composables/useShowRecaps.js`.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_WEBHOOK_SECRET` | Yes, for bounce handling | Svix signing secret. Without it the webhook rejects everything. |
| `SHOW_MAIL_FROM` | No | Dedicated sender for band-to-fan mail. Falls back to `EMAIL_DEFAULT_FROM`. |
| `PUBLIC_SITE_URL` / `PUBLIC_HOSTNAME` | No | Base for the unsubscribe link. Defaults to `https://faneqo.com`. |

A full deliverability audit, the verified DNS state, and the step-by-step subdomain plan live in `docs/FAN-MESSAGING-AUDIT.md`.

### Known limits

Sends happen inline in the request, batched five at a time. Fine for a club show; a list in the thousands would need a background job. There is no `List-Unsubscribe` header yet — worth adding if volume grows, and it needs provider support for custom headers. There is no record of what was sent, only that something was. There is also no per-band volume ceiling: the cooldown limits how often one fan is reached, not how much mail one band generates in total.

---

## 17. Night system roadmap (enrichment landed)

Show Recap remains the durable canonical record of a completed night. Do not create `ShowNight`, `NightEntity`, or another attendance table. Public Event stays optional.

**True today:** manual Show Mode + cover does **not** create an Event. Cover belongs to the Night (`ShowRecap.coverImage`). Event-backed nights may use the Event image only as a fallback when the Night has no cover.

**NEXT:** gallery visibility / public sharing foundation. Galleries default public. A gallery attached to a ShowRecap must not inherently become `show_attendees`. Multiple galleries per night stay allowed.

**BLOCKER:** public Night / gallery sharing cannot ship until public band serialization is allowlisted. See `qrserver/docs/FANEQO_NIGHT_SYSTEM.md`.

This slice did not implement those fields or any frontend timing UI.
