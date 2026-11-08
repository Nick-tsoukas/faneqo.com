# Living Gallery — decision register

Locked product and engineering choices. Visual presentation is **not** locked.

Updated 2026-09-09.

Status vocabulary: NOT STARTED · EXPLORING · IMPLEMENTED / NOT APPROVED · APPROVED V1 · DEFERRED · FRONTIER · REJECTED

---

## LG-D001 — PhotoSwipe selected as image-physics foundation

**Decision:** PhotoSwipe v5.4.4 owns photograph physics (swipe, pinch, pan, zoom, vertical-drag close, pinch close, fit/secondary/max zoom).

**Why:** Mature, familiar lightbox physics. Faneqo should not invent a second gesture engine.

**Implications:** Future UI calls `LivingGalleryController`, not `pswp.*`. Default PhotoSwipe chrome is hidden. Fancybox is not installed.

**Rejected alternatives:** Fancybox as a dependency. Custom gesture engine. GPU Stage as the image physics layer.

**Status:** APPROVED V1 (engineering foundation). Visual product is not approved.

**Date:** 2026-09 (lab). Evidence: `LivingGalleryAdapter.js`, `package.json`.

---

## LG-D002 — Fancybox is benchmark, not dependency

**Decision:** Fancybox is a quality checklist only. Do not install it.

**Why:** Beat a mature lightbox on feel. Do not become a Fancybox skin.

**Implications:** Compare open, swipe, pinch, pan, close, composition, chrome restraint, Back. Do not copy Fancybox chrome.

**Rejected alternatives:** Installing Fancybox. Claiming a win without real-device evidence.

**Status:** APPROVED V1 (process). Benchmark results are **EMULATED ONLY**.

**Date:** 2026-09. Evidence: `features/gallery-experience/lab/BENCHMARK.md`.

---

## LG-D003 — Pure black is visual baseline

**Decision:** Default surround is `#000`. No canvas on the default Review path.

**Why:** Photography first. Color and atmosphere are guilty until approved.

**Implications:** GPU/CSS Stage remain behind Tune. Do not treat Stage as the product look.

**Rejected alternatives:** Default atmospheric Stage. Gradient/vignette as the baseline.

**Status:** APPROVED V1 (baseline). Current chrome on that black field is **not** approved.

**Date:** 2026-09 Brief 03.

---

## LG-D004 — Enter the Night remains a separate product experience

**Decision:** Living Gallery = see the photographs. Enter the Night = relive the Night.

**Why:** Spectacle and memory-cinema must not contaminate inspection.

**Implications:** Enter the Night stays frozen. Do not merge the two UIs.

**Rejected alternatives:** One cinematic viewer that tries to do both jobs.

**Status:** APPROVED V1 (product distinction).

**Date:** 2026-09.

---

## LG-D005 — Photography outranks effects

**Decision:** Effects, depth, relighting, and GPU atmosphere must earn visible photographic value.

**Why:** North star is live-music photography, not a demo reel.

**Implications:** Frozen: depth, relighting, segmentation, Kinetic Memory, Auto-Direct, new shaders.

**Rejected alternatives:** Shipping Stage as the Living Gallery identity.

**Status:** APPROVED V1.

---

## LG-D006 — Maximum capability / minimum visual noise

**Decision:** The engine may be extremely capable. The default view may contain almost nothing.

**Why:** Capability without noise is the Faneqo test.

**Implications:** Headless controller exists. Visible chrome must be designed, then revealed — not always on.

**Rejected alternatives:** Dashboard-like viewer chrome. Copying the lab engine dock into product.

**Status:** APPROVED V1 (principle). Visible chrome: IMPLEMENTED / NOT APPROVED.

---

## LG-D007 — Coding agent does not own art direction

**Decision:** Founder + ChatGPT + Framer + Stitch own visual direction in the current phase. Coding agents do not invent the look.

**Why:** Existing visible Living Gallery is not approved. Agent-as-art-director produced substrate, not a locked visual language.

**Implications:** CURRENT_PHASE is Visual Art Direction. Code only when explicitly requested (headless) or when implementing an approved slice.

**Rejected alternatives:** Coding agent iterating visible chrome until it “looks expensive.”

**Status:** **SUPERSEDED by LG-D025** (2026-09-10). Kept as history.

