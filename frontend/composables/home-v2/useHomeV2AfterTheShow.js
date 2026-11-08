/**
 * After-the-show chapter enters. Natural document scroll.
 * No pin. No scrub. Each chapter plays itself when it arrives.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let pluginsReady = false

function registerPlugins() {
  if (pluginsReady || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger)
  pluginsReady = true
}

export function useHomeV2AfterTheShow(rootRef) {
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
      const chapters = Array.from(root.querySelectorAll('[data-after-chapter]'))

      chapters.forEach((chapter) => {
        const objects = chapter.querySelectorAll('[data-after-object]')
        if (!objects.length) return

        if (reduceMotion) {
          gsap.set(objects, { autoAlpha: 1, y: 0 })
          return
        }

        ScrollTrigger.create({
          trigger: chapter,
          start: 'top 86%',
          once: true,
          onEnter: () => {
            gsap.fromTo(
              objects,
              { autoAlpha: 0, y: 36 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.78,
                ease: 'power3.out',
                stagger: 0.1,
                immediateRender: false,
              }
            )
          },
        })
      })

      requestAnimationFrame(() => ScrollTrigger.refresh())
    },
    root
  )

  return () => mm.revert()
}
