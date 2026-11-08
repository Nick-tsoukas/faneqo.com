<template>
  <div class="fq-gx" :class="{ 'is-review': reviewMode, 'is-living': livingOpen, 'is-doorway': !livingOpen }">
    <GalleryDoorway
      :memories="livingMemories"
      :index="selectedIndex"
      :night="presentationNight"
      :back-to="backTo"
      :reduced="false"
      :share-status="shareStatus"
      @select="selectedIndex = $event"
      @open="openFromDeck"
      @share="shareGallery"
    />

    <button
      v-if="!livingOpen && !reviewMode"
      type="button"
      class="fq-gx__lab-toggle"
      @click="labOpen = !labOpen"
    >{{ labOpen ? 'Hide lab' : 'Lab' }}</button>

    <section v-show="labOpen && !livingOpen && !reviewMode" class="fq-gx__engine" aria-label="Engine harness">
      <p>Lab harness · Doorway + Deck + Living Gallery. Not product chrome.</p>
      <div class="fq-gx__actions">
        <button type="button" class="fq-gx__ghost" :class="{ 'is-on': compare.transition === 'print' }" @click="setTransition('print')">1 Print</button>
        <button type="button" class="fq-gx__ghost" :class="{ 'is-on': compare.transition === 'hold' }" @click="setTransition('hold')">2 Hold</button>
        <button type="button" class="fq-gx__ghost" :class="{ 'is-on': compare.transition === 'afterimage' }" @click="setTransition('afterimage')">3 Afterimage</button>
        <button type="button" class="fq-gx__ghost" @click="setLab('galleryKind', 'show')">Show</button>
        <button type="button" class="fq-gx__ghost" @click="setLab('galleryKind', 'general')">General</button>
        <button type="button" class="fq-gx__ghost" @click="setLab('galleryKind', 'minimal')">Minimal</button>
        <button type="button" class="fq-gx__ghost" @click="setLab('gallerySize', 'one')">1</button>
        <button type="button" class="fq-gx__ghost" @click="setLab('gallerySize', 'two')">2</button>
        <button type="button" class="fq-gx__ghost" @click="setLab('gallerySize', 'set')">8</button>
        <button type="button" class="fq-gx__ghost" @click="setLab('gallerySize', 'large')">24</button>
        <button type="button" class="fq-gx__ghost" @click="openSlot('landscape')">Landscape</button>
        <button type="button" class="fq-gx__ghost" @click="openSlot('portrait-2-3')">Portrait 2:3</button>
        <button type="button" class="fq-gx__ghost" @click="openSlot('square')">Square</button>
        <button type="button" class="fq-gx__ghost" @click="nightOpen = true">Enter the Night</button>
        <button type="button" class="fq-gx__ghost" @click="reviewMode = !reviewMode">{{ reviewMode ? 'Exit review' : 'Review' }}</button>
      </div>
    </section>

    <LabComparisonPanel
      :visible="compareVisible"
      :compare="compare"
      :composition="metrics.composition"
      @update:compare="compare = $event"
      @pure="runEngine('hideOverlays')"
      @controls="viewerRef?.showControls?.() || runEngine('showChrome')"
      @trigger-residue="viewerRef?.playResidue?.()"
      @next-residue="viewerRef?.nextWithResidue?.()"
      @slot="onCompareSlot"
    />

    <ClientOnly>
      <LivingGalleryViewer
        ref="viewerRef"
        :open="livingOpen"
        :memories="livingMemories"
        :index="selectedIndex"
        :tuning="tuning"
        :night="presentationNight"
        :source="launchSource"
        :lab="compare"
        @close="onLivingClose"
        @change="onLivingChange"
        @progress="onLivingProgress"
        @metrics="onMetrics"
      />
      <EnterTheNight
        :open="nightOpen"
        :night="manifest.night"
        :memories="manifest.memories"
        :tuning="tuning"
        @close="nightOpen = false"
        @change="onNightChange"
      />
    </ClientOnly>

    <LabTuningPanel
      :tuning="tuning"
      :visible="tuneVisible"
      @update:tuning="tuning = $event"
    />
    <LabMetrics
      :on="metricsOn && (devVisible || livingOpen)"
      :slide="metrics.slide"
      :progress="metrics.progress"
      :renderer="metrics.renderer"
      :zoom="metrics.zoom"
      :decoded-count="metrics.decodedCount"
      :open="livingOpen"
      :fullscreen="metrics.fullscreen"
      :thumbnails="metrics.thumbnails"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { basementEastNight } from '../fixtures/basementEastNight'
