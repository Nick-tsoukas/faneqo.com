# Faneqo Product & Design North Star

**READ THIS DOCUMENT BEFORE ANY SUBSTANTIAL FANEQO FRONTEND DESIGN OR UI WORK.**

Faneqo turns the real relationship between an artist, a Night, and the people in the room into something they can communicate, revisit, and keep.

This file is the canonical visual / UX / product-design doctrine for Faneqo. Token-level language stays in `docs/design/FANEQO_VISUAL_LANGUAGE.md`. Architecture stays in `docs/FANEQO_RELATIONSHIP_PLATFORM.md`. Product direction stays in `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`. Live status stays in `docs/FANEQO_CURRENT_PHASE.md`.

Do not invent a second design language.

---

## Document hierarchy

These four files are the durable product knowledge system. **Older docs may contain history. They must not override these four.**

| Order | File | Job |
| --- | --- | --- |
| 1 | `docs/FANEQO_DESIGN_NORTH_STAR.md` | Durable design and product principles |
| 2 | `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md` | Durable product direction and major future phases |
| 3 | `docs/FANEQO_CURRENT_PHASE.md` | What is happening **now** |
| 4 | `docs/FANEQO_NEXT_AGENT_HANDOFF.md` | Exact continuation for the next working session |

If an older audit, visual-language note, messaging plan, or historical product brief conflicts with these four, the four win. Do not delete history casually. Do not resurrect superseded direction.

---

## Before you edit

Future agents and Cursor sessions must:

1. Read this document first.
2. Read the master roadmap, current phase, and handoff. Precedence when they disagree: `AGENTS.md`.
3. Audit the current **local** screen before editing.
4. Preserve working product logic.
5. Apply these principles rather than inventing a new design language.
6. Challenge existing SaaS / dashboard patterns when they conflict with this direction.
7. Prefer iterative visual passes over giant speculative rewrites.
8. Treat mobile as a primary product surface. **390px is the canonical canvas.**
9. Preserve unrelated dirty work.

```
git status --short
```

Never automatically reset, restore, stash, or clean. Read LOCAL files, not only GitHub / main. Do not let visual work break backend or product contracts.

If a composition is **LOCKED**, do not structurally reopen it unless there is a real defect, usability issue, accessibility issue, responsive regression, or hierarchy regression.

---

## What Faneqo is

Faneqo is the digital world around:

```
ARTISTS
  → NIGHTS
  → FANS
  → PHOTOS / STORY / MESSAGES
  → RELATIONSHIP
  → MEMORY
```

It is not primarily a dashboard. It is not a generic link-in-bio tool. It is not a CMS.

Artist perspective: **"We made this Night."**  
Fan perspective: **"I experienced this Night."**

The interface should disappear enough that the artist, the music, the photographs, the show, the fans, and the memory become the experience.

### Core product test

Would an artist open Faneqo the morning after a show because they **want** to see their Night?

If the answer is no, the screen is not finished.

### The most important principle

**Faneqo should make the relationship feel real.**

Artists should feel: these are our fans, this was our night, this is our history.  
Fans should feel: I was there, I came back, this artist remembers me, these moments belong to my history.

---

## Temporal model

The product is one continuous experience, not separate tools.

| Mode | Verb | What happens |
| --- | --- | --- |
| **BEFORE** | Manage | Artist prepares. The Night can exist. Fans can discover. |
| **DURING** | Live | Show Mode. Check-in. Operate the live moment. |
| **AFTER** | Remember | Show Recap. Public Night. Galleries. Messages. Passport. Relationship continues. |

---

## Core product loop

```
ARTIST
  → SHOW MODE
  → NIGHT
  → FAN CHECK-IN
  → STORY / LINEUP / POSTER
  → GALLERIES
  → MESSAGES
  → FAN EXPERIENCE
  → PASSPORT
  → RELATIONSHIP CONTINUES
```