**Date:** 2026-09-09.

---

## LG-D008 — Mobile PWA is canonical

**Decision:** Phone / installed PWA quality is the canonical product. 390px remains the Faneqo canvas.

**Why:** Faneqo is mobile-first. Desktop is real, not leftover.

**Implications:** Real-device Android Back, iPhone Safari, and installed PWA are required before any “feels better than Fancybox” claim.

**Rejected alternatives:** Desktop-only validation. Treating emulation as phone physics.

**Status:** APPROVED V1 (principle). REAL DEVICE: not validated.

---

## LG-D009 — Desktop receives its own photographic composition

**Decision:** Desktop landscape, portrait, square, and ultrawide each need authored composition. Desktop is not a blown-up phone.

**Why:** Editorial photography on a monitor is a different object than a phone fill.

**Implications:** Composition resolver exists (`photoComposition.js`). Current ~1024px fixtures cannot honestly fill 1920. Visual approval is still pending.

**Rejected alternatives:** Single max-width lightbox for all breakpoints.

**Status:** APPROVED V1 (principle). Visual: IMPLEMENTED / NOT APPROVED.

---

## LG-D010 — Advanced technology must earn visible value

**Decision:** Three.js, WebGPU, depth, saliency, local AI, and similar tech stay off the default product path until they make the photograph more true.

**Why:** LG-P07. Code existence is not product approval.

**Implications:** Stage experiment preserved. Most LG-TEC items are FRONTIER.

**Rejected alternatives:** Shipping GPU Stage as Living Gallery v1 identity.

**Status:** APPROVED V1.

---

## LG-D011 — Current GPU/Stage experiment is preserved but not product-approved

**Decision:** Keep Three.js Stage code. Default is black. Tune may still select CSS/GPU in the lab.

**Why:** Expensive to rediscover. Must not be deleted. Must not become the look.

**Implications:** `createGpuStage` / `PhotographicStage` / `createStageRenderer` remain. Do not add shaders in this phase.

**Rejected alternatives:** Deleting Stage. Making Stage the default Review look.

**Status:** IMPLEMENTED / NOT APPROVED (experiment). Product: DEFERRED / FRONTIER.

**Date:** 2026-09.

---

## LG-D012 — Future Gallery doorway / Memory Deck may exist, but Living Gallery is the current active product focus

**Decision:** Continuous-photograph principle is real. Memory Deck is not current work. Production Gallery wiring is not current work.

**Why:** Relentless decomposition. Narrow execution.

**Implications:** Source-object hooks exist (`sourceElement`, bounds, ids, index). Memory Deck remains FRONTIER. Production Stack stays LOCKED.

**Rejected alternatives:** Building Memory Deck because the continuity principle exists. Wiring Living Gallery into `FaneqoGalleryStack` during art direction.

**Status:** APPROVED V1 (scope). Memory Deck: FRONTIER.

---

## Additional recorded engineering decisions (not visual)

| ID | Decision | Status |
| --- | --- | --- |
| LG-D013 | `loop: false` — galleries do not wrap | IMPLEMENTED / NOT APPROVED as product UX; mechanism exists |
| LG-D014 | Photo swipes do not push history; one `#living-gallery` entry | IMPLEMENTED / NOT APPROVED (architecture); real-device unverified |
| LG-D015 | Emit srcset only when 2+ candidates exist | APPROVED V1 (technical lesson) |
| LG-D016 | Tap on photograph toggles chrome; `clickToCloseNonZoomable: false` | IMPLEMENTED / NOT APPROVED (interaction) |
| LG-D017 | F / F11 are not bound (browser find / browser fullscreen) | IMPLEMENTED / NOT APPROVED; product shortcut unresolved |
| LG-D018 | Isolated lab; production Gallery files not touched | APPROVED V1 (safety) |

---

## LG-D019 — Flexible Gallery Context

**Decision:** Living Gallery supports both show-linked and general artist Galleries. Venue, city, and date are optional. Gallery title/caption are first-class context. UI never fabricates missing show context.

**Why:** Living Gallery is an artist photographic memory system, not a concert-only viewer. Most Galleries may come from nights; many will not.

