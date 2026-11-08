/**
 * Homepage story motion — GSAP only, one timeline per section, played once
 * when the section first comes into view. Same rules as useHomeV2HeroMotion
 * and the flagship deck's useSceneMotion:
 *
 *  - CSS is the finished section. Timelines only use from()/fromTo(), so if
 *    scripting fails the content is simply there.
 *  - The timeline is built paused only for sections that start below the fold;
 *    a section already on screen at load is left as it is.
 *  - No scroll scrubbing, no pinning, no loops. Scrolling is never held.
 *  - prefers-reduced-motion skips motion entirely.
 *  - Unmount reverts everything.
 */
import { onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

export const STORY_EASE = {
  enter: 'power3.out',
  type: 'expo.out',
  drift: 'power2.out',
}

const list = (targets) => (targets instanceof Element ? [targets] : Array.from(targets || []).filter(Boolean))

export function useHomeStoryMotion(rootRef, choreograph, { threshold = 0.28 } = {}) {
  let ctx = null
  let observer = null

  onMounted(() => {
    const root = rootRef.value
    if (!root || typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    // Already visible at load: show it finished rather than hiding it mid-read
    if (root.getBoundingClientRect().top < window.innerHeight * 0.85) return

    const phone = window.matchMedia('(max-width: 767px)').matches
    const q = (selector) => Array.from(root.querySelectorAll(selector))

    try {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ paused: true, defaults: { ease: STORY_EASE.enter, duration: 0.8 } })
        choreograph(tl, { q, phone, root })
        if (phone) tl.timeScale(1.3)

        observer = new IntersectionObserver(([entry]) => {
          if (!entry?.isIntersecting) return
          tl.play()
          observer?.disconnect()
          observer = null
        }, { threshold: phone ? Math.min(threshold, 0.12) : threshold })
        observer.observe(root)
      }, root)
    } catch (error) {
      observer?.disconnect()
      ctx?.revert()
      ctx = null
      console.warn('[home motion] section skipped', error)
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
    ctx?.revert()
    ctx = null
  })
}

/** Headline lines rise out of a mask, one typographic beat at a time. */
export function revealLines(tl, targets, position, vars = {}) {
  const els = list(targets)
  if (!els.length) return tl
  return tl.fromTo(
    els,
    { clipPath: 'inset(0% -5% 100% -5%)', y: '0.4em' },
    { clipPath: 'inset(-30% -5% -40% -5%)', y: 0, duration: 1, ease: STORY_EASE.type, stagger: 0.12, clearProps: 'clipPath,transform', ...vars },
    position,
  )
}

/** A quiet arrival: opacity with a short travel. */
export function arrive(tl, targets, position, vars = {}) {
  const els = list(targets)
  if (!els.length) return tl
  return tl.from(els, { autoAlpha: 0, y: 18, duration: 0.7, clearProps: 'transform,opacity,visibility', ...vars }, position)
}

/** A photograph settling into its frame. */
export function settle(tl, targets, position, vars = {}) {
  const els = list(targets)
  if (!els.length) return tl
  return tl.fromTo(
    els,
    { autoAlpha: 0, scale: 1.06 },
    { autoAlpha: 1, scale: 1, duration: 1.6, ease: STORY_EASE.drift, clearProps: 'transform,opacity,visibility', ...vars },
    position,
  )
}
