import { isFanAppAuthPath } from '~/utils/ui/appSurface'
import { fanLoginLocation } from '~/utils/fan/safeFanReturnTo'

/**
 * One Fan App auth boundary.
 *
 * /fan, /fan/messages, /fan/passport, /fan/profile (and nested app routes)
 * require a session before the fan app renders. /fan/login and /fan/verify
 * stay outside. Generic middleware/auth.ts is not used — it sends people to /.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!isFanAppAuthPath(to.path)) return

  const user = useStrapiUser()
  if (user.value) return

  const token = useStrapiToken()
  if (token.value) {
    try {
      const { fetchUser } = useStrapiAuth()
      await fetchUser()
    } catch {
      // Expired or invalid token — treat as logged out below.
    }
    if (useStrapiUser().value) return
  }

  return navigateTo(fanLoginLocation(to.fullPath), { replace: true })
})
