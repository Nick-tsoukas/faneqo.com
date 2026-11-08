# Rive at Faneqo

Rive is a first-class motion/interactivity runtime for **self-contained branded graphics**.
It is not a replacement for page layout animation.

Official runtime: **`@rive-app/webgl2`** (installed `^2.40.0`).
Wrapper: `components/rive/FaneqoRive.vue`.
Assets: `public/rive/`.

Do not import `@rive-app/webgl2` at module top-level. The wrapper loads it in `onMounted`.

---

## Rive vs GSAP

### GSAP owns

- Page entrance timing
- Layout transitions
- Scroll-triggered section choreography
- Shared DOM movement
- Typography reveal

### Rive owns

- Interactive branded graphics
- State machines
- Icons that have behavior
- Connection / response animations
- Tiny characterful product feedback
- Reusable visual systems (echo, check-in, message sent)

Do **not** use Rive to replace ordinary page layout animation.
Do **not** use GSAP to recreate complex vector state machines we could own in Rive.

---

## Performance rules

1. Do not loop everything forever.
2. Prefer one-shot / stateful transitions. Let the runtime **settle**.
3. Pause offscreen animations (`pauseOffscreen` is on by default).
4. Respect `prefers-reduced-motion` (wrapper defaults to a static settled frame).
5. Keep `.riv` files lean.
6. Remove unused artboards before export.
7. Avoid excessive web blend modes.
8. Cache/reuse files when the same `.riv` is instantiated repeatedly (`cacheFile`, `utils/rive/riveFileCache.js`).
9. Do not use Rive where CSS or GSAP is simpler.
10. GSAP owns page choreography; Rive owns self-contained interactive graphics.

Also:

- Set `useOffscreenRenderer: true` when multiple Rive canvases share a page (the wrapper already does this).
- Call `resizeDrawingSurfaceToCanvas()` on load and container resize (the wrapper already does this).
- Call `cleanup()` on unmount (the wrapper already does this).

---

## Wrapper API

```vue
<FaneqoRive
  src="/rive/faneqo-echo.riv"
  artboard="Echo"
  state-machine="Echo"
  fit="contain"
  alignment="center"
  :autoplay="true"
  :auto-bind="true"
  aria-label="Fan connection"
  class="h-40 w-40"
/>
```

| Prop | Default | Notes |
|------|---------|--------|
| `src` | required | Public path or URL to a `.riv` |
| `artboard` | `''` | File default if omitted |
| `stateMachine` | `''` | Strongly recommended. New files should always export one. |
| `autoplay` | `true` | Forced off when reduced motion is respected |
| `autoBind` | `true` | Binds the artboard's default View Model instance |
| `fit` | `contain` | `contain` `cover` `fill` `fitWidth` `fitHeight` `none` `scaleDown` `layout` |
| `alignment` | `center` | Rive alignment enum strings |
| `cacheFile` | `true` | Reuse a loaded `RiveFile` |
| `pauseOffscreen` | `true` | `pause` + `stopRendering` via IntersectionObserver |
| `respectReducedMotion` | `true` | No autoplay; keep last/settled frame visible |

Exposed methods: `play`, `pause`, `stop`, `resize`, `restart`, `setBoolean`, `setNumber`, `setString`, `fireTrigger`, `getViewModel`, `listViewProperties`, `listStateMachineInputs`.

Events: `load`, `load-error`, `play`, `pause`, `stop`, `state-change`, `rive-event`.

The canvas fills its CSS box. Give the wrapper (or a parent) an explicit height.

---

## Control strategy: View Models, not legacy SM inputs

Current Rive Web docs: **state machines are controlled through Data Binding properties.**
`stateMachineInputs()` is **deprecated**. New Faneqo files must use View Models.

### Preferred (`autoBind: true`)

```js
const vmi = rive.viewModelInstance
vmi.boolean('connected').value = true
vmi.number('intensity').value = 0.8
vmi.string('fanName').value = 'Sarah'
vmi.trigger('success').trigger()
```

The wrapper helpers (`setBoolean`, `setNumber`, `setString`, `fireTrigger`) try View Model paths first, then fall back to legacy SM inputs so old sample files still work.

### Do not wire product data yet

Future bindings we expect, once a real `.riv` exists:

| Name | Type | Product meaning |
|------|------|-----------------|
| `fanName` | string | Display name |
| `fanCount` | number | List size |
| `connected` | boolean | Fan ↔ artist link exists |
| `messageSent` | boolean / trigger | Artist sent |
| `messageReceived` | boolean / trigger | Fan replied |
| `checkedIn` | boolean | Show Mode check-in |
| `artistName` | string | Band identity |

Pass those from Vue into the View Model in `onLoad` / watchers. Never hide essential UI behind the graphic.

---

## First custom file: `faneqo-echo.riv`

One visual system that can express a **connection and its return**.

Suggested View Model name: **`Echo`**

| Property | Type | Role |
|----------|------|------|
| `active` | boolean | Currently in a live exchange |
| `connected` | boolean | A relationship exists |
| `intensity` | number 0–1 | Energy / volume of the echo |
| `success` | trigger | Outbound pulse (check-in, send, follow) |
| `reply` | trigger | Inbound pulse (fan response / echo back) |

Optional later: `direction` as an enum (`idle` / `out` / `back`) if the designer prefers discrete states over two triggers.

Suggested state machine: **`Echo`**

| State | Meaning |
|-------|---------|
| `IDLE` | Quiet mark. Settles. No infinite loop. |
| `SIGNAL_OUT` | Outbound ping (`success` fired, or `active` true) |
| `CONNECT` | Link established (`connected` true) |
| `SETTLED` | Connected, at rest |
| `ECHO_BACK` | Inbound response (`reply` fired) → return to `SETTLED` |
| `SUCCESS` | Brief confirmation |

