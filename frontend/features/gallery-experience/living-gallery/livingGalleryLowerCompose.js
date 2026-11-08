/**
 * Photos-open lower composition.
 * Positions context/actions + Contact Sheet relative to imageRect.bottom.
 * Does not change imageRect. Pure View is not this file.
 */

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export const LOWER_BREATH_MIN = 8
export const LOWER_BREATH_PHOTO_MAX = 24
export const LOWER_BREATH_BETWEEN = 10
export const LOWER_CONTEXT_HEIGHT = 48
export const LOWER_CONTEXT_COMPACT = 36
export const LOWER_THUMB_MIN = 56
export const LOWER_THUMB_COMPACT = 64
export const LOWER_THUMB_DEFAULT = 72
export const LOWER_THUMB_TALL = 80
export const LOWER_FINISH_MIN = 12
export const LOWER_FINISH_MAX = 18
export const LOWER_SHEET_PAD_TOP = 8
export const LOWER_SHEET_PAD_BOTTOM = 6

function pickThumbHeight(remaining) {
  if (remaining < 160) return LOWER_THUMB_MIN
  if (remaining < 176) return LOWER_THUMB_COMPACT
  if (remaining < 280) return LOWER_THUMB_DEFAULT
  return LOWER_THUMB_TALL
}

function finishTarget(safeBottom) {
  const safe = Math.max(0, num(safeBottom, 0))
  if (safe > 0) return Math.max(LOWER_FINISH_MIN, Math.min(LOWER_FINISH_MAX, safe))
  return LOWER_FINISH_MIN
}

export function resolvePhotosOpenLowerCompose({
  viewportHeight = 844,
  imageRect = null,
  safeBottom = 0,
  contextOn = true,
  sheetOpen = true,
} = {}) {
  const vh = Math.max(1, num(viewportHeight, 844))
  const photoBottom = Math.round(num(imageRect?.y, 0) + num(imageRect?.h, 0))
  const safe = Math.max(0, num(safeBottom, 0))
  const remaining = Math.max(0, vh - photoBottom)
  const showContext = Boolean(contextOn)
  let contextH = showContext ? LOWER_CONTEXT_HEIGHT : 0

  if (!sheetOpen) {
    return {
      photoBottom,
      remaining,
      breathAbove: 0,
      breathBetween: 0,
      contextTop: 0,
      contextHeight: contextH,
      sheetTop: vh,
      sheetHeight: 0,
      thumbHeight: LOWER_THUMB_DEFAULT,
      leftoverBelow: remaining,
      finish: 0,
      composed: false,
    }
  }

  if (showContext && remaining < 168) contextH = LOWER_CONTEXT_COMPACT
  let thumbHeight = pickThumbHeight(remaining)
  let breathBetween = showContext ? LOWER_BREATH_BETWEEN : 0
  let breathAbove = LOWER_BREATH_MIN
  let finish = Math.max(16, finishTarget(safe))
  let sheetHeight = thumbHeight + LOWER_SHEET_PAD_TOP + LOWER_SHEET_PAD_BOTTOM

  const packed = () => breathAbove + contextH + breathBetween + sheetHeight + finish

  if (packed() > remaining && thumbHeight > LOWER_THUMB_MIN) {
    thumbHeight = LOWER_THUMB_MIN
    sheetHeight = thumbHeight + LOWER_SHEET_PAD_TOP + LOWER_SHEET_PAD_BOTTOM
  }
  if (packed() > remaining && breathBetween > 8) breathBetween = 8
  if (packed() > remaining && finish > 10) finish = 10
  if (packed() > remaining) {
    const reserved = breathAbove + contextH + breathBetween + 8
    const room = remaining - reserved
    if (room > 44) {
      thumbHeight = Math.max(52, room - LOWER_SHEET_PAD_TOP - LOWER_SHEET_PAD_BOTTOM)
      sheetHeight = thumbHeight + LOWER_SHEET_PAD_TOP + LOWER_SHEET_PAD_BOTTOM
    }
    finish = Math.max(8, remaining - (breathAbove + contextH + breathBetween + sheetHeight))
  }

  const extra = Math.max(0, remaining - packed())
  if (extra > 0) {
    const addBreath = Math.min(
      LOWER_BREATH_PHOTO_MAX - breathAbove,
      Math.round(extra * 0.28),
    )
    breathAbove += addBreath
    finish = Math.min(LOWER_FINISH_MAX, finish + Math.round((extra - addBreath) * 0.22))
  }

  const contextTop = photoBottom + breathAbove
  const sheetTop = showContext
    ? contextTop + contextH + breathBetween
    : photoBottom + breathAbove

  return {
    photoBottom,
    remaining,
    breathAbove,
    breathBetween,
    contextTop: Math.round(contextTop),
    contextHeight: contextH,
    sheetTop: Math.round(sheetTop),
    sheetHeight: Math.round(sheetHeight),
    thumbHeight,
    leftoverBelow: Math.max(0, vh - (Math.round(sheetTop) + Math.round(sheetHeight))),
    finish,
    composed: true,
  }
}

export function photosOpenLowerStyle(compose) {
  if (!compose?.composed) return {}
  return {
    '--fq-lg-band-top': `${compose.contextTop}px`,
    '--fq-lg-sheet-top': `${compose.sheetTop}px`,
    '--fq-lg-sheet-height': `${compose.sheetHeight}px`,
    '--fq-lg-thumb-height': `${compose.thumbHeight}px`,
    '--fq-lg-shelf-top': `${compose.photoBottom}px`,
    '--fq-lg-context-height': `${compose.contextHeight}px`,
  }
}

export function lowerMatteStyle(imageRect, viewportHeight = 844) {
  const vh = Math.max(1, num(viewportHeight, 844))
  const top = Math.round(num(imageRect?.y, 0) + num(imageRect?.h, 0))
  if (!(top > 0) || top >= vh) return {}
  return { top: `${top}px` }
}
