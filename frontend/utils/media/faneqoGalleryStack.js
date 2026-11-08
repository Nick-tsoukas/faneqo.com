/**
 * Gallery Stack presentation helpers.
 * Symbolic layers only — never a second Gallery media model.
 */
import { mediaPreviewLabel } from './faneqoMedia.js'
import { coverCropLoss, mediaAspectRatio, selectGalleryMediaSource } from './faneqoGalleryLayout.js'

export const STACK_VISIBLE_LIMIT = 3
export const STACK_PRINT_RATIO = 0.8

const SIZE_TARGETS = {
  archive: { front: 360, back: 200 },
  compact: { front: 220, back: 140 },
  attachment: { front: 180, back: 120 },
}

export function stackVisibleMedia(media) {
  const list = Array.isArray(media) ? media : []
  return list
    .filter((item) => item && item.unavailable !== true)
    .slice(0, STACK_VISIBLE_LIMIT)
}

export function stackPhotoCount(media, count) {
  const explicit = Number(count)
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit)
  const list = Array.isArray(media) ? media : []
  return list.length
}

export function stackLayerKind(visibleCount) {
  const n = Number(visibleCount) || 0
  if (n <= 0) return 'empty'
  if (n === 1) return 'single'
  if (n === 2) return 'pair'
  return 'stack'
}

export function stackObjectPosition(item) {
  const ratio = mediaAspectRatio(item)
  if (!ratio) return 'center center'
  if (ratio >= 1.35) return 'center 40%'
  if (ratio <= 0.82) return 'center 28%'
  return 'center center'
}

export function stackLayerSource(item, {
  layer = 'front',
  size = 'archive',
  dpr = 2,
} = {}) {
  if (!item) return null
  const targets = SIZE_TARGETS[size] || SIZE_TARGETS.archive
  const front = layer === 'front'
  return selectGalleryMediaSource(item, {
    role: front ? 'support' : 'thumb',
    targetCssPx: front ? targets.front : targets.back,
    dpr: Math.min(Math.max(Number(dpr) || 1, 1), 2),
  })
}

export function stackActivateLabel(title, count) {
  const name = String(title || '').trim() || 'Gallery'
  const photos = mediaPreviewLabel(count)
  return photos ? `Open ${name}, ${photos}` : `Open ${name}`
}

export function stackPrintRatio(item) {
  const ratio = mediaAspectRatio(item)
  if (!ratio) return STACK_PRINT_RATIO
  return Math.max(0.72, Math.min(ratio, 1.12))
}

/**
 * How a print should sit in its frame.
 *
 * `cover` is the historic behavior and stays the default for every surface.
 * `auto` opts in to the decision `selectGalleryMediaSource` already computes —
 * a source too small for its slot letterboxes instead of being upscaled — and
 * additionally letterboxes when filling the frame would crop away more of the
 * photograph than `guard` allows.
 */
export function stackLayerFit(item, {
  policy = 'cover',
  frameRatio = 0,
  sourceFit = '',
  guard = 0.25,
} = {}) {
  if (policy === 'contain') return 'contain'
  if (policy !== 'auto') return 'cover'
  if (sourceFit === 'contain') return 'contain'
  const ratio = mediaAspectRatio(item)
  const frame = Number(frameRatio)
  if (!Number.isFinite(ratio) || ratio <= 0) return 'cover'
  if (!Number.isFinite(frame) || frame <= 0) return 'cover'
  return coverCropLoss(ratio, frame) > guard ? 'contain' : 'cover'
}

export function stackBrowsableMedia(media) {
  const list = Array.isArray(media) ? media : []
  return list.filter((item) => item && item.unavailable !== true)
}

export function clampStackIndex(index, total) {
  const n = Number(total) || 0
  if (n <= 0) return 0
  const i = Math.floor(Number(index))
  if (!Number.isFinite(i)) return 0
  return Math.max(0, Math.min(i, n - 1))
}

export function stackStepIndex(index, total, delta) {
  return clampStackIndex((Number(index) || 0) + Number(delta || 0), total)
}

