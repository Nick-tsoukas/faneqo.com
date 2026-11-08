# Memory System — quality debt

Updated 2026-09-09.

Severity: CRITICAL · HIGH · MEDIUM · LOW  
Status: OPEN · MITIGATED IN LAB · DEFERRED · FRONTIER

---

### MS-QD-001 — Real device not tested

**Severity:** CRITICAL before any product claim  
**Status:** OPEN  
**Reason:** Doorway, Deck swipe, and Deck → Living Gallery continuity are **EMULATED ONLY** (390×844).  
**Revisit:** iPhone Safari + Android Chrome + installed PWA.

---

### MS-QD-002 — Object continuity is seam-based, not a custom shared-element engine

**Severity:** MEDIUM  
**Status:** OPEN  
**Reason:** Open/close uses PhotoSwipe `getThumbBoundsFn` via `data-gx-deck-front` / sourceElement. Letterboxed Deck images may yield bounds that do not match the visible print exactly.  
**Related:** MD-MOT-02, LG-PHO-11

---

### MS-QD-003 — Simulated PWA dock is not production navigation

**Severity:** HIGH if copied  
**Status:** MITIGATED IN APP  
**Reason:** LabAppDock stays lab-only (`showDock`). Production Gallery Page uses real `MobileBottomNav` when `from=/galleries` or the viewer is the artist. Hidden while Living Gallery is open.  
**Related:** GD-D005

---

### MS-QD-010 — Desktop Gallery Page is an unused field

**Severity:** LOW (mobile = product)  
**Status:** DEFERRED  
**Reason:** Slice 08 is mobile-only. Wide viewports leave empty black to the right of the stack.  
**Revisit:** Only if founder asks for desktop Gallery.

---

### MS-QD-011 — Stack → Gallery Page View Transition print handoff

**Severity:** MEDIUM  
**Status:** OPEN  
**Reason:** Archive cards still set `fqGalleryPrint`. The old lightbox consumed that name. The Gallery Page stack does not. Open may snap more than the previous grid/lightbox handoff.  
**Related:** `stackOpenNavigation.js`

---

### MS-QD-012 — Logged-in `/galleries` not proven this session

**Severity:** HIGH before claiming production-complete  
**Status:** OPEN  
**Reason:** Integration was verified on `/__dev/galleries-archive` → `/__dev/gallery-open/:slug` with real `PublicGalleryExperience` + fixture payloads that match public Gallery shape. Artist-auth `/galleries` was not walked in this session.

---

### MS-QD-004 — Show-linked Doorway has no gallery caption

**Severity:** LOW  
**Status:** OPEN  
**Reason:** Basement East fixture has no `galleryCaption`. General kind proves short caption.  
**Related:** GD-CTX-04

---

### MS-QD-005 — Deck stack taste unapproved

**Severity:** HIGH if copied as locked art direction  
**Status:** OPEN  
**Reason:** Offset / rotation / opacity / shadow are a first hypothesis. Founder must judge whether the stack feels physical or gimmicky.  
**Related:** MD-D001

---

### MS-QD-007 — Share Gallery contrast

**Severity:** MEDIUM  
**Status:** MITIGATED IN LAB  
**Reason:** Share moved to the header as a near-white text action. Founder still must approve.  
**Related:** GD-D006

---

### MS-QD-008 — Doorway type hierarchy

**Severity:** MEDIUM  
**Status:** MITIGATED IN LAB  
**Reason:** Collection is secondary-strong; place/date muted; count tertiary.  
**Related:** GD-CTX-01

---

### MS-QD-009 — Deck thumbnail tap targets

**Severity:** MEDIUM  
**Status:** MITIGATED IN LAB  
**Reason:** Native-aspect thumbs, 56px tall, min 44px. Active 1px near-white edge.  
**Related:** MD-THM-01

---

### MS-QD-006 — Lab overlays can still cover Living Gallery

**Severity:** MEDIUM  
**Status:** MITIGATED IN LAB (Doorway)  
**Reason:** Compare / Tune stay hidden on the default Doorway. They still appear when Living Gallery is open (`!reviewMode`). Press R for review.  
**Related:** GD-D005
