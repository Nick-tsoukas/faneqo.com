/**
 * Homepage phone wake-up. Tokens live here — do not scatter timings
 * or hero heights in components.
 *
 * Outer phone clip stays fixed. Only the internal artist hero frame shortens.
 *
 * HOME_HERO_WAKE  — desktop hero phone (first section)
 * HOME_HQ_WAKE    — mobile Artist Page mockup ("Your band's headquarters.")
 */

export const HOME_HERO_WAKE_EASE = [0.22, 1, 0.36, 1]

export const HOME_HERO_WAKE = {
  phoneDelay: 0.32,
  phoneDuration: 0.5,
  phoneY: 18,
  phoneScale: 0.985,
  arrivalHeight: 350,
  settledHeight: 240,
  hold: 0.56,
  settleDuration: 0.44,
  titleShift: 10,
  musicOpacityFrom: 0.62,
  musicY: 12,
  musicDuration: 0.32,
  playCueDuration: 0.24,
  clipHeight: 580,
  clipHeightMobile: 620,
  imageScaleFrom: 1,
  imageScaleTo: 1,
  titleOpacityFrom: 1,
}

/**
 * Mobile headquarters mockup. Shorter reserved clip + faster settle so the
 * product (name + featured music) comes into the story sooner.
 * Tweak these — do not hard-code values in the Vue component.
 */
export const HOME_HQ_WAKE = {
  phoneDelay: 0.2,
  phoneDuration: 0.55,
  phoneY: 16,
  phoneScale: 0.985,
  arrivalHeight: 304,
  settledHeight: 208,
  hold: 0.26,
  settleDuration: 0.5,
  titleShift: 8,
  musicOpacityFrom: 0.38,
  musicY: 10,
  musicDuration: 0.3,
  playCueDuration: 0,
  clipHeight: 580,
  clipHeightMobile: 512,
  imageScaleFrom: 1,
  imageScaleTo: 1.04,
  titleOpacityFrom: 0.72,
}

export function homeHeroWakeSettleStart(tokens = HOME_HERO_WAKE) {
  return tokens.phoneDelay + tokens.phoneDuration + tokens.hold
}

export function homeHeroWakeMusicDelay(tokens = HOME_HERO_WAKE) {
  return homeHeroWakeSettleStart(tokens) + 0.08
}

export function homeHeroWakePlayCueDelay(tokens = HOME_HERO_WAKE) {
  return homeHeroWakeSettleStart(tokens) + tokens.settleDuration
}

const instant = { duration: 0 }

export function homeHeroPhoneMotion(reduced, tokens = HOME_HERO_WAKE) {
  if (reduced) {
    return {
      initial: { opacity: 1, y: 0, scale: 1 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: instant,
    }
  }
  return {
    initial: { opacity: 0, y: tokens.phoneY, scale: tokens.phoneScale },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: tokens.phoneDuration,
      ease: HOME_HERO_WAKE_EASE,
      delay: tokens.phoneDelay,
    },
  }
}

export function homeHeroFrameMotion(reduced, compacted, tokens = HOME_HERO_WAKE) {
  const settled = `${tokens.settledHeight}px`
  const arrival = `${tokens.arrivalHeight}px`
  if (reduced) {
    return {
      initial: { height: settled },
      animate: { height: settled },
      transition: instant,
    }
  }
  return {
    initial: { height: arrival },
    animate: { height: compacted ? settled : arrival },
    transition: {
      duration: tokens.settleDuration,
      ease: HOME_HERO_WAKE_EASE,
    },
  }
}

export function homeHeroTitleMotion(reduced, compacted, tokens = HOME_HERO_WAKE) {
  const y = compacted ? -tokens.titleShift : 0
  const opacityFrom = tokens.titleOpacityFrom ?? 1
  if (reduced) {
    return {
      initial: { y: -tokens.titleShift, opacity: 1 },
      animate: { y: -tokens.titleShift, opacity: 1 },
      transition: instant,
    }
  }
  return {
    initial: { y: 0, opacity: opacityFrom },
    animate: { y, opacity: 1 },
    transition: {
      duration: tokens.settleDuration,
      ease: HOME_HERO_WAKE_EASE,
    },
  }
}

export function homeHeroMusicMotion(reduced, tokens = HOME_HERO_WAKE) {
  if (reduced) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: instant,
    }
  }
  return {
    initial: { opacity: tokens.musicOpacityFrom, y: tokens.musicY },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: tokens.musicDuration,
      ease: HOME_HERO_WAKE_EASE,
      delay: homeHeroWakeMusicDelay(tokens),
    },
  }
}

export function homeHeroImageMotion(reduced, compacted, tokens = HOME_HERO_WAKE) {
  const from = tokens.imageScaleFrom ?? 1
  const to = tokens.imageScaleTo ?? 1
  if (reduced) {
    return {
      initial: { scale: to },
      animate: { scale: to },
      transition: instant,
    }
  }
  return {
    initial: { scale: from },
    animate: { scale: compacted ? to : from },
    transition: {
      duration: tokens.settleDuration,
      ease: HOME_HERO_WAKE_EASE,
    },
  }
}