**Implications:** Presentation adapter (`livingGalleryContext.js`) is UI-facing only. Do not couple chrome/Info to Event fields. Do not render unknown venue/city/date or empty separators. Long captions belong in Info, not Pure View.

**Rejected alternatives:** Requiring a show/event for every Gallery. Placeholder location copy. Treating venue as the only identity line.

**Status:** APPROVED V1 (product rule). Visible treatment: IMPLEMENTED / NOT APPROVED.

**Date:** 2026-09-09. Evidence: Slice 04 lab fixtures + `livingGalleryContext.js`.

---

## LG-D020 — Horizontal Contact Sheet is the primary V1 candidate

**Decision:** Sheet A (horizontal photographic rail, consistent height + native-aspect width) is the current primary mobile Contact Sheet. Sheet B (micro-grid) is a DEFERRED expanded-navigation experiment.

**Why:** The rail keeps the rest of the Gallery nearby without turning Photos-open into a second page. The grid is useful later, not as an equal product system.

**Implications:** Default lab/product path is the rail. Do not spend this phase art-directing the grid. Cropped cells remain a lab compare only.

**Status:** IMPLEMENTED / NOT APPROVED (visual). Scope decision is locked for this phase.

**Date:** 2026-09-09. Evidence: Slice 05.

---

## LG-D021 — Opaque lower shelf under imageRect

**Decision:** Everything beneath `imageRect.bottom` visually resolves against opaque `#000`. A dedicated lower matte sits above PhotoSwipe/residue and below chrome/sheet.

**Why:** Landscape Photos-open read as two image bars when the active print continued behind a transparent shelf.

**Implications:** Do not rely on sheet transparency. Residue is clipped to the photograph. Chrome still does not change `imageRect`.

**Rejected alternatives:** Leaving the shelf transparent. Painting a second copy of the photograph under controls.

**Status:** IMPLEMENTED / NOT APPROVED (visual). Mechanism locked for this candidate.

**Date:** 2026-09-09. Evidence: Slice 06.

---

## LG-D022 — MORE / Doorway chrome deprecated

**Decision:** Product chrome is `PHOTOS` + Info + Share. Hierarchical (Photos as a word, quieter icons) is the default. Direct remains a lab compare (icon Photos). Doorway / MORE is deprecated.

**Why:** Founder does not love MORE. Important actions must be direct. No mystery ellipsis.

**Implications:** Do not rebuild a toolbar. Photos stays most prominent. Info and Share stay quieter and labeled.

**Rejected alternatives:** MORE as the path to Info/Share. Ellipsis-only chrome.

**Status:** IMPLEMENTED / NOT APPROVED (visual). MORE: REJECTED as product chrome.

**Date:** 2026-09-09. Evidence: Slice 06.

---

## LG-D023 — Memory Residue signature is Exposure (MR-B)

**Decision:** One signature direction: **MR-B Exposure**. MR-A Retinal remains a fast supporting compare. MR-C Chemical remains experimental, not rejected. Default is **off**.

**Why:** The goal is one photographic afterimage, not three shipped modes. Exposure keeps stage-light energy without reading as a glitch shader.

**Implications:** Fast navigation always wins (skip / shorten / terminate, never queue). Reduced motion disables the effect. GPU sleeps when idle. WebGPU remains a future path.

**Rejected alternatives:** Shipping A/B/C as product modes. CSS-only fade as the experiment. RGB-split / fire / psychedelia.

**Status:** EXPERIMENT IMPLEMENTED / NOT APPROVED. Not product default.

**Date:** 2026-09-09. Evidence: Slice 06.

---

## LG-D024 — Info expands the memory

**Decision:** Expanded Info does not restate Artist / Venue / Date already represented in chrome. When Info is open, identity chrome yields. Groups: story (title/caption) → place → photographer if real.

**Why:** Founder screenshot showed cramped restatement. Info should deepen the memory.

**Implications:** `omitVisible` skips chrome-already-shown fields. `replaceChrome` is the Info-open expansion. Never invent photographer.

**Status:** IMPLEMENTED / NOT APPROVED

**Date:** 2026-09-09. Evidence: Slice 07.

---

## LG-D025 — Agent art-directs; independent critic judges; founder approves

