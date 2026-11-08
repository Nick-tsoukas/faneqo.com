# Gallery Page — handoff

Updated 2026-09-09. **Slice 09 — pristine photograph + three transitions.**

---

# CURRENT PHASE

Stack visual is gone. One clean photograph. Three transition experiments. **Founder chooses.** Nothing APPROVED V1.

**STOP.**

---

# HOW TO JUDGE (PHONE)

Lab: `http://localhost:3000/__dev/gallery-experience`  
Keys **1 Print · 2 Hold · 3 Afterimage**. Tap the photograph. Close. Repeat.

Or a real Gallery Page:

```
/__dev/gallery-open/lab-1?gx=print
/__dev/gallery-open/lab-1?gx=hold
/__dev/gallery-open/lab-1?gx=afterimage
```

Ask: which one feels like the same photograph traveling — and which one is actually special?

---

# WHAT CHANGED

- No rear cards. Front photo is uncropped (`contain`).
- `print` = PhotoSwipe zoom from captured bounds
- `hold` = fade; the print stays
- `afterimage` = zoom + Memory Residue MR-B on open (and close residue if enabled)
- Page stays in the DOM while Living Gallery is open so return has a home

---

# DO NOT TOUCH NEXT

Galleries Home · Show Recap · Enter the Night · picking a default without founder · commit / push

---

# GIT

No commit. No push.
