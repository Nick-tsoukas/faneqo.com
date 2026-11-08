<template>
  <MotionConfig :reduced-motion="'user'">
    <div class="fcc">
      <header class="fcc-top">
        <div class="fcc-top__lead">
          <FaneqoIconButton
            name="arrowLeft"
            aria-label="Back"
            size="md"
            @click="goBack"
          />
          <div class="fcc-top__titles">
            <h1 class="fcc-title">{{ intentTitle }}</h1>
            <p v-if="showIdentity" class="fcc-show-id">{{ showIdentity }}</p>
          </div>
        </div>
        <p class="fcc-band" :title="bandDisplay">{{ bandDisplay }}</p>
      </header>

      <div ref="scrollRef" class="fcc-body">
        <Motion
          :key="step"
          class="fcc-stage"
          :initial="enterInitial"
          :animate="enterAnimate"
          :transition="motionTokens.standard"
        >
          <!-- SUCCESS -->
          <div v-if="step === 'success'" class="fcc-success" role="status">
            <div class="fcc-success__mark" aria-hidden="true">
              <component :is="icons.check" :size="28" :stroke-width="2.2" />
            </div>
            <h2 class="fcc-success__title">{{ successCopy.title }}</h2>
            <p class="fcc-success__sub">{{ successCopy.body }}</p>
            <NuxtLink :to="sentMessagesPath(true)" class="fcc-success__link">
              View sent message →
            </NuxtLink>
          </div>

          <!-- SENDING -->
          <div v-else-if="step === 'sending'" class="fcc-success" role="status" aria-live="polite">
            <div class="fcc-success__mark is-wait" aria-hidden="true">
              <component :is="icons.send" :size="22" :stroke-width="1.8" />
            </div>
            <h2 class="fcc-success__title">Sending…</h2>
            <p class="fcc-success__sub">This only takes a moment.</p>
          </div>

          <!-- REVIEW -->
          <div v-else-if="step === 'review'" class="fcc-split">
            <section class="fcc-primary" aria-labelledby="fcc-review-heading">
              <h2 id="fcc-review-heading" class="fcc-section-title">Review</h2>
              <p class="fcc-section-sub">This is close to what each fan will receive.</p>
              <p class="fcc-section-quiet">It cannot be unsent.</p>

              <div
                v-if="productionTestMode"
                class="fcc-test"
                role="status"
              >
                <component :is="icons.alert" class="fcc-test__icon" :size="18" :stroke-width="1.8" aria-hidden="true" />
                <div>
                  <p class="fcc-test__kicker">Test mode</p>
                  <p class="fcc-test__copy">Only approved test recipients will receive this {{ isInbox ? 'message' : 'email' }}.</p>
                  <p class="fcc-test__meta">
                    Production test mode · {{ preview.eligible }}
                    {{ preview.eligible === 1 ? 'test recipient' : 'test recipients' }}
                  </p>
                </div>
              </div>

              <div class="fcc-review-summary">
                <FaneqoComposerAudience
                  :audience-type="audienceType"
                  :recap="showRecap"
                  :eligible="sendCount"
                  :test-mode="productionTestMode"
                  :reach-override="reviewAudienceText"
                />
              </div>

              <div class="fcc-review-block">
                <p class="fcc-label">Delivery</p>
                <p>{{ isInbox ? 'Faneqo Inbox' : 'Email' }}</p>
                <p class="fcc-hint">{{ deliveryHint }}</p>
              </div>

              <div v-if="!isInbox" class="fcc-review-block">
                <p class="fcc-label">Subject</p>
                <p>{{ displaySubject }}</p>
              </div>

              <div class="fcc-review-block">
                <p class="fcc-label">Message</p>
                <p class="whitespace-pre-wrap">{{ note.trim() || 'Gallery only' }}</p>
              </div>

              <div v-if="selectedGallery" class="fcc-gallery-review">
                <FaneqoGalleryMessageCard :gallery="selectedGallery" preview />
              </div>

              <p class="fcc-privacy">Each fan receives this privately.</p>

              <div v-if="!showDesktopPreview" class="fcc-fan-preview">
                <button
                  type="button"
                  class="fcc-preview-toggle"
                  :aria-expanded="reviewPreviewOpen"
                  @click="reviewPreviewOpen = !reviewPreviewOpen"
                >
                  Preview as fan
                  <component :is="icons.chevronRight" :size="16" :stroke-width="2" aria-hidden="true" />
                </button>
                <div v-if="reviewPreviewOpen" class="fcc-fan-preview__body">
                  <FanCampaignInboxPreview
                    v-if="isInbox"
                    :band-name="bandDisplay"
                    :body="note"
                    :audience-label="preview?.audienceLabel || audienceLabel"
                    :recipient-count="preview?.eligible || 0"
                    :gallery="selectedGallery"
                  />
                  <FanCampaignEmailPreview
                    v-else
                    :band-name="bandDisplay"
                    :subject="displaySubject"
                    :body="note"
                    :audience-label="preview?.audienceLabel || audienceLabel"
                  />
                </div>
              </div>

              <p v-if="error" class="fcc-error" role="alert">{{ error }}</p>
            </section>

            <aside
              v-if="showDesktopPreview"
              class="fcc-preview"
              :aria-label="isInbox ? 'Faneqo inbox preview' : 'Email preview'"
            >
              <FanCampaignInboxPreview
                v-if="isInbox"
                :band-name="bandDisplay"
                :body="note"
                :audience-label="preview?.audienceLabel || audienceLabel"
                :recipient-count="preview?.eligible || 0"
                :gallery="selectedGallery"
              />
              <FanCampaignEmailPreview
                v-else
                :band-name="bandDisplay"
                :subject="displaySubject"
                :body="note"
                :audience-label="preview?.audienceLabel || audienceLabel"
              />
            </aside>
          </div>

          <!-- COMPOSE -->
          <div v-else class="fcc-split">
            <section class="fcc-primary" aria-labelledby="fcc-compose-heading">
              <h2 id="fcc-compose-heading" class="sr-only">{{ intentTitle }}</h2>

              <FaneqoComposerAudience
                :audience-type="audienceType"
                :recap="showRecap"
                :eligible="sendCount"
                :unavailable="preview?.unavailable || 0"
                :loading="loadingPreview"
                :test-mode="productionTestMode"
                :retry="!!loadError"
                :reach-override="loadError ? 'Couldn’t check your audience.' : previewStatusText"
                @retry="loadPreview"
              />

              <div
                v-if="productionTestMode && preview?.canSend"
                class="fcc-test"
                role="status"
              >
                <component :is="icons.alert" class="fcc-test__icon" :size="18" :stroke-width="1.8" aria-hidden="true" />
                <div>
                  <p class="fcc-test__kicker">Test mode</p>
                  <p class="fcc-test__copy">Only approved test recipients will receive this {{ isInbox ? 'message' : 'email' }}.</p>
                  <p class="fcc-test__meta">
                    Production test mode · {{ preview.eligible }}
                    {{ preview.eligible === 1 ? 'test recipient' : 'test recipients' }}
                  </p>
                </div>
              </div>

              <div
                v-if="preview && !preview.canSend"
                class="fcc-empty"
              >
                <h3 class="fcc-empty__title">{{ emptyState.heading }}</h3>
                <p class="fcc-empty__copy">{{ preview.message || emptyState.body }}</p>
                <NuxtLink
                  v-if="audienceType === 'show_attendees'"
                  to="/fans/recaps"
                  class="fcc-empty__link"
                >
                  Check Night attendance
                </NuxtLink>
                <NuxtLink
                  v-else
                  to="/fans"
                  class="fcc-empty__link"
                >
                  View fans
                </NuxtLink>
              </div>

              <template v-if="!preview || preview.canSend">
                <div v-if="!isInbox" class="fcc-field">
                  <div class="fcc-field__head">
                    <label class="fcc-label" for="fcc-subject">Subject</label>
                    <span
                      v-if="showSubjectCount"
                      class="fcc-count"
                      :class="{ 'is-warn': subjectLen / subjectLimit >= 0.92 }"
                    >
                      {{ subjectLen }} / {{ subjectLimit }}
                    </span>
                  </div>
                  <div class="fcc-subject" :class="{ 'is-test': productionTestMode }">
                    <span v-if="productionTestMode" class="fcc-test-chip" title="Added automatically when this email is sent">
                      [TEST]
                    </span>
                    <input
                      id="fcc-subject"
                      v-model="subject"
                      type="text"
                      class="fcc-subject__input"
                      :maxlength="subjectLimit"
                      :disabled="submitting"
                      :placeholder="defaultSubjectPlain || 'Subject line'"
                      autocomplete="off"
                      @input="clampSubject"
                    />
                  </div>
                  <p v-if="productionTestMode" class="fcc-hint">
                    Recipients will see [TEST] at the start of the subject. You don’t need to type it.
                  </p>
                </div>

                <div class="fcc-field">
                  <div class="fcc-field__head">
                    <label class="fcc-label" for="fcc-note">Message</label>
                    <div class="fcc-field__tools">
                      <FaneqoIconButton
                        v-if="showEmojiButton"
                        ref="smileBtn"
                        name="smile"
                        aria-label="Add emoji"
                        size="sm"
                        :active="emojiOpen"
                        @click="toggleEmoji"
                      />
                      <span
                        v-if="showNoteCount"
                        class="fcc-count"
                        :class="{ 'is-warn': note.length / maxNote >= 0.92 }"
                      >
                        {{ note.length }} / {{ maxNote }}
                      </span>
                    </div>
                  </div>
                  <textarea
                    id="fcc-note"
                    ref="noteRef"
                    v-model="note"
                    class="fcc-textarea"
                    rows="6"
                    :maxlength="maxNote"
                    :disabled="submitting"
                    :placeholder="notePlaceholder"
                  />
                </div>

                <div class="fcc-delivery">
                  <p class="fcc-label" id="fcc-delivery-label">Delivery</p>
                  <div
                    class="fcc-delivery__seg"
                    role="radiogroup"
                    aria-labelledby="fcc-delivery-label"
                  >
                    <button
                      type="button"
                      class="fcc-delivery__opt"
                      :class="{ 'is-active': isInbox }"
                      :aria-checked="isInbox"
                      role="radio"
                      :disabled="submitting"
                      @click="channel = 'in_app'"
                    >
                      <span class="fcc-delivery__name">
                        <span>Faneqo Inbox</span>
                        <component
                          v-if="isInbox"
                          :is="icons.check"
                          class="fcc-delivery__check"
                          :size="15"
                          :stroke-width="2.4"
                          aria-hidden="true"
                        />
                      </span>
                      <small v-if="channelReach.in_app">{{ channelReach.in_app.eligible }} reachable</small>
                    </button>
                    <button
                      type="button"
                      class="fcc-delivery__opt"
                      :class="{ 'is-active': !isInbox }"
                      :aria-checked="!isInbox"
                      role="radio"
                      :disabled="submitting || !!selectedGallery"
                      @click="channel = 'email'"
                    >
                      <span class="fcc-delivery__name">
                        <span>Email</span>
                        <component
                          v-if="!isInbox"
                          :is="icons.check"
                          class="fcc-delivery__check"
                          :size="15"
                          :stroke-width="2.4"
                          aria-hidden="true"
                        />
                      </span>
                      <small v-if="selectedGallery">Remove media to use Email</small>
                      <small v-else-if="channelReach.email">{{ channelReach.email.eligible }} reachable</small>
                    </button>
                  </div>
                  <p class="fcc-privacy">Each fan receives this privately.</p>
                  <p class="fcc-hint">{{ deliveryHint }}</p>
                  <p v-if="!isInbox" class="fcc-hint">
                    Sent as <strong>{{ bandDisplay }}</strong>
                    with a greeting and unsubscribe link. Replies go to your account email.
                  </p>
                </div>

                <div v-if="isInbox" class="fcc-gallery-field">
                  <div v-if="selectedGallery" class="fcc-gallery-selected">
                    <FaneqoGalleryMessageCard
                      :gallery="selectedGallery"
                      preview
                      removable
                      @remove="removeGallery"
                    />
                    <button
                      type="button"
                      class="fcc-media-add"
                      @click="galleryPickerOpen = true"
                    >
                      Change
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="fcc-media-add"
                    @click="galleryPickerOpen = true"
                  >
                    <component :is="icons.plus" :size="16" :stroke-width="2.2" aria-hidden="true" />
                    Attach Gallery
                  </button>
                </div>

                <p v-if="error" class="fcc-error" role="alert">{{ error }}</p>
              </template>
            </section>

            <aside
              v-if="showDesktopPreview"
              class="fcc-preview"
              :aria-label="isInbox ? 'Live Faneqo inbox preview' : 'Live email preview'"
            >
              <FanCampaignInboxPreview
                v-if="isInbox"
                :band-name="bandDisplay"
                :body="note"
                :audience-label="preview?.audienceLabel || audienceLabel"
                :recipient-count="preview?.eligible || 0"
                :placeholder="!note.trim()"
                :gallery="selectedGallery"
              />
              <FanCampaignEmailPreview
                v-else
                :band-name="bandDisplay"
                :subject="displaySubject || 'Subject'"
                :body="note"
                :audience-label="preview?.audienceLabel || audienceLabel"
                :placeholder="!note.trim()"
              />
            </aside>
          </div>
        </Motion>
      </div>

      <footer v-if="footerMode" class="fcc-actions">
        <template v-if="step === 'review'">
          <button type="button" class="fcc-btn fcc-btn--ghost" :disabled="submitting" @click="backToEdit">
            Back to edit
          </button>
          <button
            type="button"
            class="fcc-btn fcc-btn--primary"
            :disabled="submitting"
            @click="sendAndReturnToSent"
          >
            {{ sendActionText }}
          </button>
        </template>

        <template v-else-if="step === 'compose'">
          <button type="button" class="fcc-btn fcc-btn--ghost" @click="goBack">
            Cancel
          </button>
          <button
            v-if="canSendAudience"
            type="button"
            class="fcc-btn fcc-btn--primary"
            :disabled="!canReview"
            @click="goReview"
          >
            Review message
          </button>
        </template>
      </footer>

      <FaneqoEmojiPicker
        v-if="showEmojiButton"
        :open="emojiOpen"
        :reference-el="smileEl"
        placement="bottom-start"
        @select="insertEmoji"
        @close="emojiOpen = false"
      />

      <FaneqoGalleryPicker
        :open="galleryPickerOpen"
        :band-id="bandId"
        :audience-type="audienceType"
        :recap-id="recapId"
        :return-to="returnTo"
        @close="galleryPickerOpen = false"
        @select="selectGallery"
        @create="startGalleryCreate"
      />

      <div
        v-if="leaveGuardOpen"
        class="fcc-leave"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fcc-leave-title"
        aria-describedby="fcc-leave-desc"
      >
        <div class="fcc-leave__card">
          <h2 id="fcc-leave-title" class="fcc-leave__title">Keep this draft?</h2>
          <p id="fcc-leave-desc" class="fcc-leave__copy">
            You have an unsent {{ isInbox ? 'message' : 'email' }}. Leave anyway? Your draft stays on this device.
          </p>
          <div class="fcc-leave__row">
            <button type="button" class="fcc-btn fcc-btn--ghost" @click="cancelLeave">
              Keep writing
            </button>
            <button type="button" class="fcc-btn fcc-btn--primary" @click="leaveAnyway">
              Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  </MotionConfig>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { Motion, MotionConfig } from 'motion-v'
