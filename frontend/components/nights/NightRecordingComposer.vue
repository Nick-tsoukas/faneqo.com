<template>
  <div class="nrc" role="dialog" aria-modal="true" :aria-labelledby="titleId">
    <button type="button" class="nrc__backdrop" aria-label="Close" @click="requestClose" />
    <div class="nrc__sheet">
      <header class="nrc__head">
        <button type="button" class="nrc__nav" @click="requestClose">
          <span class="nrc__back" aria-hidden="true">←</span>
          <span class="nrc__back-label">Back</span>
        </button>
        <h2 :id="titleId">{{ editing ? 'Edit recording' : 'Add recording' }}</h2>
        <button type="button" class="nrc__nav nrc__nav--end" @click="requestClose">
          <span class="nrc__done">Done</span>
          <span class="nrc__close">Close</span>
        </button>
      </header>

      <form class="nrc__form" @submit.prevent="save">
        <div class="nrc__scroll">
          <section class="nrc__block">
            <p class="nrc__label" id="nrc-source">Source</p>
            <div class="nrc__sources" role="radiogroup" aria-labelledby="nrc-source">
              <button
                v-for="opt in sources"
                :key="opt.id"
                type="button"
                role="radio"
                :aria-checked="choice === opt.id"
                :class="{ 'is-on': choice === opt.id }"
                :disabled="editing && choice !== opt.id"
                @click="setChoice(opt.id)"
              >
                {{ opt.label }}
              </button>
            </div>
          </section>

          <section v-if="choice === 'youtube'" class="nrc__block">
            <label class="nrc__label" for="nrc-youtube">YouTube link</label>
            <input
              id="nrc-youtube"
              v-model="providerUrl"
              class="nrc__input"
              type="url"
              inputmode="url"
              autocomplete="off"
              placeholder="https://youtube.com/watch?v=..."
              :aria-invalid="!!fieldError"
              :aria-describedby="fieldError ? 'nrc-field-error' : undefined"
            >
            <p v-if="normalizedHint" class="nrc__help">{{ normalizedHint }}</p>
          </section>

          <section v-else-if="choice === 'spotify'" class="nrc__block">
            <label class="nrc__label" for="nrc-spotify">Spotify link</label>
            <p class="nrc__help">A track, album, or playlist you want associated with this Night — not a claim that it was recorded here.</p>
            <input
              id="nrc-spotify"
              v-model="providerUrl"
              class="nrc__input"
              type="url"
              inputmode="url"
              autocomplete="off"
              placeholder="https://open.spotify.com/track/..."
              :aria-invalid="!!fieldError"
              :aria-describedby="fieldError ? 'nrc-field-error' : undefined"
            >
            <p v-if="normalizedHint" class="nrc__help">{{ normalizedHint }}</p>
          </section>

          <section v-else-if="isUpload" class="nrc__block">
            <p class="nrc__label">{{ choice === 'upload-video' ? 'Video file' : 'Audio file' }}</p>
            <p class="nrc__help">
              {{ choice === 'upload-video'
                ? 'MP4 only, up to 50 MB. No conversion yet — use YouTube for other video.'
                : 'MP3, M4A, WAV, AAC, or OGG. Up to 50 MB.' }}
            </p>
            <input
              ref="fileInput"
              class="nrc__file"
              type="file"
              :accept="choice === 'upload-video' ? videoAccept : audioAccept"
              :aria-label="choice === 'upload-video' ? 'Choose an MP4 video' : 'Choose an audio file'"
              @change="onFile"
            >
            <button
              v-if="!fileLabel"
              type="button"
              class="nrc__drop"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              {{ uploading ? 'Uploading…' : (choice === 'upload-video' ? 'Choose MP4' : 'Choose audio') }}
            </button>
            <div v-else class="nrc__file-row">
              <p class="nrc__file-name">{{ fileLabel }}</p>
              <p v-if="uploading" class="nrc__help">Uploading… {{ uploadProgress }}%</p>
              <p v-else-if="uploadedMediaId" class="nrc__help">Ready to add.</p>
              <div class="nrc__file-actions">
                <button type="button" class="nrc__ghost" :disabled="uploading" @click="fileInput?.click()">Replace</button>
                <button type="button" class="nrc__ghost" :disabled="uploading" @click="clearFile">Remove</button>
              </div>
            </div>
          </section>

          <section v-if="choice" class="nrc__block">
            <label class="nrc__label" for="nrc-title">Title</label>
            <input
              id="nrc-title"
              v-model="title"
              class="nrc__input"
              type="text"
              maxlength="120"
              autocomplete="off"
              :placeholder="choice === 'spotify' ? 'Optional' : 'Optional'"
            >
          </section>

          <section v-if="choice" class="nrc__block">
            <label class="nrc__label" for="nrc-caption">Caption</label>
            <textarea
              id="nrc-caption"
              v-model="caption"
              class="nrc__grow"
              rows="3"
              maxlength="1200"
            />
          </section>

          <section v-if="choice" class="nrc__block">
            <p class="nrc__label" id="nrc-vis">Who can play this</p>
            <div class="nrc__choices" role="radiogroup" aria-labelledby="nrc-vis">
              <button
                v-for="opt in visibilities"
                :key="opt.id"
                type="button"
                role="radio"
                :aria-checked="visibility === opt.id"
                :class="{ 'is-on': visibility === opt.id }"
                @click="visibility = opt.id"
              >
                <span>{{ opt.label }}</span>
                <small>{{ opt.hint }}</small>
              </button>
            </div>
            <p v-if="gatedUploadBlocked" class="nrc__warn" role="status">{{ gatedCopy }}</p>
          </section>

          <p v-if="fieldError" id="nrc-field-error" class="nrc__error" role="alert">{{ fieldError }}</p>
          <p v-if="error" class="nrc__error" role="alert">{{ error }}</p>
        </div>

        <div class="nrc__save-bar">
          <button type="submit" class="nrc__save" :disabled="busy || !canSubmit">
            {{ saveLabel }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  NIGHT_RECORDING_AUDIO_ACCEPT,
  NIGHT_RECORDING_SOURCES,
  NIGHT_RECORDING_VIDEO_ACCEPT,
  NIGHT_RECORDING_VISIBILITIES,
  canPublishGatedUpload,
  createRecordingIdempotencyKey,
  gatedUploadPublishCopy,
  humanizeRecordingError,
  parseSpotifyInput,
  parseYoutubeInput,
  recordingSourceChoice,
  sourceChoiceMeta,
  validateRecordingFile,
} from '~/utils/nights/nightRecordings'

