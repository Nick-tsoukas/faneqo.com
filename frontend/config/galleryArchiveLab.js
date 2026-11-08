/**
 * Local-only Gallery archive fixtures. Never used by production routes.
 */
import { normalizeFaneqoMediaList } from '~/utils/media/faneqoMedia'
import { galleryLabItems, galleryLabSet } from './galleryLab.js'

const PHOTO_PRINTS = [
  { id: 'print-crowd', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 933, alt: 'Crowd from the stage' },
  { id: 'print-mic', url: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 1866, alt: 'Cassette and tape' },
  { id: 'print-hands', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 933, alt: 'Hands in the lights' },
  { id: 'print-guitar', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 1750, alt: 'Guitar close' },
  { id: 'print-room', url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 933, alt: 'The room from the back' },
  { id: 'print-smoke', url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 933, alt: 'Smoke and a single figure' },
  { id: 'print-amp', url: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 1750, alt: 'Amp and cables' },
  { id: 'print-exit', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 933, alt: 'After the last song' },
  { id: 'print-bass', url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 1750, alt: 'Crowd under amber lights' },
  { id: 'print-wide', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 933, alt: 'Wide room haze' },
  { id: 'print-kit', url: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 1750, alt: 'Drum kit' },
  { id: 'print-door', url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1400&q=72', width: 1400, height: 933, alt: 'Loading door light' },
]

function photoPrints(count) {
  const n = Math.max(0, Number(count) || 0)
  const rows = Array.from({ length: n }, (_, order) => {
    const base = PHOTO_PRINTS[order % PHOTO_PRINTS.length]
    return {
      ...base,
      id: `${base.id}-${order}`,
      mediaId: `${base.id}-${order}`,
      order,
    }
  })
  return normalizeFaneqoMediaList(rows)
}

function photo(id, count, set) {
  if (set === 'prints' || set === 'long') return photoPrints(count)
  const media = set === 'portrait' || set === 'landscape'
    ? galleryLabSet(set)
    : galleryLabItems(count)
  return media.slice(0, Math.max(0, count))
}

function nightGallery({
  id,
  title,
  count,
  visibility = 'public',
  status = 'published',
  city,
  venue,
  date,
  publishedAt,
  recapId,
  slug,
  set,
  media,
} = {}) {
  const files = media || photo(id, count, set)
  return {
    id,
    slug: slug || `lab-${id}`,
    title,
    visibility,
    status,
    publishedAt: publishedAt || date || null,
    photoCount: files.length,
    showRecapId: recapId || null,
    eventId: recapId ? recapId + 10 : null,
    media: files,
    show: recapId || city || venue || date
      ? {
        showRecapId: recapId || null,
        eventId: recapId ? recapId + 10 : null,
        title: venue || title,
        venue: venue || '',
        city: city || '',
        date: date || null,
      }
      : null,
  }
}

export function galleryArchiveFixtures(variant = 'full') {
  if (variant === 'empty') return []
  if (variant === 'one') {
    return [nightGallery({
      id: 1,
      title: 'Fun Time Last Gallery',
      count: 8,
      visibility: 'public',
      city: 'Chicago',
      venue: 'The Rock',
      date: '2026-09-03',
      recapId: 88,
      set: 'prints',
    })]
  }
  if (variant === 'general') {
    return [
      nightGallery({ id: 11, title: 'Artist gallery', count: 3, visibility: 'public', publishedAt: '2026-09-05' }),
      nightGallery({ id: 12, title: 'Press photos', count: 2, visibility: 'fan_list', set: 'portrait' }),
      nightGallery({
        id: 13,
        title: 'Tour photography with a much longer title than the shelf expects',
        count: 1,
        visibility: 'public',
        set: 'landscape',
      }),
    ]
  }
  /* Every state an artist can actually reach: hidden, draft, a cover the browser
     refuses, a gallery with no media, and each audience. */
  if (variant === 'states') {
    return [
      nightGallery({
        id: 31,
        title: 'Encore',
        count: 6,
        visibility: 'public',
        city: 'Chicago',
        venue: 'The Spot',
        date: '2026-09-05',
        recapId: 91,
        set: 'prints',
      }),
      nightGallery({
        id: 32,
        title: '',
        count: 3,
        visibility: 'show_attendees',
        city: 'Chicago',
        venue: 'The Spot',
        date: '2026-09-05',
        recapId: 91,
        set: 'portrait',
      }),
      nightGallery({
        id: 33,
        title: 'Chicago — Sep 5',
        count: 4,
        visibility: 'fan_list',
        city: 'Chicago',
        venue: 'The Spot',
        date: '2026-09-05',
        recapId: 91,
        set: 'landscape',
      }),
      nightGallery({
        id: 34,
        title: 'Soundcheck',
        count: 2,
        visibility: 'public',
        status: 'hidden',
        city: 'Detroit',
        venue: 'The Loving Touch',
        date: '2026-08-22',
        recapId: 84,
        set: 'prints',
      }),
      nightGallery({
        id: 35,
        title: 'Draft room',
        count: 2,
        visibility: 'public',
        status: 'draft',
        city: 'Detroit',
        venue: 'The Loving Touch',
        date: '2026-08-22',
        recapId: 84,
        set: 'landscape',
      }),
      nightGallery({
        id: 36,
        title: 'Broken cover',
        count: 2,
        visibility: 'public',
        city: 'Austin',
        venue: 'Mohawk',
        date: '2026-07-02',
        recapId: 55,
        media: normalizeFaneqoMediaList([
          { id: 'broken-1', url: 'https://faneqo.invalid/missing-a.jpg', width: 1400, height: 933, alt: '' },
          { id: 'broken-2', url: 'https://faneqo.invalid/missing-b.jpg', width: 1400, height: 933, alt: '' },
        ]),
      }),
      nightGallery({
        id: 37,
        title: 'Missing media',
        count: 0,
        visibility: 'public',
        city: 'Austin',
        venue: 'Mohawk',
        date: '2026-07-02',
        recapId: 55,
        media: [],
      }),
      nightGallery({ id: 38, title: '', count: 3, visibility: 'public', publishedAt: '2026-06-14' }),
      nightGallery({ id: 39, title: 'Press shots', count: 2, visibility: 'fan_list', set: 'portrait' }),
    ]
  }

  return [
    nightGallery({
      id: 1,
      title: 'Fun Time Last Gallery',
      count: 8,
      visibility: 'public',
      city: 'Chicago',
      venue: 'The Rock',
      date: '2026-09-03',
      recapId: 88,
      set: 'prints',
    }),
    nightGallery({
      id: 8,
      title: 'Long tape',
      count: 12,
      visibility: 'public',
      city: 'Chicago',
      venue: 'The Rock',
      date: '2026-09-03',
      recapId: 88,
      set: 'long',
    }),
    nightGallery({
      id: 2,
      title: 'After the encore',
      count: 3,
      visibility: 'show_attendees',
      city: 'Chicago',
      venue: 'The Rock',
      date: '2026-09-03',
      recapId: 88,
      set: 'portrait',
    }),
    nightGallery({
      id: 3,
      title: 'Merch table',
      count: 2,
      visibility: 'fan_list',
      city: 'Chicago',
      venue: 'The Rock',
      date: '2026-09-03',
      recapId: 88,
      set: 'landscape',
    }),
    nightGallery({
      id: 4,
      title: 'The Basement East',
      count: 1,
      visibility: 'public',
      city: 'Nashville',
      venue: 'The Basement East',
      date: '2026-08-24',
      recapId: 71,
      set: 'portrait',
    }),
    nightGallery({
      id: 5,
      title: 'Long venue name that should wrap without breaking the shelf: The Independent Music Hall And Listening Room',
      count: 3,
      visibility: 'show_attendees',
      city: 'A very long city name that keeps going',
      venue: 'The Independent Music Hall And Listening Room',
      date: '2025-11-12',
      recapId: 40,
    }),
    nightGallery({
      id: 6,
      title: 'Draft room',
      count: 2,
      visibility: 'public',
      status: 'draft',
      city: 'Austin',
      venue: 'Mohawk',
      date: '2026-07-02',
      recapId: 55,
      set: 'landscape',
    }),
    nightGallery({
      id: 7,
      title: 'Missing media',
      count: 0,
      visibility: 'public',
      city: 'Chicago',
      venue: 'The Rock',
      date: '2026-09-03',
      recapId: 88,
      media: [],
    }),
    nightGallery({ id: 21, title: 'Artist gallery', count: 3, visibility: 'public', publishedAt: '2026-08-30' }),
    nightGallery({ id: 22, title: 'Press photos', count: 1, visibility: 'fan_list', set: 'portrait' }),
    nightGallery({ id: 23, title: 'Artist gallery', count: 2, visibility: 'public', publishedAt: '2026-06-11', set: 'landscape' }),
  ]
}

export function galleryLabConcertPrints(count = 8) {
  return photoPrints(count)
}

export function galleryArchiveFixtureBySlug(slug) {
  const key = String(slug || '').trim()
  if (!key) return null
  return galleryArchiveFixtures('full').find((item) => item.slug === key) || null
}

export const GALLERY_ARCHIVE_VARIANTS = ['full', 'empty', 'one', 'general', 'states', 'loading', 'error']
