<template>
  <section
    class="fg"
    :style="frameStyle"
    :data-variant="variant"
    :data-snap="tune.snap"
    :data-frame="aspectActive ? 'aspect' : 'fixed'"
    data-featured-gallery-lab="1"
    :aria-label="`${kicker}, ${countLabel}`"
  >
    <div class="fg__head" :data-layout="headerMode">
      <h3 class="fg__kicker">{{ kicker }}</h3>
      <NuxtLink
        v-if="galleryHref"
        :to="galleryHref"
        class="fg__count fg__count-link"
        :aria-label="`Open gallery, ${countLabel}`"
        @click="onCountNavigate"
      >
        {{ countLabel }}
        <svg class="fg__arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </NuxtLink>
      <p v-else class="fg__count">
        <svg
          v-if="headerMode === 'arrow'"
          class="fg__arrow"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        {{ countLabel }}
      </p>
    </div>

    <div
      ref="trackEl"
      class="fg__track"
      :data-snap="tune.snap"
      :data-frame="aspectActive ? 'aspect' : 'fixed'"
      @scroll.passive="onScroll"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @keydown="onTrackKeydown"
    >
      <button
        v-for="(photo, index) in photos"
        :key="photo.id"
        type="button"
        class="fg__slide"
        :data-fg-index="index"
        :data-matte="aspectSlide(index)?.matte ? '1' : undefined"
        :style="slideStyle(index)"
        :aria-label="`Photograph ${index + 1} of ${photos.length}. ${photo.alt}`"
        :aria-current="index === active ? 'true' : undefined"
        @click="onSlideClick(index, $event)"
      >
        <span class="fg__frame">
          <img
            :src="photo.src"
            alt=""
            :width="photo.width"
            :height="photo.height"
            decoding="async"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :fetchpriority="index === 0 ? 'high' : 'low'"
            draggable="false"
            :style="imageStyle(photo)"
          >
        </span>
      </button>
    </div>

    <ClientOnly>
      <GalleryViewer
        v-if="photos.length"
        :viewer="viewer"
        :photos="viewerPhotos"
        :identity="identity"
        origin=""
        :resolve-frame="resolveFrame"
      />
    </ClientOnly>

    <aside
      v-if="showPanel && !viewer.open.value"
      class="fg-lab"
      aria-label="Featured gallery experiment controls (local only)"
    >
      <button
        type="button"
        class="fg-lab__toggle"
        :aria-expanded="panelOpen ? 'true' : 'false'"
        aria-controls="fg-lab-body"
        @click="panelOpen = !panelOpen"
      >
        Gallery lab
        <span class="fg-lab__badge">{{ variantLabel }}</span>
      </button>

      <div v-show="panelOpen" id="fg-lab-body" class="fg-lab__body">
        <div class="fg-lab__modes" role="radiogroup" aria-label="Cinematic framing">
          <label v-for="item in framingOptions" :key="item.id" class="fg-lab__mode">
            <input
              type="radio"
              name="fg-lab-framing"
              :value="item.id"
              :checked="framing === item.id"
              @change="framing = item.id"
            >
            <span>{{ item.label }}</span>
          </label>
        </div>

        <div class="fg-lab__modes" role="radiogroup" aria-label="Visual direction">
          <label v-for="item in variantOptions" :key="item.id" class="fg-lab__mode">
            <input
              type="radio"
              name="fg-lab-variant"
              :value="item.id"
              :checked="variant === item.id"
              @change="applyVariant(item.id)"
            >
            <span>{{ item.label }}</span>
          </label>
        </div>

        <div class="fg-lab__modes" role="radiogroup" aria-label="Header">
          <label v-for="item in headerOptions" :key="item.id" class="fg-lab__mode">
            <input
              type="radio"
              name="fg-lab-header"
              :value="item.id"
              :checked="headerMode === item.id"
              @change="headerMode = item.id"
            >
            <span>{{ item.label }}</span>
          </label>
        </div>

        <label class="fg-lab__row">
          <span>Gallery breakout</span>
          <input v-model.number="tune.breakout" type="range" min="0" max="24" step="1">
          <output>{{ tune.breakout }}px</output>
        </label>
        <div class="fg-lab__modes" role="radiogroup" aria-label="Gallery frame height">
          <label v-for="item in heightOptions" :key="item.id" class="fg-lab__mode">
            <input
              type="radio"
              name="fg-lab-height"
              :value="item.id"
              :checked="heightChoice === item.id"
              @change="heightChoice = item.id"
            >
            <span>{{ item.label }}</span>
          </label>
          <span class="fg-lab__mode">{{ rowHeight }}px</span>
        </div>
        <label class="fg-lab__row">
          <span>Active width</span>
          <input v-model.number="tune.width" type="range" min="52" max="92" step="1">
          <output>{{ tune.width }}%</output>
        </label>
        <label class="fg-lab__row">
          <span>Gap</span>
          <input v-model.number="tune.gap" type="range" min="4" max="20" step="1">
          <output>{{ tune.gap }}</output>
        </label>
        <label class="fg-lab__row">
          <span>Height</span>
          <input v-model.number="tune.height" type="range" min="160" max="380" step="2">
          <output>{{ tune.height }}</output>
        </label>
        <label class="fg-lab__row">
          <span>Radius</span>
          <input v-model.number="tune.radius" type="range" min="0" max="24" step="1">
          <output>{{ tune.radius }}</output>
        </label>
        <label class="fg-lab__row">
          <span>Top space</span>
          <input v-model.number="tune.top" type="range" min="0" max="48" step="1">
          <output>{{ tune.top }}</output>
        </label>
        <label class="fg-lab__row">
          <span>Bottom space</span>
          <input v-model.number="tune.bottom" type="range" min="0" max="48" step="1">
          <output>{{ tune.bottom }}</output>
        </label>
        <label class="fg-lab__row">
          <span>Header gap</span>
          <input v-model.number="tune.headerGap" type="range" min="4" max="36" step="1">
          <output>{{ tune.headerGap }}</output>
        </label>
        <label class="fg-lab__row">
          <span>Active scale</span>
          <input v-model.number="tune.activeScale" type="range" min="0.97" max="1" step="0.005">
          <output>{{ tune.activeScale.toFixed(3) }}</output>
        </label>
        <label class="fg-lab__row">
          <span>Adjacent scale</span>
          <input v-model.number="tune.adjacentScale" type="range" min="0.94" max="1" step="0.005">
          <output>{{ tune.adjacentScale.toFixed(3) }}</output>
        </label>
        <label class="fg-lab__row">
          <span>Track edge</span>
          <input v-model.number="tune.edge" type="range" min="0" max="32" step="1">
          <output>{{ tune.edge }}</output>
        </label>
        <p class="fg-lab__note">
          Fixed frame crops every photo to one card. Aspect-aware keeps each photograph's ratio. Film strip stays on the fixed frame.
          Nothing here is saved.
        </p>
      </div>
    </aside>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import GalleryViewer from '~/features/gallery-experience/canonical/GalleryViewer.client.vue'