const props = defineProps({
  recapId: { type: [Number, String], default: null },
  recording: { type: Object, default: null },
  localOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'saved'])
const { createForNight, updateRecording, uploadRecordingFile } = useNightRecordings()

const titleId = 'nrc-title-head'
const sources = NIGHT_RECORDING_SOURCES
const visibilities = NIGHT_RECORDING_VISIBILITIES
const audioAccept = NIGHT_RECORDING_AUDIO_ACCEPT
const videoAccept = NIGHT_RECORDING_VIDEO_ACCEPT
const fileInput = ref(null)
const choice = ref(props.recording ? recordingSourceChoice(props.recording.kind, props.recording.source) : '')
const providerUrl = ref(props.recording?.provider?.url || '')
const title = ref(props.recording?.title || '')
const caption = ref(props.recording?.caption || '')
const visibility = ref(props.recording?.visibility || 'public')
const uploadedMediaId = ref(props.recording?.media?.id || null)
const fileLabel = ref(props.recording?.media?.url ? 'Current file' : '')
const uploadProgress = ref(0)
const uploading = ref(false)
const saving = ref(false)
const error = ref('')
const fieldError = ref('')
const idempotencyKey = createRecordingIdempotencyKey()

const editing = computed(() => Number(props.recording?.id) > 0)
const isUpload = computed(() => choice.value === 'upload-audio' || choice.value === 'upload-video')
const meta = computed(() => sourceChoiceMeta(choice.value))
const gatedUploadBlocked = computed(() =>
  isUpload.value && !canPublishGatedUpload({
    source: 'upload',
    visibility: visibility.value,
    status: 'published',
  }),
)
const gatedCopy = gatedUploadPublishCopy()
const parsedProvider = computed(() => {
  if (choice.value === 'youtube') return parseYoutubeInput(providerUrl.value)
  if (choice.value === 'spotify') return parseSpotifyInput(providerUrl.value)
  return null
})
const normalizedHint = computed(() => {
  const parsed = parsedProvider.value
  if (!parsed || parsed.error || !parsed.providerUrl) return ''
  if (parsed.providerUrl === String(providerUrl.value || '').trim()) return ''
  return `We’ll save ${parsed.providerUrl}`
})
const busy = computed(() => saving.value || uploading.value)
const canSubmit = computed(() => {
  if (!meta.value) return false
  if (isUpload.value) return !!uploadedMediaId.value
  return !parsedProvider.value?.error && !!providerUrl.value.trim()
})
const saveLabel = computed(() => {
  if (saving.value) return editing.value ? 'Saving…' : 'Adding…'
  if (gatedUploadBlocked.value) return 'Save draft'
  return editing.value ? 'Save recording' : 'Add to Night'
})

