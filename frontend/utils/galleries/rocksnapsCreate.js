/**
 * Create-page RockSnaps preference.
 *
 * The database default stays false. This only remembers what Pat chose on a
 * draft in this browser. A missing value means ON. Authorization still happens
 * on the server when the gallery is published.
 */

export const ROCKSNAPS_CREATE_PREFIX = 'faneqo:rocksnaps-create:'

export const ROCKSNAPS_AUDIENCE_REASON = 'RockSnaps requires the Everyone audience. You can still publish this gallery on Faneqo.'

export function rocksnapsCreateKey(sessionId) {
  const id = String(sessionId || '').trim()
  return id ? `${ROCKSNAPS_CREATE_PREFIX}${id}` : ''
}

export function readRocksnapsCreatePreference(storage, sessionId) {
  const key = rocksnapsCreateKey(sessionId)
  if (!key || !storage) return true
  try {
    const raw = storage.getItem(key)
    if (raw === '0') return false
    if (raw === '1') return true
  } catch {
    /* Private mode. The in-memory choice still lasts for this visit. */
  }
  return true
}

export function writeRocksnapsCreatePreference(storage, sessionId, on) {
  const key = rocksnapsCreateKey(sessionId)
  if (!key || !storage) return
  try {
    storage.setItem(key, on ? '1' : '0')
  } catch {
    /* The current page still holds the choice. */
  }
}

export function clearRocksnapsCreatePreference(storage, sessionId) {
  const key = rocksnapsCreateKey(sessionId)
  if (!key || !storage) return
  try {
    storage.removeItem(key)
  } catch {
    /* Nothing stored to clear. */
  }
}

/**
 * `visibility` is the audience already saved on the draft.
 * `selectedVisibility` is the radio the artist is looking at, which may not
 * be saved yet. The control follows the radio. Publishing follows both, so a
 * gallery cannot be sent to RockSnaps while the screen says it will not.
 */
export function rocksnapsCreateState({
  eligible = false,
  preference = true,
  visibility = 'public',
  selectedVisibility = visibility,
} = {}) {
  const savedPublic = visibility === 'public'
  const selectedPublic = selectedVisibility === 'public'
  const wanted = preference === true
  const allowed = eligible === true
  return {
    visible: allowed,
    pressed: allowed && wanted && selectedPublic,
    disabled: !allowed || !selectedPublic,
    blockedReason: allowed && !selectedPublic ? ROCKSNAPS_AUDIENCE_REASON : '',
    shouldEnable: allowed && wanted && savedPublic && selectedPublic,
  }
}
