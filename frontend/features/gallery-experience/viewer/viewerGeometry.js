/**
 * Photo Viewer geometry.
 *
 * One rule decides this whole surface:
 *
 *   THE PHOTOGRAPH OWNS THE DISPLAY. CHROME LIVES IN WHAT IS LEFT OVER.
 *
 * So the print is contain-fitted into the entire viewport minus a small
 * authored margin, and every control is anchored to a display edge — never to
 * the print. Chrome anchored to the print would move each time an aspect ratio
 * changed under the finger; anchored to the display it is dead still.
 *
 * PhotoSwipe must resolve the identical rectangle, or the caption would name a
 * photograph that is somewhere else. `viewerPadding()` feeds `paddingFn` and
 * `viewerLayout()` feeds the chrome; both read the same numbers, and
 * PhotoSwipe centres exactly the same way we do:
 *
 *   pan-bounds.js → center = round((panArea - element) / 2) + paddingStart
 *
 * Pure module. No DOM, no Vue, no PhotoSwipe import.
 */

export const VIEWER_PHONE = 'phone'
export const VIEWER_TABLET = 'tablet'
export const VIEWER_DESKTOP = 'desktop'
export const VIEWER_WALL = 'wall'

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * A phone on its side is still a phone, and 2560 is not the same room as 1440.
 * Width decides the room; a short viewport overrides it, because 844×390 has
 * the reserves of a phone whatever its width suggests.
 */
export function viewerDevice(viewportWidth, viewportHeight) {
  const w = num(viewportWidth, 390)
  const h = num(viewportHeight, 844)
  if (h < 560 && w > h) return VIEWER_PHONE
  if (w < 640) return VIEWER_PHONE
  if (w < 1024) return VIEWER_TABLET
  if (w < 2100) return VIEWER_DESKTOP
  return VIEWER_WALL
}

/**
 * `edge` — side margin. `top` — headroom over the print. `foot` — the band the
 * caption and index live in.
 *
 * A phone bleeds to both side edges on purpose: 390px of glass is too little to
 * spend on a margin, and a photograph touching the glass is the most print the
 * device can give. Desktop keeps a real margin because a print hard against a
 * monitor bezel reads as a browser window, not as a wall.
 *
 * The foot is always deeper than the headroom. That lifts the print above the
 * geometric centre the way a framed photograph is hung slightly high.
 */
const RESERVE = {
  [VIEWER_PHONE]: { edge: 0, top: 10, foot: 52 },
  [VIEWER_TABLET]: { edge: 24, top: 24, foot: 66 },
  [VIEWER_DESKTOP]: { edge: 36, top: 34, foot: 78 },
  [VIEWER_WALL]: { edge: 56, top: 50, foot: 100 },
}

/** A phone on its side has no vertical budget to give away. */
const RESERVE_SIDEWAYS = { edge: 0, top: 8, foot: 38 }

export function viewerReserve(viewportWidth, viewportHeight) {
  const w = num(viewportWidth, 390)
  const h = num(viewportHeight, 844)
  if (h < 560 && w > h) return RESERVE_SIDEWAYS
  return RESERVE[viewerDevice(w, h)]
}

/**
 * Viewport edge → stage box. This is what PhotoSwipe receives as `padding`.
 */
export function viewerPadding({
  viewportWidth,
  viewportHeight,
  safeTop = 0,
  safeRight = 0,
  safeBottom = 0,
  safeLeft = 0,
} = {}) {
  const reserve = viewerReserve(viewportWidth, viewportHeight)
  return {
    top: Math.round(reserve.top + Math.max(0, num(safeTop))),
    right: Math.round(reserve.edge + Math.max(0, num(safeRight))),
    bottom: Math.round(reserve.foot + Math.max(0, num(safeBottom))),
    left: Math.round(reserve.edge + Math.max(0, num(safeLeft))),
  }
}