export const STACK_AXIS_PX = 8
export const STACK_COMMIT_PX = 56
export const STACK_COMMIT_RATIO = 0.22
export const STACK_COMMIT_VELOCITY = 0.42
export const STACK_TAP_SLOP = 8

export function stackGestureAxis(dx, dy, threshold = STACK_AXIS_PX) {
  const ax = Math.abs(Number(dx) || 0)
  const ay = Math.abs(Number(dy) || 0)
  const need = Number(threshold) || STACK_AXIS_PX
  if (ax < need && ay < need) return null
  if (ax >= ay * 1.15 && ax >= need) return 'x'
  if (ay > ax && ay >= need) return 'y'
  return null
}

export function stackIsTap(axis, dx, dy, slop = STACK_TAP_SLOP) {
  return axis == null
    && Math.abs(Number(dx) || 0) < slop
    && Math.abs(Number(dy) || 0) < slop
}

export function stackElasticDrag(dx, { canPrev, canNext } = {}) {
  const x = Number(dx) || 0
  if (x < 0 && !canNext) return x * 0.22
  if (x > 0 && !canPrev) return x * 0.22
  return x
}

export function stackShouldCommit(dx, {
  canPrev,
  canNext,
  width,
  velocity = 0,
  reduced = false,
} = {}) {
  const x = Number(dx) || 0
  const next = x < 0
  const allowed = next ? canNext : canPrev
  if (!allowed || x === 0) return 0
  const dist = Math.abs(x)
  const need = Math.max(STACK_COMMIT_PX, (Number(width) || 320) * STACK_COMMIT_RATIO)
  const vel = Number(velocity) || 0
  const velOk = next ? vel < -STACK_COMMIT_VELOCITY : vel > STACK_COMMIT_VELOCITY
  const min = reduced ? Math.min(28, need * 0.45) : need
  if (dist >= min || velOk) return next ? 1 : -1
  return 0
}

export function stackDeckPlan(media, activeIndex, dragDir = 0) {
  const list = stackBrowsableMedia(media)
  const total = list.length
  const index = clampStackIndex(activeIndex, total)
  const canPrev = index > 0
  const canNext = index < total - 1
  if (total <= 0) {
    return {
      index: 0,
      total: 0,
      front: null,
      under: null,
      depth: null,
      kind: 'empty',
      canPrev: false,
      canNext: false,
    }
  }
  if (total === 1) {
    return {
      index: 0,
      total: 1,
      front: list[0],
      under: null,
      depth: null,
      kind: 'single',
      canPrev: false,
      canNext: false,
    }
  }
  let under = null
  let depth = null
  if (total === 2) {
    under = list[index === 0 ? 1 : 0]
  } else if (dragDir < 0 && canPrev) {
    under = list[index - 1]
    depth = canNext ? list[index + 1] : (index >= 2 ? list[index - 2] : null)
  } else if (canNext) {
    under = list[index + 1]
    depth = canPrev ? list[index - 1] : (list[index + 2] || null)
  } else {
    under = list[index - 1]
    depth = index >= 2 ? list[index - 2] : null
  }
  return {
    index,
    total,
    front: list[index],
    under,
    depth,
    kind: total === 2 ? 'pair' : 'stack',
    canPrev,
    canNext,
  }
}

export function stackVisibleLayers(media, activeIndex, dragDir = 0) {
  const plan = stackDeckPlan(media, activeIndex, dragDir)
  const rows = []
  if (plan.depth) rows.push({ item: plan.depth, role: 'back-b' })
  if (plan.under) rows.push({ item: plan.under, role: 'back-a' })
  if (plan.front) rows.push({ item: plan.front, role: 'front' })
  return rows
}

export function stackActivatePayload(media, index) {
  const list = stackBrowsableMedia(media)
  const i = clampStackIndex(index, list.length)
  const item = list[i] || null
  return {
    index: i,
    mediaId: item?.mediaId != null && item.mediaId !== ''
      ? item.mediaId
      : (item?.id != null ? item.id : null),
    media: item,
  }
}

export function stackPositionLabel(index, total) {
  const n = Number(total) || 0
  if (n <= 1) return ''
  return `${clampStackIndex(index, n) + 1} / ${n}`
}
