<template>
  <div
    class="fq-pv-sheet"
    :class="{ 'is-open': open }"
    :aria-hidden="open ? undefined : 'true'"
    :inert="open ? undefined : true"
  >
    <div
      ref="trackEl"
      class="fq-pv-sheet__track"
      role="listbox"
      aria-label="Photographs in this gallery"
      @keydown="onKeydown"
    >
      <button
        v-for="(photo, i) in photos"
        :key="photo.id || i"
        ref="frameEls"
        type="button"
        role="option"
        class="fq-pv-frame"
        :class="{ 'is-active': i === index }"
        :style="frameStyle(photo)"
        :aria-selected="i === index"
        :aria-label="frameLabel(photo, i)"
        :tabindex="open ? (i === index ? 0 : -1) : -1"
        @click="emit('select', i)"
      >
        <img
          :src="photo.thumbSrc || photo.src"
          alt=""
          decoding="async"
          loading="lazy"
        >
      </button>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  photos: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  open: { type: Boolean, default: false },
  reduced: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'close'])

const trackEl = ref(null)
const frameEls = ref([])

/**
 * A contact sheet keeps every frame's true shape. Extremes are held inside a
 * range so one panorama cannot own the strip.
 */
function frameStyle(photo) {
  const w = Number(photo?.width) || 3
  const h = Number(photo?.height) || 2
  const ratio = Math.max(0.6, Math.min(2, w / h))
  return { width: `calc(var(--fq-pv-sheet) * ${ratio.toFixed(3)})` }
}

function frameLabel(photo, i) {
  const base = photo?.caption || photo?.alt || `Photograph ${i + 1}`
  return i === props.index ? `${base} — showing now` : base
}

function centreActive(behavior) {
  const track = trackEl.value
  const frame = track?.querySelector('.is-active')
  if (!track || !frame) return
  const target = frame.offsetLeft - (track.clientWidth - frame.offsetWidth) / 2
  const max = Math.max(0, track.scrollWidth - track.clientWidth)
  const left = Math.max(0, Math.min(max, target))
  if (typeof track.scrollTo === 'function') track.scrollTo({ left, behavior })
  else track.scrollLeft = left
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  event.stopPropagation()
  const next = props.index + (event.key === 'ArrowRight' ? 1 : -1)
  if (next < 0 || next >= props.photos.length) return
  emit('select', next)
}

watch(
  () => [props.index, props.open],
  async ([, open]) => {
    if (!open) return
    await nextTick()
    centreActive(props.reduced ? 'auto' : 'smooth')
    // The active frame is the sheet's keyboard entry point.
    if (document.activeElement?.closest?.('.fq-pv-sheet')) {
      trackEl.value?.querySelector('.is-active')?.focus?.({ preventScroll: true })
    }
  },
  { immediate: true },
)
</script>
