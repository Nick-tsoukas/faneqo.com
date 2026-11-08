/**
 * Cybered / Smartlink profile motion language.
 * Cinematic, short, no springs. Messaging tokens stay in motionTokens.js.
 */

export const PROFILE_EASE = [0.22, 1, 0.36, 1]

export const PROFILE_DURATION = {
  fast: 0.14,
  interaction: 0.16,
  section: 0.24,
  identity: 0.36,
  hero: 0.52,
}

export const PROFILE_DELAY = {
  name: 0.09,
  meta: 0.15,
  content: 0.26,
}

export const PROFILE_DISTANCE = {
  nameY: 10,
  metaY: 6,
  contentY: 8,
  sectionY: 12,
}

export const PROFILE_HERO_SCALE = 1.022

export const PROFILE_REVEAL_IN_VIEW = {
  threshold: 0.12,
  rootMargin: '0px 0px -6% 0px',
}

const instant = { duration: 0 }

export function profileHeroImageMotion(reduced) {
  if (reduced) {
    return {
      initial: { opacity: 1, scale: 1 },
      animate: { opacity: 1, scale: 1 },
      transition: instant,
    }
  }
  return {
    initial: { opacity: 0.98, scale: PROFILE_HERO_SCALE },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: PROFILE_DURATION.hero, ease: PROFILE_EASE },
  }
}

export function profileHeroOverlayMotion(reduced) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 0 },
      transition: instant,
    }
  }
  return {
    initial: { opacity: 0.12 },
    animate: { opacity: 0 },
    transition: { duration: PROFILE_DURATION.hero, ease: PROFILE_EASE },
  }
}

export function profileHeroIdentityMotion(reduced) {
  if (reduced) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: instant,
    }
  }
  return {
    initial: { opacity: 0, y: PROFILE_DISTANCE.nameY },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: PROFILE_DURATION.identity,
      ease: PROFILE_EASE,
      delay: PROFILE_DELAY.name,
    },
  }
}

export function profileHeroMetaMotion(reduced) {
  if (reduced) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: instant,
    }
  }
  return {
    initial: { opacity: 0, y: PROFILE_DISTANCE.metaY },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.3,
      ease: PROFILE_EASE,
      delay: PROFILE_DELAY.meta,
    },
  }
}

export function profileFirstContentMotion(reduced) {
  if (reduced) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: instant,
    }
  }
  return {
    initial: { opacity: 0, y: PROFILE_DISTANCE.contentY },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.28,
      ease: PROFILE_EASE,
      delay: PROFILE_DELAY.content,
    },
  }
}

export function profileSectionMotion(reduced, delay = 0) {
  if (reduced) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: instant,
    }
  }
  return {
    initial: { opacity: 0, y: PROFILE_DISTANCE.sectionY },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: PROFILE_DURATION.section,
      ease: PROFILE_EASE,
      delay,
    },
  }
}

export function isReducedMotion(preference) {
  return preference === 'reduce'
}
