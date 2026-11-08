<template>
  <div ref="rootRef" class="photo" :class="[`fade-${fade}`]" :style="{ borderRadius: radius }">
    <img
      v-if="src"
      ref="imgRef"
      class="photo__img"
      :src="src"
      :style="{ objectPosition: position, transform: zoom !== 1 ? `scale(${zoom})` : undefined }"
      alt=""
      draggable="false"
      @load="onLoad"
    />
    <div v-else class="photo__empty" aria-hidden="true">
      <span>No photo selected</span>
    </div>
    <div class="photo__shade" aria-hidden="true" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { focalToObjectPosition, studioImageUrl } from '@/features/ads/studio/mediaUrl.js'

/**
 * Photography field: object-fit cover with a focal point that is kept as close
 * to the centre of the frame as the crop allows, in every format. Falls back to
 * percentage object-position until the image's natural size is known.
 * `media` is a snapshot media ref ({ url, width, height, focal }) or null.
 */
const props = defineProps({
  media: { type: Object, default: null },
  focal: { type: Object, default: null },
  fade: { type: String, default: 'bottom' }, // bottom | top | both | none | deep
  radius: { type: String, default: '0' },
  zoom: { type: Number, default: 1 },
})

const rootRef = ref(null)
const imgRef = ref(null)
const box = ref({ w: 0, h: 0 })
const natural = ref({ w: Number(props.media?.width) || 0, h: Number(props.media?.height) || 0 })

const src = computed(() => studioImageUrl(props.media?.url))
const focal = computed(() => props.focal || props.media?.focal || { x: 50, y: 50 })

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

const position = computed(() => {
  const { w: cw, h: ch } = box.value
  const { w: iw, h: ih } = natural.value
  if (!cw || !ch || !iw || !ih) return focalToObjectPosition(focal.value)
  const scale = Math.max(cw / iw, ch / ih)
  const rw = iw * scale
  const rh = ih * scale
  const fx = clamp(Number(focal.value.x) || 50, 0, 100) / 100
  const fy = clamp(Number(focal.value.y) || 50, 0, 100) / 100
  const x = clamp(cw / 2 - fx * rw, cw - rw, 0)
  const y = clamp(ch / 2 - fy * rh, ch - rh, 0)
  return `${Math.round(x)}px ${Math.round(y)}px`
})

function measure() {
  const el = rootRef.value
  if (!el) return
  // offsetWidth/Height are layout sizes, unaffected by the stage's transform scale.
  box.value = { w: el.offsetWidth, h: el.offsetHeight }
}

function onLoad(event) {
  const img = event?.target
  if (img?.naturalWidth && img?.naturalHeight) natural.value = { w: img.naturalWidth, h: img.naturalHeight }
}

let observer = null
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(rootRef.value)
  }
  if (imgRef.value?.complete && imgRef.value.naturalWidth) onLoad({ target: imgRef.value })
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => props.media?.url, () => {
  natural.value = { w: Number(props.media?.width) || 0, h: Number(props.media?.height) || 0 }
})
</script>

<style scoped>
.photo {
  position: relative;
  overflow: hidden;
  background: #0b0b0e;
}

.photo__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center;
}

.photo__empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 60%),
    #0b0b0e;
  color: rgba(247, 249, 252, 0.28);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.photo__shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.fade-none .photo__shade { display: none; }

.fade-bottom .photo__shade {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.5) 0%,
    rgba(5, 5, 6, 0) 14%,
    rgba(5, 5, 6, 0) 38%,
    rgba(5, 5, 6, 0.4) 54%,
    rgba(5, 5, 6, 0.88) 68%,
    #050506 78%,
    #050506 100%
  );
}

.fade-deep .photo__shade {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.55) 0%,
    rgba(5, 5, 6, 0.05) 18%,
    rgba(5, 5, 6, 0) 40%,
    rgba(5, 5, 6, 0.35) 56%,
    rgba(5, 5, 6, 0.82) 70%,
    rgba(5, 5, 6, 0.97) 82%,
    #050506 100%
  );
}

.fade-top .photo__shade {
  background: linear-gradient(to top, rgba(5, 5, 6, 0) 0%, rgba(5, 5, 6, 0) 50%, rgba(5, 5, 6, 0.85) 85%, #050506 100%);
}

.fade-both .photo__shade {
  background: linear-gradient(
    to bottom,
    #050506 0%,
    rgba(5, 5, 6, 0.6) 10%,
    rgba(5, 5, 6, 0) 28%,
    rgba(5, 5, 6, 0) 62%,
    rgba(5, 5, 6, 0.7) 84%,
    #050506 100%
  );
}
</style>
