/**
 * Create-screen choice for the artist page.
 *
 * A stored 0 or 1 is the artist's choice for this draft. A missing value
 * follows the server: on when nothing is showing, off when something is.
 * An unknown placement defaults off so a failed lookup cannot replace a gallery.
 */

export const ARTIST_PAGE_CREATE_PREFIX = 'faneqo:artist-page-create:'

export const ARTIST_PAGE_SUPPORT = 'Feature this gallery on your main artist page.'

export const ARTIST_PAGE_PUBLIC_REASON = 'Only galleries visible to Everyone can be shown on your artist page.'

export function artistPageCreateKey(sessionId) {
  const id = String(sessionId || '').trim()
  return id ? `${ARTIST_PAGE_CREATE_PREFIX}${id}` : ''
}

export function readArtistPageCreatePreference(storage, sessionId, { hasFeatured = false, unknown = false } = {}) {
  const key = artistPageCreateKey(sessionId)
  if (key && storage) {
    try {
      const raw = storage.getItem(key)
      if (raw === '0') return false
      if (raw === '1') return true
    } catch {
      /* Private mode. The in-memory choice still lasts for this visit. */
    }
  }
  if (unknown) return false
  return hasFeatured !== true
}

export function writeArtistPageCreatePreference(storage, sessionId, on) {
  const key = artistPageCreateKey(sessionId)
  if (!key || !storage) return
  try {
    storage.setItem(key, on ? '1' : '0')
  } catch {
    /* The current page still holds the choice. */
  }
}

/**
 * `visibility` is already saved on the draft.
 * `selectedVisibility` is the radio on screen, which may not be saved yet.
 * Publishing requires both, so the screen cannot promise a placement it will not make.
 */
export function artistPageCreateState({
  loaded = false,
  unknown = false,
  displaysOnArtistPage = true,
  hasFeatured = false,
  featuredTitle = '',
  preference = false,
  visibility = 'public',
  selectedVisibility = visibility,
} = {}) {
  const savedPublic = visibility === 'public'
  const selectedPublic = selectedVisibility === 'public'
  const canShow = displaysOnArtistPage !== false
  const wanted = preference === true
  const name = String(featuredTitle || '').trim() || 'The gallery already on your artist page'
  let help = 'Checking your artist page…'
  if (loaded && !canShow) {
    help = 'This artist page layout can’t show a gallery.'
  } else if (loaded && !selectedPublic) {
    help = ARTIST_PAGE_PUBLIC_REASON
  } else if (loaded && unknown) {
    help = wanted
      ? 'We couldn’t check your artist page. Turning this on shows this gallery there, and replaces one if it is already showing.'
      : 'We couldn’t check your artist page. Turn this on only if you want this gallery to show there.'
  } else if (loaded && hasFeatured) {
    help = wanted
      ? `This will replace ${name} on your artist page.`
      : `${name} is showing on your artist page. Turn this on to replace it.`
  } else if (loaded) {
    help = wanted
      ? 'This gallery will appear on your artist page when you publish.'
      : 'This gallery will not appear on your artist page.'
  }
  return {
    loaded,
    pressed: loaded && canShow && selectedPublic && wanted,
    disabled: !loaded || !canShow || !selectedPublic,
    help,
    supporting: ARTIST_PAGE_SUPPORT,
    shouldFeature: loaded && canShow && wanted && savedPublic && selectedPublic,
  }
}
