# Living Gallery — atomic outline

Full product ambition with stable IDs. **CURRENT_PHASE stays tiny.** This file may be large.

Updated 2026-09-09. Mobile V1 CANDIDATE (Slice 06). Slice 07 Info cleanup only. Doorway / Deck: `docs/gallery/memory-system/`.

Grounding: isolated lab `features/gallery-experience/` + historical `docs/FANEQO_GALLERY_EXPERIENCE_LAB_HANDOFF.md`. Do not treat code existence as visual approval.

Status: NOT STARTED · EXPLORING · IMPLEMENTED / NOT APPROVED · APPROVED V1 · DEFERRED · FRONTIER · REJECTED

If unknown: **UNKNOWN**. Emulation only: **EMULATED ONLY**.

---

## Atomic item schema

ID · NAME · PURPOSE · USER VALUE · STATUS · CURRENT IMPLEMENTATION · DESIGN INTENT · STATES · MOBILE · DESKTOP · INTERACTIONS · MOTION · ACCESSIBILITY · PERFORMANCE · DATA / DEPENDENCIES · KNOWN WEAKNESSES · QUALITY DEBT · APPROVED DECISIONS · OPEN QUESTIONS · FUTURE EXPANSION · FRONTIER IDEAS · BENCHMARK · EVIDENCE · NEXT ACTION

Not every atom needs every field filled today. Pilot depth: `LG-A-CLOSE.md`.

---

## Status reading for the lab as a whole

| Layer | Status |
| --- | --- |
| Headless engine (controller, capabilities, share, fullscreen, thumbs model, keyboard, events, source) | IMPLEMENTED / NOT APPROVED |
| Visible Living Gallery | IMPLEMENTED / NOT APPROVED |
| Visual language | NOT APPROVED (nothing APPROVED V1) |
| Real device | Not tested |
| Production Gallery wiring | DEFERRED (intentional) |
| Enter the Night | Separate product; FROZEN |
| Memory Deck | IMPLEMENTED / NOT APPROVED (see `docs/gallery/memory-system/`) |

---

# LG-ENT — Entry / Exit

**Purpose:** Open and close Living Gallery on the exact photograph, restore source focus, and keep the photograph feeling like one object.

**Open design questions:** What is the production doorway? How obvious is exit in Pure View? Deep-link return surface?

**Future:** Signature residue transition (FRONTIER). Stack print View Transition (OPEN debt).

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-ENT-01 | Gallery → Living Gallery | IMPLEMENTED / NOT APPROVED | Gallery Page front photo opens Living Gallery |
| LG-ENT-02 | Living Gallery → Gallery | IMPLEMENTED / NOT APPROVED | Close returns to the same Gallery Page / index |
| LG-ENT-03 | Exact selected index | IMPLEMENTED / NOT APPROVED | `open(list, index)` / PhotoSwipe `index` |
| LG-ENT-04 | Source bounds | IMPLEMENTED / NOT APPROVED | `getThumbBoundsFn` / `resolveThumbBounds`; quality unproven |
| LG-ENT-05 | Source focus restore | IMPLEMENTED / NOT APPROVED | `returnFocus` + controller focus; possible race (LG-QD-013) |
| LG-ENT-06 | No-source fallback | IMPLEMENTED / NOT APPROVED | Fade open when no thumb bounds |
| LG-ENT-07 | Gallery Page stack → Viewer | IMPLEMENTED / NOT APPROVED | Front card `sourceBounds` / `mediaId` / index |
| LG-ENT-08 | Deep-link exact photo | NOT STARTED | No canonical photo URLs in lab |

---

# LG-PHO — Photograph Presentation

**Purpose:** Present the active photograph as the product. Quality question for LG-PHO-01: **If every control disappears, is this photograph beautifully presented?**

**Open design questions:** Surround, alignment, starting scale, fidelity vs fixtures, B&W treatment.

