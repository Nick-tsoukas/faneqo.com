<template>
  <div class="fan-avatar-control">
    <input
      ref="fileRef"
      id="fan-avatar-file"
      class="sr-only"
      type="file"
      :accept="accept"
      :aria-label="hitLabel"
      :disabled="busy"
      @change="onFileChange"
    />

    <button
      type="button"
      class="fan-avatar-control__hit"
      :aria-label="hitLabel"
      :aria-busy="busy ? 'true' : undefined"
      :disabled="busy"
      @click="onAvatarTap"
    >
      <FanAvatar
        :avatar-url="avatarUrl"
        :initials="initials"
        :size="size"
      />
      <span v-if="busy" class="fan-avatar-control__busy" aria-hidden="true">
        <span class="fan-avatar-control__spinner" />
      </span>
    </button>

    <p v-if="busyLabel" class="fan-avatar-control__status" role="status">{{ busyLabel }}</p>

    <Teleport to="body">
      <div
        v-if="sheetOpen"
        class="fan-avatar-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fan-avatar-sheet-title"
        @keydown="onSheetKey"
      >
        <button type="button" class="fan-avatar-sheet__backdrop" aria-label="Cancel" @click="closeSheet" />
        <div ref="sheetRef" class="fan-avatar-sheet__panel" tabindex="-1">
          <p id="fan-avatar-sheet-title" class="fan-avatar-sheet__title">Profile photo</p>
          <button type="button" class="fan-avatar-sheet__action" @click="choosePhoto">
            Change photo
          </button>
          <button type="button" class="fan-avatar-sheet__action is-danger" @click="askRemove">
            Remove photo
          </button>
          <button type="button" class="fan-avatar-sheet__action is-quiet" @click="closeSheet">
            Cancel
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="previewOpen"
        class="fan-avatar-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fan-avatar-preview-title"
        @keydown="onPreviewKey"
      >
        <button type="button" class="fan-avatar-sheet__backdrop" aria-label="Cancel" :disabled="uploading" @click="cancelPreview" />
        <div ref="previewRef" class="fan-avatar-sheet__panel" tabindex="-1">
          <p id="fan-avatar-preview-title" class="fan-avatar-sheet__title">Photo preview</p>
          <div class="fan-avatar-sheet__preview" aria-hidden="true">
            <img
              v-if="previewUrl"
              class="fan-avatar-sheet__preview-img"
              :src="previewUrl"
              alt=""
            />
          </div>
          <button
            type="button"
            class="fan-avatar-sheet__action is-primary"
            :disabled="uploading"
            :aria-busy="uploading ? 'true' : undefined"
            @click="confirmUpload"
          >
            {{ uploading ? 'Uploading…' : 'Use photo' }}
          </button>
          <button type="button" class="fan-avatar-sheet__action is-quiet" :disabled="uploading" @click="cancelPreview">
            Cancel
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="confirmOpen"
        class="fan-avatar-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fan-avatar-remove-title"
        @keydown="onConfirmKey"
      >
        <button type="button" class="fan-avatar-sheet__backdrop" aria-label="Cancel" :disabled="deleting" @click="closeConfirm" />
        <div ref="confirmRef" class="fan-avatar-sheet__panel" tabindex="-1">
          <p id="fan-avatar-remove-title" class="fan-avatar-sheet__title">Remove profile photo?</p>
          <button
            type="button"
            class="fan-avatar-sheet__action is-danger"
            :disabled="deleting"
            :aria-busy="deleting ? 'true' : undefined"
            @click="confirmRemove"
          >
            {{ deleting ? 'Removing…' : 'Remove' }}
          </button>
          <button type="button" class="fan-avatar-sheet__action is-quiet" :disabled="deleting" @click="closeConfirm">
            Cancel
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import FanAvatar from '~/components/fan/FanAvatar.vue'
import { FAN_AVATAR_ACCEPT, fanAvatarClientCheck } from '~/utils/fan/fanProfileIdentity'

const props = defineProps({
  avatarUrl: { type: String, default: null },
  initials: { type: String, default: '' },
  size: { type: Number, default: 88 },
  uploading: { type: Boolean, default: false },
  deleting: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['upload', 'remove', 'reject'])

const fileRef = ref(null)
const sheetRef = ref(null)
const previewRef = ref(null)
const confirmRef = ref(null)
const sheetOpen = ref(false)
const previewOpen = ref(false)
const confirmOpen = ref(false)
const pendingFile = ref(null)
const previewUrl = ref('')

const accept = FAN_AVATAR_ACCEPT
const hasAvatar = computed(() => Boolean(props.avatarUrl))
const busy = computed(() => props.uploading || props.deleting || props.disabled)
const busyLabel = computed(() => {
  if (props.uploading) return 'Uploading…'
  if (props.deleting) return 'Removing…'
  return ''
})
const hitLabel = computed(() => (
  hasAvatar.value ? 'Change profile photo' : 'Add profile photo'
))

function revokePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  pendingFile.value = null
}

