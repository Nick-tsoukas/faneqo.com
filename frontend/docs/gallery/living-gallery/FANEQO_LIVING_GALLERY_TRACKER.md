# Living Gallery — tracker

Daily operational map. Detail lives in `FANEQO_LIVING_GALLERY_ATOMIC_OUTLINE.md`.

Updated 2026-09-09. Current phase: **Slice 06 V1 CANDIDATE + Slice 07 Info cleanup**. Doorway/Deck: `docs/gallery/memory-system/`.

Status: NOT STARTED · EXPLORING · IMPLEMENTED / NOT APPROVED · APPROVED V1 · DEFERRED · FRONTIER · REJECTED

Quality columns: FUNCTION · VISUAL · MOBILE · DESKTOP · REAL DEVICE

Tokens: `none` · `stub` · `exists` · `unapproved` · `UNKNOWN` · `emulated` · `no` · `—`

Nothing below is APPROVED V1 visually.

---

## PHOTOGRAPH

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-PHO-01 | Active photograph | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Judge matrix in lab |
| LG-PHO-02 | Landscape | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Founder review width-fill + optical band |
| LG-PHO-03 | Portrait | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | True 2:3 now in lab; 3:4 / 4:5 missing |
| LG-PHO-04 | Square | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Own restrained rule; founder review |
| LG-PHO-05 | B&W | EXPLORING | exists | none | emulated | UNKNOWN | no | Mobile B&W deliverable |
| LG-PHO-06 | Hi-res inspect | EXPLORING | stub | none | UNKNOWN | blocked | no | Needs real derivatives |
| LG-PHO-07 | Surround | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Confirm pure black |
| LG-PHO-08 | Optical alignment | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Lab harness: center / slight high / higher / custom |
| LG-PHO-09 | Start zoom | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Confirm fit |
| LG-PHO-10 | Fidelity | IMPLEMENTED / NOT APPROVED | exists | unapproved | UNKNOWN | blocked | no | No extra look |
| LG-PHO-11 | Object continuity | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | UNKNOWN | no | Deck `data-gx-deck-front` seam |

---

## LAYOUT

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-LAY-01 | Phone landscape photo | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Founder review 390 / 430 |
| LG-LAY-02 | Phone portrait photo | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | 2:3 width-fill; founder review 390 / 430 |
| LG-LAY-03 | Phone square | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Restrained sides; not treated as portrait |
| LG-LAY-04 | Phone landscape OS | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Device check later |
| LG-LAY-05–06 | Tablet | IMPLEMENTED / NOT APPROVED | exists | none | UNKNOWN | UNKNOWN | no | After phone/desktop |
| LG-LAY-07 | Desktop landscape | IMPLEMENTED / NOT APPROVED | exists | unapproved | — | emulated | no | Desktop landscape frame |
| LG-LAY-08 | Desktop portrait | IMPLEMENTED / NOT APPROVED | exists | unapproved | — | emulated | no | Desktop portrait frame |
| LG-LAY-09 | Desktop square | IMPLEMENTED / NOT APPROVED | exists | unapproved | — | emulated | no | Include |
| LG-LAY-10 | Ultrawide | IMPLEMENTED / NOT APPROVED | exists | none | — | emulated | no | Ultrawide deliverable |
| LG-LAY-11 | Safe areas | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | UNKNOWN | no | Real-device later |
| LG-LAY-12 | Chrome-visible compose | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Chrome overlay; imageRect unchanged |
| LG-LAY-13 | Chrome-hidden compose | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Pure View |

---

## CHROME

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-CHR-01 | Pure View | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Strong candidate; keep A/B |
| LG-CHR-02 | Controls visible | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Hier default; Photos + Info + Share; Doorway deprecated |
| LG-CHR-03 | Auto-hide | EXPLORING | stub | none | emulated | none | no | Opt-in idle hide only |
| LG-CHR-04 | Desktop chrome | NOT STARTED | none | none | — | none | no | Desktop frames |
| LG-CHR-05 | Mobile chrome | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Photos first; no ellipsis-only path |
| LG-CHR-06–09 | Idle / pointer / touch / kb | EXPLORING | stub | none | emulated | none | no | Art-direct reveal |

