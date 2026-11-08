<template>
  <Teleport to="body">
    <Transition name="badge-fade" appear>
      <div
        v-if="isOpen"
        class="badge-overlay"
        @click.self="handleClose"
      >
        <div class="badge-backdrop" @click="handleClose"></div>

        <div
          ref="dialogRef"
          class="badge-card"
          role="dialog"
          aria-modal="true"
          aria-label="Your show badge"
          tabindex="-1"
          @click.stop
        >
          <div class="badge-topbar">
            <span class="badge-accent"></span>
            <button type="button" class="badge-close" aria-label="Close" @click="handleClose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="badge-scroll">
            <div class="badge-body">
              <!-- The badge itself is the hero: left column on desktop, top on mobile -->
              <div class="badge-stage">
                <div class="badge-frame" :class="{ 'badge-frame--empty': badgeState === 'failed' }">
                  <div v-if="badgeState === 'generating'" class="badge-shimmer" aria-label="Creating your badge"></div>

                  <img
                    v-else-if="badgeState === 'ready' && badgePreviewUrl"
                    :src="badgePreviewUrl"
                    alt="Your show badge"
                    class="badge-art"
                  />

                  <div v-else class="badge-broken">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path stroke-linecap="round" d="M3 15l4.5-4.5 3.5 3.5L15 10l6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div class="badge-panel">
                <header class="badge-header">
                  <h2 class="badge-title">{{ headline }}</h2>
                  <p class="badge-subtitle">{{ subheadline }}</p>
                </header>

                <div v-if="badgeState === 'ready' && verificationText" class="verification-pill">
                  <span class="verification-dot" :class="verificationDotClass"></span>
                  <span class="verification-label">{{ verificationText }}</span>
                </div>

                <!-- Failure -->
                <div v-if="badgeState === 'failed'" class="badge-actions">
                  <p class="failure-copy">Try again, or share the artist page instead.</p>
                  <button type="button" class="btn-primary" @click="generateBadge">Try Again</button>
                  <button type="button" class="btn-ghost" @click="handleCopyLink">{{ copyLabel }}</button>
                </div>

                <!-- Ready -->
                <div v-else-if="badgeState === 'ready'" class="badge-actions">
                  <button
                    v-if="canNativeShare"
                    type="button"
                    class="btn-primary"
                    :disabled="!badgeBlob"
                    @click="handleShare"
                  >
                    <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Share Badge
                  </button>

                  <div class="btn-row">
                    <button
                      type="button"
                      :class="canNativeShare ? 'btn-ghost' : 'btn-primary'"
                      :disabled="!badgeBlob"
                      @click="handleDownload"
                    >
                      <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </button>
                    <button type="button" class="btn-ghost" @click="handleCopyLink">
                      <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                      {{ copyLabel }}
                    </button>
                  </div>
                </div>

                <button type="button" class="btn-done" @click="handleClose">Done</button>
              </div>
            </div>

            <!-- Offscreen render target for the 1080x1080 composite -->
            <canvas ref="canvasRef" width="1080" height="1080" class="badge-canvas"></canvas>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useShareKit } from '@/composables/useShareKit'
import { useFanInteractionTracker } from '@/composables/useFanInteractionTracker'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  attendanceData: {
    type: Object,
    default: null,
  },
  bandSlug: {
    type: String,
    default: '',
  },
  previewState: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const {
  generateShowCheckInBadge,
  webShareShowCheckInBadge,
  downloadShowCheckInBadge,
  copyShowCheckInLink,
  getVerificationLabel,
} = useShareKit()

const { trackShareClick } = useFanInteractionTracker()

/**
 * A fan is standing in a crowd on venue wifi. Waiting longer than this for a
 * decorative image is worse than admitting it didn't work and offering a retry.
 */
const BADGE_TIMEOUT_MS = 4500
const TIMED_OUT = Symbol('badge-timeout')

const canvasRef = ref(null)
const badgeBlob = ref(null)
const badgePreviewUrl = ref(null)
const badgeState = ref('idle') // idle | generating | ready | failed
const copyLabel = ref('Copy Link')

// Desktop browsers without the Web Share API would render a button that does
// nothing, so Download is promoted to primary there instead.
const canNativeShare = ref(false)
onMounted(() => {
  canNativeShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
})

// Guards against a slow run resolving after a retry has already started.
let runToken = 0

const headline = computed(() => {
  if (badgeState.value === 'failed') return "We couldn't create this image."
  if (badgeState.value === 'ready') return 'Your show badge is ready.'
  return 'Making your badge…'
})

const subheadline = computed(() => {
  if (badgeState.value === 'failed') return 'Your check-in is safe. Only this optional image failed.'
  if (badgeState.value === 'ready') return 'Share that you were there.'
  return 'One moment.'
})

const verificationText = computed(() => {
  if (!props.attendanceData) return ''
  return getVerificationLabel(props.attendanceData.confidenceScore || 50)
})

