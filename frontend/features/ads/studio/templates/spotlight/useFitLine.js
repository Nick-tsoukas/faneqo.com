import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * Break a display name into one or two lines. Single words and short names
 * stay on one line; longer multi-word names split at the most balanced word
 * boundary. Pure; shared by the spotlight styles.
 */
export function splitNameLines(name, { oneLineUpTo = 12 } = {}) {
  const text = String(name || '').trim()
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= 1 || text.length <= oneLineUpTo) return [text]
  let best = null
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const longest = Math.max(a.length, b.length)
    if (!best || longest < best.longest) best = { lines: [a, b], longest }
  }
  return best.lines
}

/**
 * Scale a single-line (nowrap) block so its longest line fits its own box.
 * Measures the rendered element after fonts are ready, re-measures when
 * `deps` change and when a web font finishes loading. Returns a style object:
 * `{ fontSize: calc(var(--<cssVar>) * k) }`.
 *
 * Prototype helper for the Artist Spotlight concepts; render-only, no persistence.
 */
export function useFitLine(el, { cssVar = 'name', min = 0.3, max = 1 } = {}, deps = []) {
  const maxOf = () => (typeof max === 'function' ? max() : max)
  const scale = ref(maxOf())

  async function fit() {
    const max = maxOf()
    scale.value = max
    await nextTick()
    try {
      if (typeof document !== 'undefined' && document.fonts?.ready) await document.fonts.ready
    } catch {
      /* fonts API unavailable — measure anyway */
    }
    const node = el.value
    if (!node) return
    const avail = node.clientWidth
    // Measure the text of each line (a Range), not the boxes: block lines stretch to the container
    // and scrollWidth ignores overflow on the start side of centred text. Range rects are in
    // viewport space, so undo any ancestor transform (the editor stage and style thumbnails scale the board).
    const layoutWidth = node.offsetWidth || avail
    const viewportWidth = node.getBoundingClientRect().width || layoutWidth
    const zoom = layoutWidth > 0 && viewportWidth > 0 ? viewportWidth / layoutWidth : 1
    const lines = [...node.children]
    const textWidth = (line) => {
      const range = document.createRange()
      range.selectNodeContents(line)
      return range.getBoundingClientRect().width / zoom
    }
    const need = lines.length ? Math.max(...lines.map(textWidth)) : node.scrollWidth
    if (avail > 0 && need > avail) scale.value = Math.max(min, (avail / need) * max * 0.985)
  }

  const onFonts = () => fit()
  onMounted(() => {
    fit()
    if (typeof document !== 'undefined' && document.fonts?.addEventListener) document.fonts.addEventListener('loadingdone', onFonts)
  })
  onBeforeUnmount(() => {
    if (typeof document !== 'undefined' && document.fonts?.removeEventListener) document.fonts.removeEventListener('loadingdone', onFonts)
  })
  watch(deps, fit)

  return computed(() => ({ fontSize: `calc(var(--${cssVar}) * ${scale.value.toFixed(4)})` }))
}
