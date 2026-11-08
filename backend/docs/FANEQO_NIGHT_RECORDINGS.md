# Faneqo Night Recordings

Backend foundation. Frontend artist Recap UI, Public Night player chrome, Passport, Messages, and Share Kit are **intentionally deferred**.

North star: **Photos remember what the Night looked like. Music remembers what the Night felt like.**

ShowRecap remains the durable Night identity. There is no `ShowNight`, `NightEntity`, or `PerformanceNight`.

---

## What landed

`NightRecording` is a repeatable artist-authored object:

- belongs to one Band
- belongs to one ShowRecap
- audio or video
- upload or provider link (YouTube, Spotify, external URL)
- visibility: `public` | `fan_list` | `show_attendees`
- status: `draft` | `published` (application enum, not Strapi Draft & Publish)
- deterministic `sortOrder`

A Night may contain multiple recordings. First published recording by `sortOrder` is the natural featured item. No featured flag in V1.

---

## What this is not

Not Gallery / ArtistUpdate media.
Not message attachments.
Not Band Spotify/YouTube profile fields.
Not provider-field soup on ShowRecap (`spotifyUrl`, `youtubeUrl`, `audioFile`, …).

---

## Schema

Collection: `night_recordings` (`api::night-recording.night-recording`)

| Field | Notes |
| --- | --- |
| `band` | required manyToOne |
| `showRecap` | required manyToOne — Night identity |
| `createdByUser` | audit only; not authorization |
| `title` / `caption` | optional copy |
| `kind` | `audio` \| `video` |
| `source` | `upload` \| `youtube` \| `spotify` \| `external` |
| `providerUrl` / `providerType` / `providerResourceType` / `providerResourceId` | canonical provider facts; never embed HTML |
| `uploadedMedia` | Upload.file, audios or videos |
| `posterImage` | optional public image |
| `durationSeconds` | optional, never fetched from providers |
| `sortOrder` | integer, list is `sortOrder` then `id` |
| `visibility` | `public` \| `fan_list` \| `show_attendees` |
| `status` | `draft` \| `published` |
| `publishedAt` | set when published |
| `createIdempotencyKey` | private, unique, retry-safe create |

No Event relation. Night identity is ShowRecap. Mutable Event data is not a recording key.

---

## Authorization

Mutations require `requireBandPermission(..., 'editBand')` on the **ShowRecap's band**.

Owner and manager can manage. Viewer cannot. Creating user, body `bandId`, email, or frontend role claims are not authority.

Cross-band isolation is enforced on list/create/update/delete.

---

## Management API

Authenticated artist/team (JWT resolved in controller; routes match Artist Update `auth: false` + service auth):

| Method | Path |
| --- | --- |
| GET | `/api/show-recaps/:id/recordings` |
| POST | `/api/show-recaps/:id/recordings` |
| GET | `/api/night-recordings/:id` |
| PATCH | `/api/night-recordings/:id` |
| DELETE | `/api/night-recordings/:id` |

Hard delete. No archive table. Matches the simplest existing content pattern.

Idempotent create: optional `createIdempotencyKey` (8–80 `[A-Za-z0-9._:-]`). Same user + Night + key replays the original row.

Server safety cap: **12 recordings per Night** (same number as show-gallery photo cap). Suggested artist-facing V1 product limit: **1–4**. Do not treat 12 as a UI target.

Band and ShowRecap are immutable after create.

---

## Public-safe resolver

`resolveNightRecordingsForViewer({ recap, bandId, userId })`

Viewer truth is server-derived (JWT → band permission / fan row / canonical attendance). `_vid`, localStorage, and query claims are ignored.

| Visibility | Anonymous / ineligible | Eligible | Artist/team |
| --- | --- | --- | --- |
| `public` | full provider/media | full; attendee may get `youWereThere` | full |
| `fan_list` | locked teaser, no URLs | fan-list member | full |
| `show_attendees` | locked teaser, no URLs | verified attendee of this Night | full |

Drafts are omitted from public Night. Empty Night: `recordings: []`.

Locked objects may keep `title`, `kind`, `source`, `visibility`, `lockReason`. They omit caption, provider URL/id, uploaded file URL, poster, S3 keys, `provider_metadata`.

---

## Public Night integration

`GET /api/public/bands/:bandSlug/nights/:nightSlug` includes `recordings` via `publicShareService`. Frontend player chrome is not built in this pass. Extra JSON is ignored by current Public Night UI.

---

## Providers

