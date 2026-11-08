/**
 * Shared artist-image helpers for Faneqo profile heroes, cards, and editors.
 * Fit mode persistence lives on band.layoutConfig.imageFit (no new Strapi field).
 */

export const ARTIST_IMAGE_FIT_MODES = ['auto', 'fill', 'full']

/** Artist-facing labels. Internal values stay auto | fill | full. Kept for legacy tests/docs. */
export const ARTIST_IMAGE_FIT_LABELS = {
  auto: 'Auto — Recommended',
  fill: 'Fill frame',
  full: 'Show full image',
}

/** New uploads and replacements use this. Existing saved modes stay as stored. */
export const CANONICAL_ARTIST_IMAGE_FIT = 'auto'
export const DEFAULT_ARTIST_FOCAL_X = 50
export const DEFAULT_ARTIST_FOCAL_Y = 50
export const DEFAULT_ARTIST_ZOOM = 1

/**
 * Live Cybered hero always cover-crops (BandPageCybered).
 * Editor preview must use this so Auto/Full radios cannot lie about the public page.
 */
export const CYBERED_HERO_PREVIEW_FIT = 'fill'

/**
 * AUTO cover threshold.
 * ratio = width / height
 * >= 1.32 (includes 4:3 and wider) → cinematic fill
 * < 1.32 (near-square, square, portrait) → atmospheric full
 *
 * Real-asset check:
 * Moon Dough ~1.78 → fill
 * Emerge 1.00 → full
 * BurningThunder ~1.03 → full
 * Shannon Tehya 0.80 → full
 * Andy Darling ~0.75 → full
 * Badflower ~0.67 → full
 */
export const ARTIST_IMAGE_AUTO_COVER_RATIO = 1.32

export const ARTIST_PROFILE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const ARTIST_PROFILE_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']

const MANUAL_POSITION_EPSILON = 1
const MANUAL_ZOOM_EPSILON = 0.02
const ORIGINAL_SRCSET_MAX_WIDTH = 2000

export function normalizeArtistImageFitMode(value) {
  const mode = String(value || '').trim().toLowerCase()
  if (mode === 'fill' || mode === 'full' || mode === 'auto') return mode
  return 'auto'
}

export function getArtistImageFitMode(layoutConfig) {
  if (!layoutConfig || typeof layoutConfig !== 'object') return 'auto'
  return normalizeArtistImageFitMode(layoutConfig.imageFit)
}

/**
 * Persist fit mode on the existing layoutConfig JSON.
 * Missing layout + auto → null (do not materialize a config).
 * Otherwise keep sections/buttons intact and set imageFit.
 */
export function createImageFitLayoutPatch(existingLayoutConfig, imageFit) {
  const mode = normalizeArtistImageFitMode(imageFit)
  const existing =
    existingLayoutConfig &&
    typeof existingLayoutConfig === 'object' &&
    !Array.isArray(existingLayoutConfig)
      ? existingLayoutConfig
      : null

  if (!existing && mode === 'auto') return null

  if (!existing) {
    return { version: 1, imageFit: mode }
  }

  return {
    ...existing,
    version: typeof existing.version === 'number' ? existing.version : 1,
    imageFit: mode,
  }
}

export function getDefaultArtistImagePresentation() {
  return {
    fitMode: CANONICAL_ARTIST_IMAGE_FIT,
    positionX: DEFAULT_ARTIST_FOCAL_X,
    positionY: DEFAULT_ARTIST_FOCAL_Y,
    zoom: DEFAULT_ARTIST_ZOOM,
  }
}

/**
 * New file upload / replacement only. Never call on bio-only edits.
 * Clears stale framing so a previous face-crop cannot contaminate the new photo.
 */
export function presentationForReplacedArtistImage() {
  return getDefaultArtistImagePresentation()
}

export function hasManualCyberedFraming({ positionX, positionY, zoom } = {}) {
  const x = toFiniteNumber(positionX, 50)
  const y = toFiniteNumber(positionY, 50)
  const z = toFiniteNumber(zoom, 1)
  return (
    Math.abs(x - 50) > MANUAL_POSITION_EPSILON ||
    Math.abs(y - 50) > MANUAL_POSITION_EPSILON ||
    Math.abs(z - 1) > MANUAL_ZOOM_EPSILON
  )
}

export function getArtistImageRatio(image) {
  const width = toFiniteNumber(image?.width, 0)
  const height = toFiniteNumber(image?.height, 0)
  if (width > 0 && height > 0) return width / height
  return null
}

