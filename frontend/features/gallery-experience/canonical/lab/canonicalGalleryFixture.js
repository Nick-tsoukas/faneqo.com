/**
 * Production-SHAPED gallery payloads for the canonical gallery lab.
 *
 * These are not fixtures in the "made-up JSON" sense. Each row is the exact
 * `MediaItem` DTO that `serializeMedia` emits in `qrserver`
 * (`src/utils/artistUpdates/artistUpdatePure.js`), wrapped in the exact public
 * payload that `GET /api/public/bands/:slug/galleries/:slug` returns. So the
 * lab exercises `normalizeGalleryModel` down the same path production does —
 * if the shape drifts, the lab breaks first.
 *
 * The photographs are real files already in `public/`, at their real
 * dimensions, with real IPX derivatives as `formats`. Resolution is recorded
 * rather than hidden: four frames are genuinely high-resolution, and the seven
 * ~1024px Night frames are the only Night photography in this repo. They are
 * sharp on a phone and soft on a 27" display. That is source debt, and it is
 * exactly the case the enlargement rule exists to handle honestly.
 *
 * Not product code. Nothing in the app imports this outside the dev route.
 */

const LADDER = [245, 500, 750, 1000, 1600]

function ipx(src, width) {
  return `/_ipx/w_${width}${src}`
}

/** Mirror Strapi's four named derivatives, sized against the real native file. */
function formatsFor(src, width, height) {
  const native = Math.max(1, width)
  const ratio = height / width
  const keys = ['thumbnail', 'small', 'medium', 'large']
  const out = {}
  LADDER.slice(0, 4).forEach((target, i) => {
    const w = Math.min(target, native)
    out[keys[i]] = { url: ipx(src, w), width: w, height: Math.round(w * ratio) }
  })
  return out
}

function mediaItem(row, order) {
  const formats = formatsFor(row.src, row.width, row.height)
  return {
    type: 'image',
    id: order + 1,
    mediaId: order + 1,
    url: formats.medium.url,
    thumbnailUrl: formats.thumbnail.url,
    thumbUrl: formats.thumbnail.url,
    largeUrl: formats.large.url,
    originalUrl: row.src,
    mime: row.src.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
    width: row.width,
    height: row.height,
    aspectRatio: row.width / row.height,
    order,
    alt: row.alt,
    caption: row.caption,
    protected: false,
    formats,
  }
}

const FRAMES = [
  {
    src: '/images/eventone.jpg',
    width: 5506,
    height: 3671,
    alt: 'A festival crowd from the middle of the field, the stage a wall of white light behind smoke',
    caption: 'The room, the second the lights came up.',
  },
  {
    src: '/labs/gallery-experience/memory-b.jpg',
    width: 910,
    height: 1024,
    alt: 'A singer standing at the edge of the stage in violet light, looking up',
    caption: 'He walked to the edge and waited for them.',
  },
  {
    src: '/images/eventtwo.jpg',
    width: 3909,
    height: 2932,
    alt: 'Confetti falling through green and magenta beams over a packed arena floor',
    caption: 'Confetti, and not one phone in the front row.',
  },
  {
    src: '/labs/gallery-experience/memory-c.jpg',
    width: 1023,
    height: 1024,
    alt: 'A singer leaning into the microphone, mouth open, arm tattooed',
    caption: 'A face in the Night.',
  },
  {
    src: '/images/moondough.jpg',
    width: 2047,
    height: 1151,
    alt: 'A singer in a white coat at the microphone, guitarist behind her in magenta light',
    caption: 'Second song in. She stopped counting bars.',
  },
  {
    src: '/labs/gallery-experience/memory-g.jpg',
    width: 938,
    height: 1024,
    alt: 'A bassist holding a white bass up into a beam of red light',
    caption: 'The bass went up and the room went with it.',
  },
  {
    src: '/labs/gallery-experience/memory-e.jpg',
    width: 1024,
    height: 682,
    alt: 'A singer in profile against a blown-out projection of his own face',
    // Deliberately uncaptioned: the chrome must leave the space, not fill it.
    caption: '',
  },
  {
    src: '/images/eventthree.jpg',
    width: 3264,
    height: 2448,
    alt: 'Hands and silhouettes in front of violet stage lights',
    caption: 'Hands up, all the way to the back.',
  },
  {
    src: '/labs/gallery-experience/memory-d.jpg',
    width: 1024,
    height: 731,
    alt: 'A singer holding the microphone out at arm’s length, monitors at his feet',
    caption: 'Between two songs, saying nothing. The room did the rest — three thousand people holding a note he never sang, while he stood at the lip of the stage with the mic out and let them finish it for him.',
  },
  {
    src: '/images/homepage/artists/badflower-hero.webp',
    width: 1000,
    height: 1500,
    alt: 'Four musicians standing together against a grey wall before the show',
    caption: 'All four of them, ten minutes before doors.',
  },
  {
    src: '/labs/gallery-experience/memory-f.jpg',
    width: 1024,
    height: 575,
    alt: 'A singer reaching forward off the stage, mouth wide, mic stand empty beside him',
    caption: 'The voice.',
  },
  {
    src: '/labs/gallery-experience/memory-a.jpg',
    width: 1024,
    height: 575,
    alt: 'The arena from above: a small stage, a mirror ball, the whole floor lit violet',
    caption: 'The whole arena, all at once.',
  },
]

