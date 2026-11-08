# Faneqo Night system

Architectural spine for a night that actually happened. ShowRecap is the durable Night. No `ShowNight` / `NightEntity`.

## Objects

| Object | Meaning |
| --- | --- |
| Event | Optional public/promotional show. Not required for a Night. |
| Show Mode | Live operational state on the band. Temporary. |
| ShowRecap | Durable record of the night. System metrics + artist enrichment. |
| Night Recording | Artist-authored audio/video for one ShowRecap. Not Gallery media. Backend: `docs/FANEQO_NIGHT_RECORDINGS.md`. |
| Night Story | Future presentation of ShowRecap + media + relationship context. |
| Gallery | ArtistUpdate media that may belong to a Night via `showRecap`. |
| Passport | Fan's accumulated relationship with artists and Nights. |

A manual Show Mode session is fully valid with **no Event**.

## System vs artist-authored

**System-derived** (regeneration may refresh):

`campaignId`, `eventId`, show identity snapshot, venue/place, timing, timezone, `showModeType`, fan/check-in/interaction metrics.

**Artist-authored** (regeneration must not overwrite):

`publicStory`, `privateArtistNote`, `lineup`, `coverImage`, `nightSlug` once set, `heroImage`, `heroFocalX`, `heroFocalY`.

Night Recordings are a **separate collection** (`NightRecording`) belonging to the ShowRecap. Regeneration must not create, overwrite, or delete them.

`nightSlug` is generated only when missing. `coverImage` may be seeded from an explicit Show Mode Night photo (`coverMediaId`) only when the Night has no cover. Event artwork is never copied into `coverImage` for new or regenerated recaps. Do not auto-seed `heroImage`.

## Enrichment schema (ShowRecap)

| Field | Type | Null | Notes |
| --- | --- | --- | --- |
| `publicStory` | text | yes | Public retrospective copy. Max 5000. No HTML. |
| `privateArtistNote` | text | yes | Owner/manager only. Max 10000. Never public. |
| `lineup` | json | yes | Ordered snapshot. Max 50. |
| `nightSlug` | string | yes | Stable URL id. Not DB-unique. Generated server-side. |
| `coverImage` | media (image) | yes | Night Photo. Public-safe only. Never Event or artist fallback. |
| `heroImage` | media (image) | yes | Optional Night Hero override. Null = use Artist Image. Public-safe only. |
| `heroFocalX` / `heroFocalY` | decimal 0–100 | yes | Night Hero framing. Default behavior 50 / 50. No imageFit or zoom. |

Do not store these on Band.

## Lineup snapshot

```json
{ "name": "Dead Poet Society", "bandId": 22, "role": "support", "order": 1 }
```

`name` is always stored. `bandId` is optional and must refer to a real band if present. Historical names do not update when the linked band later changes. Roles: `headliner`, `co_headliner`, `direct_support`, `support`, `opener`, `guest`, `other`.

## Night slug

Shape: `the-basement-east-nashville-sep-5-2026-ab12cd34`

Built from venue/title, city, performance/show date, campaign suffix. Never from `privateArtistNote`. Never regenerated because title/story/lineup changed. Legacy rows may be null until first enrichment or first generation after this slice. No production backfill.

## Cover

Cover belongs to the Night.

- Manual + cover → live Show Mode, **no Event**, `showModeMetadata.coverMediaId` held for the session, then `showModeLastContext.coverMediaId` + ShowRecap.coverImage
- Manual without cover → no Event
- Event-backed → `eventId` kept; Event image stays Event artwork (`night.eventImage`). It is not Night Photo and is not seeded into `coverImage`
- Protected/gated ArtistUpdate media is rejected as Night cover or Night Hero
- Foreign uploads are rejected

`createDurableShowEvent` remains in the codebase but is not used for manual cover.

## Enrichment API

Authenticated, owner/manager (`editBand`):

`PATCH /api/show-recaps/:id/night`

Partial fields: `publicStory`, `privateArtistNote`, `lineup`, `coverMediaId`, `heroMediaId`, `heroFocalX`, `heroFocalY`.

