/**
 * Fan Passport presentation. Relationship chapters and Night memory objects.
 * Never invents attendance, ordinals, cities, or Night media.
 */

import { formatShowOrdinal } from '../nights/showOrdinalCopy.js'
import { displayPlaceName, nightHeadline } from '../nights/nightDisplay.js'
import { withSafeFrom } from '../nights/artistWorldReturn.js'
import { nightPath } from '../nights/publicNightPaths.js'
import { formatPassportNightDate, formatPassportPlace, passportMemoryPath } from './fanPassport.js'

export const PASSPORT_HOME_PATH = '/fan/passport'

function text(value) {
  return String(value || '').trim()
}

function artistKey(artist) {
  const id = Number(artist?.id)
  if (Number.isInteger(id) && id > 0) return `artist:${id}`
  const slug = text(artist?.slug)
  if (slug) return `slug:${slug.toLowerCase()}`
  const name = text(artist?.name)
  return name ? `name:${name.toLowerCase()}` : 'artist:unknown'
}

function yearFromDate(value) {
  const raw = text(value)
  const match = raw.match(/^(\d{4})/)
  return match ? match[1] : ''
}

export function nightsTogetherLine(count) {
  const n = Number(count) || 0
  if (n < 1) return ''
  return n === 1 ? '1 Night together' : `${n} Nights together`
}

export function passportSummaryLine({ nightCount, artistCount, savedCount } = {}) {
  const nights = Number(nightCount) || 0
  const artists = Number(artistCount) || 0
  const saved = Number(savedCount) || 0
  const savedPart = saved ? (saved === 1 ? '1 saved gallery' : `${saved} saved galleries`) : ''
  if (!nights) return savedPart
  const nightPart = nights === 1 ? '1 Night' : `${nights} Nights`
  const artistPart = artists ? (artists === 1 ? '1 Artist' : `${artists} Artists`) : ''
  return [nightPart, artistPart, savedPart].filter(Boolean).join(' · ')
}

function ordinalArtistName(artistName) {
  const raw = text(artistName).replace(/^the\s+/i, '').trim()
  return raw || 'THIS ARTIST'
}

export function yourNightOrdinalCopy({ showOrdinal, artistName } = {}) {
  const artist = ordinalArtistName(artistName)
  const n = Number(showOrdinal)
  if (!Number.isInteger(n) || n < 1) return ''
  if (n === 1) return `YOUR FIRST ${artist.toUpperCase()} NIGHT`
  const token = formatShowOrdinal(n)
  return token ? `YOUR ${token} ${artist.toUpperCase()} NIGHT` : ''
}

export function yourNightOrdinalSentence({ showOrdinal, artistName } = {}) {
  const artist = text(artistName) || 'this artist'
  const n = Number(showOrdinal)
  if (!Number.isInteger(n) || n < 1) return ''
  if (n === 1) return `Your first Night with ${artist}.`
  if (n === 2) return `You came back. This was your second Night with ${artist}.`
  const token = formatShowOrdinal(n)
  return token ? `This was your ${token.toLowerCase()} Night with ${artist}.` : ''
}

export function relationshipHistoryLine({ showOrdinal, artistName } = {}) {
  return yourNightOrdinalSentence({ showOrdinal, artistName })
}

export function formatPassportNightShort(value) {
  if (!value) return ''
  const day = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  const parsed = day
    ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
    : (value instanceof Date ? value : new Date(value))
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
    .format(parsed)
    .toUpperCase()
}

export function passportNightKicker(memory) {
  const date = formatPassportNightShort(memory?.show?.date || memory?.checkedInAt)
  const city = displayPlaceName(memory?.show?.city)
  return [date, city ? city.toUpperCase() : ''].filter(Boolean).join(' · ')
}

export function passportNightTitle(memory) {
  const headline = nightHeadline({
    title: memory?.show?.title,
    venue: memory?.show?.venue,
  })
  return headline.primary || text(memory?.artist?.name) || 'The night'
}

export function passportNightVenue(memory) {
  const headline = nightHeadline({
    title: memory?.show?.title,
    venue: memory?.show?.venue,
  })
  return headline.secondary || ''
}

export function passportNightPlace(memory) {
  return formatPassportPlace(memory?.show?.city, memory?.show?.region)
}

export function passportNightDate(memory) {
  return formatPassportNightDate(memory?.show?.date || memory?.checkedInAt)
}

export function galleryChapterLine({ galleryCount, photoCount } = {}) {
  const galleries = Number(galleryCount) || 0
  const photos = Number(photoCount) || 0
  const galleryPart = galleries > 1
    ? `${galleries} Galleries`
    : ''
  const photoPart = photos > 0
    ? (photos === 1 ? '1 photo' : `${photos} photos`)
    : ''
  return [galleryPart, photoPart].filter(Boolean).join(' · ')
}

