/**
 * Cybered hero geometry for the STATIC shell only.
 *
 * Wide / landscape / square: height follows the source aspect ratio
 * (width / height), then CSS min/max clamps.
 *
 * Tall portrait (`portrait` and `deep`): the source ratio is used only
 * to classify. Mobile height is a controlled viewport — never derived
 * from the natural aspect ratio after that point.
 *
 * Never outputs transforms. Never changes cover, pan, or zoom.
 * Motion scale and Cybered zoom must never be applied to this shell.
 */

export const CYBERED_HERO_DEFAULT_RATIO = 1.6

export const CYBERED_HERO_BANDS = ['wide', 'landscape', 'square', 'portrait', 'deep']

export const CYBERED_HERO_BAND_MIN_RATIO = {
  wide: 1.65,
  landscape: 1.3,
  square: 0.9,
  portrait: 0.7,
}

/** Width/height below this is a `deep` (extreme tall) source. */
export const CYBERED_HERO_TALL_PORTRAIT_MAX_RATIO = CYBERED_HERO_BAND_MIN_RATIO.portrait

/**
 * Width/height below square (0.9) is a tall/portrait source.
 * Those bands get the mobile hard-capped cinematic crop.
 */
export const CYBERED_HERO_TALL_SOURCE_MAX_RATIO = CYBERED_HERO_BAND_MIN_RATIO.square

/** Preferred mobile tall-hero range: 380–430px. Absolute max 430px. */
export const CYBERED_HERO_PORTRAIT_MOBILE_MIN_HEIGHT = '23.75rem'
export const CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT = '26.875rem'
export const CYBERED_HERO_PORTRAIT_MOBILE_HEIGHT = `clamp(${CYBERED_HERO_PORTRAIT_MOBILE_MIN_HEIGHT}, 48vh, ${CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT})`

/** Mobile-only name lift into the photo for tall heroes (~16px). */
export const CYBERED_HERO_PORTRAIT_NAME_INSET = '1rem'

/** @deprecated Use CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT. Alias kept for existing CSS. */
export const CYBERED_HERO_DEEP_MOBILE_MAX_HEIGHT = CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT

/** @deprecated Use CYBERED_HERO_PORTRAIT_NAME_INSET. */
export const CYBERED_HERO_DEEP_NAME_INSET = CYBERED_HERO_PORTRAIT_NAME_INSET

export function getCyberedHeroRatio(image) {
  const media = unwrapCyberedHeroImage(image)
  const width = toPositiveNumber(media?.width)
  const height = toPositiveNumber(media?.height)
  if (!width || !height) return null
  return width / height
}

export function getCyberedHeroBand(ratio) {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return 'landscape'
  if (ratio >= CYBERED_HERO_BAND_MIN_RATIO.wide) return 'wide'
  if (ratio >= CYBERED_HERO_BAND_MIN_RATIO.landscape) return 'landscape'
  if (ratio >= CYBERED_HERO_BAND_MIN_RATIO.square) return 'square'
  if (ratio >= CYBERED_HERO_BAND_MIN_RATIO.portrait) return 'portrait'
  return 'deep'
}

/** Portrait and deep sources get the mobile tall-hero hard cap. */
export function isCyberedHeroTallPortrait(band) {
  return band === 'portrait' || band === 'deep'
}

export function resolveCyberedHeroGeometry(image) {
  const ratio = getCyberedHeroRatio(image)
  const usedRatio =
    ratio != null && Number.isFinite(ratio) && ratio > 0
      ? ratio
      : CYBERED_HERO_DEFAULT_RATIO

  const band = getCyberedHeroBand(ratio)
  const style = {
    '--fq-hero-ratio': String(usedRatio),
  }
  if (isCyberedHeroTallPortrait(band)) {
    style['--fq-hero-portrait-height-mobile'] = CYBERED_HERO_PORTRAIT_MOBILE_HEIGHT
    style['--fq-hero-portrait-min-mobile'] = CYBERED_HERO_PORTRAIT_MOBILE_MIN_HEIGHT
    style['--fq-hero-portrait-max-mobile'] = CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT
    style['--fq-hero-portrait-name-inset'] = CYBERED_HERO_PORTRAIT_NAME_INSET
    style['--fq-hero-deep-max-mobile'] = CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT
    style['--fq-hero-deep-name-inset'] = CYBERED_HERO_PORTRAIT_NAME_INSET
  }

  return {
    band,
    ratio: usedRatio,
    style,
  }
}

/** 1rem in the Cybered CSS contract. */
export const CYBERED_CSS_PX_PER_REM = 16

/** Editor Phone tab simulates this public viewport. */
export const CYBERED_PREVIEW_PHONE_VIEWPORT = { width: 390, height: 844 }

/** Editor Desktop tab simulates this public viewport. */
export const CYBERED_PREVIEW_DESKTOP_VIEWPORT = { width: 1440, height: 900 }

export const CYBERED_STAGE_MAX_WIDTH_PX = 48 * CYBERED_CSS_PX_PER_REM
export const CYBERED_STAGE_GUTTER_MOBILE_PX = 24
export const CYBERED_STAGE_GUTTER_SM_PX = 32
export const CYBERED_SM_BREAKPOINT_PX = 640
export const CYBERED_MD_BREAKPOINT_PX = 768
export const CYBERED_LG_BREAKPOINT_PX = 1024

export const CYBERED_HERO_MIN_HEIGHT_MOBILE_PX = 17.5 * CYBERED_CSS_PX_PER_REM
export const CYBERED_HERO_MAX_HEIGHT_MOBILE_PX = 35 * CYBERED_CSS_PX_PER_REM
export const CYBERED_HERO_MIN_HEIGHT_TABLET_PX = 22.5 * CYBERED_CSS_PX_PER_REM
export const CYBERED_HERO_MAX_HEIGHT_TABLET_PX = 42.5 * CYBERED_CSS_PX_PER_REM

