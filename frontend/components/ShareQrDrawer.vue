<template>
  <Teleport to="body">
    <Transition name="asq">
      <div
        v-if="isOpen"
        ref="dialogRef"
        class="asq"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asq-title"
        tabindex="-1"
      >
        <button
          type="button"
          class="asq__backdrop"
          aria-label="Close"
          @click="closeModal"
        />

        <div class="asq__sheet">
          <div class="asq__head">
            <h2 id="asq-title">Share artist</h2>
            <FaneqoIconButton
              name="close"
              size="lg"
              aria-label="Close"
              @click="closeModal"
            />
          </div>

          <div class="asq__scroll">
            <div class="asq__identity">
              <span class="asq__avatar" aria-hidden="true">
                <img
                  v-if="showImage"
                  :src="profileImage"
                  alt=""
                  @error="handleImageError"
                >
                <span v-else class="asq__mark">{{ bandInitials }}</span>
              </span>
              <p class="asq__name">{{ bandName }}</p>
              <p v-if="bandSlug" class="asq__handle">@{{ bandSlug }}</p>
            </div>

            <div class="asq__qr-block">
              <p class="asq__hint">Scan to open the artist page</p>
              <div
                class="asq__qr"
                role="img"
                :aria-label="qrAccessibleLabel"
              >
                <span class="asq__qr-label">{{ qrAccessibleLabel }}</span>
                <QrcodeVue
                  :value="qrGatewayUrl"
                  :size="qrSize"
                  :level="qrLevel"
                  :margin="qrMargin"
                  render-as="svg"
                  foreground="#000000"
                  background="#F7F7F8"
                />
                <div
                  v-if="showImage"
                  class="asq__qr-logo"
                  :style="qrLogoStyle"
                  aria-hidden="true"
                >
                  <img :src="profileImage" alt="">
                </div>
              </div>
            </div>

            <div v-if="displayUrl" class="asq__url">
              <p class="asq__url-text">{{ displayUrl }}</p>
              <button
                type="button"
                class="asq__url-copy"
                :disabled="!canShare"
                :aria-label="copied ? 'Link copied' : 'Copy link'"
                @click="handleCopyLink"
              >
                <component :is="copyIcon" :size="16" :stroke-width="1.75" aria-hidden="true" />
                <span>{{ copied ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
          </div>

          <div class="asq__foot">
            <button
              type="button"
              class="asq__share"
              :disabled="!canShare || sharing"
              :aria-label="sharing ? 'Sharing artist page' : 'Share link'"
              @click="handleShare"
            >
              <component :is="shareIcon" :size="18" :stroke-width="1.75" aria-hidden="true" />
              <span>{{ sharing ? 'Opening…' : 'Share link' }}</span>
            </button>
            <p v-if="status" class="asq__status" role="status">{{ status }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import { useFocusTrap } from '~/composables/useFocusTrap'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { getBandShareQrUrl } from '~/utils/qr'
import {
  ARTIST_SHARE_QR_LEVEL,
  ARTIST_SHARE_QR_MARGIN,
  artistSharePath,
  artistShareQrLogoSize,
  artistShareQrSize,
} from '~/utils/share/artistShareQr'
import { faneqoShareUrl, shareFaneqoUrl } from '~/utils/share/faneqoShare'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const LOCK_ID = 'artist-share-qr'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  bandName: {
    type: String,
    required: true,
  },
  bandSlug: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['close'])

const dialogRef = ref(null)
const copied = ref(false)
const sharing = ref(false)
const status = ref('')
const imageError = ref(false)
const viewport = ref({ width: 390, height: 844 })
let copyTimer = 0

const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap(dialogRef, {
  onEscape: closeModal,
})

const shareIcon = faneqoIcons.share
const copyIcon = faneqoIcons.copy
const qrLevel = ARTIST_SHARE_QR_LEVEL
const qrMargin = ARTIST_SHARE_QR_MARGIN

const canonicalPath = computed(() => artistSharePath(props.bandSlug))
const shareUrl = computed(() => (
  canonicalPath.value
    ? faneqoShareUrl({ canonicalPath: canonicalPath.value })
    : ''
))
const displayUrl = computed(() => shareUrl.value.replace(/^https?:\/\//, ''))
const qrGatewayUrl = computed(() => (
  canonicalPath.value ? getBandShareQrUrl(props.bandSlug) : ''
))
const qrSize = computed(() => artistShareQrSize(viewport.value))
const qrLogoPx = computed(() => artistShareQrLogoSize(qrSize.value))
const qrLogoStyle = computed(() => ({
  width: `${qrLogoPx.value}px`,
  height: `${qrLogoPx.value}px`,
}))
const canShare = computed(() => Boolean(shareUrl.value && qrGatewayUrl.value))
const showImage = computed(() => Boolean(props.profileImage) && !imageError.value)
const bandInitials = computed(() => {
  if (!props.bandName) return 'A'
  const letter = String(props.bandName).trim().match(/[A-Za-z0-9]/)
  return letter ? letter[0].toUpperCase() : 'A'
})
const qrAccessibleLabel = computed(() => (
  props.bandName
    ? `QR code for the ${props.bandName} artist page`
    : 'QR code for the artist page'
))

function measureViewport() {
  if (typeof window === 'undefined') return
  viewport.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function setShareModalClass(open) {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('share-modal-open', open)
}

function closeModal() {
  emit('close')
}

function handleImageError() {
  imageError.value = true
}

function setCopied() {
  copied.value = true
  status.value = 'Link copied.'
  if (copyTimer) window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copied.value = false
  }, 2000)
}

async function handleShare() {
  if (!canShare.value || sharing.value) return
  sharing.value = true
  status.value = ''
  try {
    const result = await shareFaneqoUrl({
      title: props.bandName || 'Faneqo',
      text: props.bandName ? `Share ${props.bandName}` : '',
      canonicalPath: canonicalPath.value,
    })
    if (result.method === 'share') {
      status.value = 'Share sheet opened.'
    } else {
      setCopied()
    }
  } catch (err) {
    if (err?.name !== 'AbortError') {
      status.value = err?.message || 'Could not share this link.'
    }
  } finally {
    sharing.value = false
  }
}

async function handleCopyLink() {
  if (!canShare.value) return
  status.value = ''
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl.value)
      setCopied()
      return
    }
    const result = await shareFaneqoUrl({
      title: props.bandName || 'Faneqo',
      canonicalPath: canonicalPath.value,
    })
    if (result.method === 'copy') setCopied()
  } catch (err) {
    if (err?.name !== 'AbortError') {
      status.value = 'Could not copy this link.'
    }
  }
}