import { useEventListener, useMediaQuery, usePreferredReducedMotion } from '@vueuse/core'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import FaneqoEmojiPicker from '~/components/messages/FaneqoEmojiPicker.vue'
import FanCampaignEmailPreview from '~/components/dashboard/fans/FanCampaignEmailPreview.vue'
import FanCampaignInboxPreview from '~/components/dashboard/fans/FanCampaignInboxPreview.vue'
import FaneqoGalleryMessageCard from '~/components/messages/FaneqoGalleryMessageCard.vue'
import FaneqoGalleryPicker from '~/components/messages/FaneqoGalleryPicker.vue'
import FaneqoComposerAudience from '~/components/messages/FaneqoComposerAudience.vue'
import {
  composerEmptyCopy,
  composerPlaceholder,
  composerSendLabel,
  composerSuccessCopy,
} from '~/utils/messages/composerPresentation'
import { useCampaignComposer } from '~/composables/useCampaignComposer'
import { useArtistUpdates } from '~/composables/useArtistUpdates'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { motionTokens } from '~/utils/ui/motionTokens'
import { stripTestSubjectPrefix } from '~/utils/campaigns/campaignUiLog'
import { formatShowIdentity } from '~/utils/campaigns/formatShowIdentity'
import { sentMessagesPath } from '~/utils/campaigns/messagesHomeRoutes'
import {
  clearComposerGalleryHop,
  loadComposerGalleryHop,
  saveComposerGalleryHop,
} from '~/utils/campaigns/composerGalleryHop'
import {
  buildComposerGalleryCreateQuery,
  isCompatibleBroadcastGallery,
  isComposerGalleryCreatePath,
} from '~/utils/updates/galleryComposerReturn'

