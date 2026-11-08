/**
 * In-memory library for development checks. Never written to localStorage or Strapi.
 * Used only when the library is opened with ?scale=1 in a dev build.
 */
import { newCreative } from './creativeModel.js'
import { TEMPLATE_FAMILIES } from './families.js'

const ARTISTS = ['Badflower', 'The Rockers', 'Night School', 'June Letters', '']

let cached = null

export function scaleLibrary(count = 250) {
  if (cached && cached.length === count) return cached
  const families = TEMPLATE_FAMILIES.map((family) => family.id)
  const items = []
  for (let i = 0; i < count; i += 1) {
    const templateId = families[i % families.length]
    const artist = ARTISTS[i % ARTISTS.length]
    const creative = newCreative(templateId, {
      snapshot: artist ? { name: artist, slug: artist.toLowerCase().replace(/\s+/g, '-') } : null,
      kind: i % 4 === 0 ? 'ad' : 'post',
      now: new Date(Date.UTC(2026, 0, 1) + i * 5 * 60 * 60 * 1000),
    })
    creative.id = `scale-${i}`
    creative.status = i % 3 === 0 ? 'ready' : 'draft'
    creative.storage = i % 7 === 0 ? 'local' : 'api'
    creative.updatedAt = new Date(Date.UTC(2026, 0, 1) + (count - i) * 5 * 60 * 60 * 1000).toISOString()
    if (i % 5 === 0) creative.rightsStatus = 'needs_permission'
    if (i % 11 === 0) creative.title = `Night ${i + 1}`
    if (i % 13 === 0) creative.artistName = null
    items.push(creative)
  }
  cached = items
  return items
}
