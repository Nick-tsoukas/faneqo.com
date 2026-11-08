<template>
  <div
    class="faneqo-artist-hero-image"
    :class="[`surface-${surface}`, `fit-${decision.resolved}`]"
  >
    <template v-if="source.src">
      <img
        v-if="decision.resolved === 'full'"
        :src="source.src"
        alt=""
        aria-hidden="true"
        class="faneqo-artist-hero-image__ambient"
        :style="ambientStyle"
        loading="lazy"
        decoding="async"
      />
      <img
        :src="source.src"
        :srcset="source.srcset || undefined"
        :sizes="source.sizes || undefined"
        :alt="resolvedAlt"
        class="faneqo-artist-hero-image__photo"
        :class="decision.resolved === 'fill' ? 'is-fill' : 'is-full'"
        :style="photoStyle"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : undefined"
        decoding="async"
      />
    </template>
    <div
      v-else
      class="faneqo-artist-hero-image__fallback"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import {
  getArtistFocalStyle,
  getArtistHeroTransformStyle,
  getBestArtistImageSource,
  resolveArtistImageFit,
  unwrapBandImage,
} from '@/utils/media/artistImage'

const props = defineProps({
  image: { type: [Object, String], default: null },
  surface: { type: String, default: 'hero' },
  fitMode: { type: String, default: 'auto' },
  focalX: { type: [Number, String], default: 50 },
  focalY: { type: [Number, String], default: 50 },
  zoom: { type: [Number, String], default: 1 },
  alt: { type: String, default: '' },
  priority: { type: Boolean, default: false },
})

const resolvedImage = computed(() => {
  if (!props.image) return null
  if (typeof props.image === 'string') return { url: props.image }
  return unwrapBandImage(props.image) || props.image
})

const decision = computed(() =>
  resolveArtistImageFit({
    fitMode: props.fitMode,
    image: resolvedImage.value,
    positionX: props.focalX,
    positionY: props.focalY,
    zoom: props.zoom,
    surface: props.surface,
  })
)

const source = computed(() =>
  getBestArtistImageSource(resolvedImage.value, props.surface)
)

const applyZoom = computed(
  () =>
    decision.value.resolved === 'fill' &&
    (props.surface === 'hero' || props.surface === 'preview')
)

const photoStyle = computed(() => {
  if (decision.value.resolved === 'full') {
    return getArtistFocalStyle({
      positionX: props.focalX,
      positionY: props.focalY,
    })
  }
  return getArtistHeroTransformStyle({
    positionX: props.focalX,
    positionY: props.focalY,
    zoom: props.zoom,
    applyZoom: applyZoom.value,
  })
})

const ambientStyle = computed(() =>
  getArtistFocalStyle({
    positionX: props.focalX,
    positionY: props.focalY,
  })
)

const resolvedAlt = computed(() => {
  const name = String(props.alt || '').trim()
  return name || 'Artist image'
})

watchEffect(() => {
  if (!import.meta.dev) return
  const ratio = decision.value.ratio
  console.info('[Faneqo Artist Image]', {
    surface: props.surface,
    fit: decision.value.requested,
    resolvedFit: decision.value.resolved,
    reason: decision.value.reason,
    ratio: ratio == null ? null : Number(ratio.toFixed(3)),
  })
})
</script>

<style scoped>
.faneqo-artist-hero-image {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #050505;
}

.faneqo-artist-hero-image__fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 20%, rgba(145, 0, 255, 0.16), transparent 42%),
    linear-gradient(180deg, #141414 0%, #050505 100%);
}

.faneqo-artist-hero-image__ambient {
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  object-fit: cover;
  filter: blur(18px) saturate(0.72) brightness(0.42);
  transform: scale(1.12);
  transform-origin: center;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.faneqo-artist-hero-image.fit-full::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(5, 5, 5, 0.18) 0%, rgba(5, 5, 5, 0.08) 35%, rgba(5, 5, 5, 0.55) 100%),
    radial-gradient(circle at 50% 40%, rgba(145, 0, 255, 0.08), transparent 55%);
  pointer-events: none;
}

.faneqo-artist-hero-image__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.faneqo-artist-hero-image__photo.is-fill {
  object-fit: cover;
}

.faneqo-artist-hero-image__photo.is-full {
  object-fit: contain;
  padding: 4.5% 5%;
}

@media (max-width: 640px) {
  .faneqo-artist-hero-image__ambient {
    filter: blur(14px) saturate(0.7) brightness(0.4);
  }
}
</style>
