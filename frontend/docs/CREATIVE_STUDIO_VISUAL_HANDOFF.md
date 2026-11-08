# Faneqo Creative Studio — Visual Handoff

Updated 2026-10-13. This is the live brief for Creative Studio visual work.

The work is visual communication. A creative is judged by what a musician sees in a phone feed, not by the component tree. Architecture exists so that communication can be edited, saved, and exported. Do not rebuild it to chase a look.

This file does not replace the product-phase docs. Gallery, Messaging, Passport, Public Night, and RockSnaps stay where `docs/FANEQO_CURRENT_PHASE.md` and `docs/FANEQO_NEXT_AGENT_HANDOFF.md` left them. Do not start those unless Nick asks.

---

## Read in this order

1. **This file** — what the templates look like now, and how to change one.
2. `docs/CREATIVE_STUDIO_DESIGN_BENCHMARK.md` — the music-industry research. Principles only. Do not copy campaigns, lettering, or layouts.
3. `docs/CREATIVE_STUDIO_DESIGN_STANDARD.md` — the scorecard and the 2026-10-13 addendum. Score the weakest format, not the average.
4. `docs/CREATIVE_STUDIO_V2_SPEC.md` — the studio architecture.
5. `docs/CREATIVE_STUDIO_V2_HANDOFF.md` — engineering history. Ignore any line that says the work is uncommitted.
6. `docs/FANEQO_DESIGN_NORTH_STAR.md` — brand behavior. It does not override a locked template composition.
7. `docs/FANEQO_CURSOR_OPERATING_SYSTEM.md` — evidence and the visual critic. Use it when the task is a new composition, not for a one-line copy fix.

`docs/design/FANEQO_VISUAL_LANGUAGE.md` is token lookup. It does not outrank the four files above.

---

## What a creative has to do

Someone scrolling a phone should understand one thing before the thumb moves on.

The reading order is decided before decoration:

1. What is this about? An artist, a song, a page, a show, or one idea.
2. What is the proof? A photograph, artwork, or a line of type large enough to be the image.
3. What is the close? A wordmark, a destination, and a call to action only when the family is an ad.

Empty space is part of the composition when it separates those tiers. Empty space is a failure when a section was supposed to be there and the data was dropped.

Each ratio is its own composition. A story is not a stretched feed. A square is not a cropped feed.

---

## Research that actually governs the work

From `docs/CREATIVE_STUDIO_DESIGN_BENCHMARK.md`. Apply the lesson. Leave the artwork alone.

| Lesson | Where it came from | What it means here |
| --- | --- | --- |
| One hero, reused across ratios | Fontaines D.C. *Skinty Fia*; Apple Music billboards | One photograph or one line of type, redesigned per ratio. Do not crop the subject out to fit a format. |
| Two type voices | Indie tour posters; Chromakopia | Expressive tier for the name or the idea. Neutral tier for labels, dates, and the close. Poppins only: 400 / 500 / 700 / 800. |
| Type size is status | Coachella | The platform mark never sits in the top tier. |
| One accent system | Roskilde; the Faneqo gradient | Magenta `#ff4ad8` → violet `#c084fc` → cyan `#67e8f9`, used once. Gradient text is `width: fit-content` or the words only catch magenta. |
| Do not repeat the chrome | Spotify Canvas | Do not restate the artist name, the URL, and the wordmark as three headlines. |
| Design the ratio family | Live Nation admats | 4:5, 1:1, and 9:16 each get type sizes and a vertical budget. Story safe zone is top 250 / bottom 320. |
| Software for musicians should feel like music | Splice; Ableton | Dark field, photography, tight type. Not a SaaS card, not a gradient box, not a quote graphic. |
| The creator leads | Linktree | Faneqo is the frame. If the name and the wordmark compete, the name wins. |
| Clutter is a message | Boiler Room | Do not add shapes, stickers, or a second logo "for energy." |

