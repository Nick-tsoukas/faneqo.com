# Living Gallery — quality debt

Evidence-based weaknesses. Do not invent measurements or approvals.

Updated 2026-09-09.

Severity: CRITICAL · HIGH · MEDIUM · LOW

Status: OPEN · MITIGATED IN LAB · DEFERRED · FRONTIER

---

## LG-QD-001 — Controls have no approved visual language

**Severity:** HIGH  
**Status:** OPEN  
**Reason:** Slice 01 shipped a control-composition **hypothesis** (Close / Index / identity / Contact Sheet / Info / Share). It is still not an approved Faneqo control language. Lab comparison panel is not product chrome.  
**Related:** LG-CHR-*, LG-CTL-*, LG-A-CLOSE, LG-D007

---

## LG-QD-002 — Real-device physics not validated

**Severity:** CRITICAL before release  
**Status:** OPEN  
**Reason:** Pinch, flick, reverse, edge resistance, swipe-down close, cancelled close, pinch-close, Android Back, installed PWA Back, iPhone Safari hash/swipe-back are **EMULATED ONLY** or untested. Fancybox “tie” claims are provisional.  
**Revisit trigger:** Finger testing on iPhone Safari + Android Chrome + installed PWA.  
**Related:** LG-PHY-*, LG-PWA-*, LG-PER-10, BENCHMARK.md

---

## LG-QD-003 — ~1024px fixture photography cannot represent final desktop fidelity

**Severity:** MEDIUM prototype / HIGH final visual QA  
**Status:** OPEN  
**Reason:** Seven Basement East fixtures are ~1024px. PhotoSwipe will not upscale past 1×. Desktop landscape stays a modest print in a black field. Do not treat this as the final desktop product.  
**Revisit trigger:** Real high-resolution derivatives in the lab (or production media contract).  
**Related:** LG-PHO-06, LG-PHO-10, LG-LAY-07…10, LG-MED-*, LG-PER-01

---

## LG-QD-004 — No photographer metadata in fixture

**Severity:** MEDIUM  
**Status:** OPEN  
**Reason:** Viewer will render a photographer credit if present. Basement East fixture has none. Credit layout is therefore unproven. Do not invent names.  
**Revisit trigger:** Fixture or production data includes photographer.  
**Related:** LG-INF-05, LG-LOD-06, LG-P08, LG-UG-06

---

## LG-QD-005 — Desktop composition not visually approved

**Severity:** HIGH  
**Status:** OPEN  
**Reason:** Composition resolver implements device/orientation padding (including desktop editorial portrait). That is engineering, not art-direction acceptance. Ultrawide and desktop landscape/portrait still need an authored composition, rendered evidence at ≥2000px, and a critic pass.  
**Revisit trigger:** High-resolution desktop photography exists and a desktop composition clears the critic gate and founder review.  
**Related:** LG-LAY-07…10, LG-PHO-07, LG-PHO-08, LG-D009

---

## LG-QD-006 — Contact Sheet visual language unapproved

**Severity:** HIGH (flagship subsystem)  
**Status:** OPEN  
**Reason:** Slice 04 shipped a real mobile Contact Sheet (rail + grid). Photography identifies the thumbs. Nothing is founder-approved. Desktop sheet is not designed.  
**Revisit trigger:** Founder picks Sheet A vs B and native vs cropped.  
**Related:** LG-THM-*, LG-UG-02, LG-UG-12, LG-QD-021

---

## LG-QD-007 — Share action not resolved

**Severity:** HIGH for product; MEDIUM for lab  
**Status:** OPEN  
**Reason:** Headless share exists (`navigator.share` + clipboard). Lab URL is the lab page, not a Night/Gallery canonical URL. No share control in product chrome. No OG / social preview for an exact photo.  
**Revisit trigger:** Canonical photo/gallery URL contract + share art direction.  
**Related:** LG-SHR-*, LG-CTL-SHARE, LG-UG-05, LG-UG-13

---

## LG-QD-008 — Fullscreen product design not resolved

**Severity:** MEDIUM  
**Status:** OPEN  
**Reason:** Fullscreen API helper exists. `canFullscreen` is false in standalone PWA. F / F11 not bound. No product fullscreen control. PWA vs browser fullscreen differences untested on device.  
**Revisit trigger:** Fullscreen art direction + real-device capability matrix.  
**Related:** LG-FUL-*, LG-CTL-FULLSCREEN, LG-PWA-08, LG-D017

---

## LG-QD-009 — Current Gallery entry / user-flow integration not represented in Lab

**Severity:** HIGH for product continuity  
**Status:** OPEN  
**Reason:** Lab opens from print buttons / fixture jumps, not from production Gallery Stack, Galleries Home, or a future Memory Deck. Source-object hooks exist; the real doorway does not.  
**Revisit trigger:** After visual language + explicit production-wiring phase (not now).  
**Related:** LG-ENT-*, LG-PHO-11, LG-UG-01, LG-D012

