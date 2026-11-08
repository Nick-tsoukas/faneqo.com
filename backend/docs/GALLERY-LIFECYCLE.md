# Gallery lifecycle (backend)

How a Faneqo gallery goes from "the artist opened the camera roll" to "a fan is
looking at it", and what the server guarantees at every step.

Canonical published truth is `api::artist-update.artist-update`. Everything in
this document that is not that content type is staging, derived, or cleanup.

---

## 1. One photo ceiling: 60

`MAX_IMAGES = 60`. `MAX_SHOW_IMAGES` is still exported for back-compat but now
also equals **60** — a show gallery is not a smaller story than a general post.
`validatePublishInput` emits a single message shape: `You can add up to 60 photos.`
No copy anywhere in `src/` or `scripts/` says "12" any more.

The same ceiling is enforced in three places:

| Where | Check |
| --- | --- |
| Draft upload | `canAcceptAnotherPhoto(stagedCount)` before accepting bytes |
| Draft patch | `mediaOrder.length <= 60` |
| Publish / edit save | `validatePublishInput` / `saveManage` |

---

## 2. Draft sessions

`api::gallery-draft.gallery-draft` is a **durable server-side upload session**.
It exists so an artist can lose signal, close the tab, or switch devices without
losing the photos they already uploaded.

A draft is never a source of truth. It holds staging state only:
`sessionId`, `band`, `createdByUser`, `kind`, `mode`, `editingUpdate`, `event`,
`showRecap`, `visibility`, `audienceLocked`, `title`, `caption`, `mediaOrder`,
`mediaCaptions`, `coverMediaId`, `status`, `publishedUpdate`, `returnContext`,
`lastActivityAt`.

States: `active` → `published` | `discarded`. There is no path back to `active`.

**Resume semantics.** `POST /api/gallery-drafts` does not blindly create. If an
`active` create-mode draft already exists for the same (user, band, kind,
showRecap), that one is returned. Edit-mode resumes on (user, band,
editingUpdate). `GET /api/gallery-drafts/active` answers the same question
without creating anything.

**`returnContext` is not a credential.** Only `from`, `draftKey`, and
`returnGallery` survive `sanitizeReturnContext`, each trimmed to 120 chars.
Anything else in the object — tokens especially — is dropped.

---

## 3. Public vs protected staging

Storage classification is derived **server-side from the draft's visibility**.
The client never declares it.

| Draft visibility | Classification | Upload path |
| --- | --- | --- |
| `public` | `public` | Strapi upload plugin (`plugin::upload.file`, ordinary provider) |
| `fan_list` | `protected` | `uploadProtectedImage` → S3 `faneqo-protected/` prefix |
| `show_attendees` | `protected` | same as above |

Both paths write the same identifying tags into the file's `provider_metadata`:

```json
{
  "faneqoGalleryStaged": true,
  "gallerySessionId": "gd_<uuid>",
  "bandId": 7,
  "uploaderUserId": 2,
  "domain": "artist-update",
  "classification": "public" | "protected",
  "stagedAt": "2026-09-14T16:00:00.000Z"
}
```

For protected uploads these keys are **merged into** the metadata
`uploadProtectedImage` already wrote — `objectId` and `keys` are preserved.

These tags are what makes cleanup safe: a staged file is positively identified,
never inferred from "looks unreferenced".

Gated uploads are refused outright when `isProtectedMediaConfigured()` is false
(`gated_delivery_unavailable`). There is **no silent fallback to public**.

---

## 4. Audience lock

The first successful upload sets `audienceLocked = true`.

Changing the audience after that is allowed, but if the change flips the storage
classification (public ↔ gated), the staged photos cannot be reused. The server
answers `409 confirm_clear_required` with `photoCount`, and only clears when the
client repeats the call with `confirmClear: true`. The clear deletes S3 objects
and Upload rows for files positively tagged to this session and not referenced
anywhere, then resets `mediaOrder` / `mediaCaptions` / `coverMediaId` and sets
`audienceLocked = false`.

A same-classification change (`fan_list` ↔ `show_attendees`) keeps the photos.

