<template>
  <section class="dashboard-section mb-8">
    <!-- Header -->
    <div class="section-header bg-gradient-to-r from-purple-600 to-violet-600">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">After-Show Recap</h2>
          <p class="text-white/70 text-sm">Last show highlights</p>
        </div>
      </div>
      <span class="px-3 py-1 rounded-full bg-white/15 text-white/80 text-xs font-medium">Demo</span>
    </div>

    <!-- Content -->
    <div class="section-content">
      <div class="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/20 via-black/40 to-violet-900/10 p-5">
        <!-- Decorative orb -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <!-- Recap badge -->
        <div class="flex items-center gap-2 mb-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            High Energy
          </span>
          <span class="text-white/40 text-xs">March 22, 2026</span>
        </div>

        <!-- Show Title -->
        <h3 class="text-2xl font-bold text-white mb-1">The Neon Revival @ The Roxy</h3>
        <p class="text-white/60 text-sm mb-5">Los Angeles, CA</p>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div class="bg-white/5 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-emerald-400">47</p>
            <p class="text-white/50 text-xs mt-0.5">Fans Captured</p>
          </div>
          <div class="bg-white/5 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-blue-400">312</p>
            <p class="text-white/50 text-xs mt-0.5">Interactions</p>
          </div>
          <div class="bg-white/5 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-purple-400">23</p>
            <p class="text-white/50 text-xs mt-0.5">Check-Ins</p>
          </div>
          <div class="bg-white/5 rounded-lg p-3 text-center">
            <p class="text-2xl font-bold text-yellow-400">8</p>
            <p class="text-white/50 text-xs mt-0.5">Superfans</p>
          </div>
        </div>

        <!-- Top Actions -->
        <div class="bg-white/5 rounded-xl p-4 mb-5">
          <h4 class="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Top Fan Actions</h4>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-green-500/20 flex items-center justify-center text-green-400 text-xs">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13" /></svg>
                </span>
                <span class="text-white text-sm">Spotify Clicks</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full" style="width: 78%"></div>
                </div>
                <span class="text-white/60 text-xs w-6 text-right">89</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-pink-500/20 flex items-center justify-center text-pink-400 text-xs">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316" /></svg>
                </span>
                <span class="text-white text-sm">Shares</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-pink-500 rounded-full" style="width: 52%"></div>
                </div>
                <span class="text-white/60 text-xs w-6 text-right">42</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                </span>
                <span class="text-white text-sm">Ticket Clicks</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-violet-500 rounded-full" style="width: 35%"></div>
                </div>
                <span class="text-white/60 text-xs w-6 text-right">31</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </span>
                <span class="text-white text-sm">Merch Clicks</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full" style="width: 22%"></div>
                </div>
                <span class="text-white/60 text-xs w-6 text-right">18</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Engagement Breakdown -->
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <p class="text-yellow-400 text-xs font-medium mb-1">Superfan Signals</p>
            <p class="text-white text-xl font-bold">8</p>
            <p class="text-white/40 text-[10px]">Score 40+</p>
          </div>
          <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <p class="text-green-400 text-xs font-medium mb-1">Engaged Fans</p>
            <p class="text-white text-xl font-bold">15</p>
            <p class="text-white/40 text-[10px]">Score 20-39</p>
          </div>
        </div>

        <!-- Capture Surfaces -->
        <div class="bg-white/5 rounded-xl p-4 mb-5">
          <h4 class="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">How Fans Found You</h4>
          <div class="flex flex-wrap gap-2">
            <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
              QR Poster · 19
            </span>
            <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
              Stage Screen · 12
            </span>
            <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
              Merch Table · 9
            </span>
            <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
              Direct Link · 7
            </span>
          </div>
        </div>

        <!-- Share buttons -->
        <div class="flex gap-3">
          <button class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Recap
          </button>
          <button class="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  overflow: visible;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
}

@media (min-width: 640px) {
  .section-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.section-content {
  padding: 1.5rem;
}
</style>
