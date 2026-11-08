# Faneqo atomic feature template

Reusable product-development system. Living Gallery is the pilot (`docs/gallery/living-gallery/`).

Copy this structure when a feature is large enough to outgrow a single handoff.

---

## Operating loop

Broad vision. Relentless decomposition. Narrow execution. Atomic quality. Persistent memory. Explicit quality debt. Preserved frontier ideas. Continuous improvement.

The outline may contain enormous ambition. **CURRENT_PHASE must remain extremely small.**

---

## Recursive principle

```
Feature
  → Systems
    → Organisms
      → Molecules
        → Atoms
```

Any level may contain: states, interactions, quality debt, future ideas, frontier experiments, benchmarks.

Do not require every atom to be fully filled on day one. Fill what is known. Mark UNKNOWN otherwise.

---

## Status vocabulary

Use only:

| Status | Meaning |
| --- | --- |
| NOT STARTED | No honest work yet |
| EXPLORING | Research / design / lab; not a product claim |
| IMPLEMENTED / NOT APPROVED | Code or prototype exists; not accepted as product |
| APPROVED V1 | Accepted for now; not permanently finished |
| DEFERRED | Known, out of current phase on purpose |
| FRONTIER | Valuable later; must not enter current scope |
| REJECTED | Considered and refused |

Do not use: done-ish, mostly done, probably complete.

An item may be functionally mature and visually poor. Record **function** and **visual** separately.

Quality dimensions (when useful): FUNCTION, VISUAL, MOBILE, DESKTOP, INTERACTION, MOTION, ACCESSIBILITY, PERFORMANCE, REAL DEVICE, BENCHMARK.

---

## Atomic item schema

ID · NAME · PURPOSE · USER VALUE · STATUS · CURRENT IMPLEMENTATION · DESIGN INTENT · STATES · MOBILE · DESKTOP · INTERACTIONS · MOTION · ACCESSIBILITY · PERFORMANCE · DATA / DEPENDENCIES · KNOWN WEAKNESSES · QUALITY DEBT · APPROVED DECISIONS · OPEN QUESTIONS · FUTURE EXPANSION · FRONTIER IDEAS · BENCHMARK · EVIDENCE · NEXT ACTION

---

## Canonical file set (per feature)

| File | Job |
| --- | --- |
| README | Start here. What it is. Current phase. How to read. |
| MASTER | Constitution. Role, north star, principles. |
| ATOMIC_OUTLINE | Full ambition, stable IDs, honest status. |
| TRACKER | Daily operational map. Short. |
| CURRENT_PHASE | Tiny. What may be worked on **now**. |
| DECISIONS | Locked choices. |
| QUALITY_DEBT | Explicit weaknesses. |
| FRONTIER | Unreasonably good ideas, parked. |
| HANDOFF | Exact continuation. |
| Specialist atom files | Deep dive without losing the whole (e.g. `LG-A-CLOSE.md`) |

The four Faneqo product docs remain company-wide truth and are not replaced:

1. `docs/FANEQO_DESIGN_NORTH_STAR.md`
2. `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`
3. `docs/FANEQO_CURRENT_PHASE.md`
4. `docs/FANEQO_NEXT_AGENT_HANDOFF.md`

A feature CURRENT_PHASE is a **specialist now-board**. It must not silently override the company CURRENT_PHASE.

---

## Template sections for MASTER / OUTLINE

### 00 Feature identity

Name. Audience. What it is / is not. Adjacent features it must not become.

### 01 North star

One sentence. One test.

### 02 User jobs

Artist jobs. Fan jobs. What success feels like.

### 03 Full user flow

Entry → use → exit → return. Include Back / PWA if relevant.

### 04 Information architecture

Canonical objects vs presentation. What this feature must not invent.

### 05 Systems

Named subsystems with stable IDs.

### 06 Organisms

Composed surfaces (e.g. contact sheet, chrome overlay).

### 07 Molecules

Small composed controls (e.g. index + close row).

### 08 Atoms

Smallest meaningful units (e.g. Close).

### 09 States

idle, hover, focus, pressed, active, disabled, hidden, empty, loading, error, reduced-motion, chrome-hidden.

### 10 Actions

Headless verbs the UI may call.

### 11 Interactions

Touch, mouse, keyboard, Back, platform gestures.

### 12 Motion

Who owns physics vs choreography. Reduced motion.

### 13 Responsive layout

Mobile, tablet, desktop, ultrawide. Safe areas. Orientation.

### 14 Data

Sources of truth. Contracts. What is fixture vs production.

### 15 Permissions

Who may see / share / edit.

### 16 Loading / empty / error

Failure is part of the product.

### 17 Accessibility

Keyboard, focus, live regions, contrast, labels.

### 18 Performance

First open, navigation, memory, teardown, midrange devices.

### 19 Analytics

Semantic events. Do not invent vendor coupling.

### 20 Sharing / growth

Native share, clipboard, deep links, previews.

### 21 Security / privacy

Authorization vs visibility. Do not leak cross-artist truth.

### 22 AI opportunities

Only if they serve a user job. Default FRONTIER.

### 23 Advanced technology

GPU, depth, intelligence. Must earn visible value.

### 24 Benchmarks

Named competitors or craft standards. Not dependencies unless chosen.

### 25 Known weaknesses

Evidence-based. UNKNOWN is allowed.

### 26 Quality debt

Severity, status, reason, revisit trigger, related IDs.

### 27 Decisions

Why. Implications. Rejected alternatives.

### 28 Experiments

Lab-only. IMPLEMENTED / NOT APPROVED until product-accepted.

### 29 Future expansion

Deferred on purpose.

### 30 Frontier / unreasonably good

Preserve without expanding current scope.

### 31 Current phase

Tiny. Frozen list. Coding rules.

### 32 Handoff mapping

What the next agent reads. What they must not touch.

---

## Coding rules (default)

- Implement one narrow slice named by atomic IDs.
- Visual work follows the signature design loop in `docs/FANEQO_CURSOR_OPERATING_SYSTEM.md`: explore, render early, capture rendered evidence, independent Visual Critic pass, repair BLOCKER / MUST FIX, stop. If CURRENT_PHASE freezes a composition, implement within it rather than redirecting it.
- Do not mark APPROVED V1 without explicit founder acceptance.
- Do not claim real-device quality from emulation.
- Do not commit, push, or deploy unless asked.
- Preserve unrelated dirty work.

## Handoff

Every slice ends with a HANDOFF written to the standard in `docs/FANEQO_CURSOR_OPERATING_SYSTEM.md` — status, what changed, what is locked, what was rejected, evidence, tests, real device vs emulated, known defects, unrelated dirty work, next slice, do-not-do-next, git state. Scale it to the slice; do not pad empty headings.
