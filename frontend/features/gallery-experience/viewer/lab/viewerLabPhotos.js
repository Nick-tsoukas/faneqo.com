/**
 * Real concert photography already in this repo, described honestly.
 *
 * Presentation fixture for the viewer lab. Not Gallery truth, not a schema.
 *
 * Nothing is upscaled, re-cropped or AI-touched. Dimensions are the files'
 * real dimensions, so a composition that looks good here looks good for the
 * same reason in production.
 *
 * Resolution, recorded rather than hidden:
 *   5506×3671 · 3909×2932 · 3264×2448 · 2047×1151 are true high-resolution
 *   frames and stay sharp to 2560.
 *   The seven ~1024px Night frames are the only Night photography in the repo.
 *   They are sharp on a phone and soft on a 27" display. That is source debt,
 *   not a composition defect, and `viewerLayout` refuses to hide it by
 *   enlarging a small negative past what it can carry.
 *   `badflower-hero.webp` is a studio portrait, present only because no
 *   high-resolution portrait Night frame exists. Portrait geometry has to be
 *   judged on something real.
 */

import { normalizeMemory } from '../../core/experienceManifest.js'

/** IPX derivative of a file in `public/`. Real responsive sources, not guesses. */
function ipx(src, width) {
  return `/_ipx/w_${width}${src}`
}

const LADDER = [480, 800, 1280, 1800, 2400, 3200]

function withDerivatives(row) {
  const native = Math.max(1, Number(row.width) || 1)
  const steps = LADDER.filter((w) => w < native)
  const candidates = [
    ...steps.map((w) => ({ src: ipx(row.src, w), width: w })),
    { src: row.src, width: native },
  ]
  return {
    ...row,
    thumbSrc: ipx(row.src, Math.min(480, native)),
    mediumSrc: ipx(row.src, Math.min(1280, native)),
    fullSrc: row.src,
    srcsetCandidates: candidates,
  }
}

const RAW = [
  {
    id: 'pv-01',
    src: '/images/eventone.jpg',
    width: 5506,
    height: 3671,
    alt: 'A festival crowd from the middle of the field, the stage a wall of white light behind smoke',
    caption: 'The room, the second the lights came up.',
  },
  {
    id: 'pv-02',
    src: '/images/eventtwo.jpg',
    width: 3909,
    height: 2932,
    alt: 'Confetti falling through green and magenta beams over a packed arena floor',
    caption: 'Confetti, and not one phone in the front row.',
  },
  {
    id: 'pv-03',
    src: '/images/moondough.jpg',
    width: 2047,
    height: 1151,
    alt: 'A singer in a white coat at the microphone, guitarist behind her in magenta light',
    caption: 'Second song in. She stopped counting bars.',
  },
  {
    id: 'pv-04',
    src: '/labs/gallery-experience/memory-b.jpg',
    width: 910,
    height: 1024,
    alt: 'A singer standing at the edge of the stage in violet light, looking up',
    caption: 'He walked to the edge and waited for them.',
  },
  {
    id: 'pv-05',
    src: '/labs/gallery-experience/memory-c.jpg',
    width: 1023,
    height: 1024,
    alt: 'A singer leaning into the microphone, mouth open, arm tattooed',
    caption: 'A face in the Night.',
  },
  {
    id: 'pv-06',
    src: '/labs/gallery-experience/memory-e.jpg',
    width: 1024,
    height: 682,
    alt: 'A singer in profile against a blown-out projection of his own face',
    caption: 'His own face, ten feet tall, right behind him.',
  },
  {
    id: 'pv-07',
    src: '/labs/gallery-experience/memory-g.jpg',
    width: 938,
    height: 1024,
    alt: 'A bassist holding a white bass up into a beam of red light',
    caption: 'The bass went up and the room went with it.',
  },
  {
    id: 'pv-08',
    src: '/images/eventthree.jpg',
    width: 3264,
    height: 2448,
    alt: 'Hands and silhouettes in front of violet stage lights',
    caption: 'Hands up, all the way to the back.',
  },
  {
    id: 'pv-09',
    src: '/labs/gallery-experience/memory-d.jpg',
    width: 1024,
    height: 731,
    alt: 'A singer holding the microphone out at arm’s length, monitors at his feet',
    caption: 'Between two songs, saying nothing.',
  },
  {
    id: 'pv-10',
    src: '/labs/gallery-experience/memory-f.jpg',
    width: 1024,
    height: 575,
    alt: 'A singer reaching forward off the stage, mouth wide, mic stand empty beside him',
    caption: 'The voice.',
  },
  {
    id: 'pv-11',
    src: '/labs/gallery-experience/memory-a.jpg',
    width: 1024,
    height: 575,
    alt: 'The arena from above: a small stage, a mirror ball, the whole floor lit violet',
    caption: 'The whole arena, all at once.',
  },
  {
    id: 'pv-12',
    src: '/images/homepage/artists/badflower-hero.webp',
    width: 1000,
    height: 1500,
    alt: 'Four musicians standing together against a grey wall before the show',
    caption: 'All four of them, ten minutes before doors.',
  },
]

/**
 * `credit` fills the credit slot with a role, never an invented person, so the
 * two-line foot can be judged without claiming authorship the repo cannot prove.
 */
export function viewerLabPhotos({ count = 12, credit = false } = {}) {
  const base = RAW.map(withDerivatives).map((row, i) => normalizeMemory({
    ...row,
    photographer: credit ? 'Tour photographer' : '',
  }, i))
  if (count <= base.length) return base.slice(0, Math.max(1, count))
  const out = []
  let round = 0
  while (out.length < count) {
    for (const row of base) {
      if (out.length >= count) break
      out.push(round === 0 ? row : { ...row, id: `${row.id}-r${round}` })
    }
    round += 1
  }
  return out
}

export const VIEWER_LAB_COUNT = RAW.length