App code should call `useFaneqoEcho()` / `FaneqoEcho` methods (`signalOut`, `connect`, `echoBack`, `settle`, `playCheckIn`, `playEchoBack`, `playCta`). Do not drive internal state names from Vue.

Export rules:

- One artboard, one state machine, one default View Model instance
- Reduced-motion: idle/settled pose must be readable without playback
- No looping idle animation
- Keep unused artboards out of the export

Placeholder path: `public/rive/faneqo-echo.riv` (file does not exist yet).
`FaneqoEcho` probes for the file and **renders nothing** until it exists. Do not add a CSS/SVG stand-in.

### Homepage attachment points (`/home-v2` only)

1. Sarah check-in — attached to the avatar, `playCheckIn`
2. Sarah on the list — settled mark, desktop only
3. Messaging reply — `playEchoBack` on Sarah’s closing bubble
4. Final CTA — one cycle beside Start free

GSAP owns DOM sequencing (button text, row highlight, CTA settle). Rive owns the Echo graphic. Stillness is the default. One-shot per visit. Pause offscreen.

Do **not** mount the sandbox sample (`vehicles.riv`) on `/` or `/home-v2`.

---

## First artist-profile primitive: `faneqo-connection.riv`

Fan List success is the first profile Rive use case. The form stays native DOM.
Rive is only the signature mark.

Wrapper: `components/rive/FaneqoConnectionMotion.vue`  
Composable: `composables/useFaneqoConnection.js`  
Contract: `utils/rive/faneqoConnection.js`

Vue `state` contract: `idle` | `connecting` | `connected`  
Optional: `ready` / `focus` for input focus.  
`reducedMotion` is read from `prefers-reduced-motion`.  
`intensity` is reserved.

Suggested View Model name: **`Connection`**

| Property | Type | Role |
|----------|------|------|
| `ready` | boolean | Input focused / primed |
| `connecting` | boolean | Submit in flight |
| `connected` | boolean | Fan is on the list |
| `intensity` | number 0–1 | Energy of the pulse |
| `connect` | trigger | One outbound connection pulse |

Suggested state machine: **`Connection`**

| State | Meaning |
|-------|---------|
| `IDLE` | Quiet Faneqo mark. No loop. |
| `READY` | Slightly live while the email field is focused |
| `CONNECTING` | One outbound pulse (`connect` fired) |
| `CONNECTED` | Pulse resolves into a connected/check pose, then settles |
| `REDUCED_MOTION` | Static connected/idle pose. Success text in the DOM is enough. |

Export rules:

- One small artboard, one state machine, one default View Model instance
- No confetti, no loop, no giant glow
- Keep paths/effects minimal
- Reduced-motion pose must be readable without playback
- Do **not** put the email form inside Rive

Placeholder path: `public/rive/faneqo-connection.riv` (file does not exist yet).
Until it exists, `FaneqoConnectionMotion` shows a CSS/SVG fallback of the **same footprint**.
Do not substitute a Rive Community file.

Lab only: wired from `FanCaptureSection` when `labVisual` is true.
Do not mount on production artist pages until the `.riv` exists and the Fan List design is approved.

### Future primitives (document only — do not build)

| Primitive | Later use |
|-----------|-----------|
| Connection | Fan List, Message, Passport |
| Echo | replies, return |
| Verified | I WAS THERE |
| Return | fan comes back |
| Milestone | relationship marks |
| Success/Pulse | Moment reveal, Share Studio |

Do **not** use Rive on streaming/social/merch rows, inputs, labels, nav, or bio.

---

## Lifecycle

1. Client `onMounted` → dynamic-import runtime → `new Rive({...})`
2. `onLoad` → `resizeDrawingSurfaceToCanvas()`
3. ResizeObserver keeps the drawing surface matched to CSS size / DPR
4. IntersectionObserver pauses + `stopRendering()` when well offscreen
5. `onBeforeUnmount` → `cleanup()` (stops loop, disposes artboard, listeners, VM refs)

Do not call `cleanup()` on a **cached** `RiveFile` while other instances still use it.

---

## Sandbox

Dev-only proof: `/internal/rive-sandbox`

Uses a **temporary official CDN sample**, not a Faneqo asset.
Do not mount it on `/` or `/home-v2`.

---

## Gallery Memory primitive

Gallery Memory is the first Rive attachment to the live FanPassport gallery flow. It is intentionally small: Rive owns only the one-shot save/remove feedback inside the native action button.

- Component: `components/rive/FaneqoGalleryMemoryMotion.vue`
- Contract: `utils/rive/faneqoGalleryMemory.js`
- Driver: `composables/useFaneqoGalleryMemory.js`
- Asset: `public/rive/faneqo-gallery-memory.riv` (not authored yet)
- Full delivery contract: `docs/FANEQO_GALLERY_MEMORY_RIVE.md`

View Model / artboard / state machine: **`GalleryMemory`**.

| Property | Type | Product meaning |
|------|------|-----------------|
| `artistName` | string | Artist identity |
| `photoCount` | number | Authorized gallery count |
| `saving` | boolean | Network request in flight |
| `saved` | boolean | Passport reference exists |
| `save` | trigger | One-shot memory captured transition |
| `remove` | trigger | Quiet return to unsaved |

The component probes for the branded file and uses a same-footprint CSS/SVG fallback until it exists. The native button, visible status copy, `ArtistUpdate` authorization, FanPassport request, grid, and lightbox never depend on the canvas. Do not render photos inside Rive, start an ambient loop, or substitute a Community asset.
