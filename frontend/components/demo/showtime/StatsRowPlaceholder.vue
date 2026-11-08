<template>
  <div class="stats-row flex gap-3">
    <div 
      v-for="stat in stats" 
      :key="stat.label"
      class="stat-tile flex-1 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-xl p-4 text-center"
    >
      <div class="text-2xl font-bold text-white tabular-nums">{{ stat.value }}</div>
      <div class="text-white/50 text-xs mt-1">{{ stat.label }}</div>
    </div>
  </div>
</template>

<script setup>
const stats = [
  { value: '2,847', label: 'Total Scans' },
  { value: '342', label: 'This Week' },
  { value: '89', label: 'Spotify Clicks' },
  { value: '23', label: 'Follows' },
  { value: '34', label: 'Ticket Clicks' },
]
</script>

<style scoped>
.stat-tile {
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
}
</style>