**YouTube** (`kind=video` only): store canonical `https://www.youtube.com/watch?v=ID`. No scrape, no download.

**Spotify** (`kind=audio` only): track / album / playlist. Canonical `https://open.spotify.com/{type}/{id}`. No Spotify API. No audio copy.

**External**: https URL only. No embed/script HTML. YouTube/Spotify hosts must use their dedicated source.

---

## Uploaded audio — SUPPORTED NOW

Reuse Strapi Upload / S3. No second upload endpoint.

NightRecording references an already-authorized Upload.file (same ownership/grace rules as Night cover, MIME-specific).

Allowed audio MIME (current): `audio/mpeg`, `audio/mp3`, `audio/mp4`, `audio/x-m4a`, `audio/m4a`, `audio/aac`, `audio/wav`, `audio/x-wav`, `audio/wave`, `audio/ogg`, `audio/webm`.

Size: up to the existing multipart `50mb` form limit.

Gated (`fan_list` / `show_attendees`) **uploaded** recordings cannot be published yet. Protected media today is image-only (webp derivatives + signed URLs). Public S3 URLs cannot be honestly gated. Draft gated uploads are allowed. Provider links may publish gated (URLs omitted for unauthorized viewers).

---

## Uploaded video

**SUPPORTED NOW (honest, limited):** `video/mp4` only, same 50 MB form limit, public S3/CDN delivery. No transcoding, no HLS, no automatic poster extraction, no range-request product layer beyond what S3/CloudFront already do. Safari/iPhone playback depends on the file already being H.264 + AAC.

**MODELED FOR LATER:** other containers (`video/quicktime`, `video/webm`), transcoding, posters from frames, protected/gated uploaded video.

Prefer YouTube for live performance video until a real video pipeline exists.

Optional `posterImage` is a public Upload image. No auto-extraction.

---

## Regeneration

Recordings are independent after create. Recap generation / Night enrichment / Event updates must not delete them. They are not ShowRecap columns, so recap metric refresh cannot overwrite them.

---

## Future surfaces (not implemented)

| Surface | Use the same NightRecording |
| --- | --- |
| Artist Show Recap editor | RECORDINGS · "Add something from the stage." |
| Public Night | FROM THE STAGE · HEAR THE NIGHT · WATCH THE NIGHT |
| Fan Passport | wrapper around the same row; no Passport copy |
| Messages | later: message may reference a Night Recording. Do not invent a second attachment type unless the existing reference envelope makes it trivial. |
| Share Kit | Listen / Watch artifacts. Do not copy third-party provider audio/video. Artist-owned uploads only if rights + renderer allow. |

Do not hard-code those presentation labels in API JSON.

---

## Frontend integration contract (next UI pass)

Management list item:

```json
{
  "id": 1,
  "bandId": 7,
  "showRecapId": 41,
  "title": "Ghost (live)",
  "caption": "",
  "kind": "video",
  "source": "youtube",
  "visibility": "public",
  "status": "published",
  "sortOrder": 0,
  "durationSeconds": null,
  "publishedAt": "...",
  "provider": { "type": "youtube", "resourceType": "video", "resourceId": "...", "url": "https://www.youtube.com/watch?v=..." },
  "media": null,
  "poster": null
}
```

Public card (unlocked):

```json
{
  "id": 1,
  "title": "Ghost (live)",
  "caption": "",
  "kind": "video",
  "source": "youtube",
  "visibility": "public",
  "duration": null,
  "locked": false,
  "lockReason": null,
  "youWereThere": false,
  "provider": { "type": "youtube", "resourceType": "video", "resourceId": "...", "url": "https://www.youtube.com/watch?v=..." },
  "media": null,
  "poster": null
}
```

Locked card: `locked: true`, empty caption, `provider`/`media`/`poster` null.

Create body (examples):

```json
{
  "kind": "video",
  "source": "youtube",
  "providerUrl": "https://youtu.be/dQw4w9WgXcQ",
  "visibility": "public",
  "status": "published",
  "createIdempotencyKey": "optional-client-key"
}
```

```json
{
  "kind": "audio",
  "source": "upload",
  "uploadedMediaId": 123,
  "visibility": "public",
  "status": "published"
}
```

Upload itself still goes through the existing authorized artist upload path. This API only references file ids.

---

## Tests

```
node scripts/test-night-recording-boot-requires.js
node scripts/test-night-recordings.js
node scripts/test-public-night-share.js
```

No Strapi/Nuxt server required.
