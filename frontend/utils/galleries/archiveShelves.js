/**
 * Artist Gallery archive grouping. Presentation only.
 * Does not invent Night identity or attendance.
 */
import { galleryAudienceLabel } from '../nights/artistRecap.js'
import { displayPlaceName, isGenericShowTitle } from '../nights/nightDisplay.js'
import { formatShowNightDate } from '../shows/formatShowNightDate.js'
import { galleryPath } from '../nights/publicNightPaths.js'
import { manageGalleryLocation } from './stackOpenNavigation.js'
import { mediaPreviewLabel } from '../media/faneqoMedia.js'

function text(value) {
  return String(value || '').trim()
}

function idOf(value) {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? String(n) : ''
}

export function isNightGallery(item) {
  return Boolean(item?.show)
}

export function isDraftGallery(item) {
  return text(item?.status).toLowerCase() === 'draft'
}

export function isHiddenGallery(item) {
  return text(item?.status).toLowerCase() === 'hidden'
}

export function isLiveGallery(item) {
  const status = text(item?.status).toLowerCase()
  return !status || status === 'published'
}

export function galleryTitle(item) {
  return text(item?.title) || (isNightGallery(item) ? 'Night gallery' : 'Artist gallery')
}

export function galleryPhotoCount(item) {
  const explicit = Number(item?.photoCount)
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit)
  return Array.isArray(item?.media) ? item.media.length : 0
}

export function galleryCountLabel(item) {
  return mediaPreviewLabel(galleryPhotoCount(item))
}

export function archiveVisibilityLabel(visibility, { quietPublic = true } = {}) {
  const key = text(visibility)
  if (key === 'show_attendees' || key === 'fan_list') return galleryAudienceLabel(key)
  if (quietPublic) return ''
  return galleryAudienceLabel(key)
}

export function nightSortTime(show) {
  const raw = show?.date
  if (!raw) return 0
  if (typeof raw === 'string') {
    const day = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (day) return Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
  }
  const parsed = raw instanceof Date ? raw : new Date(raw)
  const time = parsed.getTime()
  return Number.isNaN(time) ? 0 : time
}

export function nightShelfKey(item) {
  if (!isNightGallery(item)) return 'general'
  const recapId = idOf(item.showRecapId || item.show?.showRecapId)
  if (recapId) return `night:recap:${recapId}`
  const eventId = idOf(item.eventId || item.show?.eventId)
  if (eventId) return `night:event:${eventId}`
  const city = text(item.show?.city).toLowerCase()
  const venue = text(item.show?.venue).toLowerCase()
  const date = text(item.show?.date)
  return `night:place:${city}|${venue}|${date}`
}

export function nightShelfKicker(show) {
  const when = formatShowNightDate(show?.date)
  const city = displayPlaceName(show?.city)
  return [when ? when.toUpperCase() : '', city ? city.toUpperCase() : ''].filter(Boolean).join(' · ')
}

/**
 * The ledger rail sets date, venue and city on separate lines, so it needs the
 * parts rather than the combined kicker. The kicker stays for surfaces that
 * render one line.
 */
export function nightShelfDateLabel(show) {
  const raw = show?.date
  if (!raw) return ''
  const year = nightYear(show)
  const short = formatShowNightDate(raw)
  if (!short) return ''
  return year ? `${short}, ${year}` : short
}

export function nightShelfCity(show) {
  return displayPlaceName(show?.city)
}

export function nightShelfVenue(show) {
  const venue = displayPlaceName(show?.venue)
  const title = text(show?.title)
  if (venue) return venue
  if (title && !isGenericShowTitle(title)) return title
  return ''
}

export function nightYear(show) {
  const raw = show?.date
  if (typeof raw === 'string') {
    const day = raw.match(/^(\d{4})-/)
    if (day) return Number(day[1])
  }
  const time = nightSortTime(show)
  if (!time) return 0
  return new Date(time).getUTCFullYear()
}

export function recapHref(item) {
  const id = idOf(item?.showRecapId || item?.show?.showRecapId)
  return id ? `/fans/recaps/${id}` : null
}

export function manageGalleryPath(item, bandSlug) {
  if (!item?.slug || !bandSlug) return '/galleries'
  const path = galleryPath(bandSlug, item.slug)
  if (!path) return '/galleries'
  return `${path}?from=${encodeURIComponent('/galleries')}`
}

export { manageGalleryLocation }

/**
 * Editing is management, not viewing. The canonical public URL never changes,
 * so the edit route is keyed by id and lives behind artist auth.
 */
export function manageEditPath(item) {
  const id = text(item?.id)
  return id ? `/galleries/${id}/edit` : null
}

export function manageSendPath(item) {
  if (item?.visibility === 'show_attendees' && item.showRecapId) {
    return {
      path: '/messages/compose',
      query: {
        audienceType: 'show_attendees',
        recapId: String(item.showRecapId),
        galleryId: String(item.id),
        from: '/galleries',
      },
    }
  }
  if (item?.visibility === 'public') {
    return {
      path: '/messages/compose',
      query: {
        audienceType: 'all_fans',
        galleryId: String(item.id),
        from: '/galleries',
      },
    }
  }
  return null
}

export function groupArchiveShelves(items) {
  const list = Array.isArray(items) ? items : []
  const nights = new Map()
  const general = []

  for (const item of list) {
    if (!isNightGallery(item)) {
      general.push(item)
      continue
    }
    const key = nightShelfKey(item)
    const existing = nights.get(key)
    if (existing) {
      existing.galleries.push(item)
      continue
    }
    nights.set(key, {
      key,
      kind: 'night',
      show: item.show || null,
      showRecapId: idOf(item.showRecapId || item.show?.showRecapId),
      recapHref: recapHref(item),
      kicker: nightShelfKicker(item.show),
      dateLabel: nightShelfDateLabel(item.show),
      city: nightShelfCity(item.show),
      venue: nightShelfVenue(item.show),
      year: nightYear(item.show),
      sortTime: nightSortTime(item.show),
      galleries: [item],
    })
  }

  const nightShelves = [...nights.values()].sort((a, b) => {
    if (b.sortTime !== a.sortTime) return b.sortTime - a.sortTime
    return text(b.venue).localeCompare(text(a.venue))
  })

  const years = new Set(nightShelves.map((shelf) => shelf.year).filter(Boolean))
  const showYears = years.size > 1
  if (showYears) {
    let lastYear = 0
    for (const shelf of nightShelves) {
      shelf.yearLabel = shelf.year && shelf.year !== lastYear ? String(shelf.year) : ''
      lastYear = shelf.year || lastYear
    }
  }

  /* The newest Night opens the archive and is composed at a larger scale. */
  if (nightShelves.length) nightShelves[0].lead = true

  const shelves = nightShelves
  if (general.length) {
    shelves.push({
      key: 'general',
      kind: 'general',
      show: null,
      showRecapId: '',
      recapHref: null,
      kicker: 'GENERAL',
      /* General is a real section, not a leftover bin, so it gets a heading of
         its own rather than one small uppercase label. */
      dateLabel: '',
      city: '',
      venue: 'General',
      blurb: 'Photographs that aren’t tied to a Night.',
      year: 0,
      yearLabel: '',
      sortTime: 0,
      galleries: general,
    })
  }
  return shelves
}