---

## CONTROLS

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-CTL-CLOSE | Close | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Lucide X; 48px target; not approved |
| LG-CTL-PREV | Previous | IMPLEMENTED / NOT APPROVED | exists | none | emulated | emulated | no | Decide if visible |
| LG-CTL-NEXT | Next | IMPLEMENTED / NOT APPROVED | exists | none | emulated | emulated | no | Decide if visible |
| LG-CTL-INDEX | Index | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Tiny opacity / 3px settle on change |
| LG-CTL-ZOOM-* | Zoom in/out/reset | IMPLEMENTED / NOT APPROVED | exists | none | emulated | emulated | no | Do not invent buttons |
| LG-CTL-INFO | Info | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Expands memory; does not restate chrome |
| LG-CTL-SHARE | Share | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Native/clipboard; lab URL only |
| LG-CTL-FULLSCREEN | Fullscreen | EXPLORING | stub | none | none | none | no | Parked (LG-QD-008) |
| LG-CTL-THUMBNAILS | Thumbs control | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Photos opens sheet; hidden if 1 image |
| LG-CTL-MORE | More | REJECTED | — | — | — | — | no | Founder does not love MORE; Photos / Info / Share are direct |

---

## THUMBNAILS

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-THM-01–03 | Thumb atoms | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Idle/active/pressed/focus/loading |
| LG-THM-04–05 | Contact sheet mobile | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Rail V1 candidate; 2:3 leftover 11px (LG-QD-028) |
| LG-THM-06 | Desktop contact sheet | NOT STARTED | none | none | — | none | no | Intentionally skipped |
| LG-THM-07–10 | Select / scroll / kb / ensure | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Synced to PhotoSwipe |
| LG-THM-11 | Virtualize 100+ | FRONTIER | none | none | none | none | no | 24-image set works without it |
| LG-THM-12–13 | Hover / scrub | FRONTIER | none | none | none | none | no | Not now |
| LG-THM-14 | Continuity hooks | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | none | no | Immediate active + PhotoSwipe goTo; no Memory Deck |

---

## PHYSICS

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-PHY-01–07 | Swipe / flick / pinch / pan / dbltap | IMPLEMENTED / NOT APPROVED | exists | — | emulated | emulated | no | Real-device later |
| LG-PHY-08–10 | Swipe-down / cancel / pinch-close | IMPLEMENTED / NOT APPROVED | exists | — | emulated | — | no | Finger test; cancel UNKNOWN |
| LG-PHY-11–12 | Mouse drag / wheel | IMPLEMENTED / NOT APPROVED | exists | — | — | emulated | no | Desktop intent |
| LG-PHY-13 | Keyboard prev/next | IMPLEMENTED / NOT APPROVED | exists | — | — | exists | no | Keep |
| LG-PHY-14 | Back | IMPLEMENTED / NOT APPROVED | exists | — | UNKNOWN | emulated | no | Android/PWA later |

---

## ENTRY / EXIT

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-ENT-01 | Gallery → viewer | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Wired on Gallery Page |
| LG-ENT-02 | Viewer → gallery | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Close art direction |
| LG-ENT-03 | Exact index | IMPLEMENTED / NOT APPROVED | exists | — | emulated | emulated | no | Keep |
| LG-ENT-04–06 | Bounds / focus / fallback | IMPLEMENTED / NOT APPROVED | exists | UNKNOWN | emulated | emulated | no | Continuity unproven |
| LG-ENT-07 | Memory Deck | FRONTIER | none | none | none | none | no | Frozen |
| LG-ENT-08 | Deep link photo | NOT STARTED | none | none | none | none | no | Frozen |

---

## INFO

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-INF-01–04 | Artist / venue / city / date | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Optional; omitted when absent |
| LG-INF-05 | Photographer | NOT STARTED | none | none | none | none | no | Slot only; do not invent |
| LG-INF-06 | Index | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | With chrome |
| LG-INF-07–08 | Gallery / Night identity | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Title first-class; show supplemental |
| LG-INF-09 | Relationship | DEFERRED | none | none | none | none | no | Frozen |