**Future:** Content-aware composition (FRONTIER, LG-UG-11). Do not mark as implemented.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-PHO-01 | Active Photograph | IMPLEMENTED / NOT APPROVED | PhotoSwipe slide on `#000`; visual not approved |
| LG-PHO-02 | Landscape Photograph | IMPLEMENTED / NOT APPROVED | Composition class `landscape`; phone ~full width (emulated) |
| LG-PHO-03 | Portrait Photograph | IMPLEMENTED / NOT APPROVED | Phone 2:3 width-fill + optical ay 0.44; exact 2:3 in lab; 3:4/4:5 missing (LG-QD-016, LG-QD-022) |
| LG-PHO-04 | Square / Near-Square Photograph | IMPLEMENTED / NOT APPROVED | Class `square` when aspect ~0.92–1.12 |
| LG-PHO-05 | Black-and-White Photograph | EXPLORING | Lab fixture jump exists; no special B&W presentation language |
| LG-PHO-06 | High-Resolution Inspection | NOT STARTED / blocked by fixtures | Zoom exists; ~1024px files cannot prove desktop/hi-res (LG-QD-003) |
| LG-PHO-07 | Photograph Surround / Negative Space | IMPLEMENTED / NOT APPROVED | Pure black surround; padding from composition resolver |
| LG-PHO-08 | Optical Alignment | IMPLEMENTED / NOT APPROVED | Resolver places the contain-fit box; not visually accepted |
| LG-PHO-09 | Starting Zoom Scale | IMPLEMENTED / NOT APPROVED | `initialZoomLevel: 'fit'` |
| LG-PHO-10 | Image Fidelity | IMPLEMENTED / NOT APPROVED | No extra filters on the img; Stage off by default |
| LG-PHO-11 | Source-to-Viewer Continuity | EXPLORING | Bounds on open; continuity quality UNKNOWN (LG-QD-018) |

---

# LG-LAY — Responsive Composition

**Purpose:** Authored placement per device × photo orientation. Chrome on/off must **not** jump/reflow the photograph.

**Open design questions:** Authored layout per device × orientation. Safe areas. Chrome-visible vs hidden composition. Open to the signature design loop (LG-D025); founder approves.

**Future:** Subject / saliency / performer / horizon — **FRONTIER** (LG-TEC-10, LG-UG-11). Not in the resolver.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-LAY-01 | Mobile / Landscape Photo | IMPLEMENTED / NOT APPROVED | Emulated; ~full width |
| LG-LAY-02 | Mobile / Portrait Photo | IMPLEMENTED / NOT APPROVED | Emulated; width-limited; fixtures weak |
| LG-LAY-03 | Mobile / Square Photo | IMPLEMENTED / NOT APPROVED | Emulated |
| LG-LAY-04 | Phone Landscape Orientation | IMPLEMENTED / NOT APPROVED | Device class stays phone if shortest < 500 |
| LG-LAY-05 | Tablet Portrait | IMPLEMENTED / NOT APPROVED | Device class exists; visual UNKNOWN |
| LG-LAY-06 | Tablet Landscape | IMPLEMENTED / NOT APPROVED | Device class exists; visual UNKNOWN |
| LG-LAY-07 | Desktop / Landscape Photo | IMPLEMENTED / NOT APPROVED | 1024 fixtures stay 1024px (LG-QD-003, LG-QD-005) |
| LG-LAY-08 | Desktop / Portrait Photo | IMPLEMENTED / NOT APPROVED | Left-weighted editorial in resolver; not approved |
| LG-LAY-09 | Desktop / Square Photo | IMPLEMENTED / NOT APPROVED | Resolver; not approved |
| LG-LAY-10 | Ultrawide | IMPLEMENTED / NOT APPROVED | `vw >= 1680`; visual UNKNOWN |
| LG-LAY-11 | Safe Areas | IMPLEMENTED / NOT APPROVED | `readSafeInsets` + CSS `env()`; real-device UNKNOWN |
| LG-LAY-12 | Chrome-visible Composition | UNKNOWN / EXPLORING | Chrome is overlay (`pointer-events` / opacity); jump not proven absent |
| LG-LAY-13 | Chrome-hidden Composition | IMPLEMENTED / NOT APPROVED | Pure View = photo + black; the actual product look |

---

# LG-CHR — Chrome / Control Presentation

