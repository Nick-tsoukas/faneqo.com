# Living Gallery — handoff

Updated 2026-09-10. **Mobile + desktop final candidate — browser-verified; founder touch gate remaining.**

---

# CURRENT PHASE

Living Gallery specialist: **LIVING GALLERY MOBILE + DESKTOP — FINAL CANDIDATE / FOUNDER TOUCH GATE REMAINING.**
**Do not write COMPOSITION FROZEN or APPROVED V1.** That is the founder's, on a real phone (**LG-D025**).

Company-wide phase remains **Gallery Create / Edit**.

---

# JUST COMPLETED

A composition pass, not a tuning pass. The founder's judgment going in was that the Gallery had looked substantially the same for a long time despite many incremental changes.

**The Gallery Shelf.** A 3:2 frame can only ever cover about a third of a 390×844 screen, so the composition stopped centring the print in leftover space. It now reserves one block at the foot of the viewport — caption plate, contact sheet, action words — and the print rests on it. Every pixel of darkness the photograph cannot use pools into a **single** interval above it, and the caption always touches the photograph it names. Before this, phone landscape had ~278px of dead black above the print and ~306px below, in three unrelated bands. That was the "lightbox" read.

The reserve depends on the viewport and on the gallery, never on the open photograph, so the shelf does not move as you swipe between a portrait frame and a landscape one.

**Desktop, art-directed rather than scaled.** Landscape and square are hung prints with the label at the print's lower-left corner and the sequence position at its lower-right. A height-bound print with readable leftover width earns an editorial column, and the print plus its column are composed as one centred group with equal outer margins; the column's text block sits on the print's baseline like a museum label. Close moved into the display's own corner. Chrome, contact sheet and type all step up at 1920 and 2560.

**Two real defects found and fixed on the way:**

1. **Desktop portrait composition desync.** `editorialBias` was a gallery-wide boolean, but PhotoSwipe resolves padding **per item** — so on open, while the index was still on a landscape frame, the print was laid out with no column reserved while the chrome drew one, and the editorial type rendered on top of the photograph. The decision now lives in `earnsContextColumn()` and is derived from each photograph's own dimensions (**LG-D028**).
2. **Lab bookkeeping visible to a user.** `Homepage hero used only because no 2:3 concert asset exists.` was rendering as the caption in the desktop column and in Info (**LG-D032**).

Decisions recorded: **LG-D026** … **LG-D032**.

---

# WHERE THINGS STAND

Verified in the browser at 390×844, 430×932, 844×390, 1280×800, 1440×900, 1920×1080, 2560×1440 — 44 rendered shots, no console errors, 16 gallery test suites green.

Behaviour verified by script: continuity across three close paths plus a fourth open, shelf `y` unchanged across a swipe, Info never moving the print, exactly one active contact-sheet frame, the active frame always inside the sheet, `Tab` landing on Close, chrome persisting where the shelf is reserved and still receding on a phone held sideways.

**Touch feel remains unverified and cannot be verified here.** Synthetic pointer events do not reach PhotoSwipe's drag handler.

---

# NEXT STEP

The founder real-device gate in `FANEQO_LIVING_GALLERY_CURRENT_PHASE.md`. Eleven items, portrait and landscape, on a real phone. Item 11 is the judgment call: at arm's length in a dark room, does the shelf read as a designed foot to the photograph, or as a strip of controls?

If no P0/P1 comes back, the phase file becomes `COMPOSITION FROZEN` and production Gallery wiring is next — that is where the cold-cache open finally becomes measurable, since in production the deck print is already cached and `msrc` should be instant.

---

# WHAT NOT TO DO

Do not re-centre the print in its available box — that is the change this pass exists to undo (**LG-D026**).
Do not reintroduce a gallery-wide `editorialBias`; a single flag cannot describe a mixed gallery (**LG-D028**).
Do not make the shelf depend on the active photograph (**LG-D027**).
Do not put icons back under the action words, or float the index in the top-right (**LG-D029**).
Do not restore the timed chrome fade where the shelf is reserved (**LG-D030**).
Do not upscale fixtures to flatter desktop, and do not use `foxy.jpg` or `descartesakant.jpg` as squares (**LG-D032**).
Do not touch PhotoSwipe physics config without a real-device defect proving it (**LG-D001**).

---

# FILES

Composition and presentation:

- `features/gallery-experience/core/photoComposition.js` — `handShelf`, `desktopShelf`, `earnsContextColumn`, `resolvePhotoComposition`
- `features/gallery-experience/living-gallery/livingGalleryEditorialStage.js` — plate / column / rail residency
- `features/gallery-experience/living-gallery/LivingGalleryDock.vue` — the shelf: plate → sheet → words
- `features/gallery-experience/living-gallery/LivingGalleryWord.vue` — new; the word control
- `features/gallery-experience/living-gallery/LivingGalleryStageIdentity.vue` — the editorial column
- `features/gallery-experience/living-gallery/LivingGalleryChrome.vue` — close only; index removed
- `features/gallery-experience/living-gallery/livingGallery.css`
- `features/gallery-experience/living-gallery/LivingGalleryViewer.client.vue` — idle-hide condition, composition inputs
- `features/gallery-experience/living-gallery/LivingGalleryAdapter.js` — `hasSheet`, `editorialBias` tri-state
- `features/gallery-experience/living-gallery/livingGalleryThumbnails.js` — arithmetic sheet scroll
- `features/gallery-experience/living-gallery/livingGalleryContext.js` — `livingGalleryPlate`
- `features/gallery-experience/fixtures/compositionMatrix.js` — honest captions and real square

Lab and evidence:

- `features/gallery-experience/lab/GalleryExperienceLab.vue` — `applyQueryState()`, lab-only, drives capture
- `.visual-review/living-gallery/capture.mjs` — 44-shot harness (gitignored)
- `.visual-review/living-gallery/continuity.mjs` — behaviour checks (gitignored)
- `.visual-review/living-gallery/pass-05-candidate/EVIDENCE.md`

---

# IMPROVEMENTS DISCOVERED — NOT IMPLEMENTED

Classified per the operating loop. Do not implement these automatically.

1. **A phone held sideways has no shelf, so the action words sit in the print's left margin and `Share` can touch the photograph's edge** (`m-side-landscape-844`). The row needs either a backing or a different placement at `vh < 620`. → **NEXT PHASE**
2. **A 16:9 frame on a 390×844 phone leaves ~350px of darkness above a 219px print** (`m-wide-390`) — the most extreme case of the shelf decision. Afterlight softens it, but the founder should judge whether it reads as matting or as emptiness. → **NEXT PHASE**, and explicitly a question for the touch gate.
3. **Desktop landscape leaves ~400px of black on each side at 1920** because the print is height-bound against a 178px bottom reserve. A shallower reserve would grow the print but crowd the sheet. → **LATER**, measure against real hi-res photography first.
4. **A two-line caption plus place line nearly fills the 72px plate reserve** at 390 (`m-portrait-390`); the caption is clamped to two lines, so it degrades safely, but production copy length is untested. → **LATER**
5. **`LivingGalleryThumbnails.vue` is now orphaned** — nothing imports it since the dock owns the sheet. Deleting it is correct but touches a file this pass did not need. → **DO NOW in the next session**, as a one-line cleanup, not silently.

---

# GIT

Nothing committed, pushed or deployed. No reset, restore, stash or clean. `.visual-review/` is gitignored working evidence. `qrserver` untouched.
