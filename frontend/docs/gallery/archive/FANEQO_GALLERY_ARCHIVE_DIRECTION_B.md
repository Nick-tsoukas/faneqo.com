# Gallery Archive lab — DIRECTION B: TOUR CONTACT SHEET

Lab-only exploration. Nothing here is product truth yet.

**Route:** `/__dev/gallery-archive-b?state=<state>` (dev only, `noindex`, throws 404 outside `import.meta.dev`)
**Status:** proposal, awaiting founder review. Direction A (`/__dev/gallery-archive-v3`) is untouched and neither direction has been chosen.

Everything below is **this direction's answer, not the lab's default**. A later direction may inherit the fixtures, lab mechanics and shared read-only utils, but not the proof-sheet composition, the native-ratio strip geometry, the sticky tour index or the density-driven hierarchy — see [the lab README](./README.md).

Production `/galleries`, `FaneqoGalleryArchive.vue`, `FaneqoNightShelf.vue`, `FaneqoGalleryArchiveItem.vue`, `FaneqoGalleryStack.vue`, Living Gallery, PhotoSwipe, the backend, and Gallery schemas are all **untouched**. This direction reads the same item shape `/galleries` already renders and reuses `utils/galleries/archiveShelves.js` for grouping. It imports nothing from `direction-a/` — the contract test enforces that.

---

## Thesis

**The tour, as it was printed.**

Not a journal of Nights — a working sheet of photography with the tour stamped across it. The page is one continuous proof sheet: a Night is a stamped strip, not a chapter, and the reading rhythm is horizontal and dense rather than vertical and narrative. Where Direction A gives a Night a page, Direction B gives it a run of prints.

Four rules carry the direction:

1. **A frame's width comes from its own photograph.** Every frame in a strip shares one height, and each one's width is that height times its native ratio. A landscape gallery is physically wider than a portrait gallery, so orientation — not a column count — decides how many galleries land in a strip. Nothing is normalised into a box.
2. **Hierarchy is the strip, not the card.** A Night's opening strip holds a fixed, small number of frames across the full measure (1 on mobile, 3 at 1080+, 4 at 1600+), so it prints tall; everything after it wraps into denser runs. The Night opens big and proves itself underneath.
3. **The spine is an index, not a calendar.** Desktop carries a sticky tour index down the left edge — date, city, year printed only when it turns — that tracks the sheet as it scrolls. Mobile drops the rail and sticks each Night's stamp instead. No grid of months, no date pickers, no empty days.
4. **A sheet is allowed to be part-used, but a Night is never a leftover.** A Night that wraps keeps its closing strip at strip height, with the unused measure left as air. A Night that never fills a strip has no slack to absorb, so its one or two galleries print large instead of shrinking into an orphan row.

---

## Files

| File | Job |
| --- | --- |
| `pages/__dev/gallery-archive-b.vue` | Lab route + fixture state rail |
| `features/gallery-archive/direction-b/TourContactSheet.vue` | Printed masthead, tour index, sheet, states |
| `features/gallery-archive/direction-b/ContactBand.vue` | One Night as a stamped strip of the sheet |
| `features/gallery-archive/direction-b/ContactPrint.vue` | Gallery Stack wrapper + frame annotation |
| `features/gallery-archive/direction-b/contactSheet.js` | Pure sheet geometry, stamps, tally, index, totals |
| `features/gallery-archive/direction-b/fixtures.js` | Its own tour-scale fixture matrix |
| `scripts/test-gallery-archive-direction-b.mjs` | Contract test for the pure module and the matrix |

Rendered evidence: `.visual-review/gallery-archive/direction-b/` (gitignored), regenerated with
`LAB_ORIGIN=http://localhost:3000 node .visual-review/gallery-archive/direction-b/capture.mjs`.

---

## How the sheet is built

The mechanism is deliberately the opposite of Direction A's integer span planner on a CSS grid.