/**
 * Describe the photograph itself, so composition can respond to the frame
 * rather than to a device breakpoint alone.
 */
export function viewerAspect(imageWidth, imageHeight) {
  const w = Math.max(1, num(imageWidth, 3))
  const h = Math.max(1, num(imageHeight, 2))
  const ratio = w / h
  let name = 'square'
  if (ratio >= 1.7) name = 'wide'
  else if (ratio >= 1.25) name = 'landscape'
  else if (ratio > 1.06) name = 'near-landscape'
  else if (ratio >= 0.94) name = 'square'
  else if (ratio > 0.78) name = 'near-portrait'
  else name = 'portrait'
  return { ratio, name, portrait: ratio < 0.94, landscape: ratio > 1.06 }
}

/**
 * The whole composition, from one photograph and one viewport.
 */
export function viewerLayout({
  viewportWidth,
  viewportHeight,
  imageWidth,
  imageHeight,
  safeTop = 0,
  safeRight = 0,
  safeBottom = 0,
  safeLeft = 0,
} = {}) {
  const vw = Math.max(1, num(viewportWidth, 390))
  const vh = Math.max(1, num(viewportHeight, 844))
  const device = viewerDevice(vw, vh)
  const padding = viewerPadding({
    viewportWidth: vw,
    viewportHeight: vh,
    safeTop,
    safeRight,
    safeBottom,
    safeLeft,
  })
  const stage = {
    x: padding.left,
    y: padding.top,
    w: Math.max(1, vw - padding.left - padding.right),
    h: Math.max(1, vh - padding.top - padding.bottom),
  }
  const iw = Math.max(1, num(imageWidth, 3))
  const ih = Math.max(1, num(imageHeight, 2))
  const scale = Math.min(stage.w / iw, stage.h / ih)
  const printW = iw * scale
  const printH = ih * scale
  const print = {
    x: stage.x + Math.round((stage.w - printW) / 2),
    y: stage.y + Math.round((stage.h - printH) / 2),
    w: Math.round(printW),
    h: Math.round(printH),
  }
  const aspect = viewerAspect(iw, ih)

  /*
   * How much of the display the photograph actually claims. A frame over ~0.86
   * is effectively edge to edge, and chrome sitting on it needs to earn its
   * legibility rather than assume black underneath.
   */
  const coverage = (print.w * print.h) / (vw * vh)
  const gapLeft = print.x
  const gapRight = vw - (print.x + print.w)
  const gapTop = print.y
  const gapBelow = vh - (print.y + print.h)

  return {
    device,
    phone: device === VIEWER_PHONE,
    sideways: vh < 560 && vw > vh,
    viewport: { w: vw, h: vh },
    padding,
    stage,
    print,
    aspect,
    coverage,
    gap: { left: gapLeft, right: gapRight, top: gapTop, below: gapBelow },
    /** True when the caption band would sit on the photograph, not under it. */
    footOnPrint: gapBelow < 26,
    /** True when the close control would sit on the photograph. */
    headOnPrint: gapTop < 40 && gapLeft < 40,
    label: `${print.w}×${print.h} in ${vw}×${vh}`,
  }
}

/**
 * Contact-sheet frame height. A big monitor should show a bigger contact sheet;
 * the previous viewer used phone-sized thumbnails at 2560 and it read as a
 * scaled-up phone.
 */
export function viewerSheetHeight(device) {
  if (device === VIEWER_WALL) return 132
  if (device === VIEWER_DESKTOP) return 104
  if (device === VIEWER_TABLET) return 82
  return 62
}

/**
 * Where a print sits inside the launcher grid, expressed as a span so a wide
 * frame is allowed to be wide. Grid only — the viewer never crops.
 */
export function viewerGridSpan(imageWidth, imageHeight, columns = 3) {
  const aspect = viewerAspect(imageWidth, imageHeight)
  if (columns <= 1) return 1
  if (aspect.name === 'wide') return clamp(2, 1, columns)
  return 1
}
