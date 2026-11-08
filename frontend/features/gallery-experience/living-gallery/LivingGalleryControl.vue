<template>
  <button
    type="button"
    class="fq-lg-ctrl"
    :class="{
      'is-active': active,
      'is-pressed': pressed,
      'fq-lg-ctrl--dock': Boolean(caption),
      'fq-lg-ctrl--quiet': quiet,
    }"
    :tabindex="tabIndex"
    :disabled="disabled"
    :aria-label="label"
    :aria-pressed="typeof active === 'boolean' ? active : undefined"
    @pointerdown="pressed = true"
    @pointerup="pressed = false"
    @pointerleave="pressed = false"
    @pointercancel="pressed = false"
    @click="onClick"
  >
    <component
      :is="iconComp"
      class="fq-lg-ctrl__glyph"
      :size="iconSize"
      :stroke-width="stroke"
      aria-hidden="true"
    />
    <span v-if="caption" class="fq-lg-ctrl__caption">{{ caption }}</span>
  </button>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  LIVING_GALLERY_ICON_SIZE,
  LIVING_GALLERY_ICON_STROKE,
  livingGalleryIcon,
} from './livingGalleryIcons'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  /** Optional visible label under the glyph (dock). */
  caption: { type: String, default: '' },
  quiet: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  tabIndex: { type: Number, default: 0 },
  iconSize: { type: Number, default: LIVING_GALLERY_ICON_SIZE },
})

const emit = defineEmits(['click'])
const pressed = ref(false)
const iconComp = computed(() => livingGalleryIcon(props.name))
const stroke = LIVING_GALLERY_ICON_STROKE

function onClick(event) {
  emit('click', event)
}
</script>
