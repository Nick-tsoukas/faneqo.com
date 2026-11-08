# FANEQO GALLERY EXPERIENCE LAB — HANDOFF

Updated 2026-09-09. **Engine substrate sprint.** Isolated lab. Not production Gallery.

> **HISTORICAL — engine reference only.** Every phase, scope, ownership, and STOP statement below is superseded by `docs/gallery/living-gallery/FANEQO_LIVING_GALLERY_CURRENT_PHASE.md` and `docs/FANEQO_CURRENT_PHASE.md`. In particular, the external Framer/Stitch art-direction model recorded here was retired by **LG-D025** (agent art-directs, independent Visual Critic judges, founder approves). Read this file for how the engine works, not for what to do next.

This slice prepared a headless viewer engine so an approved design can bind later without rebuilding PhotoSwipe logic. It did **not** redesign Living Gallery, Galleries Home, or Enter the Night.

Read it before changing engine internals, PhotoSwipe wiring, or `/labs/gallery-experience`.

This does **not** replace:

1. `docs/FANEQO_DESIGN_NORTH_STAR.md`
2. `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`
3. `docs/FANEQO_CURRENT_PHASE.md`
4. `docs/FANEQO_NEXT_AGENT_HANDOFF.md`

Product phase remains **Gallery Create / Edit**. Production Gallery files stay **LOCKED**. Enter the Night stays **FROZEN**. Fancybox is still a benchmark, not a dependency. Do not install it.

Historical note: this file was written when `docs/gallery/*` did not exist. Canonical Living Gallery **product map** now lives at `docs/gallery/living-gallery/` (start: `README.md`). This handoff remains **implementation truth** for the isolated lab/engine. It does not grant visual approval.

---

## CURRENT PHASE

Living Gallery lab: **HEADLESS ENGINE READY** on top of Brief 03 **BLACK RESET**.

Default presentation is still pure `#000`. GPU Stage remains off unless Tune selects CSS/GPU.

**STOP for design review.** Do not implement a Framer visual. Do not add shaders, lighting, depth, or atmosphere. Do not unfreeze Enter the Night. Do not wire production Gallery.

---

## ARCHITECTURE CHANGES

```
Future approved UI
    ↓
LivingGalleryController     (state, actions, capabilities, events)
    ↓
LivingGalleryAdapter        (PhotoSwipe only)
    ↓
PhotoSwipe v5.4.4
```

Parallel, not on the UI path:

- History: `#living-gallery` one entry
- Share / Fullscreen / Keyboard / Thumbnails / Source contracts
- Stage renderer: `init / resize / setMedia / setProgress / suspend / resume / destroy`
- PhotographicStage now talks to `createStageRenderer()` (same GPU path, no new shaders)

Vue `LivingGalleryViewer` is a thin host: adapter + controller + existing black chrome + a **plain** development thumbnail strip. Future chrome should call `controller.*`, not `pswp.*`.

---

## CONTROLLER / ACTION API

`createLivingGalleryController` in `living-gallery/livingGalleryController.js`.

Actions (no styling):

| Action | Role |
| --- | --- |
| `open(list, index, context)` | Open. Context may include `source`, `night`. |
| `close()` | Close viewer; exits fullscreen first. |
| `previous` / `next` / `goTo(index)` | Navigate. No history push. |
| `showChrome` / `hideChrome` / `toggleChrome` | Chrome flag |
| `showInfo` / `hideInfo` / `toggleInfo` | Info flag (independent of chrome) |
| `openThumbnails` / `closeThumbnails` / `toggleThumbnails` | Contact sheet |
| `zoomIn` / `zoomOut` / `resetZoom` | Via adapter → PhotoSwipe `zoomTo` |
| `shareCurrentPhoto` / `shareGallery` | Native share or clipboard |
| `enterFullscreen` / `exitFullscreen` / `toggleFullscreen` | Fullscreen API |
| `handleKeydown(event, surface)` | `photo` \| `chrome` \| `thumbnails` |
| `selectThumbnail(index)` | `goTo` + later animation hook via source bounds |
| `getState()` / `subscribe` / `subscribeEvents` | Snapshot + listeners |

Current tap on the photograph still `toggleChrome` only. Info and thumbnails are available to future UI / the lab harness.

---

## CAPABILITY API

`deriveLivingGalleryCapabilities(state, env)`:

`canPrevious`, `canNext`, `canZoom`, `canPan`, `canFullscreen`, `canShare`, `canUseNativeShare`, `canShowThumbnails`, `isZoomed`, `isFullscreen`, `isTouch`, `reducedMotion`, `isStandalone`.

No UI decisions. Standalone PWA → `canFullscreen` is false even if the API exists.

---

## THUMBNAIL SYSTEM

