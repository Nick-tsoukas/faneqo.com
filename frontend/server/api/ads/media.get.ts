/**
 * GET /api/ads/media?u=<absolute image url>
 *
 * Same-origin image proxy for the Creative Studio. The upload bucket does not
 * send CORS headers, so the browser renderer cannot read artist photos directly
 * and PNG export would fail closed. This route streams the bytes from a short
 * allowlist of hosts to the studio's allowlisted users only.
 *
 * Not the public /image-proxy (analytics-hardened, different audience).
 */
import { defineEventHandler, getQuery, setResponseHeader, send } from 'h3'
import { requireStudio, strapiBase, studioNotFound } from '~/server/utils/adsStudioAuth'

const STATIC_HOSTS = new Set([
  'qrcode101.s3.us-east-1.amazonaws.com',
  'i.scdn.co',
])
const HOST_PATTERNS = [/^image-cdn-[a-z0-9-]+\.spotifycdn\.com$/i]
const MAX_BYTES = 25 * 1024 * 1024
const ALLOWED_TYPES = /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/i

function hostAllowed(host: string) {
  if (STATIC_HOSTS.has(host)) return true
  if (HOST_PATTERNS.some((re) => re.test(host))) return true
  try {
    const strapiHost = new URL(strapiBase()).host
    if (strapiHost && host === strapiHost) return true
  } catch {
    // no strapi host
  }
  const extra = String(process.env.ADS_MEDIA_HOSTS || '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
  return extra.includes(host)
}

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const raw = String(getQuery(event).u || '')
  let target: URL
  try {
    target = new URL(raw)
  } catch {
    throw studioNotFound()
  }
  if (!/^https?:$/.test(target.protocol) || !hostAllowed(target.host.toLowerCase())) throw studioNotFound()

  const upstream = await fetch(target.toString(), { redirect: 'follow', headers: { Accept: 'image/*' } })
  if (!upstream.ok) throw createError({ statusCode: upstream.status === 404 ? 404 : 502, statusMessage: 'Image unavailable' })
  const type = upstream.headers.get('content-type') || ''
  if (!ALLOWED_TYPES.test(type.split(';')[0].trim())) throw createError({ statusCode: 415, statusMessage: 'Not an image' })
  const length = Number(upstream.headers.get('content-length') || 0)
  if (length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'Image too large' })

  const bytes = Buffer.from(await upstream.arrayBuffer())
  if (bytes.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'Image too large' })

  setResponseHeader(event, 'Content-Type', type)
  setResponseHeader(event, 'Content-Length', String(bytes.length))
  setResponseHeader(event, 'Cache-Control', 'private, max-age=3600')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  return send(event, bytes)
})
