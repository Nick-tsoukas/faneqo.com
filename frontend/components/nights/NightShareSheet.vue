<template>
  <Teleport to="body">
    <div v-if="open && shareUrl" class="ns" role="dialog" aria-modal="true" aria-labelledby="ns-title">
      <button type="button" class="ns__backdrop" aria-label="Close" @click="$emit('close')" />
      <div class="ns__sheet">
        <header class="ns__head">
          <p id="ns-title">{{ heading }}</p>
          <button type="button" class="ns__x" aria-label="Close" @click="$emit('close')">Close</button>
        </header>
        <div class="ns__preview" :data-share-format="format">
          <div v-if="safeImage" class="ns__media">
            <img class="ns__media-fill" :src="safeImage" alt="" aria-hidden="true">
            <img class="ns__media-photo" :src="safeImage" :alt="artistName || 'Night'">
          </div>
          <div class="ns__preview-copy">
            <p class="ns__artist">{{ artistName }}</p>
            <p class="ns__title">{{ showTitle }}</p>
            <p v-if="placeLine" class="ns__meta">{{ placeLine }}</p>
          </div>
        </div>
        <button type="button" class="ns__primary" :disabled="busy" @click="nativeShare">
          {{ busy ? 'Opening…' : 'Share' }}
        </button>
        <div class="ns__row">
          <button type="button" class="ns__ghost" @click="copyLink">Copy link</button>
          <button type="button" class="ns__ghost" :disabled="downloading" @click="downloadCard">
            {{ downloading ? 'Saving…' : 'Save image' }}
          </button>
        </div>
        <p v-if="note" class="ns__note">{{ note }}</p>
        <p v-if="status" class="ns__status" role="status">{{ status }}</p>
        <canvas ref="canvasRef" class="ns__canvas" width="1080" height="1080" />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useShareKit } from '~/composables/useShareKit'

const props = defineProps({
  open: { type: Boolean, default: false },
  shareUrl: { type: String, default: '' },
  artistName: { type: String, default: '' },
  showTitle: { type: String, default: '' },
  placeLine: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  heading: { type: String, default: 'Share this night' },
  note: { type: String, default: '' },
  kind: { type: String, default: 'night' },
  format: { type: String, default: 'square' },
})

defineEmits(['close'])

const { webShare, copyToClipboard, generateShareImage, downloadBlob, getShareFilename } = useShareKit()
const canvasRef = ref(null)
const status = ref('')
const busy = ref(false)
const downloading = ref(false)

const safeImage = computed(() => props.imageUrl || '')

watch(() => props.open, (open) => {
  status.value = ''
  if (!open) return
})

async function nativeShare() {
  if (!props.shareUrl || busy.value) return
  busy.value = true
  status.value = ''
  try {
    const result = await webShare({
      title: props.showTitle || props.artistName || 'Night',
      text: [props.artistName, props.placeLine].filter(Boolean).join(' · '),
      url: props.shareUrl,
    })
    if (result?.ok) status.value = 'Share sheet opened.'
  } catch (error) {
    if (error?.name !== 'AbortError') status.value = error?.message || 'Could not share this night.'
  } finally {
    busy.value = false
  }
}

async function copyLink() {
  if (!props.shareUrl) return
  const ok = await copyToClipboard(props.shareUrl)
  status.value = ok ? 'Link copied.' : 'Could not copy the link.'
}

async function downloadCard() {
  if (!canvasRef.value || downloading.value) return
  downloading.value = true
  try {
    const blob = await generateShareImage({
      canvasEl: canvasRef.value,
      bandName: props.artistName,
      bandImageUrl: safeImage.value || null,
      momentTitle: props.showTitle || 'Night',
      subtitle: props.placeLine || '',
    })
    if (!blob) throw new Error('Could not make a share image.')
    downloadBlob(blob, getShareFilename(props.artistName || props.kind, props.kind))
    status.value = 'Image saved.'
  } catch (error) {
    status.value = error?.message || 'Could not save the image.'
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.ns {
  position: fixed;
  inset: 0;
  z-index: 92;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.ns__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.64);
}
.ns__sheet {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  max-height: min(88dvh, 40rem);
  overflow: auto;
  padding: 1rem 1.25rem calc(1.3rem + env(safe-area-inset-bottom, 0px));
  border-radius: 18px 18px 0 0;
  background: #050506;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}
.ns__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.ns__head p { margin: 0; font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em; }
.ns__x {
  min-height: 44px;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.62);
  font: inherit;
  cursor: pointer;
}
.ns__preview {
  margin: 1rem 0 1.15rem;
  overflow: hidden;
  border-radius: 14px;
  background: #0a0a0c;
}
.ns__media {
  position: relative;
  height: 16.5rem;
  overflow: hidden;
  background: #050506;
}
.ns__media-fill {
  position: absolute;
  inset: -12%;
  width: 124%;
  height: 124%;
  object-fit: cover;
  filter: blur(28px) saturate(0.62) brightness(0.28);
  pointer-events: none;
}
.ns__media-photo {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: 50% 50%;
}
.ns__preview-copy { padding: 0.9rem 1rem 1rem; }
.ns__artist {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.45);
}
.ns__title { margin: 0.35rem 0 0; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.03em; }
.ns__meta { margin: 0.3rem 0 0; color: rgba(245, 245, 246, 0.5); }
.ns__primary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 14px;
  background: #f3f3f4;
  color: #08090a;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}
.ns__primary:disabled { opacity: 0.55; }
.ns__row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; margin-top: 0.7rem; }
.ns__ghost {
  min-height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: #0f1115;
  color: #f5f5f6;
  font: inherit;
  cursor: pointer;
}
.ns__note { margin: 0.8rem 0 0; color: rgba(245, 245, 246, 0.5); font-size: 0.84rem; line-height: 1.45; }
.ns__status { margin: 0.8rem 0 0; color: rgba(245, 245, 246, 0.5); }
.ns__canvas { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.ns__x:focus-visible, .ns__primary:focus-visible, .ns__ghost:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 768px) {
  .ns__sheet {
    left: auto;
    right: 0;
    top: 0;
    bottom: 0;
    width: min(28rem, 100vw);
    max-height: none;
    border-radius: 0;
    border: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.07);
  }
}
</style>