`livingGalleryThumbnails.js` + plain `LivingGalleryThumbnails.vue` (48px strip, not a design).

- Items: id, src (`thumbSrc` or `src`), optional srcset if 2+ candidates, selected, neighbor (±2)
- Random access: `selectThumbnail` → `goTo`
- Keyboard on the sheet: arrows / Home / End / Enter / Escape (Escape hides sheet, does not close viewer)
- `scrollSelectedThumbnailIntoView`
- `data-gx-thumb` + `resolveThumbBounds` for a later thumbnail→photo animation
- `neighborIndices(index, total, 1, 2)` matches PhotoSwipe `preload: [1, 2]` for 30–60 images

Do not art-direct this strip. Framer owns the contact sheet.

---

## SHARE BEHAVIOR

`livingGalleryShare.js`

1. `navigator.share` when available
2. `clipboard.writeText(url)` fallback
3. No social SDKs

Lab has **no canonical Gallery URLs**. Default URL is `origin + pathname + search` (hash stripped). `resolveGalleryUrl` / `resolvePhotoUrl` can be injected later. Do not invent Night/Gallery production paths.

---

## FULLSCREEN BEHAVIOR

`createLivingGalleryFullscreen`

- Capability: `document.fullscreenEnabled` and not `display-mode: standalone` / iOS `navigator.standalone`
- `enter` / `exit` / `toggle` + `fullscreenchange`
- No control design. F / F11 are **not** bound (browser find / browser fullscreen).

---

## KEYBOARD

Documented in `livingGalleryKeyboard.js`.

| Key | Photograph surface (PhotoSwipe) | Engine / chrome |
| --- | --- | --- |
| Escape | close viewer | hide overlay if one is up, else close |
| ArrowLeft / ArrowRight | previous / next | same, unless thumbnails focused |
| Home / End | — | first / last |
| + / = | — | zoom in |
| - | — | zoom out |
| 0 | — | reset zoom |
| F / F11 | not bound | not bound |

PhotoSwipe still owns Escape/Arrows on the image so we do not double-step. Thumbnail sheet `stop`s its own keydown.

---

## ACCESSIBILITY

- Live region: `Photograph 4 of 7` (`.fq-lg-live`, visually hidden, `aria-live="polite"`)
- Close remains labelled; `tabindex="-1"` + `inert` / `aria-hidden` when chrome+info off
- Thumbnail listbox / option / `aria-current`
- `returnFocus: true` on PhotoSwipe + controller focuses `sourceElement` after close
- `trapFocus` still **false** in the lab so Tune / engine dock remain usable
- Reduced motion unchanged (fade open/close, no instant dump)

---

## HISTORY

Unchanged successful contract:

```
Lab surface → open → pushState { fqLivingGallery: true } + #living-gallery
Back / Android Back → popstate → close viewer → remain on Faneqo
UI close → history.back() only if we still own the hash
popstate close → skipNextExit (no second back)
Photo swipes do not push
```

Controller `handleOpened` / `handleClosed` own enter/exit so Vue cannot double-push.

**Needs real-device validation:** Android Chrome back, installed PWA back, iOS Safari hash + swipe-back. Do not claim those work.

Repeated open/close: `pushed` guard + hash check. No per-photo history.

---

## FUTURE SOURCE-OBJECT HOOKS

`normalizeOpenSource` / `resolveThumbBounds`:

```
sourceElement
sourceBounds { x, y, w, h? }
sourceMediaId
sourceGalleryId
sourceIndex
```

Lab launch passes `sourceGalleryId: 'lab:basement-east'` and the print button as `sourceElement`. Lookup order: explicit bounds → source element → `[data-gx-thumb]` → `[data-gx-print]`.

Memory Deck is **not** built. Production Stack is **not** touched.

---

## MEDIA / PRELOAD CHANGES

Still: `thumbSrc`, `mediumSrc`, `fullSrc`, intrinsic w/h, `srcsetCandidates` (emit srcset only if 2+).

Adapter `preload: [1, 2]`. `getResourceSnapshot()` reports `decoded` / `cached` / `total` from PhotoSwipe `contentLoader` (does not decode the whole gallery).

No backend work. No upscale of ~1024 fixtures.

---

## STAGE PRESERVATION STATUS

| Piece | Status |
| --- | --- |
| Default Review | **BLACK**. No canvas. |
| `createGpuStage` | Kept. No new shaders/meshes. |
| `createStageRenderer` | New contract wrapper. |
| `PhotographicStage` | Uses the wrapper. Default path never inits it. |
| Tune Black / CSS / GPU | Unchanged |

Do not delete Three.js.

---

## DESIGN HARNESS

Lab page (`GalleryExperienceLab.vue`):

