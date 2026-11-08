/**
 * Headless contact-sheet / thumbnail navigation.
 * PhotoSwipe remains active-photo truth.
 *
 * thumbnail selected → goTo(index) → main photograph changes
 * thumbnailContinuity() is the hook for later thumbnail→photo animation.
 */

import { boundsFromElement } from './livingGallerySource.js'

export const SHEET_RAIL = 'rail'
export const SHEET_GRID = 'grid'
export const THUMB_NATIVE = 'native'
export const THUMB_CROPPED = 'cropped'

export function shouldShowContactSheet(total) {
  return Math.max(0, Number(total) || 0) > 1
}

export function neighborIndices(index, total, before = 1, after = 2) {
  const i = Math.max(0, Number(index) || 0)
  const n = Math.max(0, Number(total) || 0)
  const out = []
  for (let k = i - before; k <= i + after; k += 1) {
    if (k >= 0 && k < n) out.push(k)
  }
  return out
}

export function thumbnailSrc(memory) {
  return memory?.thumbSrc || memory?.mediumSrc || memory?.src || ''
}

export function thumbnailAspect(memory) {
  const w = Math.max(1, Number(memory?.width) || 1)
  const h = Math.max(1, Number(memory?.height) || 1)
  return w / h
}

export function thumbnailItems(memories, activeIndex = 0) {
  const list = Array.isArray(memories) ? memories : []
  const active = Math.max(0, Number(activeIndex) || 0)
  return list.map((memory, index) => ({
    index,
    id: memory.id,
    mediaId: memory.id,
    src: thumbnailSrc(memory),
    srcset: Array.isArray(memory.srcsetCandidates) && memory.srcsetCandidates.length > 1
      ? memory.srcsetCandidates.map((row) => `${row.src} ${row.width}w`).join(', ')
      : undefined,
    width: memory.width,
    height: memory.height,
    aspect: thumbnailAspect(memory),
    alt: memory.alt || `Photograph ${index + 1}`,
    selected: index === active,
    neighbor: Math.abs(index - active) <= 2,
  }))
}

export function thumbnailContinuity({ index, item, element } = {}) {
  const mediaId = item?.mediaId || item?.id || null
  return {
    index: Math.max(0, Number(index) || 0),
    mediaId,
    thumbnailElement: element || null,
    thumbnailBounds: boundsFromElement(element),
  }
}

export function moveThumbnailIndex(activeIndex, total, delta) {
  const n = Math.max(0, Number(total) || 0)
  if (!n) return 0
  const next = Math.max(0, Number(activeIndex) || 0) + Number(delta)
  return Math.min(n - 1, Math.max(0, next))
}

export function handleThumbnailKeydown(event, { activeIndex, total, onSelect, onClose } = {}) {
  const key = event?.key
  if (!key) return false
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    event.preventDefault?.()
    onSelect?.(moveThumbnailIndex(activeIndex, total, 1))
    return true
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    event.preventDefault?.()
    onSelect?.(moveThumbnailIndex(activeIndex, total, -1))
    return true
  }
  if (key === 'Home') {
    event.preventDefault?.()
    onSelect?.(0)
    return true
  }
  if (key === 'End') {
    event.preventDefault?.()
    onSelect?.(Math.max(0, (Number(total) || 1) - 1))
    return true
  }
  if (key === 'Enter' || key === ' ') {
    event.preventDefault?.()
    onSelect?.(activeIndex)
    return true
  }
  if (key === 'Escape') {
    event.preventDefault?.()
    onClose?.()
    return true
  }
  return false
}

/*
 * Scrolled by arithmetic rather than `scrollIntoView`, which walks ancestors
 * and can nudge the fixed viewer itself. The sheet is the only thing that may
 * move, and the frame you are looking at has to be in it.
 */
export function scrollSelectedThumbnailIntoView(root) {
  const selected = root?.querySelector?.('[data-gx-thumb-selected="true"], [aria-current="true"]')
  if (!root || !selected || typeof root.scrollLeft !== 'number') return
  const span = root.clientWidth
  const max = Math.max(0, root.scrollWidth - span)
  if (max <= 0) return
  const target = selected.offsetLeft - (span - selected.offsetWidth) / 2
  root.scrollLeft = Math.round(Math.min(max, Math.max(0, target)))
}
