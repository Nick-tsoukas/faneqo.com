/**
 * Photo Viewer → PhotoSwipe adapter.
 *
 * PhotoSwipe v5 owns swipe, pinch, pan, zoom, bounds, momentum and index.
 * We own composition, chrome, and every transition a person can name.
 * Nothing else in the viewer may import PhotoSwipe.
 *
 * The gesture configuration below is carried forward unchanged from the
 * previous viewer (LG-D001): it was validated against a mature benchmark and
 * there is no defect to justify retuning it. What is new here is presentation:
 *
 *   · `initialZoomLevel: 'fit'` — the whole frame, always. A viewer that
 *     silently upscales past fit is cropping a photographer's composition to
 *     flatter its own layout. Softness on a 2560 display is source debt and
 *     should look like source debt.
 *   · `secondaryZoomLevel` targets 1:1 where the source has the pixels, so a
 *     double-click lands on real photograph rather than an arbitrary multiple.
 *   · `arrowKeys: false` — deliberate navigation is a cut, not a slide, and
 *     that decision cannot live inside the library's key handler.
 *
 * THE CUT
 * -------
 * A finger dragging a photograph must move that photograph: touch stays a
 * physical slide, untouched. But a keypress, an edge click or a contact-sheet
 * jump is not a drag — sliding two differently shaped prints past each other
 * for a deliberate choice looks like a carousel, and jumping ten frames looks
 * broken. Those advance through a fast cut: fade the stage down, swap the
 * index with no animation, fade the new print up. Opacity only, on the element
 * PhotoSwipe does not transform, so zoom and pan are never involved.
 */

import { clampIndex } from '../core/presentationState.js'
import { prefersReducedMotion } from '../effects/reducedMotion.js'

/** PhotoSwipe's own chrome is off. Every control in this viewer is ours. */
const HIDDEN_UI = {
  close: false,
  arrowPrev: false,
  arrowNext: false,
  zoom: false,
  counter: false,
  preloader: false,
}

export const CUT_OUT_MS = 155
export const CUT_IN_MS = 240
export const OPEN_MS = 400
export const CLOSE_MS = 290
export const ZOOM_MS = 320

/** Faneqo easing. Settles rather than arrives. */
export const VIEWER_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Never emit a one-candidate srcset. Chrome then reports naturalWidth as the
 * display width and every zoom level is computed from a lie.
 */
export function viewerSrcset(photo) {
  const candidates = Array.isArray(photo?.srcsetCandidates)
    ? photo.srcsetCandidates.filter((row) => row?.src && Number(row.width) > 0)
    : []
  if (candidates.length > 1) {
    return candidates.map((row) => `${row.src} ${Number(row.width)}w`).join(', ')
  }
  if (typeof photo?.srcset === 'string' && photo.srcset.includes(',')) {
    return photo.srcset
  }
  return undefined
}

export function toViewerDataSource(photos) {
  const list = Array.isArray(photos) ? photos : []
  return list.map((photo) => {
    const srcset = viewerSrcset(photo)
    return {
      src: photo.fullSrc || photo.src,
      /*
       * The already-decoded launcher thumbnail. This is what makes an open
       * instant instead of a black hole followed by a photograph.
       */
      msrc: photo.thumbSrc || photo.mediumSrc || photo.src,
      width: photo.width,
      height: photo.height,
      alt: photo.alt || '',
      ...(srcset ? { srcset } : {}),
    }
  })
}

function readZoom(pswp) {
  const slide = pswp?.currSlide
  const levels = slide?.zoomLevels
  if (!slide || !levels) {
    return { level: 1, fit: 1, initial: 1, max: 1, percent: 100, isZoomed: false, canZoom: false }
  }
  const initial = Number(levels.initial) || 1
  const max = Number(levels.max) || 1
  const level = Number(slide.currZoomLevel) || initial
  return {
    level,
    fit: Number(levels.fit) || initial,
    initial,
    max,
    /** Displayed size against the source's own pixels. 100% means 1:1. */
    percent: Math.round(level * 100),
    isZoomed: level > initial + 0.02,
    canZoom: max > initial + 0.04,
  }
}

function readScrollProgress(pswp) {
  const count = pswp?.getNumItems?.() ?? 1
  const index = clampIndex(pswp?.currIndex ?? 0, count)
  const scroll = pswp?.mainScroll
  const width = Number(scroll?.slideWidth) || 0
  if (!scroll || !(width > 0)) {
    return { index, count, shift: 0, dragging: false }
  }
  const delta = Number(scroll.x) - Number(scroll.getCurrSlideX?.() ?? 0)
  return {
    index,
    count,
    shift: delta / width,
    dragging: Boolean(pswp?.gestures?.isDragging),
  }
}

