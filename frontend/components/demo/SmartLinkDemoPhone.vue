<template>
  <div :class="['relative select-none', wrapperClass]" ref="frameEl">
    <div class="absolute -top-3 left-3 z-20">
      <div class="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
        </span>
        Live demo
      </div>
    </div>

    <div
      class="relative rounded-[2.6rem] border border-white/15 bg-neutral-950 shadow-[0_22px_70px_rgba(0,0,0,0.55)]"
      :style="{ width: widthPx, height: heightPx }"
    >
      <div
        class="absolute inset-0 rounded-[2.6rem] pointer-events-none"
        style="
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.03),
            inset 0 0 28px rgba(255, 255, 255, 0.06);
        "
      ></div>
      <div
        class="absolute left-1/2 -translate-x-1/2 top-1.5 h-5 w-24 rounded-b-2xl bg-black/80"
      ></div>
      <div
        class="absolute inset-[10px] rounded-[2.05rem] overflow-hidden bg-black"
      >
        <div
          ref="scrollEl"
          class="h-full w-full overflow-y-auto overscroll-contain no-scrollbar"
          :class="reducedMotion ? '' : 'scroll-smooth'"
          @scroll.passive="onInnerScroll"
          @wheel.passive="markUserInteraction"
          @touchstart.passive="markUserInteraction"
          @touchmove.passive="markUserInteraction"
        >
          <SmartLinkDemo
            variant="phone"
            container-class=""
            @play-audio="markUserInteraction"
          />
        </div>
      </div>
      <div
        class="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-white/10"
      ></div>
      <div
        class="pointer-events-none absolute inset-0 rounded-[2.6rem]"
        style="
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.10),
            rgba(255, 255, 255, 0) 32%,
            rgba(255, 255, 255, 0) 68%,
            rgba(255, 255, 255, 0.06)
          );
          mix-blend-mode: screen;
          opacity: 0.35;
        "
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import SmartLinkDemo from '@/components/demo/SmartLinkDemo.vue'

const props = defineProps({
  width: {
    type: Number,
    default: 310,
  },
  height: {
    type: Number,
    default: 540,
  },
  wrapperClass: {
    type: String,
    default: '',
  },
})

const widthPx = computed(() => `${props.width}px`)
const heightPx = computed(() => `${props.height}px`)

const frameEl = ref(null)
const scrollEl = ref(null)

const reducedMotion = ref(false)

let rafId = null
let scrollRafId = null
let lastUserInteractionAt = 0

const PARALLAX_MAX_FRACTION = 0.18

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function now() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
}

function markUserInteraction() {
  lastUserInteractionAt = now()
}

function onInnerScroll() {
  markUserInteraction()
}

function isUserInteracting() {
  return now() - lastUserInteractionAt < 900
}

function computeProgress() {
  const el = frameEl.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight || 1

  if (rect.bottom <= 0 || rect.top >= vh) return null

  const denom = rect.height + vh
  if (denom <= 0) return null

  const p = (vh - rect.top) / denom
  return clamp(p, 0, 1)
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function applyParallaxScroll() {
  if (reducedMotion.value) return
  const scroller = scrollEl.value
  if (!scroller) return
  if (isUserInteracting()) return

  const progress = computeProgress()
  if (progress == null) return

  const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
  if (maxScroll <= 0) return

  const eased = easeInOutQuad(progress)
  const target = eased * maxScroll * PARALLAX_MAX_FRACTION
  scroller.scrollTop = target
}

function onWindowScroll() {
  if (scrollRafId) return
  scrollRafId = window.requestAnimationFrame(() => {
    scrollRafId = null
    applyParallaxScroll()
  })
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  reducedMotion.value = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  await nextTick()

  window.addEventListener('scroll', onWindowScroll, { passive: true })
  window.addEventListener('resize', onWindowScroll, { passive: true })
  applyParallaxScroll()
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', onWindowScroll)
  window.removeEventListener('resize', onWindowScroll)
  if (rafId) window.cancelAnimationFrame(rafId)
  if (scrollRafId) window.cancelAnimationFrame(scrollRafId)
})
</script>

<style scoped>
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
