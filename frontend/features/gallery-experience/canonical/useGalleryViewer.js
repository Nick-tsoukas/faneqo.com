/**
 * Gallery viewer state.
 *
 * This composable owns everything that survives a photograph: which one is
 * open, where the overview was, what had focus, whether the chrome is awake,
 * and the single history entry. It owns no gestures and no physics — those
 * belong to PhotoSwipe through the engine adapter — and it owns no markup.
 *
 * CLOSE IS A STATE CHANGE
 * -----------------------
 * `dismiss(reason)` asks `resolveDismissIntent` what a request means, then
 * performs it. The close completes whether or not the History API exists,
 * whether or not the originating frame is still on screen, and whether or not
 * the engine is still alive. Releasing the history entry happens *after* the
 * viewer has closed, and only for the paths that still own it.
 *
 * That ordering is the whole difference between Close and Back.
 */

import { computed, nextTick, onBeforeUnmount, ref, shallowRef } from 'vue'
import { lockOverlayScroll, unlockOverlayScroll } from '../../../utils/ui/overlayScrollLock.js'
import { resolveDismissIntent } from './galleryDismissal.js'
import { createGalleryViewerHistory, resolveDeepLinkedIndex } from './galleryViewerHistory.js'
import { createGalleryPreloader, decodePhoto } from './galleryPreload.js'
import { galleryShareIntents } from './gallerySharePayload.js'

const SCROLL_LOCK_ID = 'canonical-gallery-viewer'

