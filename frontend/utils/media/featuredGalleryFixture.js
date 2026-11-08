/**
 * LOCAL-ONLY featured-gallery fixture.
 *
 * Reorder or replace photographs by editing `photos` below.
 * These files live in `public/labs/featured-gallery` and never enter Strapi.
 *
 * The supplied set is mixed on purpose:
 *   3:2 environmental, 16:9 close-up, 1:1 overhead, 4:3 portrait-leaning, 3:2 seated.
 * There is no concert panorama in the provided files. Do not invent one.
 *
 * Fixed-frame mode crops with `object-fit: cover`. Aspect-aware mode sizes
 * each slide from the photograph and only mattes a frame when a ratio is
 * too extreme to keep. Full pixels stay in the canonical viewer.
 */

/**
 * Width of one slide, as a fraction of the gallery track.
 * Landscape sits near the cinematic width. Square and portrait step down
 * so a shared row height does not have to crop them.
 */
export const FEATURED_GALLERY_ASPECT_BANDS = {
  landscape: [0.82, 0.86],
  square: [0.65, 0.72],
  portrait: [0.48, 0.58],
}

export function classifyFeaturedAspect(width, height) {
  const ratio = Number(width) / Number(height)
  if (!Number.isFinite(ratio) || ratio <= 0) return 'landscape'
  if (ratio >= 1.2) return 'landscape'
  if (ratio <= 0.9) return 'portrait'
  return 'square'
}

/**
 * One slide in the aspect-aware strip.
 *
 * The row height is shared. Width follows the photograph, never wider than
 * that photo's band. Past the wide cap, the slide scales down and keeps its
 * ratio. Only an extreme portrait, narrower than its floor, holds that floor
 * and sits on a dark matte. Landscape and square are never stretched up.
 */
/**
 * Shared track height.
 *
 * A 16:9 featured video in the same column is about 56% of the content
 * width. The track is that column plus a small breakout, so 42% of the
 * track stays shorter than the video. The cap stops a wide page from
 * growing a second hero. The floor keeps a very narrow phone from collapsing.
 */
export function resolveAspectRowHeight(trackWidth) {
  const span = Number(trackWidth) || 0
  const floor = 140
  const cap = 220
  if (span <= 0) return floor
  return Math.round(Math.min(cap, Math.max(floor, span * 0.42)))
}

/** Previous column-scaled height, kept for the dev comparison only. */
export function resolveLegacyAspectRowHeight(trackWidth, tunedHeight) {
  const span = Number(trackWidth) || 0
  const tuned = Number(tunedHeight) || 0
  if (!(span > 0) || !(tuned > 0)) return Math.round(tuned)
  const target = (FEATURED_GALLERY_ASPECT_BANDS.landscape[0] + FEATURED_GALLERY_ASPECT_BANDS.landscape[1]) / 2
  const fit = (span * target) / 1.5
  return Math.round(Math.max(tuned, fit))
}

export function resolveAspectSlide(photo, { trackWidth, trackHeight } = {}) {
  const sourceWidth = Number(photo?.width) || 1
  const sourceHeight = Number(photo?.height) || 1
  const ratio = sourceWidth / sourceHeight
  const kind = classifyFeaturedAspect(sourceWidth, sourceHeight)
  const [minFrac, maxFrac] = FEATURED_GALLERY_ASPECT_BANDS[kind]
  const span = Number(trackWidth) || 0
  const row = Number(trackHeight) || 0
  const minW = Math.min(span * minFrac, row * 0.62)
  const maxW = span * maxFrac
  const naturalW = row * ratio
  let width = naturalW
  let height = row
  let matte = false

  if (naturalW > maxW) {
    width = maxW
    height = maxW / ratio
  } else if (kind === 'portrait' && naturalW < minW) {
    width = minW
    height = row
    matte = Math.abs(width / height - ratio) > 0.02
  }

  return {
    kind,
    ratio,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    matte,
  }
}

export const FEATURED_GALLERY_LAB_QUERY = 'featuredGalleryLab'

const BASE = '/labs/featured-gallery'

export const featuredGalleryFixture = {
  id: 'featured-gallery-lab',
  title: 'Live',
  photos: [
    {
      id: 'morgan-wade',
      src: `${BASE}/morgan-wade.jpg`,
      width: 1024,
      height: 682,
      alt: 'Artist seated against a wood-plank wall, hands folded over one knee',
      objectPosition: '64% 36%',
    },
    {
      id: 'excision',
      src: `${BASE}/excision.webp`,
      width: 1024,
      height: 576,
      alt: 'Close portrait in a black cap, face half in shadow',
      objectPosition: '48% 46%',
    },
    {
      id: 'lawn-square',
      src: `${BASE}/lawn-square.jpg`,
      width: 1024,
      height: 1024,
      alt: 'Overhead view of a person reclined in a red chair on a green lawn',
      objectPosition: '50% 62%',
    },
    {
      id: 'rudy',
      src: `${BASE}/rudy.jpg`,
      width: 1000,
      height: 753,
      alt: 'Artist in a black hat leaning toward the camera against a red wall',
      objectPosition: '50% 28%',
    },
    {
      id: 'sadie',
      src: `${BASE}/sadie.jpg`,
      width: 1024,
      height: 681,
      alt: 'Artist seated on a sofa with an acoustic guitar across their lap',
      objectPosition: '46% 32%',
    },
  ],
}

export const FEATURED_GALLERY_HEADER_MODES = [
  { id: 'title', label: 'Live / count' },
  { id: 'gallery', label: 'Gallery / count' },
  { id: 'stack', label: 'Stacked' },
  { id: 'arrow', label: 'Title + arrow' },
]

/** Same interaction engine. Only the frame changes. */
export const FEATURED_GALLERY_VARIANTS = {
  cinematic: {
    label: 'Cinematic',
    width: 84,
    gap: 10,
    height: 272,
    radius: 12,
    top: 0,
    bottom: 10,
    headerGap: 16,
    activeScale: 1,
    adjacentScale: 0.992,
    edge: 8,
    breakout: 12,
    snap: 'start',
  },
  editorial: {
    label: 'Editorial',
    width: 78,
    gap: 18,
    height: 304,
    radius: 2,
    top: 4,
    bottom: 6,
    headerGap: 18,
    activeScale: 1,
    adjacentScale: 1,
    edge: 18,
    breakout: 12,
    snap: 'start',
  },
  film: {
    label: 'Film Strip',
    width: 58,
    gap: 8,
    height: 188,
    radius: 6,
    top: 0,
    bottom: 0,
    headerGap: 12,
    activeScale: 1,
    adjacentScale: 0.978,
    edge: 0,
    breakout: 12,
    snap: 'center',
  },
}

export function featuredGalleryCountLabel(count) {
  const n = Number(count) || 0
  return `${n} ${n === 1 ? 'Photo' : 'Photos'}`
}

export function featuredGalleryKicker(mode, title) {
  if (mode === 'gallery') return 'Gallery'
  return String(title || 'Gallery')
}
