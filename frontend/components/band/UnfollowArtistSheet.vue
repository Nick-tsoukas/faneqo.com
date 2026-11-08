<template>
  <Teleport to="body">
    <Transition name="ufs">
      <div
        v-if="isOpen"
        ref="dialogRef"
        class="ufs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ufs-title"
        tabindex="-1"
      >
        <button
          type="button"
          class="ufs__backdrop"
          aria-label="Cancel"
          :disabled="busy"
          @click="closeSheet"
        />

        <div class="ufs__sheet">
          <div class="ufs__head">
            <p class="ufs__kicker">Following</p>
            <FaneqoIconButton
              name="close"
              size="lg"
              aria-label="Cancel"
              :disabled="busy"
              @click="closeSheet"
            />
          </div>

          <div class="ufs__scroll">
            <div class="ufs__identity">
              <span class="ufs__avatar" aria-hidden="true">
                <img
                  v-if="showImage"
                  :src="profileImage"
                  alt=""
                  @error="handleImageError"
                >
                <span v-else class="ufs__mark">{{ bandInitial }}</span>
              </span>
            </div>

            <div class="ufs__body">
              <h2 id="ufs-title" class="ufs__headline">
                Unfollow {{ displayName }}?
              </h2>
              <p class="ufs__lede">{{ lede }}</p>
              <p class="ufs__copy">{{ copy }}</p>

              <p v-if="error" class="ufs__error" role="alert">{{ error }}</p>

              <button
                type="button"
                class="ufs__submit"
                :disabled="busy"
                :aria-busy="busy ? 'true' : 'false'"
                @click="emit('confirm')"
              >
                <span v-if="busy" class="ufs__spinner" aria-hidden="true" />
                <span>{{ busy ? 'Unfollowing…' : 'Unfollow' }}</span>
              </button>
              <button
                type="button"
                class="ufs__quiet"
                :disabled="busy"
                @click="closeSheet"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import { useFocusTrap } from '~/composables/useFocusTrap'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const LOCK_ID = 'artist-unfollow'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  bandName: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  subscribed: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const dialogRef = ref(null)
const imageError = ref(false)

const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap(dialogRef, {
  onEscape: closeSheet,
})

const displayName = computed(() => String(props.bandName || '').trim() || 'this artist')
const bandInitial = computed(() => {
  const letter = displayName.value.match(/[A-Za-z0-9]/)
  return letter ? letter[0].toUpperCase() : 'A'
})
const showImage = computed(() => Boolean(props.profileImage) && !imageError.value)
const lede = computed(() => (
  props.subscribed
    ? `You’ll stop following ${displayName.value} and leave their Fan List.`
    : `You’ll stop following ${displayName.value}.`
))
const copy = computed(() => (
  props.subscribed
    ? 'You won’t receive future updates from this artist.'
    : 'You can follow again anytime.'
))

function closeSheet() {
  if (props.busy) return
  emit('close')
}

function handleImageError() {
  imageError.value = true
}

watch(() => props.profileImage, () => {
  imageError.value = false
})

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    lockOverlayScroll(LOCK_ID)
    await nextTick()
    activateTrap()
    return
  }
  deactivateTrap()
  unlockOverlayScroll(LOCK_ID)
}, { immediate: true })

onUnmounted(() => {
  deactivateTrap({ restore: false })
  unlockOverlayScroll(LOCK_ID)
})
</script>

<style scoped>
.ufs {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.ufs:focus {
  outline: none;
}

.ufs__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.72);
  cursor: pointer;
}

.ufs__backdrop:disabled {
  cursor: default;
}

.ufs__sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: min(92dvh, 32rem);
  overflow: hidden;
  background: #050506;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 0;
  border-radius: 1.1rem 1.1rem 0 0;
}

.ufs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0.1rem 0.55rem 0.1rem 1.2rem;
}

.ufs__kicker {
  margin: 0;
  color: rgba(245, 245, 246, 0.42);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ufs__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 0.35rem 1.35rem calc(1.2rem + env(safe-area-inset-bottom, 0px));
}

.ufs__identity {
  display: flex;
  justify-content: center;
}

.ufs__avatar {
  display: block;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 50%;
  background: #111318;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.ufs__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ufs__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f5f5f6;
}

.ufs__body {
  margin-top: 0.95rem;
  text-align: left;
}

.ufs__headline {
  margin: 0;
  color: #f7f7f8;
  font-size: 1.55rem;
  font-weight: 750;
  letter-spacing: -0.038em;
  line-height: 1.12;
}

.ufs__lede {
  margin: 0.7rem 0 0;
  color: #f5f5f6;
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.ufs__copy {
  margin: 0.35rem 0 0;
  color: rgba(245, 245, 246, 0.56);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.ufs__error {
  margin: 0.55rem 0 0;
  color: #fca5a5;
  font-size: 0.8125rem;
}

.ufs__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 52px;
  margin-top: 1.15rem;
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

.ufs__submit:hover:not(:disabled) {
  filter: brightness(0.97);
}

.ufs__submit:active:not(:disabled),
.ufs__quiet:active:not(:disabled) {
  transform: scale(0.98);
}

.ufs__submit:disabled,
.ufs__quiet:disabled {
  opacity: 0.55;
  cursor: default;
}

.ufs__submit:focus-visible,
.ufs__quiet:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.ufs__quiet {
  display: block;
  width: 100%;
  min-height: 44px;
  margin-top: 0.35rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.58);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 550;
  cursor: pointer;
  text-align: center;
}

.ufs__quiet:hover:not(:disabled) {
  color: #f5f5f6;
}

.ufs__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(8, 9, 10, 0.22);
  border-top-color: #08090a;
  border-radius: 50%;
  animation: ufs-spin 0.7s linear infinite;
}

@keyframes ufs-spin {
  to { transform: rotate(360deg); }
}

.ufs-enter-active,
.ufs-leave-active {
  transition: opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.ufs-enter-active .ufs__sheet,
.ufs-leave-active .ufs__sheet {
  transition:
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.ufs-enter-from,
.ufs-leave-to {
  opacity: 0;
}

.ufs-enter-from .ufs__sheet,
.ufs-leave-to .ufs__sheet {
  transform: translateY(18px);
  opacity: 0;
}

@media (min-width: 768px) {
  .ufs {
    align-items: center;
    padding: 1.5rem;
    padding-top: max(1.5rem, env(safe-area-inset-top, 0px));
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 0px));
  }

  .ufs__sheet {
    width: min(26rem, 100%);
    max-height: min(88dvh, 30rem);
    border-radius: 1.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .ufs-enter-from .ufs__sheet,
  .ufs-leave-to .ufs__sheet {
    transform: translateY(10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ufs-enter-active,
  .ufs-leave-active,
  .ufs-enter-active .ufs__sheet,
  .ufs-leave-active .ufs__sheet,
  .ufs__submit,
  .ufs__quiet {
    transition: none;
  }

  .ufs-enter-from .ufs__sheet,
  .ufs-leave-to .ufs__sheet,
  .ufs__submit:active:not(:disabled),
  .ufs__quiet:active:not(:disabled) {
    transform: none;
  }

  .ufs__spinner {
    animation: none;
  }
}
</style>
