# Faneqo visual language

Token lookup and gallery-count composition notes. **This file must not override** `docs/FANEQO_DESIGN_NORTH_STAR.md`. Neon green is legacy / historical, not current brand identity. Gradient CTA dependence is stale. Current actions are earned near-white; Faneqo color is precision, not wallpaper.

This is the existing product language, sharpened. Do not invent a second brand.

Decision order for every important UI choice:

1. Story — what should someone understand, remember, or feel?
2. Hierarchy — eye first, second, third
3. Media — can photography / artwork / music carry more?
4. Typography — can type replace a container?
5. Space — can rhythm replace another box?
6. Interaction — is the action obvious?
7. Motion — does it explain state or meaning?
8. Decoration — borders, gradients, shadows, glows last

AI often designs this backwards. Faneqo must not.

Fuller taste notes: `docs/design/FANEQO_VISUAL_REFERENCES.md`  
Cursor short rule: `.cursor/rules/10-faneqo-design.mdc`  
Gallery proving ground: `/labs/gallery`

---

## Product character

Cinematic, editorial, music-native, emotional, premium, confident, dark, alive, personal, slightly futuristic.

Not: sci-fi dashboard, gaming HUD, crypto, generic SaaS, Instagram clone, Linktree clone.

Hierarchy of meaning:

**Artist → music / photography / memory → relationship → context → action → chrome**

Content dominates decoration.

Two worlds already exist. Do not blend them carelessly:

| World | Surfaces | Accent | Use |
| --- | --- | --- | --- |
| Artist / marketing / memory | `--faneqo-obsidian`, `--faneqo-raised` | magenta → violet, connection cyan | public profile, homepage, future gallery, Night Story, Passport |
| App / messages | `--fq-app-bg`, `--fq-surface` | near-white primary actions; earned cyan / teal for live / relationship | inbox, dashboard chrome, composer |

Neon green `#39FF14` is a **legacy MBQ-era signal**, not current Faneqo identity. Do not extend it. Public artist photography must never wear inbox neon.

---

## Hierarchy

One dominant moment per view. Supporting facts recede.

Gallery: photo first, show/artist second, caption third, controls last.  
Profile: artist image and name first, music second, Fan List / actions third.  
DM: person and message first, attached photos as proof, chrome last.

Do not make every piece of information visually equal.

---

## Photography

When media is emotionally important, let it dominate.

Prefer editorial crop, large fields, mixed native ratios, full or near-full width at meaningful moments, subject-safe crop (`object-position` / existing focal-x/y on profile heroes).

Do not shrink concert photography into 120px SaaS cards. Do not blindly crop everything to 1:1 or 4:5.

MediaItem already carries `aspectRatio`, `thumbnailUrl`, `url`, `largeUrl`. Use them.

- Grid: thumbnail
- In-flow display: `url` (medium / gallery)
- Lightbox: `largeUrl`
- Protected: never route through Nuxt Image / IPX

Cover contract (05B.2): **first ordered item is cover**. No `coverImageId`.

---

## Typography

Existing family: **Poppins** (`tailwind.config.js`; Noto Sans Thai for `th` in `app.vue`). Do not add font families here.

Weights already loaded: 400, 500, 700, 800.

Use scale, weight, tracking, case, contrast, and space before boxes or pills.

Closer to music editorial / tour poster than enterprise dashboard.

Tiny uppercase kickers are allowed **selectively** (Labs, section labels). Do not uppercase every label.

Tracking: tight on large artist names; slightly open on small metadata.

---

## Space / rhythm

Whitespace is material.

Prefer clear vertical rhythm, strong section breaks, air around photography, denser utility surfaces (inbox, forms).

Avoid random margins, equal padding everywhere, nested padded boxes, giant empty regions with no compositional reason, and card-in-card stacks.

---

## Surfaces

Reuse tokens. Do not invent hex.

Artist/memory: `#050608` obsidian, `#0B0E14` raised, `#111722` surface (`assets/css/tailwind.css` `:root`).