- **Justified strips.** Each frame is `flex: ratio 1 calc(ratio * strip-height + padding)` inside a wrapping flex row. Because both the basis and the grow factor are the frame's own ratio, every frame on a line resolves to the same height, and widths stay proportional to the photographs. No frame is ever left standing taller than its neighbours, so the sheet has no trapped voids.
- **Strip breaks.** The opening strip is closed by a zero-height `flex: 0 0 100%` marker. One marker exists per breakpoint and CSS keeps exactly one in the flow, which is how the opening count changes from 1 to 3 to 4 without re-ordering the DOM.
- **The tail spacer.** A `flex: 999999 1 0` spacer lands on the closing strip and absorbs its slack. It is only rendered when the Night has more galleries than the opening strip holds — that single condition is what stops short Nights from printing small.
- **One cap.** `FRAME_CAP` (30rem) is the tallest any frame may print, at any measure. It is what keeps a one-gallery Night from filling a 1920 fold with a single print.
- **JS owns truth, CSS owns composition.** `contactSheet.js` computes ratios, frame counts, stamps, tallies, index entries and totals. It never measures the viewport; the tiers in `SHEET_SCALE` are bound as CSS custom properties and switched by media query.

---

## Gallery Stack presentation

`FaneqoGalleryStack.vue` is a locked signature primitive and was **not** modified. All presentation happens in the wrapper:

- **Prints in a sheet, not cards on a page.** No card, no border, no panel — a frame is the Stack plus a two-line annotation tucked under its bottom-left corner, on the sheet's own background. The Stack's deck layers are the only physical separation, which is what lets many frames sit close together without reading as products.
- **A loupe on hover.** Hovering or focusing one frame quiets the rest of that Night's strip to 52% and lifts the frame under the pointer, so density never costs legibility. Disabled for coarse pointers and reduced motion.
- **One caption grammar.** The frame number in the sheet's column, then the Gallery title, then the facts. `DRAFT` prints above the line and never joins the run of facts. Counts are frames, not photos — the sheet's own vocabulary.
- **Native orientation matters.** The wrapper reads `stackPrintRatio()` for the same clamped ratio the Stack will print, so the frame's flex width and the photograph's aspect always agree. Nothing is cropped to fit a slot.
- **No photographs yet.** An empty gallery gets a waiting plate at the blank ratio, capped to 1.1× strip height, so a Gallery with nothing in it can never print larger than one with photographs in it.

---

## Fixture matrix

`?state=` — `tour` · `nights` · `night` · `one` · `two` · `general` · `edges` · `empty` · `loading` · `error` · `auth`

Covered: 7 Nights across two years · 23 galleries · 1/2/3/4/6 galleries in a Night · a 24-frame gallery · a 1-frame gallery · a gallery with no cover · draft galleries · portrait, landscape and near-square covers · a title long enough to wrap two lines · a 34-character venue · a Night with no venue · General-only · Nights + General · loading · error · no artist access.

Photography is the real local concert set in `public/labs/gallery-experience/` at native ratios. The contract test asserts the matrix stays tour-scale (more than one Night, more than one year, a Night with at least four galleries) and that no fixture URL or slug can escape the lab.

---

## Self-critique (against the rendered evidence)

**What makes B fundamentally different from A?** The unit of composition. A composes a Night as a chapter with a margin of prose and a grid of equal-width plates at native heights; B composes the whole tour as one sheet of equal-height strips at native widths, with the Night reduced to a single stamped line. A reads top-to-bottom and narrative; B reads left-to-right and photographic. The chronology in A is a sequence of chapters; in B it is a sticky index against a continuous sheet. Neither the layout mechanism, the density, the caption grammar, nor the navigation is shared.

**Where B is stronger.** Density and comparison. At 1920 the fold holds the masthead, the whole tour index and six galleries of a Night at print size; at 1440 it holds four. Because heights are shared per strip and widths are native, orientation is legible at a glance — a portrait gallery is visibly a portrait gallery — and differently-shaped covers sit together without normalising. The index makes a 7-Night tour navigable without the page becoming a calendar. Frame counts, tallies and totals are all derived, never decorative.

