<template>
  <div class="p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-3xl font-bold text-white">Metrics</h1>
          <span class="text-xs font-medium bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Phase 2</span>
        </div>
        <p class="text-white/50">Business analytics and performance tracking</p>
      </div>

      <!-- Growth Section -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Growth
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Traffic" value="—" delta="+0%" status="pending" />
          <MetricCard title="Conversions" value="—" delta="+0%" status="pending" />
          <MetricCard title="SEO" value="—" delta="+0%" status="pending" />
          <MetricCard title="Paid" value="—" delta="+0%" status="pending" />
        </div>
      </div>

      <!-- Product Section -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Product
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard title="Active Bands" value="—" delta="+0" status="pending" />
          <MetricCard title="QR Scans" value="—" delta="+0%" status="pending" />
          <MetricCard title="Link Clicks" value="—" delta="+0%" status="pending" />
          <MetricCard title="Shareables" value="—" delta="+0" status="pending" />
          <MetricCard title="Support Moments" value="—" delta="+0" status="pending" />
        </div>
      </div>

      <!-- Integrations Section -->
      <div>
        <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Integrations
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IntegrationCard 
            title="Google Analytics" 
            description="Track website traffic and user behavior"
            icon="analytics"
          />
          <IntegrationCard 
            title="Search Console" 
            description="Monitor search performance and indexing"
            icon="search"
          />
          <IntegrationCard 
            title="Stripe" 
            description="Revenue and payment analytics"
            icon="stripe"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'corvana'
})

// Metric Card Component
const MetricCard = {
  props: ['title', 'value', 'delta', 'status'],
  template: `
    <div class="bg-white/5 border border-white/10 rounded-xl p-4">
      <div class="text-white/50 text-sm mb-2">{{ title }}</div>
      <div class="text-2xl font-bold text-white/30 mb-1">{{ value }}</div>
      <div class="text-white/20 text-xs">{{ delta }}</div>
    </div>
  `
}

// Integration Card Component
const IntegrationCard = {
  props: ['title', 'description', 'icon'],
  template: `
    <div class="bg-white/5 border border-white/10 rounded-xl p-5">
      <div class="flex items-start justify-between mb-4">
        <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <svg v-if="icon === 'analytics'" class="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <svg v-else-if="icon === 'search'" class="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <svg v-else class="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <span class="text-xs font-medium bg-white/5 text-white/30 px-2 py-1 rounded-full">Coming Soon</span>
      </div>
      <h3 class="text-white font-semibold mb-1">{{ title }}</h3>
      <p class="text-white/40 text-sm mb-4">{{ description }}</p>
      <button 
        disabled
        class="w-full py-2 bg-white/5 text-white/30 rounded-lg text-sm font-medium cursor-not-allowed"
        title="Phase 2"
      >
        Connect
      </button>
    </div>
  `
}
</script>