watch(() => props.profileImage, () => {
  imageError.value = false
})

watch(() => props.isOpen, async (isOpen) => {
  setShareModalClass(isOpen)
  if (isOpen) {
    measureViewport()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', measureViewport)
    }
    lockOverlayScroll(LOCK_ID)
    copied.value = false
    sharing.value = false
    status.value = ''
    await nextTick()
    activateTrap()
    return
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', measureViewport)
  }
  deactivateTrap()
  unlockOverlayScroll(LOCK_ID)
}, { immediate: true })

onUnmounted(() => {
  if (copyTimer) window.clearTimeout(copyTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', measureViewport)
  }
  deactivateTrap({ restore: false })
  unlockOverlayScroll(LOCK_ID)
  setShareModalClass(false)
})
</script>

<style scoped>
.asq {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.asq:focus {
  outline: none;
}

.asq__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.72);
  cursor: pointer;
}

.asq__sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: min(92dvh, 46rem);
  overflow: hidden;
  background: #050506;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 0;
  border-radius: 1.1rem 1.1rem 0 0;
}

.asq__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0.15rem 0.55rem 0.15rem 1.15rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.asq__head h2 {
  margin: 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.asq__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 1rem 1.25rem 0.85rem;
}

.asq__identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.asq__avatar {
  display: block;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 50%;
  background: #111318;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.asq__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asq__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f5f5f6;
}

.asq__name {
  margin: 0.7rem 0 0;
  max-width: 100%;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1.15;
  text-transform: uppercase;
  color: #f5f5f6;
}

.asq__handle {
  margin: 0.28rem 0 0;
  color: rgba(245, 245, 246, 0.5);
  font-size: 0.875rem;
  font-weight: 500;
}

.asq__qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0.95rem;
}

