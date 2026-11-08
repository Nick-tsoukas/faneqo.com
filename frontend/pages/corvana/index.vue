<template>
  <div class="p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Overview</h1>
        <p class="text-white/50">Welcome to Corvana — your internal command center</p>
      </div>

      <!-- Module Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Presentations Card -->
        <NuxtLink 
          to="/corvana/decks"
          class="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-white/[0.07] transition-all no-underline"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span class="text-purple-400 text-xs font-medium bg-purple-500/20 px-2 py-1 rounded-full">Active</span>
          </div>
          <h3 class="text-xl font-semibold text-white mb-1">Presentations</h3>
          <p class="text-white/50 text-sm mb-4">MBQ Flagship Deck v1</p>
          <div class="flex items-center text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
            <span>Open Deck</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>

        <!-- Execution Card -->
        <NuxtLink 
          to="/corvana/execution"
          class="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 hover:bg-white/[0.07] transition-all no-underline"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span class="text-white/40 text-xs font-medium bg-white/10 px-2 py-1 rounded-full">{{ projectCount }} Projects</span>
          </div>
          <h3 class="text-xl font-semibold text-white mb-1">Execution</h3>
          <p class="text-white/50 text-sm mb-4">Projects & task tracking</p>
          <div class="flex items-center text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
            <span>View Execution</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>

        <!-- Metrics Card -->
        <NuxtLink 
          to="/corvana/metrics"
          class="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-white/[0.07] transition-all no-underline"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span class="text-amber-400/60 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded-full">Phase 2</span>
          </div>
          <h3 class="text-xl font-semibold text-white mb-1">Metrics</h3>
          <p class="text-white/50 text-sm mb-4">Integrations pending</p>
          <div class="flex items-center text-amber-400 text-sm font-medium group-hover:gap-2 transition-all">
            <span>View Metrics</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>
      </div>

      <!-- What's Next Panel -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          What's Next
        </h3>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div class="text-white font-medium">Add project/task tracking</div>
              <div class="text-white/40 text-sm">Track execution with localStorage persistence</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <div class="w-2 h-2 rounded-full bg-white/40"></div>
            </div>
            <div>
              <div class="text-white/60 font-medium">Connect GA/Search Console</div>
              <div class="text-white/40 text-sm">Phase 2 — analytics integrations</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <div class="w-2 h-2 rounded-full bg-white/40"></div>
            </div>
            <div>
              <div class="text-white/60 font-medium">Auto-generate decks from product modules</div>
              <div class="text-white/40 text-sm">Phase 3 — AI-powered deck generation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'corvana'
})

const projectCount = ref(0)

onMounted(() => {
  // Load project count from localStorage
  try {
    const projects = JSON.parse(localStorage.getItem('corvana_projects') || '[]')
    projectCount.value = projects.length
  } catch (e) {
    projectCount.value = 0
  }
})
</script>
