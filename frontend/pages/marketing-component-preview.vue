<template>
  <div class="min-h-screen bg-black text-white overflow-x-hidden">
    <!-- Background gradient effects -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute -top-32 left-1/4 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[150px]"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[130px]"></div>
    </div>

    <!-- Dev header -->
    <div class="relative z-10 border-b border-white/5 py-3 px-4 text-center">
      <span class="text-xs text-white/40 uppercase tracking-wider">Component Preview — DemoShowGrowthFlow</span>
    </div>

    <!-- Component -->
    <div class="relative z-10 py-16 sm:py-24 lg:py-32">
      <DemoShowGrowthFlow />
    </div>
  </div>
</template>

<script setup>
import DemoShowGrowthFlow from '@/components/marketing/DemoShowGrowthFlow.vue'

useHead({
  title: 'Component Preview — DemoShowGrowthFlow',
  meta: [{ name: 'robots', content: 'noindex' }]
})
</script>
