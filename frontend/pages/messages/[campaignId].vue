<template>
  <FaneqoSentDetail
    :campaign="display"
    :gallery="liveGallery"
    :loading="loading"
    :error="error"
    :back-to="sentMessagesTo"
    :when="when"
    :band-id="bandId"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import FaneqoSentDetail from '~/components/messages/FaneqoSentDetail.vue'
import { sentMessagesPath } from '~/utils/campaigns/messagesHomeRoutes'
import { resolveComposerBand } from '~/utils/campaigns/resolveComposerBand'
import { hydrateSentGallery } from '~/utils/messages/sentPresentation'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const sentMessagesTo = sentMessagesPath()
const {
  getCampaignDetail,
  pollCampaignStatus,
  isTerminalStatus,
  formatCampaignDateTime,
} = useMessageCampaigns()
const { getById } = useArtistUpdates()
const { getMyBandAccess } = useBandTeam()
const { hint: activeBandHint } = useWorkspaceBand({ permission: 'sendFanMessages' })

const campaign = ref(null)
const liveCounts = ref(null)
const liveGallery = ref(null)
const loading = ref(true)
const error = ref('')
const bandId = ref(null)
let pollHandle = null

const display = computed(() => {
  if (!campaign.value) return null
  return { ...campaign.value, ...(liveCounts.value || {}) }
})

const when = computed(() => formatCampaignDateTime(campaign.value || {}))

useHead({
  title: computed(() => campaign.value ? 'Sent message' : 'Fan message'),
})

function stopPolling() {
  if (pollHandle) {
    pollHandle.stop()
    pollHandle = null
  }
}

function startPollingIfNeeded() {
  stopPolling()
  if (!campaign.value?.id) return
  if (isTerminalStatus(campaign.value.status)) return

  pollHandle = pollCampaignStatus(
    campaign.value.id,
    (status) => {
      liveCounts.value = status
      if (status?.status) {
        campaign.value = { ...campaign.value, status: status.status }
      }
    },
    { fallback: campaign.value }
  )
}

async function loadLiveGallery(row) {
  const id = row?.gallery?.id
  if (!id) {
    liveGallery.value = hydrateSentGallery(row)
    return
  }
  try {
    const result = await getById(id)
    liveGallery.value = hydrateSentGallery(row, result?.data || null)
  } catch {
    liveGallery.value = hydrateSentGallery(row)
  }
}

async function loadBand() {
  try {
    const access = await getMyBandAccess()
    bandId.value = resolveComposerBand(access, activeBandHint.value)?.bandId || null
  } catch {
    bandId.value = null
  }
}

async function load() {
  loading.value = true
  error.value = ''
  stopPolling()
  const id = route.params.campaignId
  if (id === 'inbox' || id === 'compose' || id === 'chat-lab') {
    loading.value = false
    await navigateTo('/messages')
    return
  }
  try {
    const data = await getCampaignDetail(id)
    if (!data) {
      error.value = 'Message not found.'
      campaign.value = null
      return
    }
    campaign.value = data
    liveCounts.value = null
    await Promise.all([loadLiveGallery(data), loadBand()])
    startPollingIfNeeded()
  } catch (err) {
    const status = err?.statusCode || err?.status || err?.response?.status
    if (status === 403) error.value = 'You don’t have access to this message.'
    else if (status === 404) error.value = 'Message not found.'
    else error.value = 'Could not load this message.'
    campaign.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(stopPolling)
</script>
