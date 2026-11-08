/**
 * Passport lab fixtures. Production components only — no alternate presentation.
 */
import { galleryLabConcertPrints } from './galleryArchiveLab.js'

const ROCKERS = {
  id: 4,
  name: 'The Rockers',
  slug: 'the-rockers',
  imageUrl: '/__dev/band-profile/art.svg',
}

const WILLOWS = {
  id: 8,
  name: 'The Willows',
  slug: 'the-willows',
  imageUrl: '/__dev/band-profile/hero.svg',
}

const HARBOR = {
  id: 11,
  name: 'Harbor Lights',
  slug: 'harbor-lights',
  imageUrl: '/__dev/band-profile/video.svg',
}

const POSTER = {
  url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=900&q=72',
  alternativeText: 'Night poster',
}

const HERO = {
  url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=72',
  alternativeText: 'Night hero',
}

function memory({
  id,
  artist = ROCKERS,
  title,
  venue,
  city,
  region = '',
  date,
  ordinal,
  nightCount,
  cities,
  galleries = [],
  artwork = { url: null, source: 'fallback' },
  night = {},
  photoCount = 0,
} = {}) {
  const galleryCount = galleries.length
  return {
    id,
    attendanceId: id,
    youWereThere: true,
    path: `/fan/passport/nights/${id}`,
    artist,
    show: { title, venue, city, region, date, nightSlug: night.nightSlug || null },
    night: {
      publicStory: night.publicStory || null,
      lineup: night.lineup || [],
      heroUrl: night.heroUrl || null,
      posterUrl: night.posterUrl || null,
      eventImageUrl: night.eventImageUrl || null,
      publicPath: night.nightSlug ? `/${artist.slug}/night/${night.nightSlug}` : null,
    },
    nightMedia: {
      hero: night.heroUrl || null,
      poster: night.posterUrl || null,
      event: night.eventImageUrl || null,
    },
    artwork,
    galleries,
    galleryCount,
    photoCount: photoCount || galleries.reduce((sum, row) => sum + Number(row.photoCount || 0), 0),
    showOrdinal: ordinal || null,
    relationship: {
      nightCount: nightCount || null,
      cities: cities || (city ? [city] : []),
      firstNightDate: date,
      latestNightDate: date,
      showOrdinal: ordinal || null,
    },
    checkedInAt: `${date}T02:00:00.000Z`,
  }
}

function gallery({ id, title, slug, count = 8 } = {}) {
  const media = galleryLabConcertPrints(count)
  return {
    id,
    title,
    slug,
    photoCount: count,
    media,
    preview: { url: media[0]?.url, alt: title },
    sharePath: `/fan/passport/gallery/${id}`,
    locked: false,
  }
}

const galleryNight = memory({
  id: 101,
  title: 'The Rad Spot',
  venue: 'The Rad Spot',
  city: 'Nashville',
  region: 'TN',
  date: '2026-09-07',
  ordinal: 3,
  nightCount: 3,
  cities: ['Nashville', 'Chicago'],
  galleries: [
    gallery({ id: 41, title: 'Backstage', slug: 'backstage', count: 8 }),
    gallery({ id: 42, title: 'After the last song', slug: 'after', count: 5 }),
  ],
  photoCount: 13,
  night: {
    nightSlug: 'the-rad-spot',
    publicStory: 'The room was already loud before they walked on. This one stayed with you.',
    lineup: [
      { name: 'Local Opener', role: 'Opener' },
      { name: 'The Rockers', role: 'Headliner' },
    ],
    posterUrl: POSTER.url,
  },
  artwork: { url: POSTER.url, source: 'night_poster' },
})

const typographyNight = memory({
  id: 102,
  title: 'The Happy Room',
  venue: 'The Happy Room',
  city: 'Chicago',
  region: 'IL',
  date: '2024-09-01',
  ordinal: 2,
  nightCount: 3,
  cities: ['Nashville', 'Chicago'],
})

const posterNight = memory({
  id: 103,
  title: 'fsadfasdfffdsaf',
  venue: 'fdsafdasfadsf',
  city: 'Nashville',
  region: 'TN',
  date: '2026-09-07',
  ordinal: 1,
  nightCount: 3,
  cities: ['Nashville', 'Chicago'],
  artwork: { url: POSTER.url, source: 'night_poster' },
  night: { posterUrl: POSTER.url },
})

const longNight = memory({
  id: 104,
  title: 'A very long night title that should still feel like a memory and not a form field',
  venue: 'The Basement East and the longest room name on the block',
  city: 'Nashville',
  region: 'TN',
  date: '2025-04-18',
  ordinal: 4,
  nightCount: 4,
  cities: ['Nashville'],
})

const rockersThree = [galleryNight, posterNight, typographyNight].map((row, index, list) => ({
  ...row,
  relationship: {
    ...row.relationship,
    nightCount: list.length,
    cities: ['Nashville', 'Chicago'],
    firstNightDate: '2024-09-01',
    latestNightDate: '2026-09-07',
  },
  showOrdinal: [3, 2, 1][index],
}))

