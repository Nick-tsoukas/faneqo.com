export function prefersReducedMotion(media = globalThis.matchMedia) {
  if (typeof media !== 'function') return false
  try {
    return Boolean(media.call(globalThis, '(prefers-reduced-motion: reduce)')?.matches)
  } catch {
    return false
  }
}
