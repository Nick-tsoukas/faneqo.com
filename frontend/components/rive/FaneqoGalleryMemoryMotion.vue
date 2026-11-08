<template>
  <span
    class="fq-gallery-memory"
    :class="{
      'is-saving': saving,
      'is-saved': saved,
      'is-celebrating': celebrating,
    }"
    aria-hidden="true"
  >
    <ClientOnly>
      <FaneqoRive
        v-if="available"
        ref="riveRef"
        :src="src"
        :artboard="artboard"
        :state-machine="stateMachine"
        :autoplay="false"
        fit="contain"
        alignment="center"
        aria-label="Gallery memory"
        @load="onLoad"
        @load-error="onMissing"
      />
    </ClientOnly>

    <span v-if="!available" class="fq-gallery-memory__fallback">
      <span class="fq-gallery-memory__orbit is-one" />
      <span class="fq-gallery-memory__orbit is-two" />
      <svg class="fq-gallery-memory__mark" viewBox="0 0 24 24" fill="none">
        <path d="M7 5.75h10A1.25 1.25 0 0 1 18.25 7v12l-6.25-3.6L5.75 19V7A1.25 1.25 0 0 1 7 5.75Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
        <path v-if="saved" d="m9.1 10.9 1.8 1.8 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
        <path v-else d="M9 10.25h6M12 7.25v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </span>
  </span>
</template>

<script setup>
/**
 * Rive owns only the save/remove feedback. Native Vue owns the button,
 * success copy, gallery, authorization, and FanPassport request.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FaneqoRive from '~/components/rive/FaneqoRive.vue'
import { useFaneqoGalleryMemory } from '~/composables/useFaneqoGalleryMemory'
import {
  FANEQO_GALLERY_MEMORY_ARTBOARD,
  FANEQO_GALLERY_MEMORY_SRC,
  FANEQO_GALLERY_MEMORY_STATE_MACHINE,
  probeFaneqoGalleryMemoryAsset,
} from '~/utils/rive/faneqoGalleryMemory'

const props = defineProps({
  artistName: { type: String, default: '' },
  photoCount: { type: Number, default: 0 },
  saving: { type: Boolean, default: false },
  saved: { type: Boolean, default: false },
})

const available = ref(false)
const riveRef = ref(null)
const celebrating = ref(false)
const memory = useFaneqoGalleryMemory(riveRef)
const src = FANEQO_GALLERY_MEMORY_SRC
const artboard = FANEQO_GALLERY_MEMORY_ARTBOARD
const stateMachine = FANEQO_GALLERY_MEMORY_STATE_MACHINE
let celebrationTimer = null

function state() {
  return {
    artistName: props.artistName,
    photoCount: props.photoCount,
    saving: props.saving,
    saved: props.saved,
  }
}

function onLoad() {
  memory.bind(state())
}

function onMissing() {
  available.value = false
}

function celebrate() {
  celebrating.value = false
  window.clearTimeout(celebrationTimer)
  requestAnimationFrame(() => {
    celebrating.value = true
    celebrationTimer = window.setTimeout(() => {
      celebrating.value = false
    }, 720)
  })
  if (available.value) memory.celebrate()
}

onMounted(async () => {
  available.value = await probeFaneqoGalleryMemoryAsset()
})

onBeforeUnmount(() => {
  window.clearTimeout(celebrationTimer)
})

watch(
  () => [props.artistName, props.photoCount, props.saving],
  () => {
    if (available.value) memory.bind(state())
  }
)

watch(
  () => props.saved,
  (saved, wasSaved) => {
    if (saved && !wasSaved) {
      celebrate()
      return
    }
    if (!saved && wasSaved && available.value) memory.remove()
  }
)

defineExpose({ celebrate, available })
</script>

<style scoped>
.fq-gallery-memory {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 1.45rem;
  height: 1.45rem;
  flex: 0 0 1.45rem;
  pointer-events: none;
}

.fq-gallery-memory :deep(.faneqo-rive),
.fq-gallery-memory :deep(.faneqo-rive__canvas),
.fq-gallery-memory__fallback {
  width: 100%;
  height: 100%;
}

.fq-gallery-memory__fallback {
  position: relative;
  display: grid;
  place-items: center;
  color: currentColor;
}

.fq-gallery-memory__mark {
  position: relative;
  z-index: 1;
  width: 1.18rem;
  height: 1.18rem;
}

.fq-gallery-memory__orbit {
  position: absolute;
  inset: 0.05rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  opacity: 0;
}

.fq-gallery-memory.is-saving .fq-gallery-memory__orbit.is-one {
  opacity: 0.28;
  animation: fq-memory-wait 0.9s ease-in-out infinite;
}

.fq-gallery-memory.is-celebrating .fq-gallery-memory__orbit.is-one,
.fq-gallery-memory.is-celebrating .fq-gallery-memory__orbit.is-two {
  animation: fq-memory-captured 0.72s cubic-bezier(0.2, 0.9, 0.2, 1) both;
}

.fq-gallery-memory.is-celebrating .fq-gallery-memory__orbit.is-two {
  animation-delay: 0.09s;
}

@keyframes fq-memory-wait {
  50% { transform: scale(1.22); opacity: 0.08; }
}

@keyframes fq-memory-captured {
  0% { transform: scale(0.72); opacity: 0.46; }
  100% { transform: scale(1.8); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .fq-gallery-memory__orbit { animation: none !important; opacity: 0 !important; }
}
</style>