**Purpose:** Reveal capability without visual noise. **Controls appearing must not cause the photograph to jump or reflow unexpectedly.**

**Open design questions:** All current art-direction deliverables. Idle, pointer vs touch reveal, keyboard state.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-CHR-01 | Pure View | IMPLEMENTED / NOT APPROVED | Default: black + photo; chrome opacity 0 |
| LG-CHR-02 | Controls Visible | IMPLEMENTED / NOT APPROVED | Direct / Hierarchical / Doorway lab variants; Photos first |
| LG-CHR-03 | Contextual Auto-Hide | NOT STARTED | No idle timeout auto-hide |
| LG-CHR-04 | Desktop Control Composition | NOT STARTED | Same overlay as mobile; not art-directed |
| LG-CHR-05 | Mobile Control Composition | IMPLEMENTED / NOT APPROVED | Top-left close, top-right count, bottom meta |
| LG-CHR-06 | Idle State | NOT STARTED | UNKNOWN idle language |
| LG-CHR-07 | Pointer/Mouse Reveal | NOT STARTED | Tap/click toggle only |
| LG-CHR-08 | Touch Reveal | IMPLEMENTED / NOT APPROVED | Photograph tap → `toggleChrome` |
| LG-CHR-09 | Keyboard State | EXPLORING | Keys work; no designed keyboard chrome state |

Lab engine dock is **not** LG-CHR.

---

# LG-CTL — Control Atoms

**Purpose:** One control, one job. Visual geometry is **not** invented here.

Eventual states for every atom: idle, hover, focus, pressed, active, disabled (where meaningful), hidden, reduced-motion.

Also record eventually: mobile target, desktop target, safe-area, keyboard, SR label.

`LG-CTL-MORE` exists only if later justified.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-CTL-CLOSE | Close | IMPLEMENTED / NOT APPROVED | Deep record: `LG-A-CLOSE.md` |
| LG-CTL-PREV | Previous | IMPLEMENTED / NOT APPROVED | Swipe + ArrowLeft + controller; **no product button** (PS arrows hidden) |
| LG-CTL-NEXT | Next | IMPLEMENTED / NOT APPROVED | Swipe + ArrowRight + controller; no product button |
| LG-CTL-INDEX | Index | IMPLEMENTED / NOT APPROVED | Visible `01 / 07` (aria-hidden); live region separate |
| LG-CTL-ZOOM-IN | Zoom in | IMPLEMENTED / NOT APPROVED | Keyboard + / = ; pinch; lab dock; no product button |
| LG-CTL-ZOOM-OUT | Zoom out | IMPLEMENTED / NOT APPROVED | Keyboard - ; pinch; lab dock; no product button |
| LG-CTL-ZOOM-RESET | Zoom reset | IMPLEMENTED / NOT APPROVED | Keyboard 0 ; controller `resetZoom`; no product button |
| LG-CTL-INFO | Info | IMPLEMENTED / NOT APPROVED | Meta visible with chrome; controller has independent info flag |
| LG-CTL-SHARE | Share | EXPLORING | Headless share; **no product control**; lab URL (LG-QD-007) |
| LG-CTL-FULLSCREEN | Fullscreen | EXPLORING | Headless API; **no product control**; F/F11 not bound (LG-QD-008) |
| LG-CTL-THUMBNAILS | Thumbnails | EXPLORING | Controller + stub strip; **no product control** |
| LG-CTL-MORE | Overflow / more | IMPLEMENTED / NOT APPROVED | Doorway variant only; labeled More reveals Info + Share. Photos stays visible |

Disabled: prev/next at ends (`loop: false`, `canPrevious` / `canNext`). No visible disabled buttons yet.

---

# LG-NAV — Navigation

