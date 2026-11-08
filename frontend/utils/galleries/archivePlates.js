/**
 * Gallery archive plate presentation. Presentation only.
 *
 * A "plate" is one gallery as it appears in the artist archive. This module
 * decides what a plate says — never what it is. It does not invent Night
 * identity, attendance, audience rules, or cover choice: `media[0]` remains
 * the cover and `visibility` remains server truth.
 */
import { galleryAudienceLabel } from '../nights/artistRecap.js'
import { mediaAspectRatio, coverCropLoss } from '../media/faneqoGalleryLayout.js'
import { isNightGallery, galleryPhotoCount } from './archiveShelves.js'

/** The manage list is capped server-side. Older work must not vanish silently. */
export const ARCHIVE_LIST_LIMIT = 40

/**
 * Print band. Wider than the Stack's own 0.72–1.12 clamp so a 16:9 cover keeps
 * most of its width, but never so wide that a plate stops reading as a print.
 */
export const PLATE_RATIO_MIN = 0.74
export const PLATE_RATIO_MAX = 1.34
export const PLATE_RATIO_DEFAULT = 1

/** Above this, cropping a cover to the row frame destroys the photograph. */
export const PLATE_CROP_GUARD = 0.25

function text(value) {
  return String(value || '').trim()
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Backend-authored placeholder titles. These are not artist intent, so a plate
 * must not present them as a name — three galleries all reading "Artist
 * gallery" tells the artist nothing about which is which.
 */
export function isPlaceholderGalleryTitle(title) {
  return /^(artist gallery|night gallery|gallery|untitled|photos)$/i.test(text(title))
}

/**
 * `deriveShowPhotosTitle` auto-names Night galleries "Chicago — Sep 5". Inside a
 * Night row whose header already says SEP 5 / CHICAGO, that is the same fact
 * twice. Detect the generated shape rather than string-matching one city.
 */
export function echoesNightHeader(title, show) {
  const raw = text(title)
  if (!raw) return false
  const city = text(show?.city)
  const venue = text(show?.venue)
  const [left] = raw.split(/\s+[—–-]\s+/)
  const head = text(left).toLowerCase()
  if (!head) return false
  /* "<City> — <Mon D>" or "<Venue> — <Mon D>" with a date-ish tail. */
  const hasDateTail = /\s+[—–-]\s+[A-Z][a-z]{2}\s+\d{1,2}$/.test(raw)
  if (!hasDateTail) return false
  return head === city.toLowerCase() || head === venue.toLowerCase()
}

export function plateDateLabel(value) {
  if (!value) return ''
  const day = typeof value === 'string' ? value.match(/^(\d{4})-(\d{2})-(\d{2})/) : null
  const date = day
    ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
    : (value instanceof Date ? value : new Date(value))
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

/**
 * Plate caption. A Night plate inherits identity from its row header, so it
 * only speaks when the artist actually named it. A General plate has no header
 * to inherit from, so it falls back to its own publish date — that way no two
 * General plates read alike.
 */
export function plateIdentity(item) {
  const title = text(item?.title)
  const night = isNightGallery(item)
  const authored = title && !isPlaceholderGalleryTitle(title)
  if (authored && night && !echoesNightHeader(title, item?.show)) return title
  if (authored && !night) return title
  if (night) return ''
  return plateDateLabel(item?.publishedAt || item?.createdAt || item?.date) || ''
}

/** Photo count in the artist's language. `mediaPreviewLabel` says "Photo" for 1. */
export function platePhotoLabel(item) {
  const count = galleryPhotoCount(item)
  if (count <= 0) return 'No photos yet'
  if (count === 1) return '1 photo'
  return `${count} photos`
}

/**
 * Audience is the highest-stakes fact on a plate, so Public is stated rather
 * than implied by silence. The label vocabulary stays `galleryAudienceLabel`'s.
 */
export function plateAudience(visibility) {
  return galleryAudienceLabel(text(visibility))
}

/** Public is the only audience that reaches beyond the artist's own people. */
export function plateAudienceIsOpen(visibility) {
  return text(visibility) === 'public'
}

/**
 * One frame ratio for a whole row so plate baselines and captions align. Uses
 * the median cover ratio, which resists a single odd screenshot dragging the
 * row, then holds it inside the print band.
 */
export function shelfFrameRatio(galleries, {
  min = PLATE_RATIO_MIN,
  max = PLATE_RATIO_MAX,
} = {}) {
  const list = Array.isArray(galleries) ? galleries : []
  const ratios = list
    .map((gallery) => mediaAspectRatio(Array.isArray(gallery?.media) ? gallery.media[0] : null))
    .filter((ratio) => Number.isFinite(ratio) && ratio > 0)
    .sort((a, b) => a - b)
  if (!ratios.length) return PLATE_RATIO_DEFAULT
  const mid = Math.floor(ratios.length / 2)
  const median = ratios.length % 2 ? ratios[mid] : (ratios[mid - 1] + ratios[mid]) / 2
  return Number(clamp(median, min, max).toFixed(4))
}

/**
 * A Night showing a single plate holds a shallower frame: one lone portrait at
 * full print width becomes a tower that strands the rest of the row.
 */
export const PLATE_SOLO_RATIO_MIN = 0.95

/**
 * The opening Night prints wide, so a lone plate there holds a landscape band
 * instead of towering down the sheet.
 */
export const PLATE_LEAD_SOLO_RATIO_MIN = 1.2
export const PLATE_LEAD_SOLO_RATIO_MAX = 1.6

export function shelfPlateFrame(galleries, { lead = false } = {}) {
  const list = Array.isArray(galleries) ? galleries : []
  if (list.length !== 1) return shelfFrameRatio(list)
  return shelfFrameRatio(list, {
    min: lead ? PLATE_LEAD_SOLO_RATIO_MIN : PLATE_SOLO_RATIO_MIN,
    max: lead ? PLATE_LEAD_SOLO_RATIO_MAX : PLATE_RATIO_MAX,
  })
}

/**
 * Would honoring the row frame destroy this cover? A screenshot or a portrait
 * in a landscape row letterboxes onto the print matte instead of losing a
 * third of the photograph.
 */
export function plateShouldLetterbox(item, frameRatio) {
  const cover = Array.isArray(item?.media) ? item.media[0] : null
  const ratio = mediaAspectRatio(cover)
  if (!Number.isFinite(ratio) || ratio <= 0) return false
  const frame = Number(frameRatio)
  if (!Number.isFinite(frame) || frame <= 0) return false
  return coverCropLoss(ratio, frame) > PLATE_CROP_GUARD
}

/**
 * The header facts line. Real totals, so the artist sees the shape of their own
 * archive rather than a page of unexplained cards.
 */
export function archiveCounts(items) {
  const list = Array.isArray(items) ? items : []
  const nights = new Set()
  let general = 0
  let hidden = 0
  for (const item of list) {
    if (text(item?.status).toLowerCase() === 'hidden') hidden += 1
    if (!isNightGallery(item)) {
      general += 1
      continue
    }
    const show = item.show || {}
    nights.add(text(item.showRecapId || show.showRecapId || item.eventId || show.eventId)
      || `${text(show.city)}|${text(show.venue)}|${text(show.date)}`)
  }
  return {
    galleries: list.length,
    nights: nights.size,
    general,
    hidden,
    atLimit: list.length >= ARCHIVE_LIST_LIMIT,
  }
}

export function archiveCountsLine(items) {
  const counts = archiveCounts(items)
  const parts = []
  if (counts.galleries) {
    parts.push(counts.galleries === 1 ? '1 gallery' : `${counts.galleries} galleries`)
  }
  if (counts.nights) {
    parts.push(counts.nights === 1 ? '1 Night' : `${counts.nights} Nights`)
  }
  return parts.join(' · ')
}
