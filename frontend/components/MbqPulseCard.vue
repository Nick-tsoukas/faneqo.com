<template>
  <div class="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5 mb-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <h3 class="text-white font-semibold">MBQ Pulse</h3>
        <span
          :class="[
            'px-2 py-0.5 text-xs font-medium rounded-full',
            momentumClass,
          ]"
        >
          {{ momentumLabel }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <!-- Push Opt-in Toggle -->
        <div v-if="showOptIn" class="flex items-center gap-2">
          <button
            @click="toggleOptIn"
            :disabled="!canOptIn || optInLoading"
            :title="!canOptIn ? 'Account must be at least 7 days old to enable notifications' : ''"
            :class="[
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              pushOptIn ? 'bg-purple-500' : 'bg-gray-700',
              !canOptIn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ]"
          >
            <span
              :class="[
                'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                pushOptIn ? 'translate-x-4.5' : 'translate-x-1',
              ]"
            />
          </button>
          <span class="text-gray-400 text-xs whitespace-nowrap">
            🚀 Notify me
          </span>
        </div>
        <span class="text-gray-400 text-xs">{{ rangeLabel }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <span class="text-gray-400 text-sm">Loading pulse data…</span>
    </div>

    <!-- No Data State -->
    <div v-else-if="!pulse || pulse.pulseScore === 0" class="text-center py-6">
      <div class="text-4xl mb-2">📊</div>
      <p class="text-gray-400 text-sm">No activity recorded yet.</p>
      <p class="text-gray-500 text-xs mt-1">Share your link or QR code to start tracking.</p>
    </div>

    <!-- Pulse Data -->
    <div v-else class="grid md:grid-cols-3 gap-4">
      <!-- Pulse Score -->
      <div class="flex flex-col items-center justify-center bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-4">
        <div class="relative w-24 h-24">
          <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              stroke-width="8"
              fill="none"
              class="text-gray-800"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              stroke-width="8"
              fill="none"
              :stroke-dasharray="`${(pulse.pulseScore / 100) * 251.2} 251.2`"
              stroke-linecap="round"
              :class="scoreColorClass"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-2xl font-bold text-white">{{ pulse.pulseScore }}</span>
          </div>
        </div>
        <p class="text-gray-400 text-xs mt-2">Pulse Score</p>
      </div>

      <!-- Drivers -->
      <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-4">
        <p class="text-gray-400 text-xs mb-3 uppercase tracking-wide">Key Drivers</p>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2 text-gray-200">
            <span :class="growthIconClass">{{ growthIcon }}</span>
            <span>{{ growthText }}</span>
          </li>
          <li class="flex items-center gap-2 text-gray-200">
            <span class="text-purple-400">📍</span>
            <span>Top city: <span class="text-white font-medium capitalize">{{ pulse.drivers?.topCity || 'N/A' }}</span></span>
          </li>
          <li class="flex items-center gap-2 text-gray-200">
            <span class="text-blue-400">🔗</span>
            <span>Top source: <span class="text-white font-medium capitalize">{{ pulse.drivers?.topSource || 'direct' }}</span></span>
          </li>
        </ul>
      </div>

      <!-- Next Best Action (commented out - redundant with InsightsPanel)
      <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-4">
        <p class="text-gray-400 text-xs mb-2 uppercase tracking-wide">Next Best Action</p>
        <p class="text-white font-medium text-sm mb-2">{{ pulse.nextBestAction?.title || 'Keep Building' }}</p>
        <p class="text-gray-400 text-xs mb-3">{{ pulse.nextBestAction?.reason || '' }}</p>
        <ul class="space-y-1 mb-3">
          <li
            v-for="(step, i) in (pulse.nextBestAction?.steps || []).slice(0, 3)"
            :key="i"
            class="text-gray-300 text-xs flex items-start gap-2"
          >
            <span class="text-emerald-400 mt-0.5">•</span>
            <span>{{ step }}</span>
          </li>
        </ul>
        <NuxtLink
          v-if="pulse.nextBestAction?.deepLink && pulse.nextBestAction?.cta"
          :to="pulse.nextBestAction.deepLink"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
        >
          {{ pulse.nextBestAction.cta }}
          <span class="text-purple-300">→</span>
        </NuxtLink>
      </div>
      -->
    </div>

    <!-- Dev-only Debug Panel -->
    <div v-if="isDev && bandId" class="mt-4 border-t border-white/10 pt-4">
      <button
        @click="runDryRun"
        :disabled="dryRunLoading"
        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
      >
        {{ dryRunLoading ? 'Running...' : '🔧 Debug Push Eligibility' }}
      </button>
      
      <!-- Dry Run Results -->
      <div v-if="dryRunResult" class="mt-3 p-3 bg-slate-800/50 rounded-lg text-xs">
        <div class="flex items-center gap-2 mb-2">
          <span :class="dryRunResult.evaluation?.eligible ? 'text-emerald-400' : 'text-red-400'">
            {{ dryRunResult.evaluation?.eligible ? '✅ Eligible' : '❌ Not Eligible' }}
          </span>
          <span class="text-gray-500">|</span>
          <span class="text-gray-400">
            {{ dryRunResult.previousMomentum }} → {{ dryRunResult.currentMomentum }}
          </span>
        </div>
        
        <p class="text-gray-400 mb-2">Reasons:</p>
        <ul class="space-y-1 mb-3">
          <li
            v-for="(reason, i) in dryRunResult.evaluation?.reasons || []"
            :key="i"
            class="text-gray-300 flex items-start gap-1"
          >
            <span class="text-gray-500">•</span>
            <span>{{ reason }}</span>
          </li>
        </ul>
        
        <div v-if="dryRunResult.evaluation?.notification" class="mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
          <p class="text-purple-300 font-medium">Preview:</p>
          <p class="text-white mt-1">{{ dryRunResult.evaluation.notification.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface PulseData {
  pulseScore: number
  momentumState: 'surging' | 'warming' | 'steady' | 'cooling'
  drivers: {
    primaryMetric: string
    growthPct: number
    topSource: string
    topCity: string
    topDevice: string
  }
  nextBestAction: {
    title: string
    reason: string
    steps: string[]
    cta?: string | null
    deepLink?: string | null
  }
}

const props = defineProps<{
  pulse: PulseData | null
  loading: boolean
  rangeLabel: string
  showOptIn?: boolean
  bandId?: number | null
}>()

const client = useStrapiClient()
const config = useRuntimeConfig()

// Dev mode detection
const isDev = computed(() => config.public?.dev === true || process.dev)

// Push opt-in state
const pushOptIn = ref(false)
const canOptIn = ref(false)
const optInLoading = ref(false)

// Dry-run state (dev only)
const dryRunLoading = ref(false)
const dryRunResult = ref<any>(null)

async function fetchOptInStatus() {
  if (!props.showOptIn) return
  try {
    const res = await client('/push/opt-in/status')
    pushOptIn.value = res.pushOptIn || false
    canOptIn.value = res.canOptIn || false
  } catch (err) {
    console.error('[MbqPulseCard] Failed to fetch opt-in status:', err)
  }
}

async function toggleOptIn() {
  if (!canOptIn.value || optInLoading.value) return
  optInLoading.value = true
  try {
    const res = await client('/push/opt-in', { method: 'POST' })
    pushOptIn.value = res.pushOptIn
  } catch (err) {
    console.error('[MbqPulseCard] Failed to toggle opt-in:', err)
  } finally {
    optInLoading.value = false
  }
}

async function runDryRun() {
  if (!props.bandId || dryRunLoading.value) return
  dryRunLoading.value = true
  dryRunResult.value = null
  try {
    const res = await client('/analytics/push/dry-run', {
      params: { bandId: props.bandId, range: '30d' }
    })
    dryRunResult.value = res
  } catch (err) {
    console.error('[MbqPulseCard] Dry-run failed:', err)
    dryRunResult.value = { error: 'Failed to run dry-run' }
  } finally {
    dryRunLoading.value = false
  }
}

onMounted(() => {
  if (props.showOptIn) {
    fetchOptInStatus()
  }
})

const momentumClass = computed(() => {
  if (!props.pulse) return 'bg-gray-700 text-gray-300'
  switch (props.pulse.momentumState) {
    case 'surging':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    case 'warming':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    case 'cooling':
      return 'bg-red-500/20 text-red-300 border border-red-500/30'
    default:
      return 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
  }
})

const momentumLabel = computed(() => {
  if (!props.pulse) return 'No Data'
  switch (props.pulse.momentumState) {
    case 'surging':
      return '🚀 Surging'
    case 'warming':
      return '📈 Warming'
    case 'cooling':
      return '📉 Cooling'
    default:
      return '➡️ Steady'
  }
})

const scoreColorClass = computed(() => {
  if (!props.pulse) return 'text-gray-600'
  const score = props.pulse.pulseScore
  if (score >= 70) return 'text-emerald-500'
  if (score >= 40) return 'text-amber-500'
  return 'text-red-500'
})

const growthIcon = computed(() => {
  if (!props.pulse) return '➡️'
  const pct = props.pulse.drivers?.growthPct || 0
  if (pct > 0) return '📈'
  if (pct < 0) return '📉'
  return '➡️'
})

const growthIconClass = computed(() => {
  if (!props.pulse) return 'text-gray-400'
  const pct = props.pulse.drivers?.growthPct || 0
  if (pct > 0) return 'text-emerald-400'
  if (pct < 0) return 'text-red-400'
  return 'text-gray-400'
})

const growthText = computed(() => {
  if (!props.pulse) return 'No change'
  const pct = props.pulse.drivers?.growthPct || 0
  if (pct > 0) return `+${pct}% vs previous period`
  if (pct < 0) return `${pct}% vs previous period`
  return 'No change vs previous period'
})
</script>

