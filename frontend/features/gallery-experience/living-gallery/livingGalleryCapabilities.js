/**
 * Capability flags for Living Gallery.
 * Presentation does not live here. Future UI decides how to render these.
 */

export function isStandaloneDisplay(win = typeof window !== 'undefined' ? window : null) {
  if (!win) return false
  try {
    if (win.navigator?.standalone === true) return true
    return Boolean(win.matchMedia?.('(display-mode: standalone)')?.matches)
  } catch {
    return false
  }
}

export function isTouchEnvironment(win = typeof window !== 'undefined' ? window : null) {
  if (!win) return false
  try {
    if (win.matchMedia?.('(pointer: coarse)')?.matches) return true
    return Number(win.navigator?.maxTouchPoints) > 0
  } catch {
    return false
  }
}

export function deriveLivingGalleryCapabilities(state = {}, env = {}) {
  const total = Math.max(0, Number(state.total) || 0)
  const index = Math.max(0, Number(state.activeIndex) || 0)
  const open = Boolean(state.open)
  const zoom = state.zoom && typeof state.zoom === 'object' ? state.zoom : {}
  const isZoomed = Boolean(zoom.isZoomed)
  const canZoom = open && Boolean(zoom.canZoom ?? ((Number(zoom.max) || 1) > (Number(zoom.initial) || 1) + 0.04))
  const standalone = env.isStandalone === true
  return {
    canPrevious: open && index > 0,
    canNext: open && total > 0 && index < total - 1,
    canZoom,
    canPan: open && isZoomed,
    canFullscreen: open && env.canFullscreen === true && !standalone,
    canShare: open && total > 0,
    canUseNativeShare: Boolean(env.canUseNativeShare),
    canShowThumbnails: open && total > 1,
    isZoomed,
    isFullscreen: Boolean(state.isFullscreen),
    isTouch: Boolean(env.isTouch),
    reducedMotion: Boolean(env.reducedMotion),
    isStandalone: standalone,
  }
}
