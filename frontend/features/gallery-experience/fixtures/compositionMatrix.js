import { describePhotoAspect } from '../core/photoComposition.js'
import { normalizeMemory } from '../core/experienceManifest.js'
import { basementEastNight } from './basementEastNight.js'

/**
 * Lab composition matrix. Uses real concert photography already in the repo.
 * Basement East remains the Night of seven. Extra rows are matrix-only.
 *
 * Exact assets:
 *   2:3        public/images/homepage/artists/badflower-hero.webp  1000×1500
 *              Studio promo. Used only for exact 2:3 geometry.
 *   near-square memory-b 910×1024 · memory-g 938×1024
 *   square      memory-c 1023×1024
 *   landscape   memory-e 1024×682 (3:2) · memory-d 1024×731
 *   wide        memory-a / memory-f 1024×575 (16:9)
 *
 * Missing exact assets (do not invent crops):
 *   3:4  — closest real source is the 2:3 hero
 *   4:5  — closest real source is memory-b (0.889, near-square)
 */

/**
 * Desktop high-resolution set — lab reference only.
 *
 * These paths point at concert photography that already ships in
 * `public/images/`. Nothing is copied, moved, resized or re-encoded: desktop
 * composition cannot be judged honestly on ~1024px Night fixtures, and
 * upscaling them to flatter the benchmark would be dishonest.
 *
 * Excluded on purpose: `foxy.jpg` and `descartesakant.jpg`. Both are 2048×2048
 * only because a 16:9 and a portrait frame were padded to square with a
 * blurred copy of themselves. Rendering those bars inside a Gallery print
 * reads as a bug, so square is judged on `memory-c` — a genuine 1023×1024
 * frame, and large enough for a square print at 1080p.
 *
 * Source limits recorded rather than hidden:
 *   portrait — tallest real frame is the 1000×1500 studio hero, fine to 1080p
 *              and soft at 1440p. No hi-res Night portrait exists in the repo.
 *   square   — 1023×1024, fine to 1080p.
 */
export const HIRES_DESKTOP_MEMORIES = [
  {
    id: 'hires-landscape',
    role: 'recollection',
    gravity: 0.5,
    energy: 0.52,
    src: '/images/eventone.jpg',
    width: 5506,
    height: 3671,
    alt: 'Festival crowd under a wall of warm stage light',
    caption: 'The room the second the lights came up.',
    photographer: '',
    stage: {
      deep: '#0a0603',
      left: '#3a1c08',
      right: '#2a1405',
      top: '#8a4a10',
      bottom: '#080503',
      highlight: '#ffd9a0',
      haze: '#c07020',
      highlightX: 0.5,
      highlightY: 0.32,
    },
  },
  {
    id: 'hires-wide',
    role: 'recollection',
    gravity: 0.46,
    energy: 0.44,
    src: '/images/moondough.jpg',
    width: 2047,
    height: 1151,
    alt: 'Wide frame of the stage across the room',
    caption: 'The whole room, from the back bar.',
    photographer: '',
    stage: {
      deep: '#050408',
      left: '#1c1830',
      right: '#141020',
      top: '#3a3060',
      bottom: '#06050a',
      highlight: '#d8d0f0',
      haze: '#6050a0',
      highlightX: 0.5,
      highlightY: 0.38,
    },
  },
  {
    id: 'hires-square',
    role: 'recognition',
    gravity: 0.55,
    energy: 0.52,
    src: '/labs/gallery-experience/memory-c.jpg',
    width: 1023,
    height: 1024,
    alt: 'The singer leaning into the microphone',
    caption: 'A face in the Night.',
    photographer: '',
    stage: {
      deep: '#050608',
      left: '#101418',
      right: '#1c2024',
      top: '#c8d0d8',
      bottom: '#08090a',
      highlight: '#e8ecee',
      haze: '#8a9098',
      highlightX: 0.64,
      highlightY: 0.34,
    },
  },
]

export const COMPOSITION_EXTRA_MEMORIES = [
  {
    id: 'matrix-23',
    role: 'recollection',
    gravity: 0.44,
    energy: 0.36,
    src: '/images/homepage/artists/badflower-hero.webp',
    width: 1000,
    height: 1500,
    alt: 'BADFLOWER studio portrait — exact 2:3 geometry, not a Night frame',
    // Why this asset stands in for 2:3 is lab bookkeeping and lives in the slot
    // note. A fan opening Info must never be shown an internal explanation of
    // the fixture, and an empty caption is just as dishonest a test: it hides
    // how the composition behaves once real words arrive.
    caption: 'All four of them, ten minutes before doors.',
    photographer: '',
    stage: {
      deep: '#050208',
      left: '#2a1040',
      right: '#0a0810',
      top: '#4a2080',
      bottom: '#08060a',
      highlight: '#c8a0e8',
      haze: '#6a38a0',
      highlightX: 0.42,
      highlightY: 0.38,
    },
  },
]

export const COMPOSITION_SLOTS = [
  {
    id: 'portrait-2-3',
    label: '2:3',
    wantedClass: 'portrait-2-3',
    exact: true,
    memoryId: 'matrix-23',
    note: 'Exact 2:3 geometry · homepage hero 1000×1500. Studio promo, not a concert frame. No 2:3 Night photograph in repo.',
  },
  {
    id: 'portrait-3-4',
    label: '3:4',
    wantedClass: 'portrait-3-4',
    exact: false,
    memoryId: 'matrix-23',
    note: 'No 3:4 concert asset in repo. Closest real geometry is the 2:3 studio hero (1000×1500).',
  },
  {
    id: 'portrait-4-5',
    label: '4:5',
    wantedClass: 'portrait-4-5',
    exact: false,
    memoryId: 'memory-b',
    note: 'No 4:5 concert asset in repo. Closest real source is memory-b 910×1024 (0.889, near-square).',
  },
  {
    id: 'near-square',
    label: '~□',
    wantedClass: 'near-square',
    exact: true,
    memoryId: 'memory-b',
    note: 'Exact near-square · memory-b 910×1024.',
  },
  {
    id: 'square',
    label: '□',
    wantedClass: 'square',
    exact: true,
    memoryId: 'memory-c',
    note: 'Exact square · memory-c 1023×1024.',
  },
  {
    id: 'landscape',
    label: 'Land',
    wantedClass: 'landscape',
    exact: true,
    memoryId: 'memory-e',
    note: 'Exact landscape · memory-e 1024×682 (3:2).',
  },
  {
    id: 'wide',
    label: 'Wide',
    wantedClass: 'wide',
    exact: true,
    memoryId: 'memory-a',
    note: 'Exact wide · memory-a 1024×575 (16:9).',
  },
]

export function livingGalleryMemories(night = basementEastNight) {
  const extras = COMPOSITION_EXTRA_MEMORIES
    .filter((extra) => !night.memories.some((memory) => memory.id === extra.id))
    .map((extra, index) => normalizeMemory(extra, 100 + index))
  return [...night.memories, ...extras]
}

export function describeLivingGalleryMemories(list) {
  return (Array.isArray(list) ? list : []).map((memory) => ({
    id: memory.id,
    ...describePhotoAspect(memory.width, memory.height),
    src: memory.src,
  }))
}

export function findCompositionSlot(slotId) {
  return COMPOSITION_SLOTS.find((slot) => slot.id === slotId) || null
}

export function indexForCompositionSlot(list, slotId) {
  const slot = findCompositionSlot(slotId)
  if (!slot) return -1
  return (Array.isArray(list) ? list : []).findIndex((memory) => memory.id === slot.memoryId)
}