function setChoice(id) {
  if (editing.value && choice.value && choice.value !== id) return
  choice.value = id
  fieldError.value = ''
  error.value = ''
  if (!editing.value) {
    uploadedMediaId.value = null
    fileLabel.value = ''
    uploadProgress.value = 0
  }
}

function requestClose() {
  if (busy.value) return
  emit('close')
}

function onKey(event) {
  if (event.key === 'Escape') requestClose()
}

function clearFile() {
  uploadedMediaId.value = null
  fileLabel.value = ''
  uploadProgress.value = 0
  if (fileInput.value) fileInput.value.value = ''
}

async function onFile(event) {
  const file = event.target.files?.[0]
  fieldError.value = ''
  error.value = ''
  if (!file || !meta.value) return
  const check = validateRecordingFile(file, meta.value.kind)
  if (check.error) {
    fieldError.value = check.message
    return
  }
  fileLabel.value = file.name
  if (props.localOnly) {
    uploadedMediaId.value = Date.now()
    return
  }
  uploading.value = true
  uploadProgress.value = 0
  try {
    const media = await uploadRecordingFile(file, {
      onProgress: (n) => { uploadProgress.value = n },
    })
    uploadedMediaId.value = media.id
    fileLabel.value = media.name || file.name
  } catch (err) {
    uploadedMediaId.value = null
    fieldError.value = humanizeRecordingError(err)
  } finally {
    uploading.value = false
  }
}

function localRecording() {
  const parsed = parsedProvider.value
  return {
    id: props.recording?.id || Date.now(),
    title: title.value.trim() || null,
    caption: caption.value.trim(),
    kind: meta.value.kind,
    source: meta.value.source,
    visibility: visibility.value,
    status: gatedUploadBlocked.value ? 'draft' : 'published',
    sortOrder: props.recording?.sortOrder ?? 0,
    durationSeconds: props.recording?.durationSeconds ?? null,
    provider: parsed && !parsed.error
      ? {
        type: parsed.providerType,
        resourceType: parsed.providerResourceType,
        resourceId: parsed.providerResourceId,
        url: parsed.providerUrl,
      }
      : null,
    media: uploadedMediaId.value
      ? { id: uploadedMediaId.value, url: props.recording?.media?.url || '', mime: meta.value.kind === 'video' ? 'video/mp4' : 'audio/mpeg' }
      : null,
    poster: null,
  }
}