const POST_SEND_SENT_HOLD_MS = 1100
const POST_SEND_SENT_HOLD_REDUCED_MS = 800

const props = defineProps({
  bandId: { type: [Number, String], required: true },
  bandName: { type: String, default: '' },
  audienceType: { type: String, default: 'all_fans' },
  audienceLabel: { type: String, default: 'All fans' },
  backTo: { type: String, default: '/messages' },
  campaignName: { type: String, default: 'Fan List message' },
  defaultChannel: { type: String, default: 'in_app' },
  audienceReference: { type: [String, Number], default: null },
  recapId: { type: [String, Number], default: null },
  showRecap: { type: Object, default: null },
  initialGalleryId: { type: [String, Number], default: null },
  returnTo: { type: String, default: '/messages/compose' },
})

const emit = defineEmits(['back'])

const icons = faneqoIcons
const nuxtApp = useNuxtApp()
const prefersReducedMotion = usePreferredReducedMotion()
const reduced = computed(() => prefersReducedMotion.value === 'reduce')
const isDesktop = useMediaQuery('(min-width: 1024px)')
const showEmojiButton = computed(() => isDesktop.value)
const showDesktopPreview = computed(() => isDesktop.value)
const selectedGallery = ref(null)
const galleryPickerOpen = ref(false)
const reviewPreviewOpen = ref(false)
const { getById: getGalleryById } = useArtistUpdates()

