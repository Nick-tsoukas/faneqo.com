<template>
  <span
    ref="rootEl"
    class="home-echo"
    :class="[`is-${size}`, { 'is-playing': playing, 'is-settled': settled }]"
    aria-hidden="true"
  >
    <span class="home-echo__wave home-echo__wave--a"></span>
    <span class="home-echo__wave home-echo__wave--b"></span>
    <span class="home-echo__core"></span>
  </span>
</template>

<script setup>
/**
 * Homepage-only Faneqo echo: one outward pulse, then still.
 * CSS/GSAP primitive so this phase does not wait on a missing .riv file.
 * Same meaning as future /rive/faneqo-echo.riv — not a layout canvas.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm'].includes(value),
  },
  autoplay: {
    type: Boolean,
    default: false,
  },
})

const rootEl = ref(null)
const playing = ref(false)
const settled = ref(false)
let playTimer = 0
let settleTimer = 0

function prefersReduced() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function play() {
  if (playing.value || settled.value) return
  if (prefersReduced()) {
    settled.value = true
    return
  }
  playing.value = true
  playTimer = window.setTimeout(() => {
    playing.value = false
    settled.value = true
  }, 900)
}

onMounted(() => {
  if (rootEl.value) rootEl.value.__homeEchoPlay = play
  if (prefersReduced()) {
    settled.value = true
    return
  }
  if (props.autoplay) {
    settleTimer = window.setTimeout(play, 40)
  }
})

onBeforeUnmount(() => {
  if (playTimer) window.clearTimeout(playTimer)
  if (settleTimer) window.clearTimeout(settleTimer)
})

defineExpose({ play })
</script>

<style scoped>
.home-echo {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  pointer-events: none;
}

.home-echo.is-xs {
  width: 1.05rem;
  height: 1.05rem;
}

.home-echo__core {
  position: relative;
  z-index: 1;
  width: 0.28rem;
  height: 0.28rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #39d5ff 0%, #45e3ae 100%);
  box-shadow: 0 0 8px -2px rgba(57, 213, 255, 0.55);
}

.home-echo.is-xs .home-echo__core {
  width: 0.22rem;
  height: 0.22rem;
}

.home-echo__wave {
  position: absolute;
  inset: 18%;
  border-radius: 999px;
  border: 1px solid rgba(57, 213, 255, 0.55);
  opacity: 0;
  transform: scale(0.55);
  pointer-events: none;
}

.home-echo__wave--b {
  border-color: rgba(69, 227, 174, 0.42);
}

.home-echo.is-playing .home-echo__wave--a {
  animation: home-echo-wave 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.home-echo.is-playing .home-echo__wave--b {
  animation: home-echo-wave 0.72s cubic-bezier(0.22, 1, 0.36, 1) 0.16s both;
}

.home-echo.is-settled .home-echo__core {
  opacity: 0;
}

@keyframes home-echo-wave {
  0% {
    opacity: 0.55;
    transform: scale(0.55);
  }
  70% {
    opacity: 0.18;
  }
  100% {
    opacity: 0;
    transform: scale(2.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-echo__wave {
    animation: none !important;
    opacity: 0 !important;
  }

  .home-echo__core {
    opacity: 0.8;
  }
}
</style>
