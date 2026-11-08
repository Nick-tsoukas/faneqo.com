<template>
  <div class="home-type-reveal">
    <Motion v-bind="bind">
      <slot />
    </Motion>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import { homeSectionTypeMotion, isHomeTypeReduced } from '@/utils/ui/homeTypeMotion'

const props = defineProps({
  delay: { type: Number, default: 0 },
  immediate: { type: Boolean, default: false },
})

const preference = usePreferredReducedMotion()
const reduced = computed(() => isHomeTypeReduced(preference.value))

const bind = computed(() => {
  const motion = homeSectionTypeMotion(reduced.value, props.delay)
  return {
    // Marketing copy must be readable before hydration. Motion is progressive
    // enhancement; it must never own the visible/hidden state of the content.
    initial: false,
    animate: motion.animate,
    transition: props.immediate || reduced.value ? { duration: 0 } : motion.transition,
  }
})
</script>

<style scoped>
.home-type-reveal,
.home-type-reveal :deep(> *) {
  overflow: visible;
}

@media (prefers-reduced-motion: reduce) {
  .home-type-reveal :deep(*) {
    transform: none !important;
    opacity: 1 !important;
  }
}
</style>