**Purpose:** Move between photographs without history spam and without wrapping unless product decides later.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-NAV-01 | Previous photograph | IMPLEMENTED / NOT APPROVED | Adapter / controller / swipe / keys |
| LG-NAV-02 | Next photograph | IMPLEMENTED / NOT APPROVED | Same |
| LG-NAV-03 | Go to index | IMPLEMENTED / NOT APPROVED | `goTo` / `selectThumbnail` |
| LG-NAV-04 | First / last | IMPLEMENTED / NOT APPROVED | Home / End on engine keyboard (not PhotoSwipe photo surface) |
| LG-NAV-05 | No wrap | IMPLEMENTED / NOT APPROVED | `loop: false` (LG-D013) — product UX not approved |
| LG-NAV-06 | No per-photo history | IMPLEMENTED / NOT APPROVED | Swipes do not push (LG-D014) |
| LG-NAV-07 | Random access | IMPLEMENTED / NOT APPROVED | Contact Sheet `goTo`; PhotoSwipe remains index truth |

---

# LG-THM — Thumbnail / Contact Sheet

**Purpose:** Potential flagship subsystem. Inspect the set, jump, keep the active print visible.

**Do not implement advanced ideas now.**

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-THM-01 | Thumbnail Atom | IMPLEMENTED / NOT APPROVED | Real photos; idle/active/pressed/focus/loading |
| LG-THM-02 | Active Thumbnail | IMPLEMENTED / NOT APPROVED | Full opacity + hairline; `aria-current` |
| LG-THM-03 | Neighbor Thumbnail | IMPLEMENTED / NOT APPROVED | Model marks ±2; eager decode neighbors |
| LG-THM-04 | Horizontal Contact Sheet | IMPLEMENTED / NOT APPROVED | Primary V1 candidate (LG-D020); consistent height + native width |
| LG-THM-05 | Mobile Contact Sheet | IMPLEMENTED / NOT APPROVED | Composed under imageRect; hidden by default |
| LG-THM-06 | Desktop Contact Sheet | NOT STARTED | Intentionally skipped this slice |
| LG-THM-07 | Selection | IMPLEMENTED / NOT APPROVED | `selectThumbnail` → `goTo`; continuity payload |
| LG-THM-08 | Scroll / Drag | IMPLEMENTED / NOT APPROVED | Native touch scroll; no custom drag |
| LG-THM-09 | Keyboard Navigation | IMPLEMENTED / NOT APPROVED | Arrows / Home / End / Enter / Escape hides sheet |
| LG-THM-10 | Ensure Active Visible | IMPLEMENTED / NOT APPROVED | `scrollSelectedThumbnailIntoView` |
| LG-THM-11 | Large Gallery Virtualization | FRONTIER / NOT STARTED | 24-image repeated set works without it |
| LG-THM-12 | Hover Preview | FRONTIER | Not built |
| LG-THM-13 | Scrub Interaction | FRONTIER | Not built |
| LG-THM-14 | Thumbnail → Main Photograph Continuity | EXPLORING | `thumbnailBounds` / element / mediaId / index hooks only |

---

# LG-ZOM — Zoom / Pan

**Purpose:** Inspect the photograph without fighting navigation.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-ZOM-01 | Fit / start scale | IMPLEMENTED / NOT APPROVED | `initialZoomLevel: 'fit'` |
| LG-ZOM-02 | Secondary zoom | IMPLEMENTED / NOT APPROVED | Adapter `secondaryZoomLevel` |
| LG-ZOM-03 | Max zoom | IMPLEMENTED / NOT APPROVED | Adapter `maxZoomLevel` |
| LG-ZOM-04 | Pan while zoomed | IMPLEMENTED / NOT APPROVED | PhotoSwipe; **not finger-tested** |
| LG-ZOM-05 | Double-tap zoom | UNKNOWN | PhotoSwipe default; not explicitly documented as product-tested |
| LG-ZOM-06 | Desktop wheel zoom | IMPLEMENTED / NOT APPROVED | `wheelToZoom: true` |
| LG-ZOM-07 | Zoom vs swipe conflict | UNKNOWN | Design intent: zoomed drag pans, not navigates — untested on device |

---

# LG-INF — Information / Metadata

**Purpose:** Truthful optional Gallery context. Do not invent photographer, venue, city, date, or relationship.

