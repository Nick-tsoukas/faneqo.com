import { canAccessAdsStudio } from '~/utils/ads/access'

/**
 * Ads Studio is private. Anonymous visitors are left to the auth middleware.
 * Any other authenticated account gets the same stealth 404 as Labs.
 * Runs on the server and the client. A missing email is resolved from
 * /api/users/me before the decision, then denied if it still cannot be proven.
 */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.dev) return

  const user = useStrapiUser()
  const token = useStrapiToken()
  const sessionToken = useCookie('strapi_jwt')
  const bearer = token.value || sessionToken.value || ''

  if (!user.value && !bearer) return

  let email = user.value?.email || ''
  if (!email && bearer) {
    const config = useRuntimeConfig()
    const strapiUrl = String(config.public.strapiUrl || '').replace(/\/$/, '')
    try {
      const response = await fetch(`${strapiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${bearer}` },
      })
      if (response.ok) {
        const userData = await response.json()
        email = userData?.email || ''
      }
    } catch {
      email = ''
    }
  }

  if (!canAccessAdsStudio(email, import.meta.dev)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
      fatal: true,
    })
  }
})
