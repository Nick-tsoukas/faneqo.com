<template>
  <main class="ed" :class="{ 'is-clean': clean }">
    <template v-if="creative">
      <header v-if="!clean" class="ed__bar">
        <div class="ed__left">
          <NuxtLink class="ed__back" to="/ads">Library</NuxtLink>
          <input
            class="ed__title"
            type="text"
            maxlength="160"
            :value="creative.title"
            :placeholder="autoTitle"
            aria-label="Creative title"
            @input="setTitle($event.target.value)"
          />
        </div>
        <div class="ed__right">
          <span class="ed__storage" :class="{ 'is-local': creative.storage !== 'api' }" :title="storageTitle">{{ storageLabel }}</span>
          <button type="button" class="ed__save" :disabled="saving || (!dirty && creative.storage === 'api')" @click="save">{{ saving ? 'Saving…' : dirty ? 'Save' : 'Saved' }}</button>
          <button type="button" class="ed__download--bar" :class="videoExportReady ? 'ed__text' : 'ed__download'" :disabled="exporter.exporting.value" @click="download">{{ motionFilm ? 'PNG' : 'Download' }}</button>
        </div>
      </header>

      <div class="ed__grid">
        <aside v-if="!clean" class="ed__panel">
          <div class="ed__project">
            <p class="ed__section">Project</p>
            <div class="seg" role="group" aria-label="Intended use">
              <button type="button" :aria-pressed="creative.kind === 'post'" @click="setKind('post')">Organic</button>
              <button type="button" :aria-pressed="creative.kind === 'ad'" @click="setKind('ad')">Paid</button>
            </div>
            <div class="seg" role="group" aria-label="Production status">
              <button type="button" :aria-pressed="creative.status === 'draft'" @click="setStatus('draft')">Draft</button>
              <button type="button" :aria-pressed="creative.status === 'ready'" @click="setStatus('ready')">Ready</button>
            </div>
            <p class="ed__storage" :class="{ 'is-local': creative.storage !== 'api' }">{{ storageLabel }}</p>
            <div class="ed__mobile-actions">
              <button v-if="canPromote" type="button" class="ed__text" :disabled="saving" @click="saveToFaneqo">Save to Faneqo</button>
              <button type="button" class="ed__text" :disabled="busy" @click="duplicate">Duplicate</button>
              <button type="button" class="ed__text ed__text--danger" :disabled="busy" @click="remove">Delete</button>
            </div>
          </div>
          <div class="ed__mobile-manage">
            <input
              class="ed__title"
              type="text"
              maxlength="160"
              :value="creative.title"
              :placeholder="autoTitle"
              aria-label="Creative title"
              @input="setTitle($event.target.value)"
            />
          </div>
          <p v-if="readinessMessage" class="ed__status" role="status">{{ readinessMessage }}</p>
          <p v-if="panelStatus" class="ed__status" :class="{ 'is-error': panelError }" role="status">{{ panelStatus }}</p>
          <div class="ed__family">
            <p class="ed__section">Content</p>
            <p class="kicker">{{ subjectMeta?.label || family.name }}</p>
            <p class="muted">{{ subjectMeta?.line || family.tagline }}</p>
          </div>
          <ContentControls :family="family" :content="creative.content" :snapshot="creative.snapshot" :paid="creative.kind === 'ad'" :uploads="libraryUploads" :format="formatId" @patch="patch" @artist="changeArtist" />
          <details class="ed__pub">
            <summary>Publishing package</summary>
            <PublishingPanel :creative="live" />
          </details>
        </aside>

        <section class="ed__stage-col" aria-label="Canvas" @wheel="onStageWheel">
          <div v-if="!clean" class="ed__tools">
            <div class="ed__formats" role="group" aria-label="Format">
              <span class="ed__group">Format</span>
              <button
                v-for="option in formatOptions"
                :key="option.id"
                type="button"
                class="ed__format"
                :aria-pressed="formatId === option.id"
                :disabled="!option.supported"
                :aria-label="option.title"
                :title="option.supported ? option.title : `No ${option.ratio} composition for this family`"
                @click="setFormat(option.id)"
              >
                {{ option.ratio }}
              </button>
            </div>
            <div class="ed__actions">
              <p v-if="hasScenes" class="ed__count">{{ sceneIndex + 1 }} / {{ sceneCount }}</p>
              <button type="button" class="ed__text" :aria-pressed="guidesOn" @click="guidesOn = !guidesOn">Guides</button>
              <button type="button" class="ed__text" @click="enterClean">Clean</button>
              <button
                type="button"
                class="ed__png"
                :class="videoExportReady ? 'ed__text' : 'ed__download'"
                :disabled="exporter.exporting.value"
                :title="`Save ${downloadName} at ${board.width}×${board.height}`"
                @click="download"
              >
                {{ exporter.exporting.value ? 'Rendering…' : 'Download PNG' }}
              </button>
              <button v-if="hasScenes" type="button" class="ed__text" :disabled="exporter.exporting.value" @click="downloadAll">All {{ sceneCount }}</button>
            </div>
          </div>

          <div v-if="!clean" class="ed__preview" role="group" aria-label="Placement preview">
            <span class="ed__group">Preview</span>
            <button type="button" :aria-pressed="preview === 'art'" @click="setPreview('art')">Artwork</button>
            <button type="button" :aria-pressed="preview === 'feed'" :disabled="!supportsFeed" @click="setPreview('feed')">Feed</button>
            <button type="button" :aria-pressed="preview === 'grid'" :disabled="!supportsFeed" @click="setPreview('grid')">Grid</button>
            <button type="button" :aria-pressed="preview === 'story'" :disabled="!supportsStory" @click="setPreview('story')">Frame</button>
            <p v-if="exporter.status.value" class="ed__hint" :class="{ 'is-error': exporter.failed.value }" role="status">{{ exporter.status.value }}</p>
            <p v-else-if="preview === 'grid'" class="ed__hint">{{ gridHint }} Simulated placement.</p>
            <p v-else-if="preview === 'story' || (guidesOn && formatId === 'story')" class="ed__hint">Shaded bands simulate Instagram's story chrome. Keep text out of them.</p>
            <p v-else-if="guidesOn" class="ed__hint">The frame is the 80px safe area. Keep important content inside it.</p>
            <p v-else-if="preview === 'feed'" class="ed__hint">Simulated feed card. Instagram's real rendering varies by app version.</p>
            <p v-else class="ed__hint">{{ board.ratio }} · {{ board.width }}×{{ board.height }}</p>
            <p v-if="motionFilm && formatId !== 'story'" class="ed__hint">Video plays in 9:16. This format is a still.</p>
          </div>

          <div v-if="!clean && motionFilm && formatId === 'story'" class="ed__motion" role="group" aria-label="Motion and export">
            <span class="ed__section">Motion</span>
            <button type="button" :aria-pressed="motionOn" @click="toggleMotion">{{ motionOn ? 'On' : 'Off' }}</button>
            <template v-if="motionOn">
              <button type="button" class="ed__motion-action" @click="togglePlay">{{ playing ? 'Pause' : 'Play' }}</button>
              <button type="button" class="ed__motion-action" @click="restartMotion">Restart</button>
              <input
                v-model.number="motionTime"
                type="range"
                min="0"
                :max="motionDuration"
                step="50"
                aria-label="Timeline"
                @pointerdown="pauseMotion"
              >
              <span class="ed__motion-time">{{ motionClockLabel }} / {{ motionDurationLabel }}</span>
              <label class="ed__motion-close">
                <span>Close</span>
                <input :value="motionClose" maxlength="120" aria-label="Closing line" @input="setMotionClose">
              </label>
            </template>
            <template v-if="motionOn && motionFilm">
              <span class="ed__section">Export</span>
              <button v-if="videoExportReady" type="button" class="ed__download ed__motion-action" :disabled="videoBusy" @click="exportMp4">{{ videoBusy ? 'Rendering…' : 'Export MP4' }}</button>
              <button v-if="videoBusy || videoMode === 'progress'" type="button" class="ed__motion-action" @click="cancelMp4">Cancel</button>
            </template>
            <p v-if="exportHint" class="ed__hint" :class="{ 'is-error': videoError }" role="status">{{ exportHint }}</p>
          </div>

          <div class="ed__stage">
            <div v-if="showFeedShell" class="ig-post">
              <div class="ig-post__card">
                <div class="ig-post__bar">
                  <span class="ig-post__dot" />
                  <span>{{ handle }}</span>
                </div>
                <div class="ig-post__art" :style="{ aspectRatio: `${board.width} / ${board.height}` }">
                  <AdStage :width="board.width" :height="board.height" :guides="guideBox" :mask="gridMask" :frame="safeFrame">
                    <component :is="Template" :format="formatId" :content="creative.content" :snapshot="creative.snapshot" :scene="sceneIndex" :t="motionClock" />
                  </AdStage>
                </div>
              </div>
            </div>
            <AdStage v-else :width="board.width" :height="board.height" :guides="guideBox" :mask="gridMask" :frame="safeFrame">
              <component :is="Template" :format="formatId" :content="creative.content" :snapshot="creative.snapshot" :scene="sceneIndex" :t="motionClock" />
            </AdStage>
          </div>

          <footer v-if="!clean && hasScenes" class="ed__scenes">
            <button type="button" class="ed__text" :disabled="sceneIndex <= 0" @click="showScene(sceneIndex - 1)">Previous</button>
            <button type="button" class="ed__text" :disabled="sceneIndex >= sceneCount - 1" @click="showScene(sceneIndex + 1)">Next</button>
          </footer>
        </section>
      </div>

      <!-- Off-screen 1:1 copy, mounted only while a PNG renders. -->
      <div
        v-if="exportMounted"
        ref="exportHost"
        class="ed__export"
        :style="{ width: `${board.width}px`, height: `${board.height}px` }"
        aria-hidden="true"
      >
        <component :is="Template" :format="formatId" :content="creative.content" :snapshot="creative.snapshot" :scene="exportSceneIndex" />
      </div>

      <template v-if="clean && hasScenes">
        <button type="button" class="ed__edge ed__edge--prev" aria-label="Previous scene" :disabled="sceneIndex <= 0" @click="showScene(sceneIndex - 1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button type="button" class="ed__edge ed__edge--next" aria-label="Next scene" :disabled="sceneIndex >= sceneCount - 1" @click="showScene(sceneIndex + 1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </template>
    </template>

    <div v-else class="ed__loading">
      <p v-if="loadError" role="alert">{{ loadError }} <NuxtLink to="/ads">Back to the library</NuxtLink></p>
      <p v-else>Loading creative…</p>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AdStage from '@/features/ads/AdStage.vue'
import ContentControls from '@/features/ads/studio/editor/ContentControls.vue'
import PublishingPanel from '@/features/ads/studio/editor/PublishingPanel.vue'
import { AD_FORMATS, AD_FORMAT_ORDER, AD_SAFE_ZONES, gridCrop, gridSafeZone, isAdFormat } from '@/features/ads/formats.js'
import { applyArtistSnapshot, creativeFileName, creativeTitle, finalizeCreative } from '@/features/ads/studio/creativeModel.js'
import { FAN_LIST_CLOSE, NIGHT_CLOSE, PRODUCT_MOTION_CLOSE, defaultProductMotion, formatMotionClock, motionSettings, productMotionFilm } from '@/features/ads/studio/motion.js'
import { productStyle } from '@/features/ads/studio/campaigns.js'
import { motionDownloadName } from '@/features/ads/studio/motionExport.js'
import { isSavedCreativeId, VIDEO_OUTPUT } from '@/features/ads/studio/videoExportContract.js'
import { pieceReadiness, subjectForCreative } from '@/features/ads/studio/creativeCatalog.js'
import { templateComponentFor, templateFamily } from '@/features/ads/studio/templates/index.js'
import { useCreativeExport } from '@/features/ads/studio/useCreativeExport.js'
import { useCreativeStore } from '@/features/ads/studio/useCreativeStore.js'
import { collectStudioUploads } from '@/features/ads/studio/studioUploads.js'
import { isPlaceholderText } from '@/features/ads/studio/artistSnapshot.js'

definePageMeta({
  middleware: ['auth', 'ads'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

const route = useRoute()
const router = useRouter()
const store = useCreativeStore()
const exporter = useCreativeExport()

const creative = ref(null)
const loadError = ref('')
const dirty = ref(false)
const saving = ref(false)
const busy = ref(false)
const panelStatus = ref('')
const panelError = ref(false)
const clean = ref(false)
const guidesOn = ref(false)
const preview = ref('art')
const sceneIndex = ref(0)
const formatId = ref('post')
const exportMounted = ref(false)
const exportSceneIndex = ref(0)
const exportHost = ref(null)
const MOTION_PREVIEW_MS = 6400
const motionTime = ref(0)
const playing = ref(false)
const reduceMotion = ref(false)
const videoStatus = ref('')
const videoError = ref(false)
const videoJob = ref('')
const workerReady = ref(false)
let videoPoll = 0
let statusTimer = null
let motionRaf = 0
let motionLast = 0

useHead(() => ({
  title: creative.value ? (creative.value.title || 'Creative') : 'Creative',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
}))

const family = computed(() => templateFamily(creative.value?.templateId))
const Template = computed(() => templateComponentFor(creative.value?.templateId))
/** Derived view of the draft: title, rights, scene count, all current. */
const live = computed(() => (creative.value ? finalizeCreative({ ...creative.value, title: creative.value.title || '' }) : null))
const autoTitle = computed(() => (creative.value ? creativeTitle({ ...creative.value, title: '' }) : ''))
const sceneCount = computed(() => live.value?.sceneCount || 1)
const hasScenes = computed(() => sceneCount.value > 1)
const board = computed(() => AD_FORMATS[formatId.value] || AD_FORMATS.post)
const supported = computed(() => family.value?.formats || [])
const supportsFeed = computed(() => supported.value.includes('post') || supported.value.includes('feed') || supported.value.includes('square'))
const supportsStory = computed(() => supported.value.includes('story'))
const formatOptions = computed(() => AD_FORMAT_ORDER.map((id) => ({ ...AD_FORMATS[id], supported: supported.value.includes(id) })))
const downloadName = computed(() => (live.value ? creativeFileName(live.value, formatId.value, hasScenes.value ? sceneIndex.value + 1 : null) : ''))
const handle = computed(() => (creative.value?.bandSlug ? creative.value.bandSlug.replace(/[^a-z0-9._]/g, '') : 'faneqo'))
/* Artwork uploaded for other creatives in the library, offered for reuse by reference (no re-upload). */
const libraryUploads = computed(() => collectStudioUploads(store.items.value.filter((c) => String(c.id) !== String(creative.value?.id))))
const canPromote = computed(() => creative.value?.storage !== 'api' && store.hasToken.value)
const storageLabel = computed(() => {
  if (!creative.value) return ''
  if (creative.value.storage === 'api') return dirty.value ? 'Unsaved changes' : 'Saved to Faneqo'
  if (dirty.value) return 'Unsaved · this device'
  return 'This device only'
})
const storageTitle = computed(() => (creative.value?.storage === 'api'
  ? 'Stored in your private Faneqo creative library.'
  : store.hasToken.value
    ? 'On this device. Choose Save to Faneqo to copy it into your account. The device copy stays until that succeeds.'
    : 'This device only. No Faneqo session in this browser, so clearing site data removes it.'))

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
  if (!crop.top && !crop.left) return 'A 3:4 post fills the profile-grid thumbnail. Nothing is trimmed.'
  if (crop.left) return `The grid shows a centred 3:4 thumbnail. About ${crop.left}px go from each side.`
  return `Posted to the feed, this file is cut to 3:4. About ${crop.top}px go from the top and bottom.`
})
const showFeedShell = computed(() => !clean.value && preview.value === 'feed')

function flash(text, isError = false) {
  panelStatus.value = text
  panelError.value = isError
  if (statusTimer) clearTimeout(statusTimer)
  if (!isError) statusTimer = setTimeout(() => { panelStatus.value = '' }, 4000)
}

function markDirty() {
  dirty.value = true
}

function patch(partial) {
  if (!creative.value) return
  Object.assign(creative.value.content, partial)
  if ('variant' in partial) creative.value.variant = partial.variant
  const next = finalizeCreative({ ...creative.value, title: creative.value.title || '' })
  creative.value.sceneCount = next.sceneCount
  creative.value.rightsStatus = next.rightsStatus
  if (sceneIndex.value > next.sceneCount - 1) sceneIndex.value = Math.max(0, next.sceneCount - 1)
  markDirty()
}

function setTitle(text) {
  creative.value.title = text
  markDirty()
}

function setKind(kind) {
  if (creative.value.kind === kind) return
  creative.value.kind = kind
  markDirty()
}

function setStatus(status) {
  if (creative.value.status === status) return
  if (status === 'ready' && creative.value.templateId === 'product-showcase') {
    const snap = creative.value.snapshot || {}
    const blocked = []
    if (isPlaceholderText(snap.bio, 'bio')) blocked.push('the biography is still placeholder text')
    if (isPlaceholderText(snap.song?.title, 'song')) blocked.push('the featured song is still placeholder text')
    if (blocked.length) {
      flash(`Keep this as a draft until ${blocked.join(' and ')}.`, true)
      return
    }
  }
  creative.value.status = status
  markDirty()
}

function changeArtist(snapshot) {
  const next = applyArtistSnapshot({ ...creative.value, title: '' }, snapshot)
  creative.value = { ...next, title: '', storage: creative.value.storage }
  flash(`Artist changed to ${snapshot?.name || 'none'}. Copy reset to the new artist's defaults.`)
  markDirty()
}

function setFormat(id, nextPreview = 'art') {
  preview.value = nextPreview
  if (!isAdFormat(id) || !supported.value.includes(id)) return
  if (formatId.value !== id) {
    formatId.value = id
    creative.value.primaryFormat = id
    markDirty()
  }
  router.replace({ query: { ...route.query, format: id } })
}

function setPreview(id) {
  if (id === 'feed' || id === 'grid') {
    const keep = formatId.value !== 'story' ? formatId.value : (supported.value.find((f) => f !== 'story') || formatId.value)
    setFormat(keep, id)
  } else if (id === 'story') {
    setFormat('story', id)
  } else {
    preview.value = 'art'
  }
}

function showScene(index) {
  sceneIndex.value = Math.min(sceneCount.value - 1, Math.max(0, index))
}

const subjectMeta = computed(() => subjectForCreative(creative.value))
const readiness = computed(() => {
  if (!creative.value) return { ready: true, message: '' }
  const subject = subjectForCreative(creative.value)
  const style = creative.value.templateId === 'product-showcase'
    ? productStyle(creative.value.content)
    : (creative.value.content?.style || '')
  const piece = subject?.pieces.find((item) => item.templateId === creative.value.templateId && (item.style || '') === style)
    || subject?.pieces.find((item) => item.templateId === creative.value.templateId && !item.style)
    || (creative.value.templateId === 'show-promo' ? { templateId: 'show-promo' } : null)
  return pieceReadiness(piece, creative.value.snapshot)
})
const readinessMessage = computed(() => readiness.value.message)
const motionFilm = computed(() => {
  if (!readiness.value.ready) return null
  return creative.value?.templateId === 'product-showcase' ? productMotionFilm(creative.value?.content) : null
})
const motionOn = computed(() => Boolean(motionSettings(creative.value?.content)))
const motionDuration = computed(() => motionSettings(creative.value?.content)?.durationMs || 0)
const motionClose = computed(() => motionSettings(creative.value?.content)?.close || '')
const motionClock = computed(() => (
  motionOn.value && motionFilm.value && formatId.value === 'story' ? motionTime.value : null
))
const motionClockLabel = computed(() => formatMotionClock(motionTime.value))
const reviewExport = computed(() => (import.meta.dev ? String(route.query.reviewExport || '') : ''))
const videoMode = computed(() => {
  if (!motionOn.value || !motionFilm.value) return 'off'
  if (reviewExport.value === 'unavailable') return 'unavailable'
  if (reviewExport.value === 'progress') return 'progress'
  if (import.meta.dev) return 'local'
  if (workerReady.value && isSavedCreativeId(creative.value?.id)) return 'worker'
  if (workerReady.value) return 'save'
  return 'unavailable'
})
const videoExportReady = computed(() => videoMode.value === 'local' || videoMode.value === 'worker')
const videoBusy = computed(() => Boolean(videoJob.value))
const motionDurationLabel = computed(() => formatMotionClock(motionDuration.value))
const exportHint = computed(() => {
  if (!motionOn.value) return ''
  if (videoMode.value === 'progress') return `Rendering 48 / ${Math.round((motionDuration.value / 1000) * VIDEO_OUTPUT.fps)}`
  if (videoStatus.value) return videoStatus.value
  if (!motionFilm.value) return 'This style stays a still. PNG download is unchanged.'
  if (videoMode.value === 'unavailable') return 'MP4 export is not connected on this server. PNG download is unchanged.'
  if (videoMode.value === 'save') return 'Save to Faneqo before exporting video. PNG download is unchanged.'
  const spec = `H.264 MP4 · ${VIDEO_OUTPUT.width}×${VIDEO_OUTPUT.height} · ${VIDEO_OUTPUT.fps} fps · silent · ${motionDurationLabel.value}. PNG is the still.`
  if (videoMode.value === 'local') return `${spec} Export runs on this computer.`
  return spec
})

function holdMotionPreview() {
  const duration = motionDuration.value || 0
  if (!duration) return
  motionTime.value = Math.min(MOTION_PREVIEW_MS, Math.max(0, duration - 400))
}

function pauseMotion() {
  playing.value = false
  if (motionRaf) cancelAnimationFrame(motionRaf)
  motionRaf = 0
}

function stepMotion(now) {
  if (!playing.value) return
  if (!motionLast) motionLast = now
  const next = Math.min(motionDuration.value, motionTime.value + (now - motionLast))
  motionLast = now
  motionTime.value = next
  if (next >= motionDuration.value) {
    pauseMotion()
    motionTime.value = motionDuration.value
    return
  }
  motionRaf = requestAnimationFrame(stepMotion)
}

function playMotion() {
  if (!motionOn.value || !motionFilm.value) return
  if (reduceMotion.value) {
    motionTime.value = motionTime.value >= motionDuration.value ? 0 : motionDuration.value
    return
  }
  if (formatId.value !== 'story' && supported.value.includes('story')) setFormat('story')
  if (motionTime.value >= motionDuration.value) motionTime.value = 0
  playing.value = true
  motionLast = 0
  motionRaf = requestAnimationFrame(stepMotion)
}

function togglePlay() {
  if (playing.value) pauseMotion()
  else playMotion()
}

function restartMotion() {
  pauseMotion()
  motionTime.value = 0
  if (!reduceMotion.value) playMotion()
}

function toggleMotion() {
  if (!creative.value) return
  if (motionOn.value) {
    pauseMotion()
    motionTime.value = 0
    patch({ motion: { ...creative.value.content.motion, enabled: false } })
    return
  }
  const previous = creative.value.content.motion || {}
  const fresh = defaultProductMotion(productStyle(creative.value.content))
  const known = new Set([PRODUCT_MOTION_CLOSE, FAN_LIST_CLOSE, NIGHT_CLOSE])
  patch({
    motion: {
      ...fresh,
      close: previous.close && !known.has(previous.close) ? previous.close : fresh.close,
    },
  })
  holdMotionPreview()
  if (supported.value.includes('story')) setFormat('story')
}

function setMotionClose(event) {
  if (!creative.value?.content?.motion) return
  patch({ motion: { ...creative.value.content.motion, close: String(event.target.value || '').slice(0, 120) } })
}

function stopVideoPoll() {
  if (videoPoll) clearInterval(videoPoll)
  videoPoll = 0
}

function videoEndpoint() {
  return videoMode.value === 'worker' ? '/api/studio/video' : '/api/__dev/studio-mp4'
}

async function exportMp4() {
  if (!creative.value || videoJob.value || !videoExportReady.value || videoMode.value === 'progress') return
  pauseMotion()
  videoError.value = false
  videoStatus.value = 'Starting video export…'
  const worker = videoMode.value === 'worker'
  try {
    const started = await $fetch(videoEndpoint(), {
      method: 'POST',
      body: worker
        ? { id: String(creative.value.id) }
        : {
            templateId: creative.value.templateId,
            artistName: creative.value.artistName || '',
            content: creative.value.content,
            snapshot: creative.value.snapshot || null,
          },
    })
    videoJob.value = started.id
    videoPoll = setInterval(pollMp4, 1000)
  } catch (err) {
    videoError.value = true
    videoStatus.value = err?.data?.message || err?.message || 'Video export failed.'
  }
}

async function pollMp4() {
  if (!videoJob.value) return
  try {
    const job = await $fetch(videoEndpoint(), { query: { id: videoJob.value } })
    if (job.status === 'running') {
      videoStatus.value = `Rendering ${job.frame || 0} / ${job.total}`
      return
    }
    stopVideoPoll()
    if (job.status === 'done') {
      const blob = await $fetch(videoMode.value === 'worker' ? '/api/studio/video/file' : '/api/__dev/studio-mp4/file', { query: { id: videoJob.value }, responseType: 'blob' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = motionDownloadName(creative.value)
      link.click()
      URL.revokeObjectURL(url)
      videoStatus.value = 'MP4 downloaded.'
    } else if (job.status !== 'cancelled') {
      videoError.value = true
      videoStatus.value = job.error || 'Video export failed.'
    }
    videoJob.value = ''
  } catch (err) {
    stopVideoPoll()
    videoJob.value = ''
    videoError.value = true
    videoStatus.value = err?.data?.message || err?.message || 'Video export failed.'
  }
}

async function cancelMp4() {
  if (videoMode.value === 'progress') return
  const id = videoJob.value
  stopVideoPoll()
  videoJob.value = ''
  videoStatus.value = 'Export cancelled.'
  if (id) await $fetch(videoEndpoint(), { method: 'DELETE', query: { id } }).catch(() => {})
}

async function mountForExport(index) {
  exportSceneIndex.value = index
  exportMounted.value = true
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(() => resolve()))
  const node = exportHost.value?.firstElementChild
  if (!node) throw new Error('The creative did not mount for export.')
  return node
}

async function download() {
  if (!live.value) return
  try {
    await exporter.exportScene(live.value, formatId.value, sceneIndex.value, mountForExport)
  } finally {
    exportMounted.value = false
  }
}

async function downloadAll() {
  if (!live.value) return
  try {
    await exporter.exportAllScenes(live.value, formatId.value, mountForExport)
  } finally {
    exportMounted.value = false
  }
}

async function save() {
  if (!creative.value || saving.value) return
  saving.value = true
  try {
    const saved = await store.save({ ...creative.value, title: creative.value.title || '' })
    const wasId = String(creative.value.id)
    creative.value = { ...saved, title: saved.title }
    dirty.value = false
    if (saved.storage === 'api') flash('Saved to your Faneqo library.')
    else if (store.hasToken.value) flash(store.warning.value || 'Kept on this device. Faneqo did not store it.', true)
    else flash('Saved on this device only. Not durable: sign in with a studio account to store it on Faneqo.')
    if (String(saved.id) !== wasId) router.replace({ path: `/ads/c/${encodeURIComponent(saved.id)}`, query: route.query })
  } catch (err) {
    flash(`Save failed: ${err?.data?.error?.message || err?.message || err}`, true)
  } finally {
    saving.value = false
  }
}

async function saveToFaneqo() {
  if (!creative.value || saving.value) return
  if (!store.hasToken.value) {
    flash('Sign in with a studio account to save to Faneqo.', true)
    return
  }
  saving.value = true
  try {
    const saved = await store.save({ ...creative.value, title: creative.value.title || '' }, { promote: true })
    if (saved.storage !== 'api') {
      flash(store.warning.value || 'Still on this device. Faneqo did not store it.', true)
      return
    }
    const wasId = String(creative.value.id)
    creative.value = { ...saved, title: saved.title }
    dirty.value = false
    flash('Saved to Faneqo. The device copy was removed after that succeeded.')
    if (String(saved.id) !== wasId) router.replace({ path: `/ads/c/${encodeURIComponent(saved.id)}`, query: route.query })
  } catch (err) {
    flash(`Save to Faneqo failed: ${err?.data?.error?.message || err?.message || err}`, true)
  } finally {
    saving.value = false
  }
}

async function duplicate() {
  if (!live.value || busy.value) return
  busy.value = true
  try {
    if (dirty.value) await save()
    const copy = await store.duplicate(creative.value)
    await router.push(`/ads/c/${encodeURIComponent(copy.id)}`)
  } catch (err) {
    flash(`Duplicate failed: ${err?.message || err}`, true)
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!creative.value || busy.value) return
  if (!window.confirm(`Delete “${creative.value.title || autoTitle.value}”? This cannot be undone.`)) return
  busy.value = true
  try {
    await store.remove(creative.value)
    dirty.value = false
    await router.push('/ads')
  } catch (err) {
    flash(`Delete failed: ${err?.message || err}`, true)
    busy.value = false
  }
}

async function enterClean() {
  clean.value = true
  const root = document.documentElement
  if (!document.fullscreenElement && root.requestFullscreen) {
    try { await root.requestFullscreen() } catch { /* denied is fine */ }
  }
}

async function leaveClean() {
  clean.value = false
  if (document.fullscreenElement && document.exitFullscreen) {
    try { await document.exitFullscreen() } catch { /* resync via event */ }
  }
}

function onStageWheel(event) {
  if (clean.value) event.preventDefault()
}

function onKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    save()
    return
  }
  if (event.altKey || event.metaKey || event.ctrlKey) return
  const tag = event.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (event.key === 'ArrowRight') { event.preventDefault(); showScene(sceneIndex.value + 1); return }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showScene(sceneIndex.value - 1); return }
  if (event.key === 'Escape' && (clean.value || document.fullscreenElement)) leaveClean()
}

