<template>
  <div
    class="ad-player"
    :class="{ 'is-clean': clean }"
    :data-fullscreen="isFullscreen ? 'true' : 'false'"
    @wheel.prevent
  >
    <header v-if="!clean" class="ad-player__bar">
      <NuxtLink class="ad-player__back" to="/ads">Ads</NuxtLink>
      <div class="ad-player__formats" role="group" aria-label="Format">
        <button
          v-for="option in formatOptions"
          :key="option.id"
          type="button"
          class="ad-player__format"
          :aria-pressed="formatId === option.id"
          :disabled="!option.supported"
          :title="option.supported ? option.title : `No ${option.ratio} composition`"
          @click="setFormat(option.id)"
        >
          {{ option.chip }}
        </button>
      </div>
      <div class="ad-player__tools">
        <p v-if="hasScenes" class="ad-player__count">{{ sceneNumber }} / {{ sceneCount }}</p>
        <button
          type="button"
          class="ad-player__text"
          :aria-pressed="guidesOn"
          @click="guidesOn = !guidesOn"
        >
          Guides
        </button>
        <button type="button" class="ad-player__text" @click="enterClean">Clean</button>
        <button
          type="button"
          class="ad-player__download"
          :disabled="exporting"
          :title="`Save ${downloadName} at ${board.width}×${board.height}`"
          @click="downloadPng"
        >
          {{ exporting ? 'Rendering…' : 'Download PNG' }}
        </button>
      </div>
    </header>

    <div v-if="!clean" class="ad-player__preview" role="group" aria-label="Instagram preview">
      <button type="button" :aria-pressed="preview === 'art'" @click="setPreview('art')">Artwork</button>
      <button type="button" :aria-pressed="preview === 'feed'" :disabled="!supportsPostOrFeed" @click="setPreview('feed')">Post</button>
      <button type="button" :aria-pressed="preview === 'grid'" :disabled="!supportsPostOrFeed" @click="setPreview('grid')">Grid</button>
      <button type="button" :aria-pressed="preview === 'story'" :disabled="!supportsStory" @click="setPreview('story')">Story</button>
      <p v-if="exportStatus" class="ad-player__hint" :class="{ 'is-error': exportError }" role="status">
        {{ exportStatus }}
      </p>
      <p v-else-if="formatId === 'story' && supportsPostOrFeed" class="ad-player__hint">
        A 9:16 file posted to the feed is cropped to 3:4. Use Post · 3:4 for organic posts, Ad · 4:5 for ads.
      </p>
      <p v-else-if="preview === 'grid'" class="ad-player__hint">
        {{ gridHint }}
      </p>
      <p v-else-if="guidesOn && formatId !== 'story'" class="ad-player__hint">
        The frame is the 80px safe area. Keep important content inside it.
      </p>
      <p v-else class="ad-player__hint">
        {{ board.title }} · {{ downloadName }}
      </p>
    </div>

    <div class="ad-player__stage">
      <div v-if="showFeedShell" class="ig-post">
        <div class="ig-post__card">
          <div class="ig-post__bar">
            <span class="ig-post__dot" />
            <span>faneqo</span>
          </div>
          <div class="ig-post__art" :style="{ aspectRatio: `${board.width} / ${board.height}` }">
            <AdStage :width="board.width" :height="board.height" :guides="guideBox" :mask="gridMask" :frame="safeFrame">
              <component :is="AdCreative" v-bind="creativeProps" />
            </AdStage>
          </div>
        </div>
      </div>
      <AdStage v-else :width="board.width" :height="board.height" :guides="guideBox" :mask="gridMask" :frame="safeFrame">
        <component :is="AdCreative" v-bind="creativeProps" />
      </AdStage>
    </div>

    <!-- Off-screen 1:1 copy of the creative. Only exists while a PNG is rendering. -->
    <div
      v-if="exporting"
      ref="exportHost"
      class="ad-export"
      :style="{ width: `${board.width}px`, height: `${board.height}px` }"
      aria-hidden="true"
    >
      <component :is="AdCreative" v-bind="exportProps" />
    </div>

    <footer v-if="!clean && hasScenes" class="ad-player__bar ad-player__controls">
      <button type="button" class="ad-player__text" :disabled="isFirst" @click="showScene(sceneNumber - 1)">
        Previous
      </button>
      <button type="button" class="ad-player__text" :disabled="isLast" @click="showScene(sceneNumber + 1)">
        Next
      </button>
    </footer>

    <template v-if="clean && hasScenes">
      <button
        type="button"
        class="ad-edge ad-edge--prev"
        aria-label="Previous scene"
        :disabled="isFirst"
        @click="showScene(sceneNumber - 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        class="ad-edge ad-edge--next"
        aria-label="Next scene"
        :disabled="isLast"
        @click="showScene(sceneNumber + 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AdStage from '@/features/ads/AdStage.vue'
