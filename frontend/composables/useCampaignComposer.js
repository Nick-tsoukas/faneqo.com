/**
 * Fan List campaign composer state for email and private Faneqo inbox delivery.
 * Presentation lives in FanCampaignComposer — this reuses preview/create APIs.
 */
import { computed, onBeforeUnmount, ref, unref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useMessageCampaigns } from '~/composables/useMessageCampaigns'
import { useCampaignComposerDrafts } from '~/composables/useCampaignComposerDrafts'
import {
  campaignUiLog,
  formatPreviewSubject,
  newComposerRequestId,
  stripTestSubjectPrefix,
} from '~/utils/campaigns/campaignUiLog'
import { composerReachCopy } from '~/utils/messages/composerPresentation'

export function useCampaignComposer(options = {}) {
  const bandId = computed(() => unref(options.bandId))
  const audienceType = computed(() => unref(options.audienceType) || 'all_fans')
  const audienceLabel = computed(() => unref(options.audienceLabel) || 'All fans')
  const campaignName = computed(() => unref(options.campaignName) || 'Fan List message')
  const artistUpdateId = computed(() => unref(options.artistUpdateId) || null)
  const channel = ref(unref(options.defaultChannel) === 'email' ? 'email' : 'in_app')
  const isInbox = computed(() => channel.value === 'in_app')
  const draftAudienceKey = computed(() => `${audienceType.value}:${channel.value}`)

  const { previewAudience, createCampaign } = useMessageCampaigns()
  const drafts = useCampaignComposerDrafts()

  const step = ref('compose') // compose | review | sending | success
  const loadingPreview = ref(false)
  const loadError = ref('')
  const preview = ref(null)
  const channelReach = ref({ in_app: null, email: null })
  const subject = ref('')
  const note = ref('')
  const error = ref('')
  const submitting = ref(false)
  const campaignId = ref(null)
  const recipientCount = ref(0)
  const leaveGuardOpen = ref(false)
  const pendingLeaveTo = ref(null)
  const allowLeave = ref(false)
  let previewRequestId = null
  let companionReachRequest = 0
  let hydratedDraft = false

  function reachSummary(data) {
    if (!data) return null
    return {
      eligible: Number(data.eligible || 0),
      unavailable: Number(data.unavailable || 0),
      canSend: !!data.canSend,
      productionTestMode: !!data.productionTestMode,
    }
  }

  async function loadCompanionReach(selectedChannel) {
    if (artistUpdateId.value) return
    const companion = selectedChannel === 'in_app' ? 'email' : 'in_app'
    if (!bandId.value || channelReach.value[companion]) return

    const request = ++companionReachRequest
    const requestedBandId = String(bandId.value)
    try {
      const data = await previewAudience({
        bandId: bandId.value,
        audienceType: audienceType.value,
        audienceReference: unref(options.audienceReference) || null,
        channel: companion,
        artistUpdateId: null,
      })
      if (request !== companionReachRequest || String(bandId.value) !== requestedBandId) return
      channelReach.value = {
        ...channelReach.value,
        [companion]: reachSummary(data),
      }
      campaignUiLog('reach:received', {
        bandId: bandId.value,
        audienceType: audienceType.value,
        channel: companion,
        recipientCount: data?.eligible,
        productionTestMode: !!data?.productionTestMode,
      })
    } catch {
      // The selected channel preview remains authoritative. A companion
      // comparison is helpful context, never a reason to block composing.
      campaignUiLog('reach:error', {
        bandId: bandId.value,
        audienceType: audienceType.value,
        channel: companion,
      })
    }
  }

  const maxSubject = computed(() => preview.value?.maxSubjectLength || 140)
  const maxNote = computed(() => preview.value?.maxNoteLength || 1200)
  const productionTestMode = computed(() => !!preview.value?.productionTestMode)
  const canSendAudience = computed(() => !!preview.value?.canSend && (preview.value?.eligible || 0) > 0)

  const subjectLimit = computed(() => {
    if (!productionTestMode.value) return maxSubject.value
    return Math.max(8, maxSubject.value - '[TEST] '.length)
  })

  const defaultSubjectPlain = computed(() => stripTestSubjectPrefix(preview.value?.defaultSubject || ''))

  const displaySubject = computed(() =>
    formatPreviewSubject(subject.value, productionTestMode.value)
  )

  const canReview = computed(() => {
    return (
      !submitting.value &&
      canSendAudience.value &&
      (isInbox.value || stripTestSubjectPrefix(subject.value).trim().length > 0) &&
      (note.value.trim().length > 0 || (isInbox.value && Boolean(artistUpdateId.value)))
    )
  })

  const hasUnsavedWork = computed(() => {
    if (step.value === 'success' || step.value === 'sending') return false
    if (submitting.value) return true
    if (artistUpdateId.value) return true
    return drafts.isSubstantial({
      subject: stripTestSubjectPrefix(subject.value),
      note: note.value,
      defaultSubject: defaultSubjectPlain.value,
    })
  })

  const previewStatusText = computed(() => {
    if (loadError.value) return "Couldn't check your audience."
    if (!preview.value && !loadingPreview.value) return ''
    return composerReachCopy({
      audienceType: audienceType.value,
      eligible: preview.value?.eligible || 0,
      unavailable: preview.value?.unavailable || 0,
      loading: loadingPreview.value,
      testMode: productionTestMode.value,
    })
  })

  const emptyReason = computed(() => preview.value?.reason || '')
  const emptyHeading = computed(() => {
    if (emptyReason.value === 'all_cooling') {
      return isInbox.value
        ? 'No eligible Faneqo fans are available right now.'
        : 'Everyone eligible was emailed recently.'
    }
    if (emptyReason.value === 'no_recipients') return 'No eligible fans yet'
    return 'Messaging isn’t available right now'
  })

  function persistDraft() {
    if (!bandId.value || step.value === 'success') return
    drafts.setDraft(bandId.value, draftAudienceKey.value, {
      subject: stripTestSubjectPrefix(subject.value),
      note: note.value,
    })
  }

  const persistDraftDebounced = useDebounceFn(persistDraft, 280)

  function hydrateDraft() {
    if (!bandId.value || hydratedDraft) return
    const saved = drafts.getDraft(bandId.value, draftAudienceKey.value)
    if (saved.subject) subject.value = stripTestSubjectPrefix(saved.subject)
    if (saved.note) note.value = saved.note
    hydratedDraft = true
  }

  async function loadPreview() {
    if (!bandId.value) return
    loadingPreview.value = true
    loadError.value = ''
    previewRequestId = newComposerRequestId()
    const requestedChannel = channel.value
    campaignUiLog('preview:start', {
      requestId: previewRequestId,
      bandId: bandId.value,
      audienceType: audienceType.value,
      channel: requestedChannel,
    })
    try {
      const data = await previewAudience({
        bandId: bandId.value,
        audienceType: audienceType.value,
        audienceReference: unref(options.audienceReference) || null,
        channel: requestedChannel,
        artistUpdateId: artistUpdateId.value,
      })
      if (channel.value !== requestedChannel) return
      preview.value = data
      channelReach.value = {
        ...channelReach.value,
        [requestedChannel]: reachSummary(data),
      }
      if (!isInbox.value && !stripTestSubjectPrefix(subject.value) && data?.defaultSubject) {
        subject.value = stripTestSubjectPrefix(data.defaultSubject)
      }
      campaignUiLog('preview:received', {
        requestId: previewRequestId,
        canSend: data?.canSend,
        recipientCount: data?.eligible,
        productionTestMode: !!data?.productionTestMode,
        channel: requestedChannel,
        reason: data?.reason || undefined,
      })
      loadCompanionReach(requestedChannel)
    } catch (err) {
      loadError.value =
        err?.data?.error?.message || err?.message || "Couldn't check your audience."
      campaignUiLog('preview:error', {
        requestId: previewRequestId,
        bandId: bandId.value,
      })
    } finally {
      loadingPreview.value = false
    }
  }

  function goReview() {
    error.value = ''
    if (!canReview.value) {
      if (!isInbox.value && !stripTestSubjectPrefix(subject.value).trim()) error.value = 'Add a subject line before sending.'
      else if (!note.value.trim() && !artistUpdateId.value) error.value = 'Write a short note or choose a gallery before sending.'
      return
    }
    persistDraft()
    step.value = 'review'
    campaignUiLog('review:open', {
      bandId: bandId.value,
      audienceType: audienceType.value,
      channel: channel.value,
      recipientCount: preview.value?.eligible,
      productionTestMode: productionTestMode.value,
    })
  }

  function backToEdit() {
    error.value = ''
    step.value = 'compose'
    campaignUiLog('review:back', { bandId: bandId.value })
  }

  async function send() {
    if (!canReview.value || submitting.value || step.value !== 'review') return { ok: false }
    submitting.value = true
    error.value = ''
    step.value = 'sending'
    campaignUiLog('campaign:create:start', {
      bandId: bandId.value,
      audienceType: audienceType.value,
      recipientCount: preview.value?.eligible,
      productionTestMode: productionTestMode.value,
    })

    try {
      const result = await createCampaign({
        bandId: bandId.value,
        audienceType: audienceType.value,
        audienceReference: unref(options.audienceReference) || null,
        subject: stripTestSubjectPrefix(subject.value).trim(),
        note: note.value.trim(),
        name: campaignName.value,
        channel: channel.value,
        artistUpdateId: artistUpdateId.value,
      })

      campaignId.value = result?.campaignId || result?.id || null
      recipientCount.value = result?.recipientCount || preview.value?.eligible || 0
      drafts.clearDraft(bandId.value, draftAudienceKey.value)
      allowLeave.value = true
      step.value = 'success'
      campaignUiLog('campaign:create:success', {
        campaignId: campaignId.value,
        recipientCount: recipientCount.value,
      })
      return { ok: true }
    } catch (err) {
      error.value =
        err?.data?.error?.message || err?.message || `Could not queue this ${isInbox.value ? 'inbox message' : 'email'}. Try again.`
      step.value = 'review'
      campaignUiLog('campaign:create:error', { bandId: bandId.value })
      return { ok: false }
    } finally {
      submitting.value = false
    }
  }

  function requestLeave(to) {
    if (allowLeave.value || !hasUnsavedWork.value) return true
    pendingLeaveTo.value = to || null
    leaveGuardOpen.value = true
    campaignUiLog('composer:leave-guard', { bandId: bandId.value })
    return false
  }

  function cancelLeave() {
    leaveGuardOpen.value = false
    pendingLeaveTo.value = null
  }

  function confirmLeave() {
    allowLeave.value = true
    leaveGuardOpen.value = false
    return pendingLeaveTo.value
  }

  watch([subject, note], () => {
    persistDraftDebounced()
  })

  watch(channel, (nextChannel, previousChannel) => {
    if (bandId.value && previousChannel) {
      drafts.setDraft(bandId.value, `${audienceType.value}:${previousChannel}`, {
        subject: stripTestSubjectPrefix(subject.value),
        note: note.value,
      })
    }
    subject.value = ''
    note.value = ''
    hydratedDraft = false
    preview.value = null
    error.value = ''
    step.value = 'compose'
    hydrateDraft()
    loadPreview()
  })

  watch(artistUpdateId, () => {
    preview.value = null
    channelReach.value = { in_app: null, email: null }
    error.value = ''
    if (bandId.value) loadPreview()
  })

  watch(
    bandId,
    (id, prev) => {
      if (id !== prev) {
        hydratedDraft = false
        companionReachRequest += 1
        channelReach.value = { in_app: null, email: null }
      }
      if (!id) return
      hydrateDraft()
      campaignUiLog('composer:open', {
        bandId: id,
        audienceType: audienceType.value,
      })
      loadPreview()
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    persistDraft()
  })

  return {
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
    maxSubject,
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
    requestLeave,
    cancelLeave,
    confirmLeave,
    allowLeave,
    persistDraft,
  }
}