function onBeforeUnload(event) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(() => {
  if (!dirty.value) return true
  return window.confirm('You have unsaved changes. Leave without saving?')
})

onMounted(async () => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!import.meta.dev) {
    $fetch('/api/studio/video').then((res) => { workerReady.value = Boolean(res?.available) }).catch(() => { workerReady.value = false })
  }
  window.addEventListener('keydown', onKeydown, true)
  window.addEventListener('beforeunload', onBeforeUnload)
  try {
    const loaded = await store.get(String(route.params.id || ''))
    if (!loaded) {
      loadError.value = 'That creative was not found in your library.'
      return
    }
    const asked = String(route.query.format || '')
    formatId.value = isAdFormat(asked) && (templateFamily(loaded.templateId)?.formats || []).includes(asked) ? asked : loaded.primaryFormat
    creative.value = loaded
    await nextTick()
    if (motionSettings(loaded.content)) holdMotionPreview()
    // Library list feeds "previously uploaded" artwork; not needed to render, so it never blocks the editor.
    if (!store.items.value.length) store.load().catch(() => {})
  } catch (err) {
    loadError.value = err?.statusCode === 404 ? 'That creative was not found in your library.' : 'The creative could not be loaded.'
  }
})

onBeforeUnmount(() => {
  pauseMotion()
  if (videoJob.value) cancelMp4()
  else stopVideoPoll()
  window.removeEventListener('keydown', onKeydown, true)
  window.removeEventListener('beforeunload', onBeforeUnload)
  if (statusTimer) clearTimeout(statusTimer)
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {})
})

