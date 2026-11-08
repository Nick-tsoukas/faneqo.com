/**
 * V2-local ScrollTrigger refresh when structural page height changes
 * (lazy/hydrate-on-visible sections). Does not watch film transforms.
 * /home-v2 only.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gsap } from 'gsap'

let pluginsReady = false

function registerPlugins() {
  if (pluginsReady || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger)
  pluginsReady = true
}

export function useHomeV2LayoutRefresh(rootRef) {
  registerPlugins()
  const root = rootRef?.value || rootRef
  if (!root || typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
    return () => {}
  }

  let lastH = Math.round(root.getBoundingClientRect().height)
  let timer = 0
  let refreshing = false

  const dump = () => {
    if (!import.meta.dev) return
    window.__homeV2Triggers = ScrollTrigger.getAll()
      .filter((t) => String(t.vars?.id || '').startsWith('home-v2'))
      .map((t) => ({
        id: t.vars.id,
        start: t.start,
        end: t.end,
        refreshPriority: t.vars.refreshPriority,
        isActive: t.isActive,
        progress: Number(t.progress.toFixed(3)),
      }))
  }

  const refresh = () => {
    if (refreshing) return
    refreshing = true
    ScrollTrigger.refresh()
    lastH = Math.round(root.getBoundingClientRect().height)
    dump()
    refreshing = false
  }

  const ro = new ResizeObserver((entries) => {
    const next = Math.round(entries[0]?.contentRect?.height || 0)
    if (Math.abs(next - lastH) < 16) return
    lastH = next
    window.clearTimeout(timer)
    timer = window.setTimeout(refresh, 140)
  })
  ro.observe(root)

  requestAnimationFrame(() => {
    requestAnimationFrame(refresh)
  })

  return () => {
    window.clearTimeout(timer)
    ro.disconnect()
    if (import.meta.dev) delete window.__homeV2Triggers
  }
}