Relationship context is **DEFERRED / future** (examples: “You were there.” “Your third Night with Badflower.”). Not current implementation.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-INF-01 | Artist | IMPLEMENTED / NOT APPROVED | Fixture `BADFLOWER` |
| LG-INF-02 | Venue | IMPLEMENTED / NOT APPROVED | Shown only when present / show-linked |
| LG-INF-03 | City | IMPLEMENTED / NOT APPROVED | Shown only when present |
| LG-INF-04 | Date | IMPLEMENTED / NOT APPROVED | Shown only when present |
| LG-INF-05 | Photographer | NOT STARTED (data) | Slot exists; fixture empty (LG-QD-004) |
| LG-INF-06 | Image Index | IMPLEMENTED / NOT APPROVED | Visible count + live region |
| LG-INF-07 | Gallery Identity | IMPLEMENTED / NOT APPROVED | Title/caption first-class; general + minimal lab cases |
| LG-INF-08 | Night Identity | EXPLORING | Show-linked fixture still available; not required |
| LG-INF-09 | Relationship Context | DEFERRED | Do not implement now |

---

# LG-SHR — Sharing

**Purpose:** Share this photograph or this gallery without social SDKs.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-SHR-01 | Share current photograph | EXPLORING | Headless `shareCurrentPhoto`; URL is lab page |
| LG-SHR-02 | Share gallery | EXPLORING | Headless `shareGallery`; same URL limitation |
| LG-SHR-03 | Native Web Share | IMPLEMENTED / NOT APPROVED | `navigator.share` when available |
| LG-SHR-04 | Clipboard fallback | IMPLEMENTED / NOT APPROVED | `clipboard.writeText` |
| LG-SHR-05 | Deep link exact photo | NOT STARTED | Inject `resolvePhotoUrl` later; do not invent routes |
| LG-SHR-06 | Social preview / OG | FRONTIER / NOT STARTED | LG-UG-13 |
| LG-SHR-07 | Attribution preservation | NOT STARTED | No photographer in fixture |

---

# LG-FUL — Fullscreen

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-FUL-01 | Enter fullscreen | EXPLORING | API helper; no product control |
| LG-FUL-02 | Exit fullscreen | EXPLORING | Close exits fullscreen first |
| LG-FUL-03 | Capability detection | IMPLEMENTED / NOT APPROVED | `fullscreenEnabled` + not standalone |
| LG-FUL-04 | Desktop shortcut | NOT STARTED | F / F11 **not bound** (LG-D017) |
| LG-FUL-05 | PWA behavior | EXPLORING | `canFullscreen` false in standalone |
| LG-FUL-06 | Fullscreen state restoration | UNKNOWN | Not specified beyond exit-on-close |

---

# LG-MOT — Motion

**Purpose:** Choreograph UI without stealing photograph physics.

**Ownership (potential, not implemented as a stack):**

| Owner | Role |
| --- | --- |
| PhotoSwipe | Photograph physics (open/close zoom, swipe, pinch) |
| motion-v | Future UI choreography where useful — **not installed for this** |
| View Transition API | Object continuity where justified — **not used** |
| Three/WebGL | Specialized future presentation only — Stage preserved, off by default |

Do not implement motion in the current phase.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-MOT-01 | Viewer open | IMPLEMENTED / NOT APPROVED | Zoom-from-thumb or fade; reduced = fade |
| LG-MOT-02 | Viewer close | IMPLEMENTED / NOT APPROVED | Hide duration 260ms (140 reduced) |
| LG-MOT-03 | Chrome reveal | IMPLEMENTED / NOT APPROVED | Opacity 180ms |
| LG-MOT-04 | Chrome hide | IMPLEMENTED / NOT APPROVED | Same |
| LG-MOT-05 | Info reveal | EXPLORING | Tied to chrome visually today; controller flag independent |
| LG-MOT-06 | Contact sheet reveal | IMPLEMENTED / NOT APPROVED | Restrained motion-v emerge/recede; no bounce |
| LG-MOT-07 | Thumbnail selection | NOT STARTED | Instant `goTo` |
| LG-MOT-08 | Fullscreen transition | UNKNOWN | Browser native |
| LG-MOT-09 | Hover / focus | NOT STARTED | Close has focus-visible only |
| LG-MOT-10 | Loading transition | NOT STARTED | PhotoSwipe placeholder; not designed |
| LG-MOT-11 | Reduced motion | IMPLEMENTED / NOT APPROVED | Fade open/close; zoom anim 0; chrome fade still 180ms |
| LG-MOT-12 | Memory Residue | EXPERIMENT IMPLEMENTED / NOT APPROVED | GPU feedback decay; lab only; default off |

