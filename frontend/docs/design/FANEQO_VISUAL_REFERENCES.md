# Faneqo visual references

Design judgment only. Extract principles. Do not copy styling, identity, or assets.

Research pass: 2026-08-20. Sources below. No third-party assets were imported into the repo.

---

## Apple Human Interface Guidelines

**LEARN:** Purpose before decoration. Clarity. Comfortable touch targets. Familiar gestures. Motion restraint. `prefers-reduced-motion`. Image composition that protects the subject.

**DO NOT COPY:** iOS chrome, SF Symbols as a brand voice, Apple surface materials, San Francisco, product-page marketing layouts.

**APPLICATION:** Gallery cells and lightbox controls stay ≥44px. Keyboard + focus remain first-class. Lightbox already has swipe, trap, and reduced-motion — keep that discipline. Never crop a face or performer out of a cover for a template ratio.

---

## Spotify (Relevant / Human / Unified)

**LEARN:** Context-aware experiences. Music-first hierarchy. Shared foundation + specialized local compositions. Semantic tokens. Reuse instead of reinventing a system per surface.

**DO NOT COPY:** Spotify green as Faneqo’s public-artist color, Encore cards, now-playing chrome, sidebar navigation, or playlist-row density.

**APPLICATION:** Shared `MediaItem` + `FaneqoMedia*` (Layer 2) with different wrappers: public profile, Artist Update, Night Story, Passport, DM bubble. Tokens already exist (`--fq-*`, `--faneqo-*`). Do not invent a third palette for galleries.

---

## Figma AI / design-system guidance

**LEARN:** Higher-order compositions, not atoms. Semantic names and variants. Responsive intent encoded in the composition. Component descriptions that explain why. Examples of real screens.

**DO NOT COPY:** A Figma file as source of truth for Faneqo. Do not add Figma MCP, new token packages, or production design-system dependencies for this harness.

**APPLICATION:** Cursor should reach for `FaneqoMediaGrid` / lab `LabsEliteGallery`, not a new `Card` + `Image` + `Badge` stack. Gallery variants are counts (1 / 2 / 3 / 4 / 5+), not “Instagram tile.” Document why cover = `media[0]`.

---

## A24

**LEARN:** Photography and artwork set the mood. Typography carries hierarchy without boxes. Chrome is thin, high-contrast, and peripheral. Controlled asymmetry. Confidence from space, not ornament. Warmth can come from the image, not a gradient overlay.

**DO NOT COPY:** A24 wordmark, serif lockup, merch grid, membership modal, store UX, or any trademarked identity.

**APPLICATION:** Artist gallery and profile: let the photo occupy the emotional field. Title/caption sit in type. Utility (share, close, count) lives at the edge. Avoid stacking cards on top of concert photography.

---

## Siteinspire (Editorial / Photography / Grid / Unusual / Minimal)

**LEARN:** Photography can be the layout. Grids are a tool, not a dump. Unusual layouts stay readable on a phone. Minimal means fewer competing surfaces, not empty pages.

**DO NOT COPY:** Any listed site wholesale. Reject custom cursors, scroll prisons, heavy parallax, 3D spectacle, and effect-stack portfolios.

**APPLICATION:** 05B.3 compositions (1 editorial, 2 pair, 3 hero + support, 4 mosaic, 5+ cover + count) must remain parseable at 320px. If a layout needs a gimmick to feel premium, it is wrong for Faneqo.

---

## High-end photography portfolios (discipline, not templates)

**LEARN:** Large image fields. Mixed aspect ratios. Breathing room around prints. Type as caption, not as a label chip on every frame.

**DO NOT COPY:** Custom cursors, forced scroll hijacking, WebGL for its own sake, or animation stacks that compete with the photo.

**APPLICATION:** Preserve `aspectRatio` from MediaItem. Do not force every show photo to 1:1 or 4:5. Original / large URL in lightbox; thumbnail in the grid.

---

## Mapping back to Faneqo

```
SHARED PRIMITIVES     MediaItem, FaneqoMedia*, upload queue
SPECIALIZED WRAPPERS  Profile · Update · Night Story · Passport · DM · Lab
DECORATION LAST       borders, glows, gradients, pills
```