import { useGalleryViewer } from '~/features/gallery-experience/canonical/useGalleryViewer.js'
import {
  FEATURED_GALLERY_HEADER_MODES,
  FEATURED_GALLERY_VARIANTS,
  featuredGalleryCountLabel,
  featuredGalleryFixture,
  featuredGalleryKicker,
  resolveAspectRowHeight,
  resolveAspectSlide,
  resolveLegacyAspectRowHeight,
} from '~/utils/media/featuredGalleryFixture'
import { withSafeFrom } from '~/utils/nights/artistWorldReturn'

const props = defineProps({
  artistName: { type: String, default: '' },
  artistSlug: { type: String, default: '' },
  artistImage: { type: String, default: '' },
  gallery: { type: Object, default: null },
  lab: { type: Boolean, default: false },
})

const fixture = featuredGalleryFixture
const isDev = Boolean(import.meta.dev)
const showPanel = computed(() => props.lab && isDev)

function productionPhotos(gallery) {
  const rows = Array.isArray(gallery?.photos) ? gallery.photos : []
  return rows
    .filter((photo) => photo && (photo.url || photo.src))
    .map((photo) => ({
      id: photo.id,
      src: photo.url || photo.src,
      width: Number(photo.width) || 0,
      height: Number(photo.height) || 0,
      alt: photo.alt || '',
      objectPosition: 'center',
    }))
}

const photos = computed(() => (
  props.lab ? fixture.photos : productionPhotos(props.gallery)
))
const reduced = usePreferredReducedMotion()