.asq__hint {
  margin: 0 0 0.55rem;
  color: rgba(245, 245, 246, 0.4);
  font-size: 0.75rem;
  font-weight: 500;
}

.asq__qr {
  position: relative;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: #f7f7f8;
  border-radius: 1.35rem;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.asq__qr-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.asq__qr :deep(svg) {
  display: block;
  width: auto;
  height: auto;
  transform: none;
  filter: none;
}

.asq__qr-logo {
  position: absolute;
  overflow: hidden;
  border-radius: 50%;
  background: #f7f7f8;
  box-shadow: 0 0 0 3px #f7f7f8;
  pointer-events: none;
}

.asq__qr-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asq__url {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 48px;
  margin-top: 0.85rem;
}

.asq__url-text {
  margin: 0;
  min-width: 0;
  color: rgba(245, 245, 246, 0.5);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asq__url-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-width: 44px;
  min-height: 44px;
  padding: 0 0.55rem;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.86);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), color 0.14s ease;
}

.asq__url-copy:active:not(:disabled) {
  transform: scale(0.97);
}

.asq__url-copy:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.asq__foot {
  flex: 0 0 auto;
  padding: 0.55rem 1.25rem calc(1.15rem + env(safe-area-inset-bottom, 0px));
}

.asq__share {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 14px;
  background: #f3f3f4;
  color: #08090a;
  font: inherit;
  font-size: 1rem;
  font-weight: 650;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), filter 0.14s ease;
}

.asq__share:hover:not(:disabled) {
  filter: brightness(0.97);
}

.asq__share:active:not(:disabled) {
  transform: scale(0.97);
}

.asq__share:disabled {
  opacity: 0.55;
  cursor: default;
}

.asq__share:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.asq__status {
  margin: 0.55rem 0 0;
  color: rgba(245, 245, 246, 0.5);
  font-size: 0.8125rem;
  text-align: center;
}

.asq-enter-active,
.asq-leave-active {
  transition: opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.asq-enter-active .asq__sheet,
.asq-leave-active .asq__sheet,
.asq-enter-active .asq__identity,
.asq-leave-active .asq__identity,
.asq-enter-active .asq__qr,
.asq-leave-active .asq__qr {
  transition:
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.asq-enter-from,
.asq-leave-to {
  opacity: 0;
}

.asq-enter-from .asq__sheet,
.asq-leave-to .asq__sheet {
  transform: translateY(18px);
  opacity: 0;
}

.asq-enter-from .asq__identity {
  transform: translateY(6px);
  opacity: 0;
}

.asq-enter-from .asq__qr {
  transform: scale(0.98);
  opacity: 0;
}

@media (max-height: 680px) {
  .asq__scroll {
    padding-top: 0.7rem;
    padding-bottom: 0.7rem;
  }

  .asq__avatar {
    width: 52px;
    height: 52px;
  }

  .asq__name {
    margin-top: 0.45rem;
    font-size: 0.98rem;
  }

  .asq__handle {
    margin-top: 0.18rem;
  }

  .asq__qr-block {
    margin-top: 0.55rem;
  }

  .asq__hint {
    display: none;
  }

  .asq__url {
    margin-top: 0.45rem;
  }
}

@media (min-width: 768px) {
  .asq {
    align-items: center;
    padding: 1.5rem;
    padding-top: max(1.5rem, env(safe-area-inset-top, 0px));
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 0px));
  }

  .asq__sheet {
    width: min(26rem, 100%);
    max-height: min(88dvh, 42rem);
    border-radius: 1.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .asq-enter-from .asq__sheet,
  .asq-leave-to .asq__sheet {
    transform: translateY(10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .asq-enter-active,
  .asq-leave-active,
  .asq-enter-active .asq__sheet,
  .asq-leave-active .asq__sheet,
  .asq-enter-active .asq__identity,
  .asq-leave-active .asq__identity,
  .asq-enter-active .asq__qr,
  .asq-leave-active .asq__qr,
  .asq__share,
  .asq__url-copy {
    transition: none;
  }

  .asq-enter-from .asq__sheet,
  .asq-leave-to .asq__sheet,
  .asq-enter-from .asq__identity,
  .asq-enter-from .asq__qr,
  .asq__share:active:not(:disabled),
  .asq__url-copy:active:not(:disabled) {
    transform: none;
  }
}
</style>
