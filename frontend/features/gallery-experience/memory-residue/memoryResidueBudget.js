/**
 * Memory Residue effect budget.
 * Fast browsing always wins. Never queue. Never stall PhotoSwipe.
 */

export const RESIDUE_INTENT_NEXT = 'next'
export const RESIDUE_INTENT_CLOSE = 'close'
export const RESIDUE_INTENT_OPEN = 'open'

const FAST_VELOCITY = 2.8
const FAST_INTERVAL_MS = 220
const SLOW_VELOCITY = 0.55
const SLOW_INTERVAL_MS = 700

export function resolveResidueBudget({
  velocity = 0,
  intervalMs = 9999,
  reduced = false,
  enabled = true,
  intent = RESIDUE_INTENT_NEXT,
} = {}) {
  if (reduced) return { play: false, scale: 0, reason: 'reduced-motion' }
  if (!enabled) return { play: false, scale: 0, reason: 'off' }

  const absV = Math.abs(Number(velocity) || 0)
  const gap = Math.max(0, Number(intervalMs) || 0)
  const rapid = absV > FAST_VELOCITY || gap < FAST_INTERVAL_MS
  const slow = absV < SLOW_VELOCITY && gap > SLOW_INTERVAL_MS

  if (rapid) return { play: false, scale: 0, reason: 'fast-nav' }
  if (intent === RESIDUE_INTENT_OPEN) {
    return { play: true, scale: 0.78, reason: 'open' }
  }
  if (intent === RESIDUE_INTENT_CLOSE) {
    return { play: true, scale: slow ? 0.72 : 0.48, reason: 'close' }
  }
  if (slow) return { play: true, scale: 1, reason: 'deliberate' }
  return { play: true, scale: 0.42, reason: 'normal-swipe' }
}

export function scaleResidueParams(params = {}, scale = 1) {
  const s = Math.max(0, Math.min(1, Number(scale) || 0))
  return {
    ...params,
    durationMs: Math.max(260, Math.round((Number(params.durationMs) || 1200) * s)),
    persistence: (Number(params.persistence) || 0.42) * (0.52 + 0.48 * s),
    displace: (Number(params.displace) || 0) * s,
    noise: (Number(params.noise) || 0) * (0.45 + 0.55 * s),
  }
}