Anti-patterns already rejected: press-release walls, tiny feature lists, template chrome around the artist, motivational quotes on black, invented streaming icons.

---

## Where it lives

Local: `http://localhost:3000/ads`
Production: `https://faneqo.com/ads`

The library opens on **All Creatives**. Templates are a separate tab:

- `http://localhost:3000/ads?view=templates`
- Create: `http://localhost:3000/ads/create?template=<family id>`

Dev renderer, 404 outside `nuxi dev`:

`http://localhost:3000/__dev/studio-render?template=<id>&format=feed&artist=demo`

`artist=demo` is the bundled Badflower fixture. `artist=<slug>` loads the live snapshot. `artist=none` is an empty snapshot.

Formats in `features/ads/formats.js`:

| Id | Chip | Pixels |
| --- | --- | --- |
| `post` | Post · 3:4 | 1080×1440 |
| `feed` | Ad · 4:5 | 1080×1350 |
| `story` | Story · 9:16 | 1080×1920 |
| `square` | Square · 1:1 | 1080×1080 |

Export is an off-screen 1:1 mount through `html-to-image`. The editor stage is CSS-scaled. Measuring text with `getBoundingClientRect` without dividing out that scale will overflow on export. `useFitLine` already divides by zoom. Do not regress it.

Tests: `node scripts/test-creative-studio.mjs` and `node scripts/test-ads-studio.mjs`.

PowerShell has no `&&`. Pipe a temp script with `Get-Content -Raw $env:TEMP\file.mjs | node --input-type=module` from `C:\code\musicbizqr` so `playwright-core` resolves.

---

## Families as they look now

Order in `features/ads/studio/families.js`: Artist Spotlight, Song Spotlight, Product Showcase, Typography Statement, Musician Education, Music Industry Insights, Show Promotion.

### Artist Spotlight — `artist-spotlight`

Photograph first, name second. Four styles on `content.style`:

| Style | Id | What it is |
| --- | --- | --- |
| Editorial Icon | `editorial` | Default for **new** creatives. Magazine masthead over a bleeding photograph. |
| Cinematic Immersion | `cinematic` | Full-bleed one-sheet. Type sits in the shade. |
| Contemporary Music Culture | `culture` | **Approved. Do not restyle.** Spine rail, placed print, name plus a thinner stroked echo. |
| Original | `legacy` | The first spotlight. Missing or unknown `style` renders as this. Do not migrate old records. |

Files: `features/ads/studio/templates/ArtistSpotlight.vue` and `templates/spotlight/`.

### Song Spotlight — `song-spotlight`

The artwork is the object. Non-square artwork keeps its own ratio. Do not force a square crop onto a portrait sleeve.

### Product Showcase — `product-showcase`

The phone is the hero. Hierarchy: dark field, headline, authentic page, close.

The artist-page excerpt is a tall phone that bleeds off the bottom in the Bleed variant. Song, fan list, shows, and gallery stay on the earlier sheet. Do not turn the page excerpt back into a wide card.

The phone shows photograph, name, short biography, featured song, and up to three real links (two on the square), in this order: Spotify, Apple Music, YouTube, website, Instagram, Facebook, TikTok. The editor field is `showcaseLinks`. The fan-list form is hidden inside the phone.

**Fidelity rule:** the Create card, a new creative from the same snapshot, and the PNG are the same picture.

- The gallery card uses `demoBadflowerSnapshot()`.
- "Continue without an artist" on this family uses that same fixture.
- The live `badflower` Strapi record is a stub ("This is the bio", "Some Song", no streaming URLs). `withDemoFallback()` fills only the empty fields from the fixture and keeps a real photo, biography, song, or link.
- Any other artist with a missing link gets no invented icon.
- Placeholder copy is stripped. **Ready** is refused while a frozen creative still contains it.

Shipped in `01189a8`.

### Typography Statement — `type-statement`