const variant = ref('cinematic')
const framing = ref('aspect')
const headerMode = ref('gallery')
const heightChoice = ref('default')
const heightOptions = computed(() => {
  const legacy = resolveLegacyAspectRowHeight(trackWidth.value, tune.height)
  const next = resolveAspectRowHeight(trackWidth.value)
  return [
    { id: 'current', label: `Current · ${legacy}px` },
    { id: '10', label: `10% shorter · ${Math.round(legacy * 0.9)}px` },
    { id: '20', label: `20% shorter · ${Math.round(legacy * 0.8)}px` },
    { id: '25', label: `25% shorter · ${Math.round(legacy * 0.75)}px` },
    { id: 'default', label: `New default · ${next}px` },
  ]
})
const panelOpen = ref(false)
const tune = reactive({ ...FEATURED_GALLERY_VARIANTS.cinematic })
const active = ref(0)
const trackEl = ref(null)
const trackWidth = ref(366)

const framingOptions = [
  { id: 'fixed', label: 'Fixed frame' },
  { id: 'aspect', label: 'Aspect-aware' },
]
const variantOptions = Object.entries(FEATURED_GALLERY_VARIANTS).map(([id, value]) => ({
  id,
  label: value.label,
}))
const headerOptions = FEATURED_GALLERY_HEADER_MODES
const aspectActive = computed(() => framing.value === 'aspect' && tune.snap !== 'center')
const variantLabel = computed(() => {
  const name = FEATURED_GALLERY_VARIANTS[variant.value]?.label || 'Custom'
  return aspectActive.value ? `${name} · Aspect` : name
})

const rowHeight = computed(() => {
  const choice = props.lab ? heightChoice.value : 'default'
  const legacy = resolveLegacyAspectRowHeight(trackWidth.value, tune.height)
  if (choice === 'current') return legacy
  if (choice === '10') return Math.max(1, Math.round(legacy * 0.9))
  if (choice === '20') return Math.max(1, Math.round(legacy * 0.8))
  if (choice === '25') return Math.max(1, Math.round(legacy * 0.75))
  return resolveAspectRowHeight(trackWidth.value)
})

const aspectSlides = computed(() => {
  if (!aspectActive.value || !(trackWidth.value > 0)) return null
  return photos.value.map((photo) => resolveAspectSlide(photo, {
    trackWidth: trackWidth.value,
    trackHeight: rowHeight.value,
  }))
})

function aspectSlide(index) {
  return aspectSlides.value?.[index] || null
}

function slideStyle(index) {
  const slide = aspectSlide(index)
  if (!slide) return undefined
  return {
    width: `${slide.width}px`,
    height: `${slide.height}px`,
    flexBasis: `${slide.width}px`,
  }
}

function imageStyle(photo) {
  if (aspectActive.value) return { objectFit: 'contain', objectPosition: 'center' }
  return { objectFit: 'cover', objectPosition: photo.objectPosition }
}
const countLabel = computed(() => featuredGalleryCountLabel(photos.value.length))
const galleryHref = computed(() => {
  if (props.lab) return ''
  const band = String(props.artistSlug || '').trim()
  const artistPath = band && !band.includes('/') ? `/${band}` : ''
  const path = String(props.gallery?.canonicalPath || '').trim()
  let dest = ''
  if (path.startsWith('/')) dest = path
  else {
    const slug = String(props.gallery?.slug || '').trim()
    if (!artistPath || !slug || slug.includes('/')) return ''
    dest = `${artistPath}/gallery/${slug}`
  }
  return artistPath ? (withSafeFrom(dest, artistPath) || dest) : dest
})

function onCountNavigate(event) {
  if (!galleryHref.value) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  navigateTo(galleryHref.value)
}
const kicker = computed(() => featuredGalleryKicker(headerMode.value, fixture.title))

const frameStyle = computed(() => ({
  '--fg-slide': `${tune.width}%`,
  '--fg-gap': `${tune.gap}px`,
  '--fg-height': `${rowHeight.value}px`,
  '--fg-radius': `${tune.radius}px`,
  '--fg-top': `${tune.top}px`,
  '--fg-bottom': `${tune.bottom}px`,
  '--fg-header-gap': `${tune.headerGap}px`,
  '--fg-active': String(tune.activeScale),
  '--fg-adjacent': String(tune.adjacentScale),
  '--fg-edge': `${tune.edge}px`,
  '--fg-breakout': `${tune.breakout}px`,
  '--fg-snap': tune.snap,
}))

const viewerPhotos = computed(() => photos.value.map((photo, index) => ({
  id: photo.id,
  index,
  src: photo.src,
  fullSrc: photo.src,
  thumbSrc: photo.src,
  width: photo.width,
  height: photo.height,
  alt: photo.alt,
  caption: '',
})))

