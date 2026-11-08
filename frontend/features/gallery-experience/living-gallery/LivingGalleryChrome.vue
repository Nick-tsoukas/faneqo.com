<template>
  <div
    class="fq-lg-chrome-root"
    :style="rootStyle"
    @focusin="emit('pin')"
    @focusout="emit('unpin')"
  >
    <p
      v-if="pureIndexVisible"
      class="fq-lg-pure-index"
      aria-hidden="true"
    >{{ indexLine }}</p>

    <div
      class="fq-lg-chrome"
      :class="[
        chromeOn ? 'is-on' : '',
        `fq-lg-chrome--${device}`,
        `fq-lg-chrome--${orientation}`,
      ]"
      :aria-hidden="chromeOn ? undefined : 'true'"
      :inert="chromeOn ? undefined : true"
    >
      <!--
        Close is the only thing that floats. The sequence position used to sit
        opposite it as a standalone `05 / 08` readout, which is HUD language;
        it now reads as part of the caption plate, where a count belongs.
      -->
      <div class="fq-lg-region fq-lg-region--top-left">
        <LivingGalleryControl
          name="close"
          label="Close photograph"
          :icon-size="closeIconSize"
          :tab-index="chromeOn ? 0 : -1"
          @click="emit('close')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LivingGalleryControl from './LivingGalleryControl.vue'
import { formatLivingGalleryIndex } from './livingGalleryChrome'
import { DEVICE_DESKTOP, DEVICE_ULTRAWIDE } from '../core/photoComposition'

const props = defineProps({
  chromeOn: { type: Boolean, default: false },
  pureVariant: { type: String, default: 'A' },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  device: { type: String, default: 'phone' },
  orientation: { type: String, default: 'portrait' },
  reduced: { type: Boolean, default: false },
  photoRect: { type: Object, default: null },
  viewportHeight: { type: Number, default: 844 },
})

const emit = defineEmits(['close', 'pin', 'unpin'])

const indexLine = computed(() => formatLivingGalleryIndex(props.index, props.total))
const pureIndexVisible = computed(() => props.pureVariant === 'B' && !props.chromeOn)

/** A 18px glyph that reads as a control on a phone is a speck on a monitor. */
const closeIconSize = computed(() => (
  props.device === DEVICE_DESKTOP || props.device === DEVICE_ULTRAWIDE ? 22 : 18
))

const rootStyle = computed(() => {
  const r = props.photoRect
  return r
    ? {
      '--fq-lg-photo-left': `${Math.round(r.x)}px`,
      '--fq-lg-photo-top': `${Math.round(r.y)}px`,
      '--fq-lg-photo-width': `${Math.round(r.w)}px`,
      '--fq-lg-photo-height': `${Math.round(r.h)}px`,
      '--fq-lg-photo-bottom': `${Math.round(Math.max(0, props.viewportHeight - r.y - r.h))}px`,
    }
    : {}
})
</script>
