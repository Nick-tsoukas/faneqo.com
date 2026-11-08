import { defaultProductMotion, formatMotionClock, productMotionFilm } from './motion.js'
import { MOTION_EXPORT_HEIGHT, MOTION_EXPORT_WIDTH, MOTION_FPS } from './motionExport.js'
import { PRODUCT_STYLES } from './campaigns.js'

/** Creation categories. Not separate apps, and not a second template registry. */
export const CREATION_LANES = [
  { id: 'posts', label: 'Posts & Ads', lede: 'A still for the feed, a story, or a square.' },
  { id: 'video', label: 'Video & Reels', lede: 'Three films that already play. Story, eleven seconds, silent.' },
  { id: 'carousels', label: 'Carousels', lede: 'Several still scenes. Each one downloads as a PNG.' },
]

const FILM_COPY = {
  page: {
    title: 'Artist page',
    demonstrates: 'One page holding the song, the links, and the fan list.',
  },
  'fan-list': {
    title: 'Fan list',
    demonstrates: 'Followers are not a fan list. The join card is the proof.',
  },
  night: {
    title: 'The night',
    demonstrates: 'A gallery, held as a film.',
  },
}

export function creationLane(value) {
  const id = String(value || '')
  return CREATION_LANES.some((lane) => lane.id === id) ? id : 'posts'
}

/** Posts keep every still family. Carousels keep multi-scene families. Video is a film list, not a family. */
export function laneKeepsFamily(family, lane) {
  const id = creationLane(lane)
  if (id === 'video') return false
  if (id === 'carousels') return Boolean(family?.carousel)
  return !family?.carousel
}

/**
 * The films that already export. Eligibility comes from productMotionFilm,
 * so a style that stays a still never appears here.
 */
export function videoFilms() {
  return PRODUCT_STYLES.map((style) => {
    const film = productMotionFilm({ style: style.id, excerpt: 'page' })
    if (!film || !FILM_COPY[film]) return null
    const motion = defaultProductMotion(style.id)
    return {
      id: film,
      templateId: 'product-showcase',
      style: style.id,
      title: FILM_COPY[film].title,
      demonstrates: FILM_COPY[film].demonstrates,
      durationMs: motion.durationMs,
      durationLabel: formatMotionClock(motion.durationMs),
      format: 'story',
      formatLabel: 'Story 9:16',
      width: MOTION_EXPORT_WIDTH,
      height: MOTION_EXPORT_HEIGHT,
      fps: MOTION_FPS,
      codec: 'H.264',
      audio: false,
    }
  }).filter(Boolean)
}

export function videoFilmByStyle(style) {
  return videoFilms().find((film) => film.style === style) || null
}

/** Turn a new product-showcase creative into the selected film. Story, motion, and the real duration. */
export function applyVideoCreation(creative, style) {
  const film = videoFilmByStyle(style)
  if (!film || !creative) return null
  creative.primaryFormat = film.format
  creative.content = {
    ...(creative.content || {}),
    style: film.style,
    motion: defaultProductMotion(film.style),
  }
  return creative
}