async function save() {
  error.value = ''
  fieldError.value = ''
  if (!meta.value) {
    fieldError.value = 'Choose a source.'
    return
  }
  if (choice.value === 'youtube' || choice.value === 'spotify') {
    const parsed = parsedProvider.value
    if (parsed?.error) {
      fieldError.value = parsed.message
      return
    }
  }
  if (isUpload.value && !uploadedMediaId.value) {
    fieldError.value = meta.value.kind === 'video' ? 'Choose an MP4 video.' : 'Choose an audio file.'
    return
  }

  const status = gatedUploadBlocked.value ? 'draft' : 'published'
  if (props.localOnly) {
    emit('saved', localRecording())
    return
  }

  saving.value = true
  try {
    const body = {
      title: title.value.trim(),
      caption: caption.value.trim(),
      kind: meta.value.kind,
      source: meta.value.source,
      visibility: visibility.value,
      status,
    }
    if (isUpload.value) body.uploadedMediaId = uploadedMediaId.value
    else body.providerUrl = parsedProvider.value.providerUrl

    const row = editing.value
      ? await updateRecording(props.recording.id, body)
      : await createForNight(props.recapId, {
        ...body,
        createIdempotencyKey: idempotencyKey,
      })
    emit('saved', row)
  } catch (err) {
    error.value = humanizeRecordingError(err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.nrc {
  position: fixed;
  inset: 0;
  z-index: 40;
}
.nrc__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.62);
}
.nrc__sheet {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #050506;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.nrc__head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 56px;
  padding: 0.35rem 0.7rem;
  padding-top: calc(0.35rem + env(safe-area-inset-top, 0px));
  border-bottom: 1px solid rgba(255, 255, 246, 0.07);
}
.nrc__head h2 {
  margin: 0;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.nrc__nav {
  min-height: 44px;
  padding: 0 0.4rem;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.72);
  font: inherit;
  cursor: pointer;
}
.nrc__nav--end { justify-self: end; }
.nrc__back-label, .nrc__close { display: none; }
.nrc__form {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.nrc__scroll {
  flex: 1;
  overflow: auto;
  padding: 1.15rem 1.25rem 1rem;
}
.nrc__block { margin: 0 0 1.5rem; }
.nrc__label {
  display: block;
  margin: 0;
  color: rgba(245, 245, 246, 0.78);
  font-size: 0.8125rem;
  font-weight: 600;
}
.nrc__help {
  margin: 0.35rem 0 0;
  color: rgba(245, 245, 246, 0.42);
  font-size: 0.88rem;
  line-height: 1.45;
}
.nrc__sources,
.nrc__choices {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.65rem;
}
.nrc__sources {
  grid-template-columns: 1fr 1fr;
}
.nrc__sources button,
.nrc__choices button,
.nrc__input,
.nrc__grow,
.nrc__drop {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 14px;
  background: #0f1115;
  color: #f5f5f6;
  font: inherit;
}
.nrc__sources button,
.nrc__choices button {
  min-height: 48px;
  padding: 0.7rem 0.85rem;
  text-align: left;
  cursor: pointer;
}
.nrc__choices button {
  display: grid;
  gap: 0.15rem;
}
.nrc__choices small {
  color: rgba(245, 245, 246, 0.42);
  font-size: 0.8rem;
}
.nrc__sources .is-on,
.nrc__choices .is-on {
  background: #f3f3f4;
  color: #08090a;
  border-color: #f3f3f4;
}
.nrc__sources .is-on,
.nrc__choices .is-on small { color: rgba(8, 9, 10, 0.58); }
.nrc__sources button:disabled { opacity: 0.45; cursor: not-allowed; }
.nrc__input {
  height: 52px;
  margin-top: 0.45rem;
  padding: 0 1rem;
  font-size: 1rem;
}
.nrc__grow {
  min-height: 96px;
  margin-top: 0.45rem;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
}
.nrc__input:focus,
.nrc__grow:focus {
  border-color: rgba(255, 255, 255, 0.18);
  outline: none;
}
.nrc__file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.nrc__drop {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 7rem;
  margin-top: 0.65rem;
  cursor: pointer;
}
.nrc__file-row { margin-top: 0.65rem; }
.nrc__file-name {
  margin: 0;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.nrc__file-actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 0.45rem;
}
.nrc__ghost {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.78);
  font: inherit;
  cursor: pointer;
}
.nrc__warn {
  margin: 0.7rem 0 0;
  color: rgba(245, 245, 246, 0.72);
  font-size: 0.9rem;
  line-height: 1.45;
}
.nrc__error { margin: 0 0 1rem; color: #fca5a5; }
.nrc__save-bar {
  padding: 0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.06);
}
.nrc__save {
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
.nrc__save:disabled { opacity: 0.55; }
.nrc__nav:focus-visible,
.nrc__save:focus-visible,
.nrc__drop:focus-visible,
.nrc__ghost:focus-visible,
.nrc__sources button:focus-visible,
.nrc__choices button:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 768px) {
  .nrc__sheet {
    left: auto;
    width: min(32rem, 100vw);
    border-left: 1px solid rgba(255, 255, 255, 0.07);
  }
  .nrc__back, .nrc__done { display: none; }
  .nrc__back-label, .nrc__close { display: inline; }
}
</style>
