<template>
  <div class="space-y-6">
    <!-- Scene Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Agency Dashboard</h1>
      <p class="text-white/60 text-lg">Manage your entire roster from one dashboard.</p>
    </div>

    <!-- Three Column Layout -->
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Roster -->
      <div class="bg-gradient-to-b from-white/5 to-black/40 border border-white/10 rounded-2xl p-5">
        <h3 class="text-white font-semibold text-lg mb-4">Roster</h3>
        <div class="space-y-3">
          <div
            v-for="band in demoBands"
            :key="band.id"
            class="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/5 transition cursor-pointer"
          >
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold">
              {{ band.name.charAt(0) }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-white font-medium truncate">{{ band.name }}</div>
              <div class="text-white/50 text-sm">{{ band.genre }}</div>
            </div>
            <div class="shrink-0">
              <div :class="[
                'w-2 h-2 rounded-full',
                band.id === 'neon-avenue' ? 'bg-green-400' :
                band.id === 'steel-horizon' ? 'bg-yellow-400' :
                'bg-blue-400',
              ]" />
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 gap-2 mt-4">
          <div class="bg-black/30 border border-white/10 rounded-lg p-3 text-center">
            <div class="text-xl font-bold text-white">3</div>
            <div class="text-white/50 text-xs">Artists</div>
          </div>
          <div class="bg-black/30 border border-white/10 rounded-lg p-3 text-center">
            <div class="text-xl font-bold text-white">9</div>
            <div class="text-white/50 text-xs">Upcoming Shows</div>
          </div>
        </div>
      </div>

      <!-- Signals Feed -->
      <div class="bg-gradient-to-b from-white/5 to-black/40 border border-white/10 rounded-2xl p-5">
        <h3 class="text-white font-semibold text-lg mb-4">Signals</h3>
        <div class="space-y-3">
          <div
            v-for="signal in signals"
            :key="signal.id"
            :class="[
              'px-4 py-3 rounded-xl border transition',
              signal.type === 'hot' ? 'border-orange-400/30 bg-orange-500/10' :
              signal.type === 'spike' ? 'border-purple-400/30 bg-purple-500/10' :
              signal.type === 'new' ? 'border-green-400/30 bg-green-500/10' :
              'border-white/10 bg-black/30',
            ]"
          >
            <div class="flex items-start gap-3">
              <span class="text-xl shrink-0">{{ signal.icon }}</span>
              <div class="min-w-0">
                <div class="text-white text-sm font-medium">{{ signal.title }}</div>
                <div class="text-white/50 text-xs mt-0.5">{{ signal.detail }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks -->
      <div class="bg-gradient-to-b from-white/5 to-black/40 border border-white/10 rounded-2xl p-5">
        <h3 class="text-white font-semibold text-lg mb-4">Tasks</h3>
        <div class="space-y-2">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/10 bg-black/30"
          >
            <input
              type="checkbox"
              :checked="task.done"
              class="mt-0.5 w-4 h-4 rounded border-white/30 bg-black/50 text-purple-500 focus:ring-purple-500/50"
              @change="task.done = !task.done"
            />
            <div class="min-w-0">
              <div :class="['text-sm', task.done ? 'text-white/40 line-through' : 'text-white']">
                {{ task.title }}
              </div>
              <div class="text-white/50 text-xs mt-0.5">{{ task.band }}</div>
            </div>
          </div>
        </div>

        <!-- Add Task (mock) -->
        <button
          type="button"
          class="w-full mt-4 py-2 rounded-lg border border-dashed border-white/20 text-white/50 text-sm hover:border-white/40 hover:text-white/70 transition"
        >
          + Add task
        </button>
      </div>
    </div>

    <!-- Aggregate Stats -->
    <div class="bg-gradient-to-b from-white/5 to-black/40 border border-white/10 rounded-2xl p-5">
      <h3 class="text-white font-semibold text-lg mb-4">Roster Performance</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-white tabular-nums">{{ totalVisits }}</div>
          <div class="text-white/50 text-xs">Total Visits</div>
        </div>
        <div class="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-white tabular-nums">{{ totalPlays }}</div>
          <div class="text-white/50 text-xs">Total Plays</div>
        </div>
        <div class="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-white tabular-nums">{{ totalFollows }}</div>
          <div class="text-white/50 text-xs">New Follows</div>
        </div>
        <div class="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-white tabular-nums">{{ totalMoments }}</div>
          <div class="text-white/50 text-xs">Moments</div>
        </div>
        <div class="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400 tabular-nums">+{{ growthPercent }}%</div>
          <div class="text-white/50 text-xs">This Week</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDemoShow } from '@/composables/useDemoShow'

const { demoStats, demoBands } = useDemoShow()

const signals = ref([
  { id: 1, type: 'hot', icon: '🔥', title: 'Chicago heating up', detail: 'Neon Avenue · +45% visits this week' },
  { id: 2, type: 'spike', icon: '📈', title: 'Shares spiking', detail: 'Steel Horizon · 12 new shares today' },
  { id: 3, type: 'new', icon: '✨', title: 'New fan cluster', detail: 'Luna Wave · Austin, TX emerging' },
  { id: 4, type: 'info', icon: '📍', title: 'Route suggestion', detail: 'Consider adding Denver to spring tour' },
])

const tasks = ref([
  { id: 1, title: 'Post recap from LA show', band: 'Neon Avenue', done: false },
  { id: 2, title: 'Follow up with Chicago venue', band: 'Steel Horizon', done: false },
  { id: 3, title: 'Review Austin ticket sales', band: 'Luna Wave', done: true },
  { id: 4, title: 'Schedule social posts for release', band: 'Neon Avenue', done: false },
])

const totalVisits = computed(() => demoStats.value.profileVisits * 3)
const totalPlays = computed(() => (demoStats.value.spotifyClicks + demoStats.value.youtubePlays) * 3)
const totalFollows = computed(() => demoStats.value.follows * 3)
const totalMoments = computed(() => demoStats.value.momentsCreated * 3)
const growthPercent = computed(() => Math.round(12 + (demoStats.value.momentsShared * 0.5)))
</script>
