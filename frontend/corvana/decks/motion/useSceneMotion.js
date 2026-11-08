/**
 * Scene motion for the Faneqo flagship deck — GSAP only, same rules as the
 * Home V2 motion composables:
 *
 *  - CSS is the finished slide. Timelines only use from()/fromTo() during the
 *    entrance, so if scripting fails nothing is left hidden.
 *  - The player keys each slide by index, so a slide mounts when it becomes
 *    active: mount = play, unmount = ctx.revert(). Rapid navigation or the
 *    player's Replay control (a remount) always lands on a clean state.
 *  - No loops, no ScrollTrigger, no media autoplay.
 *  - prefers-reduced-motion, or the player's own reduce-motion setting,
 *    skips the timeline and shows the finished slide at once.
 */
import { onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

export const EASE = {
  enter: 'power3.out',
  type: 'expo.out',
  drift: 'power2.out',
  draw: 'power2.inOut',
}

// Accept one element, a list, or nothing
const list = (targets) => (targets instanceof Element ? [targets] : Array.from(targets || []).filter(Boolean))

const PHONE = '(max-width: 900px), (max-aspect-ratio: 5/4)'

export function useSceneMotion(rootRef, choreograph) {
  let ctx = null

  onMounted(() => {
    const root = rootRef.value
    if (!root || typeof window === 'undefined') return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || Boolean(root.closest('.reduce-motion'))
    if (reduce) return

    const phone = window.matchMedia(PHONE).matches
    const q = (selector) => Array.from(root.querySelectorAll(selector))

    let tl = null
    try {
      ctx = gsap.context(() => {
        // Built paused: from() states hold the first frame while the scene paints
        tl = gsap.timeline({ paused: true, defaults: { ease: EASE.enter, duration: 0.8 } })
        choreograph(tl, { q, phone, root })
        // On a phone most of the slide is below the fold; keep the story but shorten it
        if (phone) tl.timeScale(1.4)
      }, root)
    } catch (error) {
      ctx?.revert()
      ctx = null
      console.warn('[deck motion] scene skipped', error)
      return
    }

    // Mounting a scene costs one long frame (measured 100–470 ms at 4x CPU
    // throttle). Playing at once let GSAP's clock run through it, so every
    // entrance began part-way in. Start after the scene has painted and its
    // photographs are decoded, capped so a slow image never holds the slide.
    const live = ctx
    Promise.race([decoded(root), wait(DECODE_CAP_MS)])
      .then(afterPaint)
      .then(() => {
        if (ctx !== live) return
        root.dataset.scene = 'playing'
        tl.play(0)
      })
  })

  onBeforeUnmount(() => {
    ctx?.revert()
    ctx = null
  })
}

const DECODE_CAP_MS = 700
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const afterPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

function decoded(root) {
  const imgs = Array.from(root.querySelectorAll('img'))
  return Promise.all(imgs.map((img) => {
    if (img.complete) return img.naturalWidth ? img.decode().catch(() => {}) : null
    return new Promise((resolve) => {
      img.addEventListener('load', () => img.decode().then(resolve, resolve), { once: true })
      img.addEventListener('error', resolve, { once: true })
    })
  }))
}

/** Headline lines rise out of a mask, one typographic beat at a time. */
export function revealLines(tl, targets, position, vars = {}) {
  const els = list(targets)
  if (!els.length) return tl
  return tl.fromTo(
    els,
    { clipPath: 'inset(0% -5% 100% -5%)', y: '0.4em' },
    {
      clipPath: 'inset(-30% -5% -40% -5%)',
      y: 0,
      duration: 1.05,
      ease: EASE.type,
      stagger: 0.14,
      clearProps: 'clipPath,transform',
      ...vars,
    },
    position,
  )
}

/** A quiet arrival: opacity with a short travel. */
export function arrive(tl, targets, position, vars = {}) {
  const els = list(targets)
  if (!els.length) return tl
  return tl.from(els, { autoAlpha: 0, y: 18, duration: 0.7, clearProps: 'transform', ...vars }, position)
}

/** A photograph settling into its frame. */
export function settle(tl, targets, position, vars = {}) {
  const els = list(targets)
  if (!els.length) return tl
  return tl.fromTo(
    els,
    { autoAlpha: 0, scale: 1.06 },
    { autoAlpha: 1, scale: 1, duration: 1.8, ease: EASE.drift, clearProps: 'transform,opacity,visibility', ...vars },
    position,
  )
}