---

## LG-QD-010 — Production integration intentionally absent

**Severity:** N/A as debt of neglect — this is **intentional scope**  
**Status:** DEFERRED  
**Reason:** Production Gallery files stay LOCKED. Living Gallery must not be wired into `FaneqoGalleryStack` / lightbox during art direction.  
**Revisit trigger:** Explicit production-integration phase after visual approval.  
**Related:** LG-D012, LG-D018

---

## Additional evidence-based debt

### LG-QD-011 — Lab `trapFocus: false`

**Severity:** MEDIUM (lab) / HIGH if copied to product  
**Status:** MITIGATED IN LAB  
**Reason:** Focus is not trapped so Tune / engine dock remain usable. Product viewer must not inherit this without a decision.  
**Revisit trigger:** Product chrome implementation.  
**Related:** LG-ACC-02, LG-ACC-10

---

### LG-QD-012 — Lab engine dock can be mistaken for product chrome

**Severity:** MEDIUM  
**Status:** OPEN (documentation)  
**Reason:** Dock sits at z-index 100061 while the viewer is open. It is a harness. Approved UI must not copy it.  
**Revisit trigger:** Any chrome implementation slice.  
**Related:** LG-CHR-*, LG-D006

---

### LG-QD-013 — Focus restore may race PhotoSwipe `returnFocus`

**Severity:** MEDIUM  
**Status:** OPEN  
**Reason:** Adapter sets `returnFocus: true`. Controller also focuses `sourceElement` after close. Race is suspected, not proven.  
**Revisit trigger:** Close / source-focus implementation or a11y QA.  
**Related:** LG-ENT-05, LG-ACC-07, LG-CTL-CLOSE

---

### LG-QD-014 — Neighbor decode / memory not measured

**Severity:** MEDIUM  
**Status:** OPEN  
**Reason:** `preload: [1, 2]` exists. No recorded first-open, swipe, or memory numbers. Do not invent fps or MB.  
**Revisit trigger:** Performance slice with a measurement protocol.  
**Related:** LG-PER-*, LG-LOD-02, LG-MED-06

---

### LG-QD-015 — Semantic events are local only

**Severity:** LOW now  
**Status:** DEFERRED  
**Reason:** `livingGalleryEvents.js` emits names for a future subscriber. No product analytics pipeline is wired.  
**Revisit trigger:** Product analytics phase.  
**Related:** LG-ANA-*

---

### LG-QD-016 — Phone portrait spectacle unproven with current fixtures

**Severity:** MEDIUM  
**Status:** MITIGATED IN LAB for 2:3 / still OPEN for 3:4 and 4:5  
**Reason:** Lab now includes exact 2:3 *geometry* (`badflower-hero.webp` 1000×1500), but that file is a studio promo, not a Night photograph. Near-square concert fixtures are no longer treated as portraits. There is still no real 3:4 or 4:5 concert asset, and no 2:3 *concert* asset.  
**Revisit trigger:** True 3:4 and 4:5 concert photographs in the fixture set.  
**Related:** LG-PHO-03, LG-LAY-02, LG-LAY-08, LG-QD-022

---

### LG-QD-017 — Empty / offline / failed-image product states thin

**Severity:** MEDIUM  
**Status:** OPEN  
**Reason:** One-image Galleries now hide Photos / Contact Sheet. Empty, failed decode, and offline product states are still not designed.  
**Revisit trigger:** Loading/error design pass after Pure View is directed.  
**Related:** LG-LOD-*, LG-THM

---

### LG-QD-018 — Object continuity not proven

**Severity:** HIGH against the north-star object principle  
**Status:** OPEN  
**Reason:** `getThumbBoundsFn` / source bounds exist. Duplicate-crossing / jump not proven vs Fancybox. Memory Deck path does not exist.  
**Revisit trigger:** After source doorway is a real Gallery/Memory Deck thumbnail, with motion design.  
**Related:** LG-ENT-04, LG-PHO-11, LG-MOT-01, LG-UG-01, LG-UG-12

---

### LG-QD-019 — Memory Residue is an unapproved experiment

**Severity:** HIGH if enabled by default  
**Status:** MITIGATED IN LAB  
**Reason:** GPU feedback decay exists behind Lab MR-A/B/C. Default is OFF. Quality is unreviewed. Must not become default viewer behavior.  
**Revisit trigger:** Founder review of MR-A/B/C on a real device.  
**Related:** LG-MOT-12, LG-TEC-15

---

### LG-QD-020 — Lab comparison panel overlaps the photograph