Every major screen should reinforce this loop. No dead ends. No duplicate concepts. No fragmented workflows.

---

## Artist World

Reuse the **Artist World**, not an “Artist Page template.”

There is one Artist World with different rooms.

| Room | Job |
| --- | --- |
| **Artist Page** | Who are we? |
| **Show Mode** | Operate the live moment |
| **Show Recap** | Artist remembers / completes the Night |
| **Public Night** | Fan experiences the Night |
| **Gallery** | Photographic chapter |
| **Messages** | Relationship communication |
| **Fan Passport** | Relationship meaning / memory |
| **Share Kit** | Export the Artist World / Night into social contexts |

The Artist Page is **not** the entirety of Faneqo. It is one window into the Artist World.

Do not design rooms as ten disconnected SaaS modules. They should feel connected.

Public Night is the fan-side version of the same Night the artist made.

- Admin: “We made this.”
- Fan: “I experienced this.”

**Preview Fan View uses the real Public Night.** No parallel preview implementation.

---

## Design character

Design should feel:

minimal · expensive · precise · native-feeling · dark · calm · cinematic · personal · music-native · editorial · relationship-centered

Avoid:

- generic SaaS dashboards
- nested card soup
- gray slabs
- glow
- gradient CTA soup
- neon wallpaper
- tiny important text
- status-chip overload
- long explanatory UI copy
- decorative motion
- glassmorphism for its own sake

Cinematic means composition, photography, scale, type, contrast, timing, and space — not glow, gradient, blur, particles, parallax, or Rive-for-personality.

---

## What “expensive” means

**Expensive does not mean more effects.**

Not more blur. Not more shadows. Not more gradients. Not more animation. Not more 3D.

Expensive means:

- precision
- restraint
- spacing
- typography
- photography
- hierarchy
- interaction states
- continuity
- performance
- accessibility

Photography and artist identity should beat chrome. Every visible element should feel chosen.

---

## Color

**FANEQO COLOR IS EARNED, NOT WALLPAPER.**

**WHITE IS EARNED TOO.**

| Role | Use |
| --- | --- |
| Near-white | Primary content. Primary action. Important completion prompts. |
| Secondary gray | Supporting information. Venue / date. Roles. Descriptions. |
| Muted gray | Tertiary metadata only. |

**GRAY IS FOR HIERARCHY, NOT DECORATION.**

Important action-leading text must never look disabled. Story / Lineup / completion actions must not be muted into supporting gray.

Use Faneqo pink / violet / cyan as precision color: logo, focus, selection, relationship moments, important states, small meaningful accents.

Do **not** use neon green as current brand identity. Legacy `.btn` neon and older “app signal green” notes are historical. They do not override this document.

Do not spray gradients over the application.

### Primary actions

Strong actions do not automatically need brand purple.

When appropriate:

- **Primary** — near-white background, dark text
- **Secondary** — dark surface, subtle border, near-white text

Accent color is used when meaning benefits from it. Avoid CTA soup.

---

## Typography

Typography should do much of the visual work: strong hierarchy, tight display tracking, comfortable body line-height, clear metadata, large readable labels.

Avoid important 11–12px copy. A musician should understand important UI at arm's length.

Existing family: **Poppins** (`tailwind.config.js`; Noto Sans Thai for `th` in `app.vue`). Do not add font families for a feature.

---

## Mobile is the product

**390px is the canonical mobile canvas** — not desktop scaled down.

Assume: one hand, dark venue, bright stage lighting, movement, noise, limited attention.

- Important controls: minimum 44–48px
- Input text: 16px where relevant
- Primary actions: within practical thumb reach
- Prefer native-feeling bottom sheets over desktop modal patterns where appropriate
- No hover dependency for critical actions

iOS / native-feel work is a major future roadmap item, not “responsive cleanup.” See the master roadmap.

---

## The venue test

Every important Faneqo interaction should be judged by:

- Can someone understand it in ~3 seconds?
- Can they use it one-handed?
- Can they read it at arm's length?
- Would it work in a dark venue?
- Is the primary action obvious?

If not: simplify.

---

## Motion

Motion communicates:

- state
- causality
- continuity
- relationship

Do not animate decoration. No looping decorative animation. No particles or motion wallpaper.

Preferred technologies:

1. **CSS**
2. **Motion for Vue / motion-v**

**GSAP:** only where sophisticated choreography or cross-surface continuity truly earns it.

**Rive:** only for signature state changes such as Check-In confirmation, YOU WERE THERE, Show Mode LIVE, Passport relationship moments. Do **not** use Rive for ordinary Gallery / photo movement, buttons, or background decoration. Do not add Rive when no appropriate asset exists.

**Atropos:** future experiment only. Do not introduce unless it materially improves a custom interaction.

Native-feel continuity (shared-element transitions, sheets, drawers, Gallery → lightbox → return) should stay CSS + Motion first.

---

## Photography is a design material

Photography is not merely content inside a card. Concert and artist imagery can become page architecture — identity, atmosphere, memory, emotion.

If photography is missing, typography becomes the visual hero. Never default to ugly empty placeholder cards.

### Night image roles — locked

Do not collapse these into one image.

| Role | Meaning |
| --- | --- |
| **Night Hero** | Optional Night-specific atmosphere. Cover + focals. |
| **Night Poster / Night Photo** | Distinct Night artifact. Not Gallery media. Not Hero. |
| **Event artwork** | Event poster / artwork. Not Night Poster. |
| **Artist image** | Artist identity. Default Artist World hero fallback. |
| **Gallery media** | Photographic chapter contents. |
| **Share image** | Independent share / OG contract. |

Hero priority:

```
Night Hero → Artist image → type-only fallback
```

Night Poster is **not** Hero. Event artwork is **not** Night Poster. Gallery media is separate.

---

## Gallery Stack — locked signature primitive

`FaneqoGalleryStack` is a physical digital photographic stack.

It is **dumb** on purpose. It knows media, active index, gestures, and interaction. It does **not** own artist, Night, date, venue, YOU WERE THERE, Passport, or music.

| Rule | Constraint |
| --- | --- |
| Shape | Finite deck. Never an infinite carousel. |
| Horizontal swipe | Browse photographs |
| Vertical movement | Normal page scroll |
| Tap | Open Gallery |
| Drag | Must not accidentally open |
| Active index | Temporary UI only. Never mutates Gallery order. Never changes canonical cover. |
| DOM | Maximum ~3 rendered images at once |
| Desktop | Restrained hover / tilt / grab |
| Accessibility | Keyboard + reduced-motion support |
| Open / Back | Selected print → exact selected Gallery image. Back → same print. |
| Authorization | Public authorization preserved. Authorized media only. |
| Motion | Native View Transition is progressive enhancement. Reverse visual transition is deferred. |
| Libraries | No Atropos. No GSAP required for the current interaction. |

**LOCK RULE:** Stop adding isolated Stack effects.

Future innovation belongs in Night context, fan relationship, Passport, Messages, Music Memory, Share Kit, and Night Object — in **wrappers**, not inside the stack SFC.

Do not put `nightTitle`, `venue`, `youWereThere`, `showOrdinal`, or music inside `FaneqoGalleryStack.vue`.

---

## Locked product surfaces

These compositions are done. Do not structurally reopen them from design taste.

### Fan Check-In — locked

- Mobile-first. Important CTA above the fold. Close does not consume its own row.
- Immediate value before account creation.
- A new fan must not be interrupted by profile / badge setup.
- Attendance success is the product truth.
- Badge generation can never make a successful check-in appear failed.
- The old badge concept is removed from the critical success path.
- Future evolution is optional post-show **“Share that you were there.”**
- Returning relationship language only when server-derived.
- No fake gamification.