import { findAd } from '@/features/ads/catalog.js'
import { pngDimensions, renderNodeToPng, savePngBlob } from '@/features/ads/exportPng.js'
import {
  AD_FORMATS,
  AD_FORMAT_ORDER,
  AD_SAFE_ZONES,
  adFileName,
  gridCrop,
  gridSafeZone,
  isAdFormat,
  resolveAdFormat,
} from '@/features/ads/formats.js'
import { adComponentFor } from '@/features/ads/registry.js'

definePageMeta({
  middleware: ['auth', 'ads'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

const route = useRoute()
const router = useRouter()
const ad = findAd(String(route.params.slug || ''))

const AdCreative = ad ? adComponentFor(ad.slug) : null

if (!ad || !AdCreative) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  })
}

useHead({
  title: ad.title,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const sceneCount = ad.sceneCount
const hasScenes = sceneCount > 1
const clean = ref(false)
const guidesOn = ref(false)
const preview = ref('art')
const isFullscreen = ref(false)
const exporting = ref(false)
const exportStatus = ref('')
const exportError = ref(false)
const exportHost = ref(null)
const supportsPostOrFeed = ad.formats.includes('post') || ad.formats.includes('feed')
const supportsStory = ad.formats.includes('story')
const formatOptions = AD_FORMAT_ORDER.map((id) => ({
  ...AD_FORMATS[id],
  supported: ad.formats.includes(id),
}))

function sceneQueryValue(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const text = String(value ?? '')
  if (!/^[1-9]$/.test(text)) return null
  const number = Number(text)
  if (number < 1 || number > sceneCount) return null
  return number
}

function formatQueryValue(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const text = String(value ?? '')
  return isAdFormat(text) ? text : ''
}

const sceneNumber = computed(() => sceneQueryValue(route.query.scene) ?? 1)
const sceneIndex = computed(() => sceneNumber.value - 1)
const formatId = computed(() => resolveAdFormat(formatQueryValue(route.query.format), ad.formats))
const board = computed(() => AD_FORMATS[formatId.value])
const guideBox = computed(() => {
  if (clean.value) return null
  if (preview.value === 'story') return AD_SAFE_ZONES.story
  if (guidesOn.value && formatId.value === 'story') return AD_SAFE_ZONES.story
  return null
})
const safeFrame = computed(() => {
  if (clean.value || !guidesOn.value || formatId.value === 'story') return null
  if (preview.value === 'grid') return gridSafeZone(formatId.value)
  return AD_SAFE_ZONES[formatId.value]
})
const gridMask = computed(() => {
  if (clean.value || preview.value !== 'grid') return null
  const crop = gridCrop(formatId.value)
  return crop.top || crop.left ? crop : { top: 0, bottom: 0, left: 0, right: 0 }
})
const gridHint = computed(() => {
  const crop = gridCrop(formatId.value)
  if (!crop.top && !crop.left) return 'A 3:4 post fills the current profile-grid thumbnail. Nothing is trimmed.'
  if (crop.left) return `The grid shows a centered 3:4 thumbnail. A 4:5 image loses about ${crop.left}px on each side.`
  return `Posted to the feed, a 9:16 file is cut to 3:4. About ${crop.top}px go from the top and bottom.`
})
const showFeedShell = computed(() => !clean.value && preview.value === 'feed')
const creativeProps = computed(() => {
  const props = { format: formatId.value }
  if (hasScenes) props.scene = sceneIndex.value
  return props
})
const exportProps = computed(() => (
  hasScenes ? { ...creativeProps.value, still: true } : creativeProps.value
))
const downloadName = computed(() => (
  adFileName(ad, formatId.value, hasScenes ? sceneNumber.value : null)
))
const isFirst = computed(() => sceneNumber.value <= 1)
const isLast = computed(() => sceneNumber.value >= sceneCount)

function showScene(number) {
  const next = Math.min(sceneCount, Math.max(1, number))
  if (sceneQueryValue(route.query.scene) === next) return
  router.replace({ query: { ...route.query, scene: String(next) } })
}

function setFormat(id, nextPreview = 'art') {
  preview.value = nextPreview
  if (!ad.formats.includes(id) || formatId.value === id) return
  router.replace({ query: { ...route.query, format: id } })
}

function setPreview(id) {
  if (id === 'feed' || id === 'grid') {
    // Post and Grid previews show whichever feed canvas is selected. Only leave story.
    const keep = formatId.value !== 'story' ? formatId.value : resolveAdFormat('post', ad.formats.filter((f) => f !== 'story'))
    setFormat(keep, id)
  } else if (id === 'story') {
    setFormat('story', id)
  } else {
    preview.value = 'art'
  }
}

async function downloadPng() {
  if (exporting.value) return
  const size = { width: board.value.width, height: board.value.height }
  const fileName = downloadName.value
  exporting.value = true
  exportError.value = false
  exportStatus.value = `Rendering ${size.width}×${size.height}…`
  try {
    await nextTick()
    const node = exportHost.value?.firstElementChild
    if (!node) throw new Error('The creative did not mount for export.')
    // Let the fresh instance settle. The motion ad reveals on mount.
    await new Promise((resolve) => setTimeout(resolve, hasScenes ? 900 : 120))
    const blob = await renderNodeToPng(node, size)
    const dims = await pngDimensions(blob)
    if (dims.width !== size.width || dims.height !== size.height) {
      throw new Error(`Rendered ${dims.width}×${dims.height}, expected ${size.width}×${size.height}.`)
    }
    savePngBlob(blob, fileName)
    exportStatus.value = `Saved ${fileName} · ${dims.width}×${dims.height}`
  } catch (error) {
    exportError.value = true
    exportStatus.value = `Download failed: ${error?.message || error}`
  } finally {
    exporting.value = false
    setTimeout(() => {
      if (!exportError.value) exportStatus.value = ''
    }, 6000)
  }
}

async function enterClean() {
  clean.value = true
  const root = document.documentElement
  if (!document.fullscreenElement && root.requestFullscreen) {
    try {
      await root.requestFullscreen()
    } catch {
      // Fullscreen can be denied. Clean mode still hides the studio chrome.
    }
  }
}

async function leaveClean() {
  clean.value = false
  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen()
    } catch {
      // fullscreenchange resyncs the browser flag.
    }
  }
}

