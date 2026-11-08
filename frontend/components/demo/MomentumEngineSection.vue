<template>
  <section class="relative py-16 md:py-24 text-white overflow-hidden">
    <!-- Background glow -->
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-3xl"></div>
    </div>

    <div class="container mx-auto px-6">
      <!-- Section Header -->
      <div class="text-center mb-12">
        <span class="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-purple-300">
          <span class="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_18px_rgba(167,139,250,0.5)]"></span>
          NEW
        </span>
        <h2 class="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-violet-400 to-pink-400">
            Turn Fan Activity Into Shareable Momentum
          </span>
        </h2>
        <p class="mt-4 max-w-2xl mx-auto text-white/70 text-lg leading-relaxed">
          MBQ doesn't just track analytics — it creates post-ready moments you can share in one tap.
        </p>
      </div>

      <!-- Two-column layout -->
      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
        <!-- LEFT: Demo Card Stack -->
        <div class="relative">
          <div class="space-y-3">
            <!-- Card 1: City Heat -->
            <div 
              :class="[
                'relative rounded-xl border bg-gradient-to-br p-4 transition-all duration-500',
                activeCard === 0 
                  ? 'border-purple-400/40 from-purple-900/30 via-black/40 to-violet-900/20 scale-[1.02] shadow-lg shadow-purple-500/10' 
                  : 'border-white/10 from-white/5 to-black/40 opacity-80'
              ]"
              @mouseenter="activeCard = 0"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <span class="text-lg">📍</span>
                  <span class="ml-2 font-semibold text-white">Chicago is heating up</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Hot City
                </span>
              </div>
              <p class="text-white/60 text-sm mb-3">4 fans checked in • last 24h</p>
              
              <!-- Caption pills -->
              <div class="flex gap-1.5 mb-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-purple-600 text-white">Hype</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60">Grateful</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60">Tease</span>
              </div>
              
              <!-- Action row -->
              <div class="flex gap-2 text-[10px] text-white/50">
                <span class="flex items-center gap-1 hover:text-white/80 cursor-pointer">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  Copy
                </span>
                <span class="flex items-center gap-1 hover:text-white/80 cursor-pointer">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  Share
                </span>
                <span class="flex items-center gap-1 hover:text-white/80 cursor-pointer">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Image
                </span>
              </div>
            </div>

            <!-- Card 2: Pulse Surge -->
            <div 
              :class="[
                'relative rounded-xl border bg-gradient-to-br p-4 transition-all duration-500',
                activeCard === 1 
                  ? 'border-purple-400/40 from-purple-900/30 via-black/40 to-violet-900/20 scale-[1.02] shadow-lg shadow-purple-500/10' 
                  : 'border-white/10 from-white/5 to-black/40 opacity-80'
              ]"
              @mouseenter="activeCard = 1"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <span class="text-lg">🔥</span>
                  <span class="ml-2 font-semibold text-white">Fan energy is surging</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Surge
                </span>
              </div>
              <p class="text-white/60 text-sm mb-3">2.3× baseline • last 60m</p>
              
              <div class="flex gap-1.5 mb-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60">Hype</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-purple-600 text-white">Grateful</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60">Tease</span>
              </div>
              
              <div class="flex gap-2 text-[10px] text-white/50">
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  Copy
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  Share
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Image
                </span>
              </div>
            </div>

            <!-- Card 3: After-Show Recap -->
            <div 
              :class="[
                'relative rounded-xl border bg-gradient-to-br p-4 transition-all duration-500',
                activeCard === 2 
                  ? 'border-purple-400/40 from-purple-900/30 via-black/40 to-violet-900/20 scale-[1.02] shadow-lg shadow-purple-500/10' 
                  : 'border-white/10 from-white/5 to-black/40 opacity-80'
              ]"
              @mouseenter="activeCard = 2"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <span class="text-lg">🎤</span>
                  <span class="ml-2 font-semibold text-white">After-Show Recap</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Recap
                </span>
              </div>
              <p class="text-white/60 text-sm mb-3">Peak window: 9–11pm • 23 interactions</p>
              
              <div class="flex gap-1.5 mb-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60">Hype</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60">Grateful</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-purple-600 text-white">Tease</span>
              </div>
              
              <div class="flex gap-2 text-[10px] text-white/50">
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  Copy
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  Share
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Image
                </span>
              </div>
            </div>

            <!-- Card 4: Milestone -->
            <div 
              :class="[
                'relative rounded-xl border bg-gradient-to-br p-4 transition-all duration-500',
                activeCard === 3 
                  ? 'border-purple-400/40 from-purple-900/30 via-black/40 to-violet-900/20 scale-[1.02] shadow-lg shadow-purple-500/10' 
                  : 'border-white/10 from-white/5 to-black/40 opacity-80'
              ]"
              @mouseenter="activeCard = 3"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <span class="text-lg">⚡</span>
                  <span class="ml-2 font-semibold text-white">500 fans milestone</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Milestone
                </span>
              </div>
              <p class="text-white/60 text-sm mb-3">New visitors today: 47</p>
              
              <div class="flex gap-1.5 mb-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-purple-600 text-white">Hype</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60">Grateful</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60">Tease</span>
              </div>
              
              <div class="flex gap-2 text-[10px] text-white/50">
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  Copy
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  Share
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Image
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Feature Pillars -->
        <div class="space-y-5">
          <!-- Pillar A -->
          <div class="flex gap-4 p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-black/30 hover:border-purple-400/30 transition-colors">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <h4 class="font-semibold text-white">Live Momentum Detection</h4>
              <p class="text-white/60 text-sm mt-0.5">Pulse + hot cities show when fans are waking up.</p>
            </div>
          </div>

          <!-- Pillar B -->
          <div class="flex gap-4 p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-black/30 hover:border-purple-400/30 transition-colors">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div>
              <h4 class="font-semibold text-white">Auto-Generated Moments</h4>
              <p class="text-white/60 text-sm mt-0.5">Surges, recaps, and prompts created automatically.</p>
            </div>
          </div>

          <!-- Pillar C -->
          <div class="flex gap-4 p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-black/30 hover:border-purple-400/30 transition-colors">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
            </div>
            <div>
              <h4 class="font-semibold text-white">Caption Factory</h4>
              <p class="text-white/60 text-sm mt-0.5">Hype • Grateful • Tease captions ready instantly.</p>
            </div>
          </div>

          <!-- Pillar D -->
          <div class="flex gap-4 p-4 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-black/30 hover:border-purple-400/30 transition-colors">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
            </div>
            <div>
              <h4 class="font-semibold text-white">Built-In Distribution</h4>
              <p class="text-white/60 text-sm mt-0.5">Social-ready sharing that feeds the next wave.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Row -->
      <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          @click="scrollToAnalytics"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          See The Dashboard
        </button>
        <NuxtLink
          to="/signup"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 shadow-lg shadow-purple-500/25 transition"
        >
          Start Free Trial
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const activeCard = ref(0)
let interval = null

onMounted(() => {
  interval = setInterval(() => {
    activeCard.value = (activeCard.value + 1) % 4
  }, 3000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

function scrollToAnalytics() {
  const analyticsSection = document.querySelector('[data-section="analytics-demo"]')
  if (analyticsSection) {
    analyticsSection.scrollIntoView({ behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>