**Decision:** Agents may art-direct Living Gallery presentation using `.cursor/skills/faneqo-ui-director/SKILL.md`. Quality is established by rendered evidence plus an independent read-only pass from `.cursor/agents/faneqo-visual-critic.md`. **APPROVED V1 / COMPOSITION FROZEN remains a founder decision, on a real phone for gestural behavior.**

**Why:** Waiting on external design tooling stalled the surface, and the Mobile V1 quality pass (icons, dock, chrome choreography, Info clamp) was in fact agent-directed and useful. The real risk was never agents designing — it was agents *certifying themselves*. That is what the critic gate closes.

**Implications:** No agent writes APPROVED V1 or COMPOSITION FROZEN. Self-critique never replaces the independent pass. Evidence convention and loop: `docs/FANEQO_CURSOR_OPERATING_SYSTEM.md`. Locked compositions still only reopen on a real defect.

**Rejected alternatives:** Keeping LG-D007 (blocks legitimate design work). Letting the implementing agent declare a surface signature-quality (no calibration).

**Status:** APPROVED V1 (process). Supersedes **LG-D007**.

**Date:** 2026-09-10.

---

## LG-D026 — The Gallery Shelf: the composition reserves the space its chrome needs

**Decision:** On a phone (and on desktop) the composition reserves one block at the foot of the viewport — caption plate, contact sheet, action row — and the print is laid out inside the remaining box. The print **rests on** the shelf, so every pixel of darkness the photograph cannot use pools into a single interval above it.

**Why:** A 3:2 frame can only ever cover about a third of a 390×844 screen. The old composition centred the print optically and left three unrelated bands of black — above the print, between the print and its identity lines, and between those and the controls. Three intervals read as accident; one reads as matting. Resting the print on the shelf also guarantees the caption always touches the photograph it names.

**Implications:** `handShelf()` and `desktopShelf()` in `core/photoComposition.js` own the reserve. `resolvePhotoComposition` returns `shelf`, `shelfHeight` and `railResident`. Phone `ay` becomes `1` whenever the shelf is resident, so the lab's optical control has nothing left to move on a 2:3 print — that is arithmetic, not a regression.

**Rejected alternatives:** Letting the plate travel with the print (jitters on every swipe). Reserving nothing and overlaying chrome (what made it read as a lightbox).

**Status:** IMPLEMENTED / NOT APPROVED. Founder touch gate outstanding.

**Date:** 2026-09-10.

---

## LG-D027 — The reserve is derived from the viewport and the gallery, never from the open photograph

**Decision:** Shelf geometry depends only on viewport size, device class and whether the gallery has more than one photograph. It never depends on the active frame's aspect ratio or on chrome visibility. The shelf absorbs the system safe-area insets rather than stacking a second reserve on top of them.

**Why:** Anything derived from the active photograph moves as you swipe. The earlier per-orientation desktop reserve moved the whole shelf when you went from a landscape frame to a portrait one. Gallery length is a property of the gallery, so keying the contact-sheet reserve off it is still stable.

**Implications:** `hasSheet` is plumbed through `LivingGalleryAdapter` so PhotoSwipe's `paddingFn` and the chrome agree. A gallery of one reserves no sheet and shows no `Photos` word and no index. `chromeOn` is deliberately passed as `false` to the composition — chrome visibility must never change geometry.

**Status:** IMPLEMENTED / NOT APPROVED.

**Date:** 2026-09-10.

---

## LG-D028 — An editorial column is earned by the photograph, not requested by the gallery

**Decision:** On desktop, a column is earned when the print is height-bound and its leftover width can hold a readable measure. Landscape never earns one. The caller may only pass `null` (each photograph decides) or `false` (context off) — there is no "force column" value.

**Why:** `editorialBias` used to be a gallery-wide boolean computed from the active memory. PhotoSwipe resolves padding **per item**, so on open — while the index was still on a landscape frame — the print was laid out with no column reserved while the chrome drew one, and the editorial type landed on top of the photograph. A single flag cannot describe a mixed gallery.

**Implications:** `earnsContextColumn()` in `core/photoComposition.js` is the only decision point. The print and its column are composed as one centred group with a fixed gutter; outer margins come out equal. The column's text block sits on the print's baseline, where a label sits under a hung photograph.

**Status:** IMPLEMENTED / NOT APPROVED.

**Date:** 2026-09-10.

---

