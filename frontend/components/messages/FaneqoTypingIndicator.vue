<template>
  <div class="fq-typing" role="status" aria-live="polite">
    <span class="fq-typing__text">{{ label }}</span>
    <span class="fq-typing__dots" aria-hidden="true">
      <Motion
        v-for="i in 3"
        :key="i"
        class="fq-typing__dot"
        :animate="reduced ? { opacity: 0.55 } : { opacity: [0.25, 0.95, 0.25], scale: [0.85, 1, 0.85] }"
        :transition="reduced ? { duration: 0 } : { duration: 1.05, repeat: Infinity, delay: (i - 1) * 0.16, ease: 'easeInOut' }"
      />
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'

const props = defineProps({
  name: { type: String, default: '' },
  /** Fan-facing: always the band identity, never a teammate name. */
  bandIdentity: { type: Boolean, default: false },
})

const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')
const label = computed(() => {
  const who = String(props.name || (props.bandIdentity ? 'Artist' : 'Someone')).trim()
  return `${who} is typing`
})
</script>

<style scoped>
.fq-typing {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 1.5rem;
  padding: 0.15rem 0.15rem 0.35rem;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.78rem;
}

.fq-typing__dots {
  display: inline-flex;
  gap: 0.18rem;
  align-items: center;
}

.fq-typing__dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: rgba(232, 121, 249, 0.7);
  display: inline-block;
}
</style>
