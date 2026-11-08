<template>
  <ClientOnly>
    <div
      v-if="available"
      class="fq-echo"
      :class="[`is-${size}`, `is-${moment}`]"
      aria-hidden="true"
    >
      <FaneqoRive
        ref="riveRef"
        :src="src"
        :artboard="artboard"
        :state-machine="stateMachine"
        :autoplay="false"
        fit="contain"
        alignment="center"
        :aria-label="ariaLabel"
        @load="onLoad"
        @load-error="onMissing"
      />
    </div>
  </ClientOnly>
</template>

<script setup>
/**
 * Tiny attached Faneqo Echo mark.
 * Renders nothing until public/rive/faneqo-echo.riv exists.
 * Never substitutes a CSS doodle.
 */
import { computed, onMounted, ref } from 'vue'
import FaneqoRive from '@/components/rive/FaneqoRive.vue'
import { useFaneqoEcho } from '~/composables/useFaneqoEcho'
import {
  FANEQO_ECHO_ARTBOARD,
  FANEQO_ECHO_SRC,
  FANEQO_ECHO_STATE_MACHINE,
  probeFaneqoEchoAsset,
} from '~/utils/rive/faneqoEcho'

const props = defineProps({
  moment: {
    type: String,
    default: 'check-in',
    validator: (value) => ['check-in', 'settled', 'echo-back', 'cta'].includes(value),
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm', 'md'].includes(value),
  },
  desktopOnly: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: 'Faneqo connection',
  },
})

const available = ref(false)
const riveRef = ref(null)
const echo = useFaneqoEcho(riveRef)

const src = FANEQO_ECHO_SRC
const artboard = FANEQO_ECHO_ARTBOARD
const stateMachine = FANEQO_ECHO_STATE_MACHINE

const isDesktop = computed(() => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(min-width: 1024px)').matches
})

onMounted(async () => {
  if (props.desktopOnly && !isDesktop.value) return
  available.value = await probeFaneqoEchoAsset()
})

function onLoad() {
  if (props.moment === 'settled') echo.settleConnected()
}

function onMissing() {
  available.value = false
}

defineExpose({
  ...echo,
  available,
})
</script>

<style scoped>
.fq-echo {
  pointer-events: none;
  width: 2.5rem;
  height: 2.5rem;
}

.fq-echo.is-xs {
  width: 1.6rem;
  height: 1.6rem;
}

.fq-echo.is-sm {
  width: 2.6rem;
  height: 2.6rem;
}

.fq-echo.is-md {
  width: 3.4rem;
  height: 3.4rem;
}
</style>
