/**
 * GET /api/ads/artists/:slug
 *
 * Studio-authenticated artist detail. Reads the public band record and its
 * public galleries from Strapi, then returns a frozen creative snapshot with
 * media-rights tags (features/ads/studio/artistSnapshot.js).
 */
import { defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import { requireStudio, strapiBase, studioNotFound } from '~/server/utils/adsStudioAuth'
import { buildArtistSnapshot } from '~/features/ads/studio/artistSnapshot.js'
import { withDemoFallback } from '~/features/ads/studio/fixtures.js'

export default defineEventHandler(async (event) => {
  const verdict = await requireStudio(event)
  const slug = String(getRouterParam(event, 'slug') || '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-_]{0,80}$/.test(slug)) throw studioNotFound()

  const base = strapiBase()
  const cfg = useRuntimeConfig()
  const headers: Record<string, string> = verdict.jwt ? { Authorization: `Bearer ${verdict.jwt}` } : {}

  let band: any = null
  try {
    const res: any = await $fetch(`${base}/api/bands/slug/${encodeURIComponent(slug)}`, { headers, timeout: 15_000 })
    band = res?.data || null
  } catch (error: any) {
    const status = error?.statusCode || error?.response?.status
    if (status === 404) throw studioNotFound()
    throw createError({ statusCode: 502, statusMessage: 'Artist could not be loaded' })
  }
  if (!band) throw studioNotFound()

  let galleries: any = null
  try {
    const res: any = await $fetch(`${base}/api/public/bands/${encodeURIComponent(slug)}/galleries`, { headers, timeout: 10_000 })
    galleries = res?.data?.galleries || null
  } catch {
    galleries = null
  }

  const snapshot = withDemoFallback(buildArtistSnapshot(band, {
    galleries,
    baseUrl: String(cfg.public?.baseUrl || 'https://faneqo.com'),
  }))
  if (!snapshot) throw studioNotFound()

  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return { ok: true, snapshot }
})
