# Faneqo /home-v2 — ChatGPT design brief

Copy everything below the line into ChatGPT. Attach the numbered PNGs in this folder, in order.

---

You are a world-class product designer and art director. You are helping paint and improve a live landing page for **Faneqo**, a premium music-first artist page and fan-relationship platform.

You are NOT writing code. You are producing:

1. A brutally honest visual audit of the current page (from screenshots + this spec).
2. An art-direction plan for the next landing-page paint.
3. Section-by-section visual direction: composition, type, color, crop, motion, what to keep, what to kill, what to redesign.
4. Mobile-first frames (390 / 430) then desktop.

Do **not** invent a new product story. Do **not** rebuild the failed experimental V2 (Sarah narrative, product theater, pinned/scrubbed chapters, full-page cinematic world). Polish this clone of the proven homepage. Borrow only **typography confidence**.

North star reaction from a musician in a few seconds:

> That looks incredible. I want that for my band. It does more than Linktree.

---

## Product

**Faneqo** (public brand). Positioning:

**Bands don't need more links. They need fans they can reach again.**

That thesis is **locked**. You may change line breaks, scale, color, spacing. You may not rewrite the meaning.

Not a generic link-in-bio clone. Audience: musicians, bands, managers. They decide in a few seconds. Primary viewports: **390 and 430 first**, then desktop.

The conversion asset people actually like: **one phone showing a real Faneqo artist page** (demo artist: **BADFLOWER**).

URL of the experimental page: `/home-v2` (noindex). Production `/` must not change.

---

## Hard constraints

- Natural document scroll only. No pin, no scrub, no chapter rails.
- Demos are presentational only.
- Do not restyle live artist pages, Fan Intelligence product UI, messaging product, payments, or production `/`.
- Do not add a full-page atmosphere layer that follows the user (old `CinematicArtistWorld` was killed for cost and taste).
- Local section atmosphere only: CSS radial glows, transform/opacity. No canvas particles, no WebGL, no live blur.
- Green is **success after it happened**, not generic button fill, not giant neon fog.
- Feel: concert light + digital signal + premium dark product. Not black/white + one accent. Not rainbow SaaS. Not hacker UI.

Failed direction to **never** return to:

- Custom experimental hero with GSAP chapter narrative
- Fragmented headquarters
- Sarah story scenes
- Product theater
- Floating feature-list clutter around the phone
- Looping HUD animations
- Full-page blurred posters / glow orbs / scanlines following scroll

---

## Color system (locked meaning)

**Darks**
- `#050608` page
- `#0B0E14` elevated
- `#111722` cards / selected fills

**Text**
- `#F7F9FC` primary
- `#9AA6B5` secondary

**Spectrum**
- Hot pink `#FF4FD8` → violet `#8B6CFF` → blue `#4CA6FF` → cyan `#39D5FF` → sea `#45E3AE` / success `#62F29D`

Meaning:
- **Violet / magenta** = artist / music / brand
- **Blue / cyan** = signal / communication / fans
- **Green** = connection / action / success after it happened

Color should follow story:
- Hero: magenta on **more links.** ; blue→cyan→green on **they can reach again.**
- Show Mode: warmer (concert)
- Fan List / Messaging: cooler (signal)
- Artist proof: photography provides color
- Final CTA: may use one signature gradient phrase

Current CTA button (keep family, may refine):
- Fill `linear-gradient(to right, #ec4899, #a855f7)`
- White type, ~48px height, radius 12px, pink glow shadow
- Label: **Start free** or **Create your artist page**

Editorial support buttons (HQ lite only):
- Dark fill `#111217`, white type
- 1px spectrum edge (pink→violet→blue) at low opacity
- Selected amount: `#111722` fill, blue/cyan border — not a purple pill

---

## Type system (current)

Font: site sans (system/UI sans, weight 800 for display).

**Hero H1** (locked copy, 4 forced wraps):
```
Bands don't need
more links.
They need fans
they can reach again.
```
- Mobile: `clamp(2.55rem, 11.2vw, 3.15rem)` — live at 390px: **43.7px**
- Desktop: `clamp(3.55rem, 4.8vw, 4.85rem)` — live at 1920px: **77.6px**
- Weight 800, line-height ~0.88–0.90, tracking about `-0.052em` to `-0.056em`
- `more links.` = violet→magenta gradient
- `they can reach again.` = blue→cyan→sea gradient

