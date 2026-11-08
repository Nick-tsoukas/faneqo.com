# Living Gallery — frontier / unreasonably good

Preserve ambition without expanding CURRENT_PHASE.

Do **not** implement these items. Coding agents must not “just start” them.

Updated 2026-09-09.

---

## LG-UG-01 Continuous Photograph

Gallery surface → future Memory Deck → Living Gallery → zoom → return.

**Why it could matter:** The photograph should feel like one object, not a sequence of disconnected UIs. This is the long-term physical identity of Faneqo photography (`LG-P06`).

**Dependencies:** Production Gallery doorway; optional Memory Deck; source bounds; focus restore; possibly View Transition API.

**Risks:** Scope explosion. Fake continuity that jumps. Fighting PhotoSwipe open/close.

**When to revisit:** After Pure View + source-return are approved and a real Gallery thumbnail is the opener.

**Status:** FRONTIER (principle recorded; Memory Deck not in scope).

---

## LG-UG-02 Best Contact Sheet on the Web

**Why it could matter:** Contact sheets are how photographers think. A world-class sheet could become a Faneqo signature without becoming chrome noise.

**Dependencies:** LG-THM art direction; virtualization for large galleries; motion; keyboard; ensure-active-visible.

**Risks:** Becoming a filmstrip gadget. Performance on 100+ images. Competing with the photograph.

**When to revisit:** After Contact Sheet deliverable in Visual Art Direction is accepted.

**Status:** FRONTIER as “best on the web”; current strip is a stub (LG-QD-006).

---

## LG-UG-03 Adaptive Editorial Composition

**Why it could matter:** Desktop portrait vs landscape vs ultrawide could feel authored like a magazine, not a contain-fit.

**Dependencies:** High-res derivatives; art direction; possibly later content intelligence (LG-UG-11).

**Risks:** Overfitting to fixtures. Reflow when chrome appears (forbidden).

**When to revisit:** During desktop/ultrawide art direction; intelligence later.

**Status:** FRONTIER for intelligence. Device/orientation resolver is IMPLEMENTED / NOT APPROVED.

---

## LG-UG-04 Native-Class Mobile Physicality

**Why it could matter:** Beat Fancybox on a phone in the hand — flick, reverse, edge, swipe-down cancel, pinch-close.

**Dependencies:** Real-device testing; PhotoSwipe tuning only where evidence requires it; no second gesture engine.

**Risks:** Chasing native apps. Breaking familiar physics.

**When to revisit:** Immediately after first real-device session (LG-QD-002). Still do not invent a new engine.

**Status:** FRONTIER as quality bar; mechanism exists, unvalidated.

---

## LG-UG-05 Exact Photograph Sharing

**Why it could matter:** Share *this* frame of *this* Night, not a generic Gallery URL.

**Dependencies:** Canonical photo URLs; deep link exact index; authorization; attribution.

**Risks:** Leaking private media. Inventing routes. OG lying about the photo.

**When to revisit:** After share art direction + a real URL contract. Not during visual-only phase.

**Status:** FRONTIER / DEFERRED. Lab share uses the lab page.

---

## LG-UG-06 Photographer-Respecting Presentation

**Why it could matter:** Credit, non-destructive presentation, no demo restyle. The photographer remains the author (`LG-P08`).

**Dependencies:** Photographer data (missing in fixture); credit layout; share attribution.

**Risks:** Inventing credits. Covering the photograph with type.

**When to revisit:** When photographer fields exist in fixture or production.

**Status:** FRONTIER as craft bar; credit slot exists, data does not (LG-QD-004).

---

## LG-UG-07 Hero Micro-Depth

**Why it could matter:** A tiny, earned spatial cue on a hero frame — never as wallpaper.

**Dependencies:** Depth map or approximation; GPU Stage; art direction; LG-D010.

**Risks:** Demo-ism. Battery. Uncanny faces. Becoming Enter the Night.

**When to revisit:** After Living Gallery Pure View is approved and a single hero case is proven.

**Status:** FRONTIER. Stage code preserved, not product-approved (LG-D011).

---

