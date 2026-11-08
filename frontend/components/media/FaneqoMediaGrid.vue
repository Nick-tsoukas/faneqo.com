<template>
  <div
    v-if="previewItems.length"
    class="fq-media-grid"
    :class="rootClass"
    :data-kind="variant === 'gallery' ? plan.kind : undefined"
  >
    <template v-if="variant !== 'gallery'">
      <component
        :is="interactive ? 'button' : 'div'"
        v-for="(item, index) in previewItems"
        :key="faneqoMediaKey(item, index)"
        :type="interactive ? 'button' : undefined"
        class="fq-media-grid__cell"
        :aria-label="cellLabel(item, originalIndex(item))"
        @click="onOpen(item)"
      >
        <img
          :src="bubbleSrc(item)"
          :alt="item.alt || 'Image'"
          :width="item.width || undefined"
          :height="item.height || undefined"
          :sizes="sizes"
          loading="lazy"
          decoding="async"
          @error="onBroken"
        />
      </component>
    </template>

    <template v-else-if="plan.kind === 'hero-support'">
      <component
        :is="interactive ? 'button' : 'div'"
        :type="interactive ? 'button' : undefined"
        class="fq-media-grid__cell is-hero"
        :aria-label="cellLabel(previewItems[0], originalIndex(previewItems[0]))"
        :style="leadStyle(previewItems[0])"
        @click="onOpen(previewItems[0])"
      >
        <img v-bind="roleImg(previewItems[0], 'hero', { lead: true })" @error="onBroken" />
      </component>
      <div class="fq-media-grid__stack">
        <component
          :is="interactive ? 'button' : 'div'"
          v-for="(item, index) in previewItems.slice(1)"
          :key="faneqoMediaKey(item, index + 1)"
          :type="interactive ? 'button' : undefined"
          class="fq-media-grid__cell is-support"
          :aria-label="cellLabel(item, originalIndex(item))"
          @click="onOpen(item)"
        >
          <img v-bind="roleImg(item, 'support')" @error="onBroken" />
        </component>
      </div>
    </template>

    <template v-else-if="plan.kind === 'mosaic-side'">
      <component
        :is="interactive ? 'button' : 'div'"
        v-for="(item, index) in previewItems"
        :key="faneqoMediaKey(item, index)"
        :type="interactive ? 'button' : undefined"
        class="fq-media-grid__cell"
        :class="{ 'is-lead': index === 0, 'is-band': index === 3 }"
        :aria-label="cellLabel(item, originalIndex(item))"
        @click="onOpen(item)"
      >
        <img
          v-bind="index === 0 ? roleImg(item, 'hero', { lead: true }) : roleImg(item, 'support')"
          @error="onBroken"
        />
      </component>
    </template>

    <template v-else-if="plan.kind === 'mosaic-top' || plan.kind === 'opening'">
      <component
        :is="interactive ? 'button' : 'div'"
        :type="interactive ? 'button' : undefined"
        class="fq-media-grid__cell is-cover"
        :aria-label="cellLabel(previewItems[0], originalIndex(previewItems[0]))"
        :style="leadStyle(previewItems[0])"
        @click="onOpen(previewItems[0])"
      >
        <img v-bind="roleImg(previewItems[0], 'hero', { lead: true })" @error="onBroken" />
      </component>
      <div class="fq-media-grid__rest" :class="`is-${restItems.length}`">
        <component
          :is="interactive ? 'button' : 'div'"
          v-for="(item, index) in restItems"
          :key="faneqoMediaKey(item, index + 1)"
          :type="interactive ? 'button' : undefined"
          class="fq-media-grid__cell is-support"
          :aria-label="restLabel(item, index)"
          @click="onOpen(item)"
        >
          <img v-bind="roleImg(item, 'support')" @error="onBroken" />
          <span
            v-if="plan.overflow && index === restItems.length - 1"
            class="fq-media-grid__count"
          >+{{ plan.overflow }}</span>
        </component>
      </div>
    </template>

    <template v-else>
      <component
        :is="interactive ? 'button' : 'div'"
        v-for="(item, index) in previewItems"
        :key="faneqoMediaKey(item, index)"
        :type="interactive ? 'button' : undefined"
        class="fq-media-grid__cell"
        :class="{ 'is-editorial': plan.kind === 'editorial' }"
        :aria-label="cellLabel(item, originalIndex(item))"
        :style="pairOrEditorialStyle(item)"
        @click="onOpen(item)"
      >
        <img v-bind="roleImg(item, 'hero', { lead: index === 0 })" @error="onBroken" />
      </component>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { faneqoMediaIdentity, faneqoMediaKey, resolveFaneqoMediaSrc } from '~/utils/media/faneqoMedia'
