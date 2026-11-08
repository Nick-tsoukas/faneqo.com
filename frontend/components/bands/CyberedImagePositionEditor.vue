<template>
  <div class="cybered-image-editor">
    <div class="mb-3">
      <h3 class="text-white font-semibold text-sm">Adjust framing</h3>
      <p class="text-white/50 text-xs mt-1">Drag to position important details. Zoom stays on the profile hero only.</p>
    </div>

    <!-- Preview Frame -->
    <div 
      ref="frameRef"
      class="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/20 bg-black cursor-move select-none"
      @pointerdown="startDrag"
      @pointermove="onDrag"
      @pointerup="endDrag"
      @pointerleave="endDrag"
    >
      <!-- Image -->
      <img
        ref="imageRef"
        :src="imageUrl"
        alt="Banner preview"
        class="absolute w-full h-full object-cover pointer-events-none"
        :style="imageStyle"
        @load="onImageLoad"
      />
      
      <!-- Overlay guide -->
      <div class="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none" />
      
      <!-- Drag indicator -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity" :class="{ 'opacity-100': isDragging }">
        <div class="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
          Repositioning...
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="mt-4 space-y-4">
      <!-- Zoom Slider -->
      <div class="flex items-center gap-4">
        <label class="text-white/70 text-sm font-medium shrink-0 w-16">Zoom</label>
        <input
          type="range"
          :value="zoom"
          @input="onZoomChange"
          min="1"
          max="2"
          step="0.01"
          class="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <span class="text-white/50 text-sm w-12 text-right">{{ (zoom * 100).toFixed(0) }}%</span>
      </div>

      <!-- Reset Button -->
      <button
        type="button"
        @click="resetPosition"
        class="w-full py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset to Default
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  positionX: {
    type: Number,
    default: 50
  },
  positionY: {
    type: Number,
    default: 50
  },
  zoom: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:positionX', 'update:positionY', 'update:zoom'])

// Refs
const frameRef = ref(null)
const imageRef = ref(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const positionStart = ref({ x: 50, y: 50 })

// Local state for smooth dragging
const localPositionX = ref(props.positionX)
const localPositionY = ref(props.positionY)
const localZoom = ref(props.zoom)

// Sync props to local state
watch(() => props.positionX, (val) => { localPositionX.value = val })
watch(() => props.positionY, (val) => { localPositionY.value = val })
watch(() => props.zoom, (val) => { localZoom.value = val })

// Computed style for the image
const imageStyle = computed(() => {
  const scale = localZoom.value
  const x = localPositionX.value
  const y = localPositionY.value
  
  return {
    transformOrigin: `${x}% ${y}%`,
    transform: `scale(${scale})`,
    objectPosition: `${x}% ${y}%`
  }
})

// Drag handlers
function startDrag(e) {
  if (!frameRef.value) return
  
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  positionStart.value = { x: localPositionX.value, y: localPositionY.value }
  
  // Capture pointer for smooth dragging
  frameRef.value.setPointerCapture(e.pointerId)
}

function onDrag(e) {
  if (!isDragging.value || !frameRef.value) return
  
  const rect = frameRef.value.getBoundingClientRect()
  const deltaX = e.clientX - dragStart.value.x
  const deltaY = e.clientY - dragStart.value.y
  
  // Convert pixel movement to percentage (inverted for natural feel)
  // Scale sensitivity based on zoom level
  const sensitivity = 100 / (localZoom.value * Math.min(rect.width, rect.height))
  
  let newX = positionStart.value.x - (deltaX * sensitivity)
  let newY = positionStart.value.y - (deltaY * sensitivity)
  
  // Clamp values based on zoom level
  // When zoomed in, allow more range; when at 1x, keep centered
  const minClamp = Math.max(0, 50 - (50 * localZoom.value))
  const maxClamp = Math.min(100, 50 + (50 * localZoom.value))
  
  newX = Math.max(minClamp, Math.min(maxClamp, newX))
  newY = Math.max(minClamp, Math.min(maxClamp, newY))
  
  localPositionX.value = Math.round(newX)
  localPositionY.value = Math.round(newY)
}

function endDrag(e) {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // Emit final values
  emit('update:positionX', localPositionX.value)
  emit('update:positionY', localPositionY.value)
  
  if (frameRef.value) {
    frameRef.value.releasePointerCapture(e.pointerId)
  }
}

function onZoomChange(e) {
  const newZoom = parseFloat(e.target.value)
  localZoom.value = newZoom
  emit('update:zoom', newZoom)
}

function resetPosition() {
  localPositionX.value = 50
  localPositionY.value = 50
  localZoom.value = 1
  
  emit('update:positionX', 50)
  emit('update:positionY', 50)
  emit('update:zoom', 1)
}

function onImageLoad() {
  // Image loaded, could add validation here if needed
}
</script>

<style scoped>
/* Custom range slider styling */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #a855f7;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #a855f7;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.cybered-image-editor {
  touch-action: none;
}
</style>