---

# LG-PHY — Interaction Physics

**Purpose:** Familiar, physical photograph handling. Distinguish **implemented mechanism** from **real-device validated quality**.

**Real-device validated: NO. Do not claim it.**

| ID | Name | Mechanism | Quality |
| --- | --- | --- | --- |
| LG-PHY-01 | Slow horizontal swipe | PhotoSwipe | EMULATED ONLY |
| LG-PHY-02 | Fast flick | PhotoSwipe | EMULATED ONLY |
| LG-PHY-03 | Direction reversal | PhotoSwipe | EMULATED ONLY |
| LG-PHY-04 | Edge resistance | PhotoSwipe (`loop: false`) | EMULATED ONLY |
| LG-PHY-05 | Pinch zoom | PhotoSwipe | EMULATED ONLY |
| LG-PHY-06 | Pan | PhotoSwipe | EMULATED ONLY |
| LG-PHY-07 | Double-tap zoom | PhotoSwipe default | UNKNOWN / EMULATED ONLY |
| LG-PHY-08 | Swipe-down close | `closeOnVerticalDrag` | EMULATED ONLY |
| LG-PHY-09 | Cancelled swipe-down close | PhotoSwipe | **Not tested** |
| LG-PHY-10 | Pinch close | `pinchToClose` | EMULATED ONLY |
| LG-PHY-11 | Mouse / desktop drag | PhotoSwipe | Emulated desktop; not approved |
| LG-PHY-12 | Wheel behavior | `wheelToZoom` | Emulated; product intent unapproved |
| LG-PHY-13 | Keyboard previous/next | PhotoSwipe + engine | Lab-tested in code tests; not a11y-QA’d as product |
| LG-PHY-14 | Back behavior | `#living-gallery` history | Architecture implemented; **Android/PWA unverified** |

All LG-PHY items: **IMPLEMENTED / NOT APPROVED** (mechanism) unless noted NOT TESTED.

---

# LG-MED — Media / Fidelity

**Purpose:** Honest derivatives. **One-candidate srcset is refused** (LG-D015). Do not emit a fake srcset.

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-MED-01 | thumbSrc | IMPLEMENTED / NOT APPROVED | Contract exists; lab often same file |
| LG-MED-02 | mediumSrc | IMPLEMENTED / NOT APPROVED | Contract exists |
| LG-MED-03 | fullSrc | IMPLEMENTED / NOT APPROVED | Contract exists |
| LG-MED-04 | intrinsic dimensions | IMPLEMENTED / NOT APPROVED | Fixture width/height |
| LG-MED-05 | srcset candidate contract | IMPLEMENTED / NOT APPROVED | Emit only if 2+ candidates |
| LG-MED-06 | preload | IMPLEMENTED / NOT APPROVED | `[1, 2]` |
| LG-MED-07 | decode | UNKNOWN | Relies on PhotoSwipe/browser |
| LG-MED-08 | zoom fidelity | BLOCKED by fixtures | Cannot prove |
| LG-MED-09 | high-DPI | UNKNOWN | Not measured |
| LG-MED-10 | derivative selection | EXPLORING | Contract ready; lab files ~1024 |
| LG-MED-11 | future original/master policy | FRONTIER | Not defined |

---

