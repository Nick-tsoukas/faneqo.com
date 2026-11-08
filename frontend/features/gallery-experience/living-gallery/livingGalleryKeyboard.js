/**
 * Desktop keyboard contract for the Living Gallery engine.
 *
 * Photograph surface (PhotoSwipe, while open):
 *   Escape      → close viewer
 *   ArrowLeft   → previous
 *   ArrowRight  → next
 *
 * Engine / future chrome (controller.handleKeydown):
 *   Escape      → close viewer (if an overlay is focused, hide overlay first)
 *   ArrowLeft   → previous photograph (or thumbnail selection when sheet focused)
 *   ArrowRight  → next
 *   Home / End  → first / last
 *   + / =       → zoom in
 *   -           → zoom out
 *   0           → reset zoom
 *
 * Not bound:
 *   F / F11     → browser find / browser fullscreen. Future design may assign
 *                 fullscreen to a control, not a surprising shortcut.
 *
 * PhotoSwipe remains the default owner of Escape/Arrows on the photograph
 * so we do not double-step. Overlay keydown must stopPropagation.
 */

export const LIVING_GALLERY_KEYBOARD = Object.freeze({
  close: 'Escape',
  previous: 'ArrowLeft',
  next: 'ArrowRight',
  first: 'Home',
  last: 'End',
  zoomIn: ['+', '='],
  zoomOut: ['-', '_'],
  zoomReset: '0',
  fullscreen: null,
})

export function isEditableTarget(target) {
  if (!target) return false
  const el = target.closest?.('input, textarea, select, [contenteditable="true"]')
  return Boolean(el)
}

/**
 * @param {'photo' | 'thumbnails' | 'chrome'} surface
 * @returns {boolean} true if handled
 */
export function handleLivingGalleryKeydown(event, surface, actions = {}) {
  if (!event || isEditableTarget(event.target)) return false
  const key = event.key

  if (surface === 'thumbnails') {
    return false
  }

  if (key === 'Escape') {
    if (surface === 'chrome' && actions.hideOverlays && actions.hasOverlay?.()) {
      event.preventDefault()
      actions.hideOverlays()
      return true
    }
    event.preventDefault()
    actions.close?.()
    return true
  }

  if (key === 'ArrowLeft') {
    event.preventDefault()
    actions.previous?.()
    return true
  }
  if (key === 'ArrowRight') {
    event.preventDefault()
    actions.next?.()
    return true
  }
  if (key === 'Home') {
    event.preventDefault()
    actions.goTo?.(0)
    return true
  }
  if (key === 'End') {
    event.preventDefault()
    actions.goToLast?.()
    return true
  }
  if (key === '+' || key === '=') {
    event.preventDefault()
    actions.zoomIn?.()
    return true
  }
  if (key === '-' || key === '_') {
    event.preventDefault()
    actions.zoomOut?.()
    return true
  }
  if (key === '0') {
    event.preventDefault()
    actions.resetZoom?.()
    return true
  }
  return false
}
