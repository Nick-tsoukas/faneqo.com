# Faneqo Living Gallery — master

Product constitution. Not the live now-board (`CURRENT_PHASE`). Not the full ambition dump (`ATOMIC_OUTLINE`).

Updated 2026-09-09.

---

## Product role

Primary Faneqo photographic **viewing** experience.

Living Gallery is how a fan or artist **looks at concert photographs** with authority, calm, and physicality.

It is not Galleries Home.
It is not Gallery Create / Edit.
It is not the production Gallery Stack lightbox.
It is not Enter the Night.

---

## North star

Faneqo Living Gallery should become one of the finest ways on the web to experience live-music photography.

Test: would a demanding viewer believe every visible decision in this viewer was deliberately art-directed — calm, physical, photographic, intentional?

The standard is absolute. "Better than the old lab build," "better than the production lightbox," and "better than Fancybox" are not evidence of quality. Fancybox and other mature viewers are **physics benchmarks** — they tell us whether our gestures feel broken, not whether our product is good.

If the answer is “approximately,” we failed.
If the viewer looks resolved but does not *feel* resolved in the hand, we failed.
If it feels good only because of decoration, we failed.

---

## Product distinction

| Experience | Job |
| --- | --- |
| **Living Gallery** | SEE THE PHOTOGRAPHS |
| **Enter the Night** | RELIVE THE NIGHT |

Keep the distinction brutal. Spectacle in the viewer must be earned (`LG-P07`). Memory-cinematic work belongs to Enter the Night, which remains a separate, frozen experience.

---

## Governing principles

### LG-P01 Photography first

The photograph is the product. Chrome, type, and technology serve it.

### LG-P02 Maximum capability / minimum visual noise

The engine may be extremely capable. The default view may contain almost nothing.

### LG-P03 Familiar physics / exceptional presentation

Use mature image physics (PhotoSwipe). Do not invent a second gesture engine. Presentation and composition are where Faneqo must exceed a conventional lightbox.

### LG-P04 Mobile PWA is canonical

390px is the Faneqo canvas. Phone quality is not optional. Desktop is real, not leftover mobile CSS.

### LG-P05 Pure black is baseline

Default surround is `#000`. Color, glow, GPU Stage, and atmosphere are not the baseline. They must be approved later, if ever.

### LG-P06 Continuous photograph

Long-term object principle:

```
Gallery thumbnail
  → future Memory Deck
  → selected photograph
  → Living Gallery
  → zoom
  → return
```

The photograph should feel like the **same object** wherever technically and perceptually possible. Source bounds, focus restore, and (later) object-continuity motion exist to serve this — not to decorate.

Memory Deck is future product-layer integration. Do not build it because the principle exists.

### LG-P07 Spectacle must be earned

Effects, depth, relighting, and cinematic tech are guilty until they make the photograph more true.

### LG-P08 Photographer remains the author

Do not restyle the photograph into a demo. Credit the photographer when the data exists. Do not invent names.

### LG-P09 Desktop receives real art direction

Desktop is not a blown-up phone. Landscape, portrait, square, and ultrawide each need authored composition.

### LG-P10 Approved does not mean permanently finished

APPROVED V1 is a checkpoint. Living Gallery is allowed to keep getting better.

### LG-P11 The creator directs, an independent critic judges, the founder approves

Agents may art-direct this surface (see `.cursor/skills/faneqo-ui-director/SKILL.md`), but no agent certifies its own work. A candidate needs rendered evidence and an independent Visual Critic pass (`.cursor/agents/faneqo-visual-critic.md`) with no open BLOCKER or MUST FIX. **APPROVED V1 / COMPOSITION FROZEN stays a founder decision, on a real phone for anything gestural.**

Supersedes the earlier rule that external design tooling owned presentation (LG-D007 → LG-D025).

### LG-P12 Preserve future possibilities without expanding current scope

Frontier ideas belong in `FRONTIER.md`. They must not leak into CURRENT_PHASE.

---

## What exists today (engineering, not approval)

Isolated lab: `features/gallery-experience/` · `/__dev/gallery-experience`

Useful substrate (see historical `docs/FANEQO_GALLERY_EXPERIENCE_LAB_HANDOFF.md`):

- PhotoSwipe v5.4.4 via LivingGalleryAdapter
- LivingGalleryController (headless actions / capabilities / events)
- Pure-black default
- Orientation / device composition resolver
- Opening source bounds
- One-entry `#living-gallery` history
- Media contract (thumb / medium / full / srcsetCandidates)
- Neighbor preload
- Accessibility foundation (live index, labels, inert hidden chrome)
- Preserved Three.js Stage experiment (off by default)
- Fancybox benchmark doc (not a dependency)
- Seven real concert-photo fixtures (~1024px)

**The current visible design is not approved.** Existence ≠ approval.

---

## Adjacent locked / frozen work

| Surface | Rule |
| --- | --- |
| Production Gallery Stack / lightbox | LOCKED. Do not wire Living Gallery into it in this phase. |
| Galleries Home | Do not redesign. |
| Enter the Night | FROZEN. Separate product. |
| Gallery Create / Edit | Company CURRENT_PHASE. Different workstream. |
