<template>
  <div class="shareables-slider bg-gradient-to-r from-black via-gray-900/50 to-black border-t border-white/5 py-4">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 mb-3">
      <h3 class="text-white/60 text-xs font-medium uppercase tracking-wider">Recent Shareables</h3>
      <span class="text-purple-400 text-xs">View all →</span>
    </div>

    <!-- Slider -->
    <div class="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
      <div 
        v-for="item in items" 
        :key="item.id"
        class="mini-card flex-shrink-0 w-40 bg-gray-900/80 border border-white/10 rounded-xl p-3"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="w-1.5 h-1.5 rounded-full" :class="item.pulseClass" />
          <span class="text-white/50 text-xs">{{ item.timeAgo }}</span>
        </div>
        <div class="text-lg font-bold text-white tabular-nums">{{ item.stat }}</div>
        <div class="text-white/50 text-xs">{{ item.label }}</div>
        <div class="flex items-center gap-1 mt-2 text-white/40 text-xs">
          <span>📍</span>
          <span>{{ item.city }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const items = [
  { id: 1, stat: '127', label: 'scans', city: 'LA', timeAgo: '2m', pulseClass: 'bg-emerald-400 animate-pulse' },
  { id: 2, stat: '89', label: 'clicks', city: 'NYC', timeAgo: '5m', pulseClass: 'bg-amber-400' },
  { id: 3, stat: '45', label: 'follows', city: 'Austin', timeAgo: '12m', pulseClass: 'bg-purple-400' },
  { id: 4, stat: '234', label: 'scans', city: 'Nashville', timeAgo: '18m', pulseClass: 'bg-blue-400' },
  { id: 5, stat: '67', label: 'tickets', city: 'Chicago', timeAgo: '25m', pulseClass: 'bg-pink-400' },
  { id: 6, stat: '156', label: 'scans', city: 'Portland', timeAgo: '32m', pulseClass: 'bg-teal-400' },
]
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.mini-card {
  box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.3);
}
</style>
