/**
 * Source-photo contract for Memory Deck / print → Living Gallery continuity.
 * Does not build the deck. Does not touch production Gallery Stack.
 *
 * getThumbBoundsFn / object-continuity uses these public helpers.
 */

/*
 * The pending list is the only record of what must be restored. A separate
 * long-lived membership set would keep de-duping a node after the list was
 * drained, so the second open would hide the print with nothing tracking it
 * and close would leave it invisible forever.
 */
const hiddenList = []

function isElement(value) {
  return typeof Element !== 'undefined' && value instanceof Element
}

function readObjectFit(node) {
  if (!node) return 'fill'
  const attr = String(node.getAttribute?.('data-fit') || '').trim().toLowerCase()
  if (attr) return attr
  const view = node.ownerDocument?.defaultView
  const fit = view?.getComputedStyle?.(node)?.objectFit
  return String(fit || 'fill').toLowerCase()
}

function readImageSize(node) {
  const nw = Number(node?.naturalWidth) || 0
  const nh = Number(node?.naturalHeight) || 0
  if (nw > 0 && nh > 0) return { width: nw, height: nh }
  return {
    width: Number(node?.getAttribute?.('width')) || 0,
    height: Number(node?.getAttribute?.('height')) || 0,
  }
}

/**
 * Map a laid-out box + intrinsic photo to the photograph PhotoSwipe should travel from.
 * contain → the letterboxed print. cover → cropped box + innerRect.
 */
export function imageBoundsFromBox({
  x = 0,
  y = 0,
  w = 0,
  h = 0,
  imageWidth = 0,
  imageHeight = 0,
  objectFit = 'fill',
} = {}) {
  const boxW = Number(w) || 0
  const boxH = Number(h) || 0
  if (!(boxW > 8) || !(boxH > 8)) return undefined
  const box = {
    x: Number(x) || 0,
    y: Number(y) || 0,
    w: boxW,
    h: boxH,
  }
  const iw = Number(imageWidth) || 0
  const ih = Number(imageHeight) || 0
  const fit = String(objectFit || 'fill').toLowerCase()
  if (!(iw > 0 && ih > 0)) return box
  if (fit === 'contain' || fit === 'scale-down') {
    const scale = Math.min(box.w / iw, box.h / ih)
    const dw = iw * scale
    const dh = ih * scale
    return {
      x: box.x + (box.w - dw) / 2,
      y: box.y + (box.h - dh) / 2,
      w: dw,
      h: dh,
    }
  }
  if (fit === 'cover') {
    const scale = Math.max(box.w / iw, box.h / ih)
    const dw = iw * scale
    const dh = ih * scale
    const ox = (dw - box.w) / 2
    const oy = (dh - box.h) / 2
    return {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      innerRect: {
        x: -ox,
        y: -oy,
        w: dw,
        h: dh,
      },
    }
  }
  return box
}

export function boundsFromElement(element) {
  const node = isElement(element)
    ? (element.matches?.('img') ? element : element.querySelector?.('img') || element)
    : null
  if (!isElement(node)) return undefined
  const rect = node.getBoundingClientRect()
  const size = readImageSize(node)
  return imageBoundsFromBox({
    x: rect.left,
    y: rect.top,
    w: rect.width,
    h: rect.height,
    imageWidth: size.width,
    imageHeight: size.height,
    objectFit: readObjectFit(node),
  })
}

export function normalizeOpenSource(input = {}) {
  const sourceElement = isElement(input.sourceElement) ? input.sourceElement : null
  const liveBounds = boundsFromElement(sourceElement)
  const sourceBounds = liveBounds
    || (input.sourceBounds && Number(input.sourceBounds.w) > 0
      ? {
        x: Number(input.sourceBounds.x) || 0,
        y: Number(input.sourceBounds.y) || 0,
        w: Number(input.sourceBounds.w),
        h: Number(input.sourceBounds.h) || undefined,
        ...(input.sourceBounds.innerRect ? { innerRect: input.sourceBounds.innerRect } : {}),
      }
      : undefined)
  const index = Number(input.sourceIndex)
  return {
    sourceElement,
    sourceBounds: sourceBounds || undefined,
    sourceMediaId: String(input.sourceMediaId || '').trim() || null,
    sourceGalleryId: String(input.sourceGalleryId || '').trim() || null,
    sourceIndex: Number.isFinite(index) ? Math.max(0, Math.round(index)) : 0,
  }
}

export function resolveThumbElement(index, memories, source, doc = typeof document !== 'undefined' ? document : null) {
  const memory = Array.isArray(memories) ? memories[index] : null
  if (source?.sourceElement && (source.sourceIndex === index || source.sourceMediaId === memory?.id)) {
    return source.sourceElement
  }
  if (!doc || !memory?.id) return null
  return doc.querySelector(`[data-gx-deck-front="${memory.id}"]`)
    || doc.querySelector(`[data-gx-print="${memory.id}"]`)
    || doc.querySelector(`[data-gx-thumb="${memory.id}"]`)
    || null
}

export function resolveThumbBounds(index, memories, source, doc = typeof document !== 'undefined' ? document : null) {
  const memory = Array.isArray(memories) ? memories[index] : null
  const element = resolveThumbElement(index, memories, source, doc)
  const live = boundsFromElement(element)
  if (live) return live
  if (source?.sourceBounds && (source.sourceIndex === index || source.sourceMediaId === memory?.id)) {
    return source.sourceBounds
  }
  return undefined
}

export function hideContinuityElement(element) {
  const node = isElement(element)
    ? (element.closest?.('[data-gx-deck-front], [data-gx-print], [data-gx-thumb], .fq-md__card') || element)
    : null
  if (!isElement(node)) return
  node.setAttribute('data-gx-continuity', 'hidden')
  if (!hiddenList.includes(node)) hiddenList.push(node)
}

export function restoreContinuityElements() {
  while (hiddenList.length) {
    const node = hiddenList.pop()
    node?.removeAttribute?.('data-gx-continuity')
  }
}