/**
 * Decide the resolved fit for a surface.
 *
 * Compatibility: AUTO + meaningful legacy Cybered framing → fill.
 * Unknown dimensions → fill (preserve current cover look).
 * Cards/compact always fill. Bold always full.
 */
export function resolveArtistImageFit({
  fitMode = 'auto',
  image = null,
  positionX = 50,
  positionY = 50,
  zoom = 1,
  surface = 'hero',
} = {}) {
  const requested = normalizeArtistImageFitMode(fitMode)
  const ratio = getArtistImageRatio(image)

  if (
    surface === 'card' ||
    surface === 'squareCard' ||
    surface === 'compact' ||
    surface === 'default'
  ) {
    return { requested, resolved: 'fill', reason: 'surface_cover', ratio }
  }

  if (surface === 'bold') {
    return { requested, resolved: 'full', reason: 'surface_contain', ratio }
  }

  if (requested === 'fill' || requested === 'full') {
    return { requested, resolved: requested, reason: 'artist_override', ratio }
  }

  if (hasManualCyberedFraming({ positionX, positionY, zoom })) {
    return { requested, resolved: 'fill', reason: 'legacy_manual_framing', ratio }
  }

  if (ratio == null) {
    return { requested, resolved: 'fill', reason: 'unknown_ratio_preserve_cover', ratio }
  }

  if (ratio >= ARTIST_IMAGE_AUTO_COVER_RATIO) {
    return { requested, resolved: 'fill', reason: 'landscape_cover', ratio }
  }

  return { requested, resolved: 'full', reason: 'square_or_portrait_contain', ratio }
}

export function getArtistFocalPoint({ positionX, positionY } = {}) {
  return {
    x: clampPercent(toFiniteNumber(positionX, 50)),
    y: clampPercent(toFiniteNumber(positionY, 50)),
  }
}

export function clampArtistFocalPercent(value) {
  return clampPercent(toFiniteNumber(value, 50))
}

export function clampArtistZoom(value) {
  return clampZoom(toFiniteNumber(value, 1))
}

/**
 * Convert a pointer delta inside the crop frame into focal percents.
 * Inverted so dragging the photo right/down reveals the opposite edge (natural pan).
 */
export function nextArtistFocalFromPointerDelta({
  startX = 50,
  startY = 50,
  deltaX = 0,
  deltaY = 0,
  frameWidth = 1,
  frameHeight = 1,
  zoom = 1,
} = {}) {
  const width = Math.max(toFiniteNumber(frameWidth, 1), 1)
  const height = Math.max(toFiniteNumber(frameHeight, 1), 1)
  const size = Math.min(width, height)
  const scale = clampArtistZoom(zoom)
  const sensitivity = 100 / (scale * size)
  return {
    x: Math.round(clampArtistFocalPercent(toFiniteNumber(startX, 50) - toFiniteNumber(deltaX, 0) * sensitivity)),
    y: Math.round(clampArtistFocalPercent(toFiniteNumber(startY, 50) - toFiniteNumber(deltaY, 0) * sensitivity)),
  }
}

export function getArtistFocalStyle({ positionX, positionY } = {}) {
  const { x, y } = getArtistFocalPoint({ positionX, positionY })
  return { objectPosition: `${x}% ${y}%` }
}

/**
 * Flatten GET /api/bands/:id whether the controller returns attributes or a public band.
 */
export function readBandArtistImageContract(payload) {
  const node = payload?.data?.attributes
    ? { id: payload.data.id, ...payload.data.attributes }
    : payload?.data && typeof payload.data === 'object'
      ? payload.data
      : payload && typeof payload === 'object'
        ? payload
        : {}
  const image = unwrapBandImage(node.bandImg)
  return {
    id: node.id || null,
    name: node.name || '',
    genre: node.genre || '',
    bio: node.bio || '',
    layoutConfig: node.layoutConfig || null,
    imageFit: getArtistImageFitMode(node.layoutConfig),
    focalX: node.cyberedImagePositionX,
    focalY: node.cyberedImagePositionY,
    zoom: node.cyberedImageZoom,
    cyberedMobileFit: node.cyberedMobileFit,
    cyberedDesktopFit: node.cyberedDesktopFit,
    cyberedDesktopPositionX: node.cyberedDesktopPositionX,
    cyberedDesktopPositionY: node.cyberedDesktopPositionY,
    cyberedDesktopZoom: node.cyberedDesktopZoom,
    image,
  }
}

/**
 * Read the Artist Page framing contract. Do not invent Recap-only coordinates.
 * Fit: band.layoutConfig.imageFit
 * Focal: band.cyberedImagePositionX / cyberedImagePositionY (0–100, default 50/50)
 */
