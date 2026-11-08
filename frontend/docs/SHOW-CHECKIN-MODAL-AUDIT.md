# Show Mode check-in modal — audit, fixes, and recommendations

**Date:** July 31, 2026
**Scope:** the fan-facing check-in modal and the badge/share panel inside it.
**Not in scope:** Show Recap, messaging/deliverability, cron, backend check-in logic, homepage.

This document is written to be handed to someone with no prior context on the
codebase. It records what was broken, what was changed, what is still risky, and
an open product question about whether the badge should become its own modal.

Related: [`SHOW-MODE.md`](./SHOW-MODE.md) (the whole system),
[`SHOW-RECAP-FLOW-AUDIT.md`](./SHOW-RECAP-FLOW-AUDIT.md) (post-show flow).

---

## 1. TL;DR

The modal had one genuine layout bug and one genuine content bug, plus a stack
of CSS choices that together are a well-known browser compositing hazard.

1. **Nothing could scroll.** The card had no max-height, no scroll container,
   and `overflow: hidden`. Content taller than the viewport was pushed off both
   the top and bottom edges with no way to reach it. The close button went off
   the top first.
2. **The show details rendered twice.** The header printed band name, show
   title, venue and city; the success and already-checked-in states printed the
   title, venue and city again directly beneath.
3. **Three nested `backdrop-filter` layers inside a `transition: all` +
   `transform: scale()` container**, with a scoped `* { transition-property: … }`
   rule on every descendant. This is the most likely explanation for the
   reported "content repeating vertically many times", though it is an
   inference from the code rather than something reproduced in a browser.

All three are fixed. The modal is now a viewport-clamped flex column with a
single internal scroll region and a top bar that cannot scroll away.

---

## 2. How the check-in surface is assembled

```
pages/[bandSlug]/index.vue          ← owns canonical modal state
  ├─ checkInModalOpen (ref)
  ├─ openCheckInModal() / closeCheckInModal()
  └─ <ShowCheckInModal>             ← ONE instance, mounted once, for all templates
        └─ Teleport to body
             └─ overlay → card → scroll region → one active state block
                   └─ <ShowCheckInRewardSlot>   ← badge + 3 share buttons
                         └─ useShareKit()
                               └─ utils/fanShare/imageGenerator.js
                                     generateShowCheckInBadgeImage()  ← 1080×1080 canvas
```

**Entry points.** Two, both routed to the same `openCheckInModal()`:
the embedded `ShowCheckInButton` inside `FanCaptureSection` (which emits
`open-check-in-modal` upward), and the zero-tap auto-open that fires ~1.2s after
`canOfferCheckIn` becomes true for a fan whose attendance resolved to
not-checked-in and who hasn't dismissed. The floating artist-page
"Check In to Tonight's Show" pill was removed in Sep 2026 — check-in entry
belongs to the show context, not to a persistent overlay on public artist
content.

**State machine** inside the modal, one `state` ref, six mutually exclusive
branches: `idle → identity_needed → submitting → success | already_checked_in | error`.

**Network behaviour** (unchanged by this work): `POST /api/fan-interactions/check-in`
with a 12s timeout and three attempts at 0/1.5s/4s. A 4xx aborts immediately.
Anything else falls through to `useShowCheckInQueue`, which persists the payload
in `localStorage` and replays it later — the fan still sees success, because
they really are standing in the room.

---

## 3. What was broken

### 3.1 Ruled out first

Three plausible causes for "repeating content" were checked and cleared, so
nobody re-investigates them:

| Suspect | Finding |
|---|---|
| Multiple modal instances | Exactly one `<ShowCheckInModal>` in the codebase, at `pages/[bandSlug]/index.vue:1430`. |
| `ShowCheckInRewardSlot` rendered twice | It appears twice in the template, but in mutually exclusive `v-else-if` branches (`success`, `already_checked_in`). Only one can mount. |
| `composables/useShowCheckIn.js` duplicate state | Deprecated in an earlier pass. It has **zero consumers** — the only textual match is its own header comment. It renders nothing. |