# LG-LOD — Loading / Failure

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-LOD-01 | Current image loading | EXPLORING | PhotoSwipe placeholder; PS preloader hidden |
| LG-LOD-02 | Neighbor loading | IMPLEMENTED / NOT APPROVED | Preload 1,2; no UI |
| LG-LOD-03 | Slow network | NOT STARTED | UNKNOWN |
| LG-LOD-04 | Failed image | EXPLORING | Restyled `.pswp__error-msg` only |
| LG-LOD-05 | Offline / PWA | NOT STARTED | UNKNOWN (do not re-enable broken SW fallback) |
| LG-LOD-06 | Missing photographer | IMPLEMENTED / NOT APPROVED | Credit omitted if empty |
| LG-LOD-07 | One-image gallery | UNKNOWN | `loop: false`; chrome/nav not designed for n=1 |
| LG-LOD-08 | Empty gallery | NOT STARTED | Lab has 7 |
| LG-LOD-09 | Large gallery | EXPLORING | Neighbor model for 30–60; no 100+ strategy |
| LG-LOD-10 | Missing high-resolution derivative | EXPLORING | Fit never exceeds 1; modest print on desktop |

---

# LG-PER — Performance

No invented numbers. All quality = **UNKNOWN** unless noted.

| ID | Name | Status | Notes |
| --- | --- | --- | --- |
| LG-PER-01 | First open | UNKNOWN | Mechanism: import PhotoSwipe + decode |
| LG-PER-02 | Neighbor decode | UNKNOWN | preload [1,2] |
| LG-PER-03 | Rapid swipe | UNKNOWN | Not finger-tested |
| LG-PER-04 | Zoom frame stability | UNKNOWN | |
| LG-PER-05 | Contact sheet performance | EXPLORING | thumb/medium src; lazy non-neighbors; 24-image set unvirtualized |
| LG-PER-06 | Memory use | UNKNOWN | |
| LG-PER-07 | Teardown | EXPLORING | Adapter destroy; Stage wrapper contract |
| LG-PER-08 | Reopen | EXPLORING | History `pushed` guard; not measured |
| LG-PER-09 | Orientation change | UNKNOWN | Resolver can recompute; not device-tested |
| LG-PER-10 | Midrange Android | UNKNOWN | Critical before release |
| LG-PER-11 | Large gallery 30–60 | EXPLORING | Design intent only |
| LG-PER-12 | Very large gallery 100+ | FRONTIER | Virtualization not started |

---

# LG-ACC — Accessibility

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-ACC-01 | Keyboard | IMPLEMENTED / NOT APPROVED | Map in `livingGalleryKeyboard.js` |
| LG-ACC-02 | Focus | EXPLORING | Lab `trapFocus: false` (LG-QD-011) |
| LG-ACC-03 | Live photograph index | IMPLEMENTED / NOT APPROVED | “Photograph 4 of 7” |
| LG-ACC-04 | Reduced motion | IMPLEMENTED / NOT APPROVED | Open/close fade; chrome still fades |
| LG-ACC-05 | Touch targets | EXPLORING | Close 48px; others undesigned |
| LG-ACC-06 | Contrast | EXPLORING | Type on black at ~0.55–0.72 alpha; **not approved** |
| LG-ACC-07 | Restore source focus | IMPLEMENTED / NOT APPROVED | Possible race |
| LG-ACC-08 | Thumbnail semantics | IMPLEMENTED / NOT APPROVED | listbox / option / aria-current |
| LG-ACC-09 | Fullscreen announcement | NOT STARTED | |
| LG-ACC-10 | Hidden chrome focus safety | IMPLEMENTED / NOT APPROVED | inert + aria-hidden + tabindex -1 |

---

# LG-PWA — Browser / PWA

| ID | Name | Status | Current truth |
| --- | --- | --- | --- |
| LG-PWA-01 | Browser Back | IMPLEMENTED / NOT APPROVED | Hash contract; desktop assumed |
| LG-PWA-02 | Android Back | EXPLORING | Intended; **NOT TESTED** |
| LG-PWA-03 | Installed PWA | EXPLORING | Fullscreen capability false; Back **NOT TESTED** |
| LG-PWA-04 | Orientation | EXPLORING | Resolver; **NOT TESTED** |
| LG-PWA-05 | iPhone Safari | EXPLORING | Hash + swipe-back **NOT TESTED** |
| LG-PWA-06 | Android Chrome | EXPLORING | **NOT TESTED** |
| LG-PWA-07 | Safe areas | IMPLEMENTED / NOT APPROVED | CSS env; **NOT TESTED** on device |
| LG-PWA-08 | Browser fullscreen differences | EXPLORING | Helper exists; untested matrix |
| LG-PWA-09 | History loops | MITIGATED IN LAB | `skipNextExit` / `pushed` guard; device UNKNOWN |
| LG-PWA-10 | Refresh / direct entry | NOT STARTED | Hash on refresh behavior UNKNOWN |