### Artist Show Recap — structurally locked

The band's memory + control surface for a Night. Not primarily a report.

Current composition includes: Artist World Hero, Night identity, Share / Preview / Edit, metrics, Story, Lineup, Night Poster, From the Night Galleries, After the Show messaging, Insights, private band note.

Important completion actions are near-white + icons. Story / Lineup actions must not be muted. Night Poster is a distinct Night artifact, not Gallery media.

### Public Night — composition locked

Fan-side version of the same Night.

Includes: Artist World Hero, Night identity, YOU WERE THERE when server-derived, show ordinal when server-derived, Passport continuation, Night Poster, Story, Lineup, From the Night, Gallery Stacks, Stay with artist.

Preview Fan View = the real Public Night.

### Gallery Archive — done

`/galleries` is an artist photographic archive. **Not** a CMS file manager.

Architecture: Night shelves, General shelf, photography-first composition, minimal management chrome, reusable Gallery Stack.

### Public Gallery / media — locked foundation

Preserve public / protected media rules, authorized media only, derivative strategy, lightbox, selected-photo continuity, safe return context, and canonical URLs.

Shared lightbox active filmstrip: near-white selection. Teal only for focus-visible accessibility.

### Auth / QR Share / mobile artist dock — locked foundations

Completed foundational systems. Do not reopen unless there is a real defect.

### Show Mode + Nights — nearly locked

Major UX is complete: setup tonight, LIVE, End Show, Preparing Night, Night Ready, Nights history, Dashboard latest Night.

Remaining known issue: manager / team authorization gap for Night history / latest recap. That is a **surgical fix**. Do not redesign Show Mode or Nights around it.

---

## Messaging

Messaging should feel like communication inside the artist relationship.

North star: **PERSON + MESSAGE + RELATIONSHIP FIRST.**

Not a CRM. Not a campaign dashboard. Not a database table.

Core composer language: **“Say something to your people.”** Not “Create campaign.”

Artist-facing IA is **Inbox / Sent**, plus **Message all fans** / **Message a show** / private message.

Do not resurrect Conversations / Campaigns as artist-facing navigation. Backend names may stay as they are.

Beautiful composer + ugly received message = failure.

---

## Fan Passport

Locked direction: **Artist Relationship Universe + Music Memory Journal.**

Do **not** make Passport a concert tracker, loyalty dashboard, badge wall, or points system.

It should feel cinematic, personal, collectible, editorial, and relationship-centered.

Relationship progression uses real events: first show, came back, 2nd / 3rd Night, first message, photo memory, years following artist, multiple cities, repeat venue.

No XP. No fake streaks. No gamified counters unless they represent real relationship truth.

Do not invent counters or badges. YOU WERE THERE and show ordinal appear only from server-derived truth.

---

## Night Object — future direction

A Night becomes a living digital memory object: artist, Night title, venue, city, date, Hero, Poster, Story, Lineup, Galleries, messages, music, YOU WERE THERE, show ordinal, Passport relationship, share artifacts.

The Gallery Stack is one physical primitive inside that Night Object.

Faneqo is not merely storing event records. It is creating living digital objects from real nights between artists and fans.

Do not build the complete Night Object abstraction now.

---

## Music Memory — future principle

**Photos remember what the Night looked like. Music remembers what the Night felt like.**

Music supports memory. Do not build another Spotify clone. No autoplay by default.

---

## Cards, chrome, and information

Cards are **not** the default layout primitive. Before adding a card, consider typography, spacing, photography, dividers, surface changes.

Never show data merely because Faneqo has it.

- **Primary:** meaning, memory, action
- **Secondary:** numbers, technical detail, operational metadata

Analytics remain available without becoming the identity of a screen.

Do not create duplicate product systems simply for presentation. ShowRecap remains the durable Night history.

---

## Auth as a quality reference