import { findCompositionSlot, indexForCompositionSlot } from '../fixtures/compositionMatrix'
import { livingGalleryMemorySet, livingGalleryPresentationNight } from '../fixtures/galleryContexts'
import { createDefaultTuning } from '../core/presentationState'
import { shareWithFallback, buildGallerySharePayload, defaultGalleryShareUrl } from '../living-gallery/livingGalleryShare'
import { normalizeOpenSource, boundsFromElement } from '../living-gallery/livingGallerySource'
import { resolveGalleryTransition } from '../living-gallery/livingGalleryTransition'
import GalleryDoorway from '../memory-system/GalleryDoorway.vue'
import '../memory-system/galleryDoorway.css'
import LabTuningPanel from './LabTuningPanel.vue'
import LabMetrics from './LabMetrics.vue'
import LabComparisonPanel from './LabComparisonPanel.vue'
import { createLabComparisonState } from './labComparisonState'

const LivingGalleryViewer = defineAsyncComponent(() => import('../living-gallery/LivingGalleryViewer.client.vue'))
const EnterTheNight = defineAsyncComponent(() => import('../enter-night/EnterTheNight.client.vue'))

defineProps({
  backTo: { type: String, default: '/labs' },
})

const manifest = basementEastNight
const compare = ref(createLabComparisonState())
const presentationNight = computed(() => livingGalleryPresentationNight(compare.value.galleryKind, manifest.night))
const livingMemories = computed(() => livingGalleryMemorySet(manifest, compare.value.gallerySize))
const selectedIndex = ref(0)
const livingOpen = ref(false)
const labOpen = ref(false)
const shareStatus = ref('')
let shareTimer = 0
const nightOpen = ref(false)
const metricsOn = ref(false)
const reviewMode = ref(false)
const showDev = ref(false)
const viewerRef = ref(null)
const launchSource = ref(null)
const tuning = ref(createDefaultTuning())
const metrics = ref({ slide: 0, progress: null, renderer: 'BLACK', composition: null })

const devVisible = computed(() => !reviewMode.value && (!livingOpen.value || showDev.value))
const compareVisible = computed(() => !reviewMode.value && (livingOpen.value || labOpen.value))
const tuneVisible = computed(() => !reviewMode.value && (labOpen.value || (livingOpen.value && showDev.value)))

async function openLiving(index, event) {
  selectedIndex.value = index
  showDev.value = false
  const sourceElement = event?.currentTarget || null
  launchSource.value = normalizeOpenSource({
    sourceElement,
    sourceBounds: boundsFromElement(sourceElement),
    sourceMediaId: livingMemories.value[index]?.id,
    sourceIndex: index,
    sourceGalleryId: presentationNight.value.galleryId || 'lab:basement-east',
  })
  if (livingOpen.value) {
    livingOpen.value = false
    await nextTick()
  }
  livingOpen.value = true
}

function openFromDeck(payload) {
  openLiving(payload?.index ?? selectedIndex.value, {
    currentTarget: payload?.thumbnailElement || null,
  })
}

function onLivingClose() {
  livingOpen.value = false
}

async function shareGallery() {
  const result = await shareWithFallback(buildGallerySharePayload({
    night: presentationNight.value,
    url: defaultGalleryShareUrl(),
  }))
  shareStatus.value = result?.method === 'clipboard' ? 'copied' : (result?.ok ? 'shared' : '')
  if (shareTimer) clearTimeout(shareTimer)
  shareTimer = window.setTimeout(() => { shareStatus.value = '' }, 1600)
}