import {
  galleryCoverStyle,
  galleryLayoutPlan,
  galleryLeadAspect,
  galleryPairStyle,
  gallerySizes,
  gallerySrcset,
  resolveGallerySrcset,
  selectGalleryMediaSource,
} from '~/utils/media/faneqoGalleryLayout'

const props = defineProps({
  items: { type: Array, default: () => [] },
  variant: { type: String, default: 'bubble' },
  surface: { type: String, default: 'page' },
  interactive: { type: Boolean, default: true },
})
const emit = defineEmits(['open'])
const config = useRuntimeConfig()
const mediaOrigin = computed(() => String(config.public?.strapiUrl || '').replace(/\/+$/, ''))

const plan = computed(() => galleryLayoutPlan(props.items || []))
const previewItems = computed(() => {
  if (props.variant !== 'gallery') return props.items || []
  return (props.items || []).slice(0, plan.value.visible)
})
const restItems = computed(() => previewItems.value.slice(1, 4))
const rootClass = computed(() => {
  if (props.variant !== 'gallery') {
    return [
      `is-${Math.min(previewItems.value.length, 4)}`,
      { 'is-static': !props.interactive },
    ]
  }
  return [
    'is-gallery',
    `is-${plan.value.kind}`,
    { 'is-viewer': props.surface === 'viewer' },
    { 'is-static': !props.interactive },
  ]
})
const sizes = computed(() =>
  props.variant === 'gallery'
    ? '(min-width: 720px) 42vw, 94vw'
    : '(max-width: 899px) 78vw, 26rem'
)

function originalIndex(item) {
  const id = faneqoMediaIdentity(item)
  if (id) {
    const found = (props.items || []).findIndex((row) => faneqoMediaIdentity(row) === id)
    if (found >= 0) return found
  }
  return (props.items || []).indexOf(item)
}

function cellLabel(item, index) {
  if (!props.interactive) return undefined
  return item?.alt || `Open image ${index + 1} of ${(props.items || []).length}`
}

function restLabel(item, restIndex) {
  if (plan.value.overflow && restIndex === restItems.value.length - 1) {
    const n = plan.value.overflow
    return n === 1 ? '1 more photo' : `${n} more photos`
  }
  return cellLabel(item, originalIndex(item))
}

function bubbleSrc(item) {
  const count = previewItems.value.length
  const raw = count === 1
    ? (item.url || item.thumbnailUrl || item.thumbUrl)
    : (item.thumbUrl || item.thumbnailUrl || item.url)
  return resolveFaneqoMediaSrc(raw, mediaOrigin.value)
}

function sourcePick(item, role) {
  const viewer = props.surface === 'viewer'
  const targetCssPx = role === 'hero'
    ? (viewer ? 1100 : 900)
    : (viewer ? 720 : 420)
  return selectGalleryMediaSource(item, { role, targetCssPx, dpr: 1 })
}

function roleImg(item, role, { lead = false } = {}) {
  const pick = sourcePick(item, role)
  const srcset = resolveGallerySrcset(gallerySrcset(item, { role }), mediaOrigin.value)
  return {
    src: resolveFaneqoMediaSrc(pick?.url, mediaOrigin.value),
    srcset: srcset || undefined,
    alt: item.alt || 'Image',
    width: pick?.width || item.width || undefined,
    height: pick?.height || item.height || undefined,
    sizes: gallerySizes(role, props.surface),
    loading: lead ? 'eager' : 'lazy',
    fetchpriority: lead ? 'high' : undefined,
    decoding: 'async',
    class: pick?.fit === 'contain' ? 'is-contain' : undefined,
    'data-src-key': pick?.key || '',
  }
}

function leadStyle(item) {
  const base = galleryCoverStyle(item, plan.value.kind) || {}
  return {
    ...base,
    '--fq-lead-ratio': String(galleryLeadAspect(item, plan.value.kind)),
  }
}

function pairOrEditorialStyle(item) {
  if (plan.value.kind === 'editorial') return galleryCoverStyle(item, 'editorial')
  if (plan.value.kind === 'pair-split' || plan.value.kind === 'pair-stack') {
    return galleryPairStyle(item)
  }
  return undefined
}

function onOpen(item) {
  if (!props.interactive) return
  emit('open', { index: originalIndex(item), item })
}

