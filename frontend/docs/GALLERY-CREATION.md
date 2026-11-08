# Gallery creation and editing (frontend)

How an artist makes a gallery in Faneqo, and the rules the UI must keep true.
Backend contracts live in `qrserver`. This document is the frontend side only.

Surfaces:

- Create: `pages/galleries/new.vue` → `components/updates/ArtistUpdateComposer.vue`
- Edit: `pages/galleries/[id]/edit.vue`
- Archive: `pages/galleries/index.vue` → `components/galleries/FaneqoGalleryArchive.vue`
- Public: `pages/[bandSlug]/gallery/[gallerySlug].vue` → `components/nights/PublicGalleryExperience.vue`
- API wrapper: `composables/useGalleryDrafts.js`
- Queue engine: `utils/media/faneqoMedia.js` + `composables/useMediaUploadQueue.js`

## 60 photos, 8 MB each

`FANEQO_SHOW_MAX_IMAGES` and `FANEQO_UPDATE_MAX_IMAGES` are both 60. There is no
separate, smaller show-gallery ceiling any more: a night that produced 40 frames
is not a different kind of gallery from one that produced 8.

`FANEQO_IMAGE_MAX_BYTES` stays 8 MB per file, and accepted types stay JPEG, PNG
and WebP. `FANEQO_SHOW_TOO_MANY_COPY` is the single piece of copy for hitting the
ceiling: "Galleries can include up to 60 photos."

Direct-message attachments are unrelated and stay at `FANEQO_DM_MAX_IMAGES` (4).

## Audience defaults to Everyone

**Everyone is selected by default and already applied to a fresh draft**, so the
normal public-gallery case costs the artist no clicks. The default lives in real
state (`visibility = ref('public')`, `audienceConfirmed = ref(true)`,
`appliedVisibility = ref('public')`), not in a radio that merely looks checked.

Information order in the composer, top to bottom:

1. Context — what you are creating, which artist, which night
2. **Audience** — one quiet line, `Who can see these · Everyone · Change`
3. Gallery details — title (max 120, show galleries prefill a derived title)
   and caption (max 1200, optional, line breaks preserved)
4. Photos — picker, progress, review grid
5. Publish

A public photo and a gated photo are stored differently, so the draft's audience
is still what tells the server how to classify each upload. The client never
sends a classification.

### Changing it

**Change** expands the radios; **Done** applies via
`PUT /api/gallery-drafts/:sessionId/audience`.

Clearing staged photos is demanded only when the *storage class* actually
changes — `storageClassOf(public) !== storageClassOf(gated)`. Moving between two
gated audiences, or re-picking the same one, costs nothing. When the class does
cross, a confirmation explains that staged photos will be cleared, then
`setAudience({ visibility, confirmClear: true })` runs and the local queue is
emptied. Nothing is ever silently re-classified.

If `getDeliveryStatus()` reports protected delivery is not ready, the gated
options are disabled with honest copy. A gated choice the artist already
confirmed is **never** auto-flipped to public — the error is shown instead.

## Upload progress

Counts, not percentages. A byte percentage across three parallel uploads is a
guess, so the summary region reports selected / uploaded / uploading / failed
and `n of 60`. There is exactly one `aria-live="polite"` region for the whole
grid; per-item state is visible but not announced.

Available actions: Retry failed, Remove, Cancel remaining uploads, Add more
while capacity remains, Discard gallery.

Concurrency stays at `FANEQO_UPLOAD_CONCURRENCY` (3), enforced by the queue
engine, not the composer.

## Draft, resume, discard

Every gallery is built inside a **server-side draft session**. The client holds
only a `sessionId` pointer in `sessionStorage` — never image bytes, never the
draft itself. The server draft is the truth, so a refresh resumes exactly.

- Autosave: title, caption, `mediaOrder`, `mediaCaptions` and `coverMediaId` are
  debounced (800 ms) through `patchDraft`.
- On mount: `getActiveDraft`. If a draft with meaningful work exists, the artist
  chooses **Continue draft** or **Start fresh** (start fresh discards the old one).
- Leaving: `onBeforeRouteLeave` warns when there is unsaved meaningful work;
  `beforeunload` warns while uploads are in flight.
- **Discard gallery** calls `discardDraft` and deletes the staged files.

Retry never duplicates a success — the queue keys each item by a generation
counter, so a late async completion after a removal cannot resurrect the item.

Publish goes through `publishDraft(sessionId, { publishIdempotencyKey })`. The
key is minted once per composer mount, so a double-click or a network retry
returns the same published gallery rather than minting a second one.

## Cover, ordering, per-photo captions

The first ordered photo is the default cover. The Cover badge is unmistakable
(filled chip plus a ring on the frame), and every photo has a **Make cover**
action whose accessible name includes its position.

Ordering uses accessible **Move earlier** / **Move later** buttons. There is no
pointer drag: on a 60-item touch grid it competes with scrolling, and the
buttons are already keyboard-operable. Reordering works on stable `mediaId`
identity and never re-uploads.

Each photo takes an optional caption, max `FANEQO_PHOTO_CAPTION_MAX` (300),
keyed by `mediaId`. Captions flow through the canonical model
(`features/gallery-experience/canonical/galleryMediaModel.js`) to the public
viewer as `photo.caption`.

**Performance:** the management grid renders `thumbUrl` derivatives only. Once
the server returns a thumbnail the local blob URL is revoked, so a 60-photo
review grid never holds 60 decoded originals in memory, and no hidden
full-resolution viewer is mounted behind it.

## Editing a published gallery

`/galleries/:id/edit` is auth-guarded and loads through
`getManageGallery(id)` → `GET /api/artist-updates/:id/manage`. It never reads
the public payload, and it reuses the composer's sub-components rather than
duplicating the composer.

Editable: title, caption, per-photo captions, order, cover, visibility, remove
photos, and add photos up to 60 total (new uploads go through an edit-mode draft
session created with `{ updateId }`).

Saves send `version` for optimistic concurrency. On `409 version_conflict` the
page shows a "this gallery changed somewhere else — reload" state rather than
overwriting someone's work. A public→gated change that needs re-upload returns
`unsafe_visibility_transition` and is refused with honest copy.

**The canonical URL and slug never change.** There is no slug field on the form.

An abandoned edit session discards its draft on unmount, so staged-but-unsaved
uploads do not become orphan files.

## Canonical handoff

After publish, "View gallery" opens `/{bandSlug}/gallery/{gallerySlug}` using
the slugs from the publish response — never a guess. The message-composer return
paths (`utils/updates/galleryComposerReturn.js`, `utils/updates/composerGalleryHop.js`)
still attach the new gallery exactly once.

## Accessibility and mobile

- Every field has a real label; every icon-only control has a specific
  accessible name that includes the photo's position.
- One polite live region for counts. Errors carry an icon and text, never colour
  alone.
- Confirmation dialogs trap focus, restore it on close, lock background scroll
  through `utils/ui/overlayScrollLock.js`, close on Escape when not busy, and
  never close during irreversible work.
- Focus lands deliberately after a removal — the next photo's Remove button, or
  the publish button when the grid empties.
- 44×44 touch targets, `env(safe-area-inset-*)` padding, two readable columns at
  390 px, `prefers-reduced-motion` respected.

## Tests

```
node scripts/test-gallery-draft-composer.mjs
node scripts/test-gallery-edit-ui.mjs
node scripts/test-media-upload-queue.mjs
node scripts/test-gallery-composer.mjs
```

All four are registered under `npm run test:media`.
