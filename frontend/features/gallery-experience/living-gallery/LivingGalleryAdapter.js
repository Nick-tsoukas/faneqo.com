/**
 * LivingGalleryAdapter
 *
 * Faneqo components → this adapter → PhotoSwipe.
 * Do not call PhotoSwipe from product Vue except through this file.
 *
 * PhotoSwipe owns swipe / pinch / pan / zoom / bounds / index / momentum.
 * Faneqo owns composition, Stage, and everything the fan emotionally perceives.
 *
 * Continuous atmosphere
 * ---------------------
 * PhotoSwipe v5 has no documented slide-progress event. It does dispatch
 * `moveMainScroll` through the public `pswp.on()` Eventable API (typed as
 * undocumented). We subscribe to that, plus public `pointerMove` / `change`,
 * and read `mainScroll.x` / `getCurrSlideX()` / `slideWidth`.
 *
 * If `moveMainScroll` ever disappears, pointerMove + rAF while `isShifted()`
 * still produce gesture-coupled progress. Do not patch PhotoSwipe source.
 *
 * Default chrome is disabled via public options (`close: false`, etc.).
 * Context UI is owned by Living Gallery, not PhotoSwipe.
 */

import { clampIndex, STAGE_MODE_BLACK } from '../core/presentationState.js'
import { resolvePhotoPadding } from '../core/photoComposition.js'
import { prefersReducedMotion } from '../effects/reducedMotion.js'

const HIDDEN_UI = {
  close: false,
  arrowPrev: false,
  arrowNext: false,
  zoom: false,
  counter: false,
  preloader: false,
}

/**
 * Never emit a one-candidate srcset. Chrome then reports naturalWidth ≈ display width.
 */
export function photoSwipeSrcset(memory) {
  const candidates = Array.isArray(memory?.srcsetCandidates)
    ? memory.srcsetCandidates.filter((row) => row?.src && Number(row.width) > 0)
    : []
  if (candidates.length > 1) {
    return candidates.map((row) => `${row.src} ${Number(row.width)}w`).join(', ')
  }
  if (typeof memory?.srcset === 'string' && memory.srcset.includes(',')) {
    return memory.srcset
  }
  return undefined
}

export function toPhotoSwipeDataSource(memories) {
  const list = Array.isArray(memories) ? memories : []
  return list.map((memory) => {
    const srcset = photoSwipeSrcset(memory)
    return {
      src: memory.src,
      msrc: memory.thumbSrc || memory.mediumSrc || memory.src,
      width: memory.width,
      height: memory.height,
      alt: memory.alt || '',
      ...(srcset ? { srcset } : {}),
    }
  })
}

export function galleryProgressFromScroll({
  x = 0,
  currSlideX = 0,
  slideWidth = 0,
  currIndex = 0,
  count = 1,
} = {}) {
  const n = Math.max(1, Number(count) || 1)
  const index = clampIndex(currIndex, n)
  const width = Number(slideWidth)
  if (!Number.isFinite(width) || width <= 0) {
    return {
      index,
      indexFloat: index,
      from: index,
      to: index,
      t: 0,
      shift: 0,
      velocity: 0,
      shifted: false,
    }
  }
  const delta = Number(x) - Number(currSlideX)
  const raw = -delta / width
  const toward = raw >= 0 ? 1 : -1
  const mag = Math.min(1, Math.abs(raw))
  const to = clampIndex(index + (mag > 0.001 ? toward : 0), n)
  const from = index
  const t = to === from ? 0 : mag
  return {
    index,
    indexFloat: from + (to - from) * t,
    from,
    to,
    t,
    shift: delta / width,
    velocity: 0,
    shifted: mag > 0.001,
  }
}

function readProgress(pswp) {
  if (!pswp?.mainScroll) {
    return galleryProgressFromScroll({ currIndex: pswp?.currIndex, count: pswp?.getNumItems?.() })
  }
  return galleryProgressFromScroll({
    x: pswp.mainScroll.x,
    currSlideX: pswp.mainScroll.getCurrSlideX?.() ?? 0,
    slideWidth: pswp.mainScroll.slideWidth,
    currIndex: pswp.currIndex,
    count: pswp.getNumItems?.() ?? 1,
  })
}