const identity = computed(() => {
  const name = String(props.artistName || '').trim()
  return {
    artistName: name,
    artistInitial: name ? name.slice(0, 1).toUpperCase() : '',
    artistPath: props.artistSlug ? `/${props.artistSlug}` : '',
    artistImage: props.artistImage ? { src: props.artistImage } : null,
    title: props.lab ? fixture.title : (props.gallery?.title || 'Gallery'),
    nightTitle: props.lab ? fixture.title : (props.gallery?.title || 'Gallery'),
    focalX: 50,
    focalY: 50,
    placeLine: '',
    dateLine: '',
    photoCount: photos.value.length,
  }
})

function resolveFrame(index) {
  const track = trackEl.value
  if (!track) return null
  return track.querySelector(`[data-fg-index="${index}"]`)
}

const viewer = useGalleryViewer({
  photos: () => viewerPhotos.value,
  model: () => ({
    locked: false,
    unavailable: false,
    canonicalPath: props.lab ? '' : (props.gallery?.canonicalPath || ''),
    isPublic: !props.lab && !!props.gallery?.canonicalPath,
    identity: identity.value,
  }),
  resolveFrame,
  reduced: () => reduced.value,
})

function applyVariant(id) {
  const next = FEATURED_GALLERY_VARIANTS[id]
  if (!next) return
  variant.value = id
  Object.assign(tune, next)
}

const TAP_SLOP = 8

let pointerStartX = 0
let pointerStartY = 0
let pointerMovedX = 0
let pointerMoved = 0
let pageScrollStart = 0
let mouseDrag = false
let dragArmed = false
let dragOrigin = 0
let pressedIndex = -1
let suppressClick = false
let gestureLive = false
let sawPageScroll = false
let scrollTimer = 0
let frame = 0

function prefersReduce() {
  return reduced.value || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
}

function closestIndex() {
  const track = trackEl.value
  if (!track) return 0
  const slides = track.querySelectorAll('[data-fg-index]')
  const trackRect = track.getBoundingClientRect()
  const centered = tune.snap === 'center'
  const origin = centered
    ? trackRect.left + trackRect.width / 2
    : trackRect.left + (Number.parseFloat(tune.edge) || 0)
  let best = 0
  let bestDist = Infinity
  slides.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const point = centered ? rect.left + rect.width / 2 : rect.left
    const dist = Math.abs(point - origin)
    const index = Number(el.getAttribute('data-fg-index'))
    if (dist < bestDist) {
      bestDist = dist
      best = index
    }
    const span = rect.width || 1
    const mix = Math.min(1, dist / span)
    const frameEl = el.querySelector('.fg__frame')
    if (frameEl) frameEl.style.setProperty('--fg-mix', mix.toFixed(3))
  })
  return best
}

function paint() {
  active.value = closestIndex()
}

function onScroll() {
  const track = trackEl.value
  if (track) track.classList.add('is-scrolling')
  if (scrollTimer) window.clearTimeout(scrollTimer)
  scrollTimer = window.setTimeout(() => {
    trackEl.value?.classList.remove('is-scrolling')
  }, 140)
  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    paint()
  })
}

function scrollToIndex(index) {
  const track = trackEl.value
  const el = resolveFrame(index)
  if (!track || !el) return
  const trackRect = track.getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  const delta = tune.snap === 'center'
    ? (rect.left + rect.width / 2) - (trackRect.left + trackRect.width / 2)
    : rect.left - trackRect.left - (Number.parseFloat(tune.edge) || 0)
  track.scrollTo({
    left: track.scrollLeft + delta,
    behavior: prefersReduce() ? 'auto' : 'smooth',
  })
}

function slideIndexFromEvent(event) {
  const el = event.target?.closest?.('[data-fg-index]')
  if (!el) return -1
  const index = Number(el.getAttribute('data-fg-index'))
  return Number.isFinite(index) ? index : -1
}

function onPageScroll() {
  sawPageScroll = true
}

function armScrollWatch() {
  if (typeof window === 'undefined') return
  window.addEventListener('scroll', onPageScroll, { passive: true, capture: true })
}

function disarmScrollWatch() {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', onPageScroll, { capture: true })
}

function resetGesture() {
  pressedIndex = -1
  pointerStartX = 0
  pointerStartY = 0
  pointerMovedX = 0
  pointerMoved = 0
  dragArmed = false
  gestureLive = false
  disarmScrollWatch()
}