export const CYBERED_HERO_DESKTOP_MIN_PX = 31 * CYBERED_CSS_PX_PER_REM
export const CYBERED_HERO_DESKTOP_MAX_PX = 35 * CYBERED_CSS_PX_PER_REM
export const CYBERED_HERO_DESKTOP_VH = 0.56
export const CYBERED_DESKTOP_STAGE_MIN_PX = 52 * CYBERED_CSS_PX_PER_REM
export const CYBERED_DESKTOP_STAGE_MAX_PX = 62 * CYBERED_CSS_PX_PER_REM
export const CYBERED_DESKTOP_STAGE_VW = 0.68
export const CYBERED_DESKTOP_GUTTER_PX = 32

export const CYBERED_HERO_PORTRAIT_MOBILE_MIN_PX = 23.75 * CYBERED_CSS_PX_PER_REM
export const CYBERED_HERO_PORTRAIT_MOBILE_MAX_PX = 26.875 * CYBERED_CSS_PX_PER_REM
export const CYBERED_HERO_PORTRAIT_MOBILE_VH = 0.48

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Public BandPageCybered hero box for a viewport.
 * Mirrors the scoped CSS: stage gutters, portrait mobile cap, desktop cinematic clamp.
 * Never outputs transforms. Cover / pan / zoom stay on the photo.
 */
export function getCyberedPublicHeroFrame({
  surface = 'phone',
  image = null,
  viewportWidth = null,
  viewportHeight = null,
} = {}) {
  const geometry = resolveCyberedHeroGeometry(image)
  const isDesktop = surface === 'desktop'
  const vw =
    toPositiveNumber(viewportWidth) ||
    (isDesktop ? CYBERED_PREVIEW_DESKTOP_VIEWPORT.width : CYBERED_PREVIEW_PHONE_VIEWPORT.width)
  const vh =
    toPositiveNumber(viewportHeight) ||
    (isDesktop ? CYBERED_PREVIEW_DESKTOP_VIEWPORT.height : CYBERED_PREVIEW_PHONE_VIEWPORT.height)

  if (isDesktop || vw >= CYBERED_LG_BREAKPOINT_PX) {
    const stage = clampNumber(
      vw * CYBERED_DESKTOP_STAGE_VW,
      CYBERED_DESKTOP_STAGE_MIN_PX,
      CYBERED_DESKTOP_STAGE_MAX_PX,
    )
    const width = stage - CYBERED_DESKTOP_GUTTER_PX
    const height = clampNumber(
      vh * CYBERED_HERO_DESKTOP_VH,
      CYBERED_HERO_DESKTOP_MIN_PX,
      CYBERED_HERO_DESKTOP_MAX_PX,
    )
    return finishFrame({
      surface: 'desktop',
      vw,
      vh,
      width,
      height,
      geometry,
    })
  }

  const gutter = vw >= CYBERED_SM_BREAKPOINT_PX ? CYBERED_STAGE_GUTTER_SM_PX : CYBERED_STAGE_GUTTER_MOBILE_PX
  const width = Math.min(vw, CYBERED_STAGE_MAX_WIDTH_PX) - gutter

  if (vw < CYBERED_MD_BREAKPOINT_PX && isCyberedHeroTallPortrait(geometry.band)) {
    const height = clampNumber(
      vh * CYBERED_HERO_PORTRAIT_MOBILE_VH,
      CYBERED_HERO_PORTRAIT_MOBILE_MIN_PX,
      CYBERED_HERO_PORTRAIT_MOBILE_MAX_PX,
    )
    return finishFrame({
      surface: 'phone',
      vw,
      vh,
      width,
      height,
      geometry,
    })
  }

  const minH = vw >= CYBERED_MD_BREAKPOINT_PX ? CYBERED_HERO_MIN_HEIGHT_TABLET_PX : CYBERED_HERO_MIN_HEIGHT_MOBILE_PX
  const maxH = vw >= CYBERED_MD_BREAKPOINT_PX ? CYBERED_HERO_MAX_HEIGHT_TABLET_PX : CYBERED_HERO_MAX_HEIGHT_MOBILE_PX
  const height = clampNumber(width / geometry.ratio, minH, maxH)
  return finishFrame({
    surface: 'phone',
    vw,
    vh,
    width,
    height,
    geometry,
  })
}

/** Editor viewport tabs always use the canonical public reference devices. */
export function getCyberedEditorPreviewFrame({ surface = 'phone', image = null } = {}) {
  const viewport =
    surface === 'desktop' ? CYBERED_PREVIEW_DESKTOP_VIEWPORT : CYBERED_PREVIEW_PHONE_VIEWPORT
  return getCyberedPublicHeroFrame({
    surface: surface === 'desktop' ? 'desktop' : 'phone',
    image,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  })
}

function finishFrame({ surface, vw, vh, width, height, geometry }) {
  const frameWidth = Math.round(width * 100) / 100
  const frameHeight = Math.round(height * 100) / 100
  return {
    surface,
    viewportWidth: vw,
    viewportHeight: vh,
    width: frameWidth,
    height: frameHeight,
    ratio: frameWidth / frameHeight,
    band: geometry.band,
    sourceRatio: geometry.ratio,
    objectFit: 'cover',
  }
}

function unwrapCyberedHeroImage(image) {
  if (!image || typeof image === 'string') return null
  return image.data?.attributes || image.attributes || image.data || image
}

function toPositiveNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}
