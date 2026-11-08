<template>
  <div class="insights-panel">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <span class="text-lg">✨</span>
        </div>
        <div>
          <h3 class="text-white font-semibold">Muse Insights</h3>
          <p class="text-white/50 text-xs">
            {{ computedAt ? `Updated ${formatTime(computedAt)}` : 'Intelligence panel' }}
          </p>
        </div>
      </div>
      <button 
        v-if="!loading"
        @click="refresh"
        class="text-white/50 hover:text-white text-xs flex items-center gap-1 transition"
        :class="{ 'animate-spin': loading }"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="h-20 bg-white/5 rounded-xl"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-400/80 text-sm mb-2">{{ error }}</div>
      <button @click="refresh" class="text-purple-400 text-sm hover:underline">Try again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!insights.length" class="text-center py-8">
      <div class="text-white/40 text-sm">No insights yet.</div>
      <div class="text-white/30 text-xs mt-1">Check back when you have more traffic data.</div>
    </div>

    <!-- Insights List -->
    <div v-else class="space-y-3">
      <TransitionGroup name="insight">
        <div 
          v-for="insight in sortedInsights" 
          :key="insight.key"
          class="insight-card"
          :class="severityClass(insight.severity)"
        >
          <!-- Header Row -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-lg shrink-0">{{ severityIcon(insight.severity) }}</span>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-white font-medium text-sm truncate">{{ insight.title }}</h4>
                  <span 
                    v-if="insight.category" 
                    class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 uppercase tracking-wide"
                  >
                    {{ insight.category }}
                  </span>
                </div>
                <p class="text-white/70 text-xs mt-0.5">{{ insight.summary }}</p>
              </div>
            </div>
            
            <!-- Confidence Bar -->
            <div class="shrink-0 flex flex-col items-end gap-1">
              <div class="text-[10px] text-white/50">{{ insight.confidence }}%</div>
              <div class="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all"
                  :class="confidenceBarClass(insight.confidence)"
                  :style="{ width: `${insight.confidence}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Why Section (Expandable) -->
          <div v-if="insight.why?.length" class="mt-3">
            <button 
              @click="toggleWhy(insight.key)"
              class="flex items-center gap-1 text-white/50 hover:text-white/70 text-xs transition"
            >
              <svg 
                class="w-3 h-3 transition-transform" 
                :class="{ 'rotate-90': expandedWhy[insight.key] }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              Why we think this
            </button>
            
            <Transition name="expand">
              <ul v-if="expandedWhy[insight.key]" class="mt-2 space-y-1 pl-4 border-l border-white/10">
                <li 
                  v-for="(reason, i) in insight.why" 
                  :key="i"
                  class="text-white/50 text-xs"
                >
                  {{ reason }}
                </li>
              </ul>
            </Transition>
          </div>

          <!-- Recommended Actions -->
          <div v-if="insight.recommendedActions?.length" class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="(action, i) in insight.recommendedActions"
              :key="i"
              @click="handleAction(action, insight)"
              class="action-btn"
              :class="actionClass(action.type)"
            >
              <span v-if="action.type === 'navigate'" class="mr-1">→</span>
              {{ action.label }}
            </button>
          </div>

          <!-- Data Window -->
          <div class="mt-2 text-white/30 text-[10px]">
            Based on {{ insight.window || '7d' }} of data
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Footer -->
    <div v-if="insights.length" class="mt-4 pt-3 border-t border-white/10 text-center">
      <div class="text-white/30 text-[10px]">
        {{ insights.length }} insight{{ insights.length !== 1 ? 's' : '' }} • 
        Updated {{ formatTime(generatedAt) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  bandId: {
    type: [Number, String],
    required: true,
  },
  autoLoad: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['action', 'loaded'])

const loading = ref(false)
const error = ref(null)
const insights = ref([])
const generatedAt = ref(null)
const computedAt = ref(null)
const expandedWhy = ref({})

const client = useStrapiClient()

const sortedInsights = computed(() => {
  const severityOrder = { critical: 0, warning: 1, good: 2, info: 3 }
  return [...insights.value].sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevDiff !== 0) return sevDiff
    return b.confidence - a.confidence
  })
})

function severityIcon(severity) {
  const icons = {
    critical: '🔴',
    warning: '🟡',
    good: '🟢',
    info: '💡',
  }
  return icons[severity] || '💡'
}

function severityClass(severity) {
  const classes = {
    critical: 'border-red-500/30 bg-red-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    good: 'border-green-500/30 bg-green-500/5',
    info: 'border-white/10 bg-white/5',
  }
  return classes[severity] || classes.info
}

function confidenceClass(confidence) {
  if (confidence >= 80) return 'bg-green-500/20 text-green-400'
  if (confidence >= 60) return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-white/10 text-white/50'
}

function confidenceBarClass(confidence) {
  if (confidence >= 80) return 'bg-green-500'
  if (confidence >= 60) return 'bg-yellow-500'
  return 'bg-white/40'
}

function actionClass(type) {
  if (type === 'navigate') return 'action-btn-primary'
  return 'action-btn-secondary'
}

function toggleWhy(key) {
  expandedWhy.value[key] = !expandedWhy.value[key]
}

function handleAction(action, insight) {
  emit('action', { action, insight })
  
  if (action.type === 'navigate' && action.route) {
    const route = action.route.replace('{bandId}', props.bandId)
    navigateTo(route)
  }
}

function formatTime(iso) {
  if (!iso) return 'just now'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return d.toLocaleDateString()
}

async function fetchInsights() {
  if (!props.bandId) return
  
  loading.value = true
  error.value = null
  
  try {
    // Authenticated client: insights require analytics access to the band.
    const res = await client('/muse/insights', {
      params: { bandId: props.bandId },
    })
    
    if (res.ok) {
      insights.value = res.insights || []
      generatedAt.value = res.generatedAt
      computedAt.value = res.computedAt || res.generatedAt
      emit('loaded', { insights: insights.value, computedAt: computedAt.value })
    } else {
      throw new Error(res.error || 'Failed to load insights')
    }
  } catch (err) {
    console.error('[InsightsPanel] Error:', err)
    error.value = err.message || 'Failed to load insights'
  } finally {
    loading.value = false
  }
}

function refresh() {
  fetchInsights()
}

watch(() => props.bandId, () => {
  if (props.autoLoad) fetchInsights()
})

onMounted(() => {
  if (props.autoLoad) fetchInsights()
})

defineExpose({ refresh, fetchInsights })
</script>

<style scoped>
.insights-panel {
  @apply bg-black/30 border border-white/10 rounded-2xl p-4;
}

.insight-card {
  @apply p-4 rounded-xl border transition-all duration-300;
}

.insight-card:hover {
  @apply border-white/20;
}

.action-btn {
  @apply px-3 py-1.5 rounded-lg text-xs font-medium transition-all;
}

.action-btn-primary {
  @apply bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30;
}

.action-btn-secondary {
  @apply bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10;
}

/* Transitions */
.insight-enter-active,
.insight-leave-active {
  transition: all 0.3s ease;
}

.insight-enter-from,
.insight-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 200px;
}
</style>