### 3.2 Bug 1 — the modal could not scroll (verified)

The overlay was:

```
fixed inset-0 z-50 flex items-center justify-center p-4
```

and the card was `w-full max-w-md` with `overflow-hidden`. No `max-height`
anywhere, no `overflow-y: auto` anywhere.

Consequence: as soon as content exceeded the viewport, `items-center` split the
overflow evenly off the top and bottom. The card clipped its own content, and
the overlay had nothing to scroll. The close button was `absolute top-4 right-4`
on the card, so it was the first thing to leave the screen.

The success state always exceeds a 700px-tall desktop window: header block, show
details, success heading, body copy, badge image (up to 280px), verification
pill, three share buttons, Done button.

There was also **no body scroll lock**, so the page behind moved under the
fan's finger while they tried to scroll the modal — which reads as the modal
drifting.

### 3.3 Bug 2 — show details rendered twice (verified)

The header block showed `bandName`, `showTitle`, `venue`, `city`. The `success`
state and the `already_checked_in` state each re-printed `showTitle`, `venue`
and `city` immediately below. Two stacked copies of the same information on the
most important screen in the flow.

### 3.4 Bug 3 — compositing hazard (inferred, not reproduced)

Four things stacked on top of each other:

- `backdrop-blur-sm` on the overlay
- `backdrop-blur-xl` on the card
- `backdrop-filter: blur(10px)` on `.reward-slot` — a third, nested inside the
  other two
- `transition: all` on the animating container, with
  `transform: scale(0.9) translateY(20px)` on enter

plus a scoped catch-all:

```css
* {
  transition-property: color, background-color, border-color, box-shadow, transform;
}
```

which applied a transition to every element in the subtree, including the
reward slot's animated glow and shimmer.

Nested `backdrop-filter` inside a transformed, `overflow: hidden`, already
backdrop-filtered ancestor is a documented source of tiling and smearing
artifacts in Chromium. Combined with `transition: all` on the same container it
is a reasonable explanation for content appearing to repeat down the page.

**Confidence: moderate.** The ingredients are definitely present and definitely
bad practice. Whether they produced the exact symptom was not confirmed in a
browser. All of them have been removed regardless.

### 3.5 Smaller issues found

- **No Escape handling.** There was none at all. A `@keydown.esc` on a
  non-focused `div` would not have fired either.
- **Share row could overflow at 390px.** `.share-buttons` was
  `display: flex; flex-wrap: wrap` with three labelled buttons; the labels could
  push the row wider than the card.
- **Badge image had no height cap.** 1080×1080 source constrained only by
  `max-width: 280px`, so on a short window it consumed the viewport.
- **Inputs were below 16px in effective size**, which makes iOS Safari zoom the
  page on focus — a bad look mid-flow at a show.
- **Weak visual anchor.** A 🎸 emoji served as the icon for idle, success and
  already-checked-in states alike.

---

## 4. What changed

### `components/band/ShowCheckInModal.vue` — rewritten

Structure is now:

```
.checkin-viewport     fixed, inset 0, near-black canvas, the scroll container
  .checkin-frame      min-height 100dvh, max-width 520px, safe-area padding + 12/16px gutters
    .checkin-chrome   quiet close control, in flow, never on the device edge
    .show-identity    LIVE · TONIGHT → artist (once) → venue · city → date
    .show-hero        inset, clamp(190px, 38dvh, 340px), cover + fade into the canvas
    .checkin-body     one active state block; the footnote sits on margin-top: auto
```

Sep 2026 replaced the centred card with a full-viewport experience: the whole
surface scrolls rather than an inner region, so short phones get natural
scrolling instead of crushed spacing.

Once attendance exists the composition inverts. `.show-identity` and
`.show-hero` are gated on `!isCheckedIn`; the success state renders its own
compact `.identity-row` (72px thumbnail + artist + venue · city · date) so the
confirmation, the account value and both actions fit inside 100dvh on a
390–430px phone. Pre-check-in is cinematic; post-check-in is action-first.

