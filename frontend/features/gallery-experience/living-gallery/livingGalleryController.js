/**
 * Headless Living Gallery controller.
 *
 * Future UI
 *   → LivingGalleryController
 *     → LivingGalleryAdapter
 *       → PhotoSwipe
 *
 * No visual styling. PhotoSwipe details stay in the adapter.
 */

import { clampIndex } from '../core/presentationState.js'
import { prefersReducedMotion } from '../effects/reducedMotion.js'
import {
  deriveLivingGalleryCapabilities,
  isStandaloneDisplay,
  isTouchEnvironment,
} from './livingGalleryCapabilities.js'
import { createEmitter, LIVING_GALLERY_EVENT } from './livingGalleryEvents.js'
import { createLivingGalleryFullscreen } from './livingGalleryFullscreen.js'
import { handleLivingGalleryKeydown } from './livingGalleryKeyboard.js'
import {
  buildGallerySharePayload,
  buildPhotoSharePayload,
  canUseNativeShare,
  defaultGalleryShareUrl,
  shareWithFallback,
} from './livingGalleryShare.js'
import { normalizeOpenSource } from './livingGallerySource.js'
import {
  handleThumbnailKeydown,
  neighborIndices,
  shouldShowContactSheet,
  thumbnailItems,
} from './livingGalleryThumbnails.js'

function emptyZoom() {
  return {
    level: 1,
    min: 1,
    max: 1,
    initial: 1,
    isZoomed: false,
    canZoom: false,
    canPan: false,
  }
}

function liveStatus(index, total) {
  const n = Math.max(0, Number(total) || 0)
  if (!n) return ''
  const i = Math.min(n, Math.max(1, (Number(index) || 0) + 1))
  return `Photograph ${i} of ${n}`
}