watch(() => route.params.id, async (id, old) => {
  if (!id || id === old) return
  const loaded = await store.get(String(id))
  if (loaded) {
    creative.value = loaded
    formatId.value = loaded.primaryFormat
    sceneIndex.value = 0
    dirty.value = false
    pauseMotion()
    await nextTick()
    if (motionSettings(loaded.content)) holdMotionPreview()
    else motionTime.value = 0
  }
})
</script>

<style scoped>
.ed {
  min-height: 100vh;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.ed.is-clean {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.ed__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.ed__left,
.ed__right {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.ed__left { flex: 1 1 auto; }
.ed__right { flex: 0 0 auto; flex-wrap: wrap; justify-content: flex-end; }

.ed__back {
  color: rgba(247, 249, 252, 0.72);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-decoration: none;
  text-transform: uppercase;
}

.ed__back:hover,
.ed__back:focus-visible { color: #f7f9fc; }

.ed__title {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 520px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #f7f9fc;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.ed__title:hover,
.ed__title:focus-visible {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.03);
  outline: none;
}

.seg {
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.seg button {
  padding: 5px 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.6);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.seg button[aria-pressed="true"] { background: #f7f9fc; color: #050506; }

.ed__storage {
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(247, 249, 252, 0.55); /* storage location is tertiary metadata */
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ed__storage.is-local { background: rgba(255, 207, 138, 0.12); color: #ffcf8a; }

.ed__text {
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

.ed__text[aria-pressed="true"] { color: #7ee7ff; }
.ed__text:hover:not(:disabled), .ed__text:focus-visible:not(:disabled) { color: #f7f9fc; }
.ed__text:disabled { color: rgba(247, 249, 252, 0.28); cursor: default; }
.ed__text--danger:hover:not(:disabled) { color: #ff8aa8; }

.ed__save {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #f7f9fc;
  color: #050507;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.ed__save:disabled {
  background: transparent;
  color: rgba(247, 249, 252, 0.38);
  cursor: default;
}

.ed__save:focus-visible,
.ed__text:focus-visible,
.ed__format:focus-visible,
.ed__download:focus-visible,
.ed__back:focus-visible,
.seg button:focus-visible,
.ed__preview button:focus-visible,
.ed__edge:focus-visible {
  outline: 1px solid rgba(126, 231, 255, 0.7);
  outline-offset: 3px;
}

.ed__grid {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  min-height: calc(100vh - 65px);
}

.ed.is-clean .ed__grid {
  grid-template-columns: 1fr;
  height: 100vh;
  min-height: 0;
}

.ed__panel {
  position: sticky;
  top: 0;
  align-self: start;
  max-height: calc(100vh - 65px);
  padding: 16px 22px 40px;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  scrollbar-width: thin;
}

.ed__status {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(126, 231, 255, 0.08);
  color: #d7f9ff;
  font-size: 12.5px;
  line-height: 1.4;
}

.ed__status.is-error { background: rgba(255, 138, 168, 0.1); color: #ff8aa8; }

.ed__family { padding: 4px 0 8px; }

.kicker {
  margin: 0 0 4px;
  color: #7ee7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.muted { margin: 0; color: rgba(247, 249, 252, 0.5); font-size: 13px; line-height: 1.4; }

.ed__pub { padding-top: 8px; }

.ed__pub summary {
  padding: 14px 0;
  color: rgba(247, 249, 252, 0.62);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}

.ed__pub summary:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.7);
  outline-offset: 3px;
}

.ed__stage-col {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  align-self: start;
  height: calc(100vh - 65px);
  min-width: 0;
}

.ed.is-clean .ed__stage-col { height: 100vh; }

.ed__tools {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 28px 6px;
}

.ed__formats { display: flex; flex-wrap: wrap; gap: 6px; }

.ed__format {
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.72);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.ed__format[aria-pressed="true"] { background: #f7f9fc; color: #050506; }
.ed__format:disabled { color: rgba(247, 249, 252, 0.22); cursor: default; }
.ed__format:hover:not(:disabled):not([aria-pressed="true"]) { color: #f7f9fc; }

.ed__actions { display: flex; align-items: center; gap: 16px; }

.ed__count {
  margin: 0;
  color: rgba(247, 249, 252, 0.46);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.14em;
}

.ed__download {
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

.ed__download:disabled { opacity: 0.55; cursor: progress; }

.ed__preview {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 0 28px 8px;
}

.ed__preview button {
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

.ed__preview button[aria-pressed="true"] { background: rgba(247, 249, 252, 0.12); color: #f7f9fc; }
.ed__preview button:disabled { color: rgba(247, 249, 252, 0.22); cursor: default; }

.ed__group {
  margin-right: 4px;
  color: rgba(247, 249, 252, 0.38);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ed__project {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  margin-bottom: 18px;
}

.ed__project .ed__section { flex: 1 0 100%; margin: 0; }

.ed__mobile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.ed__section {
  flex: 1 0 100%;
  margin: 8px 0 0;
  color: rgba(247, 249, 252, 0.42);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ed__family .ed__section { margin: 14px 0 0; }

.ed__motion {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 0 28px 10px;
}

.ed__motion button {
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

.ed__motion button[aria-pressed="true"] { background: rgba(247, 249, 252, 0.12); color: #f7f9fc; }

.ed__motion button.ed__motion-action {
  min-height: 44px;
  padding: 0 16px;
}

.ed__motion button.ed__download {
  background: #f7f9fc;
  color: #050506;
  letter-spacing: 0.04em;
}

.ed__motion input[type="range"] {
  flex: 1 1 160px;
  min-width: 120px;
  accent-color: #c084fc;
}

.ed__motion-time {
  color: rgba(247, 249, 252, 0.62);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.ed__motion-close {
  display: flex;
  flex: 1 1 240px;
  gap: 8px;
  align-items: center;
  min-width: 0;
  color: rgba(247, 249, 252, 0.48);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ed__motion-close input {
  flex: 1;
  min-width: 0;
  padding: 4px 0;
  border: 0;
  border-bottom: 1px solid rgba(247, 249, 252, 0.16);
  background: transparent;
  color: #f7f9fc;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.ed__hint {
  margin: 0 0 0 8px;
  color: rgba(247, 249, 252, 0.48);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
}

.ed__motion .ed__hint {
  flex: 1 0 100%;
  margin: 2px 0 0;
}

.ed__hint.is-error { color: #ff8aa8; }

.ed__stage {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  padding: 0 28px 8px;
}

.ed.is-clean .ed__stage { padding: 0; }

.ed__stage :deep(.ad-stage-host) { flex: 1 1 auto; height: auto; }

.ed__scenes {
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  gap: 24px;
  padding: 8px 28px 14px;
}

.ed__export {
  position: fixed;
  top: 0;
  left: -20000px;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.ed__loading {
  display: grid;
  place-items: center;
  min-height: 100vh;
  color: rgba(247, 249, 252, 0.6);
}

.ed__loading a { color: #7ee7ff; }

.ig-post { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; min-height: 0; }

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

.ig-post__bar { display: flex; flex: 0 0 auto; align-items: center; gap: 10px; padding: 10px 12px; color: #f7f9fc; font-size: 13px; font-weight: 600; }
.ig-post__dot { width: 28px; height: 28px; border-radius: 999px; background: #1c1d22; }
.ig-post__art { flex: 1 1 auto; min-height: 0; aspect-ratio: 3 / 4; }
.ig-post__art :deep(.ad-stage-host) { height: 100%; }

.ed__edge {
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

.ed__edge svg { width: 28px; height: 28px; opacity: 0; transition: opacity 160ms ease; }
.ed__edge:hover svg, .ed__edge:focus-visible svg { opacity: 0.8; color: #f7f9fc; }
.ed__edge:disabled svg { opacity: 0; }
.ed__edge--prev { left: 0; }
.ed__edge--next { right: 0; }

@media (max-width: 1100px) {
  .ed__grid { grid-template-columns: 340px minmax(0, 1fr); }
}

.ed__download--bar { display: none; }
.ed__mobile-manage { display: none; }

.ed__manage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

@media (max-width: 900px) {
  .ed__bar { flex-wrap: nowrap; align-items: center; padding: 10px 16px; gap: 10px; }
  .ed__left { flex: 1 1 auto; }
  .ed__right { flex: 0 0 auto; justify-content: flex-end; gap: 8px; }
  .ed__title { display: none; }
  .ed__manage { display: none; }
  .ed__download--bar { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; }
  .ed__bar .ed__storage { display: none; }
  .ed__mobile-manage { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
  .ed__mobile-manage .ed__title { display: block; width: 100%; max-width: none; }
  .ed__mobile-actions { display: flex; flex-wrap: wrap; gap: 8px 12px; }
  .ed__grid { display: flex; flex-direction: column; min-height: 0; }
  .ed__panel { order: 2; position: static; max-height: none; border-right: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 16px 48px; }
  .ed__stage-col { order: 1; position: static; height: auto; }
  .ed__stage { order: 1; height: min(62vh, 640px); padding: 0 16px 8px; }
  .ed__tools { order: 2; }
  .ed__actions .ed__download,
  .ed__actions .ed__png { display: none; }
  .ed__motion { order: 3; }
  .ed__preview { order: 4; }
  .ed__scenes { order: 5; }
  .ed__tools, .ed__preview, .ed__motion { padding-left: 16px; padding-right: 16px; }
  .ed__actions { flex-wrap: wrap; gap: 8px 12px; }
  .ed__hint { flex-basis: 100%; margin-left: 0; }
  .ed__title { max-width: none; }
  .ed { overflow-x: hidden; }
  .ed__save,
  .ed__download,
  .ed__format,
  .ed__text { min-height: 44px; }
  .ed__stage { height: min(68vh, 720px); }
}

@media (prefers-reduced-motion: reduce) {
  .ed__edge svg { transition: none; }
}
</style>
