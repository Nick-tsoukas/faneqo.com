<template>
  <div
    class="fq-lg-dock"
    :class="{
      'is-on': chromeOn,
      'is-photos': photosOn,
      'is-info': infoOn,
    }"
    :aria-hidden="chromeOn ? undefined : 'true'"
    :inert="chromeOn ? undefined : true"
    @focusin="emit('pin')"
    @focusout="emit('unpin')"
    @pointerdown.capture="emit('pin')"
  >
    <!--
      The caption plate heads the shelf. It leads with the photograph's own
      caption and says who / where in one quiet line, so the shelf opens on a
      memory rather than on three stacked metadata fields.
    -->
    <div
      v-if="plateOn"
      class="fq-lg-dock__expand fq-lg-plate"
      :class="{ 'is-lead-identity': plate.lead === 'identity' }"
      aria-hidden="true"
    >
      <div class="fq-lg-plate__text">
        <p v-if="plate.caption" class="fq-lg-plate__caption">{{ plate.caption }}</p>
        <p v-if="plate.identity" class="fq-lg-plate__identity">{{ plate.identity }}</p>
        <p v-if="plate.place && dense" class="fq-lg-plate__place">{{ plate.place }}</p>
      </div>
      <p v-if="total > 1" class="fq-lg-plate__index">{{ indexLine }}</p>
    </div>

    <AnimatePresence>
      <Motion
        v-if="sheetOn"
        class="fq-lg-dock__expand fq-lg-dock__rail"
        :class="{ 'is-resident': railResident }"
        role="navigation"
        aria-label="Memory Rail"
        :initial="railMotion.initial"
        :animate="railMotion.animate"
        :exit="railMotion.exit"
        :transition="railMotion.transition"
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

    <AnimatePresence>
      <Motion
        v-if="infoOn"
        class="fq-lg-dock__expand fq-lg-dock__info"
        :style="infoStyle"
        :initial="expandMotion.initial"
        :animate="expandMotion.animate"
        :exit="expandMotion.exit"
        :transition="expandMotion.transition"
      >
        <p
          v-for="line in info.lines"
          :key="`${line.kind}:${line.text}`"
          class="fq-lg-info__line"
          :class="`fq-lg-info__${line.kind}`"
        >{{ line.text }}</p>
        <div v-if="!hasInfo" class="fq-lg-dock__info-empty">
          <p v-if="identity.artist">{{ identity.artist }}</p>
          <p v-if="identity.secondary">{{ identity.secondary }}</p>
          <p v-if="identity.place">{{ identity.place }}</p>
        </div>
      </Motion>
    </AnimatePresence>

    <!--
      Actions are words, not icon-and-micro-caption pairs. A 9px tracked cap
      under an 18px glyph was the cheapest-reading element in the gallery and
      needed two elements to say one thing. Type can carry a control.
      Photos is absent where the contact sheet is already on the shelf, and
      absent from a gallery of one — both are properties of the gallery and the
      viewport, so the row never changes as you swipe. A permanently greyed
      word is worse than no word.
    -->
    <div class="fq-lg-dock__bar" role="toolbar" aria-label="Gallery actions">
      <LivingGalleryWord
        v-if="!railResident && items.length > 1"
        label="Photos"
        hint="Photographs in this Gallery"
        :active="photosOn"
        :tab-index="chromeOn ? 0 : -1"
        @click="emit('photos')"
      />
      <LivingGalleryWord
        label="Info"
        hint="About this photograph"
        :active="infoOn"
        :tab-index="chromeOn ? 0 : -1"
        @click="emit('info')"
      />
      <LivingGalleryWord
        :label="shareWord"
        :hint="shareLabel"
        :tab-index="chromeOn ? 0 : -1"
        @click="emit('share')"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import { motionTokens } from '~/utils/ui/motionTokens'
import LivingGalleryWord from './LivingGalleryWord.vue'
import {
  formatLivingGalleryIndex,
  livingGalleryIdentityLines,
  livingGalleryInfoFields,
} from './livingGalleryChrome'
import { livingGalleryPlate } from './livingGalleryContext'
import { scrollSelectedThumbnailIntoView, thumbnailContinuity } from './livingGalleryThumbnails'

const props = defineProps({
  chromeOn: { type: Boolean, default: false },
  photosOn: { type: Boolean, default: false },
  infoOn: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  night: { type: Object, default: () => ({}) },
  memory: { type: Object, default: null },
  shareStatus: { type: String, default: '' },
  reduced: { type: Boolean, default: false },
  infoMaxHeight: { type: Number, default: 220 },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  showPlate: { type: Boolean, default: false },
  plateDense: { type: Boolean, default: true },
  railResident: { type: Boolean, default: false },
})

const emit = defineEmits(['photos', 'info', 'share', 'select', 'keydown', 'pin', 'unpin'])
const listRef = ref(null)
const ready = reactive({})

const identity = computed(() => livingGalleryIdentityLines(props.night, { compact: false }))
const plate = computed(() => livingGalleryPlate(props.night, props.memory))
const dense = computed(() => props.plateDense)
const indexLine = computed(() => formatLivingGalleryIndex(props.index, props.total))
/*
 * The caption steps aside for a sheet the shelf has no room for. Holding both
 * on a laptop pushed the pair up over the photograph's lower edge.
 */
const plateOn = computed(() => (
  props.showPlate
  && !props.infoOn
  && !(props.photosOn && !props.railResident)
  && Boolean(plate.value.caption || plate.value.identity)
))
/** Resident on the shelf, or raised on demand where the shelf has no room. */
const sheetOn = computed(() => (
  props.items.length > 1 && !props.infoOn && (props.railResident || props.photosOn)
))
const info = computed(() => livingGalleryInfoFields(props.night, props.memory, {
  omitVisible: false,
  replaceChrome: true,
  compact: false,
}))
const hasInfo = computed(() => info.value.lines.length > 0)
const infoStyle = computed(() => ({
  maxHeight: `${Math.max(88, Number(props.infoMaxHeight) || 220)}px`,
}))
const shareWord = computed(() => {
  if (props.shareStatus === 'copied') return 'Copied'
  if (props.shareStatus === 'shared') return 'Shared'
  return 'Share'
})
const shareLabel = computed(() => {
  if (props.shareStatus === 'copied') return 'Link copied'
  if (props.shareStatus === 'shared') return 'Shared'
  return 'Share photograph'
})

const expandMotion = computed(() => (
  props.reduced
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.08, ease: 'linear' },
    }
    : {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 8 },
      transition: { duration: motionTokens.standard.duration, ease: motionTokens.standard.ease },
    }
))

/** A resident sheet is part of the shelf, so it arrives with it, not over it. */
const railMotion = computed(() => (
  props.railResident
    ? {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0 },
    }
    : expandMotion.value
))

/**
 * Orientation is truth; height is hierarchy. Frame height comes from the fixed
 * rail track (CSS), so only the aspect varies per photograph.
 */
function thumbStyle(item) {
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
 * Immediate, and keyed on whether the sheet is actually showing: a resident
 * sheet is already open on its first render, so waiting for a toggle to change
 * left the active frame off the end of the strip whenever the gallery opened on
 * a late photograph.
 */
watch(
  () => [sheetOn.value, props.items.find((row) => row.selected)?.id],
  async ([open]) => {
    if (!open) return
    await nextTick()
    scrollSelectedThumbnailIntoView(listRef.value)
  },
  { immediate: true },
)
</script>