The redesigned Login / Signup experience is a current reference for Faneqo visual discipline: minimal chrome, deep black, confident type, precise spacing, restrained brand color, strong monochrome primary action, no nested cards, no generic SaaS language, mobile-first, large touch targets.

**Do not make every screen look like a login form.** Carry the discipline.

Ask:

- Can we remove something?
- Can typography do the work instead of another card?
- Can one strong image replace multiple decorative UI elements?
- Can the primary action be obvious without turning it purple?
- Can the screen feel calmer?
- Can the screen feel more expensive?

---

## Stale guidance — do not resurrect

These older directions are superseded. Do not bring them back.

| Stale | Current truth |
| --- | --- |
| Neon green identity | Precision color is earned pink / violet / cyan. Near-white is the primary action. |
| Gradient CTA dependence | Near-white primary. Accent only when meaning needs it. |
| Generic dashboard language | Music-native, relationship-centered copy. |
| Badge-required Check-In | Attendance success is the truth. Badge is off the critical path. |
| Gallery as CMS cards | Photographic archive + Gallery Stack. |
| Public Night as a poster page | Fan-side Night: Story, Lineup, Poster, Galleries, relationship. |
| Parallel Preview Fan View | Preview uses the real Public Night. |
| Conversations / Campaigns as artist IA | Inbox / Sent. Message all fans / Message a show. |
| Artist Page as the whole product | Artist Page is one window into the Artist World. |

---

## Iterative design workflow

Process detail — work modes, the signature design loop, the rendered-evidence convention, tool doctrine, and who may approve visual work — lives in `docs/FANEQO_CURSOR_OPERATING_SYSTEM.md`. This section states the doctrine behind it.

Judge Faneqo **absolutely**. "Better than the previous version," "better than the old lab build," or "better than another photo product" is not evidence of quality. The standard is that an experienced product designer would believe every visible decision was deliberately art-directed.

An implementer may not certify its own signature surface. Independent review is the gate (`.cursor/agents/faneqo-visual-critic.md`), and APPROVED V1 / FROZEN remains a founder decision — on a real device where touch matters.

Do not attempt visual perfection from one giant prompt.

1. **Pass 1** — structure / hierarchy / composition
2. Inspect a real rendered state
3. **Pass 2** — spacing / type / materials / image behavior
4. Inspect again
5. **Pass 3** — interaction / states / polish
6. **Pass 4** — motion / Rive only when justified

Real screenshots and real content override speculative design assumptions. Do not continue making broad changes once the next useful step is visual inspection.

Whenever possible, visual review should use real artist imagery, real concert photography, real Night data, real long/short names, real empty states.

Do not claim a visual design is proven solely from abstract SVG fixture art.

---

## Quality questions

At the end of every substantial Faneqo design pass ask:

- Does this look like a SaaS feature or a premium music product?
- Would an artist open this the morning after a show because they want to?
- Does the fan feel closer to the artist?
- Does photography / content dominate?
- Could we remove 20% of the UI and make it better?
- Is mobile actually the best version?
- Would this still make sense in a dark venue?
- Did we reopen a locked surface without a real defect?

If the answers are wrong: keep refining. If the composition is locked and there is no defect: **stop.**

---

## Instruction for future Faneqo design work

1. Read this entire document.
2. Read `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`, `docs/FANEQO_CURRENT_PHASE.md`, and `docs/FANEQO_NEXT_AGENT_HANDOFF.md`.
3. Inspect the actual local implementation.
4. Treat this North Star as the default design doctrine.
5. Do not invent a conflicting design language without explicit product reason.
6. Preserve working architecture and locked compositions.
7. Prefer artist / fan meaning over SaaS conventions.
8. Prefer mobile-first, content-first, photography-first experiences.
9. Use iterative screenshot critique rather than one-shot redesign.
10. If a screen conflicts with this doctrine, call it out explicitly in the final report.
11. Future ideas belong in the master roadmap HOLD list until they are activated. Do not implement them from taste.
