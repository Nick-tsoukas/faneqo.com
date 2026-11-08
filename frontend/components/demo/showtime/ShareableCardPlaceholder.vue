<template>
  <div 
    class="shareable-card w-64 bg-gradient-to-br from-gray-900/95 to-black border border-white/10 rounded-2xl overflow-hidden"
    :class="{ 'featured': featured }"
  >
    <!-- Header with stat -->
    <div class="p-4 pb-2">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-3xl font-bold text-white tabular-nums">{{ stat }}</div>
          <div class="text-white/60 text-sm">{{ label }}</div>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="pulseColor" />
          <span class="text-xs text-white/50">{{ timeAgo }}</span>
        </div>
      </div>
    </div>

    <!-- City -->
    <div class="px-4 py-2">
      <div class="flex items-center gap-2">
        <span class="text-lg">📍</span>
        <span class="text-white font-medium">{{ city }}</span>
      </div>
    </div>

    <!-- Preview image placeholder -->
    <div class="mx-4 mb-3 aspect-video rounded-xl bg-gradient-to-br from-purple-900/30 to-black border border-white/5 flex items-center justify-center">
      <span class="text-4xl opacity-50">{{ emoji }}</span>
    </div>

    <!-- Footer actions -->
    <div class="px-4 pb-4 flex gap-2">
      <button class="flex-1 px-3 py-2 text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">
        Caption
      </button>
      <button class="flex-1 px-3 py-2 text-xs text-purple-300 bg-purple-500/20 border border-purple-400/30 rounded-lg hover:bg-purple-500/30 transition">
        Share Link
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stat: { type: [String, Number], default: '127' },
  label: { type: String, default: 'scans today' },
  city: { type: String, default: 'Los Angeles' },
  timeAgo: { type: String, default: '2m ago' },
  emoji: { type: String, default: '🎸' },
  pulseColor: { type: String, default: 'bg-emerald-400' },
  featured: { type: Boolean, default: false }
})
</script>

<style scoped>
.shareable-card {
  box-shadow: 
    0 0 40px rgba(139, 92, 246, 0.08),
    0 20px 40px -15px rgba(0, 0, 0, 0.4);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.shareable-card.featured {
  box-shadow: 
    0 0 80px rgba(139, 92, 246, 0.2),
    0 30px 60px -20px rgba(0, 0, 0, 0.5);
}
</style>