App: `#050506` / `#07080A` / `#0B0C10` / `#111217` (`utils/ui/faneqoBrand.js`).

Public artist pages must not inherit `.fq-app` messaging materials.

---

## Borders

Thin separators: `rgba(255,255,255,0.07)` (`--fq-border`) and `0.10`–`0.11` when a real edge is needed.

Prefer a 1px hairline or space over a framed card around a photo.

---

## Radius

Existing: ~0.9–1rem on app controls and DM bubbles; **0 on gallery fields** (`FaneqoMediaGrid` gallery variant). Keep photos square-cornered in gallery/memory. Soft radius belongs to chrome, not prints.

---

## Color

Custom Tailwind: `off-black` `#191414`, `accent` `#FF00FF`, `green` `#1db954`, `neon-green` `#39FF14`, `neon-purple` `#9100FF`.

Connection language (fan / echo): cyan `#39D5FF` → emerald `#45E3AE`.

One strong accent per section. Neon green is a signal (sent, success, unread), not a wallpaper.

---

## Gradient

Use selectively.

- Brand emphasis: pink → fuchsia → purple
- Fan/echo: cyan → emerald
- App CTA: `--fq-gradient-primary` (green → teal → purple)

Never default every element to a gradient. One gradient edge or CTA per section is enough.

---

## Iconography

Existing `FaneqoIconButton` + Lucide/Font Awesome already in the app. Prefer the Faneqo icon button in product chrome. Do not introduce a new icon set for gallery.

---

## Motion

Import `utils/ui/motionTokens.js`. Do not scatter durations.

Micro 0.14s, standard 0.21s, navigation 0.28s. Respect `prefers-reduced-motion` (grids already disable hover zoom).

Motion explains arrival, send, lightbox open, relationship — not decoration.

Rive is for meaning. CSS/Vue for layout. PhotoSwipe (`photoswipe@^5.4.4`) is an installed dependency and owns photograph physics behind `LivingGalleryAdapter` — it is not a candidate under evaluation. Do not add a second gesture engine.

---

## Responsive composition

Mobile-first: 320, 360, 375, 390, 414, 430, then 768 / 1024 / 1280+.

If a gallery composition collapses into a confusing stack at 320, it is unfinished.

---

## Accessibility

Contrast on type vs photo overlays. Focus rings already use green in app chrome. Keyboard lightbox must stay intact. Touch targets ≥44px. Do not rely on hover for critical actions.

---

## Gallery / media

Layer 2 is presentation-agnostic. Wrappers choose the story.

05B.3 target language (implemented on `FaneqoMediaGrid` `variant="gallery"`):

- 1 photo: large editorial, native aspect (capped)
- 2: pair-stack if both landscape; otherwise an intentional split that keeps native ratios
- 3: portrait cover → hero + two supporting; landscape cover → mosaic-top
- 4: mosaic-side or mosaic-top from cover orientation
- 5+: opening cover + three support cells + `+N`; source array is not truncated

Rules live in `utils/media/faneqoGalleryLayout.js`. Bubble variant is a different presentation. Do not put show/Passport/profile facts on the grid.

Prove and compare at `/labs/gallery` or `/__dev/gallery`. Night Story proving: `/labs/night-story` or `/__dev/night-story`.

---

## Profile

Artist image is a hero, not a thumbnail. Name is type, not a chip. Compact profile later reuses the same MediaItem source as a preview strip — do not fork serialization.

---

## Show / memory experiences

Night Story, recap, Passport memory: same photos, different wrapper. Gated `show_attendees` is authorization, not a visual theme. Do not invent a “VIP neon frame” to mean exclusive.

---

## Anti-patterns

- Generic SaaS cards around concert photos
- Equal-weight dashboards
- Nested cards
- Gradient-on-gradient
- Glow as personality
- Instagram 3-up as the only gallery
- Linktree list as the artist page
- Fake upload percentages
- New font / new color / new radius “just for this feature”
- Screen-specific fields on MediaItem
- Unhiding Artist Updates or Show Photos from a design lab
