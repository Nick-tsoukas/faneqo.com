<template>
  <div ref="rootRef" class="fq-reveal">
    <Motion v-bind="bind">
      <slot />
    </Motion>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import {
  isReducedMotion,
  PROFILE_REVEAL_IN_VIEW,
  profileSectionMotion,
} from '@/utils/ui/profileMotion'

const props = defineProps({
  delay: { type: Number, default: 0 },
})

const preference = usePreferredReducedMotion()
const reduced = computed(() => isReducedMotion(preference.value))
const visible = ref(false)
const rootRef = ref(null)
let observer = null
let failsafe = 0

const bind = computed(() => {
  const motion = profileSectionMotion(reduced.value, props.delay)
  return {
    initial: motion.initial,
    animate: visible.value || reduced.value ? motion.animate : motion.initial,
    transition: motion.transition,
  }
})

onMounted(() => {
  if (reduced.value) {
    visible.value = true
    return
  }

  const el = rootRef.value
  if (!el || typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }

  observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    visible.value = true
    observer?.disconnect()
    observer = null
  }, PROFILE_REVEAL_IN_VIEW)

  observer.observe(el)
  failsafe = window.setTimeout(() => {
    visible.value = true
  }, 1400)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (failsafe) window.clearTimeout(failsafe)
})
</script>
