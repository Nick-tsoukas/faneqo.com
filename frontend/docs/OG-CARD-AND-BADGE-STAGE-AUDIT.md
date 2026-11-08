# Default social card + badge modal presentation — audit

**Date:** July 31, 2026
**Scope:** two pieces of fan- and public-facing presentation work:
the site-wide default OG/social image, and the layout of the Show Mode badge modal.
**Not in scope:** the generated badge image itself, badge canvas generation,
share/download/copy tracking, check-in logic, Show Recap, messaging, homepage.

Written to be handed to someone with no prior context. It records what was
wrong, what changed, how it was verified, and what is still open.

Related: [`SHOW-CHECKIN-MODAL-AUDIT.md`](./SHOW-CHECKIN-MODAL-AUDIT.md) (the
check-in/badge split this continues), [`SHOW-MODE.md`](./SHOW-MODE.md) (the
whole system).

---

## 1. TL;DR

Two files changed. Both changes were verified by rendering in a real engine
rather than by reading CSS, and in both cases that turned up defects that
static reading had missed.

**`server/api/og/site.png.ts`** — the image every Faneqo link shows when shared
anywhere without a more specific OG image. It still rendered `MusicBizQR` as a
72px wordmark over `Scan • Listen • Follow`, a QR glyph as the hero, and three
emoji pills. This was the open item flagged at the end of
[`SHOW-CHECKIN-MODAL-AUDIT.md §11`](./SHOW-CHECKIN-MODAL-AUDIT.md). Fully
redesigned. Separately, a latent bug was found: the font loader accepted a
weight argument and ignored it, so **nothing on the old card was ever actually
bold** despite three weights being registered.

**`components/band/ShowCheckInBadgeModal.vue`** — the dedicated badge surface
created by the earlier split. Correct architecture, wrong presentation: a
620px vertical card that overflowed and showed a scrollbar at normal desktop
heights, with a 380px badge preview that read as an afterthought. Rebuilt as a
two-column "badge stage" on desktop and a full-bleed screen on mobile, with the
preview promoted to 480px. Verified as scroll-free at five viewport sizes.

---

## 2. Part A — the default social card

### 2.1 What it is and how it is generated

`GET /api/og/site.png`. Referenced by `pages/index.vue` as both `og:image` and
`twitter:image` at `https://faneqo.com/api/og/site.png`. The route contract is
unchanged by this work.

The pipeline was already in place and was kept:

```
satori(objectTree, { width, height, fonts })   → SVG string
new Resvg(svg, { fitTo: width }).render()      → PNG buffer
setHeader Content-Type / Cache-Control          → 1 day browser, 7 days CDN
```

Satori takes a plain JS object tree, not JSX, and supports only a subset of
CSS: flexbox, gradients, borders, border-radius, box-shadow, letter-spacing.
**There are no blur filters**, which is why every glow on the card is a
`radial-gradient` fading to `transparent` rather than a blurred circle.

Three sibling routes use the same pipeline and are untouched:
`og/band/[...slug].ts`, `og/moment/[...slug].ts`, `og/shareable/[...slug].ts`.

### 2.2 What was removed

| Removed | Why |
|---|---|
| `MusicBizQR` 72px wordmark | Old brand |
| `Scan • Listen • Follow` | Old positioning — Faneqo is no longer QR-first |
| 120px QR-code glyph as hero | Made the product look like a QR generator |
| `🎵 Smart Links` / `📊 Analytics` / `🎨 Custom QR Codes` emoji pills | Emoji render inconsistently in Satori and read as clipart |

No `MusicBizQR`, `musicbizqr` or `MBQ` string remains in the file.

### 2.3 Final copy

```
BUILT FOR ARTISTS                    (pill, neon green)
● Faneqo                             (54px / 800)
Bands don't need more links.         (38px / 800, solid white)
They need fans they can reach again. (38px / 800, gradient text)
Artist pages · show check-ins · fan messaging · analytics
faneqo.com                           (neon green)
```

Right-hand visual: an artist-page card sitting in front of three concentric
echo rings, carrying a `SHOW MODE LIVE` pill and a small green equaliser glyph,
with `Check-ins` / `Fan list` / `Recap` chips beneath. It is meant to read as
artist page → live check-in → recap, without any QR code being the message.

The chips are label-only on purpose. Fake metrics ("128 check-ins") would have
looked more alive but would be an invented number on the brand's own card.

### 2.4 Design decisions worth knowing

**Gradient text is used on exactly one line.** `backgroundClip: 'text'` with
`color: 'transparent'` is already used in production by `og/shareable`, so it
is proven against this Satori version. But if it ever silently fails, the text
renders invisible. Headline line 1 is therefore solid white: the worst case
still leaves a card that reads "Faneqo / Bands don't need more links." plus the
supporting line and footer.

**The echo rings are deliberately narrower than the card in front of them**
(300/240/180 against a 330px card). Two earlier iterations had the card edges
land tangent to a ring — first the outer, then the middle — which is the one
relationship that always looks like a mistake rather than a choice.

