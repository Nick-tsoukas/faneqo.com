<template>
  <div class="export" :data-preview="preview || 'art'">
    <div v-if="preview === 'feed'" class="export__bar">
      <span class="export__dot" />
      <span>faneqo</span>
    </div>
    <div class="export__frame">
      <component :is="Creative" :format="format" />
      <div v-if="preview === 'grid'" class="export__crop" aria-hidden="true">
        <div v-if="crop.top" class="is-top" :style="{ height: `${crop.top}px` }" />
        <div v-if="crop.bottom" class="is-bottom" :style="{ height: `${crop.bottom}px` }" />
        <div v-if="crop.left" class="is-left" :style="{ width: `${crop.left}px` }" />
        <div v-if="crop.right" class="is-right" :style="{ width: `${crop.right}px` }" />
      </div>
      <div v-if="preview === 'story'" class="export__zones" aria-hidden="true">
        <div class="is-top" :style="{ height: `${AD_SAFE_ZONES.story.top}px` }" />
        <div class="is-bottom" :style="{ height: `${AD_SAFE_ZONES.story.bottom}px` }" />
      </div>
      <div v-if="guideFrame" class="export__safe" :style="guideFrame" aria-hidden="true" />
    </div>
    <p v-if="preview === 'grid'" class="export__note">Profile grid keeps a centered 3:4 thumbnail. The post itself is the full image.</p>
    <p v-else-if="preview === 'story'" class="export__note">Story overlay guide. It is not part of the image.</p>
  </div>
</template>

<script setup>
import { findAd } from '~/features/ads/catalog.js'
import { AD_SAFE_ZONES, gridCrop, gridSafeZone, resolveAdFormat } from '~/features/ads/formats.js'
import { adComponentFor } from '~/features/ads/registry.js'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const route = useRoute()
const ad = findAd(String(route.query.slug || ''))
const Creative = ad ? adComponentFor(ad.slug) : null

if (!ad || !Creative) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const preview = computed(() => {
  const value = String(route.query.preview || '')
  return value === 'feed' || value === 'grid' || value === 'story' ? value : ''
})

const format = computed(() => {
  const asked = String(route.query.format || '')
  if (preview.value === 'story') return resolveAdFormat('story', ad.formats)
  if (preview.value === 'feed' || preview.value === 'grid') {
    const feedFormats = ad.formats.filter((f) => f !== 'story')
    return resolveAdFormat(asked, feedFormats.length ? feedFormats : ad.formats)
  }
  return resolveAdFormat(asked, ad.formats)
})

const crop = computed(() => gridCrop(format.value))
const showGuides = computed(() => String(route.query.guides || '') === '1')

const guideFrame = computed(() => {
  if (!showGuides.value || preview.value === 'story') return null
  const zone = preview.value === 'grid'
    ? gridSafeZone(format.value)
    : { ...AD_SAFE_ZONES[format.value], left: AD_SAFE_ZONES[format.value].side, right: AD_SAFE_ZONES[format.value].side }
  return {
    top: `${zone.top}px`,
    right: `${zone.right}px`,
    bottom: `${zone.bottom}px`,
    left: `${zone.left}px`,
  }
})

useHead({
  title: 'Ad export',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<style>
html,
body,
#__nuxt {
  margin: 0;
  background: #050506;
}

[class*='nuxt-devtools'] {
  display: none !important;
}

.export {
  display: inline-flex;
  flex-direction: column;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.export__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 1080px;
  padding: 22px 24px;
  font-size: 28px;
  font-weight: 600;
}

.export__dot {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: #1c1d22;
}

.export__frame {
  position: relative;
  width: 1080px;
}

.export__crop,
.export__zones {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.export__crop > div,
.export__zones > div {
  position: absolute;
  background: rgba(5, 5, 6, 0.72);
}

.export__crop .is-top,
.export__crop .is-bottom,
.export__zones .is-top,
.export__zones .is-bottom {
  right: 0;
  left: 0;
}

.export__crop .is-left,
.export__crop .is-right {
  top: 0;
  bottom: 0;
}

.export__crop .is-top { top: 0; box-shadow: inset 0 -3px 0 #f7f9fc; }
.export__crop .is-bottom { bottom: 0; box-shadow: inset 0 3px 0 #f7f9fc; }
.export__crop .is-left { left: 0; box-shadow: inset -3px 0 0 #f7f9fc; }
.export__crop .is-right { right: 0; box-shadow: inset 3px 0 0 #f7f9fc; }
.export__zones .is-top { top: 0; }
.export__zones .is-bottom { bottom: 0; }

.export__safe {
  position: absolute;
  border: 2px solid rgba(126, 231, 255, 0.9);
  pointer-events: none;
}

.export__note {
  width: 1080px;
  margin: 0;
  padding: 18px 24px 28px;
  color: rgba(247, 249, 252, 0.62);
  font-size: 22px;
  line-height: 1.35;
}
</style>
