<template>
  <div class="faneqo-artist-image-editor space-y-5">
    <div>
      <p class="text-white text-sm font-medium">{{ isNightHero ? 'Night hero' : 'Profile image' }}</p>
      <p class="text-white/50 text-sm mt-1">
        {{ helpCopy }}
      </p>
    </div>

    <div>
      <div class="flex items-center justify-between gap-3 mb-3">
        <h3 class="text-white text-sm font-semibold">{{ showBothSurfaces ? 'Phone / Desktop' : 'Preview' }}</h3>
        <div
          v-if="showViewportTabs"
          class="inline-flex rounded-lg border border-white/15 p-0.5 bg-black/40"
          role="tablist"
          :aria-label="showBothSurfaces ? 'Editing surface' : 'Preview viewport'"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="previewViewport === 'phone'"
            class="inline-flex items-center gap-1.5 px-3 min-h-11 py-2 rounded-md text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
            :class="previewViewport === 'phone' ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'"
            @click="previewViewport = 'phone'"
          >
            <Smartphone :size="14" :stroke-width="1.75" />
            Phone
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="previewViewport === 'desktop'"
            class="inline-flex items-center gap-1.5 px-3 min-h-11 py-2 rounded-md text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
            :class="previewViewport === 'desktop' ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'"
            @click="previewViewport = 'desktop'"
          >
            <Monitor :size="14" :stroke-width="1.75" />
            Desktop
          </button>
        </div>
      </div>

      <div
        class="mx-auto w-full rounded-2xl border border-white/10 bg-black overflow-hidden"
        :style="{ maxWidth: `${previewFrame.width}px` }"
      >
        <div
          ref="frameRef"
          id="artist-image-frame"
          class="relative overflow-hidden w-full"
          :class="{
            'is-dragging': isDragging,
            'is-full-photo': activeIsFull,
            'is-desktop-full': activeIsFull && previewViewport === 'desktop',
          }"
          :style="{ aspectRatio: `${previewFrame.width} / ${previewFrame.height}` }"
          role="button"
          :tabindex="activeIsFull ? -1 : 0"
          :aria-label="activeIsFull ? 'Full photograph preview' : 'Drag to frame your photo'"
          :aria-disabled="activeIsFull ? 'true' : 'false'"
          @pointerdown="startDrag"
          @pointermove="onDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="artistName ? `${artistName} image` : 'Artist image'"
            class="cybered-hero-photo"
            :style="photoStyle"
          />
          <template v-if="!isNightHero">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent pointer-events-none" />
            <div class="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            <div v-if="artistName" class="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none artist-image-name">
              <p class="text-white font-extrabold tracking-tight leading-tight text-xl sm:text-2xl">
                {{ artistName }}
              </p>
            </div>
          </template>
        </div>
      </div>
      <p class="mt-2 text-center text-white/35 text-xs tabular-nums">
        {{ previewViewport === 'phone' ? 'Phone' : 'Desktop' }}
        · {{ Math.round(previewFrame.viewportWidth) }}×{{ Math.round(previewFrame.viewportHeight) }}
      </p>
    </div>

    <div v-if="showFitControls" class="space-y-3">
      <h3 class="text-white text-sm font-semibold">Image fit</h3>
      <div class="grid grid-cols-2 gap-2" role="radiogroup" :aria-label="`${surfaceLabel} image fit`">
        <button
          type="button"
          role="radio"
          :aria-checked="activeFraming.fit === 'fill'"
          class="min-h-11 px-3 rounded-xl border text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
          :class="activeFraming.fit === 'fill'
            ? 'bg-white/10 border-white/25 text-white'
            : 'bg-transparent border-white/15 text-white/60 hover:text-white'"
          @click="setFit('fill')"
        >
          Fill frame
        </button>
        <button
          type="button"
          role="radio"
          :aria-checked="activeFraming.fit === 'full'"
          class="min-h-11 px-3 rounded-xl border text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
          :class="activeFraming.fit === 'full'
            ? 'bg-white/10 border-white/25 text-white'
            : 'bg-transparent border-white/15 text-white/60 hover:text-white'"
          @click="setFit('full')"
        >
          Full photo
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div>
        <h3 class="text-white text-sm font-semibold">Adjust framing</h3>
        <p class="text-white/50 text-xs mt-1">
          {{ activeIsFull
            ? 'Full photo shows the complete photograph. Fill frame position and zoom are remembered.'
            : 'Drag the photo, or use the controls below.' }}
        </p>
      </div>

      <fieldset :disabled="activeIsFull" :class="activeIsFull ? 'opacity-40 pointer-events-none' : ''">
        <div class="flex items-center gap-4">
          <label :for="controlId('x')" class="text-white/70 text-sm font-medium shrink-0 w-16">Horizontal</label>
          <input
            :id="controlId('x')"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="activeFraming.positionX"
            class="faneqo-artist-framing-slider flex-1"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="activeFraming.positionX"
            @input="onHorizontalInput"
          />
          <span class="text-white/45 text-xs w-10 text-right tabular-nums">{{ Math.round(activeFraming.positionX) }}</span>
        </div>

        <div class="flex items-center gap-4 mt-4">
          <label :for="controlId('y')" class="text-white/70 text-sm font-medium shrink-0 w-16">Vertical</label>
          <input
            :id="controlId('y')"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="activeFraming.positionY"
            class="faneqo-artist-framing-slider flex-1"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="activeFraming.positionY"
            @input="onVerticalInput"
          />
          <span class="text-white/45 text-xs w-10 text-right tabular-nums">{{ Math.round(activeFraming.positionY) }}</span>
        </div>

        <div v-if="!isNightHero" class="flex items-center gap-4 mt-4">
          <label :for="controlId('z')" class="text-white/70 text-sm font-medium shrink-0 w-16">Zoom</label>
          <input
            :id="controlId('z')"
            type="range"
            min="1"
            max="2"
            step="0.01"
            :value="activeFraming.zoom"
            class="faneqo-artist-framing-slider flex-1"
            aria-valuemin="1"
            aria-valuemax="2"
            :aria-valuenow="activeFraming.zoom"
            @input="onZoomInput"
          />
          <span class="text-white/45 text-xs w-10 text-right tabular-nums">{{ Math.round(activeFraming.zoom * 100) }}%</span>
        </div>
      </fieldset>

      <button
        type="button"
        class="w-full min-h-11 py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition"
        @click="resetFraming"
      >
        Reset framing
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Monitor, Smartphone } from '@lucide/vue'
import {
  DEFAULT_ARTIST_FOCAL_X,
  DEFAULT_ARTIST_FOCAL_Y,
  DEFAULT_ARTIST_ZOOM,
  clampArtistZoom,
  nextArtistFocalFromPointerDelta,
} from '@/utils/media/artistImage'
import {
  clampCyberedSurfaceFraming,
  getCyberedSurfacePhotoStyle,
  getDefaultCyberedSurfaceFraming,
  normalizeCyberedHeroFit,
  resetCyberedSurfaceCrop,
} from '@/utils/media/cyberedArtistFraming'
import { getCyberedEditorPreviewFrame } from '@/utils/media/cyberedHeroGeometry'

