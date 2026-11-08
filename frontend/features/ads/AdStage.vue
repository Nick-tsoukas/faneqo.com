<template>
  <div ref="hostRef" class="ad-stage-host">
    <div
      class="ad-stage-fit"
      :style="{ width: `${fitWidth}px`, height: `${fitHeight}px` }"
    >
      <div class="ad-stage" :style="stageStyle">
        <slot />
        <div v-if="mask" class="ad-stage__mask" aria-hidden="true">
          <div v-if="mask.top" class="is-top" :style="{ height: `${mask.top}px` }" />
          <div v-if="mask.bottom" class="is-bottom" :style="{ height: `${mask.bottom}px` }" />
          <div v-if="mask.left" class="is-left" :style="{ width: `${mask.left}px` }" />
          <div v-if="mask.right" class="is-right" :style="{ width: `${mask.right}px` }" />
        </div>
        <div
          v-if="frame"
          class="ad-stage__frame"
          :style="frameStyle"
          aria-hidden="true"
        />
        <div v-if="guides" class="ad-stage__guides" aria-hidden="true">
          <div
            v-if="guides.top"
            class="ad-stage__band is-top"
            :style="{ height: `${guides.top}px` }"
          />
          <div
            v-if="guides.bottom"
            class="ad-stage__band is-bottom"
            :style="{ height: `${guides.bottom}px` }"
          />
          <div
            v-if="guides.side"
            class="ad-stage__band is-left"
            :style="{ width: `${guides.side}px` }"
          />
          <div
            v-if="guides.side"
            class="ad-stage__band is-right"
            :style="{ width: `${guides.side}px` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AD_FORMATS, stageScale } from '@/features/ads/formats.js'

const props = defineProps({
  width: { type: Number, default: AD_FORMATS.feed.width },
  height: { type: Number, default: AD_FORMATS.feed.height },
  guides: { type: Object, default: null },
  mask: { type: Object, default: null },
  frame: { type: Object, default: null },
})

const hostRef = ref(null)
const scale = ref(0)

const frameStyle = computed(() => {
  const frame = props.frame
  if (!frame) return null
  const side = frame.side || 0
  return {
    top: `${frame.top || 0}px`,
    right: `${frame.right ?? side}px`,
    bottom: `${frame.bottom || 0}px`,
    left: `${frame.left ?? side}px`,
  }
})

const fitWidth = computed(() => props.width * scale.value)
const fitHeight = computed(() => props.height * scale.value)
const stageStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `scale(${scale.value})`,
}))

let observer = null

function fit() {
  const host = hostRef.value
  if (!host) return
  const { width, height } = host.getBoundingClientRect()
  scale.value = stageScale(width, height, props.width, props.height)
}

onMounted(() => {
  fit()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(fit)
    observer.observe(hostRef.value)
  }
  window.addEventListener('resize', fit)
})

watch(() => [props.width, props.height], fit)

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', fit)
})
</script>

<style scoped>
.ad-stage-host {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.ad-stage-fit {
  position: relative;
  flex: 0 0 auto;
}

.ad-stage {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  transform-origin: top left;
  background: #050506;
}

.ad-stage__mask,
.ad-stage__guides,
.ad-stage__frame {
  position: absolute;
  z-index: 6;
  pointer-events: none;
}

.ad-stage__mask,
.ad-stage__guides {
  inset: 0;
}

.ad-stage__frame {
  z-index: 7;
  border: 2px solid rgba(126, 231, 255, 0.9);
  box-shadow: inset 0 0 0 1px rgba(5, 5, 6, 0.35);
}

.ad-stage__mask {
  z-index: 5;
}

.ad-stage__band {
  position: absolute;
  background: rgba(255, 64, 96, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255, 120, 140, 0.45);
}

.ad-stage__band.is-top {
  top: 0;
  right: 0;
  left: 0;
}

.ad-stage__band.is-bottom {
  right: 0;
  bottom: 0;
  left: 0;
}

.ad-stage__band.is-left,
.ad-stage__band.is-right {
  top: 0;
  bottom: 0;
}

.ad-stage__band.is-left { left: 0; }
.ad-stage__band.is-right { right: 0; }

.ad-stage__mask > div {
  position: absolute;
  background: rgba(5, 5, 6, 0.72);
}

.ad-stage__mask .is-top,
.ad-stage__mask .is-bottom {
  right: 0;
  left: 0;
}

.ad-stage__mask .is-left,
.ad-stage__mask .is-right {
  top: 0;
  bottom: 0;
}

.ad-stage__mask .is-top {
  top: 0;
  box-shadow: inset 0 -3px 0 #f7f9fc;
}

.ad-stage__mask .is-bottom {
  bottom: 0;
  box-shadow: inset 0 3px 0 #f7f9fc;
}

.ad-stage__mask .is-left {
  left: 0;
  box-shadow: inset -3px 0 0 #f7f9fc;
}

.ad-stage__mask .is-right {
  right: 0;
  box-shadow: inset 3px 0 0 #f7f9fc;
}
</style>
