// server/routes/track/band-view.ts (or /api/track/band-view)
import {
  defineEventHandler,
  readBody,
  getRequestHeader,
  getQuery,
  setResponseStatus,
  H3Event,
  getCookie,
  setCookie,
} from 'h3'

/* -------------------------------------------------------------------------- */
/*  In-memory TTL cache for external geo lookups                              */
/* -------------------------------------------------------------------------- */
const geoCache = new Map<string, { v: any; exp: number }>()
const GEO_TTL_MS = 60_000 * 30 // 30 minutes

function cacheGet(key: string) {
  const hit = geoCache.get(key)
  if (!hit) return null
  if (Date.now() > hit.exp) {
    geoCache.delete(key)
    return null
  }
  return hit.v
}
function cacheSet(key: string, v: any) {
  geoCache.set(key, { v, exp: Date.now() + GEO_TTL_MS })
}

/* -------------------------------------------------------------------------- */
/*  IP utils                                                                  */
/* -------------------------------------------------------------------------- */
function getClientIp(event: H3Event) {
  const q = getQuery(event)
  const devIp = (q.ip as string) || (q.devIp as string) || null
  const hdr = (n: string) => (getRequestHeader(event, n) || '').trim()

  const xff = hdr('x-forwarded-for') // "client, proxy1, proxy2"
  const cf = hdr('cf-connecting-ip') // Cloudflare
  const real = hdr('x-real-ip') // nginx/other
  const sock = (event.node.req.socket as any)?.remoteAddress || ''

  let ip =
    devIp ||
    cf ||
    '' ||
    real ||
    '' ||
    (xff || '').split(',')[0]?.trim() ||
    '' ||
    sock ||
    ''

  ip = ip.replace(/^::ffff:/i, '')
  if (ip === '::1') ip = '127.0.0.1'
  return ip || '127.0.0.1'
}

function isPrivateIp(ip: string) {
  return /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip)
}

/* -------------------------------------------------------------------------- */
/*  Source / medium inference                                                 */
/* -------------------------------------------------------------------------- */
function inferSourceMedium(refDomain: string, utmSource: string, utmMedium: string) {
  let source = (utmSource || '').toLowerCase()
  let medium = (utmMedium || '').toLowerCase()

  if (!source) {
    const d = (refDomain || '').toLowerCase()
    if (!d) {
      source = ''
      medium = medium || 'direct'
    } else if (d.includes('google')) {
      source = 'google'
      medium = medium || 'search'
    } else if (d.includes('facebook')) {
      source = 'facebook'
      medium = medium || 'social'
    } else if (d.includes('instagram')) {
      source = 'instagram'
      medium = medium || 'social'
    } else if (d.includes('twitter') || d.includes('x.com') || d === 't.co') {
      source = 'twitter'
      medium = medium || 'social'
    } else if (d.includes('tiktok')) {
      source = 'tiktok'
      medium = medium || 'social'
    } else if (d.includes('bing') || d.includes('duckduckgo') || d.includes('yahoo')) {
      source = d.split('.').slice(-2).join('.')
      medium = medium || 'search'
    } else {
      source = d.split('.').slice(-2).join('.')
      medium = medium || 'referral'
    }
  }

  return {
    refSource: source || 'unknown',
    refMedium: medium || 'unknown',
  }
}