export function createViewerAdapter({
  resolvePadding,
  onOpen,
  onChange,
  onClose,
  onProgress,
  onZoom,
  onCut,
  onSurfaceReady,
  onOpeningStart,
  onOpeningEnd,
  onClosingStart,
  onClosingEnd,
  onTogglePeace,
} = {}) {
  let pswp = null
  let opening = false
  let cutting = false
  let reduced = false
  let raf = 0
  let cutTimer = 0
  let surfaceClass = 'fq-pv'

  function emitProgress() {
    if (!pswp) return
    onProgress?.(readScrollProgress(pswp))
  }

  function tick() {
    raf = 0
    if (!pswp) return
    emitProgress()
    if (pswp.mainScroll?.isShifted?.() || pswp.gestures?.isDragging) {
      raf = requestAnimationFrame(tick)
    }
  }

  function watchShift() {
    if (raf || !pswp) return
    raf = requestAnimationFrame(tick)
  }

  function bind(instance) {
    instance.on('change', () => {
      onChange?.(instance.currIndex, instance)
      emitProgress()
      onZoom?.(readZoom(instance))
    })
    instance.on('moveMainScroll', () => {
      emitProgress()
      watchShift()
    })
    instance.on('pointerMove', watchShift)
    instance.on('pointerUp', () => {
      watchShift()
      onZoom?.(readZoom(instance))
    })
    instance.on('resize', () => {
      emitProgress()
      onZoom?.(readZoom(instance))
    })
    instance.on('zoomPanUpdate', () => onZoom?.(readZoom(instance)))
    instance.on('openingAnimationStart', () => onOpeningStart?.(instance.currIndex, instance))
    instance.on('openingAnimationEnd', () => onOpeningEnd?.(instance.currIndex, instance))
    instance.on('closingAnimationStart', () => onClosingStart?.(instance.currIndex, instance))
    instance.on('closingAnimationEnd', () => onClosingEnd?.(instance.currIndex, instance))
    instance.on('close', () => onClose?.(instance.currIndex))
    instance.on('firstUpdate', () => {
      const root = instance.element
      if (root) root.classList.add(surfaceClass)
      onSurfaceReady?.(root, instance)
    })
    instance.on('destroy', () => {
      if (raf) cancelAnimationFrame(raf)
      if (cutTimer) clearTimeout(cutTimer)
      raf = 0
      cutTimer = 0
      pswp = null
      opening = false
      cutting = false
      onSurfaceReady?.(null, null)
    })
  }

  async function open(photos, index = 0, context = {}) {
    if (typeof window === 'undefined') return null
    const list = Array.isArray(photos) ? photos : []
    if (!list.length || opening) return pswp
    reduced = context.reduced ?? prefersReducedMotion()

    if (pswp) {
      goTo(index, { cut: false })
      return pswp
    }

    opening = true
    surfaceClass = context.surfaceClass || 'fq-pv'
    const { default: PhotoSwipe } = await import('photoswipe')
    const start = clampIndex(index, list.length)
    const hasThumb = typeof context.getThumbBounds === 'function'
    const showHide = reduced ? 'fade' : (hasThumb ? 'zoom' : 'fade')

    const instance = new PhotoSwipe({
      dataSource: toViewerDataSource(list),
      index: start,
      bgOpacity: 1,
      errorMsg: 'This photograph could not be loaded.',
      easing: VIEWER_EASING,

      // ---- physics, carried forward unchanged ----
      spacing: 0.02,
      loop: false,
      pinchToClose: true,
      closeOnVerticalDrag: true,
      wheelToZoom: true,
      /*
       * Escape and focus-return are the library's by default, but a caller
       * that owns dismissal must be able to take them. The canonical gallery
       * does both:
       *
       *  · Escape has to dismiss the most recently summoned layer (contact
       *    sheet, then share, then zoom, then the viewer). PhotoSwipe's own
       *    handler closes the viewer outright, skipping every layer.
       *  · Focus must return to the photograph the fan opened. PhotoSwipe
       *    restores `document.activeElement` as it was at open time, which on
       *    a touch device is usually `<body>` — a tap does not focus a button.
       *    The gallery resolves the real originating frame instead, so the
       *    library's restore would only overwrite a correct answer with a
       *    worse one.
       *
       * Omitting either override keeps the behaviour this viewer shipped with.
       */
      escKey: context.escKey !== false,
      returnFocus: context.returnFocus !== false,
      preload: [1, 2],
      doubleTapAction: 'zoom',
      clickToCloseNonZoomable: false,
      trapFocus: context.trapFocus !== false,

      // ---- ours ----
      arrowKeys: false,
      /*
       * `context.surfaceClass` lets a second viewer take its own namespace so
       * two sets of `.pswp` overrides can never collide in one document.
       */
      mainClass: `${context.surfaceClass || 'fq-pv'} ${context.surfaceClass || 'fq-pv'}--${showHide}`,
      showHideAnimationType: showHide,
      showAnimationDuration: reduced ? 190 : (Number(context.openMs) || OPEN_MS),
      hideAnimationDuration: reduced ? 150 : (Number(context.closeMs) || CLOSE_MS),
      zoomAnimationDuration: reduced ? 0 : ZOOM_MS,

      /*
       * The whole frame. Always.
       *
       * A caller may override these — the canonical gallery does, because
       * PhotoSwipe's `fit` is hard-capped at 1x and therefore strands a small
       * source in the middle of a large stage. Omitting the override keeps
       * the behaviour this viewer shipped with, unchanged.
       */
      initialZoomLevel: context.initialZoomLevel || 'fit',
      secondaryZoomLevel: context.secondaryZoomLevel || ((zoomLevel) => {
        const fit = Number(zoomLevel?.fit) || 1
        // 1:1 when the source actually has the pixels to reward it.
        if (fit < 0.87) return Math.min(1, fit * 4)
        return fit * 2.1
      }),
      maxZoomLevel: context.maxZoomLevel || ((zoomLevel) => {
        const fit = Number(zoomLevel?.fit) || 1
        return Math.max(2.5, fit * 3.2)
      }),

      /*
       * A tap on the photograph clears the screen down to the photograph, and
       * a tap brings the words back. While zoomed it must do nothing — the
       * finger is inspecting the frame, not asking for controls.
       */
      imageClickAction: () => {
        if (readZoom(pswp).isZoomed) return
        onTogglePeace?.()
      },
      tapAction: () => {
        if (readZoom(pswp).isZoomed) return
        onTogglePeace?.()
      },
      bgClickAction: () => onTogglePeace?.(),

      getThumbBoundsFn: hasThumb
        ? (i) => {
          const bounds = context.getThumbBounds(i)
          if (!bounds || !(bounds.w > 0)) return undefined
          return bounds
        }
        : undefined,
      paddingFn: (viewportSize, itemData) => resolvePadding?.(viewportSize, itemData) || {
        top: 0, right: 0, bottom: 0, left: 0,
      },
      ...HIDDEN_UI,
    })

    bind(instance)
    pswp = instance
    instance.init()
    opening = false
    onOpen?.(start, instance)
    emitProgress()
    onZoom?.(readZoom(instance))
    return instance
  }

  /**
   * Deliberate navigation. `cut: false` forces PhotoSwipe's own animated slide,
   * which is what a drag release already uses.
   */
  function goTo(index, { cut = true } = {}) {
    if (!pswp) return
    const count = pswp.getNumItems()
    const target = clampIndex(index, count)
    if (target === pswp.currIndex && !pswp.mainScroll?.isShifted?.()) return
    if (cutting) return

    const jump = () => {
      const diff = target - pswp.potentialIndex
      if (diff === 0) return
      pswp.mainScroll.moveIndexBy(diff, false)
      pswp.appendHeavy?.()
    }

    if (reduced || !cut) {
      jump()
      emitProgress()
      return
    }

    cutting = true
    const root = pswp.element
    root?.classList.add('is-cut')
    onCut?.(true)
    cutTimer = window.setTimeout(() => {
      cutTimer = 0
      if (!pswp) {
        cutting = false
        return
      }
      jump()
      emitProgress()
      // Two frames at zero: the swap must never be a visible flicker.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        pswp?.element?.classList.remove('is-cut')
        onCut?.(false)
        cutting = false
      }))
    }, CUT_OUT_MS)
  }

  function step(direction) {
    if (!pswp) return
    goTo((pswp.currIndex ?? 0) + (direction < 0 ? -1 : 1))
  }

  function toggleZoom() {
    if (!pswp) return
    const zoom = readZoom(pswp)
    const slide = pswp.currSlide
    const point = pswp.getViewportCenterPoint?.()
    const target = zoom.isZoomed ? zoom.initial : (slide?.zoomLevels?.secondary ?? zoom.initial * 2)
    pswp.zoomTo(target, point, reduced ? 0 : ZOOM_MS)
    onZoom?.(readZoom(pswp))
  }

  return {
    open,
    close: () => pswp?.close(),
    goTo,
    prev: () => step(-1),
    next: () => step(1),
    step,
    toggleZoom,
    getIndex: () => pswp?.currIndex ?? 0,
    getZoom: () => readZoom(pswp),
    getImageElement: () => pswp?.currSlide?.content?.element
      || pswp?.element?.querySelector?.('img.pswp__img')
      || null,
    isZoomed: () => readZoom(pswp).isZoomed,
    refresh: () => pswp?.updateSize?.(true),
    getInstance: () => pswp,
    destroy() {
      if (raf) cancelAnimationFrame(raf)
      if (cutTimer) clearTimeout(cutTimer)
      raf = 0
      cutTimer = 0
      if (pswp) {
        pswp.destroy()
        pswp = null
      }
      opening = false
      cutting = false
    },
  }
}