function onFullscreenChange() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

function onKeydown(event) {
  if (event.altKey || event.metaKey || event.ctrlKey) return
  const tag = event.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    if (!isLast.value) showScene(sceneNumber.value + 1)
    return
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    if (!isFirst.value) showScene(sceneNumber.value - 1)
    return
  }
  if (event.key === 'Escape' && (clean.value || document.fullscreenElement)) {
    leaveClean()
  }
}

onMounted(() => {
  isFullscreen.value = Boolean(document.fullscreenElement)
  const raw = route.query.scene
  const nextQuery = { ...route.query }
  let replace = false
  if (raw != null && raw !== '' && sceneQueryValue(raw) == null) {
    nextQuery.scene = '1'
    replace = true
  }
  const asked = formatQueryValue(route.query.format)
  if (!asked || asked !== formatId.value) {
    nextQuery.format = formatId.value
    replace = true
  }
  if (replace) router.replace({ query: nextQuery })
  window.addEventListener('keydown', onKeydown, true)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown, true)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  }
})
</script>

<style scoped>
.ad-player {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.ad-player__bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 12px 28px;
}

.ad-player__stage {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  padding: 0 28px 8px;
}

.ad-player__stage :deep(.ad-stage-host) {
  flex: 1 1 auto;
  height: auto;
}