**Severity:** LOW (lab only)  
**Status:** MITIGATED IN LAB  
**Reason:** Compare dock is bottom-fixed with pass-through clicks. Open panel still covers bottom chrome. Do not copy into product.  
**Revisit trigger:** Any chrome implementation that might inherit lab chrome.  
**Related:** LG-QD-012, LG-CHR-*

---

### LG-QD-021 — Contact Sheet is unapproved V1

**Severity:** HIGH for the flagship sheet  
**Status:** OPEN  
**Reason:** Slice 05 composed the rail under the photograph. Sheet A is the primary candidate (LG-D020). Not APPROVED V1.  
**Revisit trigger:** Founder review of Photos-open composition on a phone.  
**Related:** LG-THM-*, LG-CTL-THUMBNAILS, LG-QD-006, LG-D020

---

### LG-QD-022 — 3:4 and 4:5 concert fixtures absent

**Severity:** MEDIUM for composition judgment  
**Status:** OPEN  
**Reason:** Slice 02 can judge exact 2:3, near-square, square, landscape, and wide. 3:4 and 4:5 slots jump to the closest real source and are labeled as approximations. Do not crop existing photos to fake those ratios.  
**Revisit trigger:** Real 3:4 and 4:5 concert photographs added to the lab.  
**Related:** LG-PHO-03, LG-LAY-02, LG-QD-016

---

### LG-QD-023 — Chrome A / Chrome B are unapproved hypotheses

**Severity:** HIGH if copied to product  
**Status:** SUPERSEDED  
**Reason:** Slice 03 replaced A/B + ellipsis with Direct / Hierarchical / Doorway. Photos is never hidden behind dots.  
**Revisit trigger:** Founder review of Direct vs Hier vs Doorway and Context on/off.  
**Related:** LG-CHR-02, LG-CHR-05, LG-CTL-MORE, LG-QD-001, LG-QD-024

---

### LG-QD-024 — Control discoverability unapproved

**Severity:** HIGH  
**Status:** OPEN  
**Reason:** Hierarchical (Photos + quiet Info/Share) is the current default. Direct remains a lab compare. Doorway / MORE is deprecated (LG-D022). Context on/off is still undecided.  
**Revisit trigger:** Founder accepts or rejects Hierarchical as the mobile chrome candidate.  
**Related:** LG-CHR-02, LG-CTL-*, LG-INF, LG-QD-006

---

### LG-QD-025 — Flexible Gallery context visual language unapproved

**Severity:** HIGH if copied as the locked product voice  
**Status:** OPEN  
**Reason:** Show-linked, general, and minimal contexts render without fabricated fields. Overlay hierarchy and Info voice are not founder-approved.  
**Revisit trigger:** Founder review of CASE A / B / C on the photograph.  
**Related:** LG-INF-*, LG-D019

---

### LG-QD-026 — Photos-open lower composition unapproved

**Severity:** HIGH if copied as locked art direction  
**Status:** OPEN  
**Reason:** Slice 06 packs context + rail under `imageRect` with an opaque `#000` shelf. 2:3 leftover is 11px at 390×844 (EMULATED). Visual language is not founder-approved. REAL DEVICE not tested.  
**Revisit trigger:** Founder review of 2:3 / near-square / landscape at 390 and 430 on a phone.  
**Related:** LG-THM-05, LG-LAY-12, LG-CHR-02, LG-D021

---

### LG-QD-027 — Landscape Photos-open two-bar bleed

**Severity:** HIGH (was MUST FIX)  
**Status:** MITIGATED IN LAB  
**Reason:** Slice 06 added an opaque lower matte from `imageRect.bottom` and clipped residue to the photograph. Landscape Photos-open no longer reads as a second image bar in the 390×844 emulator.  
**Revisit trigger:** Real-device landscape Photos-open.  
**Related:** LG-PHO-02, LG-LAY-01, LG-D021

---

### LG-QD-028 — 2:3 Contact Sheet vs home-indicator zone

**Severity:** MEDIUM  
**Status:** OPEN  
**Reason:** [Visual Critic](fc43dcbd-0e69-4f0b-a0e3-956fccdb2b48) SHOULD FIX: 2:3 rail sat in the home-indicator zone (11px leftover). Slice 07 compact-context when remaining < 168. Still OPEN — do not auto-open a giant gap. Founder judgment on a real iPhone.  
**Revisit trigger:** Founder judgment on a real iPhone.  
**Related:** LG-LAY-11, LG-THM-05, LG-PWA-07

---

### LG-QD-029 — Memory Residue not product-approved

**Severity:** HIGH if copied as the look  
**Status:** OPEN  
**Reason:** MR-B is the signature *candidate*. Default remains off. Effect must never become more memorable than the memory. REAL DEVICE not tested.  
**Revisit trigger:** Founder review of MR-B on slow next and close, with fast-nav skip.  
**Related:** LG-MOT-12, LG-TEC-15, LG-D023
