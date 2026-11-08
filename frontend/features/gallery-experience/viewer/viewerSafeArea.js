/**
 * Safe-area insets, measured rather than assumed.
 *
 * `env(safe-area-inset-*)` cannot be read from JS, so probe for it: a fixed,
 * hidden element padded by the env values reports them back as computed pixels.
 * Carried forward from the previous viewer — it was correct.
 */
export function readSafeArea(doc = typeof document !== 'undefined' ? document : null) {
  const zero = { top: 0, right: 0, bottom: 0, left: 0 }
  if (!doc?.body) return zero
  const probe = doc.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding:env(safe-area-inset-top) env(safe-area-inset-right)'
      + ' env(safe-area-inset-bottom) env(safe-area-inset-left)',
  ].join(';')
  doc.body.appendChild(probe)
  const cs = doc.defaultView?.getComputedStyle?.(probe)
  const read = (prop) => {
    const n = parseFloat(cs?.[prop] || '0')
    return Number.isFinite(n) ? n : 0
  }
  const inset = {
    top: read('paddingTop'),
    right: read('paddingRight'),
    bottom: read('paddingBottom'),
    left: read('paddingLeft'),
  }
  probe.remove()
  return inset
}
