<template>
  <div class="dev">
    <p class="dev__rail">Show Mode states · local only</p>
    <nav class="dev__nav">
      <NuxtLink v-for="row in states" :key="row.id" :to="`/__dev/show-mode?state=${row.id}`">
        {{ row.id }}
      </NuxtLink>
    </nav>
    <div class="dev__stage">
      <ShowModeCard
        :band-id="1"
        band-slug="the-rockers"
        :preview="preview"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ShowModeCard from '~/components/dashboard/ShowModeCard.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const states = [
  { id: 'idle-first' },
  { id: 'idle-returning' },
  { id: 'setup' },
  { id: 'live' },
  { id: 'end-confirm' },
  { id: 'generating' },
  { id: 'ready' },
  { id: 'timeout' },
]

const recap = {
  id: 88,
  campaignId: 'sm_preview',
  showTitle: 'hello new show 3',
  venue: 'The Rock',
  city: 'Chicago',
  showStartedAt: '2026-09-03T21:00:00',
  checkedInShowCount: 2,
  fansCaptured: 2,
  newFanCheckIns: 2,
}

const liveStatus = {
  status: 'live',
  enabled: true,
  title: '',
  venue: 'The Rock',
  city: 'Chicago',
  checkIns: 2,
  fansCaptured: 2,
  endsAt: '2026-09-05T22:30:00',
  effectiveEndsAt: '2026-09-05T22:30:00',
  campaignId: 'sm_live',
}

const previews = {
  'idle-first': { uiState: 'idle', latestRecap: null },
  'idle-returning': { uiState: 'idle', latestRecap: recap },
  setup: { uiState: 'idle', latestRecap: recap, setupOpen: true },
  live: { uiState: 'live', status: liveStatus },
  'end-confirm': { uiState: 'live', status: liveStatus, confirmEnd: true },
  generating: {
    uiState: 'recap_generating',
    recapState: 'generating',
    endedCampaignId: 'sm_preview',
    status: {
      title: '',
      venue: 'The Rock',
      city: 'Chicago',
      checkIns: 2,
      fansCaptured: 2,
    },
  },
  ready: { uiState: 'recap_ready', recapState: 'ready', endedRecap: recap, latestRecap: recap },
  timeout: { uiState: 'recap_timeout', recapState: 'timeout', endedCampaignId: 'sm_preview' },
}

const preview = computed(() => {
  const key = String(route.query.state || 'idle-returning')
  return previews[key] || previews['idle-returning']
})
</script>

<style scoped>
.dev {
  min-height: 100dvh;
  padding: 1rem 1rem 5rem;
  background: #050506;
  color: #f5f5f6;
}

.dev__rail {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}

.dev__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.7rem;
  margin-bottom: 1.25rem;
}

.dev__nav a {
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.8125rem;
  text-decoration: none;
}

.dev__nav a.router-link-exact-active {
  color: #f5f5f6;
}

.dev__stage {
  max-width: 42rem;
}
</style>