---

## SHARE

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-SHR-01–04 | Share photo/gallery / native / clipboard | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Wired; lab URL only |
| LG-SHR-05–07 | Deep link / OG / attribution | NOT STARTED / FRONTIER | none | none | none | none | no | Frozen |

---

## FULLSCREEN

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-FUL-01–06 | Enter/exit/capability/shortcut/PWA/restore | EXPLORING | stub | none | none | none | no | Parked |

---

## MOTION

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-MOT-01–04 | Open/close/chrome | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | emulated | no | Quiet opacity + 5px settle; PhotoSwipe zoom open/close |
| LG-MOT-12 | Memory Residue | EXPERIMENT IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Signature candidate MR-B; default off; fast nav wins |
| LG-MOT-05 | Info reveal | EXPLORING | exists | unapproved | emulated | emulated | no | Fade; long caption in Info |
| LG-MOT-06 | Contact sheet motion | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | Restrained emerge/recede |
| LG-MOT-07–10 | Select/FS/hover/load | EXPLORING | stub | none | none | none | no | No Memory Deck motion |
| LG-MOT-11 | Reduced motion | IMPLEMENTED / NOT APPROVED | exists | unapproved | UNKNOWN | UNKNOWN | no | Keep fade |

---

## MEDIA

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-MED-01–06 | Derivatives / srcset / preload | IMPLEMENTED / NOT APPROVED | exists | — | UNKNOWN | blocked | no | Keep one-candidate rule |
| LG-MED-07–10 | Decode / zoom / DPI / select | UNKNOWN / EXPLORING | UNKNOWN | — | UNKNOWN | blocked | no | Needs hi-res assets |
| LG-MED-11 | Master policy | FRONTIER | none | none | none | none | no | Frozen |

---

## ACCESSIBILITY

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-ACC-01 | Keyboard | IMPLEMENTED / NOT APPROVED | exists | — | — | exists | no | Keep map |
| LG-ACC-02 | Focus trap | EXPLORING | lab-false | — | UNKNOWN | UNKNOWN | no | Do not copy lab |
| LG-ACC-03 | Live index | IMPLEMENTED / NOT APPROVED | exists | — | emulated | emulated | no | Keep |
| LG-ACC-04–10 | RM / targets / contrast / restore / thumbs / FS / hidden | EXPLORING | mixed | unapproved | emulated | emulated | no | After chrome design |

---

## PWA

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-PWA-01 | Browser Back | IMPLEMENTED / NOT APPROVED | exists | — | UNKNOWN | emulated | no | Architecture keep |
| LG-PWA-02–06 | Android / PWA / iPhone / Chrome | EXPLORING | UNKNOWN | — | no | — | **no** | Device matrix later |
| LG-PWA-07 | Safe areas | IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | UNKNOWN | no | Device later |
| LG-PWA-08–10 | FS diffs / loops / refresh | EXPLORING | stub | — | UNKNOWN | UNKNOWN | no | Later |

---

## PERFORMANCE

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-PER-01–12 | Open / swipe / zoom / memory / Android / 30–100+ | UNKNOWN / EXPLORING | UNKNOWN | — | UNKNOWN | UNKNOWN | no | Do not invent numbers |

---

## EXPERIMENTS

| ID | ITEM | STATUS | FUNCTION | VISUAL | MOBILE | DESKTOP | REAL DEVICE | NEXT ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LG-TEC-01 | Three.js Stage | IMPLEMENTED / NOT APPROVED | exists | unapproved | Tune only | Tune only | no | Preserve; default off |
| LG-TEC-02–14 | WebGPU / depth / AI / Kinetic / … | FRONTIER | none | none | none | none | no | Frozen |
| LG-TEC-15 | Exposure Remanence GPU | EXPERIMENT IMPLEMENTED / NOT APPROVED | exists | unapproved | emulated | — | no | WebGL2 ping-pong; clipped to photo; sleeps when idle |
| LG-UG-01–15 | Unreasonably good | FRONTIER | — | — | — | — | no | See FRONTIER.md |
