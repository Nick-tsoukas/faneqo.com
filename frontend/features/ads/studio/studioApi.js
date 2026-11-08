/**
 * Browser-side calls to the studio's own Nitro routes. The routes hold the
 * session check and talk to Strapi; nothing privileged reaches the browser.
 */
import { DEMO_SLUG, demoBadflowerSnapshot } from './fixtures.js'

export async function searchArtists({ q = '', start = 0, limit = 24 } = {}) {
  const res = await $fetch('/api/ads/artists', { query: { q, start, limit }, timeout: 15_000 })
  return { rows: res?.rows || [], total: Number(res?.total) || 0, mode: res?.mode || 'browse' }
}

export async function loadArtistSnapshot(slug) {
  if (slug === DEMO_SLUG) return demoBadflowerSnapshot()
  const res = await $fetch(`/api/ads/artists/${encodeURIComponent(slug)}`, { timeout: 20_000 })
  if (!res?.snapshot) throw new Error('That artist could not be loaded.')
  return res.snapshot
}

export const DEMO_ARTIST_ROW = {
  id: null,
  slug: DEMO_SLUG,
  name: 'Badflower',
  genre: 'Alternative Rock',
  imageUrl: '/images/ads/badflower/josh.jpg',
  bio: 'Studio demo artist assembled from files already in the repo. Rights are tagged per photo.',
  demo: true,
}
