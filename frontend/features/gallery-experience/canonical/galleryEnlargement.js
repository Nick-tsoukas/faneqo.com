/**
 * Gallery image sizing — the enlargement rule.
 *
 * `contain` always. The photograph is never cropped to fill a viewport.
 *
 * PhotoSwipe's own `fit` level is hard-capped at 1x — see
 * `node_modules/photoswipe/src/js/slide/zoom-level.js`:
 *
 *   this.fit = Math.min(1, hRatio < vRatio ? hRatio : vRatio)
 *
 * That cap renders a 1024px source as a small print marooned in the middle of
 * a 1920px stage. It is not restraint, it is a viewer refusing to use the
 * screen it was given.
 *
 * So we uncap `contain` and then cap *enlargement* by device pixel density
 * rather than by a flat multiplier. Softness is a function of source pixels
 * per device pixel, so the ceiling has to know what it is drawing on:
 *
 *   cap = clamp(GALLERY_ENLARGE_BUDGET / dpr, 1, GALLERY_ENLARGE_BUDGET)
 *
 *   dpr 1  (most desktop monitors)  -> 2.4x
 *   dpr 2  (retina laptop)          -> 1.2x
 *   dpr 3  (modern phone)           -> 1.0x
 *
 * Enlargement only engages when the *best available source* is already
 * smaller than the stage in CSS pixels, so on a 3x phone it effectively never
 * fires: a 1024px source overflows a 390px stage many times over. It fires on
 * large low-density displays, which is exactly where the old 1x block looked
 * broken.
 *
 * Never 1x for its own sake, never unlimited. A 320px source on a 1x 1920
 * display lands at 768px: visibly soft, honestly soft, and not dominating.
 * Always ask for the largest responsive source first — enlarging is the last
 * resort, not the first.
 */

/** Ceiling on visual enlargement at dpr 1. Also the double-tap factor. */
export const GALLERY_ENLARGE_BUDGET = 2.4

/** Absolute pinch ceiling, so a deliberate inspect gesture still has a floor. */
export const GALLERY_ZOOM_HARD_MAX = 4

function positive(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

export function clampDevicePixelRatio(dpr) {
  const value = positive(dpr) || 1
  return Math.min(Math.max(value, 1), 3)
}

/**
 * How far past 1:1 this display is allowed to stretch a photograph.
 * Denser displays get a tighter budget because each CSS pixel costs more
 * source pixels to stay sharp.
 */
export function galleryEnlargementCap(dpr) {
  const density = clampDevicePixelRatio(dpr)
  const cap = GALLERY_ENLARGE_BUDGET / density
  return Math.min(Math.max(cap, 1), GALLERY_ENLARGE_BUDGET)
}

/**
 * The uncapped `contain` ratio: what scale makes the whole photograph fit.
 * Larger than 1 means the source is smaller than the stage.
 */
export function galleryContainRatio({ sourceWidth, sourceHeight, stageWidth, stageHeight } = {}) {
  const sw = positive(sourceWidth)
  const sh = positive(sourceHeight)
  const aw = positive(stageWidth)
  const ah = positive(stageHeight)
  if (!sw || !sh || !aw || !ah) return 0
  return Math.min(aw / sw, ah / sh)
}

/**
 * Final displayed geometry for one photograph on one stage.
 * Aspect ratio is preserved unconditionally; cropping is never an option.
 */
export function galleryContainScale({
  sourceWidth,
  sourceHeight,
  stageWidth,
  stageHeight,
  dpr = 1,
} = {}) {
  const ratio = galleryContainRatio({ sourceWidth, sourceHeight, stageWidth, stageHeight })
  if (!ratio) {
    return { scale: 1, width: 0, height: 0, enlarged: false, capped: false, cap: galleryEnlargementCap(dpr) }
  }
  const cap = galleryEnlargementCap(dpr)
  const scale = Math.min(ratio, cap)
  return {
    scale,
    width: Math.round(positive(sourceWidth) * scale),
    height: Math.round(positive(sourceHeight) * scale),
    enlarged: scale > 1,
    capped: ratio > cap,
    cap,
  }
}

function zoomLevelContainRatio(zoomLevel) {
  const pan = zoomLevel?.panAreaSize
  const element = zoomLevel?.elementSize
  const ratio = galleryContainRatio({
    sourceWidth: element?.x,
    sourceHeight: element?.y,
    stageWidth: pan?.x,
    stageHeight: pan?.y,
  })
  // PhotoSwipe's own capped `fit` is the only honest fallback before measure.
  return ratio || positive(zoomLevel?.fit) || 1
}

/**
 * PhotoSwipe `initialZoomLevel`. Uncapped contain, then the density budget.
 */
export function galleryInitialZoomLevel(zoomLevel, { dpr = 1 } = {}) {
  return Math.min(zoomLevelContainRatio(zoomLevel), galleryEnlargementCap(dpr))
}

/**
 * PhotoSwipe `secondaryZoomLevel` — the double tap.
 *
 * 2.4x magnification of the fitted view, but never beyond 2.4x native. A
 * photograph that was already enlarged to the cap therefore does not zoom
 * further on double tap: there is nothing left in the file to reveal.
 */
export function gallerySecondaryZoomLevel(zoomLevel, { dpr = 1 } = {}) {
  const initial = galleryInitialZoomLevel(zoomLevel, { dpr })
  return Math.min(initial * GALLERY_ENLARGE_BUDGET, GALLERY_ENLARGE_BUDGET)
}

/** PhotoSwipe `maxZoomLevel`. Pinch is deliberate, so it gets real headroom. */
export function galleryMaxZoomLevel(zoomLevel, { dpr = 1 } = {}) {
  const initial = galleryInitialZoomLevel(zoomLevel, { dpr })
  const secondary = gallerySecondaryZoomLevel(zoomLevel, { dpr })
  const headroom = Math.min(GALLERY_ZOOM_HARD_MAX, Math.max(1, initial * 4))
  return Math.max(secondary, headroom)
}

/**
 * The stage: the rectangle a photograph is allowed to occupy.
 *
 * A phone bleeds to the glass because there is no room to spare; a monitor
 * keeps a margin so the print has air. The foot reserve is what keeps the
 * caption and `current / total` off the photograph rather than on top of it,
 * which is why chrome needs no scrim.
 */
export function galleryStageReserves(viewportWidth, viewportHeight) {
  const w = positive(viewportWidth)
  const h = positive(viewportHeight)
  if (w >= 2100) return { edge: 56, top: 50, foot: 104 }
  if (w >= 1024) return { edge: 36, top: 34, foot: 84 }
  if (w >= 640) return { edge: 24, top: 24, foot: 66 }
  // Landscape phone: almost no vertical room, so the reserves shrink with it.
  if (h && h < 560 && w > h) return { edge: 0, top: 8, foot: 38 }
  return { edge: 0, top: 10, foot: 52 }
}

/**
 * Target CSS width to request a responsive source for, before any enlargement.
 * Asking for the stage width (not the source width) is what keeps us from
 * enlarging a small derivative when a larger one exists.
 */
export function galleryStageSourceTarget({ stageWidth, stageHeight, aspectRatio } = {}) {
  const aw = positive(stageWidth)
  const ah = positive(stageHeight)
  const ratio = positive(aspectRatio)
  if (!aw) return 0
  if (!ah || !ratio) return Math.round(aw)
  // The photograph is height-bound when it is taller than the stage allows.
  return Math.round(Math.min(aw, ah * ratio))
}