const verificationDotClass = computed(() => {
  const score = props.attendanceData?.confidenceScore || 50
  if (score >= 85) return 'dot-verified'
  if (score >= 70) return 'dot-live'
  return 'dot-fan'
})

const dialogRef = ref(null)
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap(dialogRef, {
  onEscape: handleClose,
})

if (props.previewState === 'failed' || props.previewState === 'ready' || props.previewState === 'generating') {
  badgeState.value = props.previewState
}

watch(() => props.isOpen, (open) => {
  lockBodyScroll(open)

  if (open) {
    activateTrap()
    copyLabel.value = 'Copy Link'
    if (props.previewState === 'failed' || props.previewState === 'ready' || props.previewState === 'generating') {
      badgeState.value = props.previewState
      return
    }
    if (badgeState.value === 'idle' || badgeState.value === 'failed') generateBadge()
  } else {
    deactivateTrap()
  }
})

function releasePreview() {
  if (badgePreviewUrl.value) {
    URL.revokeObjectURL(badgePreviewUrl.value)
    badgePreviewUrl.value = null
  }
}

async function generateBadge() {
  if (!props.attendanceData) {
    badgeState.value = 'failed'
    return
  }

  const token = ++runToken
  badgeState.value = 'generating'
  badgeBlob.value = null
  releasePreview()

  await nextTick()

  if (!canvasRef.value) {
    if (token === runToken) badgeState.value = 'failed'
    return
  }

  try {
    // The composite itself can't be aborted, so a timeout here means we stop
    // waiting on it rather than stopping it. A late result is dropped by token.
    const result = await Promise.race([
      generateShowCheckInBadge({
        canvasEl: canvasRef.value,
        attendanceData: props.attendanceData,
      }),
      new Promise((resolve) => setTimeout(() => resolve(TIMED_OUT), BADGE_TIMEOUT_MS)),
    ])

    if (token !== runToken) return

    if (result && result !== TIMED_OUT) {
      badgeBlob.value = result
      badgePreviewUrl.value = URL.createObjectURL(result)
      badgeState.value = 'ready'
    } else {
      badgeState.value = 'failed'
    }
  } catch (err) {
    console.error('[BadgeModal] Badge generation failed:', err)
    if (token === runToken) badgeState.value = 'failed'
  }
}

/**
 * `interactionType` is a fixed backend enum, so every badge action is recorded
 * as `clicked_share` and distinguished by `metadata.shareType`. Only completed
 * actions are sent — intent and cancellation would inflate share counts.
 */
function trackBadgeAction(shareType, extra = {}) {
  const bandId = props.attendanceData?.bandId
  if (!bandId) return

  trackShareClick(bandId, shareType, {
    interactionContext: 'show_mode',
    campaignId: props.attendanceData?.campaignId || null,
    eventId: props.attendanceData?.eventId || null,
    metadata: { shareType, surface: 'checkin_badge', ...extra },
  })
}

async function handleShare() {
  if (!badgeBlob.value || !props.attendanceData) return

  const result = await webShareShowCheckInBadge({
    imageBlob: badgeBlob.value,
    attendanceData: props.attendanceData,
    bandSlug: props.bandSlug,
  })

  if (result?.ok) {
    trackBadgeAction('checkin_badge_share', { usedFile: Boolean(result.usedFile) })
  }
}

function handleDownload() {
  if (!badgeBlob.value) return

  if (downloadShowCheckInBadge(badgeBlob.value, props.bandSlug)) {
    trackBadgeAction('checkin_badge_download')
  }
}

async function handleCopyLink() {
  if (await copyShowCheckInLink(props.bandSlug)) {
    copyLabel.value = 'Copied!'
    setTimeout(() => { copyLabel.value = 'Copy Link' }, 2000)
    trackBadgeAction('checkin_badge_copy_link')
  }
}

function handleClose() {
  emit('close')
}

let previousBodyOverflow = ''

function lockBodyScroll(locked) {
  if (typeof document === 'undefined') return

  if (locked) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
}

onBeforeUnmount(() => {
  lockBodyScroll(false)
  deactivateTrap({ restore: false })
  releasePreview()
})
</script>

<style scoped>
.badge-overlay {
  position: fixed;
  inset: 0;
  height: 100vh;
  height: 100dvh;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.badge-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(8px);
}

/* Mobile is full-bleed so the badge gets the whole screen. */
.badge-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
  background: linear-gradient(165deg, #0b0711 0%, #17092b 50%, #0b0711 100%);
  overflow: hidden;
}

.badge-topbar {
  position: relative;
  flex: 0 0 auto;
  height: calc(44px + env(safe-area-inset-top, 0px));
}

.badge-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #a855f7, #ec4899, #22d3ee);
}

.badge-close {
  position: absolute;
  top: calc(10px + env(safe-area-inset-top, 0px));
  right: 10px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.badge-close:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.badge-close svg {
  width: 16px;
  height: 16px;
}

/*
 * Flex + `margin: auto` on the body centres the content when it fits and still
 * scrolls from the top when it doesn't, which `justify-content: center` would
 * clip. In practice the badge is sized to fit, so this rarely engages.
 */
.badge-scroll {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px calc(20px + env(safe-area-inset-bottom, 0px));
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.badge-scroll::-webkit-scrollbar {
  width: 6px;
}

.badge-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
}

.badge-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.badge-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: 100%;
  margin: auto 0;
}

