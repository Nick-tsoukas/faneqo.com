<template>
  <div
    ref="rootEl"
    class="demo-fan-intelligence"
    :class="{ 'demo-compact': compact, 'is-marketing': isMarketing, 'is-editorial': editorial }"
  >
    <!-- Outer glow — desktop only -->
    <div
      v-if="animated && !compact"
      class="pointer-events-none absolute -inset-4 hidden rounded-[2rem] opacity-50 blur-3xl lg:block"
      :class="editorial
        ? 'bg-gradient-to-r from-[#4CA6FF]/15 via-[#39D5FF]/10 to-[#45E3AE]/10'
        : 'bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-pink-500/15'"
      aria-hidden="true"
    />

    <!-- Main card -->
    <div
      class="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl sm:rounded-3xl"
      :class="editorial ? 'max-w-4xl' : 'max-w-3xl'"
    >
      <!-- Gradient header -->
      <div
        class="px-4 py-4 sm:px-6 sm:py-5"
        :class="editorial ? 'bg-[#0B0E14] border-b border-white/10' : 'bg-gradient-to-r from-pink-600 to-purple-600'"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
              <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div class="min-w-0">
              <h3 class="text-lg font-bold text-white sm:text-xl">Fan Intelligence</h3>
              <p class="text-sm text-white/70">
                <span
                  class="fi-count"
                  :class="{ 'is-tick': editorial && sarahJoined }"
                >{{ displayedCount }}</span>
                fans · {{ engagedFans }} engaged
              </p>
            </div>
          </div>

          <!-- Desktop demo chrome -->
          <div v-if="!editorial" class="marketing-desktop-only flex items-center gap-2">
            <button type="button" class="demo-header-btn" @click.prevent aria-label="Import fans (demo)">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span class="hidden sm:inline">Import</span>
            </button>
            <button type="button" class="demo-header-btn" @click.prevent aria-label="Export fans (demo)">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span class="hidden sm:inline">Export</span>
            </button>
            <button type="button" class="demo-analytics-btn" @click.prevent aria-label="View analytics (demo)">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6">
        <!-- Stats -->
        <div class="mb-5 grid grid-cols-2 gap-3 lg:mb-6 lg:grid-cols-4">
          <div
            v-for="stat in fanStats"
            :key="stat.label"
            class="stat-card"
            :class="`stat-${stat.tone}`"
          >
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-detail">{{ stat.detail }}</div>
          </div>
        </div>

        <!-- Segment tabs -->
        <div class="-mx-1 mb-4 flex items-center gap-1 overflow-x-auto px-1 pb-1">
          <button
            v-for="tab in fanTabs"
            :key="tab.label"
            type="button"
            class="tier-tab"
            :class="{ active: activeTab === tab.label, [`tab-${tab.label.toLowerCase()}`]: activeTab === tab.label }"
            @click="setActiveTab(tab.label)"
          >
            <span class="tier-dot" :class="getDotClass(tab.label)" />
            <span class="tier-label">{{ tab.label }}</span>
            <span class="tier-count">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Search / filters — tablet+ in marketing mode -->
        <div v-if="!editorial" class="marketing-desktop-only mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search fans..."
              class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-white/40 focus:border-pink-500/50 focus:outline-none"
              aria-label="Search fans (demo)"
              readonly
              tabindex="-1"
            />
            <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <select class="cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 focus:border-white/20 focus:outline-none" aria-label="Sort by (demo)" disabled>
              <option>Date Joined</option>
            </select>
            <select class="cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 focus:border-white/20 focus:outline-none" aria-label="Filter by source (demo)" disabled>
              <option>All Sources</option>
            </select>
          </div>
        </div>

        <!-- Fan list — fictional names only, no emails -->
        <div class="space-y-2">
          <div
            v-for="(fan, index) in visibleFans"
            :key="fan.name"
            class="fan-row group"
            :class="{
              'mobile-extra': index >= mobileRowLimit,
              'is-sarah': editorial && index === 0,
              'is-joined': editorial && index === 0 && sarahJoined,
            }"
          >
            <div class="flex-shrink-0">
              <div class="h-2.5 w-2.5 rounded-full" :class="getStatusDotClass(fan.status)" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span class="font-medium text-white" :class="editorial ? 'text-[0.95rem]' : 'text-sm'">{{ fan.name }}</span>
                <span class="text-xs text-white/40">· {{ fan.location }}</span>
              </div>
              <p class="mt-1 truncate text-xs text-white/60">
                <span :class="editorial ? 'text-[#39D5FF]/85' : 'text-pink-400/80'">{{ fan.activity }}</span>
              </p>
            </div>

            <div class="fan-status-col flex min-w-0 flex-shrink-0 flex-col items-end gap-1">
              <span
                class="whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs"
                :class="getStatusBadgeClass(fan.status)"
              >
                {{ fan.status }}
              </span>
              <span class="whitespace-nowrap text-[10px] text-white/40 sm:text-xs">{{ fan.source }}</span>
              <span class="whitespace-nowrap text-[10px] text-white/30 sm:text-xs">{{ fan.joined }}</span>
            </div>
          </div>
        </div>

        <!-- Messages hub — demo only -->
        <div class="mt-5" v-if="!editorial">
          <button
            type="button"
            class="message-fans-btn"
            :aria-expanded="demoMessageOpen"
            @click="toggleDemoMessage"
          >
            <span>Messages</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p
            v-if="demoMessageOpen"
            class="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-white/55"
            role="status"
          >
            Demo only — this homepage preview doesn’t send messages.
          </p>
        </div>

        <!-- Insight -->
        <div
          class="mt-5 rounded-xl p-4 sm:mt-6"
          :class="editorial
            ? 'border border-[#4CA6FF]/18 bg-[#0B0E14]'
            : 'border border-purple-500/20 bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30'"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
              :class="editorial ? 'bg-[#4CA6FF]/12' : 'bg-purple-500/20'"
            >
              <svg
                class="h-4 w-4"
                :class="editorial ? 'text-[#39D5FF]' : 'text-purple-400'"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-white/90">Insight</p>
              <p class="mt-0.5 text-sm text-white/60">
                Your Show QR is creating the warmest fans this week — 4 fans joined and 3 clicked Spotify after scanning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  mode: {
    type: String,
    default: 'marketing',
  },
  compact: {
    type: Boolean,
    default: false,
  },
  animated: {
    type: Boolean,
    default: true,
  },
  /** Homepage V2: fewer mobile stats/rows. Production `/` leaves this false. */
  editorial: {
    type: Boolean,
    default: false,
  },
})

