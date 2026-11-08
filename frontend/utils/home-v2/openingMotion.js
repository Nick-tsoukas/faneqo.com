/**
 * Home V2 opening (hero + headquarters product stage) motion / layout tokens.
 * Tune here — do not scatter timings in Vue templates.
 * /home-v2 only.
 */

export const HOME_V2_OPENING_MOTION = {
  /** Desktop product-stage visible height. */
  stageHeightDesktop: '72vh',
  /** Mobile product-stage visible height. */
  stageHeightMobile: '64vh',
  stageMaxHeightPx: 820,
  /** Stage width as a viewport fraction (clamped by maxWidthPx). */
  stageWidthVw: 76,
  stageMaxWidthPx: 1180,

  /**
   * Page-scroll distance while the stage is pinned,
   * as a MULTIPLE of window.innerHeight (not a CSS vh value).
   * 3.35 → += Math.round(innerHeight * 3.35). Target ~3–4 screens.
   */
  desktopScrollVh: 3.35,
  /** Short mobile pin — not a 4-screen tour. Same unit: innerHeight multiple. */
  mobileScrollVh: 1.15,
  /** ScrollTrigger scrub lag (seconds). */
  scrub: 0.62,

  /** Camera move between chapters (timeline units). */
  chapterMove: 0.88,
  /** Hold after a chapter settles. */
  chapterHold: 0.5,
  cameraEase: 'power1.inOut',

  /**
   * Where a chapter's top should sit inside the clipped stage (0–1).
   */
  sweetSpot: 0.12,
  /**
   * Music camera: top of [data-camera="music"] (Featured Song / Ghost).
   * Lower than sweetSpot so artist identity stays above, Ghost is not clipped.
   */
  musicSpot: 0.6,
  /**
   * Trailing camera runway after Show Mode, as a fraction of stage height.
   * Lets Show Mode reach its measured sweet spot instead of sharing Support's clamped y.
   */
  finalFrameRunway: 0.55,

  /** Hero entrance. */
  heroEyebrow: 0.32,
  heroThought: 0.48,
  heroThoughtStagger: 0.08,
  heroSupport: 0.3,
  heroCta: 0.28,
  heroProduct: 0.52,
  heroSignal: 0.3,
  heroSignalStagger: 0.1,
  heroEase: 'power3.out',

  /** Quiet beat after Show Mode before pin release. */
  handoffHold: 0.55,
}

export const HOME_V2_OPENING_SEA = '#45D6A7'
export const HOME_V2_OPENING_TEAL = '#23C7C3'

/**
 * GSAP sorts higher refreshPriority first.
 * HQ must refresh before Act 3 so its pin-spacer exists when the story measures start.
 */
export const HOME_V2_HQ_REFRESH_PRIORITY = 20
export const HOME_V2_STORY_REFRESH_PRIORITY = 10

/** scrollVh is a viewport-height multiple. 3.35 at 1000px → 3350px, never `3.35vh`. */
export function homeV2PinTravelPx(scrollVh, viewportHeight = 0) {
  return Math.round(Number(viewportHeight) * Number(scrollVh))
}

/**
 * Scroll position where a pin should start (trigger top hits the header).
 * Reads the pin-spacer when present so a live fixed pin cannot corrupt start.
 */
export function homeV2PinStartPx(pinEl, headerPx = 70) {
  if (!pinEl || typeof window === 'undefined') return 0
  const spacer = pinEl.parentElement?.classList?.contains('pin-spacer')
    ? pinEl.parentElement
    : pinEl
  return Math.round(spacer.getBoundingClientRect().top + window.scrollY - headerPx)
}
