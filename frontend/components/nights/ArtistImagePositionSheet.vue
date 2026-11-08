<template>
  <Teleport to="body">
    <div v-if="open" class="aip" role="dialog" aria-modal="true" aria-labelledby="aip-title">
      <button type="button" class="aip__backdrop" aria-label="Close" @click="close" />
      <div class="aip__sheet">
        <header class="aip__head">
          <h2 id="aip-title">{{ isNightHero ? 'Adjust Night hero' : 'Adjust image' }}</h2>
          <button type="button" class="aip__x" @click="close">Close</button>
        </header>
        <div class="aip__body">
          <p class="aip__help">{{ helpCopy }}</p>
          <BandsFaneqoArtistImageEditor
            v-if="imageUrl"
            :variant="isNightHero ? 'night-hero' : 'artist'"
            :surfaces="isNightHero ? 'both' : 'phone'"
            :image-url="imageUrl"
            :image-width="imageWidth"
            :image-height="imageHeight"
            :fit-mode="draftFit"
            :position-x="draftX"
            :position-y="draftY"
            :zoom="isNightHero ? 1 : draftZoom"
            :artist-name="artistName"
            @update:fit-mode="draftFit = $event"
            @update:position-x="draftX = $event"
            @update:position-y="draftY = $event"
            @update:zoom="draftZoom = $event"
          />
        </div>
        <footer class="aip__foot">
          <p v-if="error" class="aip__error" role="alert">{{ error }}</p>
          <button type="button" class="aip__save" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button type="button" class="aip__cancel" :disabled="saving" @click="close">Cancel</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  DEFAULT_ARTIST_FOCAL_X,
  DEFAULT_ARTIST_FOCAL_Y,
  DEFAULT_ARTIST_ZOOM,
  clampArtistFocalPercent,
  clampArtistZoom,
  normalizeArtistImageFitMode,
} from '@/utils/media/artistImage'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'artist' },
  imageUrl: { type: String, default: '' },
  imageWidth: { type: [Number, String], default: null },
  imageHeight: { type: [Number, String], default: null },
  artistName: { type: String, default: '' },
  imageFit: { type: String, default: 'auto' },
  positionX: { type: [Number, String], default: 50 },
  positionY: { type: [Number, String], default: 50 },
  zoom: { type: [Number, String], default: 1 },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const isNightHero = computed(() => props.mode === 'night-hero')
const helpCopy = computed(() => (
  isNightHero.value
    ? 'This frames this Night only. It does not change your artist image.'
    : 'This changes how your artist image is positioned across Faneqo.'
))

const draftFit = ref('auto')
const draftX = ref(DEFAULT_ARTIST_FOCAL_X)
const draftY = ref(DEFAULT_ARTIST_FOCAL_Y)
const draftZoom = ref(DEFAULT_ARTIST_ZOOM)

watch(
  () => [props.open, props.mode, props.imageFit, props.positionX, props.positionY, props.zoom],
  () => {
    if (!props.open) return
    draftFit.value = normalizeArtistImageFitMode(props.imageFit)
    draftX.value = clampArtistFocalPercent(props.positionX)
    draftY.value = clampArtistFocalPercent(props.positionY)
    draftZoom.value = isNightHero.value ? 1 : clampArtistZoom(props.zoom)
  },
  { immediate: true },
)

function close() {
  if (props.saving) return
  emit('close')
}

function save() {
  if (isNightHero.value) {
    emit('save', {
      positionX: clampArtistFocalPercent(draftX.value),
      positionY: clampArtistFocalPercent(draftY.value),
    })
    return
  }
  emit('save', {
    imageFit: draftFit.value,
    positionX: clampArtistFocalPercent(draftX.value),
    positionY: clampArtistFocalPercent(draftY.value),
    zoom: clampArtistZoom(draftZoom.value),
  })
}
</script>

<style scoped>
.aip {
  position: fixed;
  inset: 0;
  z-index: 90;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.aip__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.64);
}
.aip__sheet {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #050506;
}
.aip__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0.35rem 1rem;
  padding-top: calc(0.35rem + env(safe-area-inset-top, 0px));
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.aip__head h2 {
  margin: 0;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
.aip__x,
.aip__cancel {
  min-height: 44px;
  min-width: 44px;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.62);
  font: inherit;
  cursor: pointer;
}
.aip__body {
  flex: 1;
  overflow: auto;
  padding: 1.1rem 1.25rem 1rem;
  overscroll-behavior: contain;
}
.aip__help {
  margin: 0 0 1.1rem;
  color: rgba(245, 245, 246, 0.55);
  font-size: 0.92rem;
  line-height: 1.45;
}
.aip__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  padding: 0.7rem 1.25rem calc(0.9rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}
.aip__save {
  min-height: 44px;
  padding: 0 1.15rem;
  border: 0;
  border-radius: 999px;
  background: #f5f5f6;
  color: #111;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.aip__save:disabled,
.aip__cancel:disabled {
  opacity: 0.5;
  cursor: wait;
}
.aip__error {
  flex: 1 1 100%;
  margin: 0;
  color: #ffb4b4;
  font-size: 0.88rem;
}
.aip__x:focus-visible,
.aip__save:focus-visible,
.aip__cancel:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 768px) {
  .aip__sheet {
    left: auto;
    width: min(28rem, 100vw);
    border-left: 1px solid rgba(255, 255, 255, 0.07);
  }
}
</style>
