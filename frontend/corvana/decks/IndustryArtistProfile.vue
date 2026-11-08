<template>
  <div ref="hostRef" class="phone" aria-hidden="true">
    <div
      class="phone__fit"
      :style="{ width: `${deviceWidth * scale}px`, height: `${deviceHeight * scale}px` }"
    >
      <div
        class="phone__device"
        :style="{
          width: `${deviceWidth}px`,
          height: `${deviceHeight}px`,
          transform: `scale(${scale})`,
        }"
      >
        <iframe
          class="phone__screen"
          src="/embed/artist-page"
          title="Artist page"
          loading="eager"
          scrolling="no"
          tabindex="-1"
          :style="{ width: `${VIEWPORT_WIDTH}px`, height: `${viewportHeight}px` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/** The page must render at a real phone width, then the device scales to fit the slide. */
const VIEWPORT_WIDTH = 390
const DEFAULT_VIEWPORT_HEIGHT = 844
const MIN_VIEWPORT_HEIGHT = 720
const MAX_VIEWPORT_HEIGHT = 900
const BEZEL = 12

const hostRef = ref(null)
const scale = ref(0.6)
const viewportHeight = ref(DEFAULT_VIEWPORT_HEIGHT)
const deviceWidth = computed(() => VIEWPORT_WIDTH + BEZEL * 2)
const deviceHeight = computed(() => viewportHeight.value + BEZEL * 2)

let observer = null

function fit() {
  const host = hostRef.value
  if (!host) return
  const { width, height } = host.getBoundingClientRect()
  if (!width || !height) return
  scale.value = Math.min(width / deviceWidth.value, height / deviceHeight.value)
}

function onEmbedMessage(event) {
  if (event.data?.type !== 'faneqo:embed-artist-height') return
  const reported = Number(event.data.height)
  if (!Number.isFinite(reported) || reported <= 0) return
  viewportHeight.value = Math.min(Math.max(Math.round(reported), MIN_VIEWPORT_HEIGHT), MAX_VIEWPORT_HEIGHT)
  fit()
}

onMounted(() => {
  fit()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(fit)
    observer.observe(hostRef.value)
  }
  window.addEventListener('resize', fit)
  window.addEventListener('message', onEmbedMessage)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', fit)
  window.removeEventListener('message', onEmbedMessage)
})
</script>

<style scoped>
.phone {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.phone__fit {
  position: relative;
  flex: 0 0 auto;
}

.phone__device {
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  padding: 12px;
  transform-origin: top left;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 46px;
  background: #050506;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 34px 90px rgba(0, 0, 0, 0.6);
}

.phone__screen {
  display: block;
  border: 0;
  border-radius: 34px;
  overflow: hidden;
  background: #050506;
  pointer-events: none;
  scrollbar-width: none;
}

.phone__screen::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