## LG-D029 — Gallery actions are words

**Decision:** `Photos` · `Info` · `Share` are set as words (`LivingGalleryWord.vue`), left-aligned on the print's own edge. `Photos` is absent where the contact sheet is already resident, and absent from a gallery of one. The floating `NN / NN` index is gone from the top-right; the sequence position lives in the caption plate and in the editorial column's foot.

**Why:** An 18px glyph with a 9px tracked all-caps caption beneath it is the signature of a system photo viewer, and it needed two elements to say one thing. A lone count in the upper-right corner of a photograph is a heads-up display. Type can carry a control, and a number belongs beside the words it qualifies.

**Implications:** Supersedes the Photos glyph choice recorded in the Pass-03 phase notes; `GalleryThumbnails` is no longer used in the dock. Close remains a glyph — it is the one control with a universal mark. A permanently greyed word is worse than no word, so disabled states are removed rather than dimmed.

**Rejected alternatives:** Keeping icon + caption (generic). Icons alone (two of three were not self-evident).

**Status:** IMPLEMENTED / NOT APPROVED.

**Date:** 2026-09-10.

---

## LG-D030 — Chrome recedes on a timer only where it covers the photograph

**Decision:** Where the composition reserved a shelf, chrome does not fade on the 2400ms idle. A deliberate tap still clears the screen. Where there is no shelf — a phone held on its side, viewport height under 620px — chrome overlays the print and the timed recede is kept.

**Why:** The timer existed so controls would not sit on the photograph. Once the shelf is part of the layout, fading it leaves roughly two hundred pixels of unexplained black under the print a few seconds after every open. Reserved space that empties itself is worse than no reserve.

**Implications:** `armIdleHide()` returns early when `composition.shelfHeight > 0`. `CHROME_IDLE_MS` (2400ms) and `CHROME_FADE_MS` (220ms) are unchanged and still govern the overlay case and the manual toggle. Chrome visibility still never affects geometry.

**Status:** IMPLEMENTED / NOT APPROVED. Reopens **the 2400ms always-on idle** recorded in the Pass-03 locked values.

**Date:** 2026-09-10.

---

## LG-D031 — The contact sheet is marked like a contact sheet

**Decision:** The active frame carries a grease-pencil ring (1px inset outline) rather than a bottom underline. Frames keep native aspect ratios on a fixed-height track, read from the first frame, and the sheet scrolls the active frame into view on its first render.

**Why:** An underline under the selected frame is tab language; the sheet is a strip of prints, not a navigation bar. The ring is what a photographer's mark on a physical contact sheet looks like. The sheet is resident on a tall phone, so it is already open on its first render — the earlier scroll watcher waited for a toggle that never fired and left the active frame off the end of the strip.

**Implications:** `scrollSelectedThumbnailIntoView` positions by arithmetic on `scrollLeft`; `scrollIntoView` walked ancestors and could nudge the fixed viewer. Fixed track height and "no movement on orientation change" (**D3**, **D4**) are preserved.

**Status:** IMPLEMENTED / NOT APPROVED.

**Date:** 2026-09-10.

---

## LG-D032 — Lab fixtures carry product copy and real geometry

**Decision:** No lab bookkeeping may appear in a surface a fan can see. Fixture captions are written as editorial copy; the reason an asset stands in for an aspect class lives in the lab slot note only. Square is judged on a genuine square frame.

**Why:** `Homepage hero used only because no 2:3 concert asset exists.` was rendering as the caption in the desktop editorial column and in Info. An empty caption is just as dishonest a test: it hides how the composition behaves once real words arrive. `foxy.jpg` and `descartesakant.jpg` are 2048×2048 only because a 16:9 and a portrait frame were padded to square with a blurred copy of themselves — those bars render inside the print and read as a bug.

**Implications:** `hires-square` points at `memory-c` (1023×1024, genuine). `hires-square-b` is removed. Source limits are recorded in `fixtures/compositionMatrix.js` and in the evidence manifest rather than hidden. Nothing was upscaled.

**Status:** IMPLEMENTED / NOT APPROVED.

**Date:** 2026-09-10.

---

## Recorded: MOBILE = PRODUCT TRUTH

Already canonical as **LG-D008**. Desktop Contact Sheet remains unbuilt.
