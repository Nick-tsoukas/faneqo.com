# Creative Studio — video plan

Written 2026-10-13. Planning only. Do not install FFmpeg, Playwright capture services, or a second renderer for this document.

The first film is an animated Product Showcase of a real Faneqo artist page. PNG export of every current family stays the still path.

## 1. What can be reused

- The seven Vue family components, including `ProductShowcase.vue` and `ProductExcerpt.vue`. They already take `format`, `content`, `snapshot`, and `scene`.
- `AdStage` for the editor preview. It scales the 1080px board with CSS. It does not rasterize.
- `useCreativeExport` and `exportPng.js`. They mount the same component off-screen at 1:1 and call `html-to-image`.
- `content.style` and `content.variant`. Product Showcase bleed versus framed, and the page excerpt, stay content. Motion does not replace them.
- Education already treats `scene` as an index into one creative. A timed film can use that same prop.
- GSAP and Motion for Vue are already in the app. The export process must not depend on `prefers-reduced-motion`.

## 2. What changes in the model

No new collection and no parallel template registry.

Add an optional `content.motion` object, absent on every creative that exists today:

```js
content.motion = {
  durationMs: 8000,
  scenes: [{ index: 0, durationMs: 8000 }],
}
```

`finalizeCreative` leaves it alone. Families that do not read it render exactly as they do now. A missing `motion` means still image.

Do not add a `video` kind until a creative can actually export an MP4. The library filter stays honest.

## 3. Scenes and timing

One creative, one timeline.

- `scene` remains the index the component already receives.
- Each scene entry has a duration in milliseconds. The timeline is the sum.
- Product Showcase v1 is a single scene. The phone is already the hero. Motion is a short reveal of that phone, not a second layout.
- Later carousels (Education) map their existing slides onto scene durations. They do not get a second component.

Presets are names on the scene (`reveal`, `hold`), resolved inside the family component. They are not a new registry.

## 4. Deterministic rendering

- The timeline is paused. A clock is passed in (`t` milliseconds). Nothing reads `Date.now()` or `Math.random()` during capture.
- GSAP `seek(t)` or a CSS animation with `animation-delay` set from `t`. Same `t` always paints the same frame.
- The dev renderer (`pages/__dev/studio-render.vue`) gains a `t` query only when this work starts. `t` omitted means frame 0, which is the PNG.
- Reduced motion applies to the editor preview only. The capture document forces the full timeline.

## 5. PNG export stays unchanged

- `useCreativeExport` keeps mounting the component with no `t`, which is frame 0.
- Families ignore `content.motion` unless a `t` prop is passed. Today's Download PNG path does not pass it.
- Dimensions stay 1080×1440, 1080×1350, 1080×1080, 1080×1920. Story safe zone stays top 250, bottom 320, side 48.
- Do not run FFmpeg on the PNG button.

## 6. Local MP4 prototype

A script outside the request path, run by hand from this repo:

1. Open the dev renderer for `product-showcase` with a frozen snapshot and `motion=1`.
2. Seek `t` from 0 to `durationMs` at a fixed interval (for example 1000/30).
3. Capture each frame with the existing PNG pipeline or Playwright's screenshot of the 1:1 board.
4. Hand the frame folder to FFmpeg for one H.264 MP4, 1080×1350 or 1080×1920.
5. Delete the frames. Do not store them as creatives.

No audio in the first file. No upload. No queue.

## 7. Performance and isolation

- Do not render video inside a dashboard request or a Strapi hook.
- The browser tab that edits a creative only plays a short loop for preview. Capture runs in a separate process so a long export cannot freeze the editor.
- One board in the DOM during capture. Not the library grid.
- Product Showcase already draws a tall phone. Motion should transform that tree (opacity, translate) and not mount a second page.

## 8. First implementation task

Add a paused, seekable reveal to `ProductShowcase.vue`, gated on `content.motion`, defaulting off.

Proof before any MP4:

- A creative with no `motion` exports the same PNG as today.
- The dev renderer with `t=0` matches that PNG.
- The dev renderer with a later `t` shows the phone further along the same composition, not a different template.
- `node scripts/test-creative-studio.mjs` and `node scripts/test-ads-studio.mjs` still pass.

Only after that proof: a local script that seeks, captures frames, and calls FFmpeg.
