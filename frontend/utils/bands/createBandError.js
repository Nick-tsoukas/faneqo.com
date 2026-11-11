/**
 * The message an artist sees when POST /api/bands fails.
 *
 * The backend refuses a band beyond the account's creation limit in a route
 * policy (api::band.only-one-band). In production a policy refusal reaches the
 * client as a bare 403 { name: 'ForbiddenError', message: 'Forbidden' }, so the
 * policy's own text never arrives. Translate that refusal into words; any 403
 * that does carry a specific message (for example a future subscription
 * refusal) is shown as sent.
 */
export const BAND_LIMIT_MESSAGE =
  "You've reached the number of artist pages this account can create, so a new one can't be added. " +
  'To help manage another artist, ask them to invite you through Team Access. ' +
  'Need more artist pages? Email pat@faneqo.com.'

const GENERIC_REFUSALS = new Set(['', 'forbidden', 'forbidden access', 'policy failed'])
const LIMIT_TEXT = /only create up to \d+ band/i

export function createBandErrorMessage(err) {
  const status = Number(err?.error?.status ?? err?.status)
  const message = String(err?.error?.message ?? '').trim()

  if (LIMIT_TEXT.test(message)) return BAND_LIMIT_MESSAGE
  if (status === 403 && GENERIC_REFUSALS.has(message.toLowerCase())) return BAND_LIMIT_MESSAGE

  return message || 'Creation failed'
}
