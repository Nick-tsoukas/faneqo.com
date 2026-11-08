/**
 * GET /api/ads/artists?q=&start=&limit=
 *
 * Studio-authenticated artist catalog for the picker.
 *   q (≥ 2 chars)  → Strapi public search (/api/bands/search)
 *   otherwise      → private paged browse (/api/creatives/artists) when the
 *                    backend exposes it, else the public list paged here.
 * Returns light rows only: { id, name, slug, genre, imageUrl, bio }.
 */
import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { requireStudio, strapiBase } from '~/server/utils/adsStudioAuth'

type Row = { id: number; name: string; slug: string; genre: string | null; imageUrl: string | null; bio: string | null; updatedAt?: string | null }

let browseCache: { expires: number; rows: Row[] } | null = null
const BROWSE_CACHE_MS = 60_000

function clampInt(raw: unknown, fallback: number, max: number) {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0) return fallback
  return Math.min(n, max)
}

function pickRow(band: any): Row | null {
  const source = band?.attributes ? { id: band.id, ...band.attributes } : band
  if (!source?.slug || !source?.name) return null
  const img = source.bandImg?.data?.attributes || source.bandImg || null
  const thumb = img?.formats?.small?.url || img?.formats?.thumbnail?.url || img?.url || source.imageUrl || null
  return {
    id: source.id,
    name: String(source.name).trim(),
    slug: String(source.slug),
    genre: source.genre ? String(source.genre).split(',')[0].trim() : null,
    imageUrl: thumb,
    bio: source.bio ? String(source.bio).slice(0, 140) : null,
    updatedAt: source.updatedAt || null,
  }
}

export default defineEventHandler(async (event) => {
  const verdict = await requireStudio(event)
  const base = strapiBase()
  const query = getQuery(event)
  const q = String(query.q || '').trim()
  const start = clampInt(query.start, 0, 10_000)
  const limit = clampInt(query.limit, 24, 50) || 24
  const headers: Record<string, string> = verdict.jwt ? { Authorization: `Bearer ${verdict.jwt}` } : {}

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  if (q.length >= 2) {
    const res: any = await $fetch(`${base}/api/bands/search`, { query: { q, limit: 50 }, headers, timeout: 10_000 })
    const rows = (res?.data || []).map(pickRow).filter(Boolean) as Row[]
    return { ok: true, mode: 'search', q, rows, total: rows.length, start: 0, limit: rows.length }
  }

  // Private paged browse (backend creative API). 404 means not deployed yet.
  if (verdict.jwt) {
    try {
      const res: any = await $fetch(`${base}/api/creatives/artists`, { query: { start, limit }, headers, timeout: 10_000 })
      if (Array.isArray(res?.rows)) {
        return { ok: true, mode: 'browse', rows: res.rows.map(pickRow).filter(Boolean), total: Number(res.total) || res.rows.length, start, limit }
      }
    } catch {
      // fall through to the public list
    }
  }

  const now = Date.now()
  if (!browseCache || browseCache.expires < now) {
    const res: any = await $fetch(`${base}/api/bands`, { headers, timeout: 20_000 })
    const rows = ((res?.data || []) as any[]).map(pickRow).filter(Boolean) as Row[]
    rows.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || a.name.localeCompare(b.name))
    browseCache = { expires: now + BROWSE_CACHE_MS, rows }
  }
  const rows = browseCache.rows.slice(start, start + limit)
  return { ok: true, mode: 'browse-public', rows, total: browseCache.rows.length, start, limit }
})
