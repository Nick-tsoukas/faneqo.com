<template>
  <button
    ref="rootRef"
    type="button"
    class="fq-icon-btn"
    :class="[
      `fq-icon-btn--${size}`,
      {
        'is-muted': muted,
        'is-active': active,
        'is-ready': ready && !muted && !disabled,
        'is-disabled': disabled,
        'is-pressed': pressed,
      },
    ]"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-pressed="typeof active === 'boolean' ? active : undefined"
    :title="title || ariaLabel"
    @pointerdown="onPressStart"
    @pointerup="onPressEnd"
    @pointerleave="onPressEnd"
    @pointercancel="onPressEnd"
    @click="onClick"
  >
    <Motion
      :animate="iconAnimate"
      :transition="pressTransition"
      class="fq-icon-btn__icon"
    >
      <component
        :is="iconComp"
        :size="pixelSize"
        :stroke-width="stroke"
        aria-hidden="true"
      />
    </Motion>
    <span v-if="$slots.default" class="fq-icon-btn__label">
      <slot />
    </span>
  </button>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Motion } from 'motion-v'
import { FANEQO_ICON_SIZES, FANEQO_ICON_STROKE, faneqoIcon } from '~/utils/messages/faneqoIcons'
import { motionTokens } from '~/utils/ui/motionTokens'

const props = defineProps({
  name: { type: String, required: true },
  ariaLabel: { type: String, required: true },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' },
  muted: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  press: { type: String, default: 'scale' }, // scale | send | reply | none
  ready: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const rootRef = ref(null)
const pressed = ref(false)
const iconComp = computed(() => faneqoIcon(props.name))
const pixelSize = computed(() => FANEQO_ICON_SIZES[props.size] || FANEQO_ICON_SIZES.md)
const stroke = FANEQO_ICON_STROKE
const pressTransition = motionTokens.springPress

const iconAnimate = computed(() => {
  if (props.press === 'none' || !pressed.value) {
    return { scale: 1, x: 0, y: 0 }
  }
  if (props.press === 'send') return { scale: 0.9, x: 3, y: 0 }
  if (props.press === 'reply') return { scale: 0.94, x: -2, y: 0 }
  return { scale: 0.92, x: 0, y: 0 }
})

function onPressStart() {
  if (props.disabled) return
  pressed.value = true
}
function onPressEnd() {
  pressed.value = false
}
function onClick(evt) {
  if (props.disabled) return
  emit('click', evt)
}

defineExpose({ el: rootRef })
</script>

<style scoped>
.fq-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-width: 44px;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: color 0.14s ease, background 0.14s ease;
}

.fq-icon-btn--sm {
  min-width: 40px;
  min-height: 40px;
}

.fq-icon-btn__icon {
  display: grid;
  place-items: center;
}

.fq-icon-btn:hover:not(:disabled) {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.fq-icon-btn:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39ff14);
  outline-offset: 2px;
}

.fq-icon-btn.is-muted {
  color: rgba(255, 255, 255, 0.5);
}

.fq-icon-btn.is-active,
.fq-icon-btn.is-ready {
  color: var(--fq-accent-mint, var(--fq-green, #39ff14));
  background: var(--fq-accent-mint-soft, rgba(57, 255, 20, 0.08));
}

.fq-icon-btn.is-pressed {
  background: rgba(255, 255, 255, 0.08);
}

.fq-icon-btn.is-disabled,
.fq-icon-btn:disabled {
  cursor: default;
  color: rgba(255, 255, 255, 0.22);
  background: transparent;
}

.fq-icon-btn__label {
  font-size: 0.78rem;
  font-weight: 600;
}
</style>