function manyNights(count, artist = ROCKERS, startId = 200) {
  return Array.from({ length: count }, (_, index) => memory({
    id: startId + index,
    artist,
    title: index % 4 === 0 ? 'The Rad Spot' : index % 3 === 0 ? 'The Happy Room' : `Night ${count - index}`,
    venue: index % 2 === 0 ? 'The Rad Spot' : 'The Happy Room',
    city: index % 2 === 0 ? 'Nashville' : 'Chicago',
    region: index % 2 === 0 ? 'TN' : 'IL',
    date: `${2024 + Math.floor(index / 8)}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    ordinal: count - index,
    nightCount: count,
    cities: ['Nashville', 'Chicago'],
    galleries: index % 3 === 0 ? [gallery({ id: startId + 800 + index, title: 'From the night', slug: `night-${index}`, count: 6 })] : [],
  }))
}

const fullPublicNight = {
  artist: { name: ROCKERS.name, slug: ROCKERS.slug, image: { url: ROCKERS.imageUrl } },
  night: {
    nightSlug: 'the-rad-spot',
    title: 'The Rad Spot',
    venue: 'The Rad Spot',
    city: 'Nashville',
    date: '2026-09-07',
    publicStory: galleryNight.night.publicStory,
    lineup: galleryNight.night.lineup,
    cover: POSTER,
    hero: HERO,
  },
  viewer: { authenticated: true, youWereThere: true, showOrdinal: 3 },
  galleries: [
    {
      slug: 'backstage',
      title: 'Backstage',
      photoCount: 8,
      media: galleryLabConcertPrints(8),
      canonicalPath: '/the-rockers/gallery/backstage',
    },
  ],
  recordings: [],
  share: {
    canonicalPath: '/the-rockers/night/the-rad-spot',
    title: 'The Rockers in Nashville · Faneqo',
    description: 'The room was already loud before they walked on.',
  },
}

function savedGallery({ id, title, slug, artist, count = 6, venue = '', city = '', youWereThere = false } = {}) {
  const media = galleryLabConcertPrints(count)
  return {
    saveId: id + 9000,
    savedAt: '2026-10-01T12:00:00.000Z',
    sharePath: `/fan/passport/gallery/${id}`,
    gallery: {
      id,
      title,
      slug,
      photoCount: count,
      media,
      locked: false,
      youWereThere,
      band: { id: artist.id, name: artist.name, slug: artist.slug },
      show: { venue, city },
    },
  }
}

const savedRockers = savedGallery({ id: 501, title: 'Soundcheck', slug: 'soundcheck', artist: ROCKERS, venue: 'The Rad Spot', city: 'Nashville', youWereThere: true })
const savedWillows = savedGallery({ id: 502, title: 'Spring tour, Austin', slug: 'spring-austin', artist: WILLOWS, count: 9, venue: 'River Hall', city: 'Austin' })
const savedHarbor = savedGallery({ id: 503, title: 'Harbor Stage', slug: 'harbor-stage', artist: HARBOR, count: 4, city: 'Portland' })

export const PASSPORT_LAB_STATES = [
  'empty',
  'saved-only',
  'saved',
  'one',
  'three',
  'artists',
  'ten',
  'twenty-five',
  'gallery',
  'no-gallery',
  'poster',
  'type',
  'long',
  'ordinal',
  'no-ordinal',
  'detail-full',
  'detail-minimal',
  'loading',
  'error',
]

export function passportLabHomeFixture(state) {
  if (state === 'loading') return { loading: true, memories: [], artistCount: 0 }
  if (state === 'error') return { error: true, memories: [], artistCount: 0 }
  if (state === 'empty') return { memories: [], artistCount: 0 }
  if (state === 'saved-only') return { memories: [], artistCount: 0, savedGalleries: [savedWillows, savedHarbor] }
  if (state === 'saved') {
    return {
      memories: rockersThree,
      artistCount: 1,
      // Already on a Night (41) is not repeated; the rest join or start chapters.
      savedGalleries: [savedRockers, savedWillows, { ...savedRockers, gallery: { ...savedRockers.gallery, id: 41 } }],
    }
  }
  if (state === 'one') {
    return { memories: [rockersThree[1]], artistCount: 1 }
  }
  if (state === 'three' || state === 'gallery' || state === 'no-gallery' || state === 'poster' || state === 'type' || state === 'ordinal') {
    return { memories: rockersThree, artistCount: 1 }
  }
  if (state === 'no-ordinal') {
    return {
      memories: rockersThree.map((row) => ({
        ...row,
        showOrdinal: null,
        relationship: { ...row.relationship, showOrdinal: null },
      })),
      artistCount: 1,
    }
  }
  if (state === 'long') return { memories: [longNight], artistCount: 1 }
  if (state === 'artists') {
    return {
      memories: [
        ...rockersThree,
        memory({
          id: 301,
          artist: WILLOWS,
          title: 'River Hall',
          venue: 'River Hall',
          city: 'Austin',
          region: 'TX',
          date: '2026-03-12',
          ordinal: 1,
          nightCount: 1,
          cities: ['Austin'],
          galleries: [gallery({ id: 77, title: 'From the floor', slug: 'floor', count: 5 })],
        }),
        memory({
          id: 302,
          artist: HARBOR,
          title: 'Late set',
          venue: 'Harbor Stage',
          city: 'Portland',
          region: 'OR',
          date: '2025-11-02',
          ordinal: 2,
          nightCount: 2,
          cities: ['Portland', 'Seattle'],
        }),
        memory({
          id: 303,
          artist: HARBOR,
          title: 'First light',
          venue: 'The Crocodile',
          city: 'Seattle',
          region: 'WA',
          date: '2024-06-20',
          ordinal: 1,
          nightCount: 2,
          cities: ['Portland', 'Seattle'],
        }),
      ],
      artistCount: 3,
    }
  }
  if (state === 'ten') return { memories: manyNights(10), artistCount: 1 }
  if (state === 'twenty-five') return { memories: manyNights(25), artistCount: 1 }
  return { memories: rockersThree, artistCount: 1 }
}

export function passportLabDetailFixture(state) {
  if (state === 'detail-minimal') {
    return {
      memory: typographyNight,
      publicNight: null,
      galleries: [],
    }
  }
  return {
    memory: galleryNight,
    publicNight: fullPublicNight,
    galleries: fullPublicNight.galleries,
  }
}

export function isPassportLabDetail(state) {
  return state === 'detail-full' || state === 'detail-minimal'
}
