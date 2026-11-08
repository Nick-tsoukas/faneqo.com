# Show Mode timing — Night system Slice 1

Backend contract for performance time vs Show Mode session time.
Canonical product doc: `musicbizqr/docs/SHOW-MODE.md` §3A.

ShowRecap remains the durable night. No `ShowNight` / `NightEntity`.
Public Event stays optional.

## Two clocks

| Clock | Meaning | Live band fields | Recap fields |
| --- | --- | --- | --- |
| Performance | Intended musical start/end | `showModePerformanceStartsAt`, `showModePerformanceEndsAt` | `performanceStartsAt`, `performanceEndsAt` |
| Session | Faneqo capture window | `showModeStartedAt`, `showModeEndsAt` | `showStartedAt`, `showEndedAt` |

`showModeEndsAt` is the effective expiry:

```
effectiveEndsAt = min(performanceEndsAt, nextLocal6AM(sessionStart))
```

6 AM local is the hard safety ceiling, not the normal intended end.

## Activation

### Manual — `POST /api/bands/:id/show-mode/manual`

Optional body: `performanceStartsAt`, `performanceEndsAt`, `timezone`, plus existing venue fields.

Legacy body (current dashboard): no performance fields.

- `performanceStartsAt` defaults to activation time
- `performanceEndsAt` defaults to next local 6 AM
- Invalid timezone does not crash; falls back
- Malformed timestamps return 400
- End must be after start; equal is rejected
- Explicit client times farther than 24h past/future, or longer than 24h, are rejected
- Future **Schedule** is deferred. Do not revive Event auto-activation.

### Event-backed — `POST /api/bands/:id/show-mode/from-event`

Event-backed Show Mode is an **immediate live action**, not a scheduling action.
An Event may only mint a session inside a bounded activation window:

```
opensAt  = eventStart - 24h
closesAt = min(eventStart + 4h, nextLocalSixAm(eventStart))
```

`nextLocalSixAm` is the next occurrence of 06:00 in the resolved event/show
timezone, not `getNextMorning6AM` (which always advances a calendar day because
it bounds a session opened the evening before).

**Timezone authority** (`eventActivationPure.resolveActivationTimeZone`), most
trustworthy signal first:

1. The Event's own location — `state` → IANA zone. The Event schema has no
   timezone column, so this is the most canonical signal we own.
2. The band's stored `showModeTimezone`.
3. The client-supplied `payload.timezone` — **last resort only**.
4. Nothing usable → the existing server-clock fallback.

The browser's zone used to come first, which let a touring artist's laptop move
the activation window away from the venue's clock in both directions: a Start
button that the backend would refuse, and — worse — a hidden Start button on a
night the backend considered eligible.

The window lives in `eventActivationPure.resolveEventActivationWindow`, and
refusals come from `eventActivationPure.activationRefusal`:

| State | Error | Status |
| --- | --- | --- |
| Event has no usable `date` **and** `time` | `event_time_missing` | 400 |
| Before `opensAt` | `event_activation_not_open` | 400 |
| At/after `closesAt` | `event_activation_closed` | 400 |

409 stays reserved for `already_live`. Every refusal carries an `activation`
block (`state`, `eventStartsAt`, `opensAt`, `closesAt`).

This is data integrity, not polish. A historical Event must not create a new
live campaign, attendance window, or recap; a far-future Event must not become
live now. Frontend hiding is presentation only — the window is re-derived here.

- Copies usable Event `date` + `time` into performance start
- Events have no end: default is start + 4 hours, then the 6 AM ceiling
- `time` is parsed strictly: unlike `showTime.parseTimeParts` there is no 8 PM
  default, because a timeless Event is not activatable
- A session that started in-window may legitimately outlive `closesAt`
- `eventId` is preserved
- Manual Show Mode does **not** create an Event. Cover belongs to the Night.
- Legacy `activateEventShowMode` obeys the same window and returns null outside it

### Read model — `GET /api/bands/:id/show-mode?eventIds=1,2,3`

`showModeService.describeEventActivation` answers every Event the dashboard is
displaying in **one** band-scoped query — never one request per Event. Each row
is `{ eventId, state, eligible, timezone, eventStartsAt, opensAt, closesAt,
reason }`, with absolute ISO instants so the client compares them against its
own clock instead of rebuilding `date` + `time` in the browser zone.

