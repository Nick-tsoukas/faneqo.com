/**
 * Home V2 hero entrance — GSAP only, /home-v2 only.
 * No looping motion. No ScrollTrigger. No media autoplay.
 *
 * CSS is the visible rest state. `from()` only hides during the entrance.
 * Revert / complete always land on a valid in-flow composition.
 */
import { gsap } from 'gsap'
import { HOME_V2_OPENING_MOTION as M } from '~/utils/home-v2/openingMotion'

function qAll(root, sel) {
  return Array.from(root.querySelectorAll(sel))
}

function settleHero(root, targets) {
  root.classList.add('is-settled')
  gsap.set(targets, {
    autoAlpha: 1,
    x: 0,
    y: 0,
    scale: 1,
    clearProps: 'transform',
  })
}

export function useHomeV2HeroMotion(rootRef) {
  const root = rootRef?.value || rootRef
  if (!root || typeof window === 'undefined') return () => {}

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    root.classList.add('is-live', 'is-reduced', 'is-settled')
    return () => {
      root.classList.remove('is-live', 'is-reduced', 'is-settled')
    }
  }

  const ctx = gsap.context(() => {
    const thoughts = qAll(root, '.v2-hero__thought')
    const ctas = qAll(root, '.v2-hero__cta')
    const note = qAll(root, '.v2-hero__note')
    const product = qAll(root, '.v2-hero-stage').filter((el) => el.offsetParent)
    const targets = [...thoughts, ...ctas, ...note, ...product]

    root.classList.add('is-live')
    root.classList.remove('is-settled')

    const tl = gsap.timeline({
      defaults: { ease: M.heroEase },
      onComplete: () => settleHero(root, targets),
    })

    tl.from(thoughts, {
      autoAlpha: 0,
      y: 22,
      duration: M.heroThought,
      stagger: M.heroThoughtStagger,
    }, 0)
    tl.from(ctas, { autoAlpha: 0, y: 8, duration: M.heroCta }, '-=0.18')
    tl.from(note, { autoAlpha: 0, duration: 0.24 }, '<0.05')
    if (product.length) {
      tl.from(product, {
        y: 16,
        duration: M.heroProduct,
      }, '-=0.4')
    }
  }, root)

  return () => {
    ctx.revert()
    root.classList.add('is-settled')
    root.classList.remove('is-live')
    gsap.set(qAll(root, '.v2-hero__thought, .v2-hero__cta, .v2-hero__note, .v2-hero-stage'), {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      clearProps: 'transform,visibility,opacity',
    })
  }
}