**The headline is 38px, not 44px.** At 44px the second line wrapped and left
`again.` orphaned on a line of its own, and the gradient never travelled far
enough to reach its green stop. Dropping to 38px in a 750px column puts each
line on one line and lets the gradient run pink → violet → green across the
full sentence.

### 2.5 The font bug

The old loader:

```ts
async function loadFont(weight = 400): Promise<ArrayBuffer> {
  const url = `https://fonts.gstatic.com/s/inter/v13/UcCO3F...woff`   // ← weight unused
```

`weight` was accepted and never referenced. All three registrations (400, 700,
800) received the same regular-weight file, so Satori had no bold glyphs to
match and the 72px wordmark rendered at regular weight. This is a fidelity bug
that predates the redesign and would have quietly undermined any new design.

Now fixed via a per-weight source table using the jsdelivr Fontsource CDN
(already used as a fallback in `og/band`), with the original gstatic URL kept
as the 400 fallback. The three fetches also now run in parallel rather than as
three sequential awaits.

The old failure path returned an empty `ArrayBuffer`, which Satori would have
thrown on anyway. Missing weights are now filtered out, so a partial CDN
failure degrades to a nearby weight instead of breaking; only a total font
failure throws.

**Residual risk:** fonts are still fetched from a public CDN at request time.
If both sources are unreachable from the production host the route 500s and the
social card is absent. Every OG route in this repo shares that property, so it
is pre-existing rather than introduced — but it is the single most likely cause
of a future "our link preview disappeared" report.

### 2.6 How it was verified

Not by reading the code. A throwaway [jiti](https://github.com/unjs/jiti)
harness imported the **actual route handler**, called it with a mocked H3 event,
and wrote the PNG to disk for visual inspection. Four render passes were needed
before the composition was right.

Confirmed: PNG signature valid, `1200 × 630` read from the IHDR chunk, correct
`Content-Type` and `Cache-Control` headers, no server errors, and no
unsupported CSS silently dropped.

**Not verified:** how it looks in an actual Twitter/X, Facebook, LinkedIn,
Slack or iMessage preview; and behaviour when the font CDN is blocked.

---

## 3. Part B — the badge modal presentation

### 3.1 Starting point

The two-surface architecture from the previous audit was already correct and
was not changed:

```
ShowCheckInModal success  →  "Get Your Badge"  →  ShowCheckInBadgeModal
```

Both are mounted at page level in `pages/[bandSlug]/index.vue`, which owns
which one is open. The page passes only data props — no shell classes — so
**every change in this pass is contained in the one component file.**

The problem was presentation. The badge modal was still shaped like the form
modal it was extracted from: `max-width: 620px`, a single vertical scroll
column, and a badge preview capped at 380px. At a 700px-tall desktop window the
content ran roughly 774px against ~668px of available height, so it overflowed
and showed a scrollbar. A fan who just unlocked a reward was being handed a
cramped scrolling form.

### 3.2 Desktop (≥768px) — the badge stage

Two columns: badge left, everything actionable right.

| | Before | After |
|---|---|---|
| Card max-width | 620px | 1000px |
| Card max-height | `100%` of an 8px-padded overlay | `calc(100dvh - 32px)` |
| Badge preview | 380px | **480px** |
| Panel | stacked under badge, centred | right column, left-aligned |
| Scrollbar at 700px height | visible | none |

The right column holds the heading, the verified pill, the share actions and
Done, vertically centred as a group against the badge.

**The column split is proportional (55/45, panel capped at 360px), not a fixed
panel width.** The first implementation used `flex: 0 0 360px`, which is fine
at 1280px but at the low end of the breakpoint left the badge at 268px against
a 360px panel — the panel would have been *wider than the badge*, inverting the
hierarchy on exactly the surface whose entire point is that the badge is the
hero. This was caught by measuring at 768px, not by reading the CSS.

### 3.3 Mobile (<768px) — full-bleed

`height: 100dvh`, no border radius, badge first as the hero. Safe-area insets
are honoured on the top bar height, the close button offset, and the bottom
padding.

The badge appears **above** the "Your show badge is ready." heading, which is a
deliberate inversion of the old order: the fan has just tapped "Get Your
Badge", so the payoff should be the first thing on screen. This is a product
judgement and is easy to flip if it reads wrong in the room.

### 3.4 How the no-scroll guarantee actually works

All sizing lives on one wrapper, `.badge-frame`:

```css
width: max(200px, min(100%, 420px, calc(100dvh - 400px)));
aspect-ratio: 1 / 1;
```

The badge is square, so constraining **width** by the viewport height is what
keeps it square while still bounded by the column. The subtracted constant is
the fixed chrome around it — top bar, copy, verified pill, action buttons,
Done, padding. On a short screen the badge shrinks instead of forcing the modal
to scroll. The `max(200px, …)` floor means a genuinely tiny viewport scrolls
rather than rendering a postage stamp.

Desktop uses the same shape with `480px` and `calc(100dvh - 170px)`, the
smaller constant reflecting that the panel sits beside the badge rather than
beneath it.

The scroll container remains as a safety net for extreme heights, now with a
thin custom-styled scrollbar. `.badge-body` uses `margin: auto 0` inside a flex
column rather than `justify-content: center`, because centring with
`justify-content` clips the top of overflowing content and makes it
unreachable — the same class of bug as the original check-in modal failure.

### 3.5 Measured results

Rendered in a real browser and measured, not estimated. `scrolls` compares
`scrollHeight` to `clientHeight`; `docW` is `documentElement.scrollWidth`,
where any value above the viewport width would mean horizontal overflow.

| Viewport | State | scroll/client | scrolls | Badge | docW |
|---|---|---|---|---|---|
| 1280 × 700 | ready | 516 / 516 | **false** | 480 | 1280 |
| 1440 × 900 | ready | 516 / 516 | **false** | 480 | 1440 |
| 768 × 800 | ready | 380 / 380 | **false** | 344 | 768 |
| 390 × 844 | ready | 800 / 800 | **false** | 350 | 390 |
| 390 × 667 | ready | 623 / 623 | **false** | 267 | 390 |
| 1280 × 700 | no native share | 516 / 516 | **false** | 480 | 1280 |
| 1280 × 700 | failed | 358 / 358 | **false** | 300 | 1280 |

No scrollbar and no horizontal overflow in any tested state, including iPhone
SE height where an earlier static estimate had predicted overflow.

### 3.6 Two defects found during verification

**The failure state was a monument to the missing image.** The broken-image
placeholder inherited the hero's 480px footprint, so a failed generation
produced a giant empty dashed box dominating the card. A `badge-frame--empty`
modifier now caps it at 300px desktop / 260px mobile, and the card shrinks from
516px to 358px of content. Failure should be quiet, not the largest thing on
screen.

**`.failure-copy` was clamped to `max-width: 34ch`.** Sensible when the copy
was centred on mobile; in the left-aligned 360px desktop column it forced an
awkward two-line wrap at roughly 238px. The cap is lifted on desktop.

### 3.7 Deliberately unchanged

Everything the brief ring-fenced, verified as untouched:

- badge canvas generation, the 4.5s timeout, and the run token
- `canNativeShare` and the desktop fallback — re-verified in browser: with
  `navigator.share` absent, Share Badge is gone and Download renders as the
  gradient primary beside Copy Link
- tracking — still completed actions only, still `clicked_share` +
  `metadata.shareType`
- the generated badge image itself

**Accessibility is intact.** `role="dialog"`, `aria-modal`, `tabindex="-1"`,
the dialog ref, `useFocusTrap`, Escape and focus restoration are all unchanged.
The trap resolves focusables by querying the dialog root and filtering on
`getClientRects()`, so it is structure-agnostic and the template restructure
cannot affect it. Tab order is unaffected by the two-column layout because the
badge stage contains no focusable elements: it remains close button → Share →
Download → Copy Link → Done, matching visual order in both layouts.

### 3.8 How it was verified

A throwaway harness extracted the component's **real scoped CSS** from the
`.vue` file (rather than a hand-copied duplicate, which would drift) and
injected it into static markup for each state, served over localhost, then
measured and screenshotted at each viewport via CDP.

**Not verified:** the real Vue component running in the real app. The harness
used a stand-in square SVG in place of the generated 1080×1080 badge — since
that is square and displayed with `object-fit: contain`, it sizes identically,
but the live path has not been clicked through. The focus trap was not
re-exercised interactively; the reasoning above is from code, not observation.

An initial attempt to delegate this QA to a browser subagent failed: it could
not open `file://` URLs and returned a confident static analysis in place of
measurements, including a prediction that mobile 390×667 would scroll. It does
not. That prediction was discarded and the checks were re-run over HTTP against
the real thing.

---

## 4. Open items

**Other social surfaces still carry old positioning.** Out of scope here, each
wants its own pass:

| Surface | Issue |
|---|---|
| `composables/useShareKit.js` | three `Scan • Listen • Follow` canvas draws |
| `utils/fanShare/imageGenerator.js` | one `Scan • Listen • Follow` draw |
| `components/shareables/ShareCustomizeDrawer.vue` | tagline in the preview label |
| `pages/share/band/[bandSlug].vue` | falls back to the tagline as a band description |
| `pages/oldpages/index-old.vue` | OG tags still point at `musicbizqr.com/api/og/site.png` — archived page, left alone rather than guessed at |

**The generating state leaves the desktop right column sparse** — heading and
Done only, for up to 4.5s. Acceptable, but it is the weakest frame in the flow.

**The badge image redesign is still pending** and is the natural next task:
composition, full-bleed layout, typography hierarchy, the "I WAS THERE"
treatment. This pass deliberately changed only the surface the badge sits on,
so that work now has a stage worth putting something good on.

**Font CDN dependency** (§2.5) applies to all four OG routes and would be worth
addressing once, globally, by vendoring a subset font into the repo.