**Section titles**
- `clamp(2.15rem, 8.2vw, 3.2rem)` mobile, `clamp(2.7rem, 3.8vw, 3.45rem)` desktop
- Weight 800, line-height ~0.92–0.94, tracking about `-0.045em`

**HQ title**
- `clamp(2.55rem, 9.4vw, 3.85rem)`, same poster treatment
- `headquarters.` = magenta accent

**Kickers**
- 11px, uppercase, letter-spacing `0.18em`, pink `#F472B6` / gray `#9AA6B5`

**Body / note**
- Hero note 13px `#9AA6B5`: “Free account. Pro included for 30 days.”

Motion: short phrase-mask reveals (~0.48s). First paint can look empty until type slides in — that is a real first-impression risk.

---

## Current page architecture

Sticky **app header** (problem): Faneqo logo + “Your Band's Headquarters.”, Home / Home V2 / Signup / Login, search “Search bands… ⌘K” with cyan/green glow, saved bookmark. This is product chrome on a marketing page.

Then, in order:

### 1. Hero
Copy: locked thesis + **Start free** + trial note.
Desktop only: clipped compact Badflower phone + two static relationship cards:
- `NEW FAN JOINED / Sarah M. / via show QR` (cyan kicker)
- `FAN CAME BACK / Nashville / 2nd show` (green kicker)
No mobile HUD. Soft local violet/cyan atmosphere. No looping floats.
Mobile: type + CTA only, then HQ phone becomes the product visual.

Live sizes @ 1920×1080: hero **720px**. @ 390: hero **353px**.

### 2. Headquarters
Kicker: `ARTIST PAGE`
Title: `Your band’s headquarters.`
One centered phone, lite Badflower profile:
- Photo crop (mobile hero ~13.25rem, `object-position: center 22%`)
- BADFLOWER name
- Custom Ghost player
- Video
- 2 streaming cells (Spotify, Apple Music)
- 3 social icons
- Full Support module, compact, `tone="editorial"` (tips $5/$10/$20/Custom, merch table, pay entry)
- Faneqo logo
Hidden in lite: genre chip, bio, Featured labels, website, merch store link, fan-list form, Follow/Save/Share, upcoming shows, extra streaming/social, Spotify iframe.
No floating feature cards.
Stage lights: 3 clipped radial beams (hot pink/violet, blue/cyan, faint sea), CSS only.

Live sizes: HQ **2151px desktop / 1837px mobile**. That is ~26–28% of the whole page.

### 3. Live Show Mode
Kicker: `LIVE SHOW MODE`
Title: `Turn every show into fans you can reach again.` (pink→violet on the payoff)
Refined: no body paragraph. 4 step chips (desktop/sm): Show Mode on / Fans check in / Show Recap / Message the Room.
Visual: square **I WAS THERE** verified-attendee badge (BurningThunder @ The Vic — Chicago).
Then a “Message the Room” band: `After the show, message the whole room.` + post-show message UI + `42 in the room`.
Another **Start free**.
Atmosphere: dark + fuchsia wash (refined removed emerald fog).
~1047px desktop.

### 4. Fan Intelligence
Kicker: `FAN INTELLIGENCE`
Title: `Build a fan list you can actually use.` (pink→purple on payoff)
Demo dashboard: loud **pink→purple header bar**, 127 fans · 38 engaged, Import/Export/Analytics, metric tiles (Fans collected magenta, Top source cyan Show QR, Engaged violet, Superfans green), filter pills All/Superfans/Engaged/Warm/New, fake fan rows (Sarah M. Nashville Superfan, etc.), insight: “Your Show QR is creating the warmest fans this week…”
~1213px desktop.
This still looks like cloned SaaS marketing, not the cooler “signal” story.

### 5. Messaging
Kicker: `STAY CONNECTED`
Title: `Turn fans into real conversations.` (pink→fuchsia→purple)
Inbox / Campaigns product demo. Inbox: Sarah Miller Nashville Superfan, empty chat pane, “Message Sarah…”. Campaigns: “Photos from Nashville”, “New tour dates are live”, 428 recipients, green Completed.
Refined: body copy removed. Quiet fuchsia wash. Green still used on tabs, New Message border, completed checks.
~848px desktop.

