/**
 * Home V2 Act 2 product theater — triggered scene changes, not scrubbed playback.
 * Pin holds the stage. Scroll chooses a scene index. GSAP completes the cut.
 * /home-v2 only.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  HOME_V2_HQ_REFRESH_PRIORITY,
  homeV2PinStartPx,
  homeV2PinTravelPx,
} from '~/utils/home-v2/openingMotion'
import {
  HOME_V2_THEATER_MOTION as M,
  homeV2ProductScenes,
} from '~/utils/home-v2/productTheater'

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

function sceneIndexFromProgress(progress, scenes) {
  const weights = scenes.map((scene) => Number(scene.hold) || 1)
  const total = weights.reduce((sum, n) => sum + n, 0)
  const t = Math.min(0.999, Math.max(0, progress)) * total
  let acc = 0
  for (let i = 0; i < weights.length; i += 1) {
    acc += weights[i]
    if (t < acc) return i
  }
  return weights.length - 1
}

function applyChapter(root, index, scenes) {
  qAll(root, '.v2-theater__chapter').forEach((el, i) => {
    el.classList.toggle('is-current', i === index)
    el.classList.toggle('is-past', i < index)
    el.classList.toggle('is-future', i > index)
  })
  qAll(root, '.v2-theater__scene').forEach((el) => {
    const id = el.getAttribute('data-scene')
    el.classList.toggle('is-active', scenes[index]?.id === id)
  })
  const line = q(root, '.v2-theater__line')
  if (line && scenes[index]) line.textContent = scenes[index].line
}

function setupReduced(root, scenes) {
  root.classList.add('is-reduced')
  qAll(root, '.v2-theater__scene').forEach((el) => {
    gsap.set(el, { autoAlpha: 1, y: 0, scale: 1, clearProps: false })
  })
  applyChapter(root, 0, scenes)
}

function buildDesktopTour(root, scenes) {
  const pinEl = q(root, '.v2-theater-pin')
  const layers = scenes
    .map((scene) => q(root, `.v2-theater__scene[data-scene="${scene.id}"]`))
    .filter(Boolean)
  if (!pinEl || layers.length !== scenes.length) return null

  root.classList.remove('is-reduced')
  layers.forEach((el, i) => {
    gsap.set(el, {
      autoAlpha: i === 0 ? 1 : 0,
      y: 0,
      scale: 1,
      force3D: true,
    })
  })
  applyChapter(root, 0, scenes)

  let current = 0
  let cut = null

  const goTo = (index) => {
    if (index === current || !layers[index]) return
    const prev = current
    current = index
    applyChapter(root, index, scenes)
    const dir = index > prev ? 1 : -1
    cut?.kill()
    cut = gsap.timeline({ defaults: { duration: 0.62, ease: M.ease, overwrite: 'auto' } })
    cut.to(layers[prev], { autoAlpha: 0, y: -16 * dir, scale: 0.99 }, 0)
    cut.fromTo(
      layers[index],
      { autoAlpha: 0, y: 22 * dir, scale: M.enterScale },
      { autoAlpha: 1, y: 0, scale: 1 },
      0
    )
  }

  ScrollTrigger.create({
    id: 'home-v2-hq-desktop',
    trigger: pinEl,
    start: () => homeV2PinStartPx(pinEl, headerOffset()),
    end: () => `+=${homeV2PinTravelPx(M.desktopScrollVh, window.innerHeight)}`,
    pin: pinEl,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    refreshPriority: HOME_V2_HQ_REFRESH_PRIORITY,
    onUpdate: (self) => goTo(sceneIndexFromProgress(self.progress, scenes)),
  })
}

function buildMobileEntrances(root, scenes) {
  root.classList.remove('is-reduced')
  applyChapter(root, 0, scenes)
  qAll(root, '.v2-theater__scene').forEach((el, index) => {
    const scene = scenes[index]
    if (!scene) return
    gsap.from(el, {
      autoAlpha: 0.45,
      y: M.mobileFromY,
      duration: M.mobileDuration,
      ease: 'power2.out',
      scrollTrigger: {
        id: `home-v2-theater-${scene.id}`,
        trigger: el,
        start: 'top 84%',
        toggleActions: 'play none none none',
      },
    })
  })
}

export function useHomeV2ProductTheater(rootRef) {
  registerPlugins()
  const root = rootRef?.value || rootRef
  if (!root || typeof window === 'undefined') return () => {}

  const scenes = homeV2ProductScenes()
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
        setupReduced(root, scenes)
        return () => root.classList.remove('is-reduced')
      }
      if (isDesktop) buildDesktopTour(root, scenes)
      else buildMobileEntrances(root, scenes)
      requestAnimationFrame(() => ScrollTrigger.refresh())
      return () => {
        qAll(root, '.v2-theater__scene').forEach((el) => {
          gsap.set(el, { clearProps: 'transform,opacity,visibility' })
        })
      }
    },
    root
  )

  return () => mm.revert()
}
