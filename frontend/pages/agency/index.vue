<template>
  <AgencyLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">Roster Inbox</h1>
          <p class="text-gray-400">Triage your roster's signals and take action</p>
        </div>
        <button
          @click="briefsDrawerOpen = true"
          class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Briefs
        </button>
      </div>

      <!-- V1.2: Daily Brief Strip -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
          <div class="text-xs text-gray-500 mb-1">Top Mover</div>
          <div class="text-white font-medium text-sm truncate">{{ topMover?.bandName || 'N/A' }}</div>
          <div class="text-emerald-400 text-xs">{{ topMover ? formatVelocity(topMover.velocity) : '' }}</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
          <div class="text-xs text-gray-500 mb-1">Hottest City</div>
          <div class="text-white font-medium text-sm truncate">{{ hottestCity?.name || 'N/A' }}</div>
          <div class="text-amber-400 text-xs">Heat {{ hottestCity?.heatScore || 0 }}</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
          <div class="text-xs text-gray-500 mb-1">Overdue Tasks</div>
          <div class="text-2xl font-bold" :class="overdueCount > 0 ? 'text-red-400' : 'text-emerald-400'">{{ overdueCount }}</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
          <div class="text-xs text-gray-500 mb-1">Needs Action</div>
          <div class="text-2xl font-bold text-violet-400">{{ needsActionCount }}</div>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search artists by name, city, or genre..."
            class="w-full pl-12 pr-4 py-3 bg-gray-900/60 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <!-- Triage Buckets -->
      <AgencyTriageSection
        bucket="needsAction"
        :items="filteredBuckets.needsAction"
        :initial-expanded="true"
        @open="openArtist"
        @assign="openAssignDrawer"
        @proof="openProofDrawer"
        @handle="handleSignal"
      />

      <AgencyTriageSection
        bucket="heatingUp"
        :items="filteredBuckets.heatingUp"
        :initial-expanded="true"
        @open="openArtist"
        @assign="openAssignDrawer"
        @proof="openProofDrawer"
        @handle="handleSignal"
      />

      <AgencyTriageSection
        bucket="watching"
        :items="filteredBuckets.watching"
        :initial-expanded="false"
        @open="openArtist"
        @assign="openAssignDrawer"
        @proof="openProofDrawer"
        @handle="handleSignal"
      />

      <AgencyTriageSection
        bucket="cooling"
        :items="filteredBuckets.cooling"
        :initial-expanded="false"
        @open="openArtist"
        @assign="openAssignDrawer"
        @proof="openProofDrawer"
        @handle="handleSignal"
      />

      <!-- Empty State -->
      <div v-if="totalCount === 0" class="text-center py-12">
        <div class="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 class="text-white font-medium mb-1">All caught up!</h3>
        <p class="text-gray-500 text-sm">No unhandled signals in your roster</p>
      </div>
    </div>

    <!-- Drawers -->
    <AgencyAssignOwnerDrawer
      :is-open="assignDrawerOpen"
      :band-id="selectedBandId"
      @close="assignDrawerOpen = false"
    />

    <AgencyProofDrawer
      :is-open="proofDrawerOpen"
      :signal="selectedSignal"
      @close="proofDrawerOpen = false"
    />

    <!-- V1.2: Briefs Drawer -->
    <AgencyBriefsDrawer
      :is-open="briefsDrawerOpen"
      @close="briefsDrawerOpen = false"
    />
  </AgencyLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

definePageMeta({
  layout: 'agency'
})

useHead({
  title: 'Roster Inbox - Agency Portal',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const router = useRouter()
const store = useAgencyPortalStore()

const searchQuery = ref('')
const assignDrawerOpen = ref(false)
const proofDrawerOpen = ref(false)
const briefsDrawerOpen = ref(false)
const selectedBandId = ref(null)
const selectedSignal = ref(null)

// V1.2: Daily Brief Strip data with safe number formatting
const topMover = computed(() => store.topMovers[0] || null)
const hottestCity = computed(() => store.cityHeatScores[0] || null)
const overdueCount = computed(() => {
  const count = store.overdueTasks?.length
  return Number.isFinite(count) ? count : 0
})
const needsActionCount = computed(() => {
  const count = store.triageBuckets?.needsAction?.length
  return Number.isFinite(count) ? count : 0
})

function formatVelocity(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v >= 0 ? `+${Math.round(v)}` : `${Math.round(v)}`
}

const filteredBuckets = computed(() => {
  const buckets = store.triageBuckets
  if (!searchQuery.value) return buckets

  const q = searchQuery.value.toLowerCase()
  const filterFn = (item) => 
    item.band.name.toLowerCase().includes(q) ||
    item.band.genre?.toLowerCase().includes(q) ||
    item.band.homeCity?.toLowerCase().includes(q) ||
    item.topSignal?.context?.city?.toLowerCase().includes(q)

  return {
    needsAction: buckets.needsAction.filter(filterFn),
    heatingUp: buckets.heatingUp.filter(filterFn),
    watching: buckets.watching.filter(filterFn),
    cooling: buckets.cooling.filter(filterFn)
  }
})

const totalCount = computed(() => {
  const b = filteredBuckets.value
  return b.needsAction.length + b.heatingUp.length + b.watching.length + b.cooling.length
})

function openArtist(bandId) {
  router.push(`/agency/artists/${bandId}`)
}

function openAssignDrawer(bandId) {
  selectedBandId.value = bandId
  assignDrawerOpen.value = true
}

function openProofDrawer(signal) {
  selectedSignal.value = signal
  proofDrawerOpen.value = true
}

function handleSignal(signalId) {
  store.handleSignal(signalId)
}
</script>