### 6. Real artist proof (SHOULD exist, was MISSING in the live capture)
Kicker: `Real artists. Real Faneqo pages.`
Title: `See what your band could look like.`
Carousel of live Faneqo artist phones + “View live Faneqo page”.
**Live bug:** section unmounts when showcase artists fail to load (`showSection` is false if not pending and list is empty). In this capture the page jumped from messaging to the close CTA. That is a conversion hole.

### 7. Close CTA
Photo background `aisix.png` with heavy black/pink overlays.
Title: `Your band could be next.` (`next.` pink→fuchsia→purple)
CTA: `Create your artist page`
In the live screenshot the photograph barely reads — it looks like a dark void with type. ~325px.

### 8. FAQ
`Frequently asked` — six accordions:
- Is Faneqo free?
- Is Faneqo a Linktree alternative?
- Can I use my existing links?
- How does Show Mode work?
- Do I own my fan list?
- Can fans support or pay the band through Faneqo?
Dark cards, white type, chevrons.

### 9. Footer
Logo, © 2026, Privacy / Terms / Contact, SEO paragraph about smart links / QR / Linktree alternative.

Whole page live height: **8329px desktop / 6670px mobile**.

---

## Screenshot map (attach these)

1. `01-desktop-hero.png` — thesis + Start free + Badflower phone + two HUD cards
2. `02-desktop-hq-title.png` — HQ title + phone crop starting
3. `03-desktop-hq-profile.png` — lite profile: photo, Ghost, video, streaming, social, support start
4. `04-desktop-hq-support.png` — merch table + pay entry (this is why HQ is so tall)
5. `05-desktop-show-mode.png` — I WAS THERE badge + Message the Room
6. `06-desktop-fan-intelligence.png` — CRM dashboard demo
7. `07-desktop-messaging-inbox.png` — inbox with empty thread
8. `08-desktop-campaigns.png` — campaigns list (artist proof missing after this)
9. `09-desktop-cta-faq.png` — close CTA + FAQ (photo not reading)
10. `10-mobile-hero.png` — 390px thesis, CTA, HQ phone starting under it

---

## What is working (keep)

1. **The thesis.** Best line on the page. Split color (reject vs payoff) is the strongest brand idea.
2. **Poster type.** Heavy, tight, wrap-forced. Mobile 44px still has punch. Do not go back to polite SaaS headlines.
3. **One real artist phone** as the product, not illustrations or bento grids.
4. **Desktop HUD cards** (static, one-shot): they explain “more than Linktree” without a paragraph.
5. **Show Mode badge** (“I WAS THERE”) is the most *music* visual on the page. Protect this energy.
6. **Editorial support chrome** (dark buttons, spectrum edge, cyan selected $5) is more premium than old purple pills. Keep the *language*, not the three-card length.
7. **Short copy in Hero.** Feature lists and “See how it works” were correctly removed.
8. **Spectrum as meaning**, not decoration — when it is actually used that way (hero). Later sections forget this.

---

## What is weak (fix in the paint)

Ranked.

**P0 — conversion / composition**
1. **Headquarters is a scroll tax.** 2151px desktop / 1837px mobile of one phone. Support restored all 3 cards (tips + merch + tickets). The phone stopped being a hero object and became a long webpage inside a webpage. Redesign HQ as a **composed crop**, not a full lite page dump.
2. **Hero desktop phone is a clipped full profile**, not a designed preview. Compact still contains bio, website, fan list, Follow/Save/Share, full support. The frame just overflow-hides it. It feels accidental. Design a hero crop: photo + name + Ghost + maybe one more beat.
3. **Artist proof vanished** when data failed. The page has no “real bands on Faneqo” moment in this capture. Close CTA then feels unearned.
4. **Close CTA photograph is crushed.** Heavy black overlays kill the concert image. The section should feel like a show, not a black slab with a gradient word.