const props = defineProps({
  variant: { type: String, default: 'artist' },
  surfaces: { type: String, default: 'both' },
  imageUrl: { type: String, default: '' },
  imageWidth: { type: [Number, String], default: null },
  imageHeight: { type: [Number, String], default: null },
  fitMode: { type: String, default: 'fill' },
  positionX: { type: Number, default: 50 },
  positionY: { type: Number, default: 50 },
  zoom: { type: Number, default: 1 },
  phone: { type: Object, default: null },
  desktop: { type: Object, default: null },
  artistName: { type: String, default: '' },
})

const isNightHero = computed(() => props.variant === 'night-hero')
const showBothSurfaces = computed(() => !isNightHero.value && props.surfaces !== 'phone')
const showViewportTabs = computed(() => isNightHero.value || props.surfaces !== 'phone')
const showFitControls = computed(() => !isNightHero.value && props.surfaces !== 'phone')

const emit = defineEmits([
  'update:fitMode',
  'update:positionX',
  'update:positionY',
  'update:zoom',
  'update:phone',
  'update:desktop',
  'framing-change',
])

const previewViewport = ref('phone')
const frameRef = ref(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const positionStart = ref({ x: 50, y: 50 })

const previewImage = computed(() => ({
  url: props.imageUrl,
  width: props.imageWidth,
  height: props.imageHeight,
}))

const previewFrame = computed(() =>
  getCyberedEditorPreviewFrame({
    surface: previewViewport.value,
    image: previewImage.value,
  })
)

const fallbackFraming = computed(() => ({
  fit: normalizeCyberedHeroFit(props.fitMode),
  positionX: Number.isFinite(Number(props.positionX)) ? Number(props.positionX) : DEFAULT_ARTIST_FOCAL_X,
  positionY: Number.isFinite(Number(props.positionY)) ? Number(props.positionY) : DEFAULT_ARTIST_FOCAL_Y,
  zoom: Number.isFinite(Number(props.zoom)) ? Number(props.zoom) : DEFAULT_ARTIST_ZOOM,
}))

const phoneFraming = computed(() =>
  clampCyberedSurfaceFraming(props.phone || fallbackFraming.value)
)

const desktopFraming = computed(() =>
  clampCyberedSurfaceFraming(props.desktop || (showBothSurfaces.value ? getDefaultCyberedSurfaceFraming() : fallbackFraming.value))
)

const activeSurface = computed(() => (
  showBothSurfaces.value && previewViewport.value === 'desktop' ? 'desktop' : 'phone'
))

const activeFraming = computed(() =>
  activeSurface.value === 'desktop' ? desktopFraming.value : phoneFraming.value
)

const surfaceLabel = computed(() => (activeSurface.value === 'desktop' ? 'Desktop' : 'Phone'))
const activeIsFull = computed(() => !isNightHero.value && activeFraming.value.fit === 'full')
const helpCopy = computed(() => {
  if (isNightHero.value) return 'Drag the preview to frame how this Night opens.'
  if (showBothSurfaces.value) {
    return 'Phone and Desktop each keep their own fit and framing. Switching tabs does not save.'
  }
  return 'Drag the preview to frame your photo. Faneqo uses this same framing on your artist page.'
})

const photoStyle = computed(() => {
  if (isNightHero.value) {
    return getCyberedSurfacePhotoStyle({
      fit: 'fill',
      positionX: props.positionX,
      positionY: props.positionY,
      zoom: 1,
    })
  }
  return getCyberedSurfacePhotoStyle(activeFraming.value)
})

function controlId(axis) {
  return `artist-image-${activeSurface.value}-${axis}`
}

function emitSurface(surface, next, { cropChanged = false, fitChanged = false } = {}) {
  const framed = clampCyberedSurfaceFraming(next)
  if (surface === 'desktop') {
    emit('update:desktop', framed)
  } else {
    emit('update:phone', framed)
    emit('update:fitMode', framed.fit)
    emit('update:positionX', framed.positionX)
    emit('update:positionY', framed.positionY)
    emit('update:zoom', framed.zoom)
  }
  emit('framing-change', { surface, cropChanged, fitChanged })
}

function patchActive(partial, flags) {
  emitSurface(activeSurface.value, { ...activeFraming.value, ...partial }, flags)
}

function setFit(fit) {
  if (normalizeCyberedHeroFit(fit) === activeFraming.value.fit) return
  patchActive({ fit: normalizeCyberedHeroFit(fit) }, { fitChanged: true })
}

function startDrag(e) {
  if (activeIsFull.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (!frameRef.value) return
  e.preventDefault()
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  positionStart.value = {
    x: activeFraming.value.positionX,
    y: activeFraming.value.positionY,
  }
  try {
    frameRef.value.setPointerCapture(e.pointerId)
  } catch {
    // Some synthetic or already-released pointers cannot capture.
  }
}

function onDrag(e) {
  if (activeIsFull.value || !isDragging.value || !frameRef.value) return
  const rect = frameRef.value.getBoundingClientRect()
  const next = nextArtistFocalFromPointerDelta({
    startX: positionStart.value.x,
    startY: positionStart.value.y,
    deltaX: e.clientX - dragStart.value.x,
    deltaY: e.clientY - dragStart.value.y,
    frameWidth: rect.width,
    frameHeight: rect.height,
    zoom: isNightHero.value ? 1 : activeFraming.value.zoom,
  })
  patchActive({ positionX: next.x, positionY: next.y }, { cropChanged: true })
}

function endDrag(e) {
  if (!isDragging.value) return
  isDragging.value = false
  if (frameRef.value && e?.pointerId != null) {
    try {
      frameRef.value.releasePointerCapture(e.pointerId)
    } catch {
      // Pointer already released.
    }
  }
}

function onHorizontalInput(e) {
  patchActive({ positionX: Number(e.target.value) }, { cropChanged: true })
}

function onVerticalInput(e) {
  patchActive({ positionY: Number(e.target.value) }, { cropChanged: true })
}

function onZoomInput(e) {
  patchActive({ zoom: clampArtistZoom(e.target.value) }, { cropChanged: true })
}

function resetFraming() {
  if (isNightHero.value) {
    emit('update:positionX', DEFAULT_ARTIST_FOCAL_X)
    emit('update:positionY', DEFAULT_ARTIST_FOCAL_Y)
    emit('framing-change', { surface: 'phone', cropChanged: true })
    return
  }
  emitSurface(activeSurface.value, resetCyberedSurfaceCrop(activeFraming.value), { cropChanged: true })
}
</script>

<style scoped>
#artist-image-frame {
  touch-action: none;
  cursor: grab;
  user-select: none;
}

#artist-image-frame.is-dragging {
  cursor: grabbing;
}

#artist-image-frame.is-full-photo {
  cursor: default;
}

#artist-image-frame.is-desktop-full .artist-image-name {
  text-align: center;
}

.cybered-hero-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.faneqo-artist-framing-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 2.75rem;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  accent-color: #a855f7;
}

.faneqo-artist-framing-slider::-webkit-slider-runnable-track {
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.faneqo-artist-framing-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.75rem;
  height: 1.75rem;
  margin-top: -0.625rem;
  border-radius: 999px;
  background: #a855f7;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.faneqo-artist-framing-slider::-moz-range-track {
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.faneqo-artist-framing-slider::-moz-range-thumb {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: #a855f7;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
