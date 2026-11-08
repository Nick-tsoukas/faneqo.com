/**
 * Named overlay scroll lock. First lock saves scrollY; last unlock restores it.
 * Nested viewers (gallery overlay + lightbox) share one page lock.
 *
 * The position is read and written through `pageScroll.js` rather than
 * `window`, because Faneqo's global `body { height: 100% }` makes `<body>` the
 * scroll container. Reading `window.scrollY` here always returned 0, so every
 * overlay that used this lock was restoring the top of the page instead of the
 * fan's place in it.
 */
import { pageScrollTop, setPageScrollTop } from './pageScroll.js'

const locks = new Set()
let savedY = 0

function canUseDom() {
  return typeof document !== 'undefined' && typeof window !== 'undefined'
}

export function lockOverlayScroll(id) {
  if (!canUseDom()) return
  const key = String(id || 'overlay')
  if (locks.has(key)) return
  const first = locks.size === 0
  locks.add(key)
  if (!first) return
  savedY = pageScrollTop()
  document.documentElement.dataset.fqOverlayLock = '1'
  document.body.dataset.fqOverlayLock = '1'
  document.body.dataset.fqOverlayLockY = String(savedY)
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
}

export function unlockOverlayScroll(id) {
  if (!canUseDom()) return
  const key = String(id || 'overlay')
  // Overlays release on unmount and through `immediate` close watchers, so
  // unlock runs constantly for overlays that were never opened. Restoring a
  // position that was never saved scrolls the page to 0 under the fan.
  if (!locks.has(key)) return
  locks.delete(key)
  if (locks.size) return
  const y = Number(document.body.dataset.fqOverlayLockY || savedY || 0)
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  delete document.documentElement.dataset.fqOverlayLock
  delete document.body.dataset.fqOverlayLock
  delete document.body.dataset.fqOverlayLockY
  setPageScrollTop(y)
}

export function overlayScrollLockCount() {
  return locks.size
}

export function resetOverlayScrollLockForTests() {
  locks.clear()
  savedY = 0
}
