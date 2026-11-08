/**
 * Gallery Design Lab fixtures.
 *
 * Original Faneqo SVG stages only. Never loaded by production gallery routes.
 * MediaItems go through normalizeFaneqoMedia — same read contract as 05B.2.
 */

import { normalizeFaneqoMediaList } from '~/utils/media/faneqoMedia'

export const GALLERY_LAB_WIDTHS = [320, 390, 430, 768, 1024, 1280]

export const GALLERY_LAB_FIXTURES = [
  {
    id: 'lab-stage',
    mediaId: 'lab-stage',
    url: '/__dev/gallery/landscape-stage.svg',
    width: 1600,
    height: 1000,
    mime: 'image/svg+xml',
    alt: 'Stage wash, wide',
    caption: 'Cover. First ordered item.',
    order: 0,
  },
  {
    id: 'lab-crowd',
    mediaId: 'lab-crowd',
    url: '/__dev/gallery/portrait-crowd.svg',
    width: 800,
    height: 1000,
    mime: 'image/svg+xml',
    alt: 'Crowd mass, portrait',
    caption: '4:5 field',
    order: 1,
  },
  {
    id: 'lab-mark',
    mediaId: 'lab-mark',
    url: '/__dev/gallery/square-mark.svg',
    width: 800,
    height: 800,
    mime: 'image/svg+xml',
    alt: 'Square mark',
    caption: '1:1',
    order: 2,
  },
  {
    id: 'lab-haze',
    mediaId: 'lab-haze',
    url: '/__dev/gallery/wide-haze.svg',
    width: 1680,
    height: 720,
    mime: 'image/svg+xml',
    alt: 'Haze bar, ultra-wide',
    caption: '21:9',
    order: 3,
  },
  {
    id: 'lab-figure',
    mediaId: 'lab-figure',
    url: '/__dev/gallery/portrait-figure.svg',
    width: 800,
    height: 1200,
    mime: 'image/svg+xml',
    alt: 'Figure, tall portrait',
    caption: '2:3',
    order: 4,
  },
  {
    id: 'lab-room',
    mediaId: 'lab-room',
    url: '/__dev/gallery/landscape-room.svg',
    width: 1200,
    height: 800,
    mime: 'image/svg+xml',
    alt: 'Room, landscape',
    caption: '3:2',
    order: 5,
  },
  {
    id: 'lab-poster',
    mediaId: 'lab-poster',
    url: '/__dev/gallery/poster-field.svg',
    width: 700,
    height: 1000,
    mime: 'image/svg+xml',
    alt: 'Poster field',
    caption: '7:10',
    order: 6,
  },
]

export const GALLERY_LAB_COUNTS = [1, 2, 3, 4, 5, 60]

export function galleryLabItems(count = 7) {
  const n = Math.max(0, Number(count) || 0)
  if (n <= GALLERY_LAB_FIXTURES.length) {
    return normalizeFaneqoMediaList(GALLERY_LAB_FIXTURES.slice(0, n))
  }
  const rows = []
  for (let i = 0; i < n; i += 1) {
    const base = GALLERY_LAB_FIXTURES[i % GALLERY_LAB_FIXTURES.length]
    rows.push({
      ...base,
      id: `${base.id}-${i}`,
      mediaId: `${base.mediaId}-${i}`,
      order: i,
    })
  }
  return normalizeFaneqoMediaList(rows)
}

export function galleryLabSet(name) {
  if (name === 'portrait') {
    return galleryLabItemsFrom(['lab-figure', 'lab-crowd', 'lab-poster'])
  }
  if (name === 'landscape') {
    return galleryLabItemsFrom(['lab-stage', 'lab-room'])
  }
  return galleryLabItemsFrom(['lab-figure', 'lab-stage', 'lab-mark', 'lab-haze'])
}

function galleryLabItemsFrom(ids) {
  const rows = ids.map((id, order) => {
    const base = GALLERY_LAB_FIXTURES.find((row) => row.id === id)
    return { ...base, order }
  })
  return normalizeFaneqoMediaList(rows)
}