Omitted = unchanged. `null` clears. `lineup: []` clears lineup. `heroMediaId: null` returns the Night to Artist Image fallback.

`GET /api/show-recaps/:id/night` — owner/manager see the private note; viewer does not. Fans and anonymous cannot read or edit.

Legacy recaps with a null `nightSlug` get a slug the first time they are enriched or regenerated. There is no `prepare-share` endpoint; enrichment already guarantees slug creation when missing. Do not bulk-write history.

## Privacy

`privateArtistNote` must never appear in public Night/Gallery JSON, ArtistUpdate teasers, share title/description, OG, or search metadata. `toPublicNight()` and the public share serializer omit it. The artist Night endpoint may include it for owner/manager only.

---

## Gallery visibility

**Default for create/publish is `public`.** If `visibility` is omitted or empty, the server stores `public`. This applies to general galleries, ShowRecap galleries, Event-backed galleries, and manual Show Mode Night galleries.

The artist may explicitly choose:

- `public`
- `fan_list`
- `show_attendees`

Show context and visibility are independent. Attaching a gallery to a ShowRecap, Event, or Show Mode campaign **must not** force `show_attendees`.

A gallery may belong to The Basement East / Nashville / Sep 5 while being public, Fan List, or show attendees.

Multiple galleries per Night remain allowed.

### Artist choice vs old UI default

`ArtistUpdate.visibility` schema default is already `public`.

The Share Photos composer still **sends** `show_attendees` today. That is an explicit client value, not a server mutation. Omitted body visibility is `public`. Do not treat the current Vue default as domain law. Do not change that UI in this slice.

### ShowContext independence

Resolved ShowContext stays:

`bandId` · `eventId?` · `campaignId?` · `showRecapId` · `showModeType`

Public media does not erase attendance meaning. An attendee viewing a **public** Night gallery can still receive `youWereThere`. Relationship truth is not tied to exclusivity.

`isShowGalleryPublish` (`show_attendees` **or** `showRecapId`) is only the 12-photo cap. It must not mutate visibility.

### Gated public shell

Page discoverability and media access are separate.

Unauthorized presentation may return `photoCount` and public-safe Night identity. It must never return:

- upload file objects
- signed stream URLs
- S3 / CDN / thumbnail URLs for protected gallery photos
- media IDs that can be replayed against the stream endpoint as a bypass
- `privateArtistNote`
- fan PII / attendance identities
- Show Mode campaign plumbing on the public `show` object

Conceptual contract:

| Visibility | Anonymous / ineligible | Eligible viewer | Artist/team |
| --- | --- | --- | --- |
| `public` | metadata + full public media, `locked=false` | same; attendee may get `youWereThere` | full media |
| `fan_list` | public-safe shell, no media, `locked=true`, `lockReason=fan_list` | fan-list member: full media | full media |
| `show_attendees` | public-safe shell, no media, `locked=true`, `lockReason=show_attendees` | verified attendee: full media + `youWereThere` | full media |

Gated shell may include:

- gallery: id, slug, title, visibility, photoCount, publishedAt, locked, lockReason
- artist: public-safe id / name / slug
- show: showRecapId, Night title, venue, city, date, nightSlug, publicStory, public-safe Night cover

Gated caption/`bodyText` is omitted from unauthorized teasers.

Night cover fallback for a gated shell (never a protected gallery photo):

1. `ShowRecap.coverImage` if public-safe
2. linked Event public image
3. artist public profile image
4. later generic Faneqo fallback

Protected files are rejected as cover presentation.

### Protected media

Authorization for `show_attendees` remains canonical attendance. `fan_list` remains claimed non-removed fan. `_vid` / visitor tokens never grant access. The stream endpoint still denies unauthorized bytes even if a signed URL is guessed without a valid decision.

### fan_list STOP GATE

Backend accepts and stores `fan_list` only when protected delivery is configured (`protectedReady`). Otherwise publish/transition returns `gated_delivery_unavailable`. Do not silently treat `fan_list` as public. If production delivery is not configured, Fan List cannot be published end-to-end.

### Visibility change

`PATCH /api/artist-updates/:id/visibility`

