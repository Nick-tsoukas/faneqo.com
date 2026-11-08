export default defineNuxtRouteMiddleware((to) => {
  const user = useStrapiUser()
  
  // Allow access if there's a token in query params (email confirmation flow)
  // The page will handle setting the token and fetching the user
  if (to.query.token) {
    return
  }
  
  // Local Ads Studio can be opened without a session. Production still requires auth.
  const adsPath = to.path === '/ads' || to.path.startsWith('/ads/')
  if (import.meta.dev && adsPath) return

  // If user is not authenticated, redirect to home page
  if (!user.value) {
    return navigateTo('/')
  }
})
