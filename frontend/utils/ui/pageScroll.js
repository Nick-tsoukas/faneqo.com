/**
 * Which element actually scrolls this page.
 *
 * Faneqo's global stylesheet sets `html { height: 100% }` and
 * `body { height: 100% }`. That makes **`<body>` the scroll container**, not
 * the document — so on every route:
 *
 *   · `window.scrollY` is permanently 0
 *   · `window.scrollTo()` does nothing
 *   · `window` never receives a scroll event
 *
 * Anything that saved and restored a scroll position through `window` was
 * therefore saving 0 and restoring 0: a silent no-op that looks like working
 * code. An overlay that closes and drops the fan back at the top of a long
 * Night is the most expensive version of that bug, because the fan loses their
 * place in the one thing they came to look at.
 *
 * These helpers ask the document which element scrolls instead of assuming.
 * They work unchanged if the global `height: 100%` is ever removed.
 */

function canUseDom() {
  return typeof document !== 'undefined' && typeof window !== 'undefined'
}

/**
 * The scrolling element: whichever of `<html>` / `<body>` actually has
 * overflowing content. Content overflow is the honest test — it stays correct
 * while a scroll lock has `overflow: hidden` applied, which is exactly when we
 * need to read and restore a position.
 */
export function pageScrollElement() {
  if (!canUseDom()) return null
  const doc = document.documentElement
  const body = document.body
  if (doc && doc.scrollHeight > doc.clientHeight + 1) return doc
  if (body && body.scrollHeight > body.clientHeight + 1) return body
  return document.scrollingElement || doc || body
}

export function pageScrollTop() {
  if (!canUseDom()) return 0
  const el = pageScrollElement()
  // `window.scrollY` is still the right answer when the document scrolls.
  if (!el || el === document.documentElement) return window.scrollY || el?.scrollTop || 0
  return el.scrollTop || 0
}

export function setPageScrollTop(top, { smooth = false } = {}) {
  if (!canUseDom()) return
  const y = Math.max(0, Number(top) || 0)
  const el = pageScrollElement()
  const behavior = smooth ? 'smooth' : 'auto'
  if (!el || el === document.documentElement) {
    window.scrollTo({ top: y, behavior })
    return
  }
  if (typeof el.scrollTo === 'function') el.scrollTo({ top: y, behavior })
  else el.scrollTop = y
}

/**
 * Subscribe to page scroll. A scrolling `<body>` fires its scroll event on
 * itself and it does not reach `window`, so the listener has to go on the
 * element that scrolls. Returns an unsubscribe function.
 */
export function onPageScroll(handler, options = { passive: true }) {
  if (!canUseDom() || typeof handler !== 'function') return () => {}
  const el = pageScrollElement()
  const target = !el || el === document.documentElement ? window : el
  target.addEventListener('scroll', handler, options)
  return () => target.removeEventListener('scroll', handler, options)
}
