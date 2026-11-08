/**
 * Keyboard / visual-viewport inset for full-screen composers.
 * Prefer this over 100vh so sticky CTAs stay reachable.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useVisualViewportInset() {
  const keyboardInset = ref(0)
  const viewportHeight = ref(null)

  function update() {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    if (!vv) {
      keyboardInset.value = 0
      viewportHeight.value = window.innerHeight
      return
    }
    keyboardInset.value = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
    viewportHeight.value = Math.round(vv.height)
  }

  onMounted(() => {
    update()
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    vv?.removeEventListener('resize', update)
    vv?.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
  })

  return { keyboardInset, viewportHeight }
}