const isMarketing = computed(() => props.mode === 'marketing' || props.compact)
const mobileRowLimit = computed(() => (props.compact ? 3 : props.editorial ? 4 : 3))

const rootEl = ref(null)
const engagedFans = 38
const displayedCount = ref(props.editorial ? 128 : 127)
const sarahJoined = ref(!props.editorial)
let fiObserver = null
let fiPlayed = false

const fanStats = computed(() => {
  const count = String(displayedCount.value)
  return [
    { label: 'Fans collected', value: count, detail: '+23 this month', tone: 'pink' },
    { label: 'Top source', value: 'Show QR', detail: 'After check-in', tone: 'cyan' },
    { label: 'Engaged fans', value: '38', detail: 'Clicked or streamed', tone: 'purple' },
    { label: 'Superfans', value: '18', detail: 'High-intent signals', tone: 'emerald' },
  ]
})

const fanTabs = computed(() => [
  { label: 'All', count: displayedCount.value },
  { label: 'Superfans', count: 18 },
  { label: 'Engaged', count: 38 },
  { label: 'Warm', count: 52 },
  { label: 'New', count: 19 },
])

/** Fictional demo fans — never real PII / no emails shown */
const demoFans = [
  {
    name: 'Sarah M.',
    location: 'Nashville',
    source: 'Show Mode',
    status: 'Superfan',
    activity: 'Checked in · Message the Room · clicked merch',
    joined: 'Tonight',
  },
  {
    name: 'James K.',
    location: 'Chicago',
    source: 'Show QR',
    status: 'Engaged',
    activity: 'Show Mode check-in · opened Spotify',
    joined: 'Tonight',
  },
  {
    name: 'Emily R.',
    location: 'Knoxville',
    source: 'Show QR',
    status: 'Warm',
    activity: 'Joined from Show QR · saved artist page',
    joined: 'Tonight',
  },
  {
    name: 'Chris D.',
    location: 'Austin',
    source: 'Band Page',
    status: 'Engaged',
    activity: 'Watched video · joined fan list',
    joined: 'Yesterday',
  },
  {
    name: 'Taylor K.',
    location: 'Los Angeles',
    source: 'Show Mode',
    status: 'Superfan',
    activity: 'Came back after the show · clicked support',
    joined: '2 days ago',
  },
]

const visibleFans = computed(() => demoFans)

const activeTab = ref('All')
const demoMessageOpen = ref(false)

function setActiveTab(tab) {
  activeTab.value = tab
}

function toggleDemoMessage() {
  demoMessageOpen.value = !demoMessageOpen.value
}

function playSarahJoin() {
  if (fiPlayed || !props.editorial) return
  fiPlayed = true
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    displayedCount.value = 129
    sarahJoined.value = true
    return
  }
  const obj = { n: 128 }
  gsap.to(obj, {
    n: 129,
    duration: 0.55,
    delay: 0.28,
    ease: 'power2.out',
    onUpdate() {
      displayedCount.value = Math.round(obj.n)
    },
    onComplete() {
      sarahJoined.value = true
    },
  })
}

