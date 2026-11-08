/**
 * DIRECTION A — NIGHT JOURNAL. Lab-only composition planning.
 *
 * Presentation only. This module never decides Night identity, attendance,
 * ownership, or visibility. It reads a shelf that `utils/galleries/archiveShelves.js`
 * already grouped and answers one question: how big should this chapter feel?
 */

export const JOURNAL_KINDS = ['solo', 'pair', 'spread', 'shelf']

/**
 * A Night is not a row. Its weight comes from how much of it was photographed.
 */
export function journalChapterKind(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  if (n <= 1) return 'solo'
  if (n === 2) return 'pair'
  if (n === 3) return 'spread'
  return 'shelf'
}

export function journalPlateRoles(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  if (!n) return []
  const kind = journalChapterKind(n)
  if (kind === 'solo') return ['solo']
  if (kind === 'pair') return ['pair-a', 'pair-b']
  if (kind === 'spread') return ['lead', 'support', 'support']
  return ['lead', ...Array.from({ length: n - 1 }, () => 'support')]
}

/**
 * The three grids a shelf switches between, smallest viewport first. They are
 * counted in micro-tracks so a chapter can close its last row with prints of
 * one even size instead of one wide print beside a narrow one. `unit` is the
 * width of a single contact-sheet print.
 */
export const SHELF_GRIDS = [
  { key: 'a', tracks: 2, unit: 1 },
  { key: 'b', tracks: 6, unit: 2 },
  { key: 'c', tracks: 12, unit: 3 },
]

/**
 * A shelf is a lead print over a contact sheet, and it has to resolve.
 *
 * The lead owns the whole first row — nothing sits beside it, so it is never
 * out-measured and never leaves a column of dead space at its shoulder. The
 * supports below it are one unit wide, which is what keeps them reading as a
 * contact sheet. A row that cannot be filled at that size shares itself out
 * evenly between the prints it does have rather than pairing one wide print
 * with one narrow one, and a row is never left holding a single support while
 * the row above it is full.
 *
 * Returns spans in micro-tracks plus, for the narrowest grid — where a row
 * can only ever be closed by one print — a flag saying that print stays small.
 */
export function shelfPlan(count, tracks, unit) {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  const t = Math.max(1, Math.floor(Number(tracks) || 1))
  const u = Math.max(1, Math.min(Math.floor(Number(unit) || 1), t))
  if (!n) return { spans: [], caps: [] }

  const spans = new Array(n).fill(u)
  const caps = new Array(n).fill(false)
  spans[0] = t
  const supports = n - 1
  if (!supports) return { spans, caps }

  const perRow = Math.floor(t / u)
  const rows = []
  for (let i = 1; i < n; i += perRow) {
    rows.push(Array.from({ length: Math.min(perRow, n - i) }, (_, k) => i + k))
  }

  const last = rows[rows.length - 1]
  if (rows.length > 1 && last.length === 1 && perRow > 2) {
    last.unshift(rows[rows.length - 2].pop())
  }

  for (const row of rows) {
    if (row.length === perRow) continue
    const even = Math.floor(t / row.length)
    let slack = t - even * row.length
    for (const index of row) {
      spans[index] = even + (slack > 0 ? 1 : 0)
      if (slack > 0) slack -= 1
      caps[index] = spans[index] >= t
    }
  }
  return { spans, caps }
}

/** Caption and print scale. Cover hierarchy lives here, not in the Stack. */
export function plateScale(role) {
  if (role === 'solo') return 'xl'
  if (role === 'lead' || role === 'pair-a' || role === 'pair-b') return 'lg'
  return 'sm'
}

export function photographCount(gallery) {
  const explicit = Number(gallery?.photoCount)
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit)
  return Array.isArray(gallery?.media) ? gallery.media.length : 0
}

/** Truthful archive totals. Derived from what is on the page, never invented. */
export function archiveSummary(shelves) {
  const list = Array.isArray(shelves) ? shelves : []
  let nights = 0
  let galleries = 0
  let photographs = 0
  for (const shelf of list) {
    if (shelf?.kind === 'night') nights += 1
    for (const gallery of shelf?.galleries || []) {
      galleries += 1
      photographs += photographCount(gallery)
    }
  }
  return { nights, galleries, photographs }
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`
}

/** Masthead ledger. Zero terms are dropped rather than shown as "0". */
export function summaryLine(summary) {
  const parts = []
  if (summary?.nights > 0) parts.push(plural(summary.nights, 'Night', 'Nights'))
  if (summary?.galleries > 0) parts.push(plural(summary.galleries, 'Gallery', 'Galleries'))
  if (summary?.photographs > 0) parts.push(plural(summary.photographs, 'photograph', 'photographs'))
  return parts.join(' · ')
}

/** Chapter footnote. Gallery count is only interesting once there is more than one. */
export function chapterContext(shelf) {
  const galleries = Array.isArray(shelf?.galleries) ? shelf.galleries : []
  const photographs = galleries.reduce((total, gallery) => total + photographCount(gallery), 0)
  const parts = []
  if (galleries.length > 1) parts.push(plural(galleries.length, 'gallery', 'galleries'))
  if (photographs > 0) parts.push(plural(photographs, 'photograph', 'photographs'))
  return parts.join(' · ')
}

function localYmd(value) {
  if (typeof value !== 'string') return null
  const day = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!day) return null
  return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
}

/** Calendar-safe full dateline. Date-only strings stay local, never UTC-shifted. */
export function journalDateline(value) {
  if (!value) return ''
  const parsed = localYmd(value) || (value instanceof Date ? value : new Date(value))
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(parsed)
}

/**
 * The chapter headline. Venue is the memorable thing; city and date are context.
 * With no venue the city carries the chapter, and with neither the date does.
 */
export function chapterIdentity(shelf) {
  const venue = String(shelf?.venue || '').trim()
  const city = String(shelf?.show?.city || '').trim()
  const dateline = journalDateline(shelf?.show?.date)
  /* A venue that fell back to the city must not print the city twice. */
  if (venue) return { dateline, headline: venue, place: city === venue ? '' : city }
  if (city) return { dateline, headline: city, place: '' }
  return { dateline: '', headline: dateline || 'A Night', place: '' }
}
