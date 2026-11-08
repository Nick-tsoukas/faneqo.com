<template>
  <section class="demo-show-growth relative w-full overflow-hidden">
    <!-- Background glow -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[140px]"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]"></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-12 lg:mb-16 max-w-3xl mx-auto">
        <p class="text-sm uppercase tracking-wider text-cyan-400 font-semibold mb-4">Live Show Growth</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
          Your next show can <span class="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">grow your fan list.</span>
        </h2>
        <p class="mt-6 text-base sm:text-lg text-white/70 leading-relaxed">
          Put one MusicBizQR code on the merch table, flyer, poster, or stage screen. Fans scan, land on your artist page, join your list, stream your music, support the band, and show up in your analytics.
        </p>
      </div>

      <!-- Top Stat Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10 lg:mb-14">
        <div v-for="stat in showStats" :key="stat.label" class="stat-card group text-center p-3 sm:p-4">
          <div class="text-xl sm:text-2xl font-bold bg-gradient-to-br from-cyan-300 to-purple-400 bg-clip-text text-transparent">{{ stat.value }}</div>
          <div class="text-xs text-white/70 mt-1 font-medium">{{ stat.label }}</div>
          <div class="text-[10px] text-white/40 mt-0.5">{{ stat.detail }}</div>
        </div>
      </div>

      <!-- Main Two-Column Layout -->
      <div class="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <!-- LEFT: Live Fan Journey Timeline -->
        <div class="timeline-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <!-- Panel glow -->
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/30 to-transparent"></div>
          
          <!-- Panel header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live Fan Activity</span>
            </div>
            <span class="text-xs text-white/40">Tonight</span>
          </div>

          <!-- Timeline -->
          <div class="space-y-0">
            <div v-for="(event, i) in liveEvents" :key="i" class="timeline-event relative pl-8 pb-6 last:pb-0">
              <!-- Connector line -->
              <div v-if="i < liveEvents.length - 1" class="absolute left-[11px] top-6 w-px h-[calc(100%-12px)] bg-gradient-to-b from-white/15 to-white/5"></div>
              <!-- Dot -->
              <div class="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full flex items-center justify-center" :class="dotBg(event.tone)">
                <div class="w-2.5 h-2.5 rounded-full" :class="dotColor(event.tone)"></div>
              </div>
              <!-- Content -->
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-white">{{ event.title }}</p>
                  <p class="text-xs text-white/60 mt-0.5 leading-relaxed">{{ event.description }}</p>
                </div>
                <span class="text-[10px] text-white/30 font-mono whitespace-nowrap pt-0.5">{{ event.time }}</span>
              </div>
            </div>
          </div>

          <!-- Mini Artist Page Card -->
          <div class="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
                <span class="text-lg">🎵</span>
              </div>
              <div>
                <p class="text-sm font-bold text-white">Shannon Tehya</p>
                <p class="text-[10px] text-white/50">Artist Page • musicbizqr.com</p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 mt-3">
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium">Join Fan List</span>
              <span class="px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/20 text-[10px] text-pink-400 font-medium">Spotify</span>
              <span class="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/20 text-[10px] text-purple-400 font-medium">Support</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: Artist Dashboard Update -->
        <div class="space-y-6">
          <!-- QR Analytics Panel -->
          <div class="dashboard-panel p-6 sm:p-7 rounded-3xl relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500/50 via-purple-500/30 to-transparent"></div>
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span class="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
                  <svg class="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6z"/></svg>
                </span>
                Dynamic QR Analytics
              </h3>
              <span class="px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-400 font-medium">Live</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div v-for="item in qrAnalytics" :key="item.label" class="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div class="text-lg font-bold text-white">{{ item.value }}</div>
                <div class="text-[10px] text-white/50 mt-0.5">{{ item.label }}</div>
              </div>
            </div>

            <!-- Mini QR visual -->
            <div class="mt-5 flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div class="qr-visual w-12 h-12 rounded-lg flex-shrink-0"></div>
              <div>
                <p class="text-xs font-semibold text-white">Show QR</p>
                <p class="text-[10px] text-white/40">Merch table / stage screen / flyer</p>
              </div>
            </div>
          </div>

          <!-- Fan Analytics Panel -->
          <div class="dashboard-panel p-6 sm:p-7 rounded-3xl relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 via-cyan-500/30 to-transparent"></div>
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span class="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </span>
                Fan Analytics
              </h3>
              <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-medium">Updated</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div v-for="item in fanAnalytics" :key="item.label" class="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div class="text-lg font-bold text-white">{{ item.value }}</div>
                <div class="text-[10px] text-white/50 mt-0.5">{{ item.label }}</div>
              </div>
            </div>

            <!-- Top fan action -->
            <div class="mt-5 p-3 rounded-xl bg-gradient-to-r from-emerald-500/8 to-cyan-500/5 border border-emerald-500/15">
              <p class="text-[10px] text-white/40 uppercase tracking-wider mb-1">Top fan action</p>
              <p class="text-xs text-white/80 font-medium">Clicked Spotify after joining fan list</p>
            </div>
          </div>

          <!-- Insight Strip -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 text-center">
            <p class="text-sm text-white/80"><span class="font-semibold text-purple-300">Insight:</span> Your show QR created the warmest fans this week.</p>
          </div>
        </div>
      </div>

      <!-- CTA Row -->
      <div class="mt-14 lg:mt-16 text-center">
        <p class="text-xl sm:text-2xl font-bold text-white mb-3">
          Start using QR codes that <span class="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">grow your fan list.</span>
        </p>
        <p class="text-sm sm:text-base text-white/60 mb-7 max-w-lg mx-auto">
          Create your free artist page and get 30 days of Pro included.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <NuxtLink to="/signup" class="cta-primary group">
            Create Your Free Artist Page
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
          </NuxtLink>
          <NuxtLink to="/demo" class="cta-secondary">See Live Demo</NuxtLink>
        </div>
        <p class="mt-4 text-xs text-white/40">Free account. 30 days of Pro included. Keep your page either way.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