**P1 — brand / hierarchy**
5. **Color story stops after the hero.** Show Mode, Fan List, Messaging, CTA still use the same pink→purple marketing gradient on every title. Fan Intelligence header is a loud magenta bar. Messaging uses product-green chrome. The page does not *travel* from artist heat → show warmth → signal cool.
6. **Fan Intelligence looks like a CRM template**, not a band tool. Pink header, import/export, five filter pills, five identical rows. A musician does not feel “I want that.” They feel “admin software.”
7. **Messaging empty state.** The most important pane (the conversation) is blank. Campaigns list is more convincing than Inbox.
8. **App header on a landing page.** Search with cyan glow, Home V2, hamburger, Saved. It steals attention from Start free and makes Faneqo feel like an already-logged-in product, not a premium arrival.
9. **Support $1 merch amount** looks broken / demo-jank.
10. **Too many Start free** (hero, Show Mode, close). Repeat is fine if each earns it; Show Mode’s extra CTA competes with the badge.

**P2 — craft**
11. Hero type-in can leave a blank left column for a beat (first screenshot in the session caught empty H1).
12. Desktop HUD cards may collide with the phone around 1024px.
13. Mobile HQ face crop still needs a 390px eye-check (object-position 22%).
14. Spectrum `mask-composite` button edges — Firefox risk.
15. FAQ is correct but visually generic (white/15 cards on black).
16. Page is very long (~8.3k px). After HQ, energy drops. Proof and close should hit sooner.

---

## Composition notes from the live page

**Desktop 1920 hero**
- Split: left type, right phone ~400–440px.
- Soft violet orb upper-left, cyan orb behind phone. Atmosphere is correctly *local* and quiet.
- Phone sits in lots of black. HUD cards do the storytelling.
- CTA is the loudest left-side object after type.
- HQ title appears while hero phone is still on screen — two Badflower phones can stack in the mind (hero clipped + HQ full). That duplication is expensive.

**Mobile 390 hero**
- Thesis fills the fold with HQ kicker + photo already peeking. Good: product is not missing.
- No HUD cards. The phone *is* the proof.
- Then the user must scroll a tall lite page (player, video, streaming, social, three support cards) before Show Mode. That delay is the core rhythm problem.

**Show Mode**
- Best section after hero. Badge has photography, green “verified” used correctly as success, pink kicker, tight steps.
- Message-the-room band below is a second demo in the same section — slightly greedy but on-story.

**Fan Intelligence / Messaging**
- Centered product chrome on black. Competent, not desirable. They explain features; they do not make a band want a page.

**Close**
- Type and button are fine. Missing atmosphere from the photo. No artist proof immediately before it in this capture, so “Your band could be next” has nothing to be next *to*.

---

## What to paint (your job)

Give me an improved landing **paint**, not a new company.

Deliver:

### A. One-page art direction
3–6 sentences. How Faneqo should feel in 2026. Reference: concert light, tour poster, premium phone, signal — not Linear, not Linktree, not Spotify Wrapped pastiche.

### B. Rhythm
A scroll map for 390 and desktop:
- What is in the first 800px
- What the user should feel at 2s, 8s, 20s
- Target section heights (HQ must get much shorter)
- Where CTAs live (max 2–3)

### C. Hero paint
Keep the locked lines. Direct:
- Type scale / wraps / color split
- What the phone crop contains (and what is forbidden inside the crop)
- Whether HUD cards stay, move, or become one card
- Header treatment for marketing vs app
- Atmosphere (how much glow is enough)

### D. Headquarters paint
How to show “the whole product” without a 2000px phone.
Options you may choose among (pick one and specify crops):
- Designed device frame with a **hero crop** + 2–3 peeking modules
- Phone that is visually complete but content is a **curated stack** (photo, player, 2 links, one support card)
- Side-by-side desktop: phone + 3 tiny capability stills
Do not recommend returning full bio/fan-list/follow chrome.

### E. Show → List → Message
Apply the color story. For each: kicker color, title treatment, one product visual, what to strip. Fan Intelligence especially needs to stop looking like a SaaS dashboard clone.

### F. Proof + close
How to make “See what your band could look like” unkillable even if data fails (designed fallback). How to let the close photograph actually show. CTA label.

### G. Mobile 390 wire in words
Fold 1, fold 2, fold 3. Be specific (what is on screen).

### H. Do / don’t list
10 of each, concrete.

Also call out any screenshot that contradicts this spec.

Be opinionated. Prefer one strong composition over five features. If something is “pretty but Linktree-ish,” say so.
