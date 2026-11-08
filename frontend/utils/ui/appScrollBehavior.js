/**
 * Nuxt scrollBehavior decision.
 *
 * The previous default `{ top: 0, behavior: 'smooth' }` ran after hydration
 * and on query-only `router.replace` (Follow intent strip, payment banner).
 * That yanked a mid-scroll artist page back to the top.
 */
export function resolveAppScrollPosition(to, from, savedPosition, archiveY = 0) {
  if (savedPosition && ((savedPosition.top || 0) > 24 || archiveY <= 24)) {
    return savedPosition
  }
  if (archiveY > 0) {
    return { left: 0, top: archiveY }
  }
  if (to.hash) {
    return {
      el: to.hash,
      behavior: 'smooth',
      top: 90,
    }
  }
  const samePage = from.path === to.path
  const firstNavigation = !from.matched?.length
  if (samePage || firstNavigation) return false
  return { top: 0 }
}
