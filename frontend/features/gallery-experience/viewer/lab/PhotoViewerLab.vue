<template>
  <div class="fq-pvl" :class="{ 'is-viewing': viewerOpen }">
    <header class="fq-pvl__top">
      <NuxtLink class="fq-pvl__back" :to="backTo">Back</NuxtLink>
      <p class="fq-pvl__count">{{ photos.length }} photographs</p>
    </header>

    <!--
      The launcher exists so the viewer has somewhere real to open from and
      return to. Justified rows, true aspect ratios, three pixels of air. It is
      deliberately quiet: this pass is about looking at one photograph.
    -->
    <div class="fq-pvl__wall">
      <button
        v-for="(photo, i) in photos"
        :key="photo.id"
        type="button"
        class="fq-pvl__print"
        :style="printStyle(photo)"
        :data-gx-print="photo.id"
        :aria-label="`Open ${photo.caption || photo.alt}`"
        @click="openAt(i, $event)"
      >
        <img
          :src="photo.mediumSrc || photo.src"
          :alt="photo.alt"
          :width="photo.width"
          :height="photo.height"
          decoding="async"
          data-fit="cover"
        >
      </button>
    </div>

    <ClientOnly>
      <FaneqoPhotoViewer
        ref="viewerRef"
        :open="viewerOpen"
        :photos="photos"
        :index="activeIndex"
        :source="launchSource"
        :options="viewerOptions"
        @close="onClose"
        @change="activeIndex = $event"
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, ref } from 'vue'
import { viewerLabPhotos } from './viewerLabPhotos'
import {
  boundsFromElement,
  normalizeOpenSource,
} from '../../living-gallery/livingGallerySource'

const FaneqoPhotoViewer = defineAsyncComponent(() => import('../FaneqoPhotoViewer.client.vue'))

defineProps({
  backTo: { type: String, default: '/labs' },
})

const count = ref(12)
const credit = ref(false)
const activeIndex = ref(0)
const viewerOpen = ref(false)
const viewerRef = ref(null)
const launchSource = ref(null)
const viewerOptions = ref({})

const photos = computed(() => viewerLabPhotos({ count: count.value, credit: credit.value }))

function printStyle(photo) {
  const ratio = Math.max(0.55, Math.min(2.1, (photo.width || 3) / (photo.height || 2)))
  return {
    '--fq-pvl-a': ratio.toFixed(4),
  }
}

async function openAt(i, event) {
  activeIndex.value = i
  const element = event?.currentTarget || null
  launchSource.value = normalizeOpenSource({
    sourceElement: element,
    sourceBounds: boundsFromElement(element),
    sourceMediaId: photos.value[i]?.id,
    sourceIndex: i,
    sourceGalleryId: 'lab:photo-viewer',
  })
  if (viewerOpen.value) {
    viewerOpen.value = false
    await nextTick()
  }
  viewerOpen.value = true
}

function onClose() {
  viewerOpen.value = false
}

/**
 * Query-driven state. Rendered evidence has to be reproducible: a critic must be
 * able to reopen the exact frame a capture names. Lab only.
 */
async function applyQuery() {
  if (typeof window === 'undefined') return
  const q = new URLSearchParams(window.location.search)
  if (![...q.keys()].length) return
  const flag = (key) => q.get(key) === '1' || q.get(key) === 'true'

  if (q.has('n')) count.value = Math.max(1, Number(q.get('n')) || 12)
  if (q.has('credit')) credit.value = flag('credit')
  const options = {}
  if (q.has('hold')) options.idle = !flag('hold')
  if (q.has('near')) options.neighbours = flag('near')
  viewerOptions.value = options
  await nextTick()

  const id = q.get('id')
  if (id) {
    const at = photos.value.findIndex((p) => p.id === id)
    if (at >= 0) activeIndex.value = at
  }
  if (q.has('i')) activeIndex.value = Math.max(0, Number(q.get('i')) || 0)

  if (!flag('open')) return
  await nextTick()
  const element = document.querySelector(`[data-gx-print="${photos.value[activeIndex.value]?.id}"]`)
  await openAt(activeIndex.value, { currentTarget: element })

  for (let tries = 0; tries < 160 && !document.querySelector('.pswp__img'); tries += 1) {
    await new Promise((resolve) => { window.setTimeout(resolve, 25) })
  }
  await new Promise((resolve) => { window.setTimeout(resolve, 260) })

  const adapter = viewerRef.value?.adapter
  if (flag('zoom')) adapter?.toggleZoom()
  if (flag('sheet')) document.querySelector('.fq-pv-index')?.click()
  if (flag('peace')) document.querySelector('.pswp.fq-pv')?.classList.add('is-peace')
}

onMounted(() => {
  applyQuery()
})
</script>

<style scoped>
.fq-pvl {
  min-height: 100dvh;
  background: #000;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  padding-bottom: 4rem;
}

.fq-pvl__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: calc(0.9rem + env(safe-area-inset-top, 0px)) 1rem 0.9rem;
}

.fq-pvl__back {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  color: rgba(247, 249, 252, 0.62);
  font-size: 0.86rem;
  font-weight: 500;
  text-decoration: none;
}

.fq-pvl__back:hover {
  color: #f7f9fc;
}

.fq-pvl__count {
  margin: 0;
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.34);
}

.fq-pvl__wall {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  --fq-pvl-row: 148px;
}

@media (min-width: 640px) {
  .fq-pvl__wall {
    --fq-pvl-row: 210px;
  }
}

@media (min-width: 1280px) {
  .fq-pvl__wall {
    --fq-pvl-row: 268px;
  }
}

@media (min-width: 2100px) {
  .fq-pvl__wall {
    --fq-pvl-row: 340px;
  }
}

.fq-pvl__print {
  flex-grow: var(--fq-pvl-a);
  flex-basis: calc(var(--fq-pvl-a) * var(--fq-pvl-row));
  height: var(--fq-pvl-row);
  margin: 0;
  padding: 0;
  border: 0;
  background: #050505;
  cursor: pointer;
  overflow: hidden;
}

.fq-pvl__print img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  vertical-align: top;
  transition: opacity 200ms ease;
}

.fq-pvl__print:hover img {
  opacity: 0.78;
}

.fq-pvl__print:focus-visible {
  outline: 1px solid rgba(247, 249, 252, 0.7);
  outline-offset: -2px;
}

/* The photograph left the wall. Do not draw the empty frame back in. */
.fq-pvl__print[data-gx-continuity='hidden'] img {
  opacity: 0;
}

.fq-pvl.is-viewing {
  overflow: hidden;
}
</style>