const liveEvents = [
  {
    time: '10:31 PM',
    title: 'QR scan detected',
    description: 'Fan scanned the merch table QR code.',
    tone: 'cyan'
  },
  {
    time: '10:32 PM',
    title: 'Artist page opened',
    description: "They landed on Shannon Tehya's MBQ page.",
    tone: 'purple'
  },
  {
    time: '10:33 PM',
    title: 'Fan joined list',
    description: 'Maya R. joined from Show QR.',
    tone: 'pink'
  },
  {
    time: '10:34 PM',
    title: 'Spotify click tracked',
    description: 'Fan clicked Spotify after joining.',
    tone: 'emerald'
  },
  {
    time: '10:36 PM',
    title: 'Support received',
    description: '$20 tip from artist page.',
    tone: 'yellow'
  }
]

const showStats = [
  { label: 'Scans tonight', value: '12', detail: 'Dynamic QR' },
  { label: 'New fans joined', value: '4', detail: 'Fan list' },
  { label: 'Support received', value: '$20', detail: 'Artist page' },
  { label: 'Spotify clicks', value: '3', detail: 'After joining' },
  { label: 'Top source', value: 'Show QR', detail: 'Merch table' }
]

const qrAnalytics = [
  { label: 'Total scans', value: '12' },
  { label: 'Top source', value: 'Show QR' },
  { label: 'Peak activity', value: '10:42 PM' },
  { label: 'Top device', value: 'iPhone' }
]

const fanAnalytics = [
  { label: 'New fans', value: '4' },
  { label: 'Warm fans', value: '2' },
  { label: 'Support actions', value: '1' },
  { label: 'Spotify clicks', value: '3' }
]

function dotBg(tone) {
  const map = {
    cyan: 'bg-cyan-500/20',
    purple: 'bg-purple-500/20',
    pink: 'bg-pink-500/20',
    emerald: 'bg-emerald-500/20',
    yellow: 'bg-yellow-500/20'
  }
  return map[tone] || 'bg-white/10'
}

function dotColor(tone) {
  const map = {
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-400',
    pink: 'bg-pink-400',
    emerald: 'bg-emerald-400',
    yellow: 'bg-yellow-400'
  }
  return map[tone] || 'bg-white/60'
}
</script>

<style scoped>
/* Stat cards */
.stat-card {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.05), rgba(168, 85, 247, 0.04));
  border: 1px solid rgba(34, 211, 238, 0.12);
  border-radius: 1rem;
  transition: all 0.3s ease;
}
.stat-card:hover {
  border-color: rgba(34, 211, 238, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(34, 211, 238, 0.08);
}

/* Timeline panel */
.timeline-panel {
  background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Dashboard panels */
.dashboard-panel {
  background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Timeline event hover */
.timeline-event {
  transition: all 0.2s ease;
}
.timeline-event:hover {
  padding-left: 2.25rem;
}

/* Mini QR visual */
.qr-visual {
  background:
    linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(34, 211, 238, 0.2);
  position: relative;
  overflow: hidden;
}
.qr-visual::before {
  content: '';
  position: absolute;
  inset: 4px;
  background:
    repeating-conic-gradient(
      rgba(255,255,255,0.15) 0% 25%,
      transparent 0% 50%
    ) 0 0 / 6px 6px;
  border-radius: 4px;
  opacity: 0.8;
}

/* CTA Buttons */
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

.cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 0.75rem;
  transition: all 0.2s;
}
.cta-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
}
</style>
