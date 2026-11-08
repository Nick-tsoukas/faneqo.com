<template>
  <div class="space-y-6">
    <!-- Scene Header -->
    <div class="text-center mb-4">
      <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Proof & Analytics</h1>
      <p class="text-white/60 text-lg">See exactly what's working. Data you can act on.</p>
    </div>

    <!-- Momentum Pulse Badge (Top of Proof) -->
    <div class="flex justify-center mb-6">
      <div :class="[
        'inline-flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-lg',
        momentumState === 'breakout' ? 'border-red-400/50 bg-gradient-to-r from-red-500/20 to-orange-500/10' :
        momentumState === 'heating' ? 'border-orange-400/50 bg-gradient-to-r from-orange-500/20 to-yellow-500/10' :
        momentumState === 'watching' ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-amber-500/10' :
        'border-blue-400/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/10',
      ]">
        <div class="flex flex-col items-center">
          <div class="flex items-center gap-2 mb-1">
            <div :class="[
              'w-3 h-3 rounded-full animate-pulse',
              momentumState === 'breakout' ? 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.6)]' :
              momentumState === 'heating' ? 'bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.6)]' :
              momentumState === 'watching' ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]' :
              'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.6)]',
            ]" />
            <span class="text-white/50 text-xs uppercase tracking-wider">MBQ Pulse</span>
          </div>
          <span :class="momentumColor" class="font-bold text-lg">{{ momentumLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Demo Levers -->
    <div class="flex flex-wrap justify-center gap-4 mb-6">
      <button
        type="button"
        class="px-6 py-3 rounded-xl border border-purple-400/50 bg-purple-500/20 text-purple-200 font-semibold hover:bg-purple-500/30 transition"
        @click="handleFanBurst"
      >
        🚀 Simulate 50 Fans Hit the Link
      </button>
      <button
        type="button"
        class="px-6 py-3 rounded-xl border border-violet-400/50 bg-violet-500/20 text-violet-200 font-semibold hover:bg-violet-500/30 transition"
        @click="handleShares"
      >
        📤 Simulate 10 Shares
      </button>
    </div>

    <!-- REAL Analytics Demo Component -->
    <AnalyticsDemoInline />

    <!-- Recently Posted by Band -->
    <div v-if="recentShares.length > 0" class="mt-8">
      <div class="flex items-center justify-between mb-1">
        <div>
          <span class="text-white/80 text-sm font-semibold">Recently Posted by Band</span>
          <p class="text-white/40 text-xs mt-0.5">Shared from MBQ by the artist/team</p>
        </div>
        <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] uppercase tracking-wider font-semibold">Posted</span>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2 mt-3">
        <div
          v-for="(share, idx) in recentShares.slice(0, 3)"
          :key="idx"
          class="flex-shrink-0 bg-gradient-to-br from-white/5 to-black/30 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 min-w-[240px]"
        >
          <span class="text-2xl">{{ share.platformIcon }}</span>
          <div class="min-w-0 flex-1">
            <div class="text-white text-sm font-medium truncate">{{ share.caption }}</div>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-white/60 text-xs">{{ share.platform }}</span>
              <span class="text-white/30">·</span>
              <span class="text-white/40 text-xs">{{ share.timeAgo }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ready to Share -->
    <div v-if="recentShareables.length > 0" class="mt-6">
      <div class="flex items-center justify-between mb-1">
        <div>
          <span class="text-white/80 text-sm font-semibold">Ready to Share</span>
          <p class="text-white/40 text-xs mt-0.5">Auto-generated from live fan activity</p>
        </div>
        <span class="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-[10px] uppercase tracking-wider font-semibold">Generated</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="card in recentShareables.slice(0, 3)"
          :key="card._instanceId || card.id"
          class="transform scale-[0.92] origin-top"
        >
          <ShareableCard
            :item="card"
            size="compact"
            @select="() => {}"
            @share="() => {}"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDemoState } from '@/composables/useDemoState'
import ShareableCard from '@/components/shareables/ShareableCard.vue'
import AnalyticsDemoInline from '@/components/demo/AnalyticsDemoInline.vue'

const {
  recentShares,
  recentShareables,
  momentumState,
  momentumLabel,
  momentumColor,
  simulateFans,
  simulateShares,
} = useDemoState()

function handleFanBurst() {
  simulateFans(50)
}

function handleShares() {
  simulateShares(10)
}
</script>