The band filter is the authorization boundary: another artist's Event is simply
absent from the result. This is **presentation only** — `activateFromEvent`
re-derives the window at click time and is the sole enforcement point.

## Auto end

Every minute, on the existing `* * * * *` cron slot (shared with message campaigns):

```
showModeEnabled = true
showModeStatus = live
showModeEndsAt < now
limit 100
```

Activation always writes `showModeEndsAt`, so the query stays a single bounded inequality. A live row with a null end is a bug, not a second scan.

Every hit goes through canonical `deactivateShowMode(bandId, reason)`:

- `performance_end` when the set end is the binding time
- `safety_expiry` when 6 AM is the binding time
- `manual` from Turn Off
- `auto` leftover/unknown

That path still archives `showModeLastCampaignId`, snapshots context (including performance times), and queues recap generation.

Recap recovery stays on `*/15 * * * *`.

## Extend end

`PATCH /api/bands/:id/show-mode/timing`

Authenticated, owner/manager, live session only.

Body: `performanceEndsAt` (main), optional `performanceStartsAt`, `timezone`.

Must not create a campaign, replace `campaignId`, erase attendance, create a recap, create an Event, or restart Show Mode.

## Recap persistence

Deactivation snapshot includes `performanceStartsAt` / `performanceEndsAt` / `timezone`.

Resolution: fresh snapshot → stored recap → Event start / legacy session stamps.

Regeneration must not overwrite a good value with null.

Read-time fallback: `performanceStartsAt || showStartedAt`, `performanceEndsAt || showEndedAt`.

Do not bulk-rewrite production history.

## Status

`GET /api/bands/:id/show-mode` adds, without removing legacy fields:

`performanceStartsAt`, `performanceEndsAt`, `timezone`, `effectiveEndsAt`

Current `ShowModeCard` keeps working because it still reads `startedAt`, `endsAt`, `campaignId`, `status`.

## Live re-activation (Slice 1.1)

A live session must never be silently replaced.

If `showModeEnabled === true` and `showModeStatus === 'live'`, every activation writer returns:

```
HTTP 409
{
  "error": {
    "name": "already_live",
    "message": "Show Mode is already active.",
    "current": { ...getShowModeStatus... }
  }
}
```

The invariant lives in `showMode.refuseIfLive` / `persistLiveSession`, not only in controllers. Manual, from-event, leftover `activateEventShowMode`, schedule, and scheduled-promote all obey it. `PATCH .../timing` and Turn Off remain allowed.

Sequential / double-submit re-activation cannot replace `campaignId`. Simultaneous requests are claimed with a conditional update (`status <> live OR enabled <> true`). That is not a DB unique constraint; a true parallel race is not proven in the script environment.

## Recovery recap parity (Slice 1.1)

`deactivateShowMode` archives the same snapshot as the immediate recap job onto `band.showModeLastContext` (system/public-safe identity only: campaign, type, title, venue, place, timezone, session stamps, performance stamps, eventId, coverMediaId). Private artist text never goes here.

The 15-minute recovery job feeds `recoveryShowContext(band, campaignId)` into the same `generateShowRecap`. Last-context is used only when its `campaignId` matches the campaign being recovered.

`generateShowRecap` updates system-derived fields only. Artist-authored keys (`publicStory`, `privateArtistNote`, `lineup`, `coverImage`, `nightSlug`, `heroImage`, `heroFocalX`, `heroFocalY`) are stripped on write except `nightSlug`/`coverImage` seeds when missing. `coverImage` seeds only from an explicit Show Mode Night photo. Hero is never auto-seeded. Unknown `metadata` keys survive.

## Still open

- Public `GET` band-by-slug returns all band scalars, including internal Show Mode fields. BLOCKER for public Night / gallery sharing.
- Unused `scheduled` path and shared minute cron key remain as documented in Slice 1.

Cover no longer creates an Event. Night enrichment lives on ShowRecap. See `docs/FANEQO_NIGHT_SYSTEM.md`.

## NEXT

Gallery visibility + public sharing foundation — after public band serializer allowlisting.