Other changes:

- Close button moved into the non-scrolling top bar. It is now structurally
  incapable of leaving the viewport.
- Body scroll lock on open, restored on close and on unmount.
- Real `window` keydown listener for Escape, bound and unbound with open state.
- Enter/leave transition is **opacity only**. No transform, no `transition: all`.
- The `* { transition-property: … }` rule is gone.
- Duplicate show-detail blocks removed from both success states.
- `overscroll-behavior: contain` so modal scrolling doesn't chain to the page.
- Inputs at `font-size: 16px`, CTA at `min-height: 54px`.
- `overflow-wrap: anywhere` on venue/title/email so long strings can't force
  horizontal overflow.
- `prefers-reduced-motion` block that disables the fade and slows spinners.

**New idle-state treatment.** An event-pass emblem replaces the emoji: the
band's own photo in a glowing ring when `bandImageUrl` is present, otherwise a
drawn ticket-stub SVG, with a small pink `LIVE` pill on the bottom edge. Success
and already-checked-in use drawn checkmarks in green and blue rings; error uses
an outlined warning circle. No emoji remain in the modal.

**Copy**, per spec:

| Slot | Text |
|---|---|
| Idle title | "You're at the show." |
| Idle subtitle | "Check in with the band and join tonight's fan list." |
| Idle CTA | "Check In at Tonight's Show" |
| Reassurance | "No spam. Just updates from the artist." |
| Success title | "You're checked in." |
| Success subtitle | "You joined tonight's show list. The band can keep you posted after the show." |

Band name, show title, venue and city now appear exactly once, in the header,
persistent across every state.

### `components/band/ShowCheckInRewardSlot.vue` — CSS only

No logic touched. Badge generation, share, download and copy behave identically.

- Removed the nested `backdrop-filter`.
- Badge image capped at `max-height: 34dvh` with `object-fit: contain`;
  `max-width` reduced to 240px desktop / 200px mobile.
- Share row converted from wrapping flex to `grid-template-columns: repeat(3, minmax(0, 1fr))`
  with `min-width: 0` and ellipsis on labels — cannot overflow at 390px.
- Buttons given `min-height: 42px` for thumb targets.
- `transition: all` narrowed to specific properties.
- `prefers-reduced-motion` disables the shimmer and glow animations.

---

## 5. Still open — risks not addressed in this pass

These are real and worth a decision before this goes in front of large audiences.

### 5.1 The shareable badge is stamped with legacy branding

`utils/fanShare/imageGenerator.js`, inside `generateShowCheckInBadgeImage()`:

```js
ctx.fillText('via MusicBizQR', width / 2, height - 55)
```

Every badge a fan shares to Instagram carries **MusicBizQR**, not Faneqo. This
is the single highest-visibility branding leak in the product — it is the asset
most likely to be seen by people who have never heard of either name. The same
string appears in three other generators in the same file and in
`useShareKit.js`.

This is a deliberate-looking legacy string, not a bug, so per the repo's
rebrand rule it needs classifying rather than blind replacing. But on a
fan-facing shareable, the answer is almost certainly "change it".

### 5.2 Badge generation can silently degrade

`loadImage()` in `useShareKit.js` tries four strategies to get the band photo
onto the canvas: backend proxy, direct with `crossOrigin`, fetch-to-blob, and
finally **loading without `crossOrigin` at all**. That last fallback taints the
canvas, which makes `toBlob()` throw. The generator catches it and resolves
`null`, so the UI degrades to the fallback panel — which still says "Your badge
is ready to share" while both Share Badge and Download are disabled.

That copy is wrong in the failure case, and the failure case is silent.

### 5.3 Badge generation blocks the reward panel

`generateBadge()` runs a `nextTick()`, a hard `setTimeout(100)`, a remote image
load with a 10s timeout, and a 1080×1080 canvas composite — on the main thread,
on a phone, on venue wifi. Until it resolves, the fan sees a shimmer. There is
no timeout on the overall operation and no retry.