export function createLivingGalleryController({
  adapter = null,
  history = null,
  fullscreen = null,
  env = {},
  resolveGalleryUrl,
  resolvePhotoUrl,
  onEvent,
} = {}) {
  let bound = adapter
  const emitter = createEmitter()
  if (typeof onEvent === 'function') emitter.subscribe(onEvent)
  const ui = createEmitter()

  const fs = fullscreen || createLivingGalleryFullscreen({
    onChange(value) {
      state.isFullscreen = Boolean(value)
      emitState()
      emit(value ? LIVING_GALLERY_EVENT.FULLSCREEN_ENTER : LIVING_GALLERY_EVENT.FULLSCREEN_EXIT, {
        index: state.activeIndex,
      })
    },
  })

  const state = {
    open: false,
    activeIndex: 0,
    total: 0,
    memories: [],
    night: {},
    chromeOn: false,
    infoOn: false,
    thumbnailsOn: false,
    zoom: emptyZoom(),
    isFullscreen: false,
    source: normalizeOpenSource(),
    decodedCount: 0,
    reducedMotion: Boolean(env.reducedMotion ?? prefersReducedMotion()),
    isTouch: Boolean(env.isTouch ?? isTouchEnvironment()),
    isStandalone: Boolean(env.isStandalone ?? isStandaloneDisplay()),
  }

  function emit(name, payload) {
    emitter.emit(name, payload)
  }

  function emitState() {
    ui.emit('state', getState())
  }

  function envNow() {
    return {
      isTouch: state.isTouch,
      reducedMotion: state.reducedMotion,
      isStandalone: state.isStandalone,
      canFullscreen: fs.canFullscreen(),
      canUseNativeShare: canUseNativeShare(),
    }
  }

  function getState() {
    const capabilities = deriveLivingGalleryCapabilities(state, envNow())
    return {
      open: state.open,
      activeIndex: state.activeIndex,
      total: state.total,
      chromeOn: state.chromeOn,
      infoOn: state.infoOn,
      thumbnailsOn: state.thumbnailsOn,
      zoom: { ...state.zoom },
      zoomState: { ...state.zoom },
      isFullscreen: state.isFullscreen,
      isZoomed: capabilities.isZoomed,
      decodedCount: state.decodedCount,
      liveStatus: liveStatus(state.activeIndex, state.total),
      source: { ...state.source },
      thumbnails: thumbnailItems(state.memories, state.activeIndex),
      neighbors: neighborIndices(state.activeIndex, state.total, 1, 2),
      capabilities,
      night: state.night,
    }
  }

  function syncFromAdapter() {
    if (!bound) return
    if (typeof bound.getIndex === 'function') {
      state.activeIndex = clampIndex(bound.getIndex(), state.total)
    }
    if (typeof bound.getZoomState === 'function') {
      state.zoom = { ...emptyZoom(), ...bound.getZoomState() }
    }
    if (typeof bound.getResourceSnapshot === 'function') {
      const snap = bound.getResourceSnapshot() || {}
      if (Number.isFinite(Number(snap.decoded))) state.decodedCount = Number(snap.decoded)
    }
  }

  function setMemories(list, night = state.night) {
    state.memories = Array.isArray(list) ? list : []
    state.total = state.memories.length
    state.night = night && typeof night === 'object' ? night : {}
    if (!shouldShowContactSheet(state.total) && state.thumbnailsOn) {
      state.thumbnailsOn = false
    }
    emitState()
  }

  function bindAdapter(next) {
    bound = next
  }

  function handleOpened(index, context = {}) {
    state.open = true
    state.activeIndex = clampIndex(index, state.total)
    state.chromeOn = true
    state.infoOn = false
    state.thumbnailsOn = false
    state.source = normalizeOpenSource(context.source || context)
    syncFromAdapter()
    history?.enter?.()
    emit(LIVING_GALLERY_EVENT.OPEN, { index: state.activeIndex, total: state.total })
    emitState()
  }

  function handleClosed(index) {
    const closedIndex = clampIndex(index ?? state.activeIndex, state.total)
    history?.exit?.()
    state.open = false
    state.chromeOn = false
    state.infoOn = false
    state.thumbnailsOn = false
    state.zoom = emptyZoom()
    state.isFullscreen = fs.isFullscreen()
    const returnEl = state.source?.sourceElement
    emit(LIVING_GALLERY_EVENT.CLOSE, { index: closedIndex })
    emitState()
    if (returnEl && typeof returnEl.focus === 'function') {
      try { returnEl.focus() } catch { /* ignore */ }
    }
  }

  function handleIndexChanged(index) {
    const next = clampIndex(index, state.total)
    if (next === state.activeIndex && state.open) {
      syncFromAdapter()
      emitState()
      return
    }
    state.activeIndex = next
    syncFromAdapter()
    emit(LIVING_GALLERY_EVENT.PHOTO_CHANGE, { index: next, total: state.total })
    emitState()
  }

  function handleZoomChanged() {
    const prevLevel = state.zoom.level
    const prevZoomed = state.zoom.isZoomed
    syncFromAdapter()
    if (prevZoomed !== state.zoom.isZoomed || Math.abs(prevLevel - state.zoom.level) > 0.02) {
      emit(LIVING_GALLERY_EVENT.PHOTO_ZOOM, { ...state.zoom, index: state.activeIndex })
    }
    emitState()
  }

  function handleDecoded(count) {
    state.decodedCount = Number(count) || 0
    emitState()
  }

  async function open(list, index = 0, context = {}) {
    if (list) setMemories(list, context.night || state.night)
    const start = clampIndex(index, state.total)
    state.source = normalizeOpenSource(context.source || context)
    await bound?.open?.(state.memories, start, context)
    if (!state.open) handleOpened(start, context)
  }

  function close() {
    if (state.isFullscreen) fs.exit().catch(() => {})
    bound?.close?.()
    if (state.open) handleClosed(state.activeIndex)
  }

  function goTo(index) {
    if (!state.open) return
    const next = clampIndex(index, state.total)
    bound?.goTo?.(next)
  }

  function previous() {
    if (!state.open || state.activeIndex <= 0) return
    if (typeof bound?.prev === 'function') bound.prev()
    else goTo(state.activeIndex - 1)
  }

  function next() {
    if (!state.open || state.activeIndex >= state.total - 1) return
    if (typeof bound?.next === 'function') bound.next()
    else goTo(state.activeIndex + 1)
  }

  function setChrome(on) {
    const next = Boolean(on)
    if (state.chromeOn === next) return
    state.chromeOn = next
    emit(LIVING_GALLERY_EVENT.CHROME_CHANGE, { on: next })
    emitState()
  }

  function setInfo(on) {
    const next = Boolean(on)
    if (state.infoOn === next) return
    state.infoOn = next
    emit(LIVING_GALLERY_EVENT.INFO_CHANGE, { on: next })
    emitState()
  }

  function setThumbnails(on) {
    const next = Boolean(on) && shouldShowContactSheet(state.total)
    if (state.thumbnailsOn === next) return
    state.thumbnailsOn = next
    emit(next ? LIVING_GALLERY_EVENT.THUMBNAIL_OPEN : LIVING_GALLERY_EVENT.THUMBNAIL_CLOSE, {
      index: state.activeIndex,
    })
    emitState()
  }

  function showChrome() { setChrome(true) }
  function hideChrome() { setChrome(false) }
  function toggleChrome() { setChrome(!state.chromeOn) }
  function showInfo() { setInfo(true) }
  function hideInfo() { setInfo(false) }
  function toggleInfo() { setInfo(!state.infoOn) }
  function openThumbnails() { setThumbnails(true) }
  function closeThumbnails() { setThumbnails(false) }
  function toggleThumbnails() { setThumbnails(!state.thumbnailsOn) }

  function hideOverlays() {
    setChrome(false)
    setInfo(false)
    setThumbnails(false)
  }

  function zoomIn() {
    bound?.zoomIn?.()
    handleZoomChanged()
  }

  function zoomOut() {
    bound?.zoomOut?.()
    handleZoomChanged()
  }

  function resetZoom() {
    bound?.resetZoom?.()
    handleZoomChanged()
  }

  function galleryUrl() {
    if (typeof resolveGalleryUrl === 'function') return resolveGalleryUrl(state) || ''
    return defaultGalleryShareUrl()
  }

  function photoUrl() {
    const memory = state.memories[state.activeIndex]
    if (typeof resolvePhotoUrl === 'function') return resolvePhotoUrl(memory, state) || galleryUrl()
    return galleryUrl()
  }

  async function shareCurrentPhoto() {
    const memory = state.memories[state.activeIndex]
    const result = await shareWithFallback(buildPhotoSharePayload({
      night: state.night,
      memory,
      url: photoUrl(),
    }))
    emit(LIVING_GALLERY_EVENT.PHOTO_SHARE, { index: state.activeIndex, ...result })
    return result
  }

  async function shareGallery() {
    const result = await shareWithFallback(buildGallerySharePayload({
      night: state.night,
      url: galleryUrl(),
    }))
    emit(LIVING_GALLERY_EVENT.GALLERY_SHARE, { ...result })
    return result
  }

  async function enterFullscreen(element) {
    if (!envNow().canFullscreen) return false
    const ok = await fs.enter(element)
    state.isFullscreen = fs.isFullscreen()
    emitState()
    return ok
  }

  async function exitFullscreen() {
    const ok = await fs.exit()
    state.isFullscreen = fs.isFullscreen()
    emitState()
    return ok
  }

  async function toggleFullscreen(element) {
    if (state.isFullscreen) return exitFullscreen()
    return enterFullscreen(element)
  }

  function handleKeydown(event, surface = 'photo') {
    if (surface === 'thumbnails') {
      return handleThumbnailKeydown(event, {
        activeIndex: state.activeIndex,
        total: state.total,
        onSelect: goTo,
        onClose: hideOverlays,
      })
    }
    return handleLivingGalleryKeydown(event, surface, {
      close,
      previous,
      next,
      goTo,
      goToLast: () => goTo(state.total - 1),
      zoomIn,
      zoomOut,
      resetZoom,
      hideOverlays,
      hasOverlay: () => state.chromeOn || state.infoOn || state.thumbnailsOn,
    })
  }

  function selectThumbnail(indexOrSource) {
    const source = indexOrSource && typeof indexOrSource === 'object' ? indexOrSource : null
    const index = source ? source.index : indexOrSource
    if (source) {
      state.source = normalizeOpenSource({
        sourceElement: source.thumbnailElement,
        sourceBounds: source.thumbnailBounds,
        sourceMediaId: source.mediaId,
        sourceGalleryId: state.night?.galleryId || state.source?.sourceGalleryId,
        sourceIndex: index,
      })
    }
    goTo(index)
  }

  function destroy() {
    fs.detach()
    emitter.clear()
    ui.clear()
  }

  fs.attach()

  return {
    bindAdapter,
    setMemories,
    getState,
    subscribe: ui.subscribe,
    subscribeEvents: emitter.subscribe,
    handleOpened,
    handleClosed,
    handleIndexChanged,
    handleZoomChanged,
    handleDecoded,
    open,
    close,
    previous,
    next,
    goTo,
    showChrome,
    hideChrome,
    toggleChrome,
    showInfo,
    hideInfo,
    toggleInfo,
    openThumbnails,
    closeThumbnails,
    toggleThumbnails,
    hideOverlays,
    zoomIn,
    zoomOut,
    resetZoom,
    shareCurrentPhoto,
    shareGallery,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    handleKeydown,
    selectThumbnail,
    liveStatus: () => liveStatus(state.activeIndex, state.total),
    destroy,
  }
}
