/**
 * Shared Fan List capture copy.
 * Custom CMS headlines/messages win. Only rewrite known generic defaults.
 */

export const FAN_CAPTURE_DEFAULT_BUTTON = 'Join Fan List'
export const FAN_CAPTURE_DEFAULT_SUCCESS = "You're on the list."
export const FAN_CAPTURE_DEFAULT_MESSAGE =
  'Show updates, new music, and messages from the band.'

const GENERIC_HEADLINES = /^(join the fan list|become an insider|stay close)$/i
const GENERIC_HEADLINE_JOIN_LIST = /^join .+['’]?s? fan list$/i
const GENERIC_BUTTONS = /^(unlock access|become an insider)$/i

const GENERIC_MESSAGES = [
  'get first access to merch drops, show announcements, discounted shows, and exclusive updates.',
  'get exclusive updates and first access to new releases.',
  'get backstage access, exclusive content, early ticket releases, and connect with the band directly. this is where the real magic happens.',
  'get show announcements and exclusive updates.',
  'get show updates, new music, and messages directly from the artist.',
  'get show updates, new music, and messages directly from the band.',
]

function isGenericHeadline(value) {
  const raw = String(value || '').trim()
  if (!raw) return true
  return GENERIC_HEADLINES.test(raw) || GENERIC_HEADLINE_JOIN_LIST.test(raw)
}

function isGenericMessage(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return !normalized || GENERIC_MESSAGES.includes(normalized)
}

export function fanListHeadline(artistName) {
  const name = String(artistName || '').trim()
  return name ? `Stay close to ${name}` : 'Stay close'
}

export function resolveFanCaptureButton(label) {
  const raw = String(label || '').trim()
  if (!raw || GENERIC_BUTTONS.test(raw)) return FAN_CAPTURE_DEFAULT_BUTTON
  return raw
}

export function resolveFanCaptureCopy({ headline, message, artistName, buttonLabel } = {}) {
  return {
    headline: isGenericHeadline(headline) ? fanListHeadline(artistName) : String(headline).trim(),
    message: isGenericMessage(message) ? FAN_CAPTURE_DEFAULT_MESSAGE : String(message).trim(),
    buttonLabel: resolveFanCaptureButton(buttonLabel),
  }
}