export function primaryPassportGallery(memory) {
  const rows = Array.isArray(memory?.galleries) ? memory.galleries : []
  return rows.find((row) => !row?.locked && Array.isArray(row.media) && row.media.length) || null
}

/**
 * Night visuals never fall back to the artist portrait.
 * Old `artwork.source === 'artist'` payloads become typography.
 */
export function passportNightVisualKind(memory) {
  if (primaryPassportGallery(memory)) return 'gallery'
  const source = text(memory?.artwork?.source)
  const url = text(memory?.artwork?.url || memory?.nightMedia?.hero || memory?.nightMedia?.poster || memory?.nightMedia?.event)
  if (!url || source === 'artist') return 'type'
  if (source === 'night_hero' || text(memory?.nightMedia?.hero)) return 'hero'
  if (source === 'night_poster' || text(memory?.nightMedia?.poster)) return 'poster'
  if (source === 'show_cover' || source === 'event_artwork' || text(memory?.nightMedia?.event)) return 'event'
  return url ? 'event' : 'type'
}

export function artistPathFromMemory(memory) {
  const slug = text(memory?.artist?.slug).replace(/^\/+|\/+$/g, '')
  if (!slug || slug.includes('/') || slug.includes('..')) return ''
  return `/${slug}`
}

export function publicNightPathFromMemory(memory) {
  const fromNight = text(memory?.night?.publicPath)
  if (fromNight.startsWith('/') && !fromNight.includes('..')) return fromNight
  return nightPath(memory?.artist?.slug, memory?.show?.nightSlug) || ''
}

export function groupPassportRelationships(memories) {
  const chapters = []
  const index = new Map()
  for (const memory of memories || []) {
    if (!memory) continue
    const key = artistKey(memory.artist)
    if (!index.has(key)) {
      const chapter = {
        key,
        artist: memory.artist || { name: 'Artist' },
        memories: [],
        nightCount: Number(memory.relationship?.nightCount) || 0,
        cities: Array.isArray(memory.relationship?.cities) ? memory.relationship.cities : [],
        firstNightDate: memory.relationship?.firstNightDate || null,
        latestNightDate: memory.relationship?.latestNightDate || null,
      }
      index.set(key, chapter)
      chapters.push(chapter)
    }
    const chapter = index.get(key)
    chapter.memories.push(memory)
    if (!chapter.nightCount) chapter.nightCount = Number(memory.relationship?.nightCount) || 0
    // Earliest server fact wins, whichever memory carries it.
    const first = text(memory.relationship?.firstNightDate)
    if (first && (!chapter.firstNightDate || first < text(chapter.firstNightDate))) {
      chapter.firstNightDate = first
    }
    if (!chapter.cities.length && Array.isArray(memory.relationship?.cities)) {
      chapter.cities = memory.relationship.cities
    }
  }
  return chapters.map((chapter) => {
    const nightCount = chapter.nightCount || chapter.memories.length
    const cities = chapter.cities.length
      ? chapter.cities
      : [...new Set(chapter.memories.map((row) => text(row.show?.city)).filter(Boolean))]
    const years = [...new Set(chapter.memories.map((row) => yearFromDate(row.show?.date)).filter(Boolean))]
    return {
      ...chapter,
      nightCount,
      cities,
      cityLine: cities.map((city) => displayPlaceName(city)).filter(Boolean).join(' · '),
      togetherLine: nightsTogetherLine(nightCount),
      sinceLine: relationshipSinceLine({ nightCount, firstNightDate: chapter.firstNightDate }),
      moments: relationshipMoments(chapter.memories, nightCount),
      artistPath: artistPathFromMemory({ artist: chapter.artist }),
      showYearMarkers: years.length > 1,
    }
  })
}

export function withYearMarkers(memories, enabled) {
  if (!enabled) return (memories || []).map((memory) => ({ memory, yearMarker: '' }))
  let lastYear = ''
  return (memories || []).map((memory) => {
    const year = yearFromDate(memory?.show?.date)
    const marker = year && year !== lastYear ? year : ''
    if (year) lastYear = year
    return { memory, yearMarker: marker }
  })
}

export function passportMemoryHref(memory) {
  const publicPath = publicNightPathFromMemory(memory)
  if (publicPath) return withSafeFrom(publicPath, PASSPORT_HOME_PATH)
  return passportMemoryPath(memory?.id) || ''
}

export function relationshipCitiesLine(cities) {
  return (Array.isArray(cities) ? cities : [])
    .map((city) => displayPlaceName(city))
    .filter(Boolean)
    .join(' · ')
}

