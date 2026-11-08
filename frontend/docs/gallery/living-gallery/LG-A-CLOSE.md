# LG-CTL-CLOSE — Close

Pilot atomic record. **Do not redesign this button in this sprint.**

ID: `LG-CTL-CLOSE`  
System: LG-CTL (Control Atoms) · related: LG-ENT, LG-PHY, LG-ACC, LG-PWA, LG-MOT  
Updated: 2026-09-09

---

## PURPOSE

Leave Living Gallery and return to the surface that opened it, with the photograph treated as the same object where possible.

---

## USER VALUE

The viewer must be escapable without hunting. Close must feel inevitable: chrome button, Escape, Back, and (on touch) PhotoSwipe close gestures.

---

## STATUS

| Dimension | Status |
| --- | --- |
| Overall | **IMPLEMENTED / NOT APPROVED** |
| FUNCTION | Partial / mature in lab (several close paths exist) |
| VISUAL | **NOT APPROVED** |
| MOBILE | Mechanism present; **EMULATED ONLY** |
| DESKTOP | Mechanism present; visual language unapproved |
| INTERACTION | Multiple paths; real-device quality UNKNOWN |
| MOTION | PhotoSwipe hide animation; not art-directed |
| ACCESSIBILITY | Label + inert-when-hidden exist; product focus trap not decided |
| PERFORMANCE | UNKNOWN (no measurements) |
| REAL DEVICE | **Not tested** |
| BENCHMARK | Fancybox close-gesture “tie” is **provisional / emulated** |

Correct reading right now: **functionally partial-to-mature, visually not approved.** Do not pretend otherwise.

---

## CURRENT FUNCTIONAL IMPLEMENTATION

Evidence: `LivingGalleryViewer.client.vue`, `livingGallery.css`, `LivingGalleryAdapter.js`, `livingGalleryController.js`, `livingGalleryKeyboard.js`, `livingGalleryHistory.js`.

| Path | What exists |
| --- | --- |
| Chrome button | `<button class="fq-lg-chrome__close" aria-label="Close photograph">` — CSS × from two 11px strokes. Visible only when chrome is on (`is-on`). `pointer-events: none` until then. `tabindex="-1"` when chrome+info off. |
| Controller | `close()` → adapter `close()`; exits fullscreen first; `handleClosed` emits `gallery_close`. |
| PhotoSwipe UI | Default PhotoSwipe close button is **hidden** (`display: none !important` on `.pswp__button--close`). |
| Escape | PhotoSwipe `escKey: true`. Engine keyboard: Escape hides overlay first if thumbnails/info up, else closes. |
| Browser / Android Back | One `#living-gallery` history entry. `popstate` closes viewer. UI close uses `history.back()` only if Faneqo still owns the hash. **Architecture exists; Android/PWA unverified.** |
| Swipe-down | `closeOnVerticalDrag: true` (PhotoSwipe). Cancelled close **not tested**. |
| Pinch-close | `pinchToClose: true`. **Not real-device tested.** |
| Tap photograph | Does **not** close. `clickToCloseNonZoomable: false`. Tap toggles chrome. |
| Lab dock | Engine harness can close via controller. **Not product chrome.** |

PhotoSwipe default chrome is disabled (`close: false` in public UI options). Faneqo owns the visible Close control.

---

## CURRENT VISUAL STATUS

Unapproved lab × :

- 48×48px hit area, top-left
- 11×11px glyph, 1px strokes, `rgba(247, 249, 252, 0.72)`
- Transparent background, no disc, no blur
- `top/left` use `env(safe-area-inset-*)` with small max() floors
- `focus-visible` 1px outline, offset -8px
- Chrome fades 180ms opacity; the photograph is not supposed to reflow (chrome is overlay). **Not proven as a visual system.**

Do not treat this geometry as the design.

---

## MOBILE REQUIREMENTS (eventual — not approved geometry)

- Discoverable when chrome is visible; Pure View may hide it
- Thumb-reachable without covering the photograph’s subject (UNKNOWN until art direction)
- Safe-area aware (notch / home indicator)
- Must not require learning PhotoSwipe-only gestures (those are supplements)
- 390px canonical canvas

---

## DESKTOP REQUIREMENTS (eventual — not approved geometry)

- Mouse discoverable (idle / hover / pointer reveal still art-directed)
- Keyboard: Escape remains a close
- Must not look like a leaked mobile hit-target unless design chooses that
- Desktop composition: Close must not shove the photograph (`LG-CHR` rule)

---

## SAFE AREA

Current: `top: max(0.1rem, env(safe-area-inset-top))`, `left: max(0.05rem, env(safe-area-inset-left))`.

UNKNOWN whether this is enough on iPhone Safari / Android gesture nav / installed PWA. Not real-device tested.

---

## MINIMUM TARGET

Current hit area: **48×48px**. Glyph is 11px. Whether 48 is the product minimum is **not decided**. Do not invent a final size.

---

## STATES

| State | Current | Needed eventually |
| --- | --- | --- |
| idle | Semi-transparent × when chrome on | Designed idle |
| hover | **UNKNOWN** / none obvious | Desktop hover |
| focus | `focus-visible` outline | Designed focus |
| pressed | **UNKNOWN** | Pressed |
| active | N/A (not a toggle) | — |
| disabled | N/A while open | — |
| hidden | Chrome off: invisible, `inert`, `aria-hidden` on chrome root, `tabindex="-1"` | Must remain unfocusable |
| chrome-hidden | Same as hidden | Pure View |
| reduced-motion | PhotoSwipe open/close uses fade when reduced; chrome opacity still 180ms | Confirm chrome fade vs instant |