`show_attendees` additionally requires a `showRecap` or `event` the band owns
(`show_required` / `show_not_owned`).

---

## 5. Publish-time authorization

Every publish runs, in order:

1. authenticated user
2. `requireBandPermission(..., 'editBand')`
3. `validatePublishInput` (title/caption/visibility/count/show scope/delivery)
4. show ownership: `event.band` and `showRecap.band` must equal the publishing
   band → else `show_not_owned` (403)
5. per-file authorization (`authorizeArtistUpdateFile` for protected,
   `authorizeUploadFile` for public)
6. **mixed storage refusal** — a set that is part public and part protected is
   refused with `mixed_media_storage` for *any* visibility
7. **already-attached refusal** — a file attached to a different published
   gallery is refused with `media_already_attached`
8. gated visibility additionally requires every file to be protected
   (`unprotected_media`)

Duplicate ids are deduped first-seen-order by `uniquePositiveIds`.

On success the draft is marked `published`, `publishedUpdate` is set, and every
attached file gets `provider_metadata.faneqoGalleryStaged = false` so cleanup
can never reach it. Republishing the same draft returns the same gallery.

---

## 6. Editing contract and optimistic concurrency

`GET /api/artist-updates/:id/manage` is the **only** editing authority. The
public gallery payload is a fan read model and must never be used to seed an
editor.

`PATCH /api/artist-updates/:id/manage` carries `version`, compared against
`galleryVersion`. A mismatch is `409 version_conflict` and writes nothing. A
real change bumps `galleryVersion` by exactly 1; a no-op save does not bump it.

- `slug` never changes. Canonical URLs survive every edit.
- A gallery can never be saved to zero photos (`media_required`).
- Added ids must be staged media from the caller's own `sessionId`, with a
  classification matching the target visibility.
- Dropped ids lose the relation; bytes are deleted only after re-checking
  references across `artist-update.media`, `conversation-message.attachmentMedia`,
  and `conversation-message.attachmentGallery`.
- If the cover is dropped, the cover resolves to the new first ordered photo.
### Visibility: one rule, every surface

A published gallery **cannot cross public↔protected storage by relabelling**.
The bytes live in different stores, so the media has to be re-uploaded.

| Transition | Result |
| --- | --- |
| `public → fan_list` / `show_attendees` with public files | refused, `unsafe_visibility_transition` |
| `fan_list` / `show_attendees` → `public` with protected files | refused, `unsafe_visibility_transition` |
| `fan_list ↔ show_attendees` (both protected) | allowed |
| any transition on a gallery with no media yet | allowed |

Enforced in `evaluateVisibilityChange()`, so `PATCH /api/artist-updates/:id/manage`
and the older `PATCH /api/artist-updates/:id/visibility` now agree. The editor
and the dedicated audience control can no longer give different answers for the
same change.

---

## 7. Per-photo captions

`artist-update.mediaCaptions` is a JSON map `{ "<uploadFileId>": "caption" }` —
ordering-independent, so reordering photos never rewrites captions. Max 300
characters per caption; unknown ids are refused (`foreign_media`), blank
captions are dropped.

`serializeMedia` and `serializeUpdateMediaList` accept a `captions` map and set
`caption` on each MediaItem, for both public and protected files. The map flows
through `serializeViewerMedia`, so every read path gets it:
`getPublicGallery`, `getBySlug`, `getPublishedBySlug`, `listForBand`,
`listPublishedForRecap`, `listMine`, `listAccessibleByIds`.

Locked and gated viewers still receive `media: []` — `publicTeaser` strips the
whole list, so no caption can leak through a teaser.

---

## 8. Cleanup

One daily cron entry, `20 4 * * *`, calls `cleanupOrphans()`, which now does two
sweeps and returns combined counts.

**Sweep A — protected orphans** (unchanged): `provider = faneqo-protected`,
older than the 24h grace, unreferenced.

**Sweep B — staged gallery media** (`cleanupStagedGalleryMedia`): driven from
the draft side so candidates are positively identified.

1. `active` drafts with `lastActivityAt` older than **7 days** are marked
   `discarded`.
