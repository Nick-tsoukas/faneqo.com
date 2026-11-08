# Living Gallery — current phase

Keep this file small.

Updated 2026-09-10.

This is the Living Gallery **specialist** now-board. It does **not** replace `docs/FANEQO_CURRENT_PHASE.md` (company phase: Gallery Create / Edit).

---

# LIVING GALLERY MOBILE + DESKTOP — FINAL CANDIDATE / FOUNDER TOUCH GATE REMAINING

One pass, both form factors. This is a composition change, not a tuning pass.

## Status

**NOT FROZEN. NOT APPROVED.**

Everything measurable in a browser passes on 390×844, 430×932, 844×390, 1280×800, 1440×900, 1920×1080 and 2560×1440. **Touch feel is unverified and cannot be verified here** — synthetic pointer events do not reach PhotoSwipe's drag handler. Only the founder, on a real phone, may write `COMPOSITION FROZEN` or `APPROVED V1`.

## The decision this pass made

**The Gallery Shelf.** A 3:2 frame can only ever cover about a third of a tall phone, so the composition stopped centring the print in leftover space and instead reserves one block at the foot — caption plate, contact sheet, action words — and rests the print on it. All the darkness the photograph cannot use pools into a **single** interval above it, and the caption always touches the photograph it names.

The reserve depends on the viewport and on the gallery, never on the open photograph, so nothing moves as you swipe. Full rationale: **LG-D026** … **LG-D032**.

## What is materially different from Pass 03

| | Before | Now |
| --- | --- | --- |
| Phone landscape 390×844 | print 390×260 with ~278px dead black above and ~306px below, in three unrelated bands | one interval above; print rests on its shelf |
| Phone 2:3 | ~585px tall | **572px** at 390 · **645px** full-bleed at 430 |
| Actions | 18px glyph + 9px all-caps caption | words: `Photos` · `Info` · `Share` |
| Sequence position | `05 / 08` floating top-right | in the caption plate, and in the column's foot |
| Contact sheet | selected-tab underline | grease-pencil ring, scrolls the active frame in |
| Desktop portrait | editorial type rendered **on top of** the photograph | print + column composed as one centred group |
| Desktop close | on the print's top-left corner | in the display's own corner |
| Desktop chrome | phone-sized at 1920/2560 | close 56px, sheet 66/92 (76/104 wide), stepped type |
| Chrome idle | faded after 2400ms, emptying the reserve | persists where the shelf is reserved; tap still clears |
| Square fixture | blur-padded fake square (`foxy.jpg`) | genuine `memory-c` 1023×1024 |
| Lab copy in product UI | `Homepage hero used only because…` in Info | product-voice captions only |

## Preserved on purpose

PhotoSwipe v5 physics and config (**LG-D001**) · the `LivingGalleryAdapter` boundary · object continuity infrastructure · the D6 source-restoration fix · zero movement on orientation change (**D3**, **D4**) · Afterlight B at `maxOpacity 0.38` (**§12** — no retuning, no defect found) · true image orientation, never cropped to fit · reduced-motion support · history / Back behaviour · the no-spinner loading architecture · the semantic composition resolver.

## Locked product values (pending freeze)

| Item | Value |
| --- | --- |
| Icon family | **Lucide** (`@lucide/vue`), shared with `faneqoIcons` |
| Icon size / stroke | **18px / 1.75** phone · **22px** close on desktop |
| Gallery glyphs | `X` only — actions are words (**LG-D029**) |
| Optical edge | **16px** (`--fq-lg-edge-x`); print edges via `--fq-lg-shelf-left/right` |
| Phone shelf (vh ≥ 720) | top **48** · gap **20** · plate **72** · sheet **76** · bar **56** |
| Phone shelf (620 ≤ vh < 720) | top **44** · gap **16** · plate **64** · sheet **0** · bar **56** |
| Phone on its side (vh < 620) | no shelf; chrome overlays and recedes on the idle |
| Desktop shelf | top **38/44** · bottom **178/196** · plate **52/58** · bar **58/62** (desktop / ultrawide) |
| Contact sheet | phone frame **46** · active **62** · track **76** · desktop **66/92** · ultrawide **76/104** |
| Editorial column | min **264** · max **420** · ≤ 24% of viewport width · gutter `clamp(5.5vw, 56, 112)` |
| Phone `ay` | **1** where the shelf is resident (the print rests on it) |
| Afterlight | **B** (`maxOpacity 0.38`) |
| Chrome idle / fade | **2400ms / 220ms**, overlay case only (**LG-D030**) |
| Open / close / zoom | **380 / 280 / 300ms** |

