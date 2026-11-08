<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="sms"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sms-title"
    >
      <button type="button" class="sms__backdrop" aria-label="Close" @click="close" />
      <div ref="sheetRef" class="sms__sheet" tabindex="-1">
        <header class="sms__head">
          <div class="sms__head-copy">
            <p class="sms__kicker">Show Mode</p>
            <h2 id="sms-title">Set up tonight</h2>
            <p class="sms__lede">Prepare the Night before fans arrive.</p>
          </div>
          <button type="button" class="sms__x" aria-label="Close" @click="close">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <form class="sms__body" @submit.prevent="submit">
          <section class="sms__block">
            <h3>Where</h3>
            <div class="sms__pair">
              <label class="sms__field">
                <span>Venue</span>
                <input v-model="form.venue" type="text" autocomplete="off" placeholder="The Basement East">
              </label>
              <label class="sms__field">
                <span>City</span>
                <input v-model="form.city" type="text" autocomplete="off" placeholder="Nashville">
              </label>
            </div>
          </section>

          <section class="sms__block">
            <h3>When</h3>
            <div class="sms__pair">
              <label class="sms__field">
                <span>Starts</span>
                <input v-model="form.startsLocal" type="datetime-local">
                <em v-if="startsHint" class="sms__when">{{ startsHint }}</em>
              </label>
              <label class="sms__field">
                <span>Ends</span>
                <input v-model="form.endsLocal" type="datetime-local">
                <em v-if="endsHint" class="sms__when">{{ endsHint }}</em>
              </label>
            </div>
          </section>

          <section class="sms__block">
            <h3>Night details</h3>
            <label class="sms__field">
              <span>Show title</span>
              <input v-model="form.title" type="text" autocomplete="off" placeholder="Album release">
            </label>

            <div class="sms__cover">
              <span>Night photo</span>
              <p class="sms__cover-help">A photo from tonight.</p>
              <input
                ref="coverInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sms__file"
                @change="onCoverPicked"
              >
              <div v-if="coverItem" class="sms__preview">
                <img :src="coverPreviewUrl" alt="Night photo preview">
                <div class="sms__cover-actions">
                  <button type="button" class="sms__ghost" :disabled="coverQueue.busy" @click="coverInput?.click()">
                    Change photo
                  </button>
                  <button type="button" class="sms__ghost" @click="resetCover">Remove</button>
                </div>
                <p v-if="coverQueue.busy" class="sms__status">Uploading…</p>
                <p v-else-if="coverItem.state === 'error'" class="sms__error">{{ coverError || 'Could not upload that photo.' }}</p>
              </div>
              <button
                v-else
                type="button"
                class="sms__add"
                @click="coverInput?.click()"
              >
                Add a photo
              </button>
              <p v-if="coverError && !coverItem" class="sms__error" role="alert">{{ coverError }}</p>
            </div>
          </section>

          <p v-if="formError" class="sms__error" role="alert">{{ formError }}</p>

          <div class="sms__cta">
            <button
              type="submit"
              class="sms__start"
              :disabled="busy || coverQueue.busy"
            >
              <span v-if="busy" class="sms__spin" />
              <span v-else>Start Show Mode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
import { useFocusTrap } from '~/composables/useFocusTrap'
import { useMediaUploadQueue } from '~/composables/useMediaUploadQueue'
import { humanizeFaneqoUploadError } from '~/utils/media/faneqoMedia'
import {
  defaultSetupTimes,
  formatSetupClockLabel,
  getBrowserTimezone,
  timingPayloadFromLocal,
} from '~/utils/show-mode/showModeTiming'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const LOCK_ID = 'show-mode-setup'

const props = defineProps({
  open: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'start'])

const sheetRef = ref(null)
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap(sheetRef, {
  onEscape: close,
})

const coverQueue = useMediaUploadQueue({ maxItems: 1 })
const coverInput = ref(null)
const coverError = ref('')
const formError = ref('')
const coverItem = computed(() => coverQueue.items[0] || null)
const coverPreviewUrl = computed(() => coverItem.value?.previewUrl || coverItem.value?.url || '')

const form = reactive({
  venue: '',
  city: '',
  title: '',
  startsLocal: '',
  endsLocal: '',
})

const startsHint = computed(() => formatSetupClockLabel(form.startsLocal))
const endsHint = computed(() => formatSetupClockLabel(form.endsLocal))

function resetForm() {
  const times = defaultSetupTimes()
  form.venue = ''
  form.city = ''
  form.title = ''
  form.startsLocal = times.startsLocal
  form.endsLocal = times.endsLocal
  resetCover()
  formError.value = ''
}

function resetCover() {
  coverQueue.clear()
  coverError.value = ''
  if (coverInput.value) coverInput.value.value = ''
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      resetForm()
      lockOverlayScroll(LOCK_ID)
      await nextTick()
      activateTrap()
      return
    }
    deactivateTrap()
    unlockOverlayScroll(LOCK_ID)
  },
  { immediate: true },
)

onUnmounted(() => {
  deactivateTrap()
  unlockOverlayScroll(LOCK_ID)
})

function close() {
  emit('close')
}

