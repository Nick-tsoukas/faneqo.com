<template>
  <span
    class="auth-submit-mark"
    :class="{ 'is-busy': busy, 'is-reduced': reduced }"
    aria-hidden="true"
  >
    <span class="auth-submit-mark__ring" />
    <span class="auth-submit-mark__core" />
  </span>
</template>

<script setup>
/**
 * Submit-only working mark.
 * No .riv file exists for auth. Do not mount FaneqoRive here.
 * Dedicated asset when authored: /rive/faneqo-auth-submit.riv
 *   states: idle | working | success
 */
import { computed } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

defineProps({
  busy: { type: Boolean, default: false },
})

const reducedPref = usePreferredReducedMotion()
const reduced = computed(() => reducedPref.value === 'reduce')
</script>

<style scoped>
.auth-submit-mark:not(.is-busy) {
  display: none;
}

.auth-submit-mark {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.auth-submit-mark__core {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #08090a;
}

.auth-submit-mark__ring {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  border: 1.5px solid rgba(8, 9, 10, 0.28);
}

.auth-submit-mark.is-busy:not(.is-reduced) .auth-submit-mark__ring {
  animation: auth-submit-pulse 0.7s linear infinite;
  border-color: transparent;
  border-top-color: rgba(8, 9, 10, 0.72);
}

@keyframes auth-submit-pulse {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-submit-mark.is-busy .auth-submit-mark__ring {
    animation: none;
    border-color: rgba(8, 9, 10, 0.35);
  }
}
</style>