const enterInitial = computed(() => (reduced.value ? { opacity: 0 } : { opacity: 0, y: 8 }))
const enterAnimate = computed(() => ({ opacity: 1, y: 0 }))

const composer = useCampaignComposer({
  bandId: computed(() => props.bandId),
  audienceType: computed(() => props.audienceType),
  audienceLabel: computed(() => props.audienceLabel),
  campaignName: computed(() => props.campaignName),
  defaultChannel: computed(() => props.defaultChannel),
  audienceReference: computed(() => props.audienceReference),
  artistUpdateId: computed(() => selectedGallery.value?.id || null),
})

const {
  step,
  channel,
  isInbox,
  loadingPreview,
  loadError,
  preview,
  channelReach,
  subject,
  note,
  error,
  submitting,
  campaignId,
  recipientCount,
  leaveGuardOpen,
  maxNote,
  subjectLimit,
  productionTestMode,
  canSendAudience,
  canReview,
  hasUnsavedWork,
  previewStatusText,
  emptyHeading,
  emptyReason,
  displaySubject,
  audienceLabel,
  defaultSubjectPlain,
  loadPreview,
  goReview,
  backToEdit,
  send,
  allowLeave,
  requestLeave,
  cancelLeave,
  confirmLeave,
  persistDraft,
} = composer