function onCoverPicked(event) {
  const files = event.target.files
  coverError.value = ''
  if (!files?.length) return
  coverQueue.clear()
  const added = coverQueue.addFiles(files)
  if (!added.length) {
    coverError.value = 'Choose a JPEG, PNG, or WebP up to 8 MB.'
  }
  event.target.value = ''
}

function submit() {
  formError.value = ''
  coverError.value = ''

  if (coverQueue.busy) {
    coverError.value = 'Wait for the photo to finish uploading.'
    return
  }
  if (coverItem.value && coverItem.value.state !== 'ready') {
    coverError.value = coverItem.value.error || humanizeFaneqoUploadError(coverItem.value) || 'Could not upload that photo.'
    return
  }

  const timing = timingPayloadFromLocal(form.startsLocal, form.endsLocal)
  if (timing.error) {
    formError.value = timing.error
    return
  }

  const payload = {
    title: form.title.trim(),
    venue: form.venue.trim(),
    city: form.city.trim(),
    timezone: getBrowserTimezone(),
    performanceStartsAt: timing.performanceStartsAt,
    performanceEndsAt: timing.performanceEndsAt,
  }
  if (coverItem.value?.mediaId) payload.coverMediaId = coverItem.value.mediaId
  emit('start', payload)
}
</script>

<style scoped>
.sms {
  position: fixed;
  inset: 0;
  z-index: 80;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.sms__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.72);
}

.sms__sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: min(100dvh, 100svh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0d0f13;
  border-radius: 1.1rem 1.1rem 0 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 0;
}

.sms__sheet:focus {
  outline: none;
}

.sms__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 1rem 1.15rem 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.sms__kicker {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}

.sms__head h2 {
  margin: 0.2rem 0 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.sms__lede {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: rgba(245, 245, 246, 0.5);
}

.sms__x,
.sms__ghost {
  min-height: 44px;
  min-width: 44px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.62);
  font: inherit;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.sms__ghost {
  font-size: 0.9375rem;
  min-width: 0;
}

.sms__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 1rem 1.15rem calc(1rem + env(safe-area-inset-bottom, 0px));
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.sms__body::-webkit-scrollbar {
  width: 8px;
}

.sms__body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 999px;
}

.sms__block h3 {
  margin: 0 0 0.7rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}

.sms__block + .sms__block {
  margin-top: 1.15rem;
}

.sms__pair {
  display: grid;
  gap: 0.7rem;
}

.sms__field {
  display: block;
  min-width: 0;
}

.sms__field span,
.sms__cover > span {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  color: rgba(245, 245, 246, 0.62);
}

.sms__field input {
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.045);
  color: #f5f5f6;
  font: inherit;
  font-size: 16px;
}

.sms__field input:focus {
  outline: 2px solid rgba(57, 213, 255, 0.55);
  outline-offset: 1px;
}

.sms__when {
  display: block;
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  font-style: normal;
  color: rgba(245, 245, 246, 0.4);
}

.sms__file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.sms__cover {
  position: relative;
  margin-top: 0.9rem;
}

.sms__cover-help {
  margin: -0.15rem 0 0.65rem;
  font-size: 0.875rem;
  color: rgba(245, 245, 246, 0.4);
}

.sms__add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 88px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: #f5f5f6;
  font: inherit;
  font-size: 0.9375rem;
  cursor: pointer;
}

.sms__preview {
  display: grid;
  gap: 10px;
}

.sms__preview img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  background: #111318;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.sms__cover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.sms__status {
  margin: 0;
  font-size: 0.8125rem;
  color: rgba(245, 245, 246, 0.4);
}

.sms__error {
  margin: 0.75rem 0 0;
  color: #f8a4a4;
  font-size: 0.875rem;
}

.sms__cta {
  margin-top: 1.4rem;
}

.sms__start {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 12px;
  background: #f3f3f4;
  color: #08090a;
  font: inherit;
  font-size: 1rem;
  font-weight: 650;
  cursor: pointer;
}

.sms__start:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.sms__start:focus-visible,
.sms__x:focus-visible,
.sms__ghost:focus-visible,
.sms__add:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.7);
  outline-offset: 2px;
}

.sms__spin {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(8, 9, 10, 0.25);
  border-top-color: #08090a;
  border-radius: 50%;
  animation: sms-spin 0.8s linear infinite;
}

@keyframes sms-spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 768px) {
  .sms__sheet {
    left: 50%;
    right: auto;
    bottom: auto;
    top: 50%;
    width: min(44rem, calc(100vw - 2rem));
    max-height: min(100dvh - 2.5rem, 54rem);
    transform: translate(-50%, -50%);
    border-radius: 1.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .sms__pair {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .sms__preview {
    grid-template-columns: 220px 1fr;
    align-items: end;
  }

  .sms__preview img {
    width: 220px;
    height: 148px;
    max-height: none;
  }

  .sms__cover-actions,
  .sms__status,
  .sms__preview .sms__error {
    grid-column: 2;
  }

  .sms__cta {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.15rem;
  }

  .sms__start {
    width: auto;
    min-width: 14rem;
    padding: 0 1.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sms__spin { animation: none; }
}
</style>
