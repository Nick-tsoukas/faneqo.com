/**
 * A creative is one saved instance of a template family:
 *   "Badflower — Artist Spotlight — Instagram Post".
 *
 * Templates are reusable concepts (families.js). Creatives are records that
 * hold the chosen family, the frozen artist snapshot, the editable content,
 * the variant, formats, status, and derived rights. Pure functions only.
 */
import { AD_FORMATS, isAdFormat, resolveAdFormat } from '../formats.js'
import { galleryPhotos } from './campaigns.js'
import { templateFamily, TEMPLATE_IDS } from './families.js'
import { rightsStatusFor, rightsWarnings } from './artistSnapshot.js'
import { isStudioUpload } from './studioUploads.js'

export const CREATIVE_KINDS = ['post', 'ad']
export const CREATIVE_STATUSES = ['draft', 'ready']
export const MAX_CONTENT_BYTES = 64 * 1024
export const MAX_SNAPSHOT_BYTES = 192 * 1024

export function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/** Keep only what templates render from a snapshot; drop bulky lists. */
export function trimSnapshot(snapshot) {
  if (!snapshot) return null
  const copy = deepClone(snapshot)
  copy.photos = (copy.photos || []).slice(0, 40)
  copy.galleries = (copy.galleries || []).slice(0, 12).map((g) => ({ ...g, photos: (g.photos || []).slice(0, 6) }))
  copy.releases = (copy.releases || []).slice(0, 24)
  copy.shows = (copy.shows || []).slice(0, 24)
  copy.upcomingShows = (copy.upcomingShows || []).slice(0, 12)
  return copy
}

export function creativeTitle(creative) {
  const family = templateFamily(creative.templateId)
  const format = AD_FORMATS[creative.primaryFormat] || AD_FORMATS.post
  const subject = creative.artistName || family?.summary?.(creative.content || {}) || 'Faneqo'
  const formatLabel = creative.kind === 'ad'
    ? ({ story: 'Story Ad', square: 'Square Ad' }[format.id] || 'Feed Ad')
    : ({ story: 'Instagram Story', square: 'Square Post', feed: 'Feed Post' }[format.id] || 'Instagram Post')
  return `${subject} — ${family?.name || creative.templateId} — ${formatLabel}`
}

export function usedMedia(creative) {
  const family = templateFamily(creative?.templateId)
  if (!family) return []
  const listed = (family.media(creative.content || {}) || []).filter(Boolean)
  const style = creative?.content?.style
  if (creative?.templateId === 'product-showcase' && (style === 'night' || style === 'fan-list')) {
    const seen = new Set(listed.map((item) => item?.url).filter(Boolean))
    for (const frame of galleryPhotos(creative.snapshot)) {
      if (!frame?.url || seen.has(frame.url)) continue
      seen.add(frame.url)
      listed.push(frame)
    }
  }
  return listed
}

export function deriveRights(creative) {
  const paid = creative.kind === 'ad'
  const media = usedMedia(creative)
  return {
    rightsStatus: rightsStatusFor(media, { paid }),
    warnings: rightsWarnings(media, { paid }),
    credits: [...new Set(media.map((m) => m.credit).filter(Boolean))],
  }
}

export function sceneCountFor(creative) {
  const family = templateFamily(creative?.templateId)
  if (!family) return 1
  return Math.max(1, Number(family.scenes(creative.content || {})) || 1)
}

export function newCreative(templateId, { snapshot = null, kind = 'post', format = null, style = null, variant = null, now = new Date() } = {}) {
  const family = templateFamily(templateId)
  if (!family) throw new Error(`Unknown template ${templateId}`)
  const trimmed = trimSnapshot(snapshot)
  const content = family.defaults(trimmed)
  if (style && Array.isArray(family.styles) && family.styles.some((item) => item.id === style)) {
    content.style = style
    if (typeof family.styleContent === 'function') Object.assign(content, family.styleContent(style, trimmed) || {})
  }
  if (variant && Array.isArray(family.variants) && family.variants.some((item) => item.id === variant)) {
    content.variant = variant
  }
  const primaryFormat = resolveAdFormat(format || family.defaultFormat, family.formats)
  const record = {
    id: null,
    title: '',
    templateId,
    kind: CREATIVE_KINDS.includes(kind) ? kind : 'post',
    status: 'draft',
    formats: [...family.formats],
    primaryFormat,
    variant: content.variant || family.variants?.[0]?.id || 'default',
    content,
    snapshot: trimmed,
    bandId: trimmed?.bandId ?? null,
    bandSlug: trimmed?.slug || null,
    artistName: trimmed?.name || null,
    rightsStatus: 'clear',
    sceneCount: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    storage: null,
  }
  return finalizeCreative(record)
}

