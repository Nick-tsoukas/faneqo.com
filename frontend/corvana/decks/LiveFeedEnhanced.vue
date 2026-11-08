<template>
  <div class="live-feed-enhanced">
    <!-- Header with Live Indicator -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center">
          <span class="text-lg">📡</span>
        </div>
        <div>
          <h3 class="text-white font-bold">Live Surface Feed</h3>
          <p class="text-white/50 text-xs">Real-time fan activity</p>
        </div>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-400/30 rounded-full">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
        </span>
        <span class="text-emerald-400 text-xs font-semibold">LIVE</span>
      </div>
    </div>

    <!-- Activity Stats Bar -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <div class="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
        <div class="text-xl font-bold text-white">{{ stats.activeNow }}</div>
        <div class="text-white/40 text-[10px] uppercase tracking-wider">Active Now</div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
        <div class="text-xl font-bold text-emerald-400">+{{ stats.lastHour }}</div>
        <div class="text-white/40 text-[10px] uppercase tracking-wider">Last Hour</div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
        <div class="text-xl font-bold text-purple-400">{{ stats.topCity }}</div>
        <div class="text-white/40 text-[10px] uppercase tracking-wider">Top City</div>
      </div>
    </div>

    <!-- Live Feed Items with Animation -->
    <div class="space-y-2 mb-4">
      <TransitionGroup name="feed-item">
        <div 
          v-for="(item, index) in displayedItems" 
          :key="item.id"
          class="feed-item-card"
          :class="{ 'is-new': index === 0 && isNewItem }"
        >
          <div class="flex items-center gap-3">
            <!-- Icon -->
            <div 
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform"
              :class="getIconBgClass(item.type)"
            >
              <span class="text-lg">{{ getIcon(item.type) }}</span>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-white font-medium text-sm">{{ item.headline }}</span>
                <span 
                  v-if="item.strength >= 80" 
                  class="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[9px] font-bold rounded uppercase"
                >
                  Hot
                </span>
              </div>
              <div class="text-white/50 text-xs mt-0.5">{{ item.detail }}</div>
            </div>
            
            <!-- Time & Strength -->
            <div class="text-right shrink-0">
              <div class="text-white/40 text-xs">{{ item.time }}</div>
              <div class="flex items-center gap-1 mt-1 justify-end">
                <div class="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="getStrengthClass(item.strength)"
                    :style="{ width: item.strength + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Momentum Indicator -->
    <div class="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-400/20 rounded-xl p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-lg">🔥</span>
          <span class="text-white font-semibold text-sm">Momentum Score</span>
        </div>
        <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          {{ momentumScore }}
        </div>
      </div>
      <div class="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-1000"
          :style="{ width: momentumScore + '%' }"
        ></div>
      </div>
      <div class="flex justify-between mt-2 text-[10px] text-white/40 uppercase tracking-wider">
        <span>Quiet</span>
        <span>Heating Up</span>
        <span>On Fire</span>
      </div>
    </div>

    <!-- Recent Activity Pulse -->
    <div class="mt-4 flex items-center justify-center gap-1">
      <div 
        v-for="i in 12" 
        :key="i"
        class="w-1 rounded-full bg-gradient-to-t from-purple-500 to-pink-500 transition-all duration-300"
        :style="{ 
          height: getPulseHeight(i) + 'px',
          opacity: getPulseOpacity(i)
        }"
      ></div>
    </div>
    <div class="text-center text-white/30 text-[10px] mt-2 uppercase tracking-wider">
      Activity Pulse — Last 60 Minutes
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  feedItems: {
    type: Array,
    default: () => []
  }
})

const isNewItem = ref(false)
const pulseValues = ref([3, 5, 4, 8, 6, 12, 9, 15, 11, 18, 14, 20])

// Simulated stats
const stats = computed(() => ({
  activeNow: 47,
  lastHour: 156,
  topCity: 'Chicago'
}))

const momentumScore = computed(() => {
  // Calculate from feed items
  if (!props.feedItems.length) return 65
  const avgStrength = props.feedItems.reduce((sum, item) => sum + (item.strength || 50), 0) / props.feedItems.length
  return Math.round(avgStrength)
})

const displayedItems = computed(() => {
  return props.feedItems.slice(0, 5)
})

function getIcon(type) {
  const icons = {
    city_tuning_in: '📍',
    song_play: '🎵',
    new_follower: '👤',
    share_chain: '🔗',
    platform_pull: '📈',
    support: '💜',
    heating_up: '🔥'
  }
  return icons[type] || '✨'
}

function getIconBgClass(type) {
  const classes = {
    city_tuning_in: 'bg-blue-500/20 border border-blue-400/30',
    song_play: 'bg-purple-500/20 border border-purple-400/30',
    new_follower: 'bg-emerald-500/20 border border-emerald-400/30',
    share_chain: 'bg-pink-500/20 border border-pink-400/30',
    platform_pull: 'bg-amber-500/20 border border-amber-400/30',
    support: 'bg-violet-500/20 border border-violet-400/30',
    heating_up: 'bg-orange-500/20 border border-orange-400/30'
  }
  return classes[type] || 'bg-white/10 border border-white/20'
}

function getStrengthClass(strength) {
  if (strength >= 80) return 'bg-gradient-to-r from-orange-500 to-red-500'
  if (strength >= 60) return 'bg-gradient-to-r from-emerald-500 to-teal-500'
  return 'bg-gradient-to-r from-blue-500 to-indigo-500'
}

function getPulseHeight(index) {
  return pulseValues.value[index - 1] || 5
}

function getPulseOpacity(index) {
  return 0.3 + (index / 12) * 0.7
}

// Animate pulse
let pulseInterval
onMounted(() => {
  pulseInterval = setInterval(() => {
    pulseValues.value = pulseValues.value.map(() => 
      Math.floor(Math.random() * 18) + 4
    )
  }, 1500)
})

onUnmounted(() => {
  clearInterval(pulseInterval)
})
</script>

<style scoped>
.live-feed-enhanced {
  background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(20,10,40,0.2) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.5rem;
  padding: 1.5rem;
}

.feed-item-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1rem;
  padding: 0.875rem;
  transition: all 0.3s ease;
}

.feed-item-card:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.15);
  transform: translateX(4px);
}

.feed-item-card.is-new {
  animation: slideIn 0.4s ease-out;
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.05);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.feed-item-enter-active,
.feed-item-leave-active {
  transition: all 0.4s ease;
}

.feed-item-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.feed-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
