<template>
  <span class="home-phrase-mask">
    <motion.span
      class="home-phrase-inner"
      v-bind="bind"
    >
      <slot />
    </motion.span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import { homePhraseMotion, isHomeTypeReduced } from '@/utils/ui/homeTypeMotion'

const props = defineProps({
  delay: { type: Number, default: 0 },
})

const preference = usePreferredReducedMotion()
const reduced = computed(() => isHomeTypeReduced(preference.value))
const bind = computed(() => {
  const animation = homePhraseMotion(reduced.value, props.delay)
  return {
    ...animation,
    // The hero promise is conversion-critical. Render it visibly in SSR and
    // during hydration instead of depending on a timer to settle the motion.
    initial: false,
  }
})
</script>

<style scoped>
.home-phrase-mask {
  display: block;
  overflow: visible;
  padding-bottom: 0.12em;
}

.home-phrase-inner {
  display: block;
}

@media (prefers-reduced-motion: reduce) {
  .home-phrase-inner {
    transform: none !important;
    opacity: 1 !important;
  }
}
</style>
