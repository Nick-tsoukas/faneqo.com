<template>
  <div class="dev">
    <p v-if="!hideRail" class="dev__rail">Fan check-in · local only</p>
    <nav v-if="!hideRail" class="dev__nav">
      <NuxtLink v-for="row in states" :key="row.id" :to="`/__dev/check-in?state=${row.id}`">
        {{ row.id }}
      </NuxtLink>
    </nav>

    <ShowCheckInModal
      v-if="!isBadge"
      :is-open="true"
      :band-id="1"
      band-name="The Rockers"
      band-slug="therockers"
      :band-image="bandImage"
      :band-image-url="bandImage.url"
      :image-focal-x="50"
      :image-focal-y="28"
      show-title="The Rad Spot"
      venue="The Rad Spot"
      city="Nashville"
      show-date="2026-09-06T21:00:00"
      event-id="12"
      campaign-id="sm_preview"
      :fan-email="preview.email || ''"
      :preview="preview"
      @close="onClose"
    />

    <ShowCheckInBadgeModal
      v-else
      :is-open="true"
      :attendance-data="badgeAttendance"
      band-slug="therockers"
      preview-state="failed"
      @close="onClose"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ShowCheckInModal from '~/components/band/ShowCheckInModal.vue'
import ShowCheckInBadgeModal from '~/components/band/ShowCheckInBadgeModal.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const hideRail = computed(() => String(route.query.rail || '') === '0')

const states = [
  { id: 'idle' },
  { id: 'idle-new' },
  { id: 'identity' },
  { id: 'submitting' },
  { id: 'success' },
  { id: 'already' },
  { id: 'error' },
  { id: 'badge-failed' },
]

const bandImage = {
  url: 'https://qrcode101.s3.us-east-1.amazonaws.com/moondoug_6829e46a19.jpg',
  width: 1600,
  height: 2000,
  alternativeText: 'The Rockers',
}

const previewByState = {
  idle: { state: 'idle', email: 'fan2@gmail.com' },
  'idle-new': { state: 'idle', email: '' },
  identity: { state: 'identity_needed', email: '' },
  submitting: { state: 'submitting', email: 'fan2@gmail.com' },
  success: { state: 'success', email: 'fan2@gmail.com' },
  already: { state: 'already_checked_in', email: 'fan2@gmail.com' },
  error: {
    state: 'error',
    email: 'fan2@gmail.com',
    errorMessage: 'Unable to check in. Please try again.',
  },
}

const stateId = computed(() => String(route.query.state || 'idle'))
const isBadge = computed(() => stateId.value === 'badge-failed')
const preview = computed(() => previewByState[stateId.value] || previewByState.idle)

const badgeAttendance = {
  attendanceId: 1,
  fanId: 2,
  bandId: 1,
  bandName: 'The Rockers',
  bandImageUrl: bandImage.url,
  bandSlug: 'therockers',
  eventId: 12,
  showTitle: 'The Rad Spot',
  venue: 'The Rad Spot',
  city: 'Nashville',
  checkedInAt: '2026-09-06T21:00:00.000Z',
  confidenceScore: 80,
}

function onClose() {
  // Lab stays open so screenshots remain stable.
}
</script>

<style scoped>
.dev {
  min-height: 100dvh;
  background: #050608;
}

.dev__rail {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 100000001;
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.35);
  pointer-events: none;
}

.dev__nav {
  position: fixed;
  left: 12px;
  top: 12px;
  z-index: 100000001;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 42vw;
}

.dev__nav a {
  font-size: 11px;
  color: rgba(245, 245, 246, 0.55);
  text-decoration: none;
}

.dev__nav a.router-link-exact-active {
  color: #f5f5f6;
}
</style>