function monthYear(value) {
  const raw = text(value)
  const day = raw.match(/^(\d{4})-(\d{2})/)
  const parsed = day ? new Date(Number(day[1]), Number(day[2]) - 1, 1) : new Date(raw)
  if (!raw || Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(parsed)
}

/** "Since September 2024" — only once a relationship has more than one Night. */
export function relationshipSinceLine({ nightCount, firstNightDate } = {}) {
  if ((Number(nightCount) || 0) < 2) return ''
  const when = monthYear(firstNightDate)
  return when ? `Since ${when}` : ''
}

function memoryOrdinal(memory) {
  const n = Number(memory?.showOrdinal ?? memory?.relationship?.showOrdinal)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * Relationship moments derived from verified attendance only.
 * Needs every Night in the chapter with a server ordinal; a truncated or
 * ordinal-less history says nothing rather than guessing.
 * Returns Map(memoryKey -> moment line).
 */
export function relationshipMoments(memories, nightCount) {
  const rows = Array.isArray(memories) ? memories.filter(Boolean) : []
  const moments = new Map()
  if (rows.length < 2) return moments
  if (Number(nightCount) && Number(nightCount) !== rows.length) return moments
  if (rows.some((row) => !memoryOrdinal(row))) return moments
  const chrono = rows.slice().sort((a, b) => memoryOrdinal(a) - memoryOrdinal(b))
  const seenCities = new Set()
  chrono.forEach((row, index) => {
    const city = displayPlaceName(row?.show?.city)
    const cityKey = city.toLowerCase()
    const key = memoryKey(row)
    if (index === 0) {
      moments.set(key, 'Where it started')
    } else if (city && !seenCities.has(cityKey)) {
      moments.set(key, `First Night in ${city}`)
    }
    if (city) seenCities.add(cityKey)
  })
  return moments
}

export function memoryKey(memory) {
  return String(memory?.id || memory?.attendanceId || memory?.path || '')
}

function savedGalleryArtist(save) {
  const gallery = save?.gallery || {}
  return gallery.band || gallery.artist || null
}

/** Saved gallery → presentation row. Server has already re-checked access. */
export function savedGalleryEntry(save) {
  const gallery = save?.gallery
  if (!gallery || gallery.locked || !positiveGalleryId(gallery.id)) return null
  const media = Array.isArray(gallery.media) ? gallery.media : []
  if (!media.length) return null
  const artist = savedGalleryArtist(save)
  const canonical = canonicalGalleryPathFor(artist?.slug, gallery.slug)
  const fallback = text(save?.sharePath)
  const path = canonical || (fallback.startsWith('/fan/passport/gallery/') ? fallback : '')
  if (!path) return null
  return {
    id: Number(gallery.id),
    title: text(gallery.title) || 'Gallery',
    media,
    photoCount: Number(gallery.photoCount || media.length || 0),
    place: [text(gallery.show?.venue), displayPlaceName(gallery.show?.city)].filter(Boolean).join(' · '),
    youWereThere: gallery.youWereThere === true,
    savedAt: save?.savedAt || null,
    href: withSafeFrom(path, PASSPORT_HOME_PATH),
  }
}

function positiveGalleryId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0
}

function canonicalGalleryPathFor(bandSlug, slug) {
  const band = text(bandSlug).replace(/^\/+|\/+$/g, '')
  const page = text(slug).replace(/^\/+|\/+$/g, '')
  if (!band || !page || /[/]|\.\./.test(band) || /[/]|\.\./.test(page)) return ''
  return `/${band}/gallery/${page}`
}

/**
 * Saved galleries join the artist's chapter. A gallery already shown on one
 * of that artist's Nights is not repeated. Saving is never attendance: a
 * saved-only artist gets a chapter with no Nights and no "together" line.
 */
export function withSavedGalleries(chapters, saves) {
  const list = (chapters || []).map((chapter) => ({ ...chapter, savedGalleries: [] }))
  const byKey = new Map(list.map((chapter) => [chapter.key, chapter]))
  const shown = new Set()
  for (const chapter of list) {
    for (const memory of chapter.memories || []) {
      for (const row of memory?.galleries || []) {
        if (positiveGalleryId(row?.id)) shown.add(Number(row.id))
      }
    }
  }
  const savedOnly = []
  for (const save of saves || []) {
    const entry = savedGalleryEntry(save)
    if (!entry || shown.has(entry.id)) continue
    shown.add(entry.id)
    const artist = savedGalleryArtist(save) || { name: 'Artist' }
    const key = artistKey(artist)
    let chapter = byKey.get(key)
    if (!chapter) {
      chapter = {
        key,
        artist: { id: artist.id, name: artist.name, slug: artist.slug, imageUrl: artist.imageUrl || null },
        memories: [],
        nightCount: 0,
        cities: [],
        cityLine: '',
        togetherLine: '',
        sinceLine: '',
        artistPath: artistPathFromMemory({ artist }),
        showYearMarkers: false,
        savedGalleries: [],
        savedOnly: true,
      }
      byKey.set(key, chapter)
      savedOnly.push(chapter)
    }
    chapter.savedGalleries.push(entry)
  }
  return [...list, ...savedOnly]
}