2. For stale and `discarded` drafts, each file in `mediaOrder` is considered
   only if `faneqoGalleryStaged === true`, `gallerySessionId` matches that
   draft, `uploaderUserId` matches the draft owner, and the file is older than
   the 24h grace.
3. References are re-checked immediately before delete.
4. Bytes and Upload row are deleted; individual failures are logged and skipped,
   never aborting the sweep.
5. The draft's `mediaOrder` is pruned so a repeat run is a no-op.

Batch is clamped to 40–80. Generic unreferenced Strapi uploads are **never**
touched. Logs carry counts and ids only — never urls, keys, filenames, or text.

---

## 9. Safe lifecycle logging

`[Faneqo Gallery Draft]` reason codes: `draft_started`, `draft_resumed`,
`audience_selected`, `audience_selected:refused`, `visibility_migration_cleared`,
`upload_started`, `upload_succeeded`, `upload_failed`, `publish_started`,
`publish_succeeded`, `publish_failed`, `draft_discarded`, `cleanup_examined`,
`cleanup_deleted`, `cleanup_skipped`.

`[Faneqo Artist Updates]` adds `edit_saved` and `visibility_migration_refused`.

Fields are ids, counts, classifications, and reason codes only.

---

## 10. HTTP surface

All gallery-draft routes are `auth: false` at the Strapi level and resolve the
JWT manually (same pattern as artist-update), then check `editBand`.

| Method | Path |
| --- | --- |
| POST | `/api/gallery-drafts` |
| GET | `/api/gallery-drafts/active` |
| GET | `/api/gallery-drafts/:sessionId` |
| PATCH | `/api/gallery-drafts/:sessionId` |
| PUT | `/api/gallery-drafts/:sessionId/audience` |
| POST | `/api/gallery-drafts/:sessionId/media` |
| GET | `/api/gallery-drafts/:sessionId/media/:mediaId` |
| DELETE | `/api/gallery-drafts/:sessionId/media/:mediaId` |
| POST | `/api/gallery-drafts/:sessionId/publish` |
| DELETE | `/api/gallery-drafts/:sessionId` |
| GET | `/api/artist-updates/:id/manage` |
| PATCH | `/api/artist-updates/:id/manage` |

`GET /api/show-recaps/my-recaps` gained a `search` query param (case-insensitive
match on city, venue, or showTitle) alongside `page` / `pageSize` (cap 50).

A foreign or unknown `sessionId` always answers `404 not_found`. Session
existence is never confirmed to a stranger.

Staged media responses never include S3 keys. `POST .../media` returns
`url: null` / `thumbUrl: null` for a protected upload, because protected bytes
have no public address.

A resumed draft still has to paint its grid, though, so every draft payload
carries a hydrated `media[]` alongside `mediaOrder`, and protected entries get
`thumbUrl` pointing at `GET /api/gallery-drafts/:sessionId/media/:mediaId`.
That proxy exists because a staged photo has no gallery to authorize against
yet — the session stands in as the authorization scope, so the only reader is
the session owner. There is deliberately **no** signed-token path here, unlike
the published-gallery proxy: a staged photo is never shared before it is
published, so nothing needs to reach a non-owner.

`GET /api/artist-updates/:id/manage` also returns `bandId` and `bandSlug`. The
editor needs `bandId` to open an upload session for added photos, and
`bandSlug` to build the canonical "view gallery" link without a second request.

---

## 11. HEIC / HEIF status

**HEIC/HEIF uploads are accepted and converted server-side.** Verified against
a real HEVC-coded file, not a renamed JPEG.

`scripts/check-heic-support.js` reports:

```
sharp 0.32.6 / libvips 8.14.5
sharp.format.heif.input.buffer: true                  <- container loader only
native heif round trip compression=hevc: FAILED (heifsave: Unsupported compression)
native sharp metadata of real HEIC: OK (1440x960)     <- container only, proves nothing
native sharp PIXEL decode of real HEIC: FAILED (Unsupported codec (4.3000))
heic-decode fallback: OK (1440x960, 458ms)
derivative: OK (webp 960x640)

HEIC (HEVC) decode: YES (via heic-decode WASM fallback)
```

### The two probes that lie

Both of these look like proof and are not:

- `sharp.format.heif.input.buffer === true` only means the HEIF *container*
  loader is compiled in. It says nothing about codecs.
- `sharp(heicBuffer).metadata()` **succeeds** on a real iPhone photo, because
  dimensions come from container boxes. The pixel decode is what fails, so any
  probe must force one — `.resize(16,16).raw().toBuffer()`.

This is why `toDecodableBuffer()` does **not** try sharp first and fall back.
A probe that reports success and then fails mid-pipeline is worse than none, so
anything that looks like HEIC goes straight to the WASM decoder.

### How it works

`src/utils/artistUpdates/heicDecode.js` decodes HEVC-in-HEIF with `heic-decode`
(pure WASM, no native build) and hands raw pixels to sharp, which then performs
orientation, resizing, and derivative generation exactly as it does for JPEG.

- Protected path: `processArtistUpdateImage()` normalizes before deriving webp.
- Public path: `normalizePublicUploadFile()` re-encodes to JPEG before the
  upload provider stores anything, so the CDN never holds a HEIC byte.

Two allowlists exist on purpose. `ALLOWED_UPLOAD_MIMES` includes HEIC/HEIF and
governs what may be *submitted*; `ALLOWED_IMAGE_MIMES` stays JPEG/PNG/WebP and
governs what may be *stored and authorized*. Conversion is what keeps the second
list true.

### Caveats

- Decoding a 12MP HEIC costs roughly 400–600ms of CPU and a full-size RGBA
  buffer. Only HEIC uploads pay it.
- No native dependency and no deploy-image change is required, so this works on
  Railway as-is. If libvips is ever rebuilt with `libde265`, the WASM step can
  be dropped.
- Fixture: `scripts/fixtures/sample-iphone.heic`, exercised by
  `scripts/test-protected-media.js`.

---

## 12. Schema changes and migrations

Strapi auto-syncs `schema.json`. No SQL migration is required, but the changes
are recorded here.

**New content type `api::gallery-draft.gallery-draft`** (table `gallery_drafts`).
`sessionId` is `unique`. All other columns are nullable or defaulted.

**`artist-update` gains three optional columns:**

| Column | Type | Default |
| --- | --- | --- |
| `coverMediaId` | integer | null |
| `mediaCaptions` | json | null |
| `galleryVersion` | integer | 0 |

### Backward compatibility

- All three new artist-update fields are optional. Existing rows read as
  `coverMediaId: null`, `mediaCaptions: {}`, `galleryVersion: 0`.
- `resolveCoverMediaId` falls back to the first ordered photo, so a legacy
  gallery with no stored cover still has one.
- `MAX_SHOW_IMAGES` kept its export name, so existing importers keep compiling.
- Existing publish, visibility, hide, restore, and detach endpoints are
  unchanged in shape and behavior.
- Legacy show galleries created under the 12-photo rule are untouched.

### Rollback

1. Revert the code. The new routes disappear; nothing else depends on them.
2. Leave `gallery_drafts` in place — it is staging-only and holds no canonical
   truth. Dropping it strands any staged bytes those sessions own, so if you do
   drop it, run `cleanupOrphans()` **first**.
3. The three artist-update columns can stay. They are additive and ignored by
   the previous code path.
4. Files already tagged `faneqoGalleryStaged: false` are ordinary attached
   media and behave exactly as before the change.

---

## 13. Required environment

Unchanged from protected media. Gated galleries need all of:

- `FANEQO_PROTECTED_MEDIA_ENABLED`
- `AWS_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_SECRET`
- `FANEQO_PROTECTED_MEDIA_SECRET` (or `JWT_SECRET`)

Public galleries need only the configured Strapi upload provider. When protected
delivery is not configured, gated audiences are refused — never downgraded.

---

## 14. Tests

```
node scripts/test-artist-updates.js
node scripts/test-protected-media.js
node scripts/test-gallery-visibility-contract.js
node scripts/test-public-night-share.js
node scripts/test-gallery-draft-lifecycle.js
node scripts/test-labs-boot-requires.js
node scripts/check-heic-support.js
```

The first five are wired into `npm run test:media`; the boot test into
`npm run test:boot`.
