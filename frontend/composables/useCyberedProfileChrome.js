/**
 * Shared Cybered opening state for the mobile bottom nav.
 * BandPageCybered owns the observer. MobileBottomNav only reads `opening`.
 */
import {
  CYBERED_HERO_NAV_OBSERVE_THRESHOLDS,
  nextCyberedHeroOpening,
} from '~/utils/ui/cyberedProfileChrome'

export function useCyberedProfileChrome() {
  const opening = useState('fq-cybered-hero-opening', () => false)
  let observer = null

  function beginOpening() {
    opening.value = true
  }

  function observeHero(el) {
    stopObserver()
    if (!import.meta.client || !el || typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        opening.value = nextCyberedHeroOpening(opening.value, entry.intersectionRatio, {
          height: entry.boundingClientRect?.height,
        })
      },
      { threshold: CYBERED_HERO_NAV_OBSERVE_THRESHOLDS }
    )
    observer.observe(el)
  }

  function stopObserver() {
    observer?.disconnect()
    observer = null
  }

  function endOpening() {
    stopObserver()
    opening.value = false
  }

  return {
    opening,
    beginOpening,
    observeHero,
    endOpening,
  }
}