### 5.4 Nothing tracks whether the badge is ever shared

`useShareKit` exposes `trackShareAction` and `webShareWithTracking`, but
`ShowCheckInRewardSlot` calls the untracked `webShareShowCheckInBadge`,
`downloadShowCheckInBadge` and `copyShowCheckInLink`. So there is no data on
whether the badge — the most expensive part of this flow to build and maintain —
actually drives shares. That is exactly the number a band manager will ask for.

### 5.5 No focus management

The modal sets `role="dialog"` and `aria-modal="true"` but does not move focus
into the card on open, does not trap Tab, and does not restore focus on close.

---

## 6. Open question: should the badge be its own modal?

Right now the badge panel lives inside the success state of the check-in modal.
That means the most emotionally valuable moment (the shareable) is competing for
vertical space with confirmation copy and a Done button, and it can only appear
after a network round trip plus a canvas composite.

### Option A — keep it inline (current)

*Pros:* one surface, one mental model; no extra navigation; the fan sees the
reward at the exact moment of payoff; already built and now fits properly.

*Cons:* the success screen is the tallest screen in the flow and always scrolls
on a short window; the badge's loading shimmer delays the sense of completion;
sharing and confirmation are visually the same weight, so neither wins.

### Option B — separate badge modal, opened from success

Success becomes short and instant: emblem, "You're checked in.", one line of
copy, and a primary "Get your badge" button plus a quiet "Done". Tapping the
button swaps to a dedicated, full-bleed badge surface built for the image.

*Pros:* success renders instantly with zero network dependency — the
confirmation never waits on canvas work. The badge gets a full screen, so it can
be big, cinematic, and genuinely screenshot-worthy. Share becomes an explicit,
measurable intent rather than an ambient option. Badge failures degrade into "we
couldn't make your badge" on a surface the fan chose to open, instead of
poisoning the confirmation.

*Cons:* one extra tap between the fan and the share. Two surfaces to maintain.
Some fans will never open it, so raw badge impressions drop even if share *rate*
rises.

### Option C — inline teaser, expand to full screen

Success shows a small, non-interactive badge thumbnail as a reward cue; tapping
it opens the full badge surface. Blends A and B.

*Pros:* keeps the visual payoff immediate while giving the badge room when it
matters. The thumbnail can render optimistically from a low-cost placeholder
before the real composite lands.

*Cons:* the most work of the three; needs a genuinely good thumbnail treatment
or it looks like a broken image.

### Recommendation

**Option B, with the success screen made instant.** The strongest argument is
not layout — it is that confirmation should never depend on canvas work
succeeding. Today, a fan on bad venue wifi with a CORS-tainted band photo gets a
success screen with a dead share panel on it. Splitting the surfaces means the
check-in confirmation is pure local state and appears the instant the POST
returns (or the instant it queues offline), and the badge becomes a separate,
opt-in, fully-owned moment that can fail gracefully on its own.

Option C is the better end state if there is appetite for the extra build, but B
gets most of the value for a fraction of the work and is a clean stepping stone
to C.

---

## 7. Recommendations, ranked

Ordered by impact per unit of effort, for a bar where band managers are the
audience.

**1. Replace `via MusicBizQR` on the check-in badge with Faneqo branding.**
One string, maximum visibility. Every shared badge is currently an advert for
the old name. (§5.1)

**2. Make the success screen independent of badge generation.**
Either Option B above, or at minimum render confirmation immediately and let
the badge panel resolve underneath. Confirmation must never wait on a canvas.
(§5.3, §6)

**3. Instrument the share funnel.**
Swap to the `*WithTracking` variants already sitting in `useShareKit`. Without
this there is no answer to "how many fans shared?", which is the first question
a manager asks about this feature. (§5.4)

**4. Fix the failure copy.**
"Your badge is ready to share" next to two disabled buttons is the worst
possible string in the failure state. Detect `badgeState === 'failed'` and say
something honest with a retry. (§5.2)

