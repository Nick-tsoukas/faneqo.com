/**
 * DIRECTION A — NIGHT JOURNAL fixture matrix. Local lab only.
 *
 * Real concert photography from the gallery-experience lab, in its real native
 * ratios. Never loaded by a production route. Never written anywhere.
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
    slug: `dir-a-${id}`,
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

const CHICAGO = { recapId: 88, city: 'Chicago', venue: 'The Rock', date: '2026-09-03' }
const NASHVILLE = { recapId: 71, city: 'Nashville', venue: 'The Basement East', date: '2026-08-24' }
const AUSTIN = { recapId: 55, city: 'Austin', venue: 'Mohawk', date: '2026-07-02' }
const LONG = {
  recapId: 40,
  city: 'Saint-Sauveur-des-Monts',
  venue: 'The Independent Music Hall And Listening Room',
  date: '2025-11-12',
}
const NO_VENUE = { recapId: 34, city: 'Portland', venue: '', date: '2025-10-04' }
const BIG = { recapId: 96, city: 'Brooklyn', venue: 'Warsaw', date: '2026-09-07' }

function chicagoThree() {
  return [
    gallery({ id: 101, title: 'The Rock, front to back', count: 14, set: 'landscape', night: CHICAGO }),
    gallery({ id: 102, title: 'After the encore', count: 5, set: 'portrait', visibility: 'show_attendees', night: CHICAGO }),
    gallery({ id: 103, title: 'Merch table', count: 2, set: 'square', visibility: 'fan_list', night: CHICAGO }),
  ]
}

function nashvilleOne() {
  return [gallery({ id: 111, title: 'The whole set', count: 9, set: 'portrait', night: NASHVILLE })]
}

function austinTwo() {
  return [
    gallery({ id: 121, title: 'Soundcheck', count: 6, set: 'landscape', night: AUSTIN }),
    gallery({ id: 122, title: 'Mohawk, late', count: 11, set: 'mixed', visibility: 'show_attendees', status: 'draft', night: AUSTIN }),
  ]
}

function longNight() {
  return [
    gallery({
      id: 131,
      title: 'A gallery title long enough to prove the chapter never breaks: everything after the second encore',
      count: 7,
      set: 'mixed',
      night: LONG,
    }),
    gallery({ id: 132, title: 'One frame', count: 1, set: 'square', visibility: 'fan_list', night: LONG }),
  ]
}

function noVenueNight() {
  return [gallery({ id: 141, title: 'Portland, the whole night', media: [], night: NO_VENUE })]
}

function bigNight() {
  return [
    gallery({ id: 151, title: 'Warsaw, all night', count: 24, set: 'mixed', night: BIG }),
    gallery({ id: 152, title: 'The room fills', count: 8, set: 'landscape', night: BIG }),
    gallery({ id: 153, title: 'From the pit', count: 6, set: 'portrait', visibility: 'show_attendees', night: BIG }),
    gallery({ id: 154, title: 'Backstage', count: 4, set: 'square', visibility: 'fan_list', night: BIG }),
    gallery({ id: 155, title: 'Load out', count: 3, set: 'landscape', status: 'draft', night: BIG }),
    gallery({ id: 156, title: 'The last one', count: 1, set: 'portrait', night: BIG }),
  ]
}

function generalGalleries() {
  return [
    gallery({ id: 201, title: 'Press photos', count: 4, set: 'portrait' }),
    gallery({ id: 202, title: 'Artist gallery', count: 6, set: 'landscape' }),
    gallery({ id: 203, title: 'Studio, February', count: 3, set: 'square', visibility: 'fan_list' }),
  ]
}

export const DIRECTION_A_STATES = [
  { key: 'full', label: 'Nights + General' },
  { key: 'empty', label: 'Empty' },
  { key: 'one', label: '1 Night / 1 gallery' },
  { key: 'two', label: '1 Night / 2 galleries' },
  { key: 'three', label: '1 Night / 3 galleries' },
  { key: 'many', label: 'Night with many' },
  { key: 'nights', label: 'Several Nights' },
  { key: 'general', label: 'General only' },
  { key: 'edges', label: 'Long / missing / 1 photo' },
  { key: 'loading', label: 'Loading' },
  { key: 'error', label: 'Error' },
  { key: 'auth', label: 'No artist access' },
]

export function directionAFixtures(state = 'full') {
  switch (state) {
    case 'empty':
    case 'loading':
    case 'error':
    case 'auth':
      return []
    case 'one':
      return nashvilleOne()
    case 'two':
      return austinTwo()
    case 'three':
      return chicagoThree()
    case 'many':
      return bigNight()
    case 'general':
      return generalGalleries()
    case 'edges':
      return [...longNight(), ...noVenueNight()]
    case 'nights':
      return [...chicagoThree(), ...nashvilleOne(), ...austinTwo(), ...longNight()]
    case 'full':
    default:
      return [
        ...bigNight().slice(0, 4),
        ...chicagoThree(),
        ...nashvilleOne(),
        ...austinTwo(),
        ...longNight(),
        ...noVenueNight(),
        ...generalGalleries(),
      ]
  }
}
