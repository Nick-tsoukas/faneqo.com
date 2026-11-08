/**
 * Fan bottom-nav route rules.
 *
 * Matching is segment-bounded on purpose: `/fans` is the artist-facing fan
 * list, not a fan-account route, and a loose `startsWith('/fan')` put the fan
 * nav on it with no active tab.
 */
import { isImmersiveMessagesPath } from '../messages/messageChrome.js'
import { isFanAuthPath } from './appSurface.js'

const FAN_ROOT = '/fan'

function normalizePath(path) {
  return String(path || '').split('?')[0]
}

/** True only for the fan account section itself. */
export function isFanSectionPath(path) {
  const raw = normalizePath(path)
  return raw === FAN_ROOT || raw === `${FAN_ROOT}/` || raw.startsWith(`${FAN_ROOT}/`)
}

/**
 * Which tab owns this route, or null when none does.
 * Never guess: an unclaimed nested fan route shows no active tab rather than
 * highlighting an unrelated section.
 */
export function fanNavActiveTab(path) {
  const raw = normalizePath(path)
  if (!isFanSectionPath(raw) || isFanAuthPath(raw)) return null
  if (raw === FAN_ROOT || raw === `${FAN_ROOT}/`) return 'artists'
  if (raw === `${FAN_ROOT}/passport` || raw.startsWith(`${FAN_ROOT}/passport/`)) return 'passport'
  if (raw === `${FAN_ROOT}/messages` || raw.startsWith(`${FAN_ROOT}/messages/`)) return 'messages'
  if (raw === `${FAN_ROOT}/profile` || raw.startsWith(`${FAN_ROOT}/profile/`)) return 'profile'
  return null
}

/** Authenticated fan chrome: not on auth surfaces, not over a full-screen thread. */
export function isFanNavVisible(path) {
  const raw = normalizePath(path)
  if (!isFanSectionPath(raw)) return false
  if (isFanAuthPath(raw)) return false
  return !isImmersiveMessagesPath(raw)
}
