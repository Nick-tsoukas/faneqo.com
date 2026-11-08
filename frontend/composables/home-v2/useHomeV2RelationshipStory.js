/**
 * Home V2 relationship story — viewport-enter motion.
 * The page always scrolls. Scenes play themselves. Presentation only.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import {
  HOME_V2_STORY_MOTION as M,
  HOME_V2_STORY_SCENES,
} from '~/utils/home-v2/relationshipStoryDemo'

let pluginsReady = false

function registerPlugins() {
  if (pluginsReady || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger, Flip)
  pluginsReady = true
}

function q(root, sel) {
  return root.querySelector(sel)
}

function qAll(root, sel) {
  return Array.from(root.querySelectorAll(sel))
}

function hideResting(root) {
  const setIf = (sel, vars) => {
    const el = q(root, sel)
    if (el) gsap.set(el, vars)
  }
  setIf('.fq-check-done', { autoAlpha: 0 })
  setIf('.fq-check-fill', { scaleX: 0, transformOrigin: 'left center' })
  setIf('.v2-rel-sending', { autoAlpha: 0 })
  setIf('.v2-rel-sent', { autoAlpha: 0 })
  setIf('.v2-rel-chat', { autoAlpha: 0 })
  setIf('.v2-rel-sarah-reply', { autoAlpha: 0 })
  setIf('.v2-rel-typing', { autoAlpha: 0 })
  setIf('.v2-rel-count-after', { autoAlpha: 0, y: 10 })
}

function landSarah(beat) {
  const layer = q(beat, '[data-sarah-layer]')
  const from = q(beat, '[data-sarah-from]')
  const to = q(beat, '[data-sarah-to]')
  if (layer && to && layer.parentElement !== to) to.appendChild(layer)
  layer?.classList.add('is-landed')
  if (from) gsap.set(from, { height: 0, minHeight: 0, marginBottom: 0, overflow: 'hidden' })
}

function playShow(root) {
  const beat = q(root, '[data-rel="show"]')
  if (!beat) return
  const btn = q(beat, '.fq-check-btn')
  const fill = q(beat, '.fq-check-fill')
  const idle = q(beat, '.fq-check-idle')
  const done = q(beat, '.fq-check-done')
  if (!btn) return
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
  tl.from(q(beat, '.v2-show__sarah'), { autoAlpha: 0, y: 12, duration: 0.5 })
  tl.to(btn, { scale: 0.98, duration: 0.08 }, '+=0.18')
  tl.to(fill, { scaleX: 1, duration: 0.26 }, '<0.04')
  tl.to(btn, { scale: 1, duration: 0.18 }, '<')
  tl.to(idle, { autoAlpha: 0, duration: 0.1 }, '<0.08')
  tl.to(done, { autoAlpha: 1, duration: 0.2 }, '<')
  return tl
}

function playKeep(root) {
  const beat = q(root, '[data-rel="keep"]')
  if (!beat) return
  const layer = q(beat, '[data-sarah-layer]')
  const from = q(beat, '[data-sarah-from]')
  const to = q(beat, '[data-sarah-to]')
  const before = q(beat, '.v2-rel-count-before')
  const after = q(beat, '.v2-rel-count-after')
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

  if (layer && to && layer.parentElement !== to) {
    const state = Flip.getState(layer)
    layer.classList.add('is-landed')
    to.appendChild(layer)
    tl.add(
      Flip.from(state, {
        duration: 0.78,
        ease: 'power2.inOut',
        absolute: true,
        nested: true,
      }),
      0.06
    )
    if (from) {
      tl.to(from, {
        height: 0,
        minHeight: 0,
        marginBottom: 0,
        overflow: 'hidden',
        duration: 0.28,
      }, 0.18)
    }
  }

  if (before && after) {
    tl.to(before, { autoAlpha: 0, y: -10, duration: 0.22 }, 0.22)
    tl.to(after, { autoAlpha: 1, y: 0, duration: 0.22 }, '<')
  }
  return tl
}

function playReach(root) {
  const send = q(root, '.v2-rel-send')
  const sending = q(root, '.v2-rel-sending')
  const sent = q(root, '.v2-rel-sent')
  if (!send) return
  return gsap.timeline()
    .from(q(root, '.v2-mail'), { autoAlpha: 0, y: 10, duration: 0.4, ease: 'power2.out' })
    .to(send, { autoAlpha: 0, duration: 0.16, delay: 0.28 })
    .fromTo(sending, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 })
    .to(sending, { autoAlpha: 0, duration: 0.14, delay: 0.38 })
    .fromTo(sent, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.26 })
}

function playTalk(root) {
  const beat = q(root, '[data-rel="talk"]')
  if (!beat) return
  const req = q(beat, '.v2-rel-request')
  const chat = q(beat, '.v2-rel-chat')
  const accept = q(beat, '.is-accept')
  const typing = q(beat, '.v2-rel-typing')
  const reply = q(beat, '.v2-rel-sarah-reply')
  if (!req || !chat) return
  const tl = gsap.timeline()
  if (accept) tl.to(accept, { scale: 0.97, duration: 0.1, delay: 0.24 }).to(accept, { scale: 1, duration: 0.14 })
  tl.to(req, { autoAlpha: 0, y: -8, height: 0, overflow: 'hidden', duration: 0.32 }, '+=0.06')
  const kicker = q(beat, '.v2-talk__kicker')
  if (kicker) tl.to(kicker, { autoAlpha: 0, duration: 0.2 }, '<')
  tl.fromTo(chat, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.36 }, '<0.06')
  tl.fromTo(typing, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, '+=0.1')
  tl.to(typing, { autoAlpha: 0, duration: 0.1, delay: 0.32 })
  tl.fromTo(reply, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.24 })
  return tl
}

function playRemember(root) {
  const rem = q(root, '.v2-rem')
  const caption = q(root, '.v2-rem__caption')
  const hero = q(root, '.v2-rem__cell.is-hero')
  const others = qAll(root, '.v2-rem__cell:not(.is-hero)')
  if (!rem || !hero) return
  const tl = gsap.timeline()
  tl.from(qAll(root, '.v2-rem__cell'), { autoAlpha: 0, y: 12, duration: 0.38, stagger: 0.05, ease: 'power2.out' })
  if (caption) tl.to(caption, { autoAlpha: 0, y: -8, duration: 0.22 }, '+=0.28')
  tl.to(others, { autoAlpha: 0, duration: 0.2 }, '<0.04')
  tl.add(() => {
    const state = Flip.getState(hero)
    rem.classList.add('is-expanded')
    Flip.from(state, { duration: 0.78, ease: 'power2.inOut', absolute: true })
  })
  return tl
}

const intros = {
  show: playShow,
  keep: playKeep,
  reach: playReach,
  talk: playTalk,
  remember: playRemember,
}

function setIf(root, sel, vars) {
  const el = q(root, sel)
  if (el) gsap.set(el, vars)
}

function setupReduced(root) {
  root.classList.add('is-reduced')
  qAll(root, '[data-rel]').forEach((el) => gsap.set(el, { autoAlpha: 1, y: 0 }))
  setIf(root, '.fq-check-done', { autoAlpha: 1 })
  setIf(root, '.fq-check-idle', { autoAlpha: 0 })
  setIf(root, '.v2-rel-sent', { autoAlpha: 1 })
  setIf(root, '.v2-rel-send', { autoAlpha: 0 })
  setIf(root, '.v2-rel-chat', { autoAlpha: 1 })
  setIf(root, '.v2-rel-request', { autoAlpha: 0 })
  setIf(root, '.v2-rel-sarah-reply', { autoAlpha: 1 })
  setIf(root, '.v2-rel-count-after', { autoAlpha: 1, y: 0 })
  setIf(root, '.v2-rel-count-before', { autoAlpha: 0 })
  setIf(root, '.v2-talk__kicker', { autoAlpha: 0 })
  landSarah(q(root, '[data-rel="keep"]'))
  q(root, '.v2-rem')?.classList.add('is-expanded')
}

export function useHomeV2RelationshipStory(rootRef) {
  registerPlugins()
  const root = rootRef?.value || rootRef
  if (!root || typeof window === 'undefined') return () => {}

  const mm = gsap.matchMedia()
  mm.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
      motion: '(prefers-reduced-motion: no-preference)',
    },
    (context) => {
      const { reduceMotion } = context.conditions
      if (reduceMotion) {
        setupReduced(root)
        return () => root.classList.remove('is-reduced')
      }

      hideResting(root)

      HOME_V2_STORY_SCENES.forEach((scene) => {
        const el = q(root, `[data-rel="${scene.id}"]`)
        if (!el) return
        ScrollTrigger.create({
          id: `home-v2-story-${scene.id}`,
          trigger: el,
          start: M.start,
          once: true,
          onEnter: () => intros[scene.id]?.(root),
        })
      })

      requestAnimationFrame(() => ScrollTrigger.refresh())
    },
    root
  )

  return () => mm.revert()
}
