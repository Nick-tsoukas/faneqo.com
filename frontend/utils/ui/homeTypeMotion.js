/**
 * Homepage typography motion. Same ease family as Faneqo profile motion.
 * Phrase units only — no word or letter splitting.
 */

export const HOME_TYPE_EASE = [0.22, 1, 0.36, 1]

export const HOME_TYPE_DURATION = {
  phrase: 0.48,
  support: 0.3,
  section: 0.3,
}

export const HOME_TYPE_DELAY = {
  thought2: 0.08,
  support: 0.18,
  visual: 0.06,
  sectionHeading: 0.12,
}

export const HOME_TYPE_DISTANCE = {
  phraseY: 8,
  supportY: 8,
  sectionY: 12,
}

const instant = { duration: 0 }

export function homePhraseMotion(reduced, delay = 0) {
  if (reduced) {
    return {
      initial: { y: 0, opacity: 1 },
      animate: { y: 0, opacity: 1 },
      transition: instant,
    }
  }
  return {
    initial: { y: HOME_TYPE_DISTANCE.phraseY, opacity: 0.92 },
    animate: { y: 0, opacity: 1 },
    transition: {
      duration: HOME_TYPE_DURATION.phrase,
      ease: HOME_TYPE_EASE,
      delay,
    },
  }
}

export function homeSupportMotion(reduced) {
  if (reduced) {
    return {
      initial: { y: 0, opacity: 1 },
      animate: { y: 0, opacity: 1 },
      transition: instant,
    }
  }
  return {
    initial: { y: HOME_TYPE_DISTANCE.supportY, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: {
      duration: HOME_TYPE_DURATION.support,
      ease: HOME_TYPE_EASE,
      delay: HOME_TYPE_DELAY.support,
    },
  }
}

export function homeSectionTypeMotion(reduced, delay = 0) {
  if (reduced) {
    return {
      initial: { y: 0, opacity: 1 },
      animate: { y: 0, opacity: 1 },
      transition: instant,
    }
  }
  return {
    initial: { y: HOME_TYPE_DISTANCE.sectionY, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: {
      duration: HOME_TYPE_DURATION.section,
      ease: HOME_TYPE_EASE,
      delay,
    },
  }
}

export function isHomeTypeReduced(preference) {
  return preference === 'reduce'
}