export function readArtistImageFraming(band, image) {
  const contract = readBandArtistImageContract(band)
  const resolvedImage =
    unwrapBandImage(image)
    || contract.image
    || (typeof image === 'string' ? { url: image } : null)
  return {
    imageFit: contract.imageFit,
    focalX: contract.focalX,
    focalY: contract.focalY,
    zoom: contract.zoom,
    image: resolvedImage,
    name: contract.name,
    genre: contract.genre,
    bio: contract.bio,
    layoutConfig: contract.layoutConfig,
    id: contract.id,
  }
}

function recapHeroShouldContain({ imageFit, decision, context, focalX, focalY }) {
  if (decision.resolved === 'full') return true
  const landscapeCover = decision.resolved === 'fill' && decision.ratio >= ARTIST_IMAGE_AUTO_COVER_RATIO
  if (!landscapeCover) return false
  if (context === 'hero-mobile') return true
  if (context !== 'hero-desktop') return false
  const choseFill = normalizeArtistImageFitMode(imageFit) === 'fill'
  const dragged = hasManualCyberedFraming({ positionX: focalX, positionY: focalY })
  return !choseFill && !dragged
}

/**
 * Same stored focal as Artist Page. Fit/contain may change by surface.
 * context: hero-desktop | hero-mobile | share | poster
 */
export function resolveArtistImagePresentation({
  imageFit,
  focalX,
  focalY,
  image = null,
  context = 'hero-desktop',
} = {}) {
  const focal = getArtistFocalStyle({ positionX: focalX, positionY: focalY })

  if (context === 'share' || context === 'poster') {
    return {
      objectFit: 'contain',
      objectPosition: focal.objectPosition,
      ambient: true,
      resolved: 'full',
    }
  }

  const decision = resolveArtistImageFit({
    fitMode: imageFit,
    image,
    positionX: focalX,
    positionY: focalY,
    surface: 'hero',
  })
  const contain = recapHeroShouldContain({
    imageFit,
    decision,
    context,
    focalX,
    focalY,
  })
  return {
    objectFit: contain ? 'contain' : 'cover',
    objectPosition: focal.objectPosition,
    ambient: contain,
    resolved: contain ? 'full' : decision.resolved,
  }
}

/**
 * Zoom is Cybered-hero-only. Cards, search, OG, and compact must pass applyZoom=false.
 */
/**
 * Live Cybered hero photo style. BandPageCybered and the editor preview
 * must both use this so object-position / zoom cannot drift.
 */
