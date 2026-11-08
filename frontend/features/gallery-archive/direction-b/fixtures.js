/**
 * DIRECTION B — TOUR CONTACT SHEET fixture matrix. Local lab only.
 *
 * A tour's worth of real concert photography from the gallery-experience lab,
 * in its real native ratios. Never loaded by a production route. Never written
 * anywhere. Direction A's fixtures are deliberately not imported: B has to be
 * judged on a tour, not on a single Night.
 */
import { normalizeFaneqoMediaList } from '../../../utils/media/faneqoMedia.js'

const PLATES = [
  { key: 'a', url: '/labs/gallery-experience/memory-a.jpg', width: 1024, height: 575, alt: 'The arena from above: stage, crowd, a disc of light' },
  { key: 'd', url: '/labs/gallery-experience/memory-d.jpg', width: 1024, height: 731, alt: 'The singer with the microphone raised' },
  { key: 'e', url: '/labs/gallery-experience/memory-e.jpg', width: 1024, height: 682, alt: 'Profile against a blown-out projection of the same face' },
  { key: 'f', url: '/labs/gallery-experience/memory-f.jpg', width: 1024, height: 575, alt: 'The singer in profile, mouth open, reaching forward' },
  { key: 'b', url: '/labs/gallery-experience/memory-b.jpg', width: 910, height: 1024, alt: 'On stage with the singer, violet light on his shoulder' },
  { key: 'g', url: '/labs/gallery-experience/memory-g.jpg', width: 938, height: 1024, alt: 'Bass raised into a beam of red stage light' },
  { key: 'c', url: '/labs/gallery-experience/memory-c.jpg', width: 1023, height: 1024, alt: 'The singer leaning into the microphone' },
]

const SETS = {
  landscape: ['a', 'd', 'e', 'f'],
  portrait: ['b', 'g', 'c', 'a'],
  square: ['c', 'b', 'a', 'g'],
  mixed: ['e', 'b', 'a', 'c', 'f', 'g', 'd'],
  wide: ['f', 'a', 'e', 'd'],
}

function pool(set) {
  const keys = SETS[set] || SETS.mixed
  return keys.map((key) => PLATES.find((plate) => plate.key === key)).filter(Boolean)
}

function photos(count, set = 'mixed') {
  const n = Math.max(0, Math.floor(Number(count) || 0))
  const source = pool(set)
  const rows = Array.from({ length: n }, (_, order) => {
    const base = source[order % source.length]
    return { ...base, id: `${set}-${base.key}-${order}`, mediaId: `${set}-${base.key}-${order}`, order }
  })
  return normalizeFaneqoMediaList(rows)
}

function gallery({
  id,
  title,
  count = 0,
  set = 'mixed',
  media = null,
  visibility = 'public',
  status = 'published',
  night = null,
} = {}) {
  const files = media || photos(count, set)
  return {
    id,
    slug: `dir-b-${id}`,
    title,
    visibility,
    status,
    publishedAt: night?.date || null,
    photoCount: files.length,
    showRecapId: night?.recapId || null,
    eventId: night?.recapId ? night.recapId + 10 : null,
    media: files,
    show: night
      ? {
        showRecapId: night.recapId || null,
        eventId: night.recapId ? night.recapId + 10 : null,
        title: night.venue || night.city || '',
        venue: night.venue || '',
        city: night.city || '',
        date: night.date || null,
      }
      : null,
  }
}

const BROOKLYN = { recapId: 96, city: 'Brooklyn', venue: 'Warsaw', date: '2026-09-07' }
const CHICAGO = { recapId: 88, city: 'Chicago', venue: 'The Rock', date: '2026-09-03' }
const NASHVILLE = { recapId: 71, city: 'Nashville', venue: 'The Basement East', date: '2026-08-24' }
const ATLANTA = { recapId: 64, city: 'Atlanta', venue: 'The Earl', date: '2026-08-19' }
const AUSTIN = { recapId: 55, city: 'Austin', venue: 'Mohawk', date: '2026-07-02' }
const LONG = {
  recapId: 40,
  city: 'Saint-Sauveur-des-Monts',
  venue: 'The Independent Music Hall And Listening Room',
  date: '2025-11-12',
}
const NO_VENUE = { recapId: 34, city: 'Portland', venue: '', date: '2025-10-04' }