**Where B is weaker.** Prose. A can carry truthful context (who a gallery is for, what the Night was) in its margin; B has one printed line per Night and two lines per frame, so context has to be short. B's lead is the first and widest frame in the tallest strip, but it is not a single dominant hero the way A's lead plate is — if gallery 01's cover is portrait, a landscape neighbour in the same strip is physically wider. And a part-used closing strip leaves visible air on the right, which is honest for a proof sheet but looks emptier than A's resolved rows.

**Does density become clutter?** Not at these strip heights. Frames in a run print at 216–252px tall with the caption attached to the frame, and the hover loupe removes the one real risk — a wall of similar prints competing for attention. The stamp line plus the sheet's row gap keeps each Night separable without a divider.

**Does chronology remain understandable?** Yes, and it is stronger than A's at tour scale. Every Night stamps `SEP 07 2026 · venue · city`, the year greys out until it changes, the index prints the year only when it turns, and the active entry tracks the scroll. On mobile the stamp sticks to the top of the viewport while its own strips scroll under it, so the date is never lost.

**Does it feel like music photography rather than a media manager?** Yes. There are no cards, tiles, chips, checkboxes, sort controls, view toggles or thumbnails-in-a-list — the objects on the page are prints, and the only chrome is a date stamp, a hairline and a tally in tabular figures.

### Repaired after the first render

| Found in evidence | Repair |
| --- | --- |
| Support frames ignored the per-breakpoint strip height (`--cp-h` fell back to a hardcoded value), so 1920 printed one hero, four undersized neighbours and a large void beneath them | Strip height is set on the sheet and inherited by every frame; hierarchy moved from a hero multiplier to the opening strip |
| Mobile printed one gallery per row because the fallback strip height was too tall for a 390 measure | Mobile strip height is 8rem, which wraps to 2 landscape or 3 portrait frames per strip |
| A Night with fewer galleries than the opening strip holds had its slack absorbed by the tail spacer, so short Nights printed as small orphans next to tall Nights | The spacer only renders when the Night exceeds the opening count, so short Nights print large |
| An empty gallery printed as the largest object on the page (a 30rem empty rectangle for Portland) | Blank plates are capped to 1.1× strip height |
| The loose-prints band printed frames larger than any Night's | General strip is 1.05× the run strip with doubled gutters — distinct handwriting, quieter voice |

---

## Deliberately rejected

| Rejected | Why |
| --- | --- |
| Masonry / waterfall columns | Broken chronology, no shared baseline, and the Pinterest read the brief rules out |
| Uniform square thumbnails | Destroys the one thing a photographer's sheet is for: seeing the shape of the frame |
| A hero frame taller than its own strip | Every arrangement produced trapped dead space beside or beneath it at some Night size |
| Cards, panels or hover-lift tiles | Product-catalogue grammar; the Stack's deck already supplies physical separation |
| A month/year calendar or filter bar | The brief's line — the date should help navigation without turning the page into a calendar |
| Cropping covers to fill a slot | The archive would stop telling the truth about the photograph |
| A contact-sheet grid of tiny thumbnails on mobile | Unreadable and untappable; mobile opens on one lead frame instead |

---

## Known open items (not defects, deferred by judgment)

- A Night whose galleries wrap to a closing strip of one prints that last frame small with air to its right. Authentic for a proof sheet, but it is the weakest moment in the rhythm — worth a founder opinion before it is designed away.
- Opening-strip counts live in two places: `SHEET_SCALE[].open` and the break-marker media queries in `ContactBand.vue`. The contract test asserts the documented counts so a change is visible, but CSS cannot be asserted from Node.
- Every frame requests `size="compact"` from the Stack. In production the opening strip is large enough to deserve the archive source; the lab's fixture photographs have no format variants, so the difference is not visible here.
- The tour index is desktop-only. At 1080–1280 it takes measure away from the sheet; a narrower or collapsed rail may be better.
- `IntersectionObserver` drives the active index entry. With very short Nights near the bottom of a long sheet, the last entry can stay active early — acceptable for a lab, worth tuning with real data.
- Frame counts say `frames`; production copy says `photos`. Divergent on purpose to establish the sheet's vocabulary — a decision, not a bug.
