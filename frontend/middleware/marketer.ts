// ~/middleware/marketer.ts
// Protects marketer-only routes - redirects non-marketers away

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side to avoid SSR issues
  if (process.server) return
  
  const user = useStrapiUser()
  const token = useStrapiToken()
  const config = useRuntimeConfig()
  
  // If not logged in, redirect to login
  if (!user.value || !token.value) {
    return navigateTo('/login')
  }
  
  // Check isMarketer - always fetch fresh from API to ensure we have the field
  let isMarketer = user.value.isMarketer
  
  // If isMarketer is undefined, fetch from API
  if (isMarketer === undefined || isMarketer === null) {
    try {
      const response = await fetch(`${config.public.strapiUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        isMarketer = userData.isMarketer
        console.log('[marketer middleware] Fetched isMarketer from API:', isMarketer)
      }
    } catch (e) {
      console.warn('[marketer middleware] Failed to fetch user data:', e)
    }
  }
  
  // If not a marketer, redirect to dashboard
  if (!isMarketer) {
    console.log('[marketer middleware] User is not a marketer, redirecting to /dashboard')
    return navigateTo('/dashboard')
  }
  
  console.log('[marketer middleware] User is a marketer, allowing access')
  // User is a marketer, allow access
})
