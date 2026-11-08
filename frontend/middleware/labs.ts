/**
 * /labs is private. Unenrolled authenticated users get a real 404.
 * Unauthenticated users follow existing auth middleware (redirect home).
 * Frontend hiding is not authorization — Strapi still 404s the API.
 */
export default defineNuxtRouteMiddleware(async () => {
  const user = useStrapiUser()
  if (!user.value) return

  const { hasLabs } = useLabsFeatures()
  let allowed = false
  try {
    allowed = await hasLabs()
  } catch {
    allowed = false
  }

  if (!allowed) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
      fatal: true,
    })
  }
})