function pageScrolledDuringGesture() {
  if (sawPageScroll) return true
  if (typeof window === 'undefined') return false
  return Math.abs(window.scrollY - pageScrollStart) > 2
}

function onPointerDown(event) {
  if (event.button != null && event.button !== 0) return
  gestureLive = true
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  pointerMovedX = 0
  pointerMoved = 0
  pageScrollStart = typeof window === 'undefined' ? 0 : window.scrollY
  sawPageScroll = false
  armScrollWatch()
  pressedIndex = slideIndexFromEvent(event)
  if (event.pointerType !== 'mouse') return
  const track = trackEl.value
  if (!track) return
  // Capture only after a real drag. Capturing on press swallows the
  // button click, so a tap never reaches the lightbox.
  dragArmed = true
  dragOrigin = track.scrollLeft
}

function onPointerMove(event) {
  if (!gestureLive) return
  const dx = Math.abs(event.clientX - pointerStartX)
  const dy = Math.abs(event.clientY - pointerStartY)
  pointerMovedX = Math.max(pointerMovedX, dx)
  pointerMoved = Math.max(pointerMoved, dx, dy)
  if (!dragArmed || !trackEl.value || pointerMovedX <= TAP_SLOP) return
  if (!mouseDrag) {
    mouseDrag = true
    trackEl.value.classList.add('is-dragging')
    trackEl.value.setPointerCapture?.(event.pointerId)
  }
  trackEl.value.scrollLeft = dragOrigin - (event.clientX - pointerStartX)
  paint()
}

function endMouseDrag(event, dragged) {
  if (!mouseDrag) return
  mouseDrag = false
  const track = trackEl.value
  track?.classList.remove('is-dragging')
  if (track?.hasPointerCapture?.(event.pointerId)) track.releasePointerCapture(event.pointerId)
  if (dragged) scrollToIndex(closestIndex())
}

function onPointerCancel(event) {
  // The browser took the gesture for scrolling. A cancelled touch is not a tap.
  endMouseDrag(event, pointerMovedX > TAP_SLOP)
  suppressClick = true
  resetGesture()
}

function onPointerUp(event) {
  const dragged = pointerMoved > TAP_SLOP || pageScrolledDuringGesture()
  const index = pressedIndex
  const touch = event.pointerType !== 'mouse'
  endMouseDrag(event, pointerMovedX > TAP_SLOP)
  resetGesture()
  if (dragged) suppressClick = true
  // Touch opens from click. A scroll never emits click; pointerup during a
  // vertical swipe was being treated as a tap and opening the viewer.
  if (touch || dragged || index < 0) return
  suppressClick = true
  viewer.openAt(index)
}

function onSlideClick(index) {
  const scrolled = pageScrolledDuringGesture()
  disarmScrollWatch()
  sawPageScroll = false
  if (suppressClick || scrolled) {
    suppressClick = false
    return
  }
  viewer.openAt(index)
}

function onTrackKeydown(event) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  event.preventDefault()
  const dir = event.key === 'ArrowRight' ? 1 : -1
  const next = Math.min(photos.value.length - 1, Math.max(0, active.value + dir))
  scrollToIndex(next)
  resolveFrame(next)?.focus({ preventScroll: true })
}

let trackObserver = null

function measureTrack() {
  const track = trackEl.value
  if (!track) return
  const next = track.clientWidth
  if (next > 0 && next !== trackWidth.value) trackWidth.value = next
}

onMounted(() => {
  measureTrack()
  paint()
  if (typeof ResizeObserver !== 'undefined' && trackEl.value) {
    trackObserver = new ResizeObserver(() => {
      measureTrack()
      paint()
    })
    trackObserver.observe(trackEl.value)
  }
})

onBeforeUnmount(() => {
  trackObserver?.disconnect()
  disarmScrollWatch()
  if (scrollTimer) window.clearTimeout(scrollTimer)
  if (frame) window.cancelAnimationFrame(frame)
})
</script>

<style scoped>
.fg {
  padding-top: var(--fg-top, 0px);
  padding-bottom: var(--fg-bottom, 0px);
  min-width: 0;
}

.fg__head {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 0 var(--fg-header-gap, 14px);
}

.fg__head[data-layout='stack'] {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.28rem;
}

