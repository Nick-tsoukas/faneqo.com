<template>
  <div class="fq-composer" :class="{ 'is-disabled': disabled, 'is-ready': canSend }">
    <div class="fq-composer__inner">
    <Motion
      v-if="replyTo"
      class="fq-composer__reply"
      :initial="reduced ? { opacity: 0 } : { opacity: 0, height: 0 }"
      :animate="reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }"
      :exit="reduced ? { opacity: 0 } : { opacity: 0, height: 0 }"
      :transition="motionTokens.standard"
    >
      <div class="fq-composer__reply-copy">
        <p class="fq-composer__reply-kicker">Replying to {{ replyName }}</p>
        <p class="fq-composer__reply-body">{{ replyPreview }}</p>
      </div>
      <FaneqoIconButton name="close" aria-label="Cancel reply" size="sm" @click="$emit('cancel-reply')" />
    </Motion>

    <FaneqoGalleryMessageCard
      v-if="selectedGallery"
      :gallery="selectedGallery"
      preview
      removable
      @remove="removeGallery"
    />

    <FaneqoMediaPreview
      v-if="queue.items.length"
      compact
      :items="queue.items"
      @remove="queue.remove"
      @retry="queue.retry"
    />
    <p v-if="queueError" class="fq-composer__media-note is-error" role="alert">{{ queueError }}</p>
    <p v-else-if="mediaNote" class="fq-composer__media-note" role="status">{{ mediaNote }}</p>

    <div class="fq-composer__row">
      <FaneqoMediaPicker
        v-if="!selectedGallery"
        multiple
        :disabled="disabled"
        :can-add="queue.canAdd"
        label="Add photo"
        @select="queue.addFiles"
      />
      <FaneqoIconButton
        v-if="allowGallery && bandId && !selectedGallery && !queue.items.length"
        name="images"
        aria-label="Share a show gallery"
        size="md"
        @click="galleryPickerOpen = true"
      />
      <FaneqoIconButton
        v-if="showEmojiButton"
        ref="smileBtn"
        name="smile"
        aria-label="Add emoji"
        size="md"
        :active="emojiOpen"
        @click="toggleEmoji"
      />

      <label class="sr-only" :for="inputId">{{ placeholder }}</label>
      <textarea
        :id="inputId"
        ref="textareaRef"
        v-model="draft"
        class="fq-composer__input"
        :placeholder="placeholder"
        :disabled="disabled"
        rows="1"
        autocomplete="off"
        enterkeyhint="send"
        @keydown="onKeydown"
        @compositionstart="composing = true"
        @compositionend="composing = false"
        @input="autosize"
      />

      <FaneqoIconButton
        name="send"
        aria-label="Send"
        size="md"
        press="send"
        :muted="!canSend"
        :ready="canSend"
        :disabled="!canSend || disabled"
        @click="submit"
      />
    </div>

    <FaneqoEmojiPicker
      :open="emojiOpen"
      :reference-el="smileEl"
      :show-quick="emojiOpen"
      @select="insertEmoji"
      @close="emojiOpen = false"
    />
    <FaneqoGalleryPicker
      :open="galleryPickerOpen"
      :band-id="bandId"
      @close="galleryPickerOpen = false"
      @select="selectGallery"
      @create="startInboxGalleryCreate"
    />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { Motion } from 'motion-v'
import { useMediaQuery, usePreferredReducedMotion } from '@vueuse/core'
import { useMediaUploadQueue } from '~/composables/useMediaUploadQueue'
import FaneqoMediaPicker from '~/components/media/FaneqoMediaPicker.vue'
import FaneqoMediaPreview from '~/components/media/FaneqoMediaPreview.vue'
import FaneqoEmojiPicker from '~/components/messages/FaneqoEmojiPicker.vue'
import FaneqoGalleryMessageCard from '~/components/messages/FaneqoGalleryMessageCard.vue'
import FaneqoGalleryPicker from '~/components/messages/FaneqoGalleryPicker.vue'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import { fanFirstName } from '~/utils/messages/chatUiAdapter'
import { motionTokens } from '~/utils/ui/motionTokens'
import { FANEQO_DM_MAX_IMAGES } from '~/utils/media/faneqoMedia'
import { useInbox } from '~/composables/useInbox'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Write a message…' },
  disabled: { type: Boolean, default: false },
  replyTo: { type: Object, default: null },
  conversationId: { type: String, default: null },
  bandId: { type: [String, Number], default: null },
  viewerRole: { type: String, default: 'artist' },
  allowGallery: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'send', 'cancel-reply', 'slash-intent'])
