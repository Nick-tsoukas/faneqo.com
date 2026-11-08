/**
 * Home V2 headquarters product stage — GSAP / ScrollTrigger camera tour.
 * Page scroll drives the film transform. The stage never owns scrolling.
 * /home-v2 only. Presentation state only.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  HOME_V2_HQ_REFRESH_PRIORITY,
  HOME_V2_OPENING_MOTION as M,
  homeV2PinStartPx,
  homeV2PinTravelPx,
} from '~/utils/home-v2/openingMotion'
import { homeV2HqChapters } from '~/utils/home-v2/productStageChapters'

let pluginsReady = false

function registerPlugins() {
  if (pluginsReady || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger)
  pluginsReady = true
}

function q(root, sel) {
  return root.querySelector(sel)
}

function qAll(root, sel) {
  return Array.from(root.querySelectorAll(sel))
}

function headerOffset() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height')
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 70
}

function offsetWithinFilm(el, film) {
  return el.getBoundingClientRect().top - film.getBoundingClientRect().top
}

export function measureProductPositions(root, chapters) {
  const film = q(root, '.v2-hq-film')
  const viewport = q(root, '.v2-hq-viewport')
  const positions = {}
  if (!film || !viewport) return positions

  const viewH = viewport.clientHeight
  if (viewH < 8) return positions

  const runway = q(root, '.v2-product-camera-runway')
  if (runway) {
    runway.style.height = `${Math.round(viewH * M.finalFrameRunway)}px`
  }

  const maxY = Math.min(0, viewH - film.scrollHeight)

  for (const chapter of chapters) {
    const camera = chapter.anchor ? film.querySelector(chapter.anchor) : null
    const el = camera || film.querySelector(`[data-chapter="${chapter.id}"]`)
    if (!el) {
      positions[chapter.id] = 0
      continue
    }
    if (chapter.frame === 'origin' || (chapter.frame === 'music' && !camera)) {
      positions[chapter.id] = 0
      continue
    }
    const offset = offsetWithinFilm(el, film)
    const spot = viewH * (chapter.frame === 'music' ? M.musicSpot : M.sweetSpot)
    positions[chapter.id] = Math.max(maxY, Math.min(0, spot - offset))
  }
  return positions
}

function applyChapter(root, index, chapters) {
  qAll(root, '.fq-hq-chapter').forEach((el, i) => {
    el.classList.toggle('is-current', i === index)
    el.classList.toggle('is-past', i < index)
    el.classList.toggle('is-future', i > index)
  })
  qAll(root, '[data-chapter]').forEach((el) => {
    const id = el.getAttribute('data-chapter')
    el.classList.toggle('is-active', chapters[index]?.id === id)
  })
  const line = q(root, '.v2-hq__line')
  if (line && chapters[index]) line.textContent = chapters[index].line
  chapters.forEach((chapter, i) => setEmphasis(root, chapter, i === index))
}

function setEmphasis(root, chapter, on) {
  if (!chapter?.emphasis) return
  qAll(root, chapter.emphasis).forEach((el) => el.classList.toggle('is-emphasis', on))
}

function setupReduced(root) {
  root.classList.add('is-reduced')
  const film = q(root, '.v2-hq-film')
  if (film) gsap.set(film, { y: 0, clearProps: false })
  const chapters = homeV2HqChapters({ desktop: true })
  applyChapter(root, 0, chapters)
}

function buildTour(root, chapters, { pin, scrollVh, id }) {
  const film = q(root, '.v2-hq-film')
  const pinEl = q(root, '.v2-hq-pin')
  const viewport = q(root, '.v2-hq-viewport')
  if (!film || !pinEl || !viewport || !chapters.length) return null

  root.classList.remove('is-reduced')
  const pos = measureProductPositions(root, chapters)
  gsap.set(film, { y: pos[chapters[0].id] || 0, force3D: true })
  applyChapter(root, 0, chapters)

  const remasure = () => {
    Object.assign(pos, measureProductPositions(root, chapters))
  }

  const chap = { n: 0 }
  const tl = gsap.timeline({
    defaults: { ease: M.cameraEase },
    scrollTrigger: {
      id,
      trigger: pinEl,
      start: () => homeV2PinStartPx(pinEl, headerOffset()),
      end: () => `+=${homeV2PinTravelPx(scrollVh, window.innerHeight)}`,
      pin: pin ? pinEl : false,
      pinSpacing: !!pin,
      scrub: M.scrub,
      anticipatePin: pin ? 1 : 0,
      invalidateOnRefresh: true,
      refreshPriority: HOME_V2_HQ_REFRESH_PRIORITY,
      onRefreshInit: remasure,
      onRefresh: remasure,
    },
  })

  chapters.forEach((chapter, index) => {
    tl.addLabel(chapter.id)
    if (index === 0) {
      tl.to(film, { y: () => pos[chapter.id] || 0, duration: 0.2, ease: M.cameraEase })
      tl.to({}, { duration: M.chapterHold * 0.7 })
      return
    }

    tl.to(film, {
      y: () => pos[chapter.id] || 0,
      duration: M.chapterMove,
      ease: M.cameraEase,
    })
    tl.to(chap, {
      n: index,
      duration: 0.18,
      ease: 'none',
      onUpdate: () => applyChapter(root, Math.round(chap.n), chapters),
    }, '<')
    tl.to({}, { duration: M.chapterHold })
  })

  tl.addLabel('handoff')
  tl.to({}, { duration: M.handoffHold })
  return tl
}

export function useHomeV2ProductStage(rootRef) {
  registerPlugins()
  const root = rootRef?.value || rootRef
  if (!root || typeof window === 'undefined') return () => {}

  const mm = gsap.matchMedia()
  mm.add(
    {
      isDesktop: '(min-width: 1024px)',
      isMobile: '(max-width: 1023px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { isDesktop, reduceMotion } = context.conditions
      if (reduceMotion) {
        setupReduced(root)
        return () => root.classList.remove('is-reduced')
      }

      const chapters = homeV2HqChapters({ desktop: !!isDesktop })
      const film = q(root, '.v2-hq-film')
      buildTour(root, chapters, {
        pin: true,
        scrollVh: isDesktop ? M.desktopScrollVh : M.mobileScrollVh,
        id: isDesktop ? 'home-v2-hq-desktop' : 'home-v2-hq-mobile',
      })

      let dead = false
      const refresh = () => {
        if (!dead) ScrollTrigger.refresh()
      }
      requestAnimationFrame(refresh)
      qAll(root, 'img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', refresh, { once: true })
      })
      const fontsReady = document.fonts?.ready
      if (fontsReady) fontsReady.then(refresh)

      return () => {
        dead = true
        if (film) gsap.set(film, { clearProps: 'transform' })
      }
    },
    root
  )

  return () => mm.revert()
}
