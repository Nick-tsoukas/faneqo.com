<template>
  <section class="demo-analytics-snapshot relative w-full overflow-hidden">
    <!-- Background glow -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]"></div>
      <div class="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-pink-500/8 rounded-full blur-[120px]"></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" :class="{ 'pt-0': hideHeader }">
      <!-- Header Area (hidden when embedded under Fan Intelligence) -->
      <div
        v-if="!hideHeader"
        class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 lg:mb-14"
      >
        <div class="max-w-2xl">
          <p class="text-sm uppercase tracking-wider text-purple-400 font-semibold mb-4">Artist Analytics</p>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Know exactly what turns attention into <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">fans.</span>
          </h2>
          <p class="mt-5 text-base sm:text-lg text-white/70 leading-relaxed">
            See which QR codes, links, cities, shows, and fan actions are creating real growth — so you stop guessing and start building around what works.
          </p>
        </div>
        <div class="flex items-center gap-2 self-start lg:self-auto">
          <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span class="text-xs text-emerald-400 font-medium whitespace-nowrap">Live fan signals</span>
          <span class="ml-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-white/50 font-medium">Last 7 days</span>
        </div>
      </div>
      <div v-else class="mb-6 flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <span class="text-xs text-emerald-400 font-medium whitespace-nowrap">Live fan signals</span>
        <span class="ml-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-white/50 font-medium">Last 7 days</span>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 lg:mb-10">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card group p-4 sm:p-5">
          <div class="text-xl sm:text-2xl lg:text-3xl font-bold break-words" :class="kpiValueColor(kpi.tone)">{{ kpi.value }}</div>
          <div class="text-xs text-white/70 mt-1 font-medium">{{ kpi.label }}</div>
          <div class="text-[10px] text-white/40 mt-0.5">{{ kpi.detail }}</div>
        </div>
      </div>

      <!-- Main Analytics Grid -->
      <div class="grid lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
        <!-- Panel A: Fan Growth Chart -->
        <div class="analytics-panel p-5 sm:p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-bold text-white">Fan Growth</h3>
            <span class="text-[10px] text-white/40">This week</span>
          </div>
          <!-- Bar chart -->
          <div class="flex items-end gap-2 h-28 mb-4">
            <div v-for="bar in fanGrowth" :key="bar.day" class="flex-1 flex flex-col items-center gap-1.5">
              <div class="w-full rounded-t-md transition-all duration-500" :class="barGradient(bar.value)" :style="{ height: barHeight(bar.value) }"></div>
              <span class="text-[9px] text-white/40 font-medium">{{ bar.day }}</span>
            </div>
          </div>
          <!-- Insight -->
          <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <p class="text-[11px] text-white/60 leading-relaxed">
              <span class="text-emerald-400 font-semibold">Show night</span> created 4 new fans and 2 warm fan signals.
            </p>
          </div>
        </div>

        <!-- Panel B: Source Breakdown -->
        <div class="analytics-panel p-5 sm:p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-bold text-white">Top Sources</h3>
            <span class="text-[10px] text-white/40">By scans</span>
          </div>
          <div class="space-y-3.5">
            <div v-for="source in sources" :key="source.label">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs text-white/80 font-medium">{{ source.label }}</span>
                <span class="text-xs text-white/50">{{ source.value }}</span>
              </div>
              <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700" :style="{ width: sourceWidth(source.value) }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel C: Top Fan Actions -->
        <div class="analytics-panel p-5 sm:p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-bold text-white">Fan Actions</h3>
            <span class="text-[10px] text-white/40">All sources</span>
          </div>
          <div class="space-y-3">
            <div v-for="action in fanActions" :key="action.label" class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full flex-shrink-0" :class="actionDotColor(action.label)"></div>
              <span class="text-xs text-white/80 flex-1">{{ action.label }}</span>
              <span class="text-xs font-semibold text-white/60">{{ action.value }}</span>
            </div>
          </div>
          <!-- Mini metric -->
          <div class="mt-5 pt-4 border-t border-white/5">
            <p class="text-[10px] text-white/40 uppercase tracking-wider mb-1">Top fan action</p>
            <p class="text-xs text-white/70 font-medium">Clicked Spotify after joining fan list</p>
          </div>
        </div>
      </div>

      <!-- Fan Signal Feed -->
      <div class="analytics-panel p-5 sm:p-6 rounded-2xl mb-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            Fan Signal Feed
          </h3>
          <span class="text-[10px] text-white/40">Recent activity</span>
        </div>
        <div class="divide-y divide-white/5">
          <div v-for="fan in fanSignals" :key="fan.name" class="fan-signal-row flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" :class="fanAvatarBg(fan.tone)">
                {{ fan.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ fan.name }}</p>
                <p class="text-[11px] text-white/50 leading-relaxed truncate">{{ fan.activity }}</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap" :class="statusBadge(fan.tone)">{{ fan.status }}</span>
          </div>
        </div>
      </div>

      <!-- Insight Card -->
      <div
        class="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20"
        :class="hideHeader ? 'mb-2 lg:mb-4' : 'mb-10 lg:mb-12'"
      >
        <p class="text-sm sm:text-base font-semibold text-white mb-2">
          <span class="text-purple-300">Insight:</span> Your Show QR created the warmest fans this week.
        </p>
        <p class="text-xs sm:text-sm text-white/60 leading-relaxed max-w-2xl">
          Fans who joined from your show QR were more likely to click Spotify, save your page, and support the artist after the set.
        </p>
      </div>

      <!-- CTA Row (standalone only — homepage embeds under Fan Intelligence) -->
      <div v-if="!hideHeader" class="text-center">
        <p class="text-lg sm:text-xl font-bold text-white mb-2">
          Start tracking what actually <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">grows your fanbase.</span>
        </p>
        <p class="text-sm text-white/50 mb-6">Free account. 30 days of Pro included.</p>
        <NuxtLink to="/signup" class="cta-primary group">
          Create Your Free Artist Page
          <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </NuxtLink>
        <!-- SEO copy -->
        <p class="mt-5 text-xs text-white/30 max-w-lg mx-auto leading-relaxed">
          MusicBizQR gives artists music smart link analytics, QR code analytics, and fan engagement signals in one dashboard.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  hideHeader: { type: Boolean, default: false }
})