const { getMediaDelivery, uploadConversationMedia } = useInbox()
const protectedReady = ref(false)
const publicFallbackAllowed = ref(false)
const attachmentsEnabled = ref(false)
const deliveryKnown = ref(false)
const sending = ref(false)
const selectedGallery = ref(null)
const galleryPickerOpen = ref(false)
let deliveryWait = null
let deliveryCid = null

function applyDelivery(delivery) {
  const ready = delivery?.ready === true || delivery?.data?.ready === true
  const fallback = delivery?.publicFallbackAllowed === true || delivery?.data?.publicFallbackAllowed === true
  const enabled = delivery?.attachmentsEnabled === true
    || delivery?.data?.attachmentsEnabled === true
    || ready
    || fallback
  protectedReady.value = ready
  publicFallbackAllowed.value = fallback
  attachmentsEnabled.value = enabled
  return { ready, fallback, enabled }
}

function refreshDelivery() {
  const cid = props.conversationId
  if (!cid) {
    protectedReady.value = false
    publicFallbackAllowed.value = false
    attachmentsEnabled.value = false
    deliveryKnown.value = true
    deliveryWait = null
    deliveryCid = null
    return Promise.resolve({ ready: false, fallback: false, enabled: false })
  }
  if (deliveryWait && deliveryCid === cid) return deliveryWait
  deliveryCid = cid
  deliveryWait = getMediaDelivery()
    .then((delivery) => applyDelivery(delivery))
    .catch(() => applyDelivery({ ready: false, publicFallbackAllowed: false, attachmentsEnabled: false }))
    .then((policy) => {
      if (props.conversationId === cid) deliveryKnown.value = true
      return policy
    })
    .finally(() => {
      if (deliveryCid === cid) deliveryWait = null
    })
  return deliveryWait
}

const queue = useMediaUploadQueue({
  maxItems: FANEQO_DM_MAX_IMAGES,
  uploadFn: async (file, { signal, defaultUpload }) => {
    if (!props.conversationId) {
      const err = new Error('Photo attachments aren’t available right now.')
      err.status = 503
      err.code = 'gated_delivery_unavailable'
      throw err
    }
    const policy = (protectedReady.value || publicFallbackAllowed.value)
      ? { ready: protectedReady.value, fallback: publicFallbackAllowed.value, enabled: attachmentsEnabled.value }
      : await refreshDelivery()
    if (policy.ready) {
      return uploadConversationMedia(file, {
        conversationId: props.conversationId,
        signal,
        deliveryReady: true,
      })
    }
    if (policy.fallback) {
      return defaultUpload(file, { signal })
    }
    const err = new Error('Photo attachments aren’t available right now.')
    err.status = 503
    err.code = 'gated_delivery_unavailable'
    throw err
  },
})

const inputId = computed(() => `fq-composer-${props.conversationId || 'draft'}`)
const draft = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const textareaRef = ref(null)
const smileBtn = ref(null)
const smileEl = computed(() => unref(smileBtn.value?.el) || smileBtn.value?.$el || null)
const emojiOpen = ref(false)
const composing = ref(false)
const isDesktop = useMediaQuery('(min-width: 768px)')
const showEmojiButton = computed(() => isDesktop.value)
const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')

const canSend = computed(() => {
  if (props.disabled || sending.value) return false
  if (queue.busy) return false
  if (queue.items.some((row) => row.state === 'failed')) return false
  const hasText = !!String(draft.value || '').trim()
  return hasText || queue.ready || Boolean(selectedGallery.value)
})
const replyName = computed(() => fanFirstName(props.replyTo?.senderName || 'them'))
const replyPreview = computed(() => {
  const body = String(props.replyTo?.body || '').replace(/\s+/g, ' ').trim()
  if (body.length <= 88) return body
  return `${body.slice(0, 88).trimEnd()}…`
})
const queueError = computed(() => queue.items.find((row) => row.state === 'failed' && row.error)?.error || '')
const pendingUploadCount = computed(() =>
  queue.items.filter((row) => row.state === 'preparing' || row.state === 'uploading').length
)
const mediaNote = computed(() => {
  const count = pendingUploadCount.value
  if (count) return `Uploading ${count} ${count === 1 ? 'photo' : 'photos'}…`
  if (!deliveryKnown.value || attachmentsEnabled.value || queue.items.length) return ''
  return props.allowGallery
    ? 'Photo uploads aren’t available right now. You can still share an existing gallery or send text.'
    : 'Photo attachments aren’t available right now. You can still send a text message.'
})

watch(
  () => draft.value,
  (value) => {
    if (String(value || '').startsWith('/') && String(value).length >= 1) {
      emit('slash-intent', value)
    }
  }
)

