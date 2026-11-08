/**
 * Home V2 Act 2 — product theater story config.
 * Edit scene order, copy, and timing here. Do not put story decisions in ScrollTrigger.
 * /home-v2 only. Presentation — no live product APIs.
 */

export const HOME_V2_PRODUCT_SCENES = [
  {
    id: 'music',
    num: '01',
    label: 'Music',
    line: 'Lead with the song.',
    /** Timeline units while this scene is settled (desktop pin). */
    hold: 1,
    /** Timeline units for the transition INTO this scene (ignored for first). */
    enter: 0,
  },
  {
    id: 'video',
    num: '02',
    label: 'Video',
    line: 'Put the artist on screen.',
    hold: 0.88,
    enter: 0.82,
  },
  {
    id: 'fanList',
    num: '03',
    label: 'Fan List',
    line: 'Keep the people who show up.',
    hold: 0.92,
    enter: 0.82,
  },
  {
    id: 'support',
    num: '04',
    label: 'Support',
    line: 'Turn attention into support.',
    hold: 0.72,
    enter: 0.78,
  },
  {
    id: 'showMode',
    num: '05',
    label: 'Show Mode',
    line: 'Meet them at the show.',
    hold: 1.2,
    enter: 0.86,
  },
]

export const HOME_V2_THEATER_MOTION = {
  /** Desktop pin travel as a multiple of window.innerHeight. */
  desktopScrollVh: 3.35,
  scrub: 0.58,
  ease: 'power2.inOut',
  /** Quiet beat after Show Mode before pin release. */
  handoffHold: 0.55,
  /** Desktop incoming scene offset (px). */
  enterY: 28,
  enterScale: 0.985,
  /** Mobile entrance. */
  mobileFromY: 26,
  mobileDuration: 0.62,
}

export function homeV2ProductScenes() {
  return HOME_V2_PRODUCT_SCENES.map((scene, index) => ({
    ...scene,
    num: String(index + 1).padStart(2, '0'),
  }))
}