function onBroken(evt) {
  evt?.target?.classList?.add('is-broken')
}
</script>

<style scoped>
.fq-media-grid {
  display: grid;
  gap: 0.14rem;
  max-width: min(100%, 18.5rem);
  border-radius: 0.85rem;
  overflow: hidden;
}
.fq-media-grid.is-gallery {
  max-width: none;
  gap: 0.4rem;
  border-radius: 0;
  overflow: visible;
  min-width: 0;
  container-type: inline-size;
}
.fq-media-grid.is-1 { grid-template-columns: 1fr; }
.fq-media-grid.is-2 { grid-template-columns: 1fr 1fr; }
.fq-media-grid.is-3 { grid-template-columns: 1fr 1fr; }
.fq-media-grid.is-3 .fq-media-grid__cell:nth-child(3) {
  grid-column: 1 / -1;
  aspect-ratio: 2 / 1;
  max-height: none;
  width: 100%;
}
.fq-media-grid.is-4 { grid-template-columns: 1fr 1fr; }

.fq-media-grid.is-editorial,
.fq-media-grid.is-pair-stack {
  grid-template-columns: 1fr;
}
.fq-media-grid.is-pair-split {
  grid-template-columns: minmax(0, 1.16fr) minmax(0, 0.84fr);
  align-items: start;
  gap: 0.35rem;
}
.fq-media-grid.is-pair-split .fq-media-grid__cell img {
  height: auto;
  object-fit: contain;
  background: #050608;
}
.fq-media-grid.is-hero-support {
  grid-template-columns: minmax(0, 1.85fr) minmax(0, 1fr);
  gap: 0.35rem;
  min-height: 14.5rem;
}
.fq-media-grid.is-mosaic-side {
  grid-template-columns: minmax(0, 1.38fr) minmax(0, 1fr);
  grid-template-rows: 1.05fr 0.95fr auto;
  gap: 0.32rem;
}
.fq-media-grid.is-mosaic-side .fq-media-grid__cell.is-lead {
  grid-row: 1 / span 2;
}
.fq-media-grid.is-mosaic-side .fq-media-grid__cell.is-band {
  grid-column: 1 / -1;
  aspect-ratio: 16 / 7;
}
.fq-media-grid.is-mosaic-top,
.fq-media-grid.is-opening {
  grid-template-columns: 1fr;
  gap: 0.4rem;
}

.fq-media-grid__stack {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0.35rem;
  min-height: 14.5rem;
  min-width: 0;
}
.fq-media-grid__rest {
  display: grid;
  gap: 0.32rem;
  min-width: 0;
}
.fq-media-grid__rest.is-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.fq-media-grid__rest.is-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.fq-media-grid__cell {
  position: relative;
  padding: 0;
  border: 0;
  background: #0b0e14;
  cursor: zoom-in;
  min-height: 2.75rem;
  min-width: 0;
  overflow: hidden;
}
.fq-media-grid:not(.is-gallery) .fq-media-grid__cell {
  background: #0b0e14;
  min-height: 5.5rem;
}
.fq-media-grid.is-2 .fq-media-grid__cell,
.fq-media-grid.is-3 .fq-media-grid__cell,
.fq-media-grid.is-4 .fq-media-grid__cell {
  min-height: 0;
  aspect-ratio: 1 / 1;
  max-height: 9.5rem;
}
.fq-media-grid__cell:focus-visible {
  outline: 2px solid #f7f9fc;
  outline-offset: 2px;
}
.fq-media-grid__cell img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 14rem;
  object-fit: cover;
  object-position: center;
}
.fq-media-grid__cell img.is-broken {
  opacity: 0;
}
.fq-media-grid__cell:has(img.is-broken)::after {
  content: 'Photo unavailable';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
  color: rgba(247, 249, 252, 0.55);
  background: #0b0e14;
  pointer-events: none;
}
.fq-media-grid.is-1 .fq-media-grid__cell img {
  object-fit: contain;
  max-height: 16.5rem;
  width: 100%;
  height: auto;
  background: #080808;
}
.fq-media-grid.is-1 .fq-media-grid__cell {
  min-height: 0;
  background: #080808;
}
.fq-media-grid.is-gallery .fq-media-grid__cell img {
  max-height: none;
  max-width: 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: filter 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}