const route = useRoute()

const audienceType = computed(() => props.audienceType)
const recapId = computed(() => props.recapId)
const returnTo = computed(() => props.returnTo)

function hopStorage() {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}

function hopScope() {
  return {
    bandId: props.bandId,
    audienceType: props.audienceType,
    recapId: props.recapId,
  }
}

async function restoreComposerHop({ afterGallery = false } = {}) {
  const storage = hopStorage()
  if (!storage) return
  const hop = loadComposerGalleryHop(storage, {
    ...hopScope(),
    draftKey: route.query.draftKey,
  })
  if (!hop) return
  if (!afterGallery && hop.channel && hop.channel !== channel.value && !props.initialGalleryId) {
    channel.value = hop.channel
    await nextTick()
  }
  if (hop.note) note.value = hop.note
  if (hop.subject) subject.value = hop.subject
  clearComposerGalleryHop(storage, { ...hopScope(), draftKey: hop.draftKey })
}

function selectGallery(gallery) {
  if (!gallery?.id) return
  if (!isCompatibleBroadcastGallery(gallery, {
    audienceType: props.audienceType,
    recapId: props.recapId,
  })) {
    error.value = 'That gallery is no longer available.'
    return
  }
  selectedGallery.value = gallery
  galleryPickerOpen.value = false
  channel.value = 'in_app'
}

function removeGallery() {
  selectedGallery.value = null
}

async function startGalleryCreate() {
  persistDraft()
  const storage = hopStorage()
  const draftKey = storage
    ? saveComposerGalleryHop(storage, {
        ...hopScope(),
        channel: channel.value,
        subject: subject.value,
        note: note.value,
      })
    : null
  galleryPickerOpen.value = false
  allowLeave.value = true
  try {
    await navigateTo({
      path: '/galleries/new',
      query: buildComposerGalleryCreateQuery({
        bandId: props.bandId,
        from: props.returnTo,
        audienceType: props.audienceType,
        recapId: props.recapId,
        draftKey,
      }),
    })
  } catch {
    allowLeave.value = false
  }
}

watch(
  () => props.initialGalleryId,
  async (id) => {
    if (!id) return
    if (String(selectedGallery.value?.id || '') === String(id)) {
      await restoreComposerHop({ afterGallery: true })
      return
    }
    try {
      const result = await getGalleryById(id)
      if (result?.data?.id) selectGallery(result.data)
      else error.value = 'That gallery is no longer available.'
    } catch {
      error.value = 'That gallery is no longer available.'
    }
    await restoreComposerHop({ afterGallery: true })
  },
  { immediate: true }
)

onMounted(() => {
  if (!props.initialGalleryId) restoreComposerHop()
})