## Verified in the browser

- **Composition** at all seven viewports across seven aspect classes, plus one-photograph, 24-photograph, general, minimal and pure states. 44 rendered shots.
- **Continuity ×3.** Open → Close, Open → Escape, Open → browser Back, then a fourth open. Every time: `0` stale `data-gx-continuity`, the source print's opacity fingerprint back to its pre-open baseline, `.pswp` destroyed, doorway intact, reopen clean.
- **Geometry stability.** The shelf's `y` is identical before and after `ArrowRight`. Opening Info does not move or resize the print.
- **Contact sheet.** Exactly one active frame after selection; the active frame is inside the sheet's visible box even at 24 photographs.
- **Keyboard.** `Tab` lands on the Close control; `ArrowLeft` / `ArrowRight` change photograph; `Escape` closes.
- **Chrome persistence.** Held at 4.2s on 390×844 and 1440×900; still recedes on 844×390.
- **Console.** No errors in any capture or behaviour run.
- **Tests.** 16 gallery suites green, including `test-gallery-experience-lab.mjs`.

## Source limits, recorded not hidden

- No hi-res portrait Night photograph exists in the repo. Desktop portrait is judged on the 1000×1500 studio hero — honest to 1080p, soft at 1440p. **Do not AI-upscale.**
- Lab Night frames are ~910–1024px. Softness on large displays is **source debt**, not a composition defect.
- Cold-cache open still shows a short black gap before the placeholder decodes; in production the deck print is already cached, so `msrc` should be instant. **Unverified until the production Gallery is wired.**

## Founder real-device gate — the remaining work

On a real phone, portrait then landscape:

1. Open from the deck print — does the photograph arrive, or does the screen change?
2. Slow flick · fast flick · reverse mid-flick · edge resistance at the first and last photograph.
3. Pinch · edge pinch · pan while zoomed · double-tap.
4. **Swipe-down to close, and swipe-down then cancel.**
5. Tap to clear chrome, tap to bring it back.
6. Contact sheet: thumb-scroll it, select a frame, confirm nothing else moves.
7. `Info` open and closed — does the photograph stay perfectly still?
8. `Share` — sheet on iOS, clipboard fallback elsewhere.
9. Rotate both ways, twice.
10. Browser Back, then reopen.
11. The judgment call: at arm's length in a dark room, does the shelf read as a designed foot to the photograph, or as a strip of controls?

Record every touch defect. Do not hide one with animation.

## Explicitly out of scope

Gallery Archive directions · `/galleries` redesign · Enter the Night · Passport · homepage · production Gallery wiring · new atmospheric effects · PhotoSwipe physics changes unless a real-device defect proves a config repair is needed.

## How to continue

1. Founder: the gate above.
2. If no P0/P1: this file becomes `LIVING GALLERY MOBILE + DESKTOP V1 — COMPOSITION FROZEN`.
3. Then production Gallery wiring, which is where the cold-cache open finally becomes measurable.

Lab: `http://localhost:3000/__dev/gallery-experience` · Review `R`.
Evidence: `.visual-review/living-gallery/pass-05-candidate/` (gitignored) — see its `EVIDENCE.md`.
Tests: `node scripts/test-gallery-experience-lab.mjs` · `node scripts/test-labs-hub.mjs`.
Behaviour: `node .visual-review/living-gallery/continuity.mjs`.
