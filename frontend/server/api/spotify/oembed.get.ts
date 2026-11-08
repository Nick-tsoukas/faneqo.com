import { defineEventHandler, getQuery, createError } from 'h3'

// Simple in-memory cache with 24h TTL
const cache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCached(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: any) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS })
}

// Extract and sanitize iframe from oEmbed HTML
function sanitizeSpotifyIframe(html: string): string {
  if (!html) return ''
  
  // Extract only the iframe tag
  const iframeMatch = html.match(/<iframe[\s\S]*?<\/iframe>/i)
  if (!iframeMatch) return ''
  
  let iframe = iframeMatch[0]
  
  // Remove any existing style attribute and add our safe one
  iframe = iframe.replace(/\s+style\s*=\s*["'][^"']*["']/gi, '')
  
  // Remove any existing width/height attributes
  iframe = iframe.replace(/\s+width\s*=\s*["'][^"']*["']/gi, '')
  iframe = iframe.replace(/\s+height\s*=\s*["'][^"']*["']/gi, '')
  
  // Add safe attributes
  iframe = iframe.replace(
    /<iframe/i,
    '<iframe style="width:100%;height:100%;border:none;border-radius:12px;" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"'
  )
  
  return iframe
}

// Infer Spotify content type from URL
function inferSpotifyType(url: string): 'track' | 'album' | 'playlist' | 'artist' | null {
  if (/\/track\//i.test(url)) return 'track'
  if (/\/album\//i.test(url)) return 'album'
  if (/\/playlist\//i.test(url)) return 'playlist'
  if (/\/artist\//i.test(url)) return 'artist'
  return null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  // Validate URL
  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing url parameter'
    })
  }

  // Must be a Spotify URL
  if (!url.startsWith('https://open.spotify.com/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL must be a Spotify link (https://open.spotify.com/...)'
    })
  }

  // Must be one of the supported types
  const type = inferSpotifyType(url)
  if (!type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL must be a Spotify track, album, playlist, or artist link'
    })
  }

  // Check cache
  const cached = getCached(url)
  if (cached) {
    return cached
  }

  try {
    // Call Spotify oEmbed API
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Spotify oEmbed returned ${response.status}`
      })
    }

    const oembed = await response.json()

    // Sanitize the iframe HTML
    const sanitizedHtml = sanitizeSpotifyIframe(oembed.html || '')

    const result = {
      ok: true,
      spotifyUrl: url,
      type,
      title: oembed.title || '',
      thumbnailUrl: oembed.thumbnail_url || '',
      html: sanitizedHtml
    }

    // Cache the result
    setCache(url, result)

    return result
  } catch (err: any) {
    // If it's already an H3 error, rethrow
    if (err.statusCode) throw err

    console.error('[spotify/oembed] Error fetching oEmbed:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch Spotify oEmbed data'
    })
  }
})