function autosize() {
  const el = textareaRef.value
  if (!el) return
  if (typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content')) return
  el.style.height = 'auto'
  const max = 136
  el.style.height = `${Math.min(el.scrollHeight, max)}px`
}

function onKeydown(evt) {
  if (evt.key !== 'Enter') return
  if (evt.shiftKey) return
  if (composing.value || evt.isComposing) return
  if (isDesktop.value) {
    evt.preventDefault()
    submit()
  }
}

function toggleEmoji() {
  emojiOpen.value = !emojiOpen.value
}

function insertEmoji(emoji) {
  const el = textareaRef.value
  const value = String(draft.value || '')
  if (!el) {
    draft.value = value + emoji
    return
  }
  const start = el.selectionStart ?? value.length
  const end = el.selectionEnd ?? start
  draft.value = value.slice(0, start) + emoji + value.slice(end)
  const caret = start + emoji.length
  nextTick(() => {
    el.focus()
    el.setSelectionRange(caret, caret)
    autosize()
  })
}

function submit() {
  if (!canSend.value) return
  const attachments = queue.readyAttachments()
  sending.value = true
  emit('send', {
    body: String(draft.value || '').trim(),
    attachments,
    attachment: attachments[0] || null,
    galleryReference: selectedGallery.value,
  })
  queue.clear({ revokePreviews: false })
  selectedGallery.value = null
  sending.value = false
}

function selectGallery(gallery) {
  if (!gallery?.id) return
  queue.clear({ revokePreviews: true })
  selectedGallery.value = gallery
  galleryPickerOpen.value = false
  nextTick(() => textareaRef.value?.focus())
}

function removeGallery() {
  selectedGallery.value = null
  nextTick(() => textareaRef.value?.focus())
}

function startInboxGalleryCreate() {
  galleryPickerOpen.value = false
  navigateTo({
    path: '/galleries/new',
    query: {
      bandId: String(props.bandId || ''),
      from: '/messages',
    },
  })
}

function clearAttachments() {
  queue.clear({ revokePreviews: true })
}

onMounted(() => {
  autosize()
  refreshDelivery()
})

onBeforeUnmount(() => {
  queue.clear()
})

watch(() => props.modelValue, () => nextTick(autosize))
watch(() => props.conversationId, () => nextTick(() => {
  queue.clear()
  selectedGallery.value = null
  galleryPickerOpen.value = false
  protectedReady.value = false
  publicFallbackAllowed.value = false
  attachmentsEnabled.value = false
  deliveryKnown.value = false
  deliveryWait = null
  deliveryCid = null
  refreshDelivery()
  autosize()
  textareaRef.value?.focus()
}))

defineExpose({
  focus: () => textareaRef.value?.focus(),
  textarea: textareaRef,
  insertEmoji,
  clearAttachments,
  removeGallery,
})
</script>

<style scoped>
.fq-composer {
  flex-shrink: 0;
  padding: 0;
  background: var(--fq-surface-composer, #0A0B0E);
  border-top: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
}

.fq-composer__inner {
  width: min(100%, var(--fq-msg-canvas, 46rem));
  margin: 0 auto;
  padding: 0.5rem 0.85rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.fq-composer.is-disabled {
  opacity: 0.55;
  pointer-events: none;
}

.fq-composer__reply {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  padding: 0.5rem 0.55rem;
  border-radius: 0.75rem;
  background: var(--fq-accent-mint-soft, rgba(69, 227, 174, 0.1));
  overflow: hidden;
}

.fq-composer__reply-kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--fq-accent-mint, #45E3AE);
}

.fq-composer__reply-body {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.35;
}

.fq-composer__row {
  display: flex;
  align-items: flex-end;
  gap: 0.15rem;
}

.fq-composer__media-note {
  margin: 0 0 0.4rem;
  font-size: 0.78rem;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.58);
}

.fq-composer__media-note.is-error {
  color: #ffb4b4;
}

.fq-composer__input {
  flex: 1;
  min-height: 44px;
  max-height: 8.5rem;
  field-sizing: content;
  resize: none;
  overflow-y: auto;
  border-radius: 1.05rem;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: var(--fq-surface-raised, #111217);
  color: var(--fq-text-primary, #fafafa);
  padding: 0.62rem 0.85rem;
  font-size: 16px;
  line-height: 1.4;
  caret-color: rgba(255, 255, 255, 0.72);
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}

.fq-composer.is-ready .fq-composer__input {
  border-color: rgba(57, 213, 255, 0.28);
}

.fq-composer__input::placeholder {
  color: rgba(255, 255, 255, 0.38);
}

.fq-composer__input:focus {
  outline: none;
  border-color: rgba(57, 213, 255, 0.45);
  box-shadow: 0 0 0 1px var(--fq-accent-focus, #39D5FF);
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
</style>
