<template>
  <div
    class="fq-connection"
    :class="[`is-${size}`, `is-${state}`, reducedMotion && 'is-reduced']"
    aria-hidden="true"
  >
    <ClientOnly>
      <FaneqoRive
        v-if="available"
        ref="riveRef"
        :src="src"
        :artboard="artboard"
        :state-machine="stateMachine"
        :autoplay="false"
        fit="contain"
        alignment="center"
        aria-label="Faneqo connection"
        @load="onLoad"
        @load-error="onMissing"
      />
    </ClientOnly>
    <div v-if="!available" class="fq-connection__fallback">
      <span class="fq-connection__pulse" />
      <svg v-if="state !== 'connected'" class="fq-connection__mark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <svg v-else class="fq-connection__mark is-check" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
</template>

<script setup>
/**
 * Signature connection mark for Fan List (and later Message / Passport / Show Mode).
 * Rive owns the visual when public/rive/faneqo-connection.riv exists.
 * Until then, a static/CSS footprint matching the future artboard is shown.
 * Never substitutes a community .riv file.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import FaneqoRive from '@/components/rive/FaneqoRive.vue'
import { useFaneqoConnection } from '~/composables/useFaneqoConnection'
import {
  FANEQO_CONNECTION_ARTBOARD,
  FANEQO_CONNECTION_SRC,
  FANEQO_CONNECTION_STATE_MACHINE,
  probeFaneqoConnectionAsset,
} from '~/utils/rive/faneqoConnection'

const props = defineProps({
  state: {
    type: String,
    default: 'idle',
    validator: (value) => ['idle', 'connecting', 'connected', 'ready', 'focus'].includes(value),
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm', 'md'].includes(value),
  },
  intensity: {
    type: Number,
    default: 0.7,
  },
})

const available = ref(false)
const riveRef = ref(null)
const connection = useFaneqoConnection(riveRef)
const reducedPref = usePreferredReducedMotion()
const reducedMotion = computed(() => reducedPref.value === 'reduce')

const src = FANEQO_CONNECTION_SRC
const artboard = FANEQO_CONNECTION_ARTBOARD
const stateMachine = FANEQO_CONNECTION_STATE_MACHINE

onMounted(async () => {
  available.value = await probeFaneqoConnectionAsset()
})

function onLoad() {
  connection.applyAppState(props.state)
}

function onMissing() {
  available.value = false
}

watch(
  () => props.state,
  (state) => {
    if (!available.value) return
    connection.applyAppState(state)
  }
)
</script>

<style scoped>
.fq-connection {
  position: relative;
  width: 1.7rem;
  height: 1.7rem;
  pointer-events: none;
  flex-shrink: 0;
}

.fq-connection.is-xs {
  width: 1.35rem;
  height: 1.35rem;
}

.fq-connection.is-md {
  width: 2.15rem;
  height: 2.15rem;
}

.fq-connection :deep(.faneqo-rive),
.fq-connection :deep(.faneqo-rive__canvas) {
  width: 100%;
  height: 100%;
}

.fq-connection__fallback {
  width: 100%;
  height: 100%;
  border-radius: 0.52rem;
  border: 1px solid rgba(57, 213, 255, 0.28);
  background: rgba(76, 166, 255, 0.08);
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
}

.fq-connection.is-connected .fq-connection__fallback {
  border-color: rgba(98, 242, 157, 0.38);
  background: rgba(98, 242, 157, 0.08);
}

.fq-connection__mark {
  width: 0.88rem;
  height: 0.88rem;
  color: #39d5ff;
  position: relative;
  z-index: 1;
}

.fq-connection__mark.is-check {
  color: #62f29d;
}

.fq-connection__pulse {
  display: none;
}

.fq-connection.is-connecting:not(.is-reduced) .fq-connection__pulse {
  display: block;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 0 0 rgba(57, 213, 255, 0.35);
  animation: fq-connection-pulse 220ms ease-out 1;
}

@keyframes fq-connection-pulse {
  0% { box-shadow: 0 0 0 0 rgba(57, 213, 255, 0.28); }
  100% { box-shadow: 0 0 0 7px rgba(57, 213, 255, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .fq-connection__pulse {
    display: none !important;
    animation: none !important;
  }
}
</style>
