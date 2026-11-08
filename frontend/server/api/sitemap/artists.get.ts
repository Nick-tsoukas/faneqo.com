/**
 * Sitemap source for artist, radio and editorial profiles (B14).
 * Read by @nuxtjs/sitemap at request time, so new artists appear without a
 * deploy. Strapi decides who is listed (every public profile minus blocked
 * owners); this keeps only URLs that render that artist. Cached for an hour.
 * A Strapi outage returns an empty list so the sitemap stays valid.
 */
import { getRedirectedUrls } from '../../utils/seoRedirects'
import { artistSitemapUrls } from '~/utils/seo/artistSitemap.js'

export default defineCachedEventHandler(
  async () => {
    const config = useRuntimeConfig()
    try {
      const payload: any = await $fetch(`${config.public.strapiUrl}/api/bands/sitemap`, { timeout: 8000 })
      return artistSitemapUrls(Array.isArray(payload?.data) ? payload.data : [], {
        reserved: new Set<string>(config.sitemapReservedPaths || []),
        redirected: new Set<string>(getRedirectedUrls()),
      })
    } catch (error: any) {
      console.error('[Sitemap] Artist pages unavailable:', error?.message || error)
      return []
    }
  },
  {
    maxAge: 60 * 60,
    name: 'sitemap-artists',
    getKey: () => 'all',
    // Never cache an empty answer from an outage for an hour.
    validate: (entry) => Array.isArray(entry.value) && entry.value.length > 0,
  },
)