**5. Put a hard timeout on badge generation.**
Ten seconds of image load plus an uncapped composite is too long for someone
standing in a crowd. Cap the whole operation at ~4s and fall back cleanly.

**6. Add focus management.**
Focus the card on open, trap Tab, restore focus on close. Accessibility is table
stakes at this level, and large clients often audit for it. (§5.5)

**7. Consider a bottom-sheet presentation on mobile.**
Currently a centred card on every breakpoint, which is correct and safe. A
sheet anchored to the bottom edge puts the CTA under the thumb and reads as
more native on phones — which is where essentially all of this traffic is.

**8. Pre-warm the badge.**
Nothing stops the composite starting while the fan is typing their email. By
the time the POST returns the badge could already exist, which would make even
the inline layout feel instant.

**9. Delete `composables/useShowCheckIn.js`.**
Provably dead — zero consumers. It is a trap for the next person who greps for
check-in logic.

---

## 8. How to verify the current fixes

| # | Scenario | Expected |
|---|---|---|
| 1 | Desktop ~700px tall, idle state | Card centred, fully visible, close button visible |
| 2 | Desktop ~700px tall, success state with badge | Card clamped to viewport; body scrolls internally; top bar and close stay put |
| 3 | 390px wide, idle | No horizontal scroll; CTA full width and reachable |
| 4 | 390px wide, success | Badge fits; three share buttons in one row, no overflow |
| 5 | Any state | Show title / venue / city appear exactly **once** |
| 6 | Modal open | Page behind does not scroll; Escape closes; backdrop click closes |
| 7 | Open → close → reopen ×3 | State resets to idle; no accumulated blocks; body scroll restored each time |
| 8 | Reduced motion enabled | No fade, no shimmer, no pulsing glow |
| 9 | Offline (devtools) | Check-in queues, success still shows, offline note appears |

Item 2 is the one that was most broken. Item 5 is the duplication fix.

---

## 9. Files touched in this pass

| File | Change |
|---|---|
| `components/band/ShowCheckInModal.vue` | Rewritten — layout shell, scroll containment, emblem treatment, copy, Escape, scroll lock |
| `components/band/ShowCheckInRewardSlot.vue` | CSS only — nested blur removed, badge height capped, share row gridded |

No backend changes. No changes to the check-in payload, retry logic, offline
queue, badge generation, or share behaviour.

---

## 10. Follow-up: the badge was split onto its own surface (same day)

§6 recommended Option B. It was implemented immediately after this audit was
written, so the sections above describe the *intermediate* state. Current
reality:

**`ShowCheckInRewardSlot.vue` no longer exists.** Its logic moved into
`components/band/ShowCheckInBadgeModal.vue`, a full sibling surface.

**Flow is now two surfaces:**

```
check-in POST returns
  → ShowCheckInModal success state   (instant, pure local state, no canvas)
       "Get Your Badge"  →  page closes check-in modal, opens badge modal
       "Done"            →  closes
  → ShowCheckInBadgeModal            (generating → ready | failed)
```

Both modals are mounted at page level in `pages/[bandSlug]/index.vue`. The check-in
modal emits `open-badge` with its `attendanceData`; the page stores it in
`badgeAttendance` and swaps which modal is open, so exactly one is ever visible.

**Resolved from §5 and §7:**

| Item | Status |
|---|---|
| §5.1 `via MusicBizQR` on badges | Fixed — `via Faneqo` in both `imageGenerator.js` generators and all three in `useShareKit.js` |
| §5.2 dishonest failure copy | Fixed — "We couldn't create your badge." / "You're still checked in — this is just the picture." with Try Again and Copy Link |
| §5.3 success blocked on generation | Fixed — success never touches the canvas |
| §5.4 untracked share funnel | Partially fixed — see below |
| §7 no generation timeout | Fixed — 4.5s overall cap with a run token so a late result can't overwrite a retry |