const kpis = [
  { value: '342', label: 'QR scans', detail: '+28% from last week', tone: 'pink' },
  { value: '127', label: 'Fans collected', detail: '23 this month', tone: 'cyan' },
  { value: 'Show QR', label: 'Top source', detail: 'Merch table is winning', tone: 'purple' },
  { value: '$120', label: 'Support received', detail: '4 support actions', tone: 'emerald' },
  { value: '1.2K', label: 'Music clicks', detail: 'Spotify leads', tone: 'blue' }
]

const fanGrowth = [
  { day: 'Mon', value: 28 },
  { day: 'Tue', value: 34 },
  { day: 'Wed', value: 31 },
  { day: 'Thu', value: 46 },
  { day: 'Fri', value: 78 },
  { day: 'Sat', value: 100 },
  { day: 'Sun', value: 64 }
]

const sources = [
  { label: 'Show QR', value: 72 },
  { label: 'Artist Page', value: 48 },
  { label: 'Instagram Bio', value: 36 },
  { label: 'Poster QR', value: 28 },
  { label: 'Direct Link', value: 18 }
]

const fanActions = [
  { label: 'Joined fan list', value: 127 },
  { label: 'Clicked Spotify', value: 84 },
  { label: 'Watched video', value: 42 },
  { label: 'Supported artist', value: 12 },
  { label: 'Saved page', value: 31 }
]

const fanSignals = [
  { name: 'Maya R.', activity: 'Joined from Show QR · clicked Spotify', status: 'Warm', tone: 'cyan' },
  { name: 'Chris D.', activity: 'Watched video · joined fan list', status: 'Engaged', tone: 'emerald' },
  { name: 'Taylor K.', activity: 'Supported artist · came back after the show', status: 'Superfan Signal', tone: 'pink' }
]

function kpiValueColor(tone) {
  const map = {
    pink: 'bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent',
    cyan: 'bg-gradient-to-r from-cyan-300 to-teal-400 bg-clip-text text-transparent',
    purple: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
    emerald: 'bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent',
    blue: 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'
  }
  return map[tone] || 'text-white'
}

function barHeight(value) {
  return `${(value / 100) * 100}%`
}

function barGradient(value) {
  if (value >= 80) return 'bg-gradient-to-t from-pink-500 to-purple-400'
  if (value >= 50) return 'bg-gradient-to-t from-purple-500/80 to-purple-400/60'
  return 'bg-gradient-to-t from-purple-500/50 to-purple-400/30'
}

function sourceWidth(value) {
  const max = 72
  return `${(value / max) * 100}%`
}

function actionDotColor(label) {
  const map = {
    'Joined fan list': 'bg-emerald-400',
    'Clicked Spotify': 'bg-cyan-400',
    'Watched video': 'bg-purple-400',
    'Supported artist': 'bg-pink-400',
    'Saved page': 'bg-blue-400'
  }
  return map[label] || 'bg-white/40'
}

function fanAvatarBg(tone) {
  const map = {
    cyan: 'bg-cyan-500/20 text-cyan-300',
    emerald: 'bg-emerald-500/20 text-emerald-300',
    pink: 'bg-pink-500/20 text-pink-300'
  }
  return map[tone] || 'bg-white/10 text-white/60'
}

function statusBadge(tone) {
  const map = {
    cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    pink: 'bg-pink-500/15 text-pink-400 border border-pink-500/20'
  }
  return map[tone] || 'bg-white/5 text-white/50'
}
</script>

<style scoped>
/* KPI Cards */
.kpi-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  transition: all 0.3s ease;
}
.kpi-card:hover {
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(168, 85, 247, 0.08);
}

/* Analytics Panels */
.analytics-panel {
  background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008));
  border: 1px solid rgba(255, 255, 255, 0.07);
}

/* Fan Signal Rows */
.fan-signal-row {
  transition: all 0.2s ease;
}
.fan-signal-row:hover {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.75rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
}

/* CTA */
.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  border-radius: 0.75rem;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(236, 72, 153, 0.25);
}
.cta-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 30px rgba(236, 72, 153, 0.35);
}
</style>