const bandDisplay = computed(
  () => preview.value?.bandName || props.bandName || 'Your band'
)
const intentTitle = computed(() =>
  props.audienceType === 'show_attendees' ? 'Message a show' : 'Message all fans'
)
const showIdentity = computed(() =>
  props.audienceType === 'show_attendees' ? formatShowIdentity(props.showRecap) : ''
)
const sendCount = computed(() => Number(preview.value?.eligible || 0))
const reviewAudienceText = computed(() => {
  const n = sendCount.value
  if (productionTestMode.value) {
    return `${n} ${n === 1 ? 'test recipient' : 'test recipients'}`
  }
  if (props.audienceType === 'show_attendees') {
    return `${n} ${n === 1 ? 'fan' : 'fans'} from this show`
  }
  return `${n} ${n === 1 ? 'fan' : 'fans'}`
})
const sendActionText = computed(() => composerSendLabel({
  eligible: sendCount.value,
  testMode: productionTestMode.value,
  audienceType: props.audienceType,
}))
const notePlaceholder = computed(() => composerPlaceholder({ audienceType: props.audienceType }))
const emptyState = computed(() => composerEmptyCopy({
  audienceType: props.audienceType,
  reason: emptyReason.value,
  isInbox: isInbox.value,
}))
const successCopy = computed(() => composerSuccessCopy({
  eligible: recipientCount.value || sendCount.value,
  isInbox: isInbox.value,
}))
const deliveryHint = computed(() => (
  isInbox.value
    ? 'Faneqo Inbox is instant. Email keeps a 24-hour cooldown for the same fan.'
    : 'Email waits 24 hours before writing the same fan again.'
))

const subjectLen = computed(() => stripTestSubjectPrefix(subject.value).length)
const showSubjectCount = computed(() => subjectLen.value >= Math.floor(subjectLimit.value * 0.7))
const showNoteCount = computed(() => note.value.length >= 200 || note.value.length / maxNote.value >= 0.7)

const footerMode = computed(() => step.value !== 'sending' && step.value !== 'success')
let successNavTimer = 0

function scheduleSentRedirect() {
  window.clearTimeout(successNavTimer)
  const delay = prefersReducedMotion.value === 'reduce'
    ? POST_SEND_SENT_HOLD_REDUCED_MS
    : POST_SEND_SENT_HOLD_MS
  successNavTimer = window.setTimeout(() => {
    nuxtApp.runWithContext(() => navigateTo(sentMessagesPath(true), { replace: true }))
  }, delay)
}

async function sendAndReturnToSent() {
  const result = await send()
  if (!result?.ok) return
  scheduleSentRedirect()
}

const smileBtn = ref(null)
const smileEl = computed(() => {
  const inst = smileBtn.value
  if (!inst) return null
  const exposed = inst.el
  if (exposed && typeof exposed === 'object' && 'value' in exposed) return exposed.value
  return exposed || inst.$el || null
})
const emojiOpen = ref(false)
const noteRef = ref(null)
const scrollRef = ref(null)

watch(step, (next) => {
  if (next === 'review') reviewPreviewOpen.value = false
  nextTick(() => {
    scrollRef.value?.scrollTo?.({ top: 0, behavior: reduced.value ? 'auto' : 'smooth' })
  })
})

onBeforeUnmount(() => {
  window.clearTimeout(successNavTimer)
})

function clampSubject() {
  const plain = stripTestSubjectPrefix(subject.value)
  if (plain.length > subjectLimit.value) {
    subject.value = plain.slice(0, subjectLimit.value)
  } else if (plain !== subject.value) {
    subject.value = plain
  }
}

function toggleEmoji() {
  emojiOpen.value = !emojiOpen.value
}

function insertEmoji(emoji) {
  const el = noteRef.value
  const value = String(note.value || '')
  if (!el) {
    note.value = value + emoji
    return
  }
  const start = el.selectionStart ?? value.length
  const end = el.selectionEnd ?? start
  note.value = value.slice(0, start) + emoji + value.slice(end)
  const caret = start + emoji.length
  nextTick(() => {
    el.focus()
    el.setSelectionRange(caret, caret)
  })
}

function goBack() {
  if (!requestLeave(props.backTo)) return
  emit('back', props.backTo)
}

function leaveAnyway() {
  const to = confirmLeave()
  emit('back', to || props.backTo)
}

onBeforeRouteLeave((to) => {
  if (to.path === '/messages/compose') return true
  if (isComposerGalleryCreatePath(to.path) && allowLeave.value) return true
  if (step.value === 'success' || allowLeave.value) return true
  return requestLeave(to.fullPath)
})

useEventListener('beforeunload', (evt) => {
  if (!hasUnsavedWork.value) return
  evt.preventDefault()
  evt.returnValue = ''
})
</script>

<style scoped>
.fcc {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--fq-app-bg, #050506);
  color: var(--fq-text-primary, #fff);
  overflow: hidden;
}

.fcc-top {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0.75rem;
  padding-top: max(0.35rem, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
}

.fcc-top__lead {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  min-width: 0;
}

.fcc-top__titles {
  min-width: 0;
}

.fcc-kicker {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.fcc-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: #fff;
}

.fcc-show-id {
  margin: 0.12rem 0 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.58);
}

.fcc-band {
  margin: 0;
  max-width: 42%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.58);
}