function onCompareSlot(slotId) {
  const slot = findCompositionSlot(slotId)
  const index = indexForCompositionSlot(livingMemories.value, slotId)
  if (slot) {
    compare.value = {
      ...compare.value,
      matrixSlot: slot.id,
      matrixNote: slot.note || '',
    }
  }
  if (index >= 0) selectedIndex.value = index
  if (livingOpen.value) openLiving(index)
}

function setLab(key, value) {
  compare.value = { ...compare.value, [key]: value }
}

function setTransition(id) {
  const t = resolveGalleryTransition(id)
  compare.value = {
    ...compare.value,
    transition: t.id,
    residuePreset: t.residue ? t.residuePreset : 'off',
    residueParams: null,
  }
}

function openSlot(slotId) {
  onCompareSlot(slotId)
}

function runEngine(action) {
  const engine = viewerRef.value?.controller
  if (!engine || typeof engine[action] !== 'function') return
  engine[action]()
}

function onLivingChange(index) {
  selectedIndex.value = index
  metrics.value = { ...metrics.value, slide: index }
}

function onLivingProgress(progress) {
  metrics.value = { ...metrics.value, progress, slide: progress.index }
}

function onMetrics(payload) {
  metrics.value = { ...metrics.value, ...payload }
}

function onNightChange(index) {
  selectedIndex.value = index
}

function onKey(event) {
  if (event.target?.closest?.('input, textarea')) return
  if (event.key === '1') setTransition('print')
  if (event.key === '2') setTransition('hold')
  if (event.key === '3') setTransition('afterimage')
  if (event.key === 'r' || event.key === 'R') {
    if (event.target?.closest?.('input, textarea')) return
    reviewMode.value = !reviewMode.value
    if (reviewMode.value) showDev.value = false
  }
  if (event.key === 'd' || event.key === 'D') {
    if (event.target?.closest?.('input, textarea')) return
    if (!livingOpen.value) return
    reviewMode.value = false
    showDev.value = !showDev.value
  }
}

function syncDevtoolsClass() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(
    'fq-gx-hide-devtools',
    reviewMode.value || livingOpen.value,
  )
}

/**
 * Query-driven lab state. Rendered evidence has to be reproducible: clicking a
 * path through the harness produces a different screenshot every run, and the
 * critic has to be able to re-open the exact state a capture names.
 * Lab only — nothing here reaches the product viewer.
 */
async function applyQueryState() {
  if (typeof window === 'undefined') return
  const q = new URLSearchParams(window.location.search)
  if (![...q.keys()].length) return
  const flag = (key) => q.get(key) === '1' || q.get(key) === 'true'
  const next = { ...compare.value }
  if (q.get('size')) next.gallerySize = q.get('size')
  if (q.get('kind')) next.galleryKind = q.get('kind')
  if (q.get('optical')) next.opticalMode = q.get('optical')
  if (q.has('context')) next.contextOn = flag('context')
  if (q.has('afterlight')) next.afterlight = flag('afterlight')
  // Captures need chrome to hold still; product truth is idleHide true.
  if (q.has('hold')) next.idleHide = !flag('hold')
  compare.value = next
  await nextTick()

  const slot = q.get('slot')
  if (slot) onCompareSlot(slot)
  const byId = q.get('id')
  if (byId) {
    const at = livingMemories.value.findIndex((memory) => memory.id === byId)
    if (at >= 0) selectedIndex.value = at
  }
  const at = Number(q.get('i'))
  if (Number.isFinite(at) && q.has('i')) selectedIndex.value = Math.max(0, at)

  if (flag('review')) reviewMode.value = true
  if (!flag('open')) return

  await openLiving(selectedIndex.value)
  for (let tries = 0; tries < 120 && !document.querySelector('.pswp__img'); tries += 1) {
    await new Promise((resolve) => { window.setTimeout(resolve, 25) })
  }
  await nextTick()
  const engine = viewerRef.value?.controller
  if (!engine) return
  if (flag('photos')) engine.openThumbnails()
  else if (flag('info')) engine.showInfo()
  if (flag('pure')) engine.hideOverlays()
  else engine.showChrome()
}

watch([reviewMode, livingOpen], syncDevtoolsClass)

watch(livingMemories, (list) => {
  if (selectedIndex.value >= list.length) selectedIndex.value = Math.max(0, list.length - 1)
}, { immediate: true })