function openPicker() {
  if (busy.value) return
  fileRef.value?.click()
}

function onAvatarTap() {
  if (busy.value) return
  if (hasAvatar.value) {
    sheetOpen.value = true
    nextTick(() => sheetRef.value?.focus?.())
    return
  }
  openPicker()
}

function closeSheet() {
  sheetOpen.value = false
}

function choosePhoto() {
  closeSheet()
  nextTick(openPicker)
}

function askRemove() {
  closeSheet()
  confirmOpen.value = true
  nextTick(() => confirmRef.value?.focus?.())
}

function closeConfirm() {
  if (props.deleting) return
  confirmOpen.value = false
}

function confirmRemove() {
  if (props.deleting) return
  emit('remove')
}

function onFileChange(event) {
  const file = event.target?.files?.[0] || null
  if (fileRef.value) fileRef.value.value = ''
  if (!file) return

  const check = fanAvatarClientCheck(file)
  if (!check.ok) {
    emit('reject', check)
    return
  }

  revokePreview()
  pendingFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  previewOpen.value = true
  nextTick(() => previewRef.value?.focus?.())
}

function cancelPreview() {
  if (props.uploading) return
  previewOpen.value = false
  revokePreview()
}

function confirmUpload() {
  if (!pendingFile.value || props.uploading) return
  emit('upload', pendingFile.value)
}

function onSheetKey(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSheet()
  }
}

function onPreviewKey(event) {
  if (event.key === 'Escape' && !props.uploading) {
    event.preventDefault()
    cancelPreview()
  }
}

function onConfirmKey(event) {
  if (event.key === 'Escape' && !props.deleting) {
    event.preventDefault()
    closeConfirm()
  }
}

watch(() => props.uploading, (now, was) => {
  if (was && !now && previewOpen.value) {
    previewOpen.value = false
    revokePreview()
  }
})

watch(() => props.deleting, (now, was) => {
  if (was && !now && confirmOpen.value) confirmOpen.value = false
})

onBeforeUnmount(revokePreview)
</script>

<style scoped>
.fan-avatar-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
}

.fan-avatar-control__hit {
  position: relative;
  display: inline-flex;
  padding: 0;
  border: 0;
  background: none;
  border-radius: 50%;
  cursor: pointer;
}

.fan-avatar-control__hit:disabled {
  cursor: default;
}

.fan-avatar-control__hit:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.fan-avatar-control__busy {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(5, 6, 8, 0.42);
}

.fan-avatar-control__spinner {
  width: 1.35rem;
  height: 1.35rem;
  border: 2px solid rgba(69, 227, 174, 0.22);
  border-top-color: #45e3ae;
  border-radius: 50%;
  animation: fan-avatar-spin 0.9s linear infinite;
}

.fan-avatar-control__status {
  margin: 0;
  color: rgba(247, 249, 252, 0.5);
  font-size: 0.78rem;
  font-weight: 600;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes fan-avatar-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .fan-avatar-control__spinner {
    animation-duration: 2.4s;
  }
}
</style>

<style>
.fan-avatar-sheet {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.fan-avatar-sheet__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  background: rgba(5, 6, 8, 0.62);
  cursor: pointer;
}

.fan-avatar-sheet__backdrop:disabled {
  cursor: default;
}

.fan-avatar-sheet__panel {
  position: relative;
  width: min(100%, 26rem);
  padding: 1.1rem 1.1rem calc(1.15rem + env(safe-area-inset-bottom, 0px));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 0;
  border-radius: 1.15rem 1.15rem 0 0;
  background: var(--faneqo-raised, #0b0e14);
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.fan-avatar-sheet__title {
  margin: 0 0 0.7rem;
  color: rgba(247, 249, 252, 0.55);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-align: center;
}

.fan-avatar-sheet__preview {
  width: 7.5rem;
  height: 7.5rem;
  margin: 0.15rem auto 1rem;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(57, 213, 255, 0.2), rgba(69, 227, 174, 0.16));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.09);
}

.fan-avatar-sheet__preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.fan-avatar-sheet__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  margin-top: 0.35rem;
  padding: 0 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.85rem;
  background: none;
  color: #f7f9fc;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 650;
  cursor: pointer;
}

.fan-avatar-sheet__action.is-primary {
  border-color: rgba(69, 227, 174, 0.38);
  color: #45e3ae;
}

.fan-avatar-sheet__action.is-danger {
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.22);
}

.fan-avatar-sheet__action.is-quiet {
  border-color: transparent;
  color: rgba(247, 249, 252, 0.5);
}

.fan-avatar-sheet__action:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}

.fan-avatar-sheet__action:disabled {
  opacity: 0.55;
  cursor: default;
}
</style>
