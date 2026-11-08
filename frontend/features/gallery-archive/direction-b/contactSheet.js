/**
 * DIRECTION B — TOUR CONTACT SHEET. Lab-only sheet planning.
 *
 * Presentation only. This module never decides Night identity, attendance,
 * ownership or visibility. It reads shelves that
 * `utils/galleries/archiveShelves.js` already grouped and answers one question:
 * how does this Night get stamped and printed onto the sheet?
 *
 * The sheet geometry itself is not here. Direction B prints in strips: every
 * frame in a strip shares one height and keeps its native width, which is what
 * lets orientation stay legible at density. That is a flex-wrap rule in CSS,
 * driven by `SHEET_SCALE`, not a row planner in JavaScript.
 */
import { stackPrintRatio } from '../../../utils/media/faneqoGalleryStack.js'

/**
 * Sheet geometry, per breakpoint.
 *
 * `strip` is the height a run of frames aims for, and it is what decides how
 * many frames land in a strip: a wide frame takes more of the measure than a
 * tall one, so orientation — not a column count — sets the density.
 *
 * `open` is how many frames the Night's opening strip holds. Fewer frames over
 * the same measure means a taller strip, which is where this direction gets
 * its hierarchy: the Night opens on big pictures and proves itself in the runs
 * underneath. The CSS break markers in `ContactBand.vue` must match these.
 */
export const SHEET_SCALE = [
  { key: 'a', from: 0, strip: '8rem', open: 1, gutter: '0.5rem' },
  { key: 'b', from: 1080, strip: '13.5rem', open: 3, gutter: '1rem' },
  { key: 'c', from: 1600, strip: '15rem', open: 4, gutter: '1.1rem' },
]

/** No frame prints taller than this, whatever the measure or the ratio. */
export const FRAME_CAP = '30rem'

/**
 * Where a strip has to end. The opening strip is a fixed count so it prints
 * tall; everything after it wraps on its own.
 */
export function stripBreak(index, total, tier) {
  const open = Math.max(1, Math.floor(Number(tier?.open) || 1))
  if (index + 1 >= total) return false
  return index + 1 === open
}

/** A frame with no photograph still has to print, so it prints as a plate. */
export const BLANK_RATIO = 1.4

function text(value) {
  return String(value || '').trim()
}

/** The shape the Stack will actually print, read the way the Stack reads it. */
export function frameRatio(gallery) {
  const media = Array.isArray(gallery?.media) ? gallery.media : []
  if (!media.length) return BLANK_RATIO
  return stackPrintRatio(media[0])
}

export function frameCount(gallery) {
  const explicit = Number(gallery?.photoCount)
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit)
  return Array.isArray(gallery?.media) ? gallery.media.length : 0
}

/**
 * This direction counts in frames, the way a photographer counts a shoot. It
 * is the same truthful number the archive reports, in the sheet's own voice.
 */
export function frameLabel(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  if (!n) return 'No frames yet'
  return `${n} ${n === 1 ? 'frame' : 'frames'}`
}

/** Sequence within a Night. Two digits so the index column stays a column. */
export function frameNumber(index) {
  const n = Math.max(0, Math.floor(Number(index) || 0)) + 1
  return n < 10 ? `0${n}` : String(n)
}

function localYmd(value) {
  if (typeof value !== 'string') return null
  const day = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!day) return null
  return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
}

function parseDate(value) {
  if (!value) return null
  const parsed = localYmd(value) || (value instanceof Date ? value : new Date(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Calendar-safe. A date-only string stays on its own day, never UTC-shifted. */
export function stampDate(value) {
  const parsed = parseDate(value)
  if (!parsed) return { day: '', year: '', full: '' }
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parsed).toUpperCase()
  const date = String(parsed.getDate()).padStart(2, '0')
  const year = String(parsed.getFullYear())
  return { day: `${month} ${date}`, year, full: `${month} ${date} ${year}` }
}

export function nightYear(shelf) {
  const parsed = parseDate(shelf?.show?.date)
  return parsed ? parsed.getFullYear() : 0
}

/**
 * The stamp printed above a Night's strips. Venue is the memorable thing and
 * carries the headline; the city qualifies it; neither is ever printed twice.
 */
export function nightStamp(shelf) {
  const venue = text(shelf?.venue)
  const city = text(shelf?.show?.city)
  const date = stampDate(shelf?.show?.date)
  if (venue) return { ...date, headline: venue, place: city === venue ? '' : city }
  if (city) return { ...date, headline: city, place: '' }
  return { ...date, headline: date.full || 'A Night', place: '' }
}

/** The tally under the rule: what this Night actually holds. */
export function nightTally(shelf) {
  const galleries = Array.isArray(shelf?.galleries) ? shelf.galleries : []
  const frames = galleries.reduce((total, gallery) => total + frameCount(gallery), 0)
  const parts = [`${galleries.length} ${galleries.length === 1 ? 'gallery' : 'galleries'}`]
  if (frames > 0) parts.push(frameLabel(frames))
  return parts.join(' / ')
}

/** A stable anchor so the index can be a real index and not a scroll guess. */
export function bandAnchor(shelf) {
  const key = text(shelf?.key).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  return `sheet-${key || 'band'}`
}

/**
 * The tour index. Chronology as navigation, not as a calendar: one line per
 * Night, the year printed only when it changes.
 */
export function tourIndex(shelves) {
  const list = Array.isArray(shelves) ? shelves : []
  let lastYear = 0
  return list.map((shelf) => {
    const stamp = nightStamp(shelf)
    const year = nightYear(shelf)
    const entry = {
      id: bandAnchor(shelf),
      kind: shelf?.kind === 'general' ? 'general' : 'night',
      day: shelf?.kind === 'general' ? 'NO DATE' : stamp.day,
      place: shelf?.kind === 'general' ? 'Loose prints' : (stamp.headline || stamp.place),
      year: shelf?.kind === 'general' ? '' : (year && year !== lastYear ? String(year) : ''),
      frames: (shelf?.galleries || []).reduce((total, gallery) => total + frameCount(gallery), 0),
    }
    if (shelf?.kind !== 'general' && year) lastYear = year
    return entry
  })
}

/** Truthful totals. Derived from what is on the sheet, never invented. */
export function sheetTotals(shelves) {
  const list = Array.isArray(shelves) ? shelves : []
  let nights = 0
  let galleries = 0
  let frames = 0
  const years = new Set()
  for (const shelf of list) {
    if (shelf?.kind === 'night') {
      nights += 1
      const year = nightYear(shelf)
      if (year) years.add(year)
    }
    for (const gallery of shelf?.galleries || []) {
      galleries += 1
      frames += frameCount(gallery)
    }
  }
  const span = [...years].sort()
  return {
    nights,
    galleries,
    frames,
    span: span.length > 1 ? `${span[0]}—${span[span.length - 1]}` : (span[0] ? String(span[0]) : ''),
  }
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`
}

/** The masthead ledger. Zero terms are dropped rather than printed as "0". */
export function sheetLedger(totals) {
  const parts = []
  if (totals?.nights > 0) parts.push(plural(totals.nights, 'Night', 'Nights'))
  if (totals?.galleries > 0) parts.push(plural(totals.galleries, 'Gallery', 'Galleries'))
  if (totals?.frames > 0) parts.push(plural(totals.frames, 'frame', 'frames'))
  if (totals?.span) parts.push(totals.span)
  return parts.join('  ·  ')
}