export function useGalleryViewer({
  photos,
  model,
  origin = '',
  /** (index) => HTMLElement — the frame in the wall this photograph came from. */
  resolveFrame,
  reduced,
} = {}) {
  const open = ref(false)
  const index = ref(0)
  const chromeVisible = ref(false)
  const sheetOpen = ref(false)
  const shareOpen = ref(false)
  const zoomed = ref(false)
  const busy = ref(false)

  /** The element that had focus when the viewer opened. Focus goes back here. */
  const returnFocusTo = shallowRef(null)
  const preloader = createGalleryPreloader()

  let history = null

  const list = () => (typeof photos === 'function' ? photos() : photos?.value) || []
  const gallery = () => (typeof model === 'function' ? model() : model?.value) || null
  const isReduced = () => Boolean(typeof reduced === 'function' ? reduced() : reduced?.value)

  const count = computed(() => list().length)
  const photo = computed(() => list()[index.value] || null)
  const canPrev = computed(() => index.value > 0)
  const canNext = computed(() => index.value < count.value - 1)

  const shareIntents = computed(() => galleryShareIntents({
    model: gallery(),
    photo: photo.value,
    origin,
  }))
  const canShare = computed(() => Boolean(shareIntents.value))

  /*
   * ---- chrome: present until the fan asks for the photograph alone ----
   *
   * The controls stay on screen. They never time out on their own: a close
   * that disappears is a close the fan has to go looking for. A deliberate
   * tap on the photograph clears the screen down to the print, a second tap
   * brings the words back, and a zoom hides them because the finger is
   * inspecting the frame.
   */

  function sleepChrome() {
    chromeVisible.value = false
  }

  function wakeChrome() {
    chromeVisible.value = true
  }

  function toggleChrome() {
    if (chromeVisible.value) sleepChrome()
    else wakeChrome()
  }

  /* ---- history: one entry, released only by the paths that own it ---- */

  function ensureHistory() {
    if (history || typeof window === 'undefined') return history
    history = createGalleryViewerHistory({
      onPopClose: () => { dismiss('history-back') },
    })
    history.attach()
    return history
  }

  /* ---- open ---- */

  /**
   * Decode before committing the opening transition where it is cheap to do
   * so. A transition that lands on an undecoded image flashes black at the
   * exact moment the fan is looking hardest.
   */
  async function openAt(at, { decodeFirst = true } = {}) {
    const items = list()
    if (!items.length) return
    const target = Math.min(Math.max(Number(at) || 0, 0), items.length - 1)

    if (typeof document !== 'undefined') {
      returnFocusTo.value = resolveFrame?.(target) || document.activeElement || null
    }

    index.value = target
    if (decodeFirst && !isReduced()) {
      busy.value = true
      await decodePhoto(items[target])
      busy.value = false
    }

    lockOverlayScroll(SCROLL_LOCK_ID)
    open.value = true
    ensureHistory()?.enter(items[target].id)
    preloader.warm(items, target)
    wakeChrome()
  }

  /** Open whatever `#photo-<id>` addresses, or nothing. */
  function openFromHash(hash) {
    const at = resolveDeepLinkedIndex(hash, list())
    if (at == null) return false
    openAt(at, { decodeFirst: false })
    return true
  }

  /* ---- navigate ---- */

  function goTo(at) {
    const items = list()
    if (!items.length) return
    const target = Math.min(Math.max(Number(at) || 0, 0), items.length - 1)
    if (target === index.value) return
    index.value = target
    zoomed.value = false
    // Paging rewrites the entry so Back stays a single press.
    history?.sync(items[target].id)
    preloader.warm(items, target)
    wakeChrome()
  }

  function next() { goTo(index.value + 1) }
  function prev() { goTo(index.value - 1) }

  /* ---- layers ---- */

  function openSheet() {
    sheetOpen.value = true
    wakeChrome()
  }

  function closeSheet() {
    sheetOpen.value = false
    wakeChrome()
  }

  function toggleSheet() {
    if (sheetOpen.value) closeSheet()
    else openSheet()
  }

  function setShareOpen(value) {
    shareOpen.value = Boolean(value)
    wakeChrome()
  }

  function setZoomed(value) {
    zoomed.value = Boolean(value)
    // A zoomed photograph is being inspected, so the words get out of the way.
    if (zoomed.value) sleepChrome()
  }

  /* ---- close ---- */

  /**
   * Give the photograph its focus ring back.
   *
   * This has to wait a tick. The overview is `inert` while a photograph is
   * open, and `open.value = false` only clears that attribute on the next DOM
   * update — focusing an element inside an inert subtree is silently ignored,
   * so restoring synchronously leaves focus on `<body>` and a keyboard fan
   * loses their place in the Night entirely.
   */
  function restoreFocus() {
    const element = returnFocusTo.value
    returnFocusTo.value = null
    if (!element || typeof element.focus !== 'function') return
    nextTick(() => {
      // preventScroll: the scroll lock has already put the page back exactly.
      element.focus({ preventScroll: true })
    })
  }

  /**
   * The single close path. Every dismissal — X, Back, swipe down, Escape —
   * arrives here, and the intent decides what actually happens.
   */
  function dismiss(reason) {
    const intent = resolveDismissIntent({
      reason,
      zoomed: zoomed.value,
      sheetOpen: sheetOpen.value,
      shareOpen: shareOpen.value,
      hasOriginFrame: Boolean(resolveFrame?.(index.value)),
    })

    if (intent.action === 'ignore') return intent
    if (intent.action === 'close-sheet') { closeSheet(); return intent }
    if (intent.action === 'close-share') { setShareOpen(false); return intent }
    if (intent.action === 'reset-zoom') { zoomed.value = false; return intent }
    if (!intent.closesViewer || !open.value) return intent

    // 1. Close. State first, so the close cannot fail part-way.
    open.value = false
    sheetOpen.value = false
    shareOpen.value = false
    zoomed.value = false
    busy.value = false
    sleepChrome()
    preloader.cancel()

    // 2. Put the overview back exactly where it was.
    unlockOverlayScroll(SCROLL_LOCK_ID)

    // 3. Give the photograph its focus ring back.
    restoreFocus()

    // 4. Only now, and only if we still own it, drop our history entry.
    if (intent.releasesHistoryEntry) history?.release()

    return intent
  }

  onBeforeUnmount(() => {
    preloader.destroy()
    history?.detach()
    if (open.value) unlockOverlayScroll(SCROLL_LOCK_ID)
  })

  return {
    // state
    open,
    index,
    photo,
    count,
    canPrev,
    canNext,
    chromeVisible,
    sheetOpen,
    shareOpen,
    zoomed,
    busy,
    shareIntents,
    canShare,
    // open / navigate
    openAt,
    openFromHash,
    goTo,
    next,
    prev,
    // layers
    openSheet,
    closeSheet,
    toggleSheet,
    setShareOpen,
    setZoomed,
    // chrome
    wakeChrome,
    sleepChrome,
    toggleChrome,
    // close
    dismiss,
  }
}
