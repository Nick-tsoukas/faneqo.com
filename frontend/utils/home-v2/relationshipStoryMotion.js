/**
 * Home V2 relationship-story motion tokens.
 * Tune Act 3 here — do not scatter timings in Vue.
 *
 * Desktop labels: arrival → checkin → identity → transfer → keep → hold
 */

export const HOME_V2_STORY_MOTION = {
  /** Desktop Act 3 pin travel as a viewport-height multiple (not a CSS vh). */
  storyScrollVh: 2.8,
  relationshipPinDistance: 3000,
  relationshipScrub: 0.55,
  storyScrollDistance: 3000,
  storyScrub: 0.55,

  checkinPress: 0.1,
  checkinResolve: 0.28,
  checkinDuration: 0.28,
  checkinHold: 0.34,
  checkinSpin: 0.16,

  identityReveal: 0.42,
  identityHold: 0.5,
  sarahReveal: 0.42,
  sarahTransferDuration: 0.62,
  sarahMoveDuration: 0.62,

  fanListEstablish: 0.55,
  surfaceDuration: 0.55,
  countTransition: 0.32,
  fanCountDuration: 0.32,
  rowAccentIn: 0.24,
  rowAccentHold: 0.5,
  finalHold: 1.35,
  settleHold: 1.35,
  payoffDuration: 0.36,
  signalDuration: 0.4,
  arrivalHold: 0.52,

  sarahEase: 'power3.inOut',
  checkinEase: 'power2.out',
  surfaceEase: 'power3.inOut',

  mobileScrollEnd: 'bottom 16%',
  mobileScrollStart: 'top 64%',
}

export const HOME_V2_STORY_SEA = '#45D6A7'
export const HOME_V2_STORY_TEAL = '#23C7C3'
export const HOME_V2_STORY_SEA_DIM = 'rgba(69, 214, 167, 0.38)'
