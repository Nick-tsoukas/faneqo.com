import { galleryPhotos, productStyle } from './campaigns.js'
import { creationLane } from './creationLanes.js'
import { videoFilmByStyle } from './creationLanes.js'

/**
 * What a person is making. Each subject points at an existing family and,
 * when needed, one existing style. It is not a template and not a renderer.
 */
export const CREATIVE_SUBJECTS = [
  {
    id: 'artist',
    label: 'Artist spotlight',
    line: 'Photograph first. The name is the masthead.',
    lanes: ['posts'],
    pieces: [{ templateId: 'artist-spotlight' }],
  },
  {
    id: 'music',
    label: 'Single release',
    line: 'The song, held as an object.',
    lanes: ['posts'],
    pieces: [{ templateId: 'song-spotlight' }],
  },
  {
    id: 'page',
    label: 'Artist page',
    line: 'The real page, in one frame.',
    lanes: ['posts', 'video'],
    pieces: [{ templateId: 'product-showcase', style: 'page', video: true }],
  },
  {
    id: 'fans',
    label: 'Fan relationships',
    line: 'A list the artist owns.',
    lanes: ['posts', 'video'],
    pieces: [{ templateId: 'product-showcase', style: 'fan-list', video: true, label: 'Fan list' }],
  },
  {
    id: 'shows',
    label: 'Shows & touring',
    line: 'A real date and a room.',
    lanes: ['posts'],
    pieces: [
      { templateId: 'show-promo', label: 'Show poster' },
      { templateId: 'product-showcase', style: 'show', label: 'After the show' },
    ],
  },
  {
    id: 'galleries',
    label: 'Galleries',
    line: 'Photographs from a public gallery.',
    lanes: ['posts', 'video'],
    pieces: [{ templateId: 'product-showcase', style: 'night', video: true, label: 'The night' }],
  },
  {
    id: 'insight',
    label: 'Industry insight',
    line: 'One idea, set like a music publication.',
    lanes: ['posts'],
    pieces: [{ templateId: 'insights' }],
  },
  {
    id: 'education',
    label: 'Education',
    line: 'Several still scenes. One idea at a time.',
    lanes: ['carousels'],
    pieces: [{ templateId: 'education' }],
  },
  {
    id: 'brand',
    label: 'Brand lines',
    line: 'A sentence that holds the frame.',
    lanes: ['posts'],
    pieces: [{ templateId: 'type-statement' }],
  },
]

export function subjectById(id) {
  return CREATIVE_SUBJECTS.find((subject) => subject.id === id) || null
}

export function subjectsForLane(lane) {
  const id = creationLane(lane)
  return CREATIVE_SUBJECTS.filter((subject) => subject.lanes.includes(id))
}

export function pieceKey(piece) {
  return `${piece?.templateId || ''}:${piece?.style || ''}`
}

/** A saved creative still belongs to its template. The subject is only how it was found. */
export function subjectForCreative(creative) {
  const templateId = creative?.templateId
  const style = templateId === 'product-showcase' ? productStyle(creative?.content) : (creative?.content?.style || '')
  const exact = CREATIVE_SUBJECTS.find((subject) => subject.pieces.some((piece) => piece.templateId === templateId && (piece.style || '') === style))
  if (exact) return exact
  return CREATIVE_SUBJECTS.find((subject) => subject.pieces.some((piece) => piece.templateId === templateId && !piece.style)) || null
}

/**
 * Whether this snapshot can carry the piece. A missing date, gallery, or
 * fan list is a warning, not a made-up substitute.
 */
export function pieceReadiness(piece, snapshot) {
  if (!piece || !snapshot) return { ready: true, message: '' }
  if (piece.templateId === 'show-promo' || piece.style === 'show') {
    const show = snapshot.upcomingShows?.[0]
    if (!show) {
      return {
        ready: false,
        message: 'This page has no upcoming show. The poster needs a real date and venue. A date cannot be typed in here yet.',
      }
    }
  }
  if (piece.style === 'night') {
    if (!galleryPhotos(snapshot).length) {
      return {
        ready: false,
        message: 'This page has no public gallery. The night needs those photographs. A profile photo is not a gallery.',
      }
    }
  }
  if (piece.style === 'fan-list' && snapshot.fanList?.enabled === false) {
    return {
      ready: false,
      message: 'Fan list is off on this page. The join card stays hidden until the list is turned on.',
    }
  }
  if (piece.video && !videoFilmByStyle(piece.style)) {
    return { ready: false, message: 'This composition does not export video.' }
  }
  return { ready: true, message: '' }
}