.badge-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.badge-header {
  margin-bottom: 16px;
}

.badge-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.badge-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* Preview ------------------------------------------------------------------ */
.badge-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
}

/*
 * The frame carries all the sizing so the badge stays square under both the
 * column width and the viewport height. The subtracted value is the fixed
 * chrome around it (top bar, copy, actions, Done), so the modal fits without
 * scrolling at normal heights.
 */
.badge-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: max(200px, min(100%, 420px, calc(100dvh - 400px)));
  aspect-ratio: 1 / 1;
}

/* There's no badge to show, so don't hand the placeholder the hero's footprint. */
.badge-frame--empty {
  width: max(160px, min(100%, 260px, calc(100dvh - 400px)));
}

.badge-art,
.badge-shimmer,
.badge-broken {
  width: 100%;
  height: 100%;
  border-radius: 18px;
}

.badge-art {
  display: block;
  object-fit: contain;
  /* The badge is near-black edge to edge, so it needs a hairline to separate
     it from the modal behind it. */
  outline: 1px solid rgba(255, 255, 255, 0.12);
  outline-offset: -1px;
  box-shadow: 0 16px 50px rgba(139, 92, 246, 0.32);
}

.badge-shimmer {
  background: linear-gradient(
    110deg,
    rgba(139, 92, 246, 0.1) 0%,
    rgba(139, 92, 246, 0.22) 40%,
    rgba(236, 72, 153, 0.22) 50%,
    rgba(139, 92, 246, 0.22) 60%,
    rgba(139, 92, 246, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: badge-shimmer 1.5s ease-in-out infinite;
}

@keyframes badge-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.badge-broken {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.28);
}

.badge-broken svg {
  width: 56px;
  height: 56px;
}

.badge-canvas {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

/* Verification ------------------------------------------------------------- */
.verification-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.8rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  margin-bottom: 20px;
}

.verification-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-verified { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }
.dot-live { background: #3b82f6; box-shadow: 0 0 6px rgba(59, 130, 246, 0.5); }
.dot-fan { background: #8b5cf6; box-shadow: 0 0 6px rgba(139, 92, 246, 0.5); }

.verification-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Actions ------------------------------------------------------------------ */
.badge-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.failure-copy {
  margin: 0 auto 6px;
  max-width: 34ch;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
}

.btn-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 0.2s ease, background-color 0.2s ease;
}

.btn-primary {
  border: 1px solid rgba(196, 154, 255, 0.35);
  background: linear-gradient(90deg, #7c3aed, #db2777);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 10px 26px rgba(124, 58, 237, 0.32);
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.08);
}

.btn-ghost {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary:disabled,
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-done {
  display: block;
  width: 100%;
  margin-top: 18px;
  padding: 12px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
  cursor: pointer;
}

.btn-done:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* Motion ------------------------------------------------------------------- */
.badge-fade-enter-active,
.badge-fade-leave-active {
  transition: opacity 0.22s ease;
}

.badge-fade-enter-from,
.badge-fade-leave-to {
  opacity: 0;
}

/* Desktop: badge stage on the left, everything you can act on to the right. */
@media (min-width: 768px) {
  .badge-overlay {
    padding: 16px;
  }

  .badge-card {
    width: 100%;
    max-width: 1000px;
    height: auto;
    max-height: calc(100dvh - 32px);
    border-radius: 24px;
    border: 1px solid rgba(168, 85, 247, 0.28);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65);
  }

  .badge-topbar {
    height: 44px;
  }

  .badge-close {
    top: 10px;
  }

  .badge-scroll {
    padding: 0 36px 36px;
  }

  .badge-body {
    flex-direction: row;
    align-items: center;
    gap: 36px;
  }

  /*
   * Proportional rather than a fixed panel width: at the low end of this
   * breakpoint a fixed panel would end up wider than the badge and invert the
   * hierarchy. The badge keeps the larger share at every width.
   */
  .badge-stage {
    flex: 1 1 55%;
  }

  .badge-frame {
    width: max(240px, min(100%, 480px, calc(100dvh - 170px)));
  }

  .badge-frame--empty {
    width: max(180px, min(100%, 300px, calc(100dvh - 170px)));
  }

  .badge-panel {
    flex: 0 1 45%;
    min-width: 260px;
    max-width: 360px;
    align-items: flex-start;
    text-align: left;
  }

  .badge-title {
    font-size: 26px;
  }

  .badge-subtitle {
    font-size: 15px;
  }

  .failure-copy {
    margin-left: 0;
    margin-right: 0;
    max-width: none;
  }

  .btn-done {
    text-align: left;
    padding-left: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge-fade-enter-active,
  .badge-fade-leave-active {
    transition: none;
  }

  .badge-shimmer {
    animation: none;
  }
}
</style>