onMounted(() => {
  if (!props.editorial || typeof window === 'undefined') return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    displayedCount.value = 129
    sarahJoined.value = true
    return
  }
  if (!rootEl.value) return
  fiObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        playSarahJoin()
        fiObserver?.disconnect()
      }
    },
    { threshold: 0.42 }
  )
  fiObserver.observe(rootEl.value)
})

onBeforeUnmount(() => {
  fiObserver?.disconnect()
  fiObserver = null
})

function getDotClass(label) {
  return (
    {
      All: 'bg-white/50',
      Superfans: 'bg-yellow-400',
      Engaged: 'bg-emerald-400',
      Warm: 'bg-blue-400',
      New: 'bg-white/30',
    }[label] || 'bg-white/30'
  )
}

function getStatusDotClass(status) {
  return (
    {
      Superfan: 'bg-yellow-400 animate-pulse',
      Engaged: 'bg-emerald-400',
      Warm: 'bg-blue-400',
      New: 'bg-white/40',
    }[status] || 'bg-white/40'
  )
}

function getStatusBadgeClass(status) {
  return (
    {
      Superfan: 'bg-yellow-500/20 text-yellow-300',
      Engaged: 'bg-emerald-500/20 text-emerald-300',
      Warm: 'bg-blue-500/20 text-blue-300',
      New: 'bg-white/10 text-white/50',
    }[status] || 'bg-white/10 text-white/50'
  )
}
</script>

<style scoped>
.demo-fan-intelligence {
  position: relative;
  width: 100%;
}

.demo-compact .stat-card {
  padding: 0.75rem;
}

.demo-compact .fan-row {
  padding: 0.5rem 0.75rem;
}

/* Marketing mobile: hide desktop chrome + extra rows */
.is-marketing .marketing-desktop-only {
  display: none !important;
}

.is-marketing .mobile-extra {
  display: none;
}

@media (min-width: 640px) {
  .is-marketing:not(.demo-compact) .marketing-desktop-only {
    display: flex !important;
  }

  .is-marketing:not(.demo-compact) .mobile-extra {
    display: flex;
  }
}

.demo-compact .marketing-desktop-only,
.demo-compact .mobile-extra {
  display: none !important;
}

.demo-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 0.75rem;
}

.demo-analytics-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
}

.stat-card {
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
}

.stat-detail {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.25rem;
}

.stat-pink .stat-value { color: #f472b6; }
.stat-cyan .stat-value { color: #22d3ee; }
.stat-purple .stat-value { color: #c084fc; }
.stat-emerald .stat-value { color: #34d399; }

.is-editorial .stat-pink .stat-value { color: #4ca6ff; }
.is-editorial .stat-cyan .stat-value { color: #39d5ff; }
.is-editorial .stat-purple .stat-value { color: #39d5ff; }
.is-editorial .stat-emerald .stat-value { color: #45e3ae; }

.tier-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  flex-shrink: 0;
}

.tier-tab.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.tier-tab.tab-superfans.active {
  background: rgba(234, 179, 8, 0.15);
  border-color: rgba(234, 179, 8, 0.3);
}

.tier-tab.tab-engaged.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
}

.tier-tab.tab-warm.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

.tier-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
}

.tier-label {
  font-weight: 500;
}

.tier-count {
  opacity: 0.6;
  font-size: 0.625rem;
}

.fan-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.75rem;
  transition:
    border-color 0.45s ease,
    box-shadow 0.45s ease,
    background 0.45s ease;
}

.fan-row.is-sarah.is-joined {
  background: rgba(57, 213, 255, 0.07);
  border-color: rgba(57, 213, 255, 0.28);
  box-shadow: inset 3px 0 0 #39d5ff;
}

.fi-count {
  font-variant-numeric: tabular-nums;
}

.fi-count.is-tick {
  color: #39d5ff;
}

.message-fans-btn {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.35), rgba(168, 85, 247, 0.35));
  color: #fff;
  font-size: 0.88rem;
  font-weight: 650;
  padding: 0.75rem 1rem;
}

@media (min-width: 640px) {
  .message-fans-btn {
    width: auto;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 639px) {
  .stat-card {
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .fan-row {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .fan-row > .fan-status-col {
    flex-basis: 100%;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.35rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .is-editorial .stat-card:nth-child(n + 4) {
    display: none;
  }

  .is-editorial .stat-detail {
    display: none;
  }

  .is-editorial .stat-value {
    font-size: 1.45rem;
  }

  .is-editorial .stat-label {
    font-size: 0.8125rem;
  }

  .is-editorial .tier-tab:nth-child(n + 4) {
    display: none;
  }

  .is-editorial .fan-status-col span:nth-child(n + 2) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fan-row {
    transition: none;
  }
}
</style>