.ad-player__preview {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 0 28px 8px;
}

.ad-player__preview button {
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.62);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.ad-player__preview button[aria-pressed="true"] {
  background: rgba(247, 249, 252, 0.12);
  color: #f7f9fc;
}

.ad-player__preview button:disabled {
  color: rgba(247, 249, 252, 0.22);
  cursor: default;
}

.ad-player__hint {
  margin: 0 0 0 8px;
  color: rgba(247, 249, 252, 0.48);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.3;
  text-transform: none;
}

.ad-player__hint.is-error {
  color: #ff8aa8;
}

.ad-player__download {
  padding: 9px 16px;
  border: 0;
  border-radius: 999px;
  background: #f7f9fc;
  color: #050506;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.ad-player__download:disabled {
  opacity: 0.55;
  cursor: progress;
}

.ad-player__download:focus-visible {
  outline: 1px solid rgba(126, 231, 255, 0.7);
  outline-offset: 4px;
}

/* Full-size copy used only while rendering a PNG. Laid out, never seen. */
.ad-export {
  position: fixed;
  top: 0;
  left: -20000px;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.ig-post {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.ig-post__card {
  display: flex;
  flex-direction: column;
  width: min(100%, 440px);
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: #000;
}

.ig-post__bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: #f7f9fc;
  font-size: 13px;
  font-weight: 600;
}

.ig-post__dot {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #1c1d22;
}

.ig-post__art {
  flex: 1 1 auto;
  min-height: 0;
  aspect-ratio: 3 / 4;
}

.ig-post__art :deep(.ad-stage-host) {
  height: 100%;
}

.ad-player.is-clean .ad-player__stage {
  padding: 0;
}

.ad-player__back {
  color: rgba(247, 249, 252, 0.72);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
}

.ad-player__back:hover,
.ad-player__back:focus-visible {
  color: #f7f9fc;
}

.ad-player__count {
  margin: 0;
  color: rgba(247, 249, 252, 0.46);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.14em;
}

.ad-player__formats {
  display: flex;
  gap: 6px;
}

.ad-player__format,
.ad-player__text {
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.72);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.ad-player__format {
  padding: 8px 12px;
  border-radius: 999px;
}

.ad-player__format[aria-pressed="true"] {
  background: #f7f9fc;
  color: #050506;
}

.ad-player__format:disabled {
  color: rgba(247, 249, 252, 0.22);
  cursor: default;
}

.ad-player__tools {
  display: flex;
  align-items: center;
  gap: 18px;
}

.ad-player__text[aria-pressed="true"] {
  color: #7ee7ff;
}

.ad-player__text:hover:not(:disabled),
.ad-player__text:focus-visible:not(:disabled),
.ad-player__format:hover:not(:disabled),
.ad-player__format:focus-visible:not(:disabled) {
  color: #f7f9fc;
}

.ad-player__format[aria-pressed="true"]:hover,
.ad-player__format[aria-pressed="true"]:focus-visible {
  color: #050506;
}

.ad-player__text:disabled {
  color: rgba(247, 249, 252, 0.22);
  cursor: default;
}

.ad-player__text:focus-visible,
.ad-player__format:focus-visible,
.ad-player__back:focus-visible,
.ad-edge:focus-visible {
  outline: 1px solid rgba(126, 231, 255, 0.7);
  outline-offset: 4px;
}

.ad-edge {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 72px;
  border: 0;
  background: transparent;
  color: transparent;
  cursor: pointer;
}

.ad-edge svg {
  width: 28px;
  height: 28px;
  opacity: 0;
  transition: opacity 160ms ease;
}

.ad-edge:hover svg,
.ad-edge:focus-visible svg {
  opacity: 0.8;
  color: #f7f9fc;
}

.ad-edge:disabled {
  cursor: default;
}

.ad-edge:disabled svg,
.ad-edge:disabled:hover svg {
  opacity: 0;
}

.ad-edge--prev { left: 0; }
.ad-edge--next { right: 0; }

@media (prefers-reduced-motion: reduce) {
  .ad-edge svg {
    transition: none;
  }
}
</style>