function inferSourceCategory(refSource: string, refMedium: string, refDomain: string) {
  const s = (refSource || '').toLowerCase()
  const m = (refMedium || '').toLowerCase()
  const d = (refDomain || '').toLowerCase()

  if (m === 'social') return 'social'
  if (m === 'search') return 'search'
  if (m === 'referral') return 'referral'
  if (m === 'direct') return 'direct'

  if (/(facebook|instagram|twitter|t\.co|x\.com|tiktok|snap|linkedin)/.test(s + ' ' + d)) {
    return 'social'
  }
  if (/(google|bing|duckduckgo|yahoo)/.test(s + ' ' + d)) {
    return 'search'
  }
  if (!d && !s) return 'direct'
  return 'referral'
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */
export default defineEventHandler(async (event) => {
  try {
    // 1) body from frontend
    const body = (await readBody(event)) as {
      bandId?: number | string
      path?: string
      title?: string
      url?: string
      // optional custom source from client
      sourceType?: string
      sourceQR?: number
      sourceBand?: number
      sourceLabel?: string
      qrScanId?: number
    }

    if (!body?.bandId) {
      setResponseStatus(event, 400)
      return { ok: false, error: 'Missing bandId' }
    }

    const bandId = Number(body.bandId)
    const path = body.path || ''
    const title = body.title || ''
    const ua = getRequestHeader(event, 'user-agent') || ''
    const ip = getClientIp(event)

    // 1.5) QR attribution cookie (set by /directqr)
    const qrCookieRaw = getCookie(event, 'mbq_qr_src')
    let qrMeta:
      | {
          qrId?: number
          bandId?: number
          scanId?: number
          at?: number
        }
      | null = null

    if (qrCookieRaw) {
      try {
        qrMeta = JSON.parse(qrCookieRaw)
      } catch {
        qrMeta = null
      }
    }

    // 2) URL helpers
    const safeURL = (u?: string) => {
      try {
        return u ? new URL(u) : null
      } catch {
        return null
      }
    }
    const qParams = (u?: string) => {
      const out: Record<string, string> = {}
      const url = safeURL(u)
      if (!url) return out
      url.searchParams.forEach((v, k) => (out[k] = v))
      return out
    }

    // landing & referrer
    const pageUrl = body.url || ''
    const pageU = safeURL(pageUrl)
    const landingPath = pageU?.pathname || ''
    const landingQuery = pageU?.search || ''

    const refererHeader = getRequestHeader(event, 'referer') || ''
    const refU = safeURL(refererHeader)
    const refDomain = refU?.hostname?.toLowerCase?.() || ''

    // UTMs / click IDs
    const qp = qParams(pageUrl)
    const utmSource = qp.utm_source || ''
    const utmMedium = qp.utm_medium || ''
    const utmCampaign = qp.utm_campaign || ''
    const utmTerm = qp.utm_term || ''
    const utmContent = qp.utm_content || ''
    const gclid = qp.gclid || ''
    const fbclid = qp.fbclid || ''
    const ttclid = qp.ttclid || ''
    const twclid = qp.twclid || ''

    // source inference
    const { refSource, refMedium } = inferSourceMedium(refDomain, utmSource, utmMedium)
    const sourceCategory = inferSourceCategory(refSource, refMedium, refDomain)

    // 3) geo
    const q = getQuery(event)
    let city = (q.city as string) || null
    let region = (q.region as string) || null
    let country = (q.country as string) || null
    let lat: number | null = q.lat ? Number(q.lat) : null
    let lon: number | null = q.lon ? Number(q.lon) : null

    let geoSource: 'override' | 'cloudflare' | 'geoip' | 'external' | 'none' = 'none'
    if (city || region || country || lat || lon) {
      geoSource = 'override'
    }

    // cloudflare headers
    if (geoSource === 'none') {
      const cfCity =
        getRequestHeader(event, 'cf-ipcity') || getRequestHeader(event, 'CF-IPCity')
      const cfCountry =
        getRequestHeader(event, 'cf-ipcountry') || getRequestHeader(event, 'CF-IPCountry')
      const cfRegion =
        getRequestHeader(event, 'cf-region') || getRequestHeader(event, 'CF-Region')
      const cfLat =
        getRequestHeader(event, 'cf-iplatitude') || getRequestHeader(event, 'CF-IPLatitude')
      const cfLon =
        getRequestHeader(event, 'cf-iplongitude') || getRequestHeader(event, 'CF-IPLongitude')

      if (cfCity || cfCountry || cfRegion || cfLat || cfLon) {
        city = (cfCity || city || null) as any
        region = (cfRegion || region || null) as any
        country = (cfCountry || country || null) as any
        lat = lat ?? (cfLat ? Number(cfLat) : null)
        lon = lon ?? (cfLon ? Number(cfLon) : null)
        geoSource = 'cloudflare'
      }
    }

    // geoip-lite
    if (geoSource === 'none' && !isPrivateIp(ip)) {
      try {
        const { createRequire } = await import('module')
        const require = createRequire(import.meta.url)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const geoip = require('geoip-lite')
        const loc = geoip.lookup(ip)
        if (loc) {
          city = city || loc.city || null
          region = region || loc.region || null
          country = country || loc.country || null
          if (Array.isArray(loc.ll) && loc.ll.length === 2) {
            lat = lat ?? Number(loc.ll[0])
            lon = lon ?? Number(loc.ll[1])
          }
          if (city || region || country) geoSource = 'geoip'
        }
      } catch {
        // ignore
      }
    }

    // external IP API
    if (geoSource === 'none' && !isPrivateIp(ip)) {
      const cacheKey = `ipapi:${ip}`
      let data = cacheGet(cacheKey)
      if (!data) {
        const url = `https://ipapi.co/${encodeURIComponent(ip)}/json/`
        try {
          data = await $fetch(url, { timeout: 3000 })
          cacheSet(cacheKey, data)
        } catch {
          data = null
        }
      }
      if (data) {
        city = city || data.city || null
        region = region || data.region || data.region_code || null
        country = country || data.country || data.country_name || null
        lat = lat ?? (typeof data.latitude === 'number' ? data.latitude : null)
        lon = lon ?? (typeof data.longitude === 'number' ? data.longitude : null)
        if (city || region || country) geoSource = 'external'
      }
    }

    // 4) build payload for Strapi
    const config = useRuntimeConfig()
    const STRAPI_URL =
      (config?.public as any)?.strapiUrl ||
      process.env.NUXT_PUBLIC_STRAPI_URL ||
      'http://localhost:1337'

    const nowIso = new Date().toISOString()

    const payload: any = {
      data: {
        band: bandId,
        path,
        title,
        ipAddress: ip || '',
        userAgent: ua,

        city,
        region,
        country,
        lat,
        lon,
        timestamp: nowIso,

        // landing / referrer
        pageUrl,
        landingPath,
        landingQuery,
        referrer: refererHeader,
        refDomain,

        // marketing
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        gclid,
        fbclid,
        ttclid,
        twclid,

        // inferred
        refSource,
        refMedium,
        sourceCategory,

        // client-provided fallback
        sourceType: body.sourceType || 'web',
        sourceQR: body.sourceQR ?? null,
        sourceBand: body.sourceBand ?? null,
        sourceLabel: body.sourceLabel || null,
        qrScanId: body.qrScanId ?? null,
      },
    }

    // ✅ if we have QR cookie → override to QR
    if (qrMeta?.qrId) {
      payload.data.sourceType = 'qr'
      payload.data.sourceQR = qrMeta.qrId
      if (qrMeta.bandId) {
        payload.data.sourceBand = qrMeta.bandId
      }
      if (qrMeta.scanId) {
        payload.data.qrScanId = qrMeta.scanId
      }
      payload.data.sourceLabel = `qr-${qrMeta.qrId}`
    }

    // 5) send to Strapi
    const saved = await $fetch(`${STRAPI_URL}/api/band-page-views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })

    // ❗ one-shot cookie: clear
    if (qrMeta) {
      setCookie(event, 'mbq_qr_src', '', {
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
      })
    }

    return {
      ok: true,
      ip,
      geoSource,
      geo: { city, region, country, lat, lon },
      saved,
    }
  } catch (err: any) {
    console.error('[track/band-view] ERROR:', err)
    setResponseStatus(event, 500)
    return { ok: false, error: err?.message || String(err) }
  }
})
