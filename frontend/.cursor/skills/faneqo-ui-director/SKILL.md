---
name: faneqo-ui-director
description: Direct Faneqo visual implementation using the current North Star. Use when building or revising Living Gallery, Desktop Gallery, Nights, Passport, Artist Page, Messaging, Homepage, Fan Intelligence, Night Story, Labs, Show Mode, management, auth, or other product UI. Enforces Story/task → Hierarchy → Media → Type → Space → Interaction → Motion → Decoration. After a real candidate is rendered, run the Faneqo Visual Critic, fix BLOCKER and MUST FIX, verify once, then stop.
---

# Faneqo UI Director

Implement against the current Faneqo language. Do not invent a second brand.

You **create and direct**. The Visual Critic **reviews**. Keep those roles separate: never self-certify a surface in place of an independent critic pass, and never ask the critic to implement.

Build against an absolute standard, not a relative one. "Better than the previous version" is not a quality target. The target is: an experienced product designer believes every visible decision was deliberately art-directed.

## When this skill applies

SIGNATURE DESIGN work only — surfaces that carry Faneqo's quality. A bug fix, a settings screen, a copy change, or a small visual correction is PRODUCT / UX work: verify it in a browser at mobile and desktop width and stop. Do not run this workflow on it. Modes are defined in `docs/FANEQO_CURSOR_OPERATING_SYSTEM.md`.

## Required reading

1. Identify the **target surface mode**: MEMORY · LIVE · MESSAGING · MANAGEMENT · INTELLIGENCE · AUTH · PUBLIC_ARTIST · MARKETING
2. Read `docs/FANEQO_DESIGN_NORTH_STAR.md`
3. Check `docs/FANEQO_CURRENT_PHASE.md` and `docs/FANEQO_NEXT_AGENT_HANDOFF.md` so locked surfaces stay locked
4. Read the task brief (audience, locked composition, intended state)
5. Inspect the current local screen before editing

Do not reread `docs/design/FANEQO_VISUAL_LANGUAGE.md` or `docs/design/FANEQO_VISUAL_REFERENCES.md` unless the task is specifically about gallery count compositions or token lookup. Those documents must **not** override the North Star. Product direction lives in `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`.

## Surface modes

| Mode | Job | Do not |
| --- | --- | --- |
| **MEMORY** | Worth keeping. Emotion, artist, photography, story, relationship. | Treat as a titled file dump |
| **LIVE** | Operable in 3 seconds in a dark venue. State, one primary action, 44px, one-handed. | Force a cinematic hero onto a live control surface |
| **MESSAGING** | Person, message, relationship dominate. | Build CRM / campaign-dashboard chrome |
| **MANAGEMENT** | Fast world management that still feels like Faneqo. | Force full-screen heroes onto utility screens |
| **INTELLIGENCE** | Understanding and a next action, not a wall of numbers. | Ship equal-weight KPI grids or chart wallpaper |
| **AUTH** | Immediate, calm, trustworthy, unmistakably Faneqo. | Add marketing clutter or effects for personality |
| **PUBLIC_ARTIST** | Artist / content is the experience. | Lead with product chrome |
| **MARKETING** | The product's real quality is visible in the first viewport. | Ship a stock hero + feature-triplet layout |

“Story” on an operational screen means **product intent / task**, not literal narrative.

## Decision order

1. Story / task — understand, remember, feel, or do?
2. Hierarchy — eye first, second, third
3. Media — can photography / artwork / music carry more, if earned?
4. Typography — can type replace a container?
5. Space — can rhythm replace another box?
6. Interaction — is the action obvious?
7. Motion — does it explain state or meaning?
8. Decoration — borders, gradients, shadows, glows last

## Current quality rules

- Faneqo color is earned, not wallpaper.
- Near-white primary = **DO THIS NOW**. Usually once per decision area.
- Magenta / violet = identity / precision. Cyan / teal = live / progress / relationship where meaningful.
- Do not use neon green as current brand identity.
- Cinematic means composition, photography, scale, type, contrast, timing, space — not glow, gradient, blur, particles, parallax, or Rive-for-personality.
- Do not add Rive when no appropriate asset exists.
- If the brief says a composition is **LOCKED**, do not structurally redesign it.

Night Story / memory: wrap `FaneqoMediaGrid` `variant="gallery"` + `FaneqoMediaLightbox`. Do not add show concepts to the grid, lightbox, or MediaItem.

## Workflow

1. Understand the target surface mode and task; note the viewports and states the brief requires
2. Inspect the current rendered screen and the components it already uses
3. Research only a specific question that would otherwise be guesswork — extract principles, never pixels
4. Explore two or three directions cheaply. Render something real early, before polishing anything
5. Critique your own candidates, choose one, and say why the others lost
6. Implement the smallest coherent version of the chosen direction, rendering as you go
7. Capture rendered evidence at the required viewports and states — the critic judges the rendered result, never your source. Convention: `.visual-review/<surface>/<pass>/` with `EVIDENCE.md` (see `docs/FANEQO_CURSOR_OPERATING_SYSTEM.md`)
8. Run the Faneqo Visual Critic at `.cursor/agents/faneqo-visual-critic.md` as its own pass, handing it that evidence
9. Fix **BLOCKER** and **MUST FIX** only
10. Run **one** verification critic pass, confirm build/tests still pass
11. **Stop**

SHOULD FIX may be accepted or rejected by product judgment. Do **not** auto-implement EXPERIMENT notes; they never start another cycle. Treat LEAVE ALONE items as protected — do not touch them in the fix pass.

The critic's ruling is NOT READY / READY WITH NOTES / SIGNATURE — LOCK. Only the first one obligates a fix pass.

Nothing earns credit for complexity, effect count, cleverness, code volume, effort, or requirement completion by itself. Ship what a person can see and feel.

Do not keep redesigning after verification to chase taste.

A clean critic pass means the surface has no visible defects. **APPROVED V1 / composition FROZEN is a founder decision**, and on gesture-driven surfaces it requires a real device. Never write it yourself from emulated capture.
