<template>
  <div class="pulse-card bg-gradient-to-br from-gray-900/95 to-black border border-white/10 rounded-2xl p-5 w-72">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-white/60 text-xs font-medium uppercase tracking-wider">Momentum</h3>
      <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
    </div>

    <!-- Status -->
    <div class="flex items-center gap-3 mb-4">
      <span class="text-2xl">🔥</span>
      <div>
        <div class="text-xl font-bold text-amber-400">HEATING UP</div>
        <div class="text-white/50 text-sm">+23% vs last week</div>
      </div>
    </div>

    <!-- Mini chart placeholder -->
    <div class="h-12 flex items-end gap-1">
      <div class="flex-1 bg-purple-500/30 rounded-t" style="height: 40%" />
      <div class="flex-1 bg-purple-500/40 rounded-t" style="height: 55%" />
      <div class="flex-1 bg-purple-500/50 rounded-t" style="height: 45%" />
      <div class="flex-1 bg-purple-500/60 rounded-t" style="height: 70%" />
      <div class="flex-1 bg-purple-500/70 rounded-t" style="height: 60%" />
      <div class="flex-1 bg-purple-500/80 rounded-t" style="height: 85%" />
      <div class="flex-1 bg-purple-400 rounded-t" style="height: 100%" />
    </div>

    <!-- Footer -->
    <div class="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
      <span class="text-white/40 text-xs">Last 7 days</span>
      <span class="text-purple-400 text-xs">View details →</span>
    </div>
  </div>
</template>

<script setup>
// Placeholder - will be swapped with real Pulse component
</script>

<style scoped>
.pulse-card {
  box-shadow: 
    0 0 50px rgba(251, 191, 36, 0.08),
    0 20px 40px -15px rgba(0, 0, 0, 0.4);
}
</style>
