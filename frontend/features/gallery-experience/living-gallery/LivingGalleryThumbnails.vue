<template>
  <AnimatePresence>
    <Motion
      v-if="open && items.length > 1"
      class="fq-lg-sheet fq-lg-rail"
      :class="[
        `fq-lg-sheet--${sheetVariant}`,
        `fq-lg-sheet--${geometry}`,
        composed ? 'is-composed' : '',
      ]"
      :style="composeStyle"
      role="navigation"
      aria-label="Memory Rail"
      :initial="sheetMotion.initial"
      :animate="sheetMotion.animate"
      :exit="sheetMotion.exit"
      :transition="sheetMotion.transition"
      @focusin="emit('pin')"
      @focusout="emit('unpin')"
    >
      <div
        ref="listRef"
        class="fq-lg-thumbs"
        role="listbox"
        aria-label="Gallery photographs"
        tabindex="-1"
        @keydown="onKey"
      >
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          role="option"
          class="fq-lg-thumbs__item"
          :class="{
            'is-active': item.selected,
            'is-neighbor': item.neighbor,
            'is-ready': ready[item.id],
          }"
          :style="thumbStyle(item)"
          :data-gx-thumb="item.id"
          :data-gx-thumb-index="item.index"
          :data-gx-thumb-selected="item.selected ? 'true' : undefined"
          :aria-current="item.selected ? 'true' : undefined"
          :aria-selected="item.selected ? 'true' : 'false'"
          :aria-label="item.selected ? `${item.alt}, current photograph` : item.alt"
          @click="select($event, item)"
        >
          <img
            :src="item.src"
            :srcset="item.srcset"
            :alt="item.alt"
            :width="item.width"
            :height="item.height"
            :loading="item.neighbor || item.selected ? 'eager' : 'lazy'"
            decoding="async"
            @load="ready[item.id] = true"
          >
        </button>
      </div>
    </Motion>
  </AnimatePresence>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import { motionTokens } from '~/utils/ui/motionTokens'
import {
  scrollSelectedThumbnailIntoView,
  SHEET_RAIL,
  THUMB_NATIVE,
  thumbnailContinuity,
} from './livingGalleryThumbnails'

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  sheetVariant: { type: String, default: SHEET_RAIL },
  geometry: { type: String, default: THUMB_NATIVE },
  reduced: { type: Boolean, default: false },
  composed: { type: Boolean, default: false },
  composeStyle: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select', 'keydown', 'pin', 'unpin'])
const listRef = ref(null)
const ready = reactive({})

const sheetMotion = computed(() => (
  props.reduced
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.08, ease: 'linear' },
    }
    : {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 6 },
      transition: { duration: motionTokens.standard.duration, ease: motionTokens.standard.ease },
    }
))

function thumbStyle(item) {
  if (props.sheetVariant !== SHEET_RAIL || props.geometry !== THUMB_NATIVE) return undefined
  const aspect = Math.max(0.55, Math.min(2.05, Number(item.aspect) || 1))
  return { '--fq-lg-thumb-aspect': String(aspect) }
}

function select(event, item) {
  emit('select', thumbnailContinuity({
    index: item.index,
    item,
    element: event?.currentTarget,
  }))
}

function onKey(event) {
  emit('keydown', event)
}

/*
 * Immediate: a resident sheet is already open on its first render, so waiting
 * for `open` to change left the active frame off the end of the strip whenever
 * the gallery opened on a late photograph.
 */
watch(
  () => [props.open, props.items.find((row) => row.selected)?.id],
  async ([open]) => {
    if (!open) return
    await nextTick()
    scrollSelectedThumbnailIntoView(listRef.value)
  },
  { immediate: true },
)
</script>