---

# LG-ANA — Analytics / Semantic Events

**Purpose:** Durable event names for a future subscriber. Not product telemetry.

Events in `livingGalleryEvents.js`: `gallery_open`, `gallery_close`, `photo_change`, `photo_zoom`, `thumbnail_open`, `thumbnail_close`, `photo_share`, `gallery_share`, `fullscreen_enter`, `fullscreen_exit`, `chrome_change`, `info_change`.

| ID | Name | Status |
| --- | --- | --- |
| LG-ANA-01 | Event vocabulary | IMPLEMENTED / NOT APPROVED |
| LG-ANA-02 | Product analytics sink | NOT STARTED / DEFERRED (LG-QD-015) |
| LG-ANA-03 | Do not use PhotoSwipe event names in product | APPROVED V1 (engineering) |

---

# LG-TEC — Experimental Technology

Record without activating. Code existence ≠ product approval.

| ID | Name | Status |
| --- | --- | --- |
| LG-TEC-01 | Three.js Stage | IMPLEMENTED / NOT APPROVED (experiment; default off) |
| LG-TEC-02 | WebGPU | FRONTIER |
| LG-TEC-03 | Spatial light field | FRONTIER (lab fields exist for Stage, not product) |
| LG-TEC-04 | Depth map | FRONTIER |
| LG-TEC-05 | Segmentation | FRONTIER |
| LG-TEC-06 | Relighting | FRONTIER |
| LG-TEC-07 | motion-v | FRONTIER (not a Living Gallery dependency) |
| LG-TEC-08 | WebCodecs | FRONTIER |
| LG-TEC-09 | Media intelligence | FRONTIER |
| LG-TEC-10 | Saliency / composition intelligence | FRONTIER |
| LG-TEC-11 | Kinetic Memory | FRONTIER (frozen) |
| LG-TEC-12 | Exposure remanence | FRONTIER |
| LG-TEC-13 | Hero GPU promotion | FRONTIER |
| LG-TEC-14 | Local AI / ONNX / WebGPU research | FRONTIER |
| LG-TEC-15 | Exposure Remanence GPU | EXPERIMENT IMPLEMENTED / NOT APPROVED | WebGL2 ping-pong; not product-approved |

---

# LG-UG — Unreasonably Good Opportunities

See `FANEQO_LIVING_GALLERY_FRONTIER.md`.

LG-UG-01…15 — all **FRONTIER**. Do not implement.

---

## Conflicts found (docs vs code vs older notes)

| Topic | Resolution |
| --- | --- |
| Older lab handoff said `docs/gallery/*` did not exist | This folder now exists (2026-09-09). Lab handoff remains historical engine truth. |
| Company CURRENT_PHASE is Gallery Create / Edit | The Living Gallery specialist phase is whatever `FANEQO_LIVING_GALLERY_CURRENT_PHASE.md` says today — do not restate it here. A specialist phase narrows the company phase; it never overrides it. |
| Fancybox benchmark “wins” | Emulated; not real-device. Physics = provisional tie. |
| Thumbnails “implemented” | Headless + stub only. Product contact sheet = absent. |
| GPU Stage “exists” | Experiment. Default product path is black. |

---

## Lab evidence paths (do not treat as production)

- Viewer: `features/gallery-experience/living-gallery/`
- Composition: `features/gallery-experience/core/photoComposition.js`
- Fixture: `features/gallery-experience/fixtures/basementEastNight.js`
- Benchmark: `features/gallery-experience/lab/BENCHMARK.md`
- Historical engine: `docs/FANEQO_GALLERY_EXPERIENCE_LAB_HANDOFF.md`
- Lab URL: `http://localhost:3000/__dev/gallery-experience` (`localhost`, not `127.0.0.1`)