export function getCyberedHeroPhotoStyle({ positionX, positionY, zoom } = {}) {
  const x = clampArtistFocalPercent(positionX)
  const y = clampArtistFocalPercent(positionY)
  const z = clampArtistZoom(zoom)
  return {
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${z})`,
    transformOrigin: `${x}% ${y}%`,
  }
}

export function getArtistHeroTransformStyle({
  positionX,
  positionY,
  zoom,
  applyZoom = false,
} = {}) {
  const focal = getArtistFocalStyle({ positionX, positionY })
  if (!applyZoom) return focal

  const scale = clampZoom(toFiniteNumber(zoom, 1))
  if (scale <= 1) return focal

  const { x, y } = getArtistFocalPoint({ positionX, positionY })
  return {
    ...focal,
    transform: `scale(${scale})`,
    transformOrigin: `${x}% ${y}%`,
  }
}

export function unwrapBandImage(bandImg) {
  if (!bandImg) return null
  const node =
    bandImg.data?.attributes ||
    bandImg.attributes ||
    bandImg.data ||
    bandImg
  const url = node?.url
  if (!url) return null
  return {
    url,
    width: node.width || null,
    height: node.height || null,
    formats: node.formats || null,
    alternativeText: node.alternativeText || '',
    mime: node.mime || '',
    id: node.id || bandImg.id || null,
  }
}

export function getBestArtistImageSource(image, surface = 'hero') {
  const unwrapped = image?.url ? image : unwrapBandImage(image)
  const url = unwrapped?.url || null
  if (!url) {
    return { src: null, srcset: '', sizes: '', width: null, height: null, usedOriginal: false }
  }

  const candidates = collectFormatCandidates(unwrapped)
  const preferred = pickPreferredSource(candidates, surface) || { url, width: unwrapped.width || null }
  const srcset = buildSrcset(candidates, surface)
  const usedOriginal = preferred.url === url && !hasUsableFormats(unwrapped)

  return {
    src: preferred.url,
    srcset,
    sizes: sizesForSurface(surface),
    width: preferred.width || unwrapped.width || null,
    height: unwrapped.height || null,
    usedOriginal,
  }
}

export function validateArtistProfileImageFile(file) {
  if (!file) {
    return { error: 'missing', message: 'Choose an image' }
  }
  const mime = String(file.type || '').toLowerCase()
  if (!ARTIST_PROFILE_IMAGE_MIMES.includes(mime)) {
    return { error: 'invalid_type', message: 'Use a JPEG, PNG, or WebP image' }
  }
  if (file.size > ARTIST_PROFILE_IMAGE_MAX_BYTES) {
    return { error: 'too_large', message: 'Image is too large (10 MB max)' }
  }
  return { error: null, mime, sizeBytes: file.size }
}

export function getArtistImageShapeHint(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return ''
  if (ratio >= ARTIST_IMAGE_AUTO_COVER_RATIO) {
    return 'Landscape photo — optimized for full-width display.'
  }
  if (ratio >= 0.92 && ratio <= 1.08) {
    return 'Square photo — Faneqo will show the full image automatically.'
  }
  if (ratio < 0.92) {
    return 'Portrait photo — Faneqo will show the full image automatically.'
  }
  return 'Near-square photo — Faneqo will show the full image automatically.'
}

export function readImageDimensions(fileOrUrl) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ width: null, height: null })
      return
    }

    const img = new window.Image()
    const src =
      typeof fileOrUrl === 'string'
        ? fileOrUrl
        : fileOrUrl
          ? URL.createObjectURL(fileOrUrl)
          : ''

    if (!src) {
      resolve({ width: null, height: null })
      return
    }

    const revoke = typeof fileOrUrl !== 'string'
    img.onload = () => {
      const width = img.naturalWidth || null
      const height = img.naturalHeight || null
      if (revoke) URL.revokeObjectURL(src)
      resolve({ width, height })
    }
    img.onerror = () => {
      if (revoke) URL.revokeObjectURL(src)
      resolve({ width: null, height: null })
    }
    img.src = src
  })
}

function collectFormatCandidates(image) {
  const list = []
  const formats = image?.formats && typeof image.formats === 'object' ? image.formats : {}
  for (const key of ['thumbnail', 'small', 'medium', 'large']) {
    const format = formats[key]
    if (format?.url) {
      list.push({
        url: format.url,
        width: toFiniteNumber(format.width, 0) || null,
        key,
      })
    }
  }

  if (image?.url) {
    const width = toFiniteNumber(image.width, 0)
    const hasFormats = list.length > 0
    if (!hasFormats || (width > 0 && width <= ORIGINAL_SRCSET_MAX_WIDTH)) {
      list.push({ url: image.url, width: width || null, key: 'original' })
    }
  }

  return list
}

function hasUsableFormats(image) {
  const formats = image?.formats
  if (!formats || typeof formats !== 'object') return false
  return ['thumbnail', 'small', 'medium', 'large'].some((key) => formats[key]?.url)
}

function pickPreferredSource(candidates, surface) {
  if (!candidates.length) return null
  const byKey = Object.fromEntries(candidates.map((item) => [item.key, item]))

  if (surface === 'thumb') {
    return byKey.thumbnail || byKey.small || candidates[0]
  }
  if (surface === 'card' || surface === 'squareCard') {
    return byKey.medium || byKey.small || byKey.large || candidates[0]
  }
  return byKey.large || byKey.medium || byKey.original || candidates[candidates.length - 1]
}

function buildSrcset(candidates, surface) {
  const usable = candidates.filter((item) => {
    if (!item.url || !item.width) return false
    if (surface === 'thumb') return item.width <= 400
    if (surface === 'card' || surface === 'squareCard') return item.width <= 1200
    return item.width <= ORIGINAL_SRCSET_MAX_WIDTH
  })
  if (!usable.length) return ''
  const unique = []
  const seen = new Set()
  for (const item of usable) {
    const key = `${item.url}:${item.width}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }
  return unique.map((item) => `${item.url} ${item.width}w`).join(', ')
}

function sizesForSurface(surface) {
  if (surface === 'thumb') return '80px'
  if (surface === 'card' || surface === 'squareCard') return '(max-width: 640px) 50vw, 320px'
  if (surface === 'compact') return '(max-width: 768px) 100vw, 720px'
  return '(max-width: 768px) 100vw, 768px'
}

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, value))
}

function clampZoom(value) {
  if (value < 1) return 1
  if (value > 2) return 2
  return value
}