function readZoomState(pswp) {
  const slide = pswp?.currSlide
  const levels = slide?.zoomLevels
  if (!slide || !levels) {
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
  const initial = Number(levels.initial) || 1
  const min = Number(levels.min ?? levels.fit) || initial
  const max = Number(levels.max) || 1
  const level = Number(slide.currZoomLevel) || initial
  const isZoomed = level > initial + 0.04
  return {
    level,
    min,
    max,
    initial,
    isZoomed,
    canZoom: max > initial + 0.04,
    canPan: isZoomed,
  }
}

function countDecoded(pswp) {
  const n = pswp?.getNumItems?.() ?? 0
  let decoded = 0
  const cached = pswp?.contentLoader?._cachedItems?.length ?? 0
  for (let i = 0; i < n; i += 1) {
    const content = pswp?.contentLoader?.getContentByIndex?.(i)
    if (content && !content.isLoading?.() && !content.isError?.()) decoded += 1
  }
  return { decoded, cached, total: n }
}

export function createLivingGalleryAdapter({
  onOpen,
  onChange,
  onClose,
  onProgress,
  onAtmosphereOpacity,
  onStageHost,
  onToggleChrome,
  onZoom,
  onDecoded,
  onOpeningStart,
  onOpeningEnd,
  onClosingStart,
  onClosingEnd,
} = {}) {
  let pswp = null
  let opening = false
  let reduced = false
  let raf = 0
  let lastKey = ''
  let lastFloat = 0
  let lastTime = 0
  let velocity = 0
  const compose = {
    surroundExtra: 0,
    scaleBias: 1,
    chromeOn: false,
    opticalMode: 'auto',
    opticalOffset: 0,
    stageMode: STAGE_MODE_BLACK,
    // `null` = each photograph earns its own column; `false` = context off.
    // PhotoSwipe must resolve the same composition the chrome does, or the
    // print and its column disagree and editorial type lands on the image.
    editorialBias: null,
    // A gallery of one reserves no room for a contact sheet.
    hasSheet: true,
    safe: { top: 0, right: 0, bottom: 0, left: 0 },
  }

  function emitProgress(force = false) {
    if (!pswp) return
    const progress = readProgress(pswp)
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const dt = Math.max(1, now - (lastTime || now))
    if (lastTime) {
      const v = (progress.indexFloat - lastFloat) / (dt / 1000)
      velocity = Number.isFinite(v) ? velocity * 0.55 + v * 0.45 : 0
    }
    lastFloat = progress.indexFloat
    lastTime = now
    progress.velocity = velocity
    const key = `${progress.from}:${progress.to}:${progress.t.toFixed(4)}:${progress.index}:${progress.shift.toFixed(4)}`
    if (!force && key === lastKey) return
    lastKey = key
    onProgress?.(progress, pswp)
  }

  function emitAtmosphere() {
    if (!pswp) return
    const opacity = Number.isFinite(pswp.bgOpacity) ? pswp.bgOpacity : 1
    onAtmosphereOpacity?.(Math.min(1, Math.max(0, opacity)))
  }

  function tick() {
    raf = 0
    if (!pswp) return
    emitProgress()
    emitAtmosphere()
    if (pswp.mainScroll?.isShifted?.() || pswp.gestures?.isDragging) {
      raf = requestAnimationFrame(tick)
    }
  }

  function startShiftWatch() {
    if (raf || !pswp) return
    raf = requestAnimationFrame(tick)
  }

  function paddingFor(viewportSize, itemData) {
    return resolvePhotoPadding({
      viewportWidth: viewportSize?.x,
      viewportHeight: viewportSize?.y,
      imageWidth: itemData?.width,
      imageHeight: itemData?.height,
      safeTop: compose.safe.top,
      safeRight: compose.safe.right,
      safeBottom: compose.safe.bottom,
      safeLeft: compose.safe.left,
      scaleBias: compose.scaleBias,
      surroundExtra: compose.surroundExtra,
      chromeOn: compose.chromeOn,
      opticalMode: compose.opticalMode,
      opticalOffset: compose.opticalOffset,
      editorialBias: compose.editorialBias,
    hasSheet: compose.hasSheet,
    })
  }

  function applyRootClass(root) {
    if (!root) return
    const staged = compose.stageMode === 'gpu' || compose.stageMode === 'css'
    root.classList.toggle('fq-lg--stage', staged)
    root.classList.toggle('fq-lg--black', !staged)
  }

  function bind(instance) {
    instance.on('change', () => {
      onChange?.(instance.currIndex, instance)
      emitProgress(true)
    })
    instance.on('moveMainScroll', () => {
      emitProgress()
      startShiftWatch()
    })
    instance.on('pointerMove', () => {
      emitProgress()
      startShiftWatch()
    })
    instance.on('verticalDrag', () => emitAtmosphere())
    instance.on('pinchClose', () => emitAtmosphere())
    instance.on('openingAnimationStart', () => {
      emitAtmosphere()
      onOpeningStart?.(instance.currIndex, instance)
    })
    instance.on('openingAnimationEnd', () => {
      emitAtmosphere()
      onOpeningEnd?.(instance.currIndex, instance)
    })
    instance.on('closingAnimationStart', () => {
      onClosingStart?.(instance.currIndex, instance)
    })
    instance.on('closingAnimationEnd', () => {
      onClosingEnd?.(instance.currIndex, instance)
    })
    instance.on('resize', () => {
      emitProgress(true)
      onZoom?.(readZoomState(instance))
    })
    instance.on('pointerUp', () => {
      startShiftWatch()
      onZoom?.(readZoomState(instance))
    })
    instance.on('loadComplete', () => {
      onDecoded?.(countDecoded(instance))
    })
    instance.on('close', () => {
      onClose?.(instance.currIndex)
    })
    instance.on('destroy', () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      pswp = null
      opening = false
      lastKey = ''
      lastTime = 0
      velocity = 0
      onClosingEnd?.(null)
      onStageHost?.(null)
    })
    instance.on('firstUpdate', () => {
      const root = instance.element
      if (!root) return
      applyRootClass(root)
      let host = null
      if (compose.stageMode === 'gpu' || compose.stageMode === 'css') {
        host = document.createElement('div')
        host.className = 'fq-lg-matte-host'
        const before = instance.scrollWrap || root.firstChild
        if (before) root.insertBefore(host, before)
        else root.appendChild(host)
      }
      onStageHost?.(host, root)
    })
  }

  async function open(list, index = 0, context = {}) {
    if (typeof window === 'undefined') return null
    const memories = Array.isArray(list) ? list : []
    if (!memories.length || opening) return pswp
    reduced = context.reduced ?? prefersReducedMotion()
    compose.surroundExtra = Number.isFinite(Number(context.surround)) ? Number(context.surround) : compose.surroundExtra
    compose.scaleBias = Number.isFinite(Number(context.scaleBias)) ? Number(context.scaleBias) : compose.scaleBias
    compose.chromeOn = Boolean(context.chromeOn)
    if (context.opticalMode) compose.opticalMode = context.opticalMode
    if (context.opticalOffset != null) compose.opticalOffset = Number(context.opticalOffset) || 0
    if (context.stageMode) compose.stageMode = context.stageMode
    if (context.editorialBias !== undefined) compose.editorialBias = context.editorialBias
    compose.hasSheet = memories.length > 1
    if (context.safe) compose.safe = { ...compose.safe, ...context.safe }

    if (pswp) {
      const next = clampIndex(index, memories.length)
      if (pswp.currIndex !== next) pswp.goTo(next)
      return pswp
    }

    opening = true
    const { default: PhotoSwipe } = await import('photoswipe')
    const startIndex = clampIndex(index, memories.length)
    const hasThumb = typeof context.getThumbBounds === 'function'
    const showHide = reduced
      ? 'fade'
      : (context.showHide || (hasThumb ? 'zoom' : 'fade'))
    const instance = new PhotoSwipe({
      dataSource: toPhotoSwipeDataSource(memories),
      index: startIndex,
      bgOpacity: 1,
      // A failed photograph must speak in Faneqo's voice, not the library's.
      errorMsg: 'This photograph could not be loaded.',
      spacing: 0.02,
      loop: false,
      pinchToClose: true,
      closeOnVerticalDrag: true,
      wheelToZoom: true,
      escKey: true,
      arrowKeys: true,
      trapFocus: context.trapFocus !== false,
      returnFocus: true,
      preload: [1, 2],
      mainClass: `fq-lg fq-lg--${showHide}`,
      showHideAnimationType: showHide,
      showAnimationDuration: reduced ? 180 : (Number(context.openMs) || 380),
      hideAnimationDuration: reduced ? 140 : (Number(context.closeMs) || 280),
      zoomAnimationDuration: reduced ? 0 : 300,
      initialZoomLevel: (zoomLevel) => {
        const fit = Number(zoomLevel?.fit) || 1
        if (reduced) return fit
        // Image already fills the authored box — do not invent zoom.
        if (fit < 0.99) return fit
        // Small source on a large field: lift presence inside the padded box.
        // Softness is source debt; an empty void is a composition failure.
        return Math.min(1.42, fit * 1.28)
      },
      secondaryZoomLevel: (zoomLevel) => {
        const fit = Number(zoomLevel?.fit) || 1
        const initial = fit < 0.99 ? fit : Math.min(1.42, fit * 1.28)
        if (fit < 0.96) return Math.min(1, fit * 3)
        return Math.min(3, Math.max(initial * 1.8, fit * 2.2))
      },
      maxZoomLevel: (zoomLevel) => {
        const fit = Number(zoomLevel?.fit) || 1
        return Math.max(4, fit * 4)
      },
      imageClickAction: () => {
        const slide = pswp?.currSlide
        if (slide && slide.currZoomLevel > (slide.zoomLevels?.initial ?? 1) + 0.04) return
        onToggleChrome?.()
      },
      bgClickAction: () => onToggleChrome?.(),
      clickToCloseNonZoomable: false,
      tapAction: () => {
        const slide = pswp?.currSlide
        if (slide && slide.currZoomLevel > (slide.zoomLevels?.initial ?? 1) + 0.04) return
        onToggleChrome?.()
      },
      doubleTapAction: 'zoom',
      getThumbBoundsFn: hasThumb
        ? (i) => {
          const bounds = context.getThumbBounds(i)
          if (!bounds || !(bounds.w > 0)) return undefined
          return bounds
        }
        : undefined,
      paddingFn: (viewportSize, itemData) => paddingFor(viewportSize, itemData),
      ...HIDDEN_UI,
    })
    bind(instance)
    pswp = instance
    instance.init()
    opening = false
    onOpen?.(startIndex, instance)
    emitProgress(true)
    emitAtmosphere()
    onZoom?.(readZoomState(instance))
    onDecoded?.(countDecoded(instance))
    return instance
  }

  function close() {
    pswp?.close()
  }

  function goTo(index) {
    if (!pswp) return
    pswp.goTo(clampIndex(index, pswp.getNumItems()))
  }

  function prev() {
    pswp?.prev?.()
  }

  function next() {
    pswp?.next?.()
  }

  function getIndex() {
    return pswp?.currIndex ?? 0
  }

  function getImageElement() {
    return pswp?.currSlide?.content?.element
      || pswp?.element?.querySelector?.('img.pswp__img')
      || null
  }

  function getZoomState() {
    return readZoomState(pswp)
  }

  function zoomTo(level) {
    if (!pswp) return
    const point = pswp.getViewportCenterPoint?.()
    pswp.zoomTo(level, point, reduced ? 0 : 240)
  }

  function zoomIn() {
    const z = readZoomState(pswp)
    const secondary = pswp?.currSlide?.zoomLevels?.secondary ?? Math.min(z.max, Math.max(z.initial * 2.2, 2))
    zoomTo(z.isZoomed ? Math.min(z.max, z.level * 1.35) : secondary)
    onZoom?.(readZoomState(pswp))
  }

  function zoomOut() {
    const z = readZoomState(pswp)
    if (!(z.level > z.initial + 0.02)) return
    zoomTo(Math.max(z.initial, z.level / 1.35))
    onZoom?.(readZoomState(pswp))
  }

  function resetZoom() {
    const z = readZoomState(pswp)
    zoomTo(z.initial)
    onZoom?.(readZoomState(pswp))
  }

  function getResourceSnapshot() {
    const counts = countDecoded(pswp)
    return {
      ...counts,
      index: pswp?.currIndex ?? 0,
      zoom: readZoomState(pswp),
    }
  }

  function setComposition({ surround, scaleBias, safe, chromeOn, stageMode, opticalMode, opticalOffset, editorialBias } = {}) {
    if (editorialBias !== undefined) compose.editorialBias = editorialBias
    if (surround != null) compose.surroundExtra = Math.max(0, Number(surround) || 0)
    if (scaleBias != null) compose.scaleBias = Number(scaleBias)
    if (safe) compose.safe = { ...compose.safe, ...safe }
    if (chromeOn != null) compose.chromeOn = Boolean(chromeOn)
    if (opticalMode) compose.opticalMode = opticalMode
    if (opticalOffset != null) compose.opticalOffset = Number(opticalOffset) || 0
    if (stageMode) compose.stageMode = stageMode
    applyRootClass(pswp?.element)
    pswp?.updateSize?.(true)
  }

  function setSurround(px) {
    setComposition({ surround: px })
  }

  function destroy() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    if (pswp) {
      pswp.destroy()
      pswp = null
    }
    opening = false
  }

  return {
    open,
    close,
    goTo,
    prev,
    next,
    getIndex,
    getImageElement,
    getZoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    getResourceSnapshot,
    setSurround,
    setComposition,
    destroy,
    getInstance: () => pswp,
  }
}
