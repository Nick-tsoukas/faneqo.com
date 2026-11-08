/**
 * Gallery Page photograph + swipe helpers.
 * One pristine active photograph. No rear-card stack.
 * PhotoSwipe owns Living Gallery physics.
 */

export const DECK_MAX_BEHIND = 0
export const DECK_DRAG_COMMIT = 56
export const DECK_VELOCITY_COMMIT = 0.55
export const DECK_REVEAL_X = 0
export const DECK_REVEAL_Y = 0
export const DECK_REVEAL_STEP = 0
export const DECK_ROTATE = 0
export const DECK_REVEAL_RESERVE = 0

export function clampDeckIndex(index, count) {
  const n = Math.max(0, Number(count) || 0)
  if (!n) return 0
  const i = Math.round(Number(index) || 0)
  return Math.min(n - 1, Math.max(0, i))
}

export function deckHasStack(count) {
  return (Number(count) || 0) > 1
}

export function fitPhotoInStage(photoW, photoH, stageW, stageH, { reveal = 0 } = {}) {
  const pw = Math.max(1, Number(photoW) || 1)
  const ph = Math.max(1, Number(photoH) || 1)
  const sw = Math.max(1, Number(stageW) || 1)
  const sh = Math.max(1, Number(stageH) || 1)
  const gutter = Math.max(0, Number(reveal) || 0)
  const innerW = Math.max(1, sw - gutter)
  const innerH = Math.max(1, sh - gutter)
  const scale = Math.min(innerW / pw, innerH / ph)
  const w = Math.max(1, Math.round(pw * scale))
  const h = Math.max(1, Math.round(ph * scale))
  return {
    w,
    h,
    x: Math.round((innerW - w) / 2),
    y: Math.round((innerH - h) / 2),
  }
}

export function deckLayers(memories = [], index = 0, { maxBehind = DECK_MAX_BEHIND } = {}) {
  const list = Array.isArray(memories) ? memories : []
  const n = list.length
  const current = clampDeckIndex(index, n)
  if (!n) return []

  const behind = []
  const depth = deckHasStack(n) ? Math.min(maxBehind, n - 1) : 0
  for (let step = depth; step >= 1; step -= 1) {
    const i = current + step
    if (i >= n) continue
    behind.push({
      memory: list[i],
      index: i,
      layer: step,
      front: false,
    })
  }
  behind.push({
    memory: list[current],
    index: current,
    layer: 0,
    front: true,
  })
  return behind
}

export function deckLayerStyle(layer, { dragX = 0, reduced = false, fit = null } = {}) {
  const depth = Number(layer?.layer) || 0
  const box = fit && fit.w
    ? {
      width: `${fit.w}px`,
      height: `${fit.h}px`,
      left: `${fit.x}px`,
      top: `${fit.y}px`,
    }
    : {}
  if (layer?.front) {
    return {
      ...box,
      transform: `translate3d(${Math.round(dragX)}px, 0, 0)`,
      zIndex: 8,
      opacity: 1,
    }
  }
  const step = Math.max(0, depth - 1) * DECK_REVEAL_STEP
  const x = reduced ? 8 : DECK_REVEAL_X + step
  const y = reduced ? 4 : DECK_REVEAL_Y + Math.min(2, step)
  const rot = reduced ? 0 : -(DECK_ROTATE * depth)
  return {
    ...box,
    transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`,
    zIndex: 8 - depth,
    opacity: 1,
  }
}

export function commitDeckDrag({
  dx = 0,
  vx = 0,
  index = 0,
  count = 0,
} = {}) {
  const current = clampDeckIndex(index, count)
  const n = Math.max(0, Number(count) || 0)
  if (n <= 1) return current
  const goNext = dx < -DECK_DRAG_COMMIT || vx < -DECK_VELOCITY_COMMIT
  const goPrev = dx > DECK_DRAG_COMMIT || vx > DECK_VELOCITY_COMMIT
  if (goNext) return clampDeckIndex(current + 1, n)
  if (goPrev) return clampDeckIndex(current - 1, n)
  return current
}

export function resistDeckDrag(dx, index, count) {
  const current = clampDeckIndex(index, count)
  const n = Math.max(0, Number(count) || 0)
  const atStart = current <= 0 && dx > 0
  const atEnd = current >= n - 1 && dx < 0
  if (n <= 1) return dx * 0.18
  if (atStart || atEnd) return dx * 0.22
  return dx
}