.fcc-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.fcc-stage {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0.75rem 1rem 1.25rem;
}

.fcc-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (min-width: 1024px) {
  .fcc-top {
    padding: 0.55rem 1.5rem;
  }

  .fcc-title {
    font-size: 1.25rem;
  }

  .fcc-stage {
    padding: 1.6rem 1.75rem 2rem;
  }

  .fcc-split {
    grid-template-columns: minmax(0, 1.15fr) minmax(17rem, 0.85fr);
    gap: 2.25rem;
  }

  .fcc-primary {
    max-width: 40rem;
  }

  .fcc-preview {
    position: sticky;
    top: 0.5rem;
  }
}

.fcc-reach {
  margin: 0 0 0.85rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.62);
}

.fcc-delivery {
  margin: 0 0 1rem;
}

.fcc-delivery__seg {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.35rem;
  padding: 0.22rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.fcc-delivery__opt {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.08rem;
  min-height: 44px;
  padding: 0.4rem 0.65rem;
  border: 0;
  border-radius: 0.62rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.58);
  text-align: left;
  cursor: pointer;
}

.fcc-delivery__opt.is-active {
  background: rgba(245, 245, 246, 0.12);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(245, 245, 246, 0.55);
}

.fcc-delivery__opt:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fcc-delivery__opt:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39d5ff);
  outline-offset: 2px;
}

.fcc-delivery__name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  width: 100%;
  font-size: 0.84rem;
  font-weight: 700;
}

.fcc-delivery__check {
  flex-shrink: 0;
  color: #f5f5f6;
}

.fcc-delivery__opt small {
  font-size: 0.68rem;
  font-weight: 550;
  color: rgba(255, 255, 255, 0.46);
}

.fcc-privacy {
  margin: 0.55rem 0 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.5);
}

.fcc-media-add {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.7rem;
  background: rgba(255, 255, 255, 0.035);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.84rem;
  font-weight: 650;
  cursor: pointer;
}

.fcc-media-add:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39d5ff);
  outline-offset: 2px;
}

.fcc-gallery-field,
.fcc-gallery-review {
  margin: 0 0 1rem;
}

.fcc-gallery-selected {
  display: grid;
  gap: 0.55rem;
  justify-items: start;
}


.fcc-text-btn {
  margin-left: 0.25rem;
  border: 0;
  background: none;
  color: #f0abfc;
  font-weight: 650;
  cursor: pointer;
}

.fcc-text-btn:focus-visible {
  outline: 2px solid rgba(232, 121, 249, 0.7);
  outline-offset: 2px;
}

.fcc-test {
  display: flex;
  gap: 0.7rem;
  margin-bottom: 1.15rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.08);
}

.fcc-test__icon {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: #fbbf24;
}

.fcc-test__kicker {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fde68a;
}

.fcc-test__copy {
  margin: 0.2rem 0 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: #fff7ed;
}

.fcc-test__meta {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: rgba(254, 243, 199, 0.75);
}

.fcc-skel {
  display: grid;
  gap: 0.55rem;
  margin-bottom: 1.2rem;
}

.fcc-skel__line {
  height: 0.7rem;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.12), rgba(255,255,255,0.05));
  background-size: 200% 100%;
  animation: fcc-shimmer 1.2s ease-in-out infinite;
}

.fcc-skel__line--a { width: 55%; }
.fcc-skel__line--b { width: 38%; }

@keyframes fcc-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .fcc-skel__line {
    animation: none;
  }

  .fcc-btn:active:not(:disabled) {
    transform: none;
  }
}

.fcc-empty {
  padding: 1.5rem 0.2rem 0.5rem;
}

.fcc-empty__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.fcc-empty__copy {
  margin: 0.5rem 0 0;
  max-width: 28rem;
  font-size: 0.92rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.58);
}

.fcc-field {
  margin-bottom: 1.15rem;
}

.fcc-field__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.fcc-field__tools {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.fcc-label {
  font-size: 0.78rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.62);
}

.fcc-count {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.35);
}

.fcc-count.is-warn {
  color: #fbbf24;
}

.fcc-subject {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.15rem 0 0.45rem;
}

.fcc-subject:focus-within {
  border-bottom-color: rgba(57, 255, 20, 0.55);
}

.fcc-test-chip {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fde68a;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: 0.4rem;
  padding: 0.18rem 0.4rem;
}

.fcc-subject__input {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  outline: none;
  padding: 0.35rem 0;
}

.fcc-subject__input::placeholder {
  color: rgba(255, 255, 255, 0.28);
  font-weight: 500;
}