**Tracking is deliberately partial.** `interactionType` is a strict Strapi
enumeration (`src/api/fan-interaction/content-types/fan-interaction/schema.json`)
and does not contain badge-specific values. So completed badge actions are
recorded as `clicked_share` and distinguished by `metadata.shareType`:
`checkin_badge_share`, `checkin_badge_download`, `checkin_badge_copy_link`.

Only **completed** actions fire. `badge_opened` and
`badge_share_cancelled_or_failed` are **not** tracked — emitting `clicked_share`
for an open or a cancel would inflate `shareClicks` in every Show Recap. Adding
them properly needs a backend enum change, which was out of scope.

**Note for recap readers:** badge shares now count toward `shareClicks` in Show
Recaps. That is arguably correct — a fan sharing a badge *is* a share — but it
is a behaviour change in recap numbers from the date of this deploy.

`trackShareAction` in `useShareKit` was **not** used. It posts to
`/api/pulse/shareables/track` and expects a `shareableId`, which a check-in badge
does not have. `useFanInteractionTracker` is the correct channel and matches how
the rest of the artist page tracks shares.

---

## 11. Cleanup pass — focus management and branding sweep

### Focus management

`composables/useFocusTrap.js` is new: a dependency-free trap used by both
modals. Each dialog element carries `role="dialog"`, `aria-modal="true"` and
`tabindex="-1"` (moved off the overlay, which is only a backdrop). On open the
dialog itself receives focus so assistive tech announces it before tabbing
begins. Tab and Shift+Tab wrap within the dialog, Escape closes, and focus
restores to the opener on close.

The hand-off case is explicit. `ShowCheckInModal.handleOpenBadge()` sets an
internal `handingOffToBadge` flag before emitting, and the close path calls
`deactivate({ restore: false })`. Without it, focus would bounce back to the
floating CTA on the page for a frame before the badge modal claimed it.

Restore is also skipped when the stored element is no longer connected to the
document — a trigger inside a closing dialog is already detached, and focusing
it would silently drop focus to `<body>`.

### Desktop share fallback

`webShare()` returns `{ ok: false }` both when the fan cancels *and* when
`navigator.share` does not exist, so on a desktop browser without the Web Share
API the Share Badge button was a silent no-op. The badge modal now checks for
`navigator.share` on mount and, when absent, hides Share Badge and promotes
Download to primary.

### Branding classification

**Replaced (fan-visible):** the `via MusicBizQR` watermark in both OG image
routes and `MomentumPromptsPanel.vue`; the visible label in
`ShareCustomizeDrawer.vue`; the UI label and copied summary in
`ProofDrawer.vue`; the three social meta descriptions in
`pages/share/moment/[momentId].vue`; and `buildShareText()` in `useShareKit.js`,
which produced "Check out {band} on MusicBizQR" for SMS and email shares.

**Left deliberately:** `https://musicbizqr.com` origins used as canonical URLs
and SSR fallbacks in `ShareCustomizeDrawer.vue`, `MomentumPromptsPanel.vue` and
`pages/share/moment/[momentId].vue`. These resolve OG images and existing share
links; changing them is a routing decision, not a copy change.

**Needs a human decision:** `server/api/og/site.png.ts` renders the site-wide
default social card with `MusicBizQR` as a 72px wordmark above the tagline
"Scan • Listen • Follow". Both are old-brand positioning. Swapping only the
wordmark would leave a half-rebranded card, so this wants a deliberate redesign
rather than a string edit.

> **Resolved.** The card was fully redesigned on the same date — see
> [`OG-CARD-AND-BADGE-STAGE-AUDIT.md §2`](./OG-CARD-AND-BADGE-STAGE-AUDIT.md),
> which also covers the badge modal presentation pass that followed §10 and §11
> of this document.

The repo-wide count is far larger than the audit's original list — roughly 130
files contain `MusicBizQR`, `musicbizqr` or `MBQ`, most of them decks, demo
fixtures, SEO tooling and QR infrastructure. That sweep needs its own pass with
the classification rule applied file by file.
