<template>
  <div class="fq-slab">
    <MessagesCampaignsPanel
      v-if="model.mode === 'list'"
      :campaigns="model.campaigns"
      :format-status-label="sentStatusLabel"
      :format-campaign-when="formatSentListWhen"
    />
    <FaneqoSentDetail
      v-else
      :campaign="model.campaign"
      :gallery="gallery"
      :back-to="{ path: '/__dev/messages', query: { case: 'sent-list' } }"
      :when="when"
      :band-id="11"
      embedded
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FaneqoSentDetail from '~/components/messages/FaneqoSentDetail.vue'
import MessagesCampaignsPanel from '~/components/messages/MessagesCampaignsPanel.vue'
import {
  formatSentListWhen,
  hydrateSentGallery,
  sentStatusLabel,
} from '~/utils/messages/sentPresentation'

const props = defineProps({
  model: { type: Object, required: true },
})

const gallery = computed(() => {
  if (props.model.mode === 'list') return null
  return hydrateSentGallery(props.model.campaign, props.model.gallery)
})

const when = computed(() => {
  const raw = props.model.campaign?.completedAt || props.model.campaign?.createdAt
  if (!raw) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(raw))
  } catch {
    return ''
  }
})
</script>

<style scoped>
.fq-slab {
  min-height: 100%;
  background: var(--fq-canvas, #07080A);
}
</style>