Artist/team (`editBand`) only. Preserves id, slug, ShowContext, and media order. Does not republish. Does not emit a new relationship event.

| From | To | Result |
| --- | --- | --- |
| any | same | no-op |
| `show_attendees` / `fan_list` | `public` | SAFE |
| `public` | `fan_list` / `show_attendees` | SAFE only if every file is already protected **and** delivery is ready |
| `show_attendees` | `fan_list` | SAFE if files are protected and delivery is ready |
| `fan_list` | `show_attendees` | SAFE if files are protected, delivery is ready, and Night scope exists |
| `public` (unprotected files) | gated | `unsafe_visibility_transition` — do not fake conversion |
| any | `show_attendees` without Night scope | `show_required` |
| any | gated when delivery is not ready | `gated_delivery_unavailable` |

Public default does not mean public forever. Unsafe post-publication conversion is rejected clearly.

### Relationship events

`artist_update_published` still fires on publish.

`show_gallery_added` fires when the published update has ShowContext (`eventId`, `showRecapId`, or Show Mode `campaignId`), **not** because visibility is `show_attendees`. Idempotency key remains `show_gallery_added` + update id. Visibility-only edits do not emit a new event.

---

## Public Band allowlist

Public responses use a **positive allowlist**. New Band schema fields do not appear until explicitly added.

`GET /api/bands/slug/:slug` is always the public allowlist (even if the owner is logged in).

`GET /api/bands` and `GET /api/bands/:id` use the public allowlist for anonymous callers. Authenticated owner/manager/viewer of that band may also receive `stripeAccountId` and `stripeOnboardingComplete` so the dashboard/editor keep working. Internals still never serialize.

### Public-safe live Show Mode (retained)

`showModeEnabled`, `showModeStatus`, `showModeEndsAt`, `showModeStartedAt`, `showModeTitle`, `showModeVenue`, `showModeCity`, `showModeEventId`, `showModeCampaignId`

`showModeCampaignId` stays public because the current artist-page check-in client sends it to attendance endpoints. Do not remove it until check-in is moved server-side.

### Forbidden on public Band payloads

Including but not limited to: `showModeLastCampaignId`, `showModeLastContext`, `showModeLastDeactivationReason`, performance-history clocks, scheduled/recovery/metadata internals, `users_permissions_user`, `link_clicks`, fans, QRs, external metrics, Stripe fields (slug endpoint / anonymous), merch concierge, page-view/play rows.

Contract test: `scripts/test-public-band-serializer.js`.

---

## Public Night contract

`GET /api/public/bands/:bandSlug/nights/:nightSlug`

Anonymous allowed. Optional Bearer JWT may enrich viewer relationship. Login is never required for public Night data.

Lookup is **bandSlug + nightSlug**. Raw ShowRecap id is not a public identity. Unknown, null, or ambiguous slugs return 404. There is no public `/nights` index.

Canonical frontend path:

`/:bandSlug/night/:nightSlug`

Allowlisted payload:

- `artist` — id, name, slug, public-safe image
- `night` — nightSlug, title, venue, city, region, country, date, performance timing, timezone, publicStory, lineup, cover (Night Photo = `coverImage` only, or null), eventImage, hero (Night Hero override or null), heroFocalX, heroFocalY, attendanceCount
- `viewer` — authenticated, youWereThere, optional showOrdinal / isArtist
- `galleries` — published ArtistUpdates on that ShowRecap, each using existing access + teaser rules
- `share` — canonicalPath, title, description, public-safe image

`attendanceCount` is the canonical unsuppressed check-in aggregate for the Night. No named attendees, fan rows, emails, or dashboard analytics.

### Viewer relationship

Anonymous: `{ authenticated: false, youWereThere: false }`.

Authenticated fan: resolve canonical fan for that artist. `youWereThere` if canonical attendance matches `eventId` or Show Mode `campaignId`. `showOrdinal` is the fan's canonical attendance ordinal for that Night (1 = first show). Query params are not trusted. Opening a Night URL does not write attendance.

Artist/team may receive `isArtist: true` on this public payload. They still do **not** receive `privateArtistNote` here. The private note stays on `GET /api/show-recaps/:id/night`.