function brooklyn() {
  return [
    gallery({ id: 301, title: 'Warsaw, all night', count: 24, set: 'mixed', night: BROOKLYN }),
    gallery({ id: 302, title: 'The room fills', count: 8, set: 'landscape', night: BROOKLYN }),
    gallery({ id: 303, title: 'From the pit', count: 6, set: 'portrait', visibility: 'show_attendees', night: BROOKLYN }),
    gallery({ id: 304, title: 'Backstage', count: 4, set: 'square', visibility: 'fan_list', night: BROOKLYN }),
    gallery({ id: 305, title: 'Load out', count: 3, set: 'landscape', status: 'draft', night: BROOKLYN }),
    gallery({ id: 306, title: 'The last one', count: 1, set: 'portrait', night: BROOKLYN }),
  ]
}

function chicago() {
  return [
    gallery({ id: 311, title: 'The Rock, front to back', count: 14, set: 'landscape', night: CHICAGO }),
    gallery({ id: 312, title: 'After the encore', count: 5, set: 'portrait', visibility: 'show_attendees', night: CHICAGO }),
    gallery({ id: 313, title: 'Merch table', count: 2, set: 'square', visibility: 'fan_list', night: CHICAGO }),
  ]
}

function nashville() {
  return [gallery({ id: 321, title: 'The whole set', count: 9, set: 'portrait', night: NASHVILLE })]
}

function atlanta() {
  return [
    gallery({ id: 331, title: 'Soundcheck to curfew', count: 18, set: 'wide', night: ATLANTA }),
    gallery({ id: 332, title: 'The balcony', count: 7, set: 'square', night: ATLANTA }),
    gallery({ id: 333, title: 'Between songs', count: 5, set: 'portrait', visibility: 'fan_list', night: ATLANTA }),
    gallery({ id: 334, title: 'Curfew', count: 2, set: 'landscape', status: 'draft', night: ATLANTA }),
  ]
}

function austin() {
  return [
    gallery({ id: 341, title: 'Soundcheck', count: 6, set: 'landscape', night: AUSTIN }),
    gallery({ id: 342, title: 'Mohawk, late', count: 11, set: 'mixed', visibility: 'show_attendees', status: 'draft', night: AUSTIN }),
  ]
}

function longNight() {
  return [
    gallery({
      id: 351,
      title: 'A gallery title long enough to prove the sheet never breaks: everything after the second encore',
      count: 7,
      set: 'mixed',
      night: LONG,
    }),
    gallery({ id: 352, title: 'One frame', count: 1, set: 'square', visibility: 'fan_list', night: LONG }),
  ]
}

function noVenueNight() {
  return [gallery({ id: 361, title: 'Portland, the whole night', media: [], night: NO_VENUE })]
}

function loosePrints() {
  return [
    gallery({ id: 401, title: 'Press photos', count: 4, set: 'portrait' }),
    gallery({ id: 402, title: 'Studio, February', count: 6, set: 'landscape', visibility: 'fan_list' }),
    gallery({ id: 403, title: 'Portraits', count: 3, set: 'square' }),
    gallery({ id: 404, title: 'The van', count: 9, set: 'wide' }),
  ]
}

export const DIRECTION_B_STATES = [
  { key: 'tour', label: 'Tour + Loose prints' },
  { key: 'nights', label: 'Nights only' },
  { key: 'night', label: '1 Night / many' },
  { key: 'one', label: '1 Night / 1 gallery' },
  { key: 'two', label: '1 Night / 2 galleries' },
  { key: 'general', label: 'Loose prints only' },
  { key: 'edges', label: 'Long / missing / 1 frame' },
  { key: 'empty', label: 'Empty' },
  { key: 'loading', label: 'Loading' },
  { key: 'error', label: 'Error' },
  { key: 'auth', label: 'No artist access' },
]

export function directionBFixtures(state = 'tour') {
  switch (state) {
    case 'empty':
    case 'loading':
    case 'error':
    case 'auth':
      return []
    case 'night':
      return brooklyn()
    case 'one':
      return nashville()
    case 'two':
      return austin()
    case 'general':
      return loosePrints()
    case 'edges':
      return [...longNight(), ...noVenueNight(), ...nashville()]
    case 'nights':
      return [
        ...brooklyn(),
        ...chicago(),
        ...nashville(),
        ...atlanta(),
        ...austin(),
        ...longNight(),
        ...noVenueNight(),
      ]
    case 'tour':
    default:
      return [
        ...brooklyn(),
        ...chicago(),
        ...nashville(),
        ...atlanta(),
        ...austin(),
        ...longNight(),
        ...noVenueNight(),
        ...loosePrints(),
      ]
  }
}