A brand manifesto. Line tones, optional photo veil, a call to action. Not an insight post.

### Musician Education — `education`

A multi-slide carousel. Square, post, and story only. Not a single-frame insight.

### Music Industry Insights — `insights`

Editorial, not an ad. No call-to-action pill. Wordmark and `faneqo.com` only.

| Style | Id | What it is |
| --- | --- | --- |
| Bold Insight | `bold` | Default. Setup lines in quiet gray. The last phrase is much larger, in the gradient. Optional support under a short rule. |
| Music Playbook | `playbook` | Category and a fading rule, white uppercase title, outlined `01`, sentence-case takeaway, quieter explanation. |

`01` is a design mark, not an editable number. A typed newline is kept. A one-word leftover is pulled onto the accent line. Missing `style` renders as Bold. There are no old records to migrate.

Create: `http://localhost:3000/ads/create?template=insights`

Shipped in `ba0f2d6`.

### Show Promotion — `show-promo`

Poster or ticket from a real event. Not part of the current visual pass. Do not redesign it while refining another family.

---

## Brand constants

- Type: Poppins 400 / 500 / 700 / 800. No second family.
- Accent: `#ff4ad8` → `#c084fc` → `#67e8f9`, once, on `width: fit-content`.
- Wordmark: `/faneqo-wordmark.svg`.
- Field: near-black `#050507` / `#070709`. Type `#f7f9fc`.
- At most two Faneqo mentions above the close on an artist-led template. Insights uses the wordmark as the signature and no pill.

---

## How to change a template

1. Name the family and the visual job in one sentence.
2. Look at the current render before drawing a new one. Routes are above.
3. Change the composition in that family's Vue file and its `LAYOUTS` numbers. Do not add a second renderer.
4. Render short copy, long copy, missing optional fields, and feed / square / story. Post 3:4 must still hold.
5. Export real PNGs from the editor. Dimensions must be exact. Preview and PNG must match.
6. Run both studio test scripts.
7. Delete any test creative.
8. Say what is still weak. Do not call a dark story safe-zone a bug.

Evidence belongs in `.visual-review/<family>/`. Do not commit those PNGs unless Nick asks.

---

## How to write the next agent prompt

A good prompt is one family, one visual job, the docs, the locks, and the proof.

Include:

- The sentence the viewer must get.
- Which family, which style, which formats.
- Sample copy, and the instruction that sample copy is editable content, not hardcoded.
- The research lesson to apply, by section of the benchmark, not by "make it like Spotify."
- What is locked: Culture spotlight, the phone (not the wide card), Insights as editorial, other families, RockSnaps, public pages.
- The fidelity rule when the task is a product or data creative: gallery card, created post, and PNG.
- Proof: browser renders, PNG dimensions, both test scripts, no commit unless asked.

Leave out: a new CMS, a new font, a new backend schema, a rewrite of the editor, and a request to "explore several directions" with no render.

The ChatGPT brief that produces those prompts is `docs/CREATIVE_STUDIO_CHATGPT_BRIEF.md`.

---

## Production

Frontend deploys from `main` on Railway.

- `ba0f2d6` — Spotlight styles, Product Showcase phone, Insights, studio uploads.
- `01189a8` — Product Showcase fidelity. Placeholder copy removed. Badflower demo fields filled only when empty.

Backend creatives already exist. This visual track did not add a schema. Do not deploy `qrserver` for a template change.

---

## Still weak

- Insights stories are airy under the type because the signature sits above the story chrome.
- Bold headlines still wrap by measure. A newline the author types is honored.
- The Playbook number is always `01`.
- Product phones with no song and no links are mostly photograph. That is honest, and it is quieter than the gallery card.
- Cinematic spotlight trusts the focal point. A dishonest focal can cover a face.
- Culture's echo is `-webkit-text-stroke`. It exports in Chrome.
- Face protection is the focal point. There is no face detection.
