<template>
  <div class="compose-page" :style="pageStyle">
    <div v-if="loadingAccess || loadingContext" class="compose-boot" role="status">
      <div class="compose-boot__pulse" aria-hidden="true" />
      <p>Opening composer…</p>
    </div>

    <div v-else-if="contextError" class="compose-denied" role="alert">
      <h1>We couldn’t open that audience</h1>
      <p>{{ contextError }}</p>
      <NuxtLink :to="back.path" class="compose-denied__link">Go back</NuxtLink>
    </div>

    <div v-else-if="!band" class="compose-denied">
      <h1>Messaging is owner-only</h1>
      <p>Fan broadcasts are available to the band owner. Ask the owner if you need access later.</p>
      <NuxtLink to="/dashboard" class="compose-denied__link">Go to Dashboard</NuxtLink>
    </div>

    <div v-else-if="needsNight" class="compose-denied">
      <h1>Choose a Night</h1>
      <p>Pick the show this message is for. People who were there will receive it.</p>
      <MessagesShowPicker @close="onBack" @select="onPickNight" />
    </div>

    <FanCampaignComposer
      v-else
      :band-id="band.bandId"
      :band-name="band.name || ''"
      :audience-type="audience.type"
      :audience-label="audience.label"
      :audience-reference="audience.reference"
      :recap-id="recap?.id || null"
      :show-recap="recap"
      :initial-gallery-id="initialGalleryId"
      :return-to="route.fullPath"
      :back-to="back.path"
      :campaign-name="audience.campaignName"
      :default-channel="defaultChannel"
      @back="onBack"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useBandTeam } from '~/composables/useBandTeam'
import FanCampaignComposer from '~/components/dashboard/fans/FanCampaignComposer.vue'
import MessagesShowPicker from '~/components/messages/MessagesShowPicker.vue'
import { useVisualViewportInset } from '~/composables/useVisualViewportInset'
import { composerBackTarget, resolveComposerBand } from '~/utils/campaigns/resolveComposerBand'
import { campaignUiLog } from '~/utils/campaigns/campaignUiLog'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const { getMyBandAccess } = useBandTeam()
const { hint: activeBandHint, needsPicker } = useWorkspaceBand({
  permission: 'sendFanMessages',
})
const { getRecapDetail } = useShowRecaps()
const { viewportHeight } = useVisualViewportInset()

const loadingAccess = ref(true)
const loadingContext = ref(false)
const contextError = ref('')
const band = ref(null)
const recap = ref(null)
const back = computed(() => composerBackTarget(route.query.from))
const defaultChannel = computed(() => (
  route.query.galleryId || route.query.channel !== 'email' ? 'in_app' : 'email'
))
const initialGalleryId = computed(() => route.query.galleryId || null)
const requestedAudienceType = computed(() => route.query.audienceType === 'show_attendees' ? 'show_attendees' : 'all_fans')
useHead({ title: computed(() => requestedAudienceType.value === 'show_attendees' ? 'Message a show' : 'Message all fans') })
const audience = computed(() => {
  if (requestedAudienceType.value !== 'show_attendees') {
    return { type: 'all_fans', label: 'All fans', reference: null, campaignName: 'Fan List message' }
  }
  const show = recap.value || {}
  const place = show.venue || show.city || show.showTitle || 'this show'
  return {
    type: 'show_attendees',
    label: `Fans from ${place}`,
    reference: show.campaignId || null,
    campaignName: 'Message the Room',
  }
})
const pageStyle = computed(() => ({
  height: viewportHeight.value ? `${viewportHeight.value}px` : '100dvh',
}))
const needsNight = computed(() => (
  requestedAudienceType.value === 'show_attendees'
  && !route.query.recapId
  && !contextError.value
))

function onBack(to) {
  return navigateTo(to || back.value.path)
}

function onPickNight(recap) {
  if (!recap?.id) return
  return navigateTo({
    path: '/messages/compose',
    query: {
      ...route.query,
      audienceType: 'show_attendees',
      recapId: String(recap.id),
    },
  })
}

onMounted(async () => {
  document.documentElement.classList.add('fcc-html-lock')
  try {
    const access = await getMyBandAccess()
    const hinted = activeBandHint.value
    band.value = resolveComposerBand(access, hinted)
    if (!band.value && needsPicker.value) {
      // Composing to the wrong artist's fans is unrecoverable — ask first.
      await navigateTo('/dashboard')
      return
    }
    if (requestedAudienceType.value === 'show_attendees') {
      const recapId = route.query.recapId
      if (!recapId) {
        /* Night picker is the composer entry when no recap is chosen. */
      } else {
        loadingContext.value = true
        recap.value = await getRecapDetail(recapId)
        if (!recap.value?.campaignId) {
          contextError.value = 'That Show Recap is unavailable or does not belong to this band.'
        }
      }
    }
    campaignUiLog('composer:access', {
      bandId: band.value?.bandId,
      audienceType: requestedAudienceType.value,
      from: route.query.from || 'messages',
      hintedBandIgnored: hinted && band.value && String(band.value.bandId) !== String(hinted) ? true : undefined,
    })
  } catch {
    console.warn('[Faneqo Campaigns UI] composer:access-error')
    band.value = null
  } finally {
    loadingContext.value = false
    loadingAccess.value = false
  }
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('fcc-html-lock')
})
</script>

<style scoped>
.compose-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding-top: 0;
  height: 100dvh;
  overflow: hidden;
  background: var(--fq-app-bg, #050506);
}

@media (min-width: 1024px) {
  .compose-page {
    padding-top: var(--header-height, 70px);
  }
}

.compose-page > * {
  flex: 1 1 auto;
  min-height: 0;
}

.compose-boot,
.compose-denied {
  display: grid;
  place-content: center;
  justify-items: center;
  height: 100%;
  padding: 2rem 1.25rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.compose-boot__pulse {
  width: 2rem;
  height: 2rem;
  margin-bottom: 0.85rem;
  border-radius: 999px;
  border: 2px solid rgba(232, 121, 249, 0.22);
  border-top-color: #e879f9;
  animation: compose-spin 0.7s linear infinite;
}

.compose-denied h1 {
  margin: 0;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
}

.compose-denied p {
  margin: 0.5rem 0 1.25rem;
  max-width: 22rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
}

.compose-denied__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.7rem 1.1rem;
  border-radius: 0.85rem;
  background: #f5f5f6;
  color: #0a0b0e;
  font-weight: 650;
  text-decoration: none;
}

@keyframes compose-spin {
  to { transform: rotate(360deg); }
}
</style>

<style>
html.fcc-html-lock,
html.fcc-html-lock body {
  overflow: hidden;
  height: 100%;
}
</style>