.fg__kicker,
.fg__count {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.2;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

/* Same rendered eyebrow as Streaming / Website / Social on the polish Cybered page. */
.fg__kicker {
  color: #e8e8ec;
  font-weight: 650;
}

.fg__count {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: rgb(255 255 255 / 0.38);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.fg__count.fg__count-link {
  position: relative;
  z-index: 2;
  min-height: 44px;
  padding: 0 0.15rem;
  color: rgb(255 255 255 / 0.72);
  text-decoration: none;
  cursor: pointer;
}
.fg__count-link:hover {
  color: #f5f5f6;
}
.fg__count-link:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.88);
  outline-offset: 3px;
  border-radius: 2px;
}

.fg__arrow {
  display: block;
  opacity: 0.7;
}

.fg__track {
  display: flex;
  align-items: stretch;
  gap: var(--fg-gap, 10px);
  margin-inline: calc(var(--fg-breakout, 12px) * -1);
  padding-inline: var(--fg-edge, 8px);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--fg-edge, 8px);
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  cursor: grab;
}

.fg__track[data-snap='center'] {
  padding-inline: calc((100% - var(--fg-slide, 58%)) / 2);
  scroll-padding-inline: calc((100% - var(--fg-slide, 58%)) / 2);
}

.fg__track[data-frame='aspect'] {
  align-items: center;
  min-height: var(--fg-height, 160px);
}

.fg__track[data-frame='aspect'] .fg__slide {
  background: transparent;
}

.fg__track::-webkit-scrollbar {
  display: none;
}

.fg__track.is-dragging {
  cursor: grabbing;
  scroll-snap-type: none;
  user-select: none;
}

.fg__slide {
  flex: 0 0 var(--fg-slide, 84%);
  width: var(--fg-slide, 84%);
  height: var(--fg-height, 160px);
  margin: 0;
  padding: 0;
  border: 0;
  background: #101114;
  color: inherit;
  scroll-snap-align: var(--fg-snap, start);
  scroll-snap-stop: normal;
  cursor: pointer;
  appearance: none;
}

.fg__slide:focus {
  outline: none;
}

.fg__slide:focus-visible {
  outline: 1px solid rgba(255, 255, 255, 0.88);
  outline-offset: 3px;
}

.fg__frame {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--fg-radius, 12px);
  transform: scale(calc(
    var(--fg-active, 1) - (var(--fg-active, 1) - var(--fg-adjacent, 0.992)) * var(--fg-mix, 0)
  ));
  opacity: calc(1 - (0.045 * var(--fg-mix, 0)));
  transform-origin: center center;
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.fg__track.is-scrolling .fg__frame,
.fg__track.is-dragging .fg__frame {
  transition: none;
}

.fg__frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.fg__track[data-frame='aspect'] .fg__frame img {
  object-fit: contain;
  object-position: center;
}

.fg__slide[data-matte='1'] .fg__frame {
  background: #070708;
}

.fg-lab {
  position: fixed;
  left: 0.75rem;
  bottom: 0.75rem;
  z-index: 40;
  width: min(17.5rem, calc(100vw - 1.5rem));
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(8, 9, 12, 0.94);
  color: #f4f6f8;
  font-size: 0.75rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.fg-lab__toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  margin: 0;
  padding: 0.45rem 0.65rem;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.fg-lab__badge {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.03em;
  text-transform: none;
}

.fg-lab__body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-height: min(62vh, 28rem);
  overflow: auto;
  padding: 0 0.65rem 0.7rem;
}

.fg-lab__modes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.fg-lab__mode {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.78);
}

.fg-lab__row {
  display: grid;
  grid-template-columns: 6.4rem 1fr 2.6rem;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255, 255, 255, 0.72);
}

.fg-lab__row input[type='range'] {
  width: 100%;
  accent-color: #f4f6f8;
}

.fg-lab__row output {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.9);
}

.fg-lab__note {
  margin: 0.15rem 0 0;
  color: rgba(255, 255, 255, 0.46);
  line-height: 1.35;
}

/*
 * The public artist header is z-index 99999999. PhotoSwipe opens at 100000,
 * so on this page the photograph would sit under the bar. This override is
 * scoped to the canonical viewer's own `.fq-cg` root and only ships with the
 * lab component.
 */
:global(.pswp.fq-cg) {
  z-index: 100000000;
}

@media (prefers-reduced-motion: reduce) {
  .fg__frame {
    transform: none;
    opacity: 1;
    transition: none;
  }

  .fg__track {
    scroll-behavior: auto;
  }
}
</style>