/** A genuinely low-resolution frame, so the enlargement cap is visible. */
const LOW_RES = {
  src: '/labs/gallery-experience/memory-a.jpg',
  width: 320,
  height: 180,
  alt: 'A low-resolution frame, kept to prove the enlargement cap',
  caption: 'A small negative. The viewer will not pretend otherwise.',
}

const ARTIST_IMAGE = {
  url: ipx('/images/homepage/artists/badflower-hero.webp', 500),
  width: 500,
  height: 750,
  alternativeText: 'Badflower',
  formats: {
    thumbnail: { url: ipx('/images/homepage/artists/badflower-hero.webp', 156), width: 156, height: 234 },
    small: { url: ipx('/images/homepage/artists/badflower-hero.webp', 500), width: 500, height: 750 },
  },
}

function media({ count = 12, lowRes = false, captions = true }) {
  const base = lowRes ? [LOW_RES, ...FRAMES] : FRAMES
  const out = []
  let round = 0
  while (out.length < count) {
    for (const frame of base) {
      if (out.length >= count) break
      out.push(captions ? frame : { ...frame, caption: '' })
    }
    round += 1
  }
  return out.slice(0, count).map(mediaItem)
}

/**
 * The public payload for one gallery, in the backend's exact contract.
 */
export function canonicalGalleryPayload({
  count = 12,
  locked = false,
  visibility = 'public',
  bandImage = true,
  showLinked = true,
  lowRes = false,
  captions = true,
} = {}) {
  const rows = locked ? [] : media({ count, lowRes, captions })
  return {
    artist: {
      id: 3,
      name: 'Badflower',
      slug: 'badflower',
      image: bandImage ? ARTIST_IMAGE : null,
      imageFit: 'auto',
      focalX: 50,
      focalY: 38,
    },
    gallery: {
      slug: 'the-basement-east',
      title: 'The Basement East',
      caption: 'Twelve frames from a loud room, in the order they happened.',
      visibility,
      photoCount: locked ? count : rows.length,
      publishedAt: '2026-03-15T04:12:00.000Z',
      locked,
      lockReason: locked ? 'show_attendees' : null,
      youWereThere: !locked,
      media: rows,
      canonicalPath: '/badflower/gallery/the-basement-east',
    },
    night: showLinked
      ? {
        nightSlug: 'basement-east-2026-03-14',
        title: 'The Basement East',
        venue: 'The Basement East',
        city: 'Nashville',
        region: 'TN',
        performanceStartsAt: '2026-03-14T20:00:00.000Z',
        timezone: 'America/Chicago',
        publicStory: null,
      }
      : null,
    viewer: { authenticated: true, youWereThere: true, showOrdinal: 3, isArtist: false },
    share: {
      canonicalPath: '/badflower/gallery/the-basement-east',
      title: 'Badflower at The Basement East · Nashville',
      description: 'Twelve frames from a loud room, in the order they happened.',
      image: { url: ipx('/images/eventone.jpg', 1000), width: 1000, height: 667 },
    },
  }
}

export const CANONICAL_GALLERY_STATES = [
  { key: '12', label: '12 photographs', options: {} },
  { key: '1', label: '1 photograph', options: { count: 1 } },
  { key: '100', label: '100 photographs', options: { count: 100 } },
  { key: 'nocaption', label: 'No captions', options: { captions: false } },
  { key: 'lowres', label: 'Low-resolution lead', options: { lowRes: true } },
  { key: 'noband', label: 'No band image', options: { bandImage: false } },
  { key: 'noshow', label: 'No linked show', options: { showLinked: false } },
  { key: 'restricted', label: 'Restricted (locked)', options: { locked: true, visibility: 'show_attendees' } },
  { key: 'gated', label: 'Attendee-only, unlocked', options: { visibility: 'show_attendees' } },
  { key: 'empty', label: 'Empty gallery', options: { count: 0 } },
]
