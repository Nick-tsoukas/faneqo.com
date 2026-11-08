/**
 * Faneqo messaging motion language.
 * Import these tokens — do not scatter raw durations in components.
 */

export const MOTION_MICRO_S = 0.14
export const MOTION_STANDARD_S = 0.21
export const MOTION_NAVIGATION_S = 0.28

export const motionEase = [0.22, 1, 0.36, 1]

export const motionTokens = {
  micro: {
    duration: MOTION_MICRO_S,
    ease: motionEase,
  },
  standard: {
    duration: MOTION_STANDARD_S,
    ease: motionEase,
  },
  navigation: {
    duration: MOTION_NAVIGATION_S,
    ease: motionEase,
  },
  springSoft: { type: 'spring', stiffness: 380, damping: 32, mass: 0.85 },
  springPress: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  springMessage: { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 },
}

export const motionFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: motionTokens.micro,
}

export const motionMessageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: motionTokens.springMessage,
}

export const motionMessageEnterReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.12 },
}

export const motionPopover = {
  initial: { opacity: 0, y: 4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 2, scale: 0.98 },
  transition: motionTokens.standard,
}

export const motionPaneEnter = {
  initial: { x: 28, opacity: 0.88 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 36, opacity: 0.9 },
  transition: motionTokens.navigation,
}

export const motionListRecede = {
  initial: { x: 0, opacity: 1 },
  animate: { x: -12, opacity: 0.72 },
  exit: { x: 0, opacity: 1 },
  transition: motionTokens.navigation,
}

export function messageEnter(reduced) {
  return reduced ? motionMessageEnterReduced : motionMessageEnter
}

export function popoverMotion(reduced) {
  if (reduced) return motionFade
  return motionPopover
}
