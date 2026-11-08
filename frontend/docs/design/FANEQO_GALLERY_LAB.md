# Gallery Design Lab

Private proving ground for **05B.3 Elite Artist Gallery**. Not a product surface.

Route: `/labs/gallery`  
Night Story proving: `/labs/night-story` (`/__dev/night-story` locally)  
Guards: `auth` then `labs` (`internal_labs`). Unenrolled logged-in users get a real 404. `noindex`.

How-to:

1. Enroll `internal_labs` (see `docs/FANEQO_LABS.md`).
2. Open `/labs/gallery`.
3. Switch width frames (320 / 390 / 430 / 768 / 1024 / 1280).
4. Compare production `FaneqoMediaGrid` at 1 / 2 / 3 / 4 / 5+ / 20, orientation sets, compact strip, and DM bubble.
5. Click any frame to reuse `FaneqoMediaLightbox` with zoom enabled.

Local unauthenticated sandbox (development only, 404 in production): `/__dev/gallery`

Fixtures: original SVGs in `public/__dev/gallery/`, mapped through `normalizeFaneqoMedia` in `config/galleryLab.js`. Cover = first ordered item. No third-party photography.

## What this lab is for

- Production 05B.3 compositions on `FaneqoMediaGrid`
- 1 editorial · 2 pair · 3 hero + two · 4 mosaic · 5+ cover + count
- Mixed aspect ratios and 20-image overflow
- Decision order: Story → Hierarchy → Media → Type → Space → Interaction → Motion → Decoration

## What this lab is not

- Do not unhide Artist Updates or Show Photos.
- Keep this lab on `FaneqoMediaGrid` + `FaneqoMediaLightbox`. Do not wire PhotoSwipe, Nuxt Image, or other dependencies into it — PhotoSwipe is installed and belongs to Living Gallery (`LivingGalleryAdapter`), not to this grid-composition lab.
- `/__dev/gallery` is a local visual sandbox only.

Language: `docs/design/FANEQO_VISUAL_LANGUAGE.md`  
Cursor rule: `.cursor/rules/10-faneqo-design.mdc`
