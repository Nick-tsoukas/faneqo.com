<template>
  <div
    v-if="mounted"
    ref="root"
    class="sheet"
    :class="{ 'is-up': raised }"
    role="dialog"
    aria-modal="true"
    aria-label="All photographs"
  >
    <div class="sheet__head">
      <p class="sheet__title">All photographs</p>
      <button ref="doneEl" type="button" class="sheet__done" @click="$emit('close')">
        Done
      </button>
    </div>

    <div
      v-for="(row, r) in rows"
      :key="`srow-${r}`"
      class="sheet__row"
      :style="{ gap: '4px', marginBottom: '4px' }"
    >
      <button
        v-for="item in row.items"
        :key="item.photo.id"
        type="button"
        class="sheet__frame"
        :class="{ 'is-here': item.index === index }"
        :style="{ width: `${item.width}px`, height: `${item.height}px` }"
        :aria-label="`Photograph ${item.index + 1}${item.photo.caption ? `. ${item.photo.caption}` : ''}`"
        :aria-current="item.index === index ? 'true' : undefined"
        @click="$emit('select', item.index)"
      >
        <img
          class="sheet__img"
          :src="item.photo.thumbSrc"
          :width="item.width"
          :height="item.height"
          alt=""
          loading="lazy"
          decoding="async"
        >
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * The contact sheet.
 *
 * Summoned, never resident. It exists because `current / total` should be
 * able to answer "where am I in this Night?" without a permanent rail of
 * thumbnails living on top of the photographs. It arrives from the bottom,
 * it shows every frame at its true shape, and choosing one returns you to
 * that photograph with the overview untouched behind it.
 *
 * Selection does not reload the wall or lose its scroll position: the sheet
 * only moves the viewer's index.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { planJustifiedRows, galleryContactRowHeight } from './galleryJustifiedRows.js'

const props = defineProps({
  photos: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  open: { type: Boolean, default: false },
  viewportWidth: { type: Number, default: 0 },
})

defineEmits(['select', 'close'])

const root = ref(null)
const doneEl = ref(null)
const mounted = ref(false)
const raised = ref(false)

const rows = computed(() => planJustifiedRows(props.photos, {
  availableWidth: Math.min(props.viewportWidth || 0, 1680) - 28,
  targetHeight: galleryContactRowHeight(props.viewportWidth),
  gap: 4,
}))

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    mounted.value = true
    await nextTick()
    raised.value = true
    // Focus lands inside the sheet so Escape and Tab belong to it.
    doneEl.value?.focus?.({ preventScroll: true })
    await nextTick()
    root.value?.querySelector('.is-here')?.scrollIntoView({ block: 'center', behavior: 'auto' })
    return
  }
  raised.value = false
  setTimeout(() => { mounted.value = false }, 320)
})
</script>

<style scoped>
.sheet {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: rgba(4, 5, 7, 0.93);
  backdrop-filter: blur(30px) saturate(125%);
  transform: translateY(100%);
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding:
    calc(20px + env(safe-area-inset-top))
    14px
    calc(30px + env(safe-area-inset-bottom));
}

.sheet.is-up {
  transform: none;
}

.sheet__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 2px 16px;
}

.sheet__title {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.55);
}

.sheet__done {
  min-height: 44px;
  padding: 4px 8px;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.92);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.sheet__done:focus-visible,
.sheet__frame:focus-visible {
  outline: 2px solid rgba(247, 249, 252, 0.92);
  outline-offset: 2px;
}

.sheet__row {
  display: flex;
}

.sheet__frame {
  position: relative;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #0b0e14;
  overflow: hidden;
  cursor: pointer;
}

.sheet__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0.5;
  transition: opacity 160ms linear;
}

.sheet__frame:hover .sheet__img {
  opacity: 0.8;
}

.sheet__frame.is-here .sheet__img {
  opacity: 1;
}

.sheet__frame.is-here::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1.5px solid rgba(247, 249, 252, 0.94);
}

@media (prefers-reduced-motion: reduce) {
  .sheet,
  .sheet__img {
    transition: none;
  }
}
</style>
