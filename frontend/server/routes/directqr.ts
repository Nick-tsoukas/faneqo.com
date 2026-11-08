// server/routes/directqr.ts
import {
  defineEventHandler,
  getQuery,
  setResponseStatus,
  sendRedirect,
  getRequestURL,
  setCookie,
} from 'h3'

// normalize to https://...
function toAbsoluteHttps(raw: string) {
  const s = (raw || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

export default defineEventHandler(async (event) => {
  const reqUrl = getRequestURL(event)
  const cfg = useRuntimeConfig()
  const strapiBase = cfg.public?.strapiUrl
  
  // Determine if request is arriving through a QR gateway hostname.
  // Using an explicit Set avoids accidentally matching unrelated subdomains.
  const QR_GATEWAY_HOSTS = new Set(['qr.musicbizqr.com', 'qr.faneqo.com'])
  const rawHost = event.node.req.headers.host || reqUrl.host
  const host = (typeof rawHost === 'string' ? rawHost : '').toLowerCase().replace(/:\d+$/, '')
  const isQrGateway = QR_GATEWAY_HOSTS.has(host)

  // QR gateway scans always resolve destinations on the canonical frontend (faneqo.com).
  // Direct visits to the app resolve to whatever host they arrived on.
  const targetOrigin = isQrGateway ? 'https://faneqo.com' : `${reqUrl.protocol}//${reqUrl.host}`
  
  // Debug mode: add ?debug=1 to see JSON response instead of redirect
  const queryParams = getQuery(event)
  const debugMode = queryParams.debug === '1'

  // hard fail → send to app
  if (!strapiBase) {
    return sendRedirect(event, 'https://faneqo.com', 302)
  }

  try {
    // Use custom /api/qrs/lookup endpoint that properly populates band relation
    const incoming = getQuery(event)
    const looseId = (incoming.id as string) || ''
    const bandShareSlug = (incoming.band as string) || ''

    // ── Band-profile share gateway: /directqr?band={slug} ──────────────
    // Used by the in-app Share drawer. No persisted QR record is required.
    // Keeps shares on the gateway host (PWA-scope safe) and records a scan.
    if (!looseId && bandShareSlug) {
      const slug = bandShareSlug.replace(/[^a-zA-Z0-9-_]/g, '')
      if (!slug) {
        return sendRedirect(event, targetOrigin, 302)
      }

      // Best-effort band id for analytics (does not block the redirect)
      let shareBandId: number | null = null
      try {
        const bandRes: any = await $fetch(`${strapiBase}/api/bands`, {
          query: {
            'filters[slug][$eq]': slug,
            'fields[0]': 'id',
            'pagination[pageSize]': 1,
          },
        }).catch(() => null)
        shareBandId = bandRes?.data?.[0]?.id ?? null
      } catch {
        shareBandId = null
      }

      // Best-effort scan log (non-blocking)
      try {
        const reqHeaders = event.node.req.headers || {}
        const forwardHeaders: Record<string, string> = {}
        const cfHeaderKeys = ['cf-ipcountry', 'cf-ipcity', 'cf-region', 'cf-iplatitude', 'cf-iplongitude']
        for (const key of cfHeaderKeys) {
          const val = reqHeaders[key]
          if (val && typeof val === 'string') forwardHeaders[key] = val
        }
        await $fetch(`${strapiBase}/api/scans/track`, {
          method: 'POST',
          body: {
            date: new Date().toISOString(),
            qr: null,
            band: shareBandId,
            event: null,
            entryType: 'qr',
            referrer: reqHeaders.referer || reqHeaders.referrer || null,
            userAgent: reqHeaders['user-agent'] || null,
          },
          headers: forwardHeaders,
        })
      } catch {
        // ignore analytics failure — never block the redirect
      }

      // Redirect to the band profile, preserving any incoming UTM params
      const out = new URL(`${targetOrigin}/${slug}`)
      for (const [k, v] of Object.entries(incoming)) {
        if (k.startsWith('utm_') && typeof v === 'string' && !out.searchParams.has(k)) {
          out.searchParams.set(k, v)
        }
      }
      return sendRedirect(event, out.toString(), 302)
    }

    console.log('[directqr] Looking up with custom endpoint, URL:', reqUrl.toString(), 'id:', looseId)
    
    // Use the custom lookup endpoint that bypasses Strapi permission sanitization
    const lookupRes: any = await $fetch(`${strapiBase}/api/qrs/lookup`, {
      method: 'GET',
      query: {
        url: reqUrl.toString(),
        id: looseId,
      },
    }).catch(() => null)
    
    let row = lookupRes?.data || null
    let foundBy = row ? 'custom-lookup' : null
    
    if (!row) {
      setResponseStatus(event, 404)
      return 'QR not found'
    }

    // 2) basic extract - custom lookup returns flat structure (no attributes wrapper)
    const qrId: number = row.id
    const q_type = row.q_type
    const link = row.link
    const band = row.band  // Already populated by custom endpoint
    const ev = row.event
    const arEnabled = row.arEnabled
    const template = row.template
    
    // DEBUG: Log the full row structure
    console.log('[directqr] Found by:', foundBy)
    console.log('[directqr] Found row ID:', qrId)
    console.log('[directqr] Row structure:', JSON.stringify(row, null, 2))
    console.log('[directqr] q_type:', q_type)
    console.log('[directqr] band:', JSON.stringify(band))
    
    const bandId: number | null = band?.id || null

    // 3) create scan in Strapi with rich analytics data (non-blocking-ish)
    let createdScanId: number | null = null
    const eventId: number | null = ev?.id || null
    
    // Extract UTM params from incoming request
    const utmSource = typeof incoming.utm_source === 'string' ? incoming.utm_source : null
    const utmMedium = typeof incoming.utm_medium === 'string' ? incoming.utm_medium : null
    const utmCampaign = typeof incoming.utm_campaign === 'string' ? incoming.utm_campaign : null
    const utmTerm = typeof incoming.utm_term === 'string' ? incoming.utm_term : null
    const utmContent = typeof incoming.utm_content === 'string' ? incoming.utm_content : null
    const gclid = typeof incoming.gclid === 'string' ? incoming.gclid : null
    const fbclid = typeof incoming.fbclid === 'string' ? incoming.fbclid : null
    const ttclid = typeof incoming.ttclid === 'string' ? incoming.ttclid : null
    const twclid = typeof incoming.twclid === 'string' ? incoming.twclid : null

    // Get referrer from request headers
    const reqHeaders = event.node.req.headers || {}
    const referrer = reqHeaders.referer || reqHeaders.referrer || null
    const userAgent = reqHeaders['user-agent'] || null

    try {
      const scanBody = {
        date: new Date().toISOString(),
        qr: qrId,
        band: bandId,
        event: eventId,
        entryType: 'qr',
        referrer,
        userAgent,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        gclid,
        fbclid,
        ttclid,
        twclid,
      }

      // Use the new /track endpoint which extracts CF headers server-side
      // Build headers object, only including non-empty Cloudflare headers
      const forwardHeaders: Record<string, string> = {}
      const cfHeaderKeys = ['cf-ipcountry', 'cf-ipcity', 'cf-region', 'cf-iplatitude', 'cf-iplongitude']
      for (const key of cfHeaderKeys) {
        const val = reqHeaders[key]
        if (val && typeof val === 'string') {
          forwardHeaders[key] = val
        }
      }
      
      const scanRes: any = await $fetch(`${strapiBase}/api/scans/track`, {
        method: 'POST',
        body: scanBody,
        headers: forwardHeaders,
      })
      createdScanId = scanRes?.data?.id ?? null
    } catch {
      // don't block redirect
      createdScanId = null
    }

    // 4) drop a short-lived cookie so the *next* page-view call can tie it to QR
    // keep it tiny; 10 minutes is enough
    const stamp = {
      qrId,
      bandId,
      scanId: createdScanId,
      at: Date.now(),
    }

    setCookie(event, 'mbq_qr_src', JSON.stringify(stamp), {
      httpOnly: false,          // front-end will read it
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,          // 10 minutes
    })

    // 5) AR redirect (your existing behavior)
    if (arEnabled) {
      const tmpl = template || 'test'
      const arUrl = new URL(`/ar/${qrId}`, targetOrigin)
      arUrl.searchParams.set('template', tmpl)
      return sendRedirect(event, arUrl.toString(), 302)
    }

    // 6) decide destination
    let dest = targetOrigin

    // Debug logging for QR routing issues
    console.log('[directqr] QR ID:', qrId, 'q_type:', q_type)
    console.log('[directqr] band relation:', JSON.stringify(band))

    // → band profile
    if (q_type === 'bandProfile') {
      // Handle both Strapi v4 response formats:
      // Format 1: band.data.attributes.slug (nested)
      // Format 2: band.data.slug (flattened by custom controller)
      // Format 3: band.slug (direct relation)
      let slug: string | null = null
      
      if (band?.data?.attributes?.slug) {
        slug = band.data.attributes.slug
      } else if (band?.data?.slug) {
        slug = band.data.slug
      } else if (band?.slug) {
        slug = band.slug
      }
      
      console.log('[directqr] Resolved band slug:', slug)
      
      if (slug) {
        dest = `${targetOrigin}/${slug}`
      } else {
        console.warn('[directqr] WARNING: bandProfile QR has no valid band slug! QR ID:', qrId, 'Band data:', JSON.stringify(band))
      }
    }
    // → event
    else if (q_type === 'events') {
      let slug: string | null = null
      
      if (ev?.data?.attributes?.slug) {
        slug = ev.data.attributes.slug
      } else if (ev?.data?.slug) {
        slug = ev.data.slug
      } else if (ev?.slug) {
        slug = ev.slug
      }
      
      if (slug) {
        dest = `${targetOrigin}/event/${slug}`
      }
    }
    // → external
    else if (q_type === 'externalURL' && link) {
      dest = toAbsoluteHttps(link)
    }
    // else stays on site root
    
    console.log('[directqr] Final destination:', dest)

    // 7) preserve UTMs from the incoming request (reuse incoming from above)
    const out = new URL(dest)
    for (const [k, v] of Object.entries(incoming)) {
      if (k.startsWith('utm_') && typeof v === 'string' && !out.searchParams.has(k)) {
        out.searchParams.set(k, v)
      }
    }

    // Debug mode: return JSON instead of redirect
    if (debugMode) {
      return {
        foundBy,
        qrId,
        q_type,
        band,
        link,
        resolvedSlug: band?.slug || null,
        destination: out.toString(),
        rowKeys: Object.keys(row),
      }
    }

    // 8) redirect
    return sendRedirect(event, out.toString(), 302)
  } catch (err) {
    // any unexpected error → safe redirect
    return sendRedirect(event, 'https://faneqo.com/error', 302)
  }
})