---

## INPUTS

| Input | Current |
| --- | --- |
| touch | Button when chrome on; swipe-down / pinch-close via PhotoSwipe |
| mouse | Click button; no designed hover |
| Escape | Closes (or dismisses overlay first) |
| browser Back | Closes via hash history (desktop) — **emulated / assumed** |
| Android Back | Intended via same history contract — **NOT TESTED** |
| swipe-down relationship | PhotoSwipe `closeOnVerticalDrag` — quality UNKNOWN |
| pinch-close relationship | PhotoSwipe `pinchToClose` — quality UNKNOWN |

Do not claim these feel as good as Fancybox on a phone.

---

## ACCESSIBILITY

| Topic | Current |
| --- | --- |
| label | `aria-label="Close photograph"` |
| focus | Tabindex 0 only when chrome on |
| screen reader | Label present; live region is photograph index, not “closed” announcement — UNKNOWN if close needs an announcement |
| focus restoration | PhotoSwipe `returnFocus: true` + controller focuses `sourceElement` after close. **Possible race (LG-QD-013).** |
| hidden chrome | `inert` + `aria-hidden` on chrome root when off |

`trapFocus` is **false** in the lab (LG-QD-011). Do not copy blindly into product.

---

## MOTION

**Current behavior:** PhotoSwipe `showHideAnimationType` zoom-from-thumb when bounds exist, else fade. Reduced motion: fade, shorter durations. Chrome opacity 180ms ease.

**Future design questions:**

- Should Close participate in object-continuity (the photo returns to the thumbnail)?
- Should the × fade with chrome or stay independently discoverable?
- Is 180ms chrome fade too slow / too UI-like?
- View Transition API vs PhotoSwipe zoom — UNKNOWN, FRONTIER-adjacent (`LG-MOT`)

Do not implement motion in the art-direction phase.

---

## OBJECT CONTINUITY

Close is the return half of `LG-ENT-02` / `LG-PHO-11` / `LG-UG-01`.

Current: hide animation + `returnFocus` / source element. Source bounds used on **open** (`getThumbBoundsFn`). Close-to-source visual continuity quality is **UNKNOWN / not proven** (LG-QD-018).

Lab source is often the print button, not a production Gallery thumbnail.

---

## FANCYBOX BENCHMARK

From `lab/BENCHMARK.md` (emulated only):

| Criterion | Notes |
| --- | --- |
| discoverability | Faneqo Close is hidden until tap-reveal. Fancybox typically shows a persistent close. Restraint may win *or* hide the exit. **Not decided.** |
| speed | UNKNOWN. No timings. |
| predictability | Multiple close paths exist; cancelled swipe-down not tested. |
| visual quality | Faneqo × is quieter; **not approved**. |

Close-gesture row in the benchmark is a **provisional tie**.

---

## KNOWN WEAKNESSES

- Visual language unapproved (LG-QD-001)
- Hidden until chrome reveal — may fail discoverability vs Fancybox
- Tiny glyph vs large hit area may feel accidental
- No hover/pressed design
- Real-device Back / swipe-down / pinch-close unproven (LG-QD-002)
- Focus restore race possible (LG-QD-013)
- Lab trapFocus false
- Close does not announce itself to SR beyond disappearing
- Production source focus (Gallery Stack) not in lab (LG-QD-009)

---

## QUALITY DEBT

LG-QD-001, LG-QD-002, LG-QD-009, LG-QD-011, LG-QD-013, LG-QD-018

---

## OPEN ART-DIRECTION QUESTIONS

1. Is Close visible in Pure View, or only in Controls Visible?
2. Top-left vs top-right vs edge affordance vs none (gesture-only)?
3. Disc / no disc / type (“Close”) / icon-only?
4. How does it sit on landscape vs portrait vs desktop editorial?
5. Does chrome appearance move or reflow the photograph? (Must not.)
6. What is the desktop hover language?
7. How loud is focus?
8. Relationship to swipe-down: complement or duplicate?

These are art-direction questions, not engineering ones. Answer them through the signature design loop (explore, render, independent critic pass) — not by quietly picking a value mid-implementation. Founder approval still closes them (LG-D025).

---

## FUTURE EXPANSION

- Confirm overlay-first Escape (thumbnails/info) as product, not just engine
- Close from fullscreen vs close viewer (controller already exits fullscreen first)
- Deep-link entry: Close should still have a sensible return surface (`LG-PWA-10`)

---

## FRONTIER IDEAS

- Close as the inverse of Continuous Photograph (LG-UG-01 / LG-UG-12)
- Haptic on close — UNKNOWN, likely REJECT unless earned
- Pinch-close as a signature — only if real-device proves it

---

## NEXT ACTION

**Not implementation.** Art-direct Close inside:

- Mobile landscape — Controls Visible
- Mobile portrait — Controls Visible
- Desktop landscape / portrait

Keep Pure View in mind: if Close is absent, other exit paths must still be obvious enough.

When implementation is explicitly requested, implement the approved Close only — do not restyle neighboring chrome “while you are there.”