/** Re-derive everything that depends on content before save or render. */
export function finalizeCreative(creative) {
  const family = templateFamily(creative.templateId)
  const next = { ...creative, content: { ...(creative.content || {}) } }
  if (family) {
    if (!family.formats.includes(next.primaryFormat)) next.primaryFormat = family.defaultFormat
    next.formats = [...family.formats]
    next.variant = next.content.variant || next.variant
    next.content.variant = next.variant
  }
  next.sceneCount = sceneCountFor(next)
  const rights = deriveRights(next)
  next.rightsStatus = rights.rightsStatus
  if (!next.title) next.title = creativeTitle(next)
  return next
}

export function duplicateCreative(creative, { now = new Date() } = {}) {
  const copy = deepClone(creative)
  copy.id = null
  copy.status = 'draft'
  copy.title = /\(variation( \d+)?\)$/.test(copy.title || '')
    ? copy.title.replace(/\(variation( \d+)?\)$/, (m, n) => `(variation ${(Number(n) || 1) + 1})`)
    : `${copy.title || creativeTitle(copy)} (variation)`
  copy.createdAt = now.toISOString()
  copy.updatedAt = now.toISOString()
  copy.storage = null
  return finalizeCreative(copy)
}

export function applyArtistSnapshot(creative, snapshot) {
  const family = templateFamily(creative.templateId)
  const trimmed = trimSnapshot(snapshot)
  const fresh = family ? family.defaults(trimmed) : {}
  // Keep the user's copy edits where they diverge from the old defaults;
  // replace artist-bound fields (name, photo, song, show) with the new artist.
  const oldDefaults = family ? family.defaults(creative.snapshot) : {}
  const content = { ...creative.content }
  // Manually uploaded artwork belongs to the creative, not the artist: it, its focal point,
  // and the song title that goes with it all survive a swap.
  const keep = new Set()
  if (isStudioUpload(content.photo)) keep.add('photo').add('focal')
  if (isStudioUpload(content.songArt)) keep.add('songArt').add('songTitle')
  if (isStudioUpload(content.art)) keep.add('art').add('title')
  for (const key of Object.keys(fresh)) {
    if (keep.has(key)) continue
    const untouched = JSON.stringify(content[key]) === JSON.stringify(oldDefaults[key])
    const artistBound = ['artistName', 'photo', 'focal', 'songArt', 'songTitle', 'art', 'show', 'site', 'title', 'releaseLabel', 'description', 'headline'].includes(key)
    if (untouched || artistBound) content[key] = fresh[key]
  }
  return finalizeCreative({
    ...creative,
    content,
    snapshot: trimmed,
    bandId: trimmed?.bandId ?? null,
    bandSlug: trimmed?.slug || null,
    artistName: trimmed?.name || null,
    title: '',
  })
}

export function validateCreative(creative) {
  const errors = []
  if (!creative || typeof creative !== 'object') return ['Creative is missing.']
  if (!TEMPLATE_IDS.includes(creative.templateId)) errors.push('Unknown template.')
  if (!CREATIVE_KINDS.includes(creative.kind)) errors.push('Kind must be post or ad.')
  if (!CREATIVE_STATUSES.includes(creative.status)) errors.push('Status must be draft or ready.')
  if (!isAdFormat(creative.primaryFormat)) errors.push('Primary format is invalid.')
  if (!Array.isArray(creative.formats) || !creative.formats.every(isAdFormat)) errors.push('Formats are invalid.')
  if (!creative.content || typeof creative.content !== 'object') errors.push('Content is missing.')
  const contentBytes = JSON.stringify(creative.content || {}).length
  if (contentBytes > MAX_CONTENT_BYTES) errors.push(`Content is too large (${contentBytes} bytes).`)
  const snapshotBytes = JSON.stringify(creative.snapshot || null).length
  if (snapshotBytes > MAX_SNAPSHOT_BYTES) errors.push(`Snapshot is too large (${snapshotBytes} bytes).`)
  if (String(creative.title || '').length > 160) errors.push('Title is too long.')
  return errors
}

/** The persisted shape (what the API stores). */
export function toRecord(creative) {
  const final = finalizeCreative(creative)
  return {
    title: final.title,
    templateId: final.templateId,
    kind: final.kind,
    status: final.status,
    formats: final.formats,
    primaryFormat: final.primaryFormat,
    variant: final.variant,
    content: final.content,
    snapshot: final.snapshot,
    bandId: final.bandId,
    bandSlug: final.bandSlug,
    artistName: final.artistName,
    rightsStatus: final.rightsStatus,
    sceneCount: final.sceneCount,
  }
}