### Night galleries

All **published** galleries attached to the ShowRecap. Drafts excluded even for the artist.

Visibility uses `decideArtistUpdateAccess` / `serializeViewerMedia` / protected delivery. No second engine.

---

## Public Gallery contract

`GET /api/public/bands/:bandSlug/galleries/:gallerySlug`

Anonymous allowed. Optional JWT for fan_list / show_attendees / youWereThere / artist context.

Canonical frontend path:

`/:bandSlug/gallery/:gallerySlug`

Gated galleries still resolve for anonymous users (`locked=true`, `lockReason`, `media=[]`). 404 only for missing, wrong artist, or unpublished/draft.

Gallery slug is server-generated, band-scoped, stable after publish, and unchanged by visibility edits.

---

## Share metadata

Built by `src/utils/showMode/publicNightSharePure.js`.

**Night title:** `{Artist} at {Venue} · {City}` with safe fallbacks.

**Night description:** publicStory excerpt → artist/venue/city → generic. Never `privateArtistNote`.

**Gallery description:** public caption only when visibility is `public`; gated galleries use publicStory / venue fallback.

**Images are independently public-safe.** Viewer access does not change OG safety. Facebook/Discord/SMS crawlers must never receive protected gallery bytes.

`night.cover` is Night Photo only (`ShowRecap.coverImage`, public-safe, or null). It does not collapse Event or artist imagery.

Share/OG `share.image` is an independent contract and may still use Recap cover → Event image → artist image → null.

Public gallery image: first public gallery photo → Night cover chain.

Gated gallery image: Night cover chain only. Never gallery media, even for an eligible attendee.

Public image objects are `{ url, width, height, alternativeText }` only. No provider metadata, S3 keys, hashes, or signed protected URLs.

---

## What is explicitly not public

- `privateArtistNote`
- `campaignId` / Show Mode last-context / recovery / scheduled internals
- raw attendance rows, fan ids, emails, phones
- message recipient / suppression data
- Stripe / billing
- internal analytics breakdowns
- draft galleries
- a public feed of every Night
- share-click / viral analytics tables

---

## Cache

Public Night and Gallery responses can differ with optional JWT. Both anonymous and authenticated responses send `Cache-Control: private, no-store`. Do not share personalized payloads through a public cache.

---

## nightSlug collision

Public lookup is band-scoped. `uniqueNightSlug` now also checks uniqueness **within a band**. No new DB unique constraint. If two recaps for the same artist somehow share a slug, the public endpoint 404s rather than guessing.

---

## Frontend destinations (Slice 4A)

Nuxt pages now exist:

- `/:bandSlug/night/:nightSlug`
- `/:bandSlug/gallery/:gallerySlug`

SSR fetches the anonymous public endpoint. After hydration, an optional Bearer refresh of the same endpoint enriches viewer/media. OG/canonical tags use backend `share.*` only. Legacy `/:bandSlug/updates/:slug` 301s to `/gallery/:slug` and keeps query state.

Share Photos UI now defaults to **public**. The artist may choose Everyone / Fans / People who were there.

Legacy recaps without `nightSlug` do not get a fabricated share URL. They become shareable after backend enrichment/regeneration writes `nightSlug`.

---

## Night Recordings (backend foundation)

A Night may remember what it sounded like. `NightRecording` is a repeatable object on ShowRecap — not fields on ShowRecap, not Gallery media, not Band music.

Contract: `docs/FANEQO_NIGHT_RECORDINGS.md`.

Artist editor language (frontend later): **RECORDINGS** / "Add something from the stage."
Public Night language (frontend later): **FROM THE STAGE** · **HEAR THE NIGHT** · **WATCH THE NIGHT**

Do not put those labels in API payloads.

Public Night `GET /api/public/bands/:bandSlug/nights/:nightSlug` now includes `recordings` (empty array when none). Artist management UI is not in this pass.

## Next

Cinematic Night / Gallery visual polish
→ artist-branded fan experience
→ messaging inside the same artist world

Do not redesign messaging in this slice.
