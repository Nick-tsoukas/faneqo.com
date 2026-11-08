# Faneqo Gallery Memory + Rive

Status: frontend integration complete; branded `.riv` asset still needs export from the Rive editor.

## Product outcome

When a fan saves an authorized show gallery, the existing FanPassport reference save remains canonical and the gallery button gets a small, meaningful “memory captured” response. Removing the save returns the mark to its unsaved state.

Rive is presentation only. A missing, corrupt, offscreen, or reduced-motion Rive file cannot block:

- gallery authorization
- photo rendering, zoom, or lightbox
- saving or removing a FanPassport reference
- sharing
- visible button text and status messages

## Existing truth reused

| Concern | Owner |
| --- | --- |
| Files | Strapi Upload + private S3 objects |
| Gallery | `ArtistUpdate` |
| FanPassport save | Reference to `artistUpdateId` |
| Gallery UI | `FaneqoMediaGrid` + `FaneqoMediaLightbox` |
| Save feedback | `FaneqoGalleryMemoryMotion` |

No media is copied into FanPassport. Read-time authorization still decides whether the referenced gallery is available.

## Runtime contract

File: `public/rive/faneqo-gallery-memory.riv`  
Artboard: `GalleryMemory`  
State machine: `GalleryMemory`  
Default View Model: `GalleryMemory`

| Property | Type | Meaning |
| --- | --- | --- |
| `artistName` | string | Artist identity for future art direction |
| `photoCount` | number | Authorized gallery photo count |
| `saving` | boolean | Save/remove request is in flight |
| `saved` | boolean | The reference exists in FanPassport |
| `save` | trigger | One-shot memory-captured transition |
| `remove` | trigger | Quiet return to unsaved state |

The animation must settle. No infinite ambient loop, confetti, badge-wall styling, or photo rendering inside Rive. The static saved and unsaved poses must read clearly without playback.

## App files

- `components/rive/FaneqoGalleryMemoryMotion.vue`
- `composables/useFaneqoGalleryMemory.js`
- `utils/rive/faneqoGalleryMemory.js`
- `components/updates/ShowNightStory.vue`
- `scripts/test-gallery-memory-rive.mjs`

## Asset acceptance

Before adding the branded `.riv` file:

1. Export one artboard, one state machine, and one default View Model instance.
2. Match the names and types above exactly.
3. Keep unsaved and saved settled poses legible at 23×23 CSS pixels.
4. Verify save fires once, remove is quiet, and reduced motion remains static.
5. Test at 390, 430, and 1280 widths in both a gallery detail and FanPassport list.
6. Confirm a failed asset request falls back without changing the button or network save request.

Do not substitute a Rive Community file in production.
