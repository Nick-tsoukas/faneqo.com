<template>
  <button
    type="button"
    class="fq-lg-word"
    :class="{ 'is-active': active, 'is-pressed': pressed }"
    :tabindex="tabIndex"
    :disabled="disabled"
    :aria-label="hint || label"
    :aria-pressed="typeof active === 'boolean' ? active : undefined"
    @pointerdown="pressed = true"
    @pointerup="pressed = false"
    @pointerleave="pressed = false"
    @pointercancel="pressed = false"
    @click="emit('click', $event)"
  >
    <span class="fq-lg-word__label">{{ label }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'

/**
 * A gallery action set as a word.
 *
 * The visible text is the whole control: no glyph above it, no micro-caption
 * under it. `hint` carries the fuller sentence for assistive technology and
 * for transient states such as "Link copied", so the visible word can stay
 * one steady size.
 */
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  tabIndex: { type: Number, default: 0 },
})

const emit = defineEmits(['click'])
const pressed = ref(false)
</script>
