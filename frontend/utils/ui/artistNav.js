/**
 * Artist workspace bottom-nav active-tab rules.
 * Segment-bounded so a slug cannot steal /dashboard, /messages, or /analytics.
 */

export const ARTIST_NAV_TABS = ['dashboard', 'messages', 'artist', 'analytics']

function normalizePath(path) {
  return String(path || '').split('?')[0]
}

function matchesPrefix(path, prefix) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

/**
 * Which artist-dock tab owns this route, or null when none does.
 * Nested dashboard / messages / analytics / artist-page routes stay on their tab.
 * Unclaimed workspace routes (recaps, galleries, edit) show no active tab.
 */
export function artistNavActiveTab(path, { slug, bandId } = {}) {
  const raw = normalizePath(path)
  if (matchesPrefix(raw, '/dashboard')) return 'dashboard'
  if (matchesPrefix(raw, '/messages')) return 'messages'
  const id = bandId == null || bandId === '' ? '' : String(bandId)
  if (id && matchesPrefix(raw, `/analytics/${id}`)) return 'analytics'
  const artistSlug = String(slug || '').replace(/^\/+|\/+$/g, '')
  if (artistSlug && matchesPrefix(raw, `/${artistSlug}`)) return 'artist'
  return null
}

/** Dev-only visual preview: `?tab=` on /__dev/artist-nav. */
export function artistNavPreviewTab(queryTab) {
  const tab = String(queryTab || '')
  return ARTIST_NAV_TABS.includes(tab) ? tab : null
}
