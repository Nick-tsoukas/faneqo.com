<template>
  <div class="top-cities bg-gradient-to-br from-gray-900/95 to-black border border-white/10 rounded-2xl p-5 w-64">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-white/60 text-xs font-medium uppercase tracking-wider">Top Cities</h3>
      <span class="text-white/40 text-xs">7 days</span>
    </div>

    <!-- City rows -->
    <div class="space-y-3">
      <div v-for="city in cities" :key="city.name" class="flex items-center gap-3">
        <span class="w-2 h-2 rounded-full" :class="city.pulseClass" />
        <div class="flex-1">
          <div class="text-white text-sm font-medium">{{ city.name }}</div>
          <div class="text-white/40 text-xs">{{ city.scans }} scans</div>
        </div>
        <div class="text-white/60 text-sm tabular-nums">{{ city.percent }}%</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-3 border-t border-white/5">
      <span class="text-purple-400 text-xs">View all cities →</span>
    </div>
  </div>
</template>

<script setup>
const cities = [
  { name: 'Los Angeles', scans: 847, percent: 32, pulseClass: 'bg-purple-400 animate-pulse' },
  { name: 'New York', scans: 623, percent: 24, pulseClass: 'bg-purple-400/80' },
  { name: 'Austin', scans: 412, percent: 16, pulseClass: 'bg-purple-400/60' },
  { name: 'Nashville', scans: 298, percent: 11, pulseClass: 'bg-purple-400/40' },
  { name: 'Chicago', scans: 187, percent: 7, pulseClass: 'bg-purple-400/30' },
]
</script>

<style scoped>
.top-cities {
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4);
}
</style>