## LG-UG-08 Kinetic Memory From Real Burst Sequences

**Why it could matter:** Real burst photography could imply life without fake video.

**Dependencies:** Burst assets; timing; reduced motion; never invent motion from a still.

**Risks:** Fake cinema. Heavy decode. Enter the Night overlap.

**When to revisit:** Only with real burst sequences and a frozen Enter the Night boundary.

**Status:** FRONTIER. Frozen in CURRENT_PHASE.

---

## LG-UG-09 Photographic Intelligence

**Why it could matter:** Detect crop risk, horizon, face/performer, exposure — to *protect* the photograph, not to filter it.

**Dependencies:** On-device or private inference; consent; performance budget.

**Risks:** Restyling the photo. Privacy. Scope.

**When to revisit:** After the dumb, beautiful presentation is approved.

**Status:** FRONTIER.

---

## LG-UG-10 Relationship-Aware Photography

**Why it could matter:** “You were there.” “Your third Night with Badflower.” Makes the photograph a relationship object.

**Dependencies:** Attendance truth; visibility rules; Passport; never invent attendance.

**Risks:** Leaking cross-artist Passport. Putting relationship chrome on the photograph too early.

**When to revisit:** After Living Gallery inspection is excellent; relationship context stays DEFERRED (`LG-INF-09`).

**Status:** FRONTIER / DEFERRED.

---

## LG-UG-11 Responsive Composition Based on Image Content

**Why it could matter:** Padding could honor subject, negative space, saliency, performer, horizon.

**Dependencies:** LG-UG-09 or authored focal points; must not reflow the photo when chrome toggles.

**Risks:** Fighting the photographer’s crop. Jank. Wrong subject.

**When to revisit:** After device/orientation composition is visually approved.

**Status:** FRONTIER.

---

## LG-UG-12 Seamless Thumbnail-to-Viewer Object Continuity

**Why it could matter:** The contact-sheet print becomes the Living Gallery print without a clone jump.

**Dependencies:** Source bounds; View Transition API or PhotoSwipe zoom; Memory Deck later.

**Risks:** Fighting PhotoSwipe. Reduced-motion conflicts.

**When to revisit:** With contact-sheet art direction + a real source thumbnail.

**Status:** FRONTIER. Mechanism hooks exist; quality unproven (LG-QD-018).

---

## LG-UG-13 High-Quality Social Share Rendering

**Why it could matter:** Shared photography should look like Faneqo photography, not a random OG crop.

**Dependencies:** Share Kit / OG pipeline; exact photo; attribution; multiple aspect ratios.

**Risks:** Retrofitting Share Kit from an unrelated pass (roadmap forbids casual retrofit).

**When to revisit:** Share Kit / social-image phase, after exact-photo URLs exist.

**Status:** FRONTIER.

---

## LG-UG-14 Future Spatial Photography

**Why it could matter:** Light field / depth / spatial capture could eventually be a Faneqo differentiator.

**Dependencies:** Capture pipeline that does not exist; WebGPU; huge performance/privacy cost.

**Risks:** Science-project. Not concert-photography v1.

**When to revisit:** When spatial assets exist. Not before.

**Status:** FRONTIER.

---

## LG-UG-15 Future Owned-Audio Synchronization

**Why it could matter:** A photograph that breathes with a licensed moment of the Night.

**Dependencies:** Owned/licensed audio; Night Recordings policy; never steal.

**Risks:** Becoming Enter the Night. Rights. Autoplay hostility.

**When to revisit:** Research only, after both Living Gallery and Night audio products are real.

**Status:** FRONTIER. Research only.

---

## Related experimental IDs (see ATOMIC_OUTLINE LG-TEC)

LG-TEC-01…14 record technology bets. Most are FRONTIER. Existing Stage is IMPLEMENTED / NOT APPROVED as an experiment, not a product look.

LG-TEC-15 / LG-MOT-12 Memory Residue is a **lab experiment** with signature candidate MR-B (LG-D023). It is not FRONTIER-unbuilt; it is also not product. Default remains off.

Gallery Doorway and Memory Deck remain FRONTIER / frozen. Slice 06 stopped before both.