- Fixture jumps: Landscape / Portrait / Square / B&W
- Viewport **targets listed**, not simulated (browser chrome cannot be resized by the page)
- While viewer is open (and not Review): plain top dock to toggle chrome / info / thumbnails / zoom / share / fullscreen
- Metrics (optional): open/closed, slide, t, zoom, decoded count, thumbs, fullscreen, fps, renderer

None of this is product chrome.

---

## TESTS

```
node scripts/test-gallery-experience-lab.mjs   ok
node scripts/test-labs-hub.mjs                 ok
```

New coverage: capabilities, neighbors, source, share native+clipboard, keyboard map, controller open/nav/chrome/thumbs/zoom/close/events, stage renderer contract, viewer/controller wiring, Enter the Night still isolated, production Gallery still isolated.

---

## REMAINING RISKS

- **REAL DEVICE NOT TESTED** — Back/PWA, pinch, share sheet, fullscreen vs standalone
- Engine dock sits above PhotoSwipe (z-index 100061). It is a lab tool. Approved UI must not copy it.
- `trapFocus: false` is a lab compromise
- Share URL is the lab page, not a Night
- Thumbnail strip is a development stub; replacing it is expected
- PhotoSwipe `contentLoader` internals for decoded counts could change
- Focus restore may race PhotoSwipe `returnFocus`
- Controller `open()` also `handleOpened` if the adapter does not fire `onOpen` (headless). Viewer path uses adapter `onOpen` only.

---

## FILES CHANGED

Engine (this slice):

```
features/gallery-experience/living-gallery/livingGalleryController.js
features/gallery-experience/living-gallery/livingGalleryEvents.js
features/gallery-experience/living-gallery/livingGalleryCapabilities.js
features/gallery-experience/living-gallery/livingGalleryShare.js
features/gallery-experience/living-gallery/livingGalleryFullscreen.js
features/gallery-experience/living-gallery/livingGallerySource.js
features/gallery-experience/living-gallery/livingGalleryThumbnails.js
features/gallery-experience/living-gallery/livingGalleryKeyboard.js
features/gallery-experience/living-gallery/LivingGalleryThumbnails.vue
features/gallery-experience/living-gallery/LivingGalleryAdapter.js
features/gallery-experience/living-gallery/LivingGalleryViewer.client.vue
features/gallery-experience/living-gallery/livingGallery.css
features/gallery-experience/stage/stageRenderer.js
features/gallery-experience/stage/PhotographicStage.client.vue
features/gallery-experience/lab/GalleryExperienceLab.vue
features/gallery-experience/lab/LabMetrics.vue
features/gallery-experience/index.js
scripts/test-gallery-experience-lab.mjs
docs/FANEQO_GALLERY_EXPERIENCE_LAB_HANDOFF.md
```

**Not modified:** Enter the Night, `FaneqoGalleryStack.vue`, `FaneqoMediaLightbox.vue`, `NightGalleryViewer.vue`, `PublicGalleryExperience.vue`, `stackOpenNavigation.js`.

---

## DEPENDENCIES

Unchanged: `photoswipe@^5.4.4`, `three@^0.170.0` (Stage only). No Fancybox, GSAP, Tres, Pixi, motion-v choreography.

---

## GIT STATUS --SHORT

Frontend HEAD: `c38570c6`

```
M  components/labs/LabsExperienceHub.vue
M  components/labs/LabsShell.vue
M  config/labsExperienceHub.js
M  package.json
M  package-lock.json
M  scripts/test-labs-hub.mjs
?? docs/FANEQO_GALLERY_EXPERIENCE_LAB_HANDOFF.md
?? features/gallery-experience/
?? pages/labs/gallery-experience.vue
?? pages/__dev/gallery-experience.vue
?? public/labs/gallery-experience/
?? scripts/test-gallery-experience-lab.mjs
```

Unrelated dirty work (account, billing, auth docs) remains. Do not include it in a Gallery commit. Nothing pushed. No commit this slice.

---

## HOW TO OPEN THE LAB

```
http://localhost:3000/__dev/gallery-experience
```

Use `localhost`, not `127.0.0.1`. Review: **R**. Tune while open: **D**. Engine dock appears while the viewer is open (not in Review).

```
node scripts/test-gallery-experience-lab.mjs
node scripts/test-labs-hub.mjs
```

---

## PRODUCTION GALLERY (DO NOT TOUCH)

```
FaneqoGalleryStack → stackOpenNavigation → FaneqoMediaLightbox
```

```
Future UI → LivingGalleryController → LivingGalleryAdapter → PhotoSwipe
```

---

## FANEQO

The Gallery should disappear. The photograph should remain. The engine should be ready when the photograph’s frame is designed.
