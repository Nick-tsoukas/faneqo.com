/**
 * LOCAL-ONLY artist hero experiment (Phase 1 of the hero audit).
 *
 * Pure policy + local state helpers for comparing two desktop hero approaches
 * against the current one. Nothing here persists to Strapi, and nothing here
 * runs unless the caller has already confirmed dev + the query flag.
 *
 * Mobile is out of scope by construction: callers must only apply these
 * results at >= 1024px. Never reinterprets cyberedImagePositionX/Y/Zoom or
 * layoutConfig.imageFit — those stay the canonical mobile contract.
 */

// Relative so `node scripts/test-hero-experiment.mjs` can import this directly,
// matching the other pure helpers in utils/media.
import {
  clampArtistFocalPercent,
  clampArtistZoom,
  getArtistImageRatio,
  unwrapBandImage,
} from './artistImage.js'

export const HERO_EXPERIMENT_QUERY_KEY = 'heroExperiment'
export const HERO_EXPERIMENT_MODES = ['original', 'improved', 'adaptive']
export const HERO_EXPERIMENT_STORAGE_PREFIX = 'fq-hero-experiment:v1'

/** Desktop fit choices inside the experiment. Mirrors the audit's fill/full vocabulary. */
export const HERO_EXPERIMENT_FITS = ['fill', 'full']

/**
 * Adaptive presentation policy.
 *
 * Thresholds are chosen from the audit's measured crop loss in the real
 * desktop hero box (ratio ~1.61-1.88), not invented:
 *
 *   >= 2.4  `panorama`  filling would cut off edge band members
 *   >= 1.32 `cinematic` broad photographic hero survives cover
 *   <  1.32 `editorial` portrait / square beside the identity
 *
 * 1.32 is the existing ARTIST_IMAGE_AUTO_COVER_RATIO, already tuned against
 * real Faneqo assets, and it coincides with "retains >= ~70% of source height".
 */
export const HERO_ADAPTIVE_PANORAMA_RATIO = 2.4
export const HERO_ADAPTIVE_CINEMATIC_RATIO = 1.32

/** Hysteresis band so resize never ping-pongs between presentations. */
export const HERO_ADAPTIVE_RATIO_HYSTERESIS = 0.06

/** Unknown dimensions fall back to the same default the live shell uses. */
export const HERO_ADAPTIVE_FALLBACK = 'cinematic'

export function normalizeHeroExperimentMode(value) {
  const mode = String(value || '').trim().toLowerCase()
  return HERO_EXPERIMENT_MODES.includes(mode) ? mode : 'original'
}

export function normalizeHeroExperimentFit(value) {
  const fit = String(value || '').trim().toLowerCase()
  return HERO_EXPERIMENT_FITS.includes(fit) ? fit : 'fill'
}

/**
 * Pick the adaptive presentation for a source ratio.
 *
 * `previous` enables hysteresis: a ratio sitting within
 * HERO_ADAPTIVE_RATIO_HYSTERESIS of a boundary keeps the presentation it
 * already had. Source ratio does not change on resize, so this only matters
 * when a caller re-derives on a dimension change — but it keeps the policy
 * honest about stability.
 */
export function resolveAdaptivePresentation(ratio, previous = null) {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return HERO_ADAPTIVE_FALLBACK

  const h = HERO_ADAPTIVE_RATIO_HYSTERESIS
  if (previous === 'panorama' && ratio >= HERO_ADAPTIVE_PANORAMA_RATIO - h) return 'panorama'
  if (previous === 'editorial' && ratio < HERO_ADAPTIVE_CINEMATIC_RATIO + h) return 'editorial'
  if (previous === 'cinematic'
    && ratio >= HERO_ADAPTIVE_CINEMATIC_RATIO - h
    && ratio < HERO_ADAPTIVE_PANORAMA_RATIO + h) return 'cinematic'

  if (ratio >= HERO_ADAPTIVE_PANORAMA_RATIO) return 'panorama'
  if (ratio >= HERO_ADAPTIVE_CINEMATIC_RATIO) return 'cinematic'
  return 'editorial'
}

export function getHeroExperimentRatio(bandImg) {
  return getArtistImageRatio(unwrapBandImage(bandImg))
}

/**
 * Storage key is scoped by artist AND image identity, so replacing the photo
 * starts from clean experimental framing instead of inheriting a stale crop.
 */
