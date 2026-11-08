/**
 * Artist pages for the sitemap (B14). The server decides who is listed
 * (GET /api/bands/sitemap: every public artist, radio and editorial profile,
 * minus blocked owners). Here we only keep URLs that really render that
 * artist: a slug that is a single path segment, not shadowed by an app route,
 * and not the source of a redirect.
 */

/** Top-level route names from the pages/ directory listing. */
export function reservedTopLevelPaths(pageEntries) {
  const reserved = new Set()
  for (const entry of pageEntries || []) {
    const name = String(entry).replace(/\.vue$/, '').toLowerCase()
    if (name && !name.startsWith('[')) reserved.add(name)
  }
  return reserved
}

/**
 * @param {Array<{ slug: string, updatedAt?: string|null }>} entries
 * @param {{ reserved?: Set<string>, redirected?: Set<string> }} opts
 */
export function artistSitemapUrls(entries, { reserved = new Set(), redirected = new Set() } = {}) {
  const urls = []
  const seen = new Set()
  for (const entry of entries || []) {
    const slug = typeof entry?.slug === 'string' ? entry.slug.trim() : ''
    if (!slug || /[\s/?#\\]/.test(slug)) continue
    const key = slug.toLowerCase()
    if (reserved.has(key) || seen.has(key)) continue
    const loc = `/${slug}`
    if (redirected.has(loc) || redirected.has(loc.toLowerCase())) continue
    seen.add(key)
    const url = { loc, changefreq: 'weekly', priority: 0.7 }
    if (entry.updatedAt) url.lastmod = entry.updatedAt
    urls.push(url)
  }
  return urls
}
