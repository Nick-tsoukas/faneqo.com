<template>
  <Motion
    v-if="count > 0"
    class="fq-pill"
    v-bind="enter"
    role="button"
    tabindex="0"
    :aria-label="`${count} new messages. Jump to newest.`"
    @click="$emit('jump')"
    @keydown.enter.prevent="$emit('jump')"
    @keydown.space.prevent="$emit('jump')"
  >
    <component :is="icons.arrowDown" :size="14" :stroke-width="2" aria-hidden="true" />
    {{ count }} new message{{ count === 1 ? '' : 's' }}
  </Motion>
</template>

<script setup>
import { computed } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { motionTokens } from '~/utils/ui/motionTokens'

defineProps({
  count: { type: Number, default: 0 },
})

defineEmits(['jump'])

const icons = faneqoIcons
const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')
const enter = computed(() =>
  reduced.value
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: motionTokens.micro }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 6 },
        transition: motionTokens.springSoft,
      }
)
</script>

<style scoped>
.fq-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.8rem;
  min-height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(57, 213, 255, 0.35);
  background: rgba(24, 24, 27, 0.92);
  color: #fafafa;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.fq-pill:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 2px;
}
</style>