.fcc-textarea {
  width: 100%;
  min-height: 10rem;
  max-height: min(22rem, 38dvh);
  field-sizing: content;
  resize: none;
  overflow-y: auto;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.035);
  color: #fff;
  padding: 0.9rem 1rem;
  font-size: 1.02rem;
  line-height: 1.6;
  caret-color: #f5f5f6;
  outline: none;
}

.fcc-textarea:focus {
  border-color: rgba(245, 245, 246, 0.35);
  box-shadow: 0 0 0 1px rgba(245, 245, 246, 0.16);
}

.fcc-textarea::placeholder {
  color: rgba(255, 255, 255, 0.32);
}

@media (max-width: 1023px) {
  .fcc-textarea {
    min-height: 8.5rem;
    max-height: min(16rem, 32dvh);
  }
}

.fcc-hint {
  margin: 0.45rem 0 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.38);
}

.fcc-hint strong {
  color: rgba(255, 255, 255, 0.62);
  font-weight: 650;
}

.fcc-error {
  margin: 0.4rem 0 0;
  font-size: 0.86rem;
  color: #fda4af;
}

.fcc-section-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.fcc-section-sub {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

.fcc-section-quiet {
  margin: 0.2rem 0 1rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.38);
}

.fcc-review-summary {
  margin: 0 0 1.1rem;
}

.fcc-review-summary .fcc-show-id {
  margin: 0 0 0.28rem;
  font-size: 0.95rem;
  font-weight: 650;
  color: #fff;
  white-space: normal;
}

.fcc-review-summary .fcc-reach {
  margin: 0;
}

.fcc-review-block {
  margin: 0 0 0.95rem;
}

.fcc-review-block > p:last-child {
  margin: 0.22rem 0 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: #fff;
  overflow-wrap: anywhere;
}

.fcc-fan-preview {
  margin: 1rem 0 0;
}

.fcc-preview-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.84rem;
  font-weight: 650;
  cursor: pointer;
}

.fcc-preview-toggle:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39d5ff);
  outline-offset: 2px;
}

.fcc-preview-toggle[aria-expanded="true"] svg {
  transform: rotate(90deg);
}

.fcc-fan-preview__body {
  margin-top: 0.65rem;
}

.fcc-review {
  display: grid;
  gap: 0.85rem;
  margin: 0;
}

.fcc-review > div {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.fcc-review dt {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}

.fcc-review dd {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  color: #fff;
  overflow-wrap: anywhere;
}

.fcc-success {
  text-align: center;
  padding: 3.5rem 0.5rem 2rem;
}

.fcc-success__mark {
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(52, 211, 153, 0.14);
  color: #6ee7b7;
}

.fcc-success__mark.is-wait {
  background: rgba(167, 139, 250, 0.16);
  color: #ddd6fe;
}

.fcc-success__title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.fcc-success__sub {
  margin: 0.5rem auto 0;
  max-width: 22rem;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.55);
}

.fcc-success__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 0.85rem;
  color: #f5f5f6;
  font-weight: 650;
  text-decoration: none;
}

.fcc-empty__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 0.55rem;
  color: #f5f5f6;
  font-weight: 650;
  text-decoration: none;
}

.fcc-actions {
  flex: 0 0 auto;
  display: flex;
  justify-content: stretch;
  gap: 0.55rem;
  padding: 0.7rem 0.85rem calc(0.7rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--fq-app-bg, #050506);
}

@media (min-width: 640px) {
  .fcc-actions {
    justify-content: flex-end;
    padding-inline: 1.5rem;
  }
}

.fcc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.7rem 1.1rem;
  border-radius: 0.85rem;
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
  border: 0;
  cursor: pointer;
  flex: 1 1 0;
  transition: transform 0.14s ease, opacity 0.14s ease;
}

@media (min-width: 640px) {
  .fcc-btn {
    flex: 0 0 auto;
    min-width: 8.5rem;
  }
}

.fcc-btn:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39d5ff);
  outline-offset: 2px;
}

.fcc-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.fcc-btn--primary {
  background: #f5f5f6;
  color: #0a0b0e;
}

.fcc-btn--primary:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.fcc-btn--ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.78);
}

.fcc-leave {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  place-items: end center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.55);
}

.fcc-leave__card {
  width: min(26rem, 100%);
  margin-bottom: 1rem;
  padding: 1.15rem 1.15rem 1.05rem;
  border-radius: 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--fq-surface-raised, #111217);
}

.fcc-leave__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.fcc-leave__copy {
  margin: 0.4rem 0 1rem;
  font-size: 0.88rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
}

.fcc-leave__row {
  display: flex;
  gap: 0.5rem;
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
