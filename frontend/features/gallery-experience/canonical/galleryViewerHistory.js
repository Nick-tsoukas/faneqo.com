/**
 * Gallery viewer history — one entry, owned outright.
 *
 * WHY A HASH
 * ----------
 * The open photograph is addressable as `#photo-<mediaId>` on the gallery's
 * own URL. A hash never reaches the server, so it cannot affect SSR, the
 * canonical link, OG tags or authorization, and `stripNavFrom` already drops
 * it from every share/canonical path. That means one mechanism serves both
 * jobs: the viewer's history entry *is* the photograph's deep link.
 *
 * WHY CLOSE IS NOT BACK
 * ---------------------
 * Closing is a state change, not a navigation — see `galleryDismissal.js`.
 * `release()` is cleanup that runs *after* the viewer has already closed, and
 * it pops only the entry this module pushed, verified by both the hash and
 * our own state key. If we do not own the top entry we do nothing, because
 * popping someone else's entry is how a viewer throws a fan off the page.
 *
 * Paging never pushes. It rewrites the current entry with `replaceState`, so
 * a Night of 100 photographs still costs exactly one Back press and Copy Link
 * always reflects the photograph actually on screen.
 *
 * A popstate close must never call `release()` — the browser already spent
 * the entry, and a second pop would leave Faneqo entirely.
 */

/*
 * Deliberately NOT `fqGalleryPhoto`. That key is already owned by
 * `utils/galleries/stackOpenNavigation.js`, where it carries a *numeric photo
 * index* handed to a gallery page by the Gallery Stack. Sharing the key would
 * mean a stack hand-off of index 0 reads as "we do not own this entry" (so X
 * leaves a stale `#photo-` entry behind) while an index of 3 reads as "we do",
 * and `enter()` would overwrite the index with `true` — which the stack then
 * reads back as photo 1. Two meanings, one key, wrong photograph.
 */
export const GALLERY_HISTORY_STATE_KEY = 'fqGalleryViewer'

const HASH_PREFIX = '#photo-'

function token(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
}

/** `#photo-<mediaId>`, or '' when there is nothing addressable. */
export function galleryPhotoHash(photoId) {
  const id = token(photoId)
  return id ? `${HASH_PREFIX}${id}` : ''
}

/** The media id inside a `#photo-…` hash, or '' for any other hash. */
export function readGalleryPhotoHash(hash) {
  const raw = String(hash || '')
  if (!raw.startsWith(HASH_PREFIX)) return ''
  return token(raw.slice(HASH_PREFIX.length))
}

/**
 * Resolve a deep-linked photograph against *already authorized* media only.
 * An unknown or hidden id opens the overview, never a guessed photograph.
 */
export function resolveDeepLinkedIndex(hash, photos) {
  const id = readGalleryPhotoHash(hash)
  if (!id) return null
  const list = Array.isArray(photos) ? photos : []
  const index = list.findIndex((photo) => token(photo?.id) === id)
  return index >= 0 ? index : null
}

export function createGalleryViewerHistory({
  history = typeof window !== 'undefined' ? window.history : null,
  win = typeof window !== 'undefined' ? window : null,
  onPopClose,
} = {}) {
  let pushed = false

  function locationParts() {
    return {
      pathname: win?.location?.pathname || '',
      search: win?.location?.search || '',
      hash: String(win?.location?.hash || ''),
    }
  }

  function urlWithHash(hash) {
    const { pathname, search } = locationParts()
    return `${pathname}${search}${hash || ''}`
  }

  /**
   * We own the top entry only if both our hash and our state key are there.
   * The key must be exactly `true`: an identity check means no other system's
   * value parked on this entry can ever be mistaken for our marker.
   */
  function ownsTopEntry() {
    if (!pushed) return false
    const { hash } = locationParts()
    if (!readGalleryPhotoHash(hash)) return false
    return history?.state?.[GALLERY_HISTORY_STATE_KEY] === true
  }

  function onPopState() {
    if (!pushed) return
    pushed = false
    onPopClose?.()
  }

  function attach() {
    win?.addEventListener?.('popstate', onPopState)
  }

  function detach() {
    win?.removeEventListener?.('popstate', onPopState)
  }

  /**
   * Open. Pushes exactly one entry.
   *
   * When the fan *landed* on a photo hash (a shared deep link), the current
   * entry already carries the hash. We rewrite it back to the bare gallery
   * URL first, then push the photo entry — so Back from a shared photograph
   * lands on that gallery's overview instead of the previous website.
   */
  function enter(photoId) {
    if (!history?.pushState || pushed) return
    const hash = galleryPhotoHash(photoId)
    if (!hash) return
    const landedDeepLinked = Boolean(readGalleryPhotoHash(locationParts().hash))
    if (landedDeepLinked && typeof history.replaceState === 'function') {
      history.replaceState(history.state ?? null, '', urlWithHash(''))
    }
    history.pushState({ ...(history.state || {}), [GALLERY_HISTORY_STATE_KEY]: true }, '', urlWithHash(hash))
    pushed = true
  }

  /** Paging. Rewrites in place so Back stays a single press. */
  function sync(photoId) {
    if (!pushed || typeof history?.replaceState !== 'function') return
    const hash = galleryPhotoHash(photoId)
    if (!hash) return
    history.replaceState(
      { ...(history.state || {}), [GALLERY_HISTORY_STATE_KEY]: true },
      '',
      urlWithHash(hash),
    )
  }

  /**
   * Cleanup after a state-driven close. Never the close itself.
   * Silently does nothing unless we still own the top entry.
   */
  function release() {
    if (!ownsTopEntry()) {
      pushed = false
      return false
    }
    pushed = false
    history.back()
    return true
  }

  return {
    attach,
    detach,
    enter,
    sync,
    release,
    ownsTopEntry,
    isPushed: () => pushed,
  }
}
