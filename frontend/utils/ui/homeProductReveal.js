/**
 * Homepage product-reveal timing. One opening family — not a motion engine.
 * GSAP owns the choreography. Tokens stay here so HQ / hero do not scatter values.
 */

export const HOME_REVEAL_EASE = 'power3.out'

export const HOME_REVEAL = {
  micro: 0.16,
  fast: 0.28,
  standard: 0.44,
  hero: 0.58,
  stagger: 0.04,
}

export function homePrefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function homeRevealInFold(el, inset = 40) {
  if (!el || typeof window === 'undefined') return false
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight - inset && rect.bottom > 12
}

/**
 * Opening beats for Artist Page headquarters (mobile primary, desktop when in view).
 * The phone is one object: only the shell and its photo move. Nothing inside the
 * phone gets its own opening beat, so the product never reads as assembling itself.
 */
export function playHomeHeadquartersReveal(gsap, scope, echo) {
  const kicker = scope.querySelector('.home-hq-kicker')
  const phrase = scope.querySelector('.home-hq-phrase')
  const word = scope.querySelector('.home-hq-word')
  const support = scope.querySelector('.home-hq-support')
  const shell = scope.querySelector('[data-reveal="shell"]')
  const photo = scope.querySelector('[data-reveal="photo"]')

  // Anything already painted on screen keeps its server-rendered state.
  // Only off-screen modules are staged for their own scroll reveal.
  const later = scope.querySelectorAll('[data-reveal-later]')
  later.forEach((el) => {
    if (homeRevealInFold(el, 28)) return
    gsap.set(el, { autoAlpha: 0, y: 12 })
  })

  const tl = gsap.timeline({ defaults: { ease: HOME_REVEAL_EASE } })

  if (kicker) {
    tl.fromTo(kicker, { y: 5 }, { y: 0, duration: HOME_REVEAL.micro }, 0)
  }
  tl.add(() => echo?.play?.(), 0.04)

  if (phrase) {
    tl.fromTo(phrase, { y: 10 }, { y: 0, duration: HOME_REVEAL.fast }, 0.04)
  }
  if (word) {
    gsap.set(word, { '--hq-word-pos': '80%' })
    tl.fromTo(
      word,
      { y: 12 },
      { y: 0, duration: HOME_REVEAL.standard, '--hq-word-pos': '0%' },
      0.06,
    )
  }
  if (support) {
    tl.fromTo(support, { autoAlpha: 0.35 }, { autoAlpha: 1, duration: HOME_REVEAL.fast }, 0.1)
  }

  if (shell) {
    tl.fromTo(
      shell,
      { autoAlpha: 0.9, y: 10, scale: 0.995 },
      { autoAlpha: 1, y: 0, scale: 1, duration: HOME_REVEAL.standard },
      0.08,
    )
  }
  if (photo) {
    tl.fromTo(photo, { scale: 1.01 }, { scale: 1, duration: HOME_REVEAL.standard }, 0.08)
  }

  return tl
}

/**
 * Desktop thesis + phone. Copy already uses HomePhraseReveal;
 * this only owns the product visual so it does not wait on a long intro.
 */
export function playHomeHeroReveal(gsap, scope) {
  const phone = scope.querySelector('.hero-profile-container')
  const photo = scope.querySelector('[data-reveal="photo"]')
  const signals = scope.querySelectorAll('.hero-signal')
  const tl = gsap.timeline({ defaults: { ease: HOME_REVEAL_EASE } })

  if (phone) {
    tl.fromTo(
      phone,
      { autoAlpha: 0.9, y: 10, scale: 0.995 },
      { autoAlpha: 1, y: 0, scale: 1, duration: HOME_REVEAL.standard },
      0.06,
    )
  }
  if (photo) {
    tl.fromTo(photo, { scale: 1.01 }, { scale: 1, duration: HOME_REVEAL.standard }, 0.06)
  }
  // Signals are painted by CSS at full opacity. They lift with the phone
  // instead of snapping to zero and fading in after it has already settled.
  if (signals.length) {
    signals.forEach((el, i) => {
      const sx = parseFloat(getComputedStyle(el).getPropertyValue('--sx')) || 0
      tl.fromTo(
        el,
        { autoAlpha: 0.35, y: 6, xPercent: sx },
        { autoAlpha: 1, y: 0, xPercent: sx, duration: HOME_REVEAL.fast },
        0.26 + i * 0.05,
      )
    })
  }
  return tl
}

export function playHomeModuleReveal(gsap, el, kind) {
  if (!el) return null
  const fans = kind === 'fans'
  const y = fans ? 14 : 12
  const duration = fans ? HOME_REVEAL.hero : HOME_REVEAL.standard
  const tl = gsap.timeline({ defaults: { ease: HOME_REVEAL_EASE } })

  if (kind === 'actions') {
    tl.set(el, { autoAlpha: 1, y: 0 })
    const message = el.querySelector('.is-message')
    const rest = el.querySelectorAll('.is-follow, .is-share')
    if (message) {
      tl.fromTo(
        message,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: HOME_REVEAL.fast },
        0,
      )
    }
    if (rest.length) {
      tl.fromTo(
        rest,
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: HOME_REVEAL.fast },
        0.06,
      )
    }
    return tl
  }

  tl.fromTo(el, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration })

  if (kind === 'show') {
    const cta = el.querySelector('[data-reveal="show-cta"]')
    if (cta) {
      tl.fromTo(cta, { autoAlpha: 0.4 }, { autoAlpha: 1, duration: HOME_REVEAL.micro }, 0.14)
    }
  }

  if (kind === 'links') {
    const rows = el.querySelectorAll('.demo-dest-row')
    if (rows.length > 1) {
      tl.fromTo(
        rows,
        { autoAlpha: 0.55 },
        { autoAlpha: 1, duration: HOME_REVEAL.micro, stagger: 0.025 },
        0.02,
      )
    }
  }

  if (kind === 'fans') {
    const action = el.querySelector('.demo-fan__form, .demo-fan__joined')
    if (action) {
      tl.fromTo(
        action,
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: HOME_REVEAL.fast },
        0.12,
      )
    }
  }

  return tl
}

export function observeHomeScrollReveals(gsap, scope) {
  const nodes = scope.querySelectorAll('[data-reveal-later]')
  if (!nodes.length || typeof IntersectionObserver === 'undefined') return () => {}

  const seen = new WeakSet()
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target)) continue
        seen.add(entry.target)
        observer.unobserve(entry.target)
        playHomeModuleReveal(gsap, entry.target, entry.target.getAttribute('data-reveal-later'))
      }
    },
    { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
  )

  // Must match the staging rule in playHomeHeadquartersReveal. Observing an
  // element that was never staged would hide it after it is already visible.
  nodes.forEach((el) => {
    if (homeRevealInFold(el, 28)) return
    observer.observe(el)
  })

  return () => observer.disconnect()
}