onMounted(() => {
  window.addEventListener('keydown', onKey)
  syncDevtoolsClass()
  applyQueryState()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (shareTimer) clearTimeout(shareTimer)
  document.documentElement.classList.remove('fq-gx-hide-devtools')
})
</script>

<style scoped>
.fq-gx {
  position: relative;
  min-height: 100dvh;
  min-height: 100svh;
  overflow-x: hidden;
  overflow-y: auto;
  background: #000;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.fq-gx.is-doorway {
  overflow: hidden;
}
.fq-gx.is-living :deep(.fq-gd__top),
.fq-gx.is-living :deep(.fq-gd__context),
.fq-gx.is-living :deep(.fq-gd__thumbs),
.fq-gx.is-living :deep(.fq-gd-dock),
.fq-gx.is-living :deep(.aw__after) {
  opacity: 0;
  pointer-events: none;
}
.fq-gx__lab-toggle {
  position: fixed;
  top: calc(0.45rem + env(safe-area-inset-top, 0px));
  right: 0.75rem;
  z-index: 9;
  min-height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.28);
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.fq-gx__rail,
.fq-gx__identity,
.fq-gx__prints,
.fq-gx__actions,
.fq-gx__note,
.fq-gx__engine {
  position: relative;
  z-index: 1;
  max-width: 40rem;
  margin-left: auto;
  margin-right: auto;
}
.fq-gx__rail {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.fq-gx__rail p,
.fq-gx__note {
  margin: 0;
  font-size: 0.64rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.32);
}
.fq-gx__back {
  color: rgba(247, 249, 252, 0.55);
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 500;
}
.fq-gx__prints {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.fq-gx__print {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  min-height: 44px;
}
.fq-gx__print.is-wide {
  grid-column: 1 / -1;
}
.fq-gx__print img {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: top;
}
.fq-gx__print.is-selected img {
  outline: 1px solid rgba(247, 249, 252, 0.22);
  outline-offset: 3px;
}
.fq-gx__identity {
  margin-top: 1.45rem;
}
.fq-gx h1 {
  margin: 0;
  font-size: clamp(1.7rem, 6vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}
.fq-gx__place,
.fq-gx__date {
  margin: 0.42rem 0 0;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.38);
}
.fq-gx__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  align-items: center;
  margin-top: 1.4rem;
}
.fq-gx__primary,
.fq-gx__ghost {
  min-height: 44px;
  padding: 0;
  border: 0;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  background: transparent;
}
.fq-gx__primary {
  color: #f7f9fc;
}
.fq-gx__ghost {
  color: rgba(247, 249, 252, 0.38);
  font-size: 0.78rem;
  font-weight: 500;
}
.fq-gx__ghost.is-on {
  color: #f7f9fc;
}
.fq-gx__note {
  margin-top: 1.15rem;
  text-transform: none;
  letter-spacing: 0.02em;
  line-height: 1.45;
}
.fq-gx__engine {
  position: relative;
  z-index: 9;
  margin: 3.2rem 1rem 0;
  padding-bottom: 5rem;
}
.fq-gx__engine p {
  margin: 0 0 0.55rem;
  font-size: 0.64rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.32);
}
.fq-gx__engine .fq-gx__ghost:disabled {
  opacity: 0.28;
}
.fq-gx.is-review .fq-gx__rail,
.fq-gx.is-review .fq-gx__identity,
.fq-gx.is-review .fq-gx__actions,
.fq-gx.is-review .fq-gx__note,
.fq-gx.is-review .fq-gx__engine {
  display: none;
}
</style>

<style>
html.fq-gx-hide-devtools nuxt-devtools,
html.fq-gx-hide-devtools .nuxt-devtools,
html.fq-gx-hide-devtools .nuxt-devtools-anchor,
html.fq-gx-hide-devtools .nuxt-devtools-panel,
html.fq-gx-hide-devtools .nuxt-devtools-glowing,
html.fq-gx-hide-devtools .nuxt-devtools-nuxt-button,
html.fq-gx-hide-devtools #nuxt-devtools-container {
  display: none !important;
}
</style>