export function fromRecord(row, { storage = 'api' } = {}) {
  if (!row) return null
  const source = row.attributes ? { id: row.id, ...row.attributes } : row
  return finalizeCreative({
    id: String(source.id),
    title: source.title || '',
    templateId: source.templateId,
    kind: source.kind || 'post',
    status: source.status || 'draft',
    formats: Array.isArray(source.formats) ? source.formats : [],
    primaryFormat: source.primaryFormat || 'post',
    variant: source.variant || null,
    content: source.content || {},
    snapshot: source.snapshot || null,
    bandId: source.bandId ?? null,
    bandSlug: source.bandSlug || null,
    artistName: source.artistName || null,
    rightsStatus: source.rightsStatus || 'clear',
    sceneCount: source.sceneCount || 1,
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
    storage,
  })
}

/**
 * Filters for saved creatives. Templates and the legacy archive are routes,
 * not rows in this list, so they cannot inflate these counts.
 * `status` remains a bookmark alias for the whole library, split into drafts and ready.
 */
export const LIBRARY_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'post', label: 'Social posts' },
  { id: 'ad', label: 'Paid ads' },
  { id: 'draft', label: 'Drafts' },
  { id: 'ready', label: 'Ready' },
]

export function creativeMatchesCategory(creative, category) {
  if (!creative) return false
  if (category === 'all' || category === 'status') return true
  if (category === 'post' || category === 'ad') return creative.kind === category
  if (category === 'draft') return creative.status !== 'ready'
  if (category === 'ready') return creative.status === 'ready'
  return false
}

/** Local library search. Stored title, the label on the card, artist, and family. */
export function creativeMatchesQuery(creative, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  if (!creative) return false
  const family = templateFamily(creative.templateId)
  return `${creative.title || ''} ${creative.artistName || ''} ${creativeDisplayTitle(creative)} ${family?.name || ''}`.toLowerCase().includes(q)
}

/**
 * Image and carousel are the media kinds that exist today.
 * `video` is recognized so a later record can be filtered without a new control,
 * and it matches nothing until a creative actually says mediaType: 'video'.
 */
export function creativeMediaKind(creative) {
  if (creative?.mediaType === 'video') return 'video'
  return (Number(creative?.sceneCount) || 1) > 1 ? 'carousel' : 'image'
}

export function creativeMatchesMedia(creative, media) {
  if (!creative) return false
  if (!media || media === 'all') return true
  return creativeMediaKind(creative) === media
}

export const LIBRARY_PAGE_SIZE = 30

export const LIBRARY_SORTS = [
  { id: 'updated-desc', label: 'Recently updated' },
  { id: 'updated-asc', label: 'Oldest updated' },
  { id: 'name', label: 'Name' },
]

/** True when the stored title is the generated technical name, including "(variation)". */
export function isGeneratedTitle(creative) {
  const stored = String(creative?.title || '').trim()
  if (!stored) return true
  const generated = creativeTitle(creative)
  return stored === generated || stored.startsWith(`${generated} (variation`)
}

/** Card heading. A title the user wrote is kept. Generated titles yield the content summary. */
export function creativeDisplayTitle(creative) {
  if (!creative) return ''
  const stored = String(creative.title || '').trim()
  if (!isGeneratedTitle(creative)) return stored
  const family = templateFamily(creative.templateId)
  let summary = ''
  try {
    summary = String(family?.summary?.(creative.content || {}) || '').replace(/\s+/g, ' ').trim()
  } catch {
    summary = ''
  }
  if (summary.length > 80) summary = `${summary.slice(0, 79).trim()}…`
  return summary || stored || family?.name || 'Untitled'
}

export function compareCreatives(a, b, sort = 'updated-desc') {
  if (sort === 'name') {
    const byName = creativeDisplayTitle(a).localeCompare(creativeDisplayTitle(b), undefined, { sensitivity: 'base' })
    if (byName) return byName
  } else {
    const byDate = String(a?.updatedAt || '').localeCompare(String(b?.updatedAt || ''))
    if (byDate) return sort === 'updated-asc' ? byDate : -byDate
  }
  return String(a?.id || '').localeCompare(String(b?.id || ''))
}

/**
 * Next `start` for GET /creatives, or null when the page is done.
 * The API caps `limit` at 200 and returns `meta.total`.
 */
export function nextCreativePageStart({ loaded = 0, batchLength = 0, total = null, limit = 200 } = {}) {
  if (!batchLength) return null
  const next = loaded + batchLength
  if (Number.isFinite(total) && next >= total) return null
  if (batchLength < limit) return null
  return next
}

/** Download name: badflower-artist-spotlight-instagram-post.png */
export function creativeFileName(creative, formatId, scene = null) {
  const format = AD_FORMATS[formatId]
  const parts = [slugify(creative.artistName || ''), creative.templateId].filter(Boolean)
  if (scene != null) parts.push(`scene-${scene}`)
  parts.push(format?.file || formatId)
  return `${parts.join('-')}.png`
}
