/**
 * Gallery viewer dismissal and gesture decisions.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE
 * ------------------------------------
 * The overview says "this was the Night." The viewer says "look at this."
 * Closing the viewer therefore returns you to the Night — it is not a
 * navigation. Every dismissal path resolves to the same state change:
 *
 *   viewer closed · photograph returned to its frame · overview scroll exact ·
 *   focus back on the photograph that opened it · same route throughout
 *
 * `navigates` is `false` on every branch and there is a test that asserts it.
 * A close that leaves the gallery page is a defect, not a variant.
 *
 * The four dismissal paths are X, browser/system Back, swipe down and Escape.
 * They differ in exactly one respect — who owns the history entry:
 *
 *   · X / Escape / swipe down  -> we still own the pushed entry, so we
 *                                 release it (pop our own entry, no further
 *                                 navigation).
 *   · Back                     -> popstate already consumed the entry, so
 *                                 releasing again would leave the gallery.
 *
 * That single asymmetry is `releasesHistoryEntry`.
 */

/** Axis lock threshold. Below this a pointer has not committed to a gesture. */
export const GALLERY_AXIS_THRESHOLD_PX = 8

/**
 * Vertical dismiss must be clearly vertical. Without this bias a diagonal
 * flick meant as paging reads as a dismiss, which feels like the viewer
 * guessing.
 */
export const GALLERY_VERTICAL_BIAS = 1.2

/** A tap that moved this far was a drag, and a drag must not also be a tap. */
export const GALLERY_TAP_SLOP_PX = 6

export const GALLERY_DOUBLE_TAP_MS = 300

export const GALLERY_DISMISS_REASONS = Object.freeze([
  'close-button',
  'escape',
  'swipe-down',
  'history-back',
])

const IGNORED = Object.freeze({
  action: 'ignore',
  closesViewer: false,
  restoresScroll: false,
  restoresFocus: false,
  returnsToFrame: false,
  releasesHistoryEntry: false,
  resetsZoom: false,
  navigates: false,
})

function layerIntent(action) {
  return Object.freeze({ ...IGNORED, action })
}

function closeIntent({ releasesHistoryEntry, returnsToFrame = true }) {
  return Object.freeze({
    action: 'close-viewer',
    closesViewer: true,
    restoresScroll: true,
    restoresFocus: true,
    returnsToFrame,
    releasesHistoryEntry,
    resetsZoom: true,
    /** A gallery dismissal never navigates. Not once, not on any path. */
    navigates: false,
  })
}

/**
 * What a dismissal request means given what is currently on top.
 *
 * Layer order for Escape is contact sheet, then share, then zoom, then the
 * viewer — you always dismiss the thing you most recently summoned.
 *
 * X is not layered. The X belongs to the photograph, so it closes the
 * photograph and tears down whatever was on top of it. Swipe down is
 * suppressed while zoomed because the finger is inspecting the frame.
 */
export function resolveDismissIntent({
  reason,
  zoomed = false,
  sheetOpen = false,
  shareOpen = false,
  hasOriginFrame = true,
} = {}) {
  if (!GALLERY_DISMISS_REASONS.includes(reason)) return IGNORED

  if (reason === 'escape') {
    if (sheetOpen) return layerIntent('close-sheet')
    if (shareOpen) return layerIntent('close-share')
    if (zoomed) return layerIntent('reset-zoom')
    return closeIntent({ releasesHistoryEntry: true, returnsToFrame: hasOriginFrame })
  }

  if (reason === 'swipe-down') {
    // Zoom owns vertical movement: panning a zoomed photograph is not a
    // dismiss, and guessing otherwise loses the reader's place.
    if (zoomed) return IGNORED
    if (sheetOpen) return IGNORED
    return closeIntent({ releasesHistoryEntry: true, returnsToFrame: hasOriginFrame })
  }

  if (reason === 'history-back') {
    // popstate already spent the entry we pushed. Releasing it again is how
    // a viewer accidentally navigates the user off the gallery.
    return closeIntent({ releasesHistoryEntry: false, returnsToFrame: hasOriginFrame })
  }

  // close-button
  return closeIntent({ releasesHistoryEntry: true, returnsToFrame: hasOriginFrame })
}

/**
 * Which axis a pointer has committed to, or `null` while still undecided.
 * A zoomed photograph has no axes — every drag is a pan.
 */
export function galleryGestureAxis(dx, dy, {
  threshold = GALLERY_AXIS_THRESHOLD_PX,
  zoomed = false,
} = {}) {
  if (zoomed) return 'pan'
  const ax = Math.abs(Number(dx) || 0)
  const ay = Math.abs(Number(dy) || 0)
  if (ax < threshold && ay < threshold) return null
  return ay > ax * GALLERY_VERTICAL_BIAS ? 'y' : 'x'
}

/**
 * Vertical release. Distance covers the deliberate pull-down; velocity covers
 * the quick flick that never travels far.
 */
export function shouldDismissVertical({
  dy,
  velocity = 0,
  zoomed = false,
  distanceThreshold = 110,
  velocityThreshold = 0.5,
} = {}) {
  if (zoomed) return false
  const travel = Number(dy) || 0
  const speed = Number(velocity) || 0
  // Downward only. Dragging a photograph up is not a dismissal.
  if (travel <= 0) return false
  return travel > distanceThreshold || speed > velocityThreshold
}

/**
 * Horizontal release. A slow short drag snaps back; a fast intentional flick
 * advances even when it barely moved.
 */
export function shouldAdvanceHorizontal({
  dx,
  velocity = 0,
  viewportWidth = 0,
  distanceRatio = 0.22,
  velocityThreshold = 0.42,
} = {}) {
  const travel = Number(dx) || 0
  const speed = Math.abs(Number(velocity) || 0)
  const width = Number(viewportWidth) || 0
  const far = width > 0 && Math.abs(travel) > width * distanceRatio
  const fast = speed > velocityThreshold
  if (!far && !fast) return 0
  if (travel === 0) return 0
  return travel < 0 ? 1 : -1
}

/**
 * Chrome only answers a deliberate, still tap. It must not flicker during a
 * drag, a pinch, a swipe or the first half of a double tap, and it stays put
 * while Share is open so the sheet never floats over a bare photograph.
 */
export function shouldToggleChrome({
  axis = null,
  moved = false,
  zoomed = false,
  shareOpen = false,
  sheetOpen = false,
  doubleTap = false,
} = {}) {
  if (shareOpen || sheetOpen) return false
  if (doubleTap) return false
  if (moved || axis) return false
  // While zoomed a single tap returns to fit; it does not summon words.
  if (zoomed) return false
  return true
}

/** A pointer that travelled this far was a drag, so no tap action fires. */
export function pointerMoved(dx, dy, slop = GALLERY_TAP_SLOP_PX) {
  return Math.abs(Number(dx) || 0) > slop || Math.abs(Number(dy) || 0) > slop
}

/**
 * Only the immediate neighbours. A viewer that preloads a whole Night is a
 * viewer that costs a fan their data plan.
 */
export function galleryPreloadWindow(index, count) {
  const total = Math.max(0, Number(count) || 0)
  const at = Number(index) || 0
  if (!total) return []
  return [at - 1, at + 1].filter((n) => n >= 0 && n < total && n !== at)
}
