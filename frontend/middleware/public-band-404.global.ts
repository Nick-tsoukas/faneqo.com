// Direct SSR requests to invalid artist slugs must return a real 404.
// Artist rendering remains unchanged here; the full SSR artist-page refactor is a separate phase.
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client || String(to.name || '') !== 'bandSlug') return

  const incomingSlug = String(to.params.bandSlug || '').trim().toLowerCase()
  if (!incomingSlug) {
    throw createError({ statusCode: 404, statusMessage: 'Artist not found' })
  }

  if (import.meta.dev && incomingSlug === 'faneqo-test-band') return

  const canonicalSlug = incomingSlug
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '')
  const config = useRuntimeConfig()

  async function findPublishedBand(slug: string) {
    const response: any = await $fetch(`${config.public.strapiUrl}/api/bands`, {
      query: {
        'filters[slug][$eq]': slug,
        'fields[0]': 'slug',
        'pagination[pageSize]': 1,
      },
      timeout: 5000,
    })

    return response?.data?.[0] || null
  }

  try {
    let band = await findPublishedBand(incomingSlug)

    if (!band && canonicalSlug && canonicalSlug !== incomingSlug) {
      band = await findPublishedBand(canonicalSlug)
      if (band) {
        return navigateTo(
          { path: `/${canonicalSlug}`, query: to.query },
          { redirectCode: 301, replace: true },
        )
      }
    }

    if (!band) {
      throw createError({ statusCode: 404, statusMessage: 'Artist not found' })
    }
  } catch (error: any) {
    if (Number(error?.statusCode || error?.status || error?.response?.status) === 404) {
      throw error
    }

    throw createError({
      statusCode: 503,
      statusMessage: 'Artist profile temporarily unavailable',
    })
  }
})
