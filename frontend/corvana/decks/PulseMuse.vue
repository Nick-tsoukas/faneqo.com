<template>
  <div class="pulse-muse-panel">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span class="text-lg">💜</span>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Support Intelligence</h2>
          <p class="text-white/50 text-sm">Pulse + Muse</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
        </span>
        <span class="text-emerald-400 text-xs font-medium">Live</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- LEFT: MBQ PULSE - Real-time support activity -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-1 h-5 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full"></div>
          <h3 class="text-white font-semibold">MBQ Pulse</h3>
          <span class="text-white/40 text-xs">Real-time support signals</span>
        </div>

        <!-- Live Support Feed -->
        <div class="space-y-2">
          <TransitionGroup name="pulse-item">
            <div 
              v-for="item in pulseData.recentSupport" 
              :key="item.id"
              class="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3"
            >
              <div 
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                :class="getPulseIconClass(item.type)"
              >
                {{ getPulseIcon(item.type) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-sm font-medium truncate">{{ item.message }}</div>
                <div class="text-white/40 text-xs">{{ item.time }}</div>
              </div>
              <div v-if="item.amount" class="text-emerald-400 font-bold text-sm">
                +${{ item.amount }}
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Pulse Stats -->
        <div class="grid grid-cols-3 gap-2 mt-4">
          <div class="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-400/20 rounded-xl p-3 text-center">
            <div class="text-2xl font-bold text-white">${{ pulseData.stats.todayTotal }}</div>
            <div class="text-purple-300 text-[10px] uppercase tracking-wider">Today</div>
          </div>
          <div class="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-400/20 rounded-xl p-3 text-center">
            <div class="text-2xl font-bold text-white">{{ pulseData.stats.supporters }}</div>
            <div class="text-emerald-300 text-[10px] uppercase tracking-wider">Supporters</div>
          </div>
          <div class="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-400/20 rounded-xl p-3 text-center">
            <div class="text-2xl font-bold text-white">{{ pulseData.stats.streak }}</div>
            <div class="text-amber-300 text-[10px] uppercase tracking-wider">Day Streak</div>
          </div>
        </div>

        <!-- Pulse Chart Preview -->
        <div class="bg-white/5 border border-white/10 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-white/60 text-xs uppercase tracking-wider">7-Day Trend</span>
            <span class="text-emerald-400 text-xs font-medium">+{{ pulseData.stats.weekChange }}%</span>
          </div>
          <div class="flex items-end gap-1 h-16">
            <div 
              v-for="(bar, i) in pulseData.chartBars" 
              :key="i"
              class="flex-1 rounded-t transition-all duration-500"
              :class="i === pulseData.chartBars.length - 1 ? 'bg-gradient-to-t from-purple-500 to-pink-500' : 'bg-white/20'"
              :style="{ height: bar + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- RIGHT: MBQ MUSE - AI-powered engagement suggestions -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
          <h3 class="text-white font-semibold">MBQ Muse</h3>
          <span class="text-white/40 text-xs">AI engagement insights</span>
        </div>

        <!-- AI Insight Cards -->
        <div class="space-y-3">
          <div 
            v-for="insight in museData.insights" 
            :key="insight.id"
            class="bg-gradient-to-br border rounded-xl p-4 relative overflow-hidden"
            :class="getInsightClass(insight.priority)"
          >
            <div class="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-30"
              :class="getInsightGlow(insight.priority)"
            ></div>
            <div class="relative">
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ insight.icon }}</span>
                  <span 
                    class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    :class="getInsightBadgeClass(insight.priority)"
                  >
                    {{ insight.priority }}
                  </span>
                </div>
                <span class="text-white/40 text-[10px]">{{ insight.time }}</span>
              </div>
              <h4 class="text-white font-semibold text-sm mb-1">{{ insight.title }}</h4>
              <p class="text-white/60 text-xs leading-relaxed">{{ insight.description }}</p>
              <button 
                v-if="insight.action"
                class="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                :class="getInsightButtonClass(insight.priority)"
              >
                {{ insight.action }}
              </button>
            </div>
          </div>
        </div>

        <!-- Muse Prediction -->
        <div class="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-400/20 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-lg">🔮</span>
            <span class="text-white/60 text-xs uppercase tracking-wider">Muse Prediction</span>
          </div>
          <div class="text-white font-medium text-sm mb-2">{{ museData.prediction.headline }}</div>
          <div class="flex items-center gap-3">
            <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000"
                :style="{ width: museData.prediction.confidence + '%' }"
              ></div>
            </div>
            <span class="text-violet-300 text-xs font-medium">{{ museData.prediction.confidence }}%</span>
          </div>
          <p class="text-white/50 text-xs mt-2">{{ museData.prediction.detail }}</p>
        </div>
      </div>
    </div>

    <!-- Bottom: Quick Actions -->
    <div class="mt-6 pt-4 border-t border-white/10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-semibold hover:from-purple-400 hover:to-pink-400 transition">
            <span>💜</span>
            <span>Boost Support CTA</span>
          </button>
          <button class="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-medium hover:bg-white/20 transition">
            <span>📊</span>
            <span>Full Analytics</span>
          </button>
        </div>
        <div class="text-white/40 text-xs">
          Last updated: {{ lastUpdated }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  pulseData: {
    type: Object,
    default: () => ({
      recentSupport: [],
      stats: { todayTotal: 0, supporters: 0, streak: 0, weekChange: 0 },
      chartBars: [30, 45, 35, 60, 50, 75, 90]
    })
  },
  museData: {
    type: Object,
    default: () => ({
      insights: [],
      prediction: { headline: '', confidence: 0, detail: '' }
    })
  }
})

const lastUpdated = computed(() => {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
})

function getPulseIcon(type) {
  const icons = {
    tip: '💜',
    recurring: '🔄',
    first_time: '⭐',
    big_tip: '🎉',
    city: '📍'
  }
  return icons[type] || '💜'
}

function getPulseIconClass(type) {
  const classes = {
    tip: 'bg-purple-500/20',
    recurring: 'bg-blue-500/20',
    first_time: 'bg-amber-500/20',
    big_tip: 'bg-pink-500/20',
    city: 'bg-emerald-500/20'
  }
  return classes[type] || 'bg-purple-500/20'
}

function getInsightClass(priority) {
  const classes = {
    high: 'from-rose-900/30 to-pink-900/20 border-rose-400/30',
    medium: 'from-amber-900/30 to-orange-900/20 border-amber-400/30',
    low: 'from-blue-900/30 to-indigo-900/20 border-blue-400/30'
  }
  return classes[priority] || classes.low
}

function getInsightGlow(priority) {
  const classes = {
    high: 'bg-rose-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-500'
  }
  return classes[priority] || classes.low
}

function getInsightBadgeClass(priority) {
  const classes = {
    high: 'bg-rose-500/20 text-rose-300',
    medium: 'bg-amber-500/20 text-amber-300',
    low: 'bg-blue-500/20 text-blue-300'
  }
  return classes[priority] || classes.low
}

function getInsightButtonClass(priority) {
  const classes = {
    high: 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30',
    medium: 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30',
    low: 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30'
  }
  return classes[priority] || classes.low
}
</script>

<style scoped>
.pulse-muse-panel {
  background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(30,20,50,0.3) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.5rem;
  padding: 1.5rem;
}

.pulse-item-enter-active,
.pulse-item-leave-active {
  transition: all 0.4s ease;
}

.pulse-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.pulse-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