export function heroExperimentStorageKey(band) {
  const bandKey = band?.slug || band?.id || 'unknown-band'
  return `${HERO_EXPERIMENT_STORAGE_PREFIX}:${bandKey}:${heroImageIdentity(band?.bandImg)}`
}

/**
 * Image identity for the storage key.
 * Deliberately does not go through unwrapBandImage, which returns null when a
 * node has no `url` — that would collapse distinct photos onto one key.
 */
function heroImageIdentity(bandImg) {
  if (!bandImg) return 'no-image'
  if (typeof bandImg === 'string') return bandImg
  const node = bandImg.data?.attributes || bandImg.attributes || bandImg.data || bandImg
  return node?.url || node?.hash || node?.id || bandImg.id || 'no-image'
}

/**
 * Desktop framing seed. Initialized ONCE from the stored mobile values so the
 * experiment starts from what the artist already approved, then diverges.
 * Callers must not re-seed on later mobile changes.
 */
export function seedDesktopFraming(band) {
  return {
    positionX: clampArtistFocalPercent(band?.cyberedImagePositionX),
    positionY: clampArtistFocalPercent(band?.cyberedImagePositionY),
    zoom: clampArtistZoom(band?.cyberedImageZoom),
    fit: 'fill',
  }
}

export function normalizeHeroExperimentState(raw, band) {
  const seed = seedDesktopFraming(band)
  const source = raw && typeof raw === 'object' ? raw : {}
  const desktop = source.desktop && typeof source.desktop === 'object' ? source.desktop : {}
  const fit = normalizeHeroExperimentFit(desktop.fit ?? seed.fit)
  return {
    mode: normalizeHeroExperimentMode(source.mode),
    desktop: {
      positionX: clampArtistFocalPercent(desktop.positionX ?? seed.positionX),
      positionY: clampArtistFocalPercent(desktop.positionY ?? seed.positionY),
      // Full photo is defined as the whole frame at zoom 1.
      zoom: fit === 'full' ? 1 : clampArtistZoom(desktop.zoom ?? seed.zoom),
      fit,
    },
  }
}

export function createHeroExperimentState(band) {
  return normalizeHeroExperimentState(null, band)
}

export function readHeroExperimentState(band) {
  const fallback = createHeroExperimentState(band)
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(heroExperimentStorageKey(band))
    if (!raw) return fallback
    return normalizeHeroExperimentState(JSON.parse(raw), band)
  } catch {
    return fallback
  }
}

export function writeHeroExperimentState(band, state) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      heroExperimentStorageKey(band),
      JSON.stringify(normalizeHeroExperimentState(state, band)),
    )
  } catch {
    // Private mode / quota. The experiment stays usable for this session.
  }
}

export function clearHeroExperimentState(band) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(heroExperimentStorageKey(band))
  } catch {
    // Nothing to recover.
  }
}

/**
 * Desktop photo style for the experiment.
 *
 * `fill` matches the live contract exactly (cover + focal + scale).
 * `full` preserves the whole photograph: contain, zoom 1, and bottom-anchored
 * so the identity block overlays the lower frame rather than the face.
 */
export function getExperimentDesktopPhotoStyle({ positionX, positionY, zoom, fit } = {}) {
  const mode = normalizeHeroExperimentFit(fit)
  if (mode === 'full') {
    return {
      objectFit: 'contain',
      objectPosition: '50% 100%',
      transform: 'none',
      transformOrigin: '50% 100%',
    }
  }
  const x = clampArtistFocalPercent(positionX)
  const y = clampArtistFocalPercent(positionY)
  const z = clampArtistZoom(zoom)
  return {
    objectFit: 'cover',
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${z})`,
    transformOrigin: `${x}% ${y}%`,
  }
}

/**
 * Adaptive photo style per presentation.
 * `editorial` and `panorama` always preserve the whole photograph, so the
 * image area is sized by aspect-ratio instead of being cover-cropped.
 */
export function getAdaptivePhotoStyle(presentation, desktop = {}) {
  if (presentation === 'editorial' || presentation === 'panorama') {
    return { objectFit: 'contain', objectPosition: '50% 50%', transform: 'none', transformOrigin: '50% 50%' }
  }
  return getExperimentDesktopPhotoStyle(desktop)
}
