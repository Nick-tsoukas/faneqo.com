/**
 * Isolated Living Gallery history.
 *
 * Open pushes one hash entry (`#living-gallery`). Back / Android Back close
 * the viewer first. Photo swipes do not push. UI close pops the entry we own.
 *
 * Do not spread Nuxt router state into pushState — that can collapse into the
 * current SPA entry so Back leaves Faneqo instead of closing the viewer.
 *
 * popstate close must not call history.back() again (that would leave Faneqo).
 */

export const LIVING_GALLERY_HISTORY_KEY = 'fqLivingGallery'
export const LIVING_GALLERY_HISTORY_HASH = '#living-gallery'

export function createLivingGalleryHistory({
  history = typeof window !== 'undefined' ? window.history : null,
  win = typeof window !== 'undefined' ? window : null,
  onPopClose,
} = {}) {
  let pushed = false
  let skipNextExit = false

  function currentHash() {
    return String(win?.location?.hash || '')
  }

  function onPopState() {
    if (!pushed) return
    pushed = false
    skipNextExit = true
    onPopClose?.()
  }

  function attach() {
    win?.addEventListener?.('popstate', onPopState)
  }

  function detach() {
    win?.removeEventListener?.('popstate', onPopState)
  }

  function enter() {
    if (!history?.pushState || pushed) return
    history.pushState(
      { [LIVING_GALLERY_HISTORY_KEY]: true },
      '',
      `${win?.location?.pathname || ''}${win?.location?.search || ''}${LIVING_GALLERY_HISTORY_HASH}`,
    )
    pushed = true
  }

  function exit() {
    if (skipNextExit) {
      skipNextExit = false
      return
    }
    if (!pushed) return
    pushed = false
    if (currentHash() === LIVING_GALLERY_HISTORY_HASH) history.back()
  }

  return {
    attach,
    detach,
    enter,
    exit,
    isPushed: () => pushed,
  }
}
