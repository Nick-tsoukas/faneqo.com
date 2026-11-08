# Faneqo Creative Studio — Design Standard

Written 2026-10-11. Live status of the templates is `docs/CREATIVE_STUDIO_VISUAL_HANDOFF.md`
(2026-10-13). Companion research is `docs/CREATIVE_STUDIO_DESIGN_BENCHMARK.md`. Architecture is
`docs/CREATIVE_STUDIO_V2_SPEC.md`. Visual language tokens live in
`docs/design/FANEQO_VISUAL_LANGUAGE.md`; this document is about what a finished creative must
achieve, not which hex codes it uses.

Use it in every template refinement: score the before, score the after, record both in the
handoff. Scores are a design-review aid, not a performance measurement. The product owner has
final approval.

---

## 1. What a Faneqo creative is

A Faneqo creative is music editorial, not a marketing banner. It introduces an artist, a song, a
show, or an idea to a fan scrolling a phone, and it does one thing: make the fan stop and act.

Hierarchy, in order, for any artist-bound template:

1. The photograph or artwork
2. The artist's name (or the song / show title in those families)
3. One supporting line
4. The secondary object where it earns its place (featured song, date, link)
5. The Faneqo close: one call to action, one destination, the wordmark

The brand is the frame, not the subject. If the artist's name and the word "Faneqo" compete, the
artist wins.

## 2. Core principles

1. **Artist-first storytelling.** The photograph dominates. Type supports it. Nothing covers a
   face unless the artist chose that crop.
2. **Powerful but controlled typography.** One hero line per board. Labels are tracked, small,
   and few. No decorative faces, no outlines, no gradients on body copy. Scale with content
   length (`nameScale`), never by hand per artist.
3. **Excellent photography treatment.** Shade only where type lives. The top of the photograph
   stays open. Ramps are long and photographic, never a slab. A bright or dark photograph gets a
   treatment preset, not a different gradient on every creative.
4. **Intentional negative space.** Empty space is a decision: it separates tiers and gives the
   name room. It is never leftover room from a layout that ran out of content.
5. **Contrast without crushing.** The photograph must still read as a photograph at the point
   where the type begins. Pure black is reserved for the base of the frame.
6. **Clear visual hierarchy.** A fan should read the board in one order with no competition:
   image → name → line → object → close.
7. **Restrained branding.** At most two Faneqo mentions above the close; the close carries the
   wordmark and destination. The series label describes the series, not the company.
8. **Genre flexibility.** The same template must hold a doom band under stage light and a
   singer-songwriter in daylight. Nothing in a template keys off a band name or genre string.
9. **Format-specific art direction.** 4:5, 1:1, and 9:16 each get their own vertical budget,
   type sizes, and photo band. A story is not a stretched square. Platform chrome zones
   (`AD_SAFE_ZONES`) hold no essential content.
10. **Export fidelity.** What the editor shows is what the PNG is: same layout, same crop, same
    type, at exact platform dimensions.

## 3. Family identities (distinct, within one brand)

| Family | Identity | What must dominate |
| --- | --- | --- |
| Artist Spotlight | Music-magazine profile. Photograph band or full-bleed portrait, name as the masthead. | Photograph, then name |
| Song Spotlight | Release campaign. Artwork is the object; colour comes from it. | Artwork |
| Product Showcase | The product itself, shown truthfully as an inert excerpt of a real artist page. | The page |
| Type Statement | Manifesto. Type is the image; a photograph is at most a veil. | Words |
| Education | Editorial carousel. Calm, legible, generous leading. | Reading comfort |
| Show Promo | Poster / ticket. Date and place must be unmissable. | Date, place, photo |
| Music Industry Insights | Editorial poster or playbook note. Type is the image. No call-to-action pill. | The idea |

Do not homogenise these. Shared primitives (`PhotoField`, `CreativeClose`, `ProductExcerpt`)
keep the brand consistent; each family's composition and type scale should be recognisably its
own.

## 4. Fixed, variant, and adjustable

| Tier | Owner | Examples |
| --- | --- | --- |
| Fixed composition | Template | Vertical budgets per format, type scale, gradient shape, close placement, label size |
| User-selectable variants | Family | Layout variant, headline preset, CTA preset, format |
| Safe user adjustments | Editor | Photograph, focal point, treatment preset (Natural / Balanced / Deep), copy within length limits, artwork, badge text |

