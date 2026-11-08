/**
 * Justified rows for the gallery wall.
 *
 * Every photograph keeps its own shape. No forced square, no destructive
 * crop, no uniform tile — portrait and landscape stand in the same row the
 * way prints lie on a table.
 *
 * Geometry is planned from intrinsic width/height, never from a loaded image,
 * so rows are reserved at their final size before any byte arrives and the
 * wall does not reflow as photographs appear.
 *
 * Two guards earn their place:
 *
 *   · A last row that could not fill its width must not stretch. One leftover
 *     landscape at full width becomes a billboard and breaks the rhythm of
 *     every row above it, so an underfull final row keeps the target height.
 *   · Extreme ratios are clamped. An uncropped 6:1 panorama would otherwise
 *     drive its whole row down to a letterbox strip.
 */

/** Used only when a photograph arrives with no usable dimensions. */
export const GALLERY_FALLBACK_RATIO = 1.5

/** Beyond these, one photograph would dictate the shape of a whole row. */
export const GALLERY_MIN_RATIO = 0.45
export const GALLERY_MAX_RATIO = 3

/** An underfull last row may exceed the target by this much before it snaps. */
export const GALLERY_LAST_ROW_GROWTH = 1.3

function positive(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

/** Aspect ratio for layout purposes: clamped, and never zero. */
export function galleryPhotoRatio(photo) {
  const direct = positive(photo?.aspectRatio)
  const width = positive(photo?.width)
  const height = positive(photo?.height)
  const raw = direct || (width && height ? width / height : 0) || GALLERY_FALLBACK_RATIO
  return Math.min(Math.max(raw, GALLERY_MIN_RATIO), GALLERY_MAX_RATIO)
}

/**
 * Plan rows that each fill `availableWidth` exactly.
 *
 * Returns `[{ height, items: [{ photo, index, width, height }] }]` with
 * integer pixel sizes, so the caller can set them directly and never measure.
 */
export function planJustifiedRows(photos, {
  availableWidth,
  targetHeight,
  gap = 4,
  lastRowGrowth = GALLERY_LAST_ROW_GROWTH,
} = {}) {
  const list = Array.isArray(photos) ? photos.filter(Boolean) : []
  const width = positive(availableWidth)
  const target = positive(targetHeight)
  const spacing = Math.max(0, Number(gap) || 0)
  if (!list.length || !width || !target) return []

  const rows = []
  let line = []
  let ratioSum = 0

  const flush = (isLast) => {
    if (!line.length) return
    const usable = width - spacing * (line.length - 1)
    let height = usable / ratioSum
    // An underfull final row keeps the rhythm rather than towering over it.
    if (isLast && height > target * lastRowGrowth) height = target
    rows.push({
      height: Math.round(height),
      items: line.map((entry) => ({
        photo: entry.photo,
        index: entry.index,
        width: Math.floor(height * entry.ratio),
        height: Math.round(height),
      })),
    })
    line = []
    ratioSum = 0
  }

  list.forEach((photo, position) => {
    const ratio = galleryPhotoRatio(photo)
    line.push({ photo, ratio, index: Number.isFinite(photo?.index) ? photo.index : position })
    ratioSum += ratio
    const usable = width - spacing * (line.length - 1)
    if (usable / ratioSum < target) flush(false)
  })
  flush(true)

  return rows
}

/**
 * Row height target by viewport. Phones get shorter rows so more of the Night
 * is visible per scroll; large displays get taller rows so a photograph still
 * reads as a photograph.
 */
export function galleryTargetRowHeight(viewportWidth) {
  const width = positive(viewportWidth)
  if (width < 480) return 230
  if (width < 900) return 280
  if (width < 1500) return 340
  return 400
}

/** Edge-to-edge on a phone; breathing room once there is room to breathe. */
export function galleryWallPadding(viewportWidth) {
  const width = positive(viewportWidth)
  if (width < 640) return 0
  if (width < 1024) return 24
  return 40
}

export function galleryWallGap(viewportWidth) {
  return positive(viewportWidth) < 640 ? 3 : 4
}

export const GALLERY_WALL_MAX_WIDTH = 1680

export function galleryWallAvailableWidth(viewportWidth) {
  const width = positive(viewportWidth)
  if (!width) return 0
  return Math.min(GALLERY_WALL_MAX_WIDTH, width) - galleryWallPadding(width) * 2
}

/**
 * A viewport-based plate height. The public gallery overview does not use
 * this: the opening photograph keeps its own aspect ratio. The helper stays
 * so layout tests can still describe the old fixed frame.
 */
export function galleryPlateHeight(viewportWidth, viewportHeight) {
  const width = positive(viewportWidth)
  const height = positive(viewportHeight)
  if (!width || !height) return 0
  return Math.round(
    width < 640
      ? Math.min(height * 0.62, width * 0.92)
      : Math.min(height * 0.78, width * 0.46),
  )
}

/** Contact-sheet frames: summoned, dense, still true to shape. */
export function galleryContactRowHeight(viewportWidth) {
  return positive(viewportWidth) < 640 ? 92 : 128
}
