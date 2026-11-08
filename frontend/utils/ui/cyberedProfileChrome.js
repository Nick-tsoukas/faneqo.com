/**
 * Cybered public-profile chrome: when the opening hero owns the viewport,
 * the mobile bottom nav stays hidden. Pure hysteresis — no timers.
 */

/** Hero still filling the opening → keep nav hidden. */
export const CYBERED_HERO_NAV_HIDE_RATIO = 0.7

/** Hero has receded into content → show nav. */
export const CYBERED_HERO_NAV_SHOW_RATIO = 0.45

export const CYBERED_HERO_NAV_OBSERVE_THRESHOLDS = [0, 0.25, 0.45, 0.55, 0.7, 0.85, 1]

/**
 * @param {boolean} currentlyOpening
 * @param {number} intersectionRatio
 * @returns {boolean} whether the hero opening is still active
 */
export function nextCyberedHeroOpening(currentlyOpening, intersectionRatio, extra = {}) {
  const ratio = Number(intersectionRatio)
  if (!Number.isFinite(ratio)) return currentlyOpening
  if (extra.height === 0) return currentlyOpening
  if (ratio >= CYBERED_HERO_NAV_HIDE_RATIO) return true
  if (ratio <= CYBERED_HERO_NAV_SHOW_RATIO) return false
  return currentlyOpening
}