.fq-media-grid.is-gallery .fq-media-grid__cell img.is-contain {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.fq-media-grid.is-editorial .fq-media-grid__cell img,
.fq-media-grid.is-pair-stack .fq-media-grid__cell img {
  object-fit: contain;
  height: auto;
  background: #050608;
}
.fq-media-grid.is-editorial .fq-media-grid__cell {
  max-height: min(78vh, 42rem);
  width: 100%;
}
.fq-media-grid.is-editorial .fq-media-grid__cell img {
  max-height: min(78vh, 42rem);
  width: 100%;
}
.fq-media-grid.is-opening .fq-media-grid__cell.is-cover,
.fq-media-grid.is-mosaic-top .fq-media-grid__cell.is-cover {
  min-height: 13.5rem;
  aspect-ratio: var(--fq-lead-ratio, 1.5);
}
.fq-media-grid.is-hero-support .fq-media-grid__cell.is-hero {
  min-height: 11rem;
  aspect-ratio: var(--fq-lead-ratio, 0.75);
}
.fq-media-grid.is-hero-support .fq-media-grid__cell.is-support {
  aspect-ratio: 4 / 5;
}
.fq-media-grid__rest .fq-media-grid__cell {
  aspect-ratio: 1 / 1;
}
.fq-media-grid.is-mosaic-side .fq-media-grid__cell:not(.is-band) {
  min-height: 7.5rem;
}

.fq-media-grid.is-viewer {
  max-width: 100%;
}
.fq-media-grid.is-viewer .fq-media-grid__cell {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
@media (min-width: 768px) {
  .fq-media-grid.is-viewer .fq-media-grid__cell img {
    transition: filter 160ms ease;
  }
  .fq-media-grid.is-viewer .fq-media-grid__cell:hover img,
  .fq-media-grid.is-viewer .fq-media-grid__cell:focus-visible img {
    filter: brightness(1.05);
  }
}
@media (prefers-reduced-motion: reduce) {
  .fq-media-grid.is-viewer .fq-media-grid__cell img {
    transition: none;
  }
}
@container (min-width: 720px) {
  .fq-media-grid.is-viewer.is-mosaic-side .fq-media-grid__cell:not(.is-band) {
    min-height: 0;
  }
  .fq-media-grid.is-hero-support .fq-media-grid__cell.is-support {
    aspect-ratio: auto;
    min-height: 0;
  }
  .fq-media-grid.is-opening .fq-media-grid__cell.is-cover,
  .fq-media-grid.is-mosaic-top .fq-media-grid__cell.is-cover {
    aspect-ratio: var(--fq-lead-ratio, 1.5);
    width: 100%;
    height: auto;
    max-height: none;
  }
  .fq-media-grid.is-opening .fq-media-grid__cell.is-cover img,
  .fq-media-grid.is-mosaic-top .fq-media-grid__cell.is-cover img,
  .fq-media-grid.is-hero-support .fq-media-grid__cell.is-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .fq-media-grid.is-gallery .fq-media-grid__cell img.is-contain {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.fq-media-grid__count {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 6, 8, 0.64);
  color: #f7f9fc;
  font-size: clamp(1.05rem, 4vw, 1.45rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  pointer-events: none;
}

@media (max-width: 719px) {
  .fq-media-grid.is-gallery.is-pair-split {
    grid-template-columns: 1fr;
    gap: 0.32rem;
  }
  .fq-media-grid.is-gallery.is-pair-split .fq-media-grid__cell:first-child {
    min-height: 14rem;
  }
  .fq-media-grid.is-gallery.is-hero-support {
    grid-template-columns: 1fr;
    min-height: 0;
    gap: 0.32rem;
  }
  .fq-media-grid.is-gallery.is-hero-support .fq-media-grid__cell.is-hero {
    min-height: 15.5rem;
    aspect-ratio: 4 / 5;
  }
  .fq-media-grid.is-gallery.is-hero-support .fq-media-grid__stack {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    min-height: 0;
    gap: 0.32rem;
  }
  .fq-media-grid.is-gallery.is-hero-support .fq-media-grid__cell.is-support {
    aspect-ratio: 1 / 1;
  }
}

@media (hover: hover) and (pointer: fine) {
  .fq-media-grid:not(.is-static):not(.is-gallery) .fq-media-grid__cell:hover img {
    filter: brightness(0.92);
  }
  .fq-media-grid.is-gallery:not(.is-static) .fq-media-grid__cell:hover img {
    filter: brightness(0.9);
  }
}
.fq-media-grid.is-static .fq-media-grid__cell {
  cursor: inherit;
}
@media (prefers-reduced-motion: reduce) {
  .fq-media-grid__cell img {
    transition: none;
    filter: none;
    transform: none;
  }
}
</style>
