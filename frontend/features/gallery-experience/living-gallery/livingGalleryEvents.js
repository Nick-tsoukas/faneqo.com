/**
 * Semantic Living Gallery events.
 * Future product analytics may subscribe. Do not couple to PhotoSwipe names.
 */

export const LIVING_GALLERY_EVENT = Object.freeze({
  OPEN: 'gallery_open',
  CLOSE: 'gallery_close',
  PHOTO_CHANGE: 'photo_change',
  PHOTO_ZOOM: 'photo_zoom',
  THUMBNAIL_OPEN: 'thumbnail_open',
  THUMBNAIL_CLOSE: 'thumbnail_close',
  PHOTO_SHARE: 'photo_share',
  GALLERY_SHARE: 'gallery_share',
  FULLSCREEN_ENTER: 'fullscreen_enter',
  FULLSCREEN_EXIT: 'fullscreen_exit',
  CHROME_CHANGE: 'chrome_change',
  INFO_CHANGE: 'info_change',
})

export function createEmitter() {
  const listeners = new Set()

  function subscribe(fn) {
    if (typeof fn !== 'function') return () => {}
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  function emit(name, payload) {
    for (const fn of listeners) fn(name, payload)
  }

  function clear() {
    listeners.clear()
  }

  return { subscribe, emit, clear }
}
