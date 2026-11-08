# Memory System — decision register

Updated 2026-09-09.

Status: NOT STARTED · EXPLORING · IMPLEMENTED / NOT APPROVED · APPROVED V1 · DEFERRED · FRONTIER · REJECTED

Living Gallery decisions stay in `docs/gallery/living-gallery/FANEQO_LIVING_GALLERY_DECISIONS.md`. Do not renumber them.

---

## GD-D001 — Doorway and Deck are one screen

**Decision:** Context + Deck + gallery actions live on one mobile screen. No intermediate page.

**Why:** Simplest compelling V1. Extra pages dilute the memory.

**Rejected alternatives:** Doorway page that then routes to a separate Deck page.

**Status:** IMPLEMENTED / NOT APPROVED

---

## GD-D002 — MOBILE = PRODUCT TRUTH

**Decision:** Reuse LG-D008. No desktop Doorway / Deck in this slice.

**Status:** IMPLEMENTED / NOT APPROVED

---

## GD-D003 — Flexible context, no invented show

**Decision:** Reuse LG-D019. Show-linked / general / minimal. No empty separators. No fake venue or date.

**Status:** IMPLEMENTED / NOT APPROVED

---

## GD-D004 — Artist identity may be stronger than Living Gallery chrome

**Decision:** Doorway leads with artist + collection. Living Gallery chrome stays quieter. Do not use blurred wallpaper or a marketing hero.

**Status:** IMPLEMENTED / NOT APPROVED

---

## GD-D005 — PWA shell on Doorway, focused mode in Living Gallery

**Decision:** Doorway simulates existing mobile app navigation. Living Gallery hides global nav. Close returns to the Doorway / Deck position.

**Status:** IMPLEMENTED / NOT APPROVED (production: real `MobileBottomNav` when `from=/galleries` or artist; lab still uses LabAppDock)

---

## GD-D007 — Memory Deck is a Gallery Page component

**Decision:** The three product surfaces are Galleries Home, Gallery Page, Living Gallery. “Memory Deck” is only the Gallery Page photo-stack. No extra route.

**Status:** IMPLEMENTED / NOT APPROVED

**Date:** 2026-09-09. Evidence: Slice 08.

---

## GD-D006 — Gallery-level Share is distinct from photo Share

**Decision:** Gallery Page exposes Share Gallery (`NightShareSheet`, canonical share path). Living Gallery keeps Share photograph.

**Status:** IMPLEMENTED / NOT APPROVED

---

## MD-D001 — Deck is a finite physical collection

**Decision:** One dominant front photograph, 2–4 subtly stacked behind. Restrained offset / rotation. Black field. Not Cover Flow, Tinder, or a 3D carousel.

**Status:** IMPLEMENTED / NOT APPROVED

---

## MD-D002 — One photograph is a singular object

**Decision:** If the collection has one image, do not fake a stack.

**Status:** IMPLEMENTED / NOT APPROVED

---

## MD-D003 — Shared index with Living Gallery

**Decision:** One `selectedIndex` / mediaId. Thumbnails, Deck, and Living Gallery read the same identity. Close must not reset to image 1.

**Status:** IMPLEMENTED / NOT APPROVED

---

## MD-D004 — Deck physics ≠ PhotoSwipe

**Decision:** Deck owns swipe / resistance / settle only. PhotoSwipe remains Living Gallery physics. No new animation dependency.

**Status:** IMPLEMENTED / NOT APPROVED

---

## MD-D005 — Front photograph is the primary entry

**Decision:** Tap / activate the front photograph to enter Living Gallery. No giant VIEW GALLERY CTA in V1.

**Status:** IMPLEMENTED / NOT APPROVED

---

## MD-D006 — No Memory Residue on the Deck in V1

**Decision:** Advanced effects stay off the Deck until layout, touch, and continuity work.

**Status:** APPROVED V1 (scope boundary)

---

## MD-D007 — Front frame owns the Deck

**Decision:** Every visible Deck card is the **active photograph's fitted rectangle**. Rear cards are the same box, shifted 14–17px right and 2–4px down, rotated ≤1.7°. Rear images are clipped (`object-fit: cover`). The active photograph is not cropped.

**Why:** Slice 07 full-stage `contain` let mixed aspects leak above and below the front print.

**Rejected:** Full-stage contain cards (07). Independent-aspect rear cards.

**Status:** IMPLEMENTED / NOT APPROVED

**Date:** 2026-09-09. Evidence: Slice 07A.

---

## LG-D024 — Info expands the memory

Recorded also in Living Gallery decisions. Info does not restate Artist / Venue / Date already shown in chrome. When Info is open, identity chrome yields to the expansion.
