<template>
  <div class="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4 mt-4">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-white/70 text-sm font-medium flex items-center gap-2">
        <span class="text-green-400">●</span>
        System Status
      </h4>
      <button
        @click="refresh"
        :disabled="loading"
        class="text-white/40 hover:text-white/60 transition-colors"
        title="Refresh"
      >
        <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <div v-if="loading && !status" class="text-white/40 text-xs">Loading...</div>

    <div v-else-if="status" class="grid grid-cols-2 gap-3 text-xs">
      <!-- Auto Moments -->
      <div class="space-y-1">
        <div class="text-white/50 uppercase tracking-wider text-[10px]">Auto Moments</div>
        <div class="flex items-center gap-1.5">
          <span :class="status.auto.active ? 'text-green-400' : 'text-white/30'">●</span>
          <span class="text-white/70">{{ status.auto.active ? 'Active' : 'None' }}</span>
        </div>
        <div v-if="status.auto.lastEvaluatedAt" class="text-white/40">
          Checked {{ formatTimeAgo(status.auto.lastEvaluatedAt) }}
        </div>
      </div>

      <!-- Recaps -->
      <div class="space-y-1">
        <div class="text-white/50 uppercase tracking-wider text-[10px]">Recaps</div>
        <div class="flex items-center gap-1.5">
          <span :class="status.recap.active ? 'text-green-400' : 'text-white/30'">●</span>
          <span class="text-white/70">{{ status.recap.active ? 'Active' : 'None' }}</span>
        </div>
        <div v-if="status.recap.lastEvaluatedAt" class="text-white/40">
          Checked {{ formatTimeAgo(status.recap.lastEvaluatedAt) }}
        </div>
      </div>
    </div>

    <!-- Dev-only Run Now buttons -->
    <div v-if="isDev" class="mt-3 pt-3 border-t border-white/10 flex gap-2">
      <button
        @click="runEvaluator('auto')"
        :disabled="runningAuto"
        class="px-2 py-1 rounded text-[10px] bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 disabled:opacity-50"
      >
        {{ runningAuto ? 'Running...' : 'Run Auto' }}
      </button>
      <button
        @click="runEvaluator('recap')"
        :disabled="runningRecap"
        class="px-2 py-1 rounded text-[10px] bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30 disabled:opacity-50"
      >
        {{ runningRecap ? 'Running...' : 'Run Recap' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'

const props = defineProps({
  bandId: { type: [Number, String], required: true },
})

const emit = defineEmits(['refresh'])

const config = useRuntimeConfig()

const loading = ref(false)
const status = ref(null)
const runningAuto = ref(false)
const runningRecap = ref(false)

const isDev = computed(() => {
  if (typeof window === 'undefined') return false
  return process.dev || window.location.search.includes('dev=1')
})

async function fetchStatus() {
  loading.value = true
  try {
    const res = await fetch(
      `${config.public.strapiUrl}/api/fan-moments/system-status?bandId=${props.bandId}`
    )
    const data = await res.json()
    if (data.ok) {
      status.value = data
    }
  } catch (err) {
    console.error('[SystemStatusCard] Failed to fetch:', err)
  } finally {
    loading.value = false
  }
}

function refresh() {
  fetchStatus()
}

function formatTimeAgo(isoDate) {
  if (!isoDate) return 'never'
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

async function runEvaluator(type) {
  const isAuto = type === 'auto'
  if (isAuto) runningAuto.value = true
  else runningRecap.value = true

  try {
    const endpoint = isAuto ? 'evaluate-auto' : 'evaluate-recap'
    const cronKey = config.public.devCronKey || 'dev_key_123'
    
    const res = await fetch(`${config.public.strapiUrl}/api/fan-moments/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mbq-cron-key': cronKey,
      },
      body: JSON.stringify({ bandId: props.bandId, dryRun: false }),
    })
    
    const data = await res.json()
    console.log(`[SystemStatusCard] ${endpoint} result:`, data)
    
    // Refresh status and notify parent
    await fetchStatus()
    emit('refresh')
  } catch (err) {
    console.error(`[SystemStatusCard] Failed to run ${type}:`, err)
  } finally {
    if (isAuto) runningAuto.value = false
    else runningRecap.value = false
  }
}

onMounted(() => {
  fetchStatus()
})
</script>
