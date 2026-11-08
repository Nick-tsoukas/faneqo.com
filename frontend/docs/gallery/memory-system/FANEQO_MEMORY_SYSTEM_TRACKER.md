# Memory System — tracker

Updated 2026-09-09. Current phase: **Slice 08 — Gallery Page app integration**. Memory Deck = Gallery Page stack component.

Nothing below is APPROVED V1 visually. REAL DEVICE: no.

Status: NOT STARTED · EXPLORING · IMPLEMENTED / NOT APPROVED · APPROVED V1 · DEFERRED · FRONTIER · REJECTED

---

## VISION

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| MS-VIS-01 | Galleries Home → Gallery Page → Living Gallery | IMPLEMENTED / NOT APPROVED | Founder review |
| MS-VIS-02 | A concert disappears. The photograph remains. | EXPLORING | Not concert-only |

---

## LAYOUT

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| GD-LAY-01 | Mobile Doorway compose | IMPLEMENTED / NOT APPROVED | Founder at 390 / 430 |
| GD-LAY-02 | Desktop Doorway | NOT STARTED | Do not start |
| MD-LAY-01 | Front frame + 2 rear hints | IMPLEMENTED / NOT APPROVED | 07A: same-frame, 14px right reveal |
| MD-LAY-02 | Singular one-photo object | IMPLEMENTED / NOT APPROVED | No fake stack |
| MD-LAY-03 | Mixed aspect Deck | IMPLEMENTED / NOT APPROVED | Front keeps real aspect |

---

## CONTEXT

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| GD-CTX-01 | Show-linked | IMPLEMENTED / NOT APPROVED | Lab: Show |
| GD-CTX-02 | General | IMPLEMENTED / NOT APPROVED | Lab: General |
| GD-CTX-03 | Minimal | IMPLEMENTED / NOT APPROVED | Lab: Minimal |
| GD-CTX-04 | Short caption / More | IMPLEMENTED / NOT APPROVED | Show fixture has no gallery caption |

---

## DECK

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| MD-DEC-01 | Front photograph | IMPLEMENTED / NOT APPROVED | Primary entry |
| MD-DEC-02 | Stack layers | IMPLEMENTED / NOT APPROVED | Transparent cards so layers read |
| MD-DEC-03 | Finite bounds | IMPLEMENTED / NOT APPROVED | Resistance at ends |

---

## THUMBNAILS

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| MD-THM-01 | Miniature rail | IMPLEMENTED / NOT APPROVED | Hidden if 1 photo |
| MD-THM-02 | Sync with Deck index | IMPLEMENTED / NOT APPROVED | Shared selectedIndex |

---

## PHYSICS

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| MD-PHY-01 | Swipe / drag | IMPLEMENTED / NOT APPROVED | Emulated; real finger later |
| MD-PHY-02 | Resistance / settle | IMPLEMENTED / NOT APPROVED | CSS settle; no new lib |

---

## MOTION

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| GD-MOT-01 | Restrained Doorway | EXPLORING | No constant motion |
| MD-MOT-01 | Layer change settle | IMPLEMENTED / NOT APPROVED | Founder taste |
| MD-MOT-02 | Deck → LG object continuity | IMPLEMENTED / NOT APPROVED | sourceBounds / data-gx-deck-front |

---

## ENTRY / RETURN

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| MD-ENT-01 | Tap front → same photo in LG | IMPLEMENTED / NOT APPROVED | Wired on public Gallery route |
| MD-RET-01 | Close → exact Gallery Page image | IMPLEMENTED / NOT APPROVED | Wired; no dashboard redirect |

---

## PWA

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| GD-PWA-01 | App dock on Gallery Page | IMPLEMENTED / NOT APPROVED | Real MobileBottomNav when from=/galleries |
| LG-PWA | Focused Living Gallery | IMPLEMENTED / NOT APPROVED | Existing LG behavior |

---

## ACCESSIBILITY / PERFORMANCE / QUALITY

| ID | ITEM | STATUS | NEXT ACTION |
| --- | --- | --- | --- |
| GD-ACC-01 | Labels / keyboard front card | IMPLEMENTED / NOT APPROVED | Emulated |
| GD-PER-01 | No extra GPU on Deck | IMPLEMENTED / NOT APPROVED | Keep |
| MS-QD | See QUALITY_DEBT | OPEN | Founder review |