Anything that lets a user break hierarchy (free type sizes, free colours on type, arbitrary
layer positions, unlimited copy) is out. A control earns its place when it changes a real outcome
on a real photograph.

## 5. Quality scorecard (100)

Score each finished template per variant × format on representative artists. Record the lowest
format score, not the average: a template is only as good as its weakest supported output.

| Category | Points | What earns full marks | What loses points |
| --- | --- | --- | --- |
| Composition | 20 | Blocks stack with intent; photograph, name, and close relate; no voids, no crowding; the eye lands on the artist first | Overlaps, dead bands, cramped lower block, name pressed against the band |
| Typography | 20 | One hero, labels subordinate; scale fits the longest realistic name; tracking and leading tuned; nothing below ~16px on a 1080 board | Masthead outweighs the name; duplicate words; clipped or wrapped names; micro-type |
| Photography / artwork | 20 | Faces and focal area in frame on representative photos; ramps photographic; vibrancy kept; crop uses the image well | Slabs of gradient, faces under type or chrome, letterboxing, visible stretch |
| Brand integration | 10 | Close is calm and complete; ≤ 2 mentions above it; series label reads editorial | Brand bracketing the artist; kicker + badge + wordmark + URL all shouting |
| Clarity / communication | 15 | Who, what, where in under two seconds; CTA readable at phone scale; secondary object clearly secondary | Ambiguous reading order; CTA that must be decoded; song row floating |
| Format adaptation | 10 | Each format has its own budget; story respects 250 / 320 chrome; square holds a face band | Scaled-down square in a story; content in chrome zones |
| Finishing details | 5 | Soft edges, consistent radii, aligned baselines, badge weight matches type, export identical to preview | Hard rectangles, mismatched sizes, preview ≠ PNG |

**Approval threshold:** ≥ 90 on the weakest supported format, and zero blockers.

**Blockers regardless of score:** any clipping of the artist name or CTA; illegible text at
phone scale; a broken or mis-sized export; a face covered by type or platform chrome on a
representative photograph with a sensible focal point.

## 6. Review procedure

1. Render the matrix with `/__dev/studio-render` (variants × formats × representative cases:
   long / short name, no description, no song, portrait / landscape / square source, user focal,
   uploaded artwork). Keep PNGs outside the repo.
2. Run the visual critic once on the rendered candidate. Fix MUST FIX items, re-render, stop.
3. Export real PNGs from the editor for every supported format and compare against the preview.
4. Score with §5. Record before and after in the handoff with the scores and the exact renders
   you looked at.
5. State the limits honestly: face protection depends on focal data; an extreme focal or an
   unsuitable photograph is a content problem the template cannot solve.

## 7. Known limits of the current system

- Face protection is focal-driven. There is no face detection; the template keeps the chosen
  focal point as central as the crop allows. An artist with no focal set gets the centre.
- The Product Showcase phone hides the fan-list form so a cropped form does not read as a real
  input. Link rows are inert. An artist with no song and no links leaves open space under the
  photograph; that space is not filled with invented features.
- Playwright screenshots and `html-to-image` exports resample slightly differently; a grid mean
  difference under ~6/255 is parity, not a defect.
- Insights story frames keep a dark field under the type so the wordmark stays out of Instagram's
  bottom chrome. The Playbook number is the fixed mark `01`.

## 8. Addendum — 2026-10-13

Shipped after this standard was written. These override the family notes above where they conflict.

- **Artist Spotlight** is four styles on `content.style`: Editorial Icon (default for new
  creatives), Cinematic Immersion, Contemporary Music Culture, Original. A missing style renders
  as Original. Do not migrate old records. Culture's spine, echo, and rail are approved; do not
  restyle that variant while refining another family.
- **Product Showcase** artist-page excerpt is a tall phone, not a wide card. Hierarchy is
  headline, then the phone, then the close. The phone must show the real page: photograph, name,
  biography, featured song, and the artist's own streaming or social rows. The Create card, the
  new creative, and the PNG are the same composition for the same snapshot.
- **Music Industry Insights** is a seventh family. Bold Insight is a type poster (last phrase in
  the gradient). Music Playbook is a titled note with a takeaway. They are editorial, not ads.
