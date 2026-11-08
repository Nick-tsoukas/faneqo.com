// server/api/me/dashboard.get.js
import { defineEventHandler, getCookie, getHeader, setResponseHeader } from 'h3'

// build absolute URL if Strapi returns relative paths
const ABS = (base, url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${base.replace(/\/+$/, '')}/${String(url).replace(/^\/+/, '')}`
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  // Strapi base (private, then public, then env)
  const strapiBase = (cfg.strapiURL || cfg.public?.strapiURL || process.env.STRAPI_URL || '').replace(/\/+$/, '')
  if (!strapiBase) {
    return { ok: false, status: 500, reason: 'STRAPI_URL missing' }
  }

  // ⚠️ Auth: grab the same cookie the Strapi Nuxt module uses
  // Try several common names to be safe.
  const cookieJwt =
    getCookie(event, 'strapi_jwt') ||
    getCookie(event, 'jwt') ||
    getCookie(event, 'token') ||
    null

  // Also allow Authorization header if present (e.g., from client-side fetch)
  const headerJwt = (getHeader(event, 'authorization') || '').replace(/^Bearer\s+/i, '')
  const jwt = headerJwt || cookieJwt

  if (!jwt) {
    return { ok: false, status: 401, reason: 'unauthenticated' }
  }

  const authHeaders = { Authorization: `Bearer ${jwt}` }

  try {
    // IMPORTANT:
    // - Your Stripe helpers (/stripe/...) live on YOUR Nuxt server, not Strapi.
    //   So call them as relative paths.
    // - Your content (qrs/bands/events) lives on Strapi → call strapiBase/api/...
    const [billing, subscription, qrs, bands, events] = await Promise.all([
      // your internal Nuxt server routes
      $fetch('/stripe/billing',            { headers: authHeaders }).catch(() => null),
      $fetch('/stripe/subscription-status',{ headers: authHeaders }).catch(() => null),

      // Strapi content (current user)
      $fetch(`${strapiBase}/api/qrs`, {
        headers: authHeaders,
        query: {
          'filters[users_permissions_user][id][$eq]': 'me',
          'fields[0]': 'name',
          'fields[1]': 'url',
          'fields[2]': 'options',
          'populate[q_image][fields][0]': 'url',
          'populate[q_image][fields][1]': 'formats',
          'sort[0]': 'updatedAt:desc',
          'pagination[pageSize]': 50
        }
      }),
      $fetch(`${strapiBase}/api/bands`, {
        headers: authHeaders,
        query: {
          'filters[users_permissions_user][id][$eq]': 'me',
          'fields[0]': 'name',
          'fields[1]': 'slug',
          'populate[bandImg][fields][0]': 'url',
          'populate[bandImg][fields][1]': 'formats',
          'sort[0]': 'updatedAt:desc',
          'pagination[pageSize]': 50
        }
      }),
      $fetch(`${strapiBase}/api/events`, {
        headers: authHeaders,
        query: {
          'filters[users_permissions_user][id][$eq]': 'me',
          'fields[0]': 'title',
          'fields[1]': 'slug',
          'populate[image][fields][0]': 'url',
          'populate[image][fields][1]': 'formats',
          'populate[band][fields][0]': 'slug',
          'sort[0]': 'updatedAt:desc',
          'pagination[pageSize]': 50
        }
      })
    ])

    // Base for absolute images if Strapi returns relative URLs.
    // If your media are already absolute (S3), this is only a fallback.
    const publicBase = (cfg.public?.baseUrl || 'https://musicbizqr.com').replace(/\/+$/, '')

    const qrItems = (qrs?.data || []).map((row) => {
      const a = row.attributes || {}
      const img = a.q_image?.data?.attributes || {}
      const fm  = img.formats || {}
      const thumb = fm.thumbnail?.url || fm.small?.url || img.url || ''
      return {
        id: row.id,
        title: a.name || `QR #${row.id}`,
        imageUrl: ABS(publicBase, thumb),
        raw: row
      }
    })

    const bandItems = (bands?.data || []).map((row) => {
      const a = row.attributes || {}
      const img = a.bandImg || {}
      const fm  = img.formats || {}
      const thumb = fm.thumbnail?.url || fm.small?.url || img.url || ''
      return {
        id: row.id,
        title: a.name,
        slug: a.slug,
        imageUrl: ABS(publicBase, thumb)
      }
    })

    const eventItems = (events?.data || []).map((row) => {
      const a = row.attributes || {}
      const img = a.image?.data?.attributes || {}
      const fm  = img.formats || {}
      const thumb = fm.thumbnail?.url || fm.small?.url || img.url || ''
      return {
        id: row.id,
        title: a.title,
        slug: a.slug,
        bandSlug: a.band?.data?.attributes?.slug || null,
        imageUrl: ABS(publicBase, thumb)
      }
    })

    // light private cache for smoother UX
    setResponseHeader(event, 'Cache-Control', 'private, max-age=15')

    return {
      ok: true,
      billing: billing || null,
      subscription: subscription || null,
      qrItems,
      bandItems,
      eventItems
    }
  } catch (err) {
    return {
      ok: false,
      status: 500,
      reason: 'dashboard_fetch_failed',
      detail: (err && err.message) || String(err)
    }
  }
})
