<template>
  <section class="w-full max-w-5xl mx-auto text-white my-12 overflow-hidden">
    <div class="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
      <div class="px-6 pt-6 pb-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0">
            <h3 class="text-2xl sm:text-3xl font-semibold tracking-tight">Analytics Dashboard</h3>
            <p class="text-white/70 mt-1 text-sm sm:text-base">
              Interactive preview — switch tabs, date ranges, and chart types.
            </p>
          </div>

          <div class="flex items-center gap-1.5 shrink-0 bg-black/20 border border-white/10 rounded-full p-1">
            <button
              type="button"
              :aria-pressed="chartType === 'bar'"
              @click="chartType = 'bar'"
              :class="[
                'px-3 py-1 text-xs rounded-full transition',
                chartType === 'bar'
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : 'text-white/70 hover:bg-white/5',
                'motion-reduce:transition-none',
              ]"
            >
              Bar
            </button>
            <button
              type="button"
              :aria-pressed="chartType === 'line'"
              @click="chartType = 'line'"
              :class="[
                'px-3 py-1 text-xs rounded-full transition',
                chartType === 'line'
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : 'text-white/70 hover:bg-white/5',
                'motion-reduce:transition-none',
              ]"
            >
              Line
            </button>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            @click="selectedTab = tab"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition shadow-sm',
              selectedTab === tab
                ? 'bg-purple-500/20 text-purple-100 border-purple-400/40'
                : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/5',
              'motion-reduce:transition-none',
            ]"
          >
            {{ tab }}
          </button>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="opt in rangeOptions"
            :key="opt.days"
            type="button"
            @click="selectedRange = opt.days"
            :class="[
              'px-3 py-1 text-sm rounded-full border transition shadow-sm',
              selectedRange === opt.days
                ? 'bg-purple-500/20 text-purple-100 border-purple-400/40'
                : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/5',
              'motion-reduce:transition-none',
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="px-6 pb-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
            <div class="text-white/60 text-xs">Total</div>
            <div class="text-xl sm:text-2xl font-semibold tabular-nums">{{ totalValue }}</div>
            <div class="text-white/50 text-xs mt-1">{{ selectedRangeLabel }}</div>
          </div>
          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
            <div class="text-white/60 text-xs">Top City</div>
            <div class="text-base sm:text-lg font-semibold truncate">{{ topCity.name }}</div>
            <div class="text-white/50 text-xs mt-1 tabular-nums">{{ topCity.count }}</div>
          </div>
          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
            <div class="text-white/60 text-xs">Top Platform</div>
            <div class="text-base sm:text-lg font-semibold truncate">{{ topPlatform.name }}</div>
            <div class="text-white/50 text-xs mt-1 tabular-nums">{{ topPlatform.count }}</div>
          </div>
          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
            <div class="text-white/60 text-xs">Engagement</div>
            <div class="text-xl sm:text-2xl font-semibold tabular-nums">{{ engagementRate }}%</div>
            <div class="text-white/50 text-xs mt-1">clicks + plays + scans</div>
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
          <div class="px-4 py-3 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-white font-semibold truncate">{{ chartTitle }}</div>
              <div class="text-white/60 text-xs mt-0.5">{{ chartSubtitle }}</div>
            </div>

            <div v-if="hoveredPoint" class="shrink-0 text-right">
              <div class="text-white/70 text-[11px]">{{ hoveredPoint.label }}</div>
              <div class="text-emerald-200 font-semibold tabular-nums">{{ hoveredPoint.value }}</div>
            </div>
          </div>

          <div class="px-4 pb-4">
            <div class="relative w-full h-[300px] sm:h-[320px]">
              <canvas ref="chartCanvas" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
          <div class="px-4 py-4 flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 min-w-0">
              <div class="h-10 w-10 rounded-xl bg-red-500/15 border border-red-400/20 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" class="h-5 w-5 text-red-200" fill="currentColor" aria-hidden="true">
                  <path d="M10 15l5.2-3L10 9v6z" />
                  <path
                    d="M21.6 7.2c-.2-.8-.9-1.5-1.7-1.7C18.4 5 12 5 12 5s-6.4 0-7.9.5c-.8.2-1.5.9-1.7 1.7C2 8.7 2 12 2 12s0 3.3.5 4.8c.2.8.9 1.5 1.7 1.7 1.5.5 7.8.5 7.8.5s6.4 0 7.9-.5c.8-.2 1.5-.9 1.7-1.7.5-1.5.5-4.8.5-4.8s0-3.3-.5-4.8z"
                    opacity="0.25"
                  />
                </svg>
              </div>

              <div class="min-w-0">
                <div class="text-white font-semibold">YouTube (beta)</div>
                <div class="text-white/60 text-xs mt-0.5">
                  Connect your channel to track views, uploads, and which videos drive the most plays.
                </div>
              </div>
            </div>

            <div class="shrink-0">
              <span
                :class="[
                  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide',
                  youtubeDemo.connected
                    ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/25'
                    : 'bg-red-500/10 text-red-200 border-red-400/25',
                ]"
              >
                {{ youtubeDemo.connected ? `connected • synced ${youtubeDemo.syncedAgo}` : 'not connected' }}
              </span>
            </div>
          </div>

          <div class="px-4 pb-4">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
                <div class="text-white/60 text-xs">Channel views</div>
                <div class="text-xl sm:text-2xl font-semibold tabular-nums text-white">
                  {{ youtubeDemo.totals.channelViews.toLocaleString() }}
                </div>
              </div>
              <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
                <div class="text-white/60 text-xs">Subscribers</div>
                <div class="text-xl sm:text-2xl font-semibold tabular-nums text-white">
                  {{ youtubeDemo.totals.subs.toLocaleString() }}
                </div>
              </div>
              <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
                <div class="text-white/60 text-xs">Videos</div>
                <div class="text-xl sm:text-2xl font-semibold tabular-nums text-white">
                  {{ youtubeDemo.totals.totalVideos.toLocaleString() }}
                </div>
              </div>
              <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
                <div class="text-white/60 text-xs">Avg views/video</div>
                <div class="text-xl sm:text-2xl font-semibold tabular-nums text-white">
                  {{ youtubeDemo.totals.avgViews.toLocaleString() }}
                </div>
              </div>
            </div>

            <div class="mt-4 grid md:grid-cols-2 gap-3">
              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div class="text-white font-semibold flex items-center justify-between gap-3">
                  <span>YouTube insights</span>
                  <span class="text-white/50 text-xs">{{ selectedRangeLabel }}</span>
                </div>
                <ul class="mt-3 list-disc pl-5 text-white/80 text-sm space-y-1">
                  <li v-for="(b, i) in youtubeDemo.insights" :key="i">{{ b }}</li>
                </ul>
              </div>

              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div class="text-white font-semibold flex items-center justify-between gap-3">
                  <span>Recent uploads</span>
                  <span class="text-white/50 text-xs">{{ youtubeDemo.videos.length }}</span>
                </div>

                <div class="mt-3 grid gap-3">
                  <a
                    v-for="vid in youtubeDemo.videos"
                    :key="vid.id"
                    :href="`https://www.youtube.com/watch?v=${vid.id}`"
                    target="_blank"
                    rel="noopener"
                    class="group flex gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3 focus:outline-none focus:ring-2 focus:ring-red-500/40 motion-reduce:transition-none"
                  >
                    <img
                      :src="vid.thumbnail"
                      alt=""
                      class="w-20 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                      loading="lazy"
                      decoding="async"
                    />
                    <div class="min-w-0">
                      <div class="text-white text-sm font-semibold truncate group-hover:text-white">
                        {{ vid.title }}
                      </div>
                      <div class="text-white/55 text-xs mt-0.5">
                        {{ vid.publishedLabel }}
                        <span class="mx-1">•</span>
                        {{ vid.views.toLocaleString() }} views
                      </div>
                      <div class="text-red-200/80 text-xs mt-1">
                        Watch →
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
          <div class="px-4 py-4 flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 min-w-0">
              <div class="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" class="h-5 w-5 text-emerald-200" fill="currentColor" aria-hidden="true">
                  <path
                    d="M7 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3H7V7zm0 5h16v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5z"
                    opacity="0.25"
                  />
                  <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19a1 1 0 0 1 0 2H7.5A.5.5 0 0 0 7 6.5V7H5v-.5z" />
                  <path d="M9 15.5a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1z" />
                </svg>
              </div>

              <div class="min-w-0">
                <div class="text-white font-semibold">Payments & payouts (beta)</div>
                <div class="text-white/60 text-xs mt-0.5">
                  Track tips, merch, and ticket revenue — see net payout performance over time.
                </div>
              </div>
            </div>

            <div class="shrink-0 text-right">
              <span
                :class="[
                  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide',
                  paymentsDemo.status === 'ready'
                    ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/25'
                    : paymentsDemo.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-200 border-amber-400/25'
                      : 'bg-red-500/10 text-red-200 border-red-400/25',
                ]"
              >
                {{ paymentsDemo.statusLabel }}
              </span>
              <div class="text-white/50 text-[11px] mt-1">next payout {{ paymentsDemo.nextPayout }}</div>
            </div>
          </div>

          <div class="px-4 pb-4">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
                <div class="text-white/60 text-xs">Gross</div>
                <div class="text-xl sm:text-2xl font-semibold tabular-nums text-white">
                  {{ formatUsd(paymentsDemo.kpis.gross) }}
                </div>
                <div class="text-white/50 text-xs mt-1">{{ selectedRangeLabel }}</div>
              </div>
              <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
                <div class="text-white/60 text-xs">Fees</div>
                <div class="text-xl sm:text-2xl font-semibold tabular-nums text-white">
                  {{ formatUsd(paymentsDemo.kpis.fees) }}
                </div>
                <div class="text-white/50 text-xs mt-1">processing + platform</div>
              </div>
              <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
                <div class="text-white/60 text-xs">Net</div>
                <div class="text-xl sm:text-2xl font-semibold tabular-nums text-white">
                  {{ formatUsd(paymentsDemo.kpis.net) }}
                </div>
                <div class="text-white/50 text-xs mt-1">paid out</div>
              </div>
              <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
                <div class="text-white/60 text-xs">Pending</div>
                <div class="text-xl sm:text-2xl font-semibold tabular-nums text-white">
                  {{ formatUsd(paymentsDemo.kpis.pending) }}
                </div>
                <div class="text-white/50 text-xs mt-1">clearing</div>
              </div>
            </div>

            <div class="mt-4 grid md:grid-cols-2 gap-3">
              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div class="text-white font-semibold flex items-center justify-between gap-3">
                  <span>Payout sources</span>
                  <span class="text-white/50 text-xs">{{ selectedRangeLabel }}</span>
                </div>
                <div class="mt-3 space-y-2">
                  <div
                    v-for="row in paymentsDemo.sources"
                    :key="row.name"
                    class="flex items-center gap-3"
                  >
                    <div class="w-28 truncate text-white/85 text-sm">{{ row.label }}</div>
                    <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        class="h-2 rounded-full bg-emerald-400/80"
                        :style="{ width: `${row.pct}%` }"
                      ></div>
                    </div>
                    <div class="w-16 text-right tabular-nums text-white/60 text-sm">{{ formatUsd(row.amount) }}</div>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div class="text-white font-semibold flex items-center justify-between gap-3">
                  <span>Payments insights</span>
                  <span class="text-white/50 text-xs">{{ paymentsDemo.payoutCount }} payouts</span>
                </div>
                <ul class="mt-3 list-disc pl-5 text-white/80 text-sm space-y-1">
                  <li v-for="(b, i) in paymentsDemo.insights" :key="i">{{ b }}</li>
                </ul>
              </div>
            </div>

            <div class="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-white font-semibold flex items-center justify-between gap-3">
                <span>Recent payouts</span>
                <span class="text-white/50 text-xs">{{ paymentsDemo.recent.length }}</span>
              </div>

              <div class="mt-3 grid gap-2">
                <div
                  v-for="p in paymentsDemo.recent"
                  :key="p.id"
                  class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div class="min-w-0">
                    <div class="text-white/90 text-sm font-semibold truncate">
                      {{ p.label }}
                    </div>
                    <div class="text-white/55 text-xs mt-0.5">
                      {{ p.dateLabel }}
                      <span class="mx-1">•</span>
                      {{ p.method }}
                    </div>
                  </div>

                  <div class="shrink-0 text-right">
                    <div class="text-white tabular-nums font-semibold">{{ formatUsd(p.amount) }}</div>
                    <div
                      :class="[
                        'text-[11px] mt-0.5 font-semibold',
                        p.status === 'paid'
                          ? 'text-emerald-200'
                          : p.status === 'processing'
                            ? 'text-amber-200'
                            : 'text-white/60',
                      ]"
                    >
                      {{ p.statusLabel }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 grid md:grid-cols-2 gap-3">
          <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div class="text-white font-semibold">Top Sources</div>
            <div class="mt-3 space-y-2">
              <div
                v-for="row in topSources"
                :key="row.name"
                class="flex items-center gap-3"
              >
                <div class="w-28 truncate text-white/85 text-sm">{{ row.name }}</div>
                <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    class="h-2 rounded-full bg-purple-400/80"
                    :style="{ width: `${row.pct}%` }"
                  ></div>
                </div>
                <div class="w-10 text-right tabular-nums text-white/60 text-sm">{{ row.count }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div class="text-white font-semibold">Top Devices</div>
            <div class="mt-3 space-y-2">
              <div
                v-for="row in topDevices"
                :key="row.name"
                class="flex items-center gap-3"
              >
                <div class="w-28 truncate text-white/85 text-sm">{{ row.name }}</div>
                <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    class="h-2 rounded-full bg-emerald-400/80"
                    :style="{ width: `${row.pct}%` }"
                  ></div>
                </div>
                <div class="w-10 text-right tabular-nums text-white/60 text-sm">{{ row.count }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div class="text-white/60 text-xs">
            Demo data — the real dashboard updates in real-time.
          </div>
          <div class="text-white/50 text-xs">
            Tip: hover bars/points.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { Chart } from 'chart.js/auto'

type Tab = 'Page Views' | 'Link Clicks' | 'Songs' | 'Videos' | 'QR Scans'

const tabs: Tab[] = ['Page Views', 'Link Clicks', 'Songs', 'Videos', 'QR Scans']

const rangeOptions = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
  { days: 365, label: 'Last 1 Year' },
] as const

const selectedTab = ref<Tab>('Page Views')
const selectedRange = ref<(typeof rangeOptions)[number]['days']>(30)
const chartType = ref<'bar' | 'line'>('bar')

const hoverIndex = ref<number | null>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

function hashSeed(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const chartConfig = computed(() => {
  const seed = hashSeed(`${selectedTab.value}|${selectedRange.value}`)
  const rand = mulberry32(seed)

  const kindScale =
    selectedTab.value === 'Page Views'
      ? 1
      : selectedTab.value === 'Link Clicks'
        ? 0.55
        : selectedTab.value === 'QR Scans'
          ? 0.35
          : 0.25

  if (selectedRange.value === 1) {
    const labels = Array.from({ length: 24 }, (_, i) => {
      const h = i % 12
      const hour = h === 0 ? 12 : h
      const ampm = i < 12 ? 'AM' : 'PM'
      return `${hour}${ampm}`
    })

    const data = labels.map((_l, i) => {
      const wave = 0.55 + 0.45 * Math.sin((i / 24) * Math.PI * 2 - 1)
      const noise = 0.55 + rand() * 0.8
      return Math.round(18 * kindScale * wave * noise)
    })

    return { labels, data }
  }

  const count = selectedRange.value === 365 ? 12 : selectedRange.value === 30 ? 14 : 7
  const labels = Array.from({ length: count }, (_v, i) => {
    if (selectedRange.value === 365) {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]
    }
    return `Day ${i + 1}`
  })

  const data = labels.map((_l, i) => {
    const trend = 0.75 + i * (selectedRange.value === 365 ? 0.03 : 0.06)
    const spike = rand() > 0.92 ? 2.2 : 1
    const noise = 0.7 + rand() * 0.9
    return Math.max(0, Math.round(22 * kindScale * trend * noise * spike))
  })

  return { labels, data }
})

const points = computed(() => {
  const { labels, data } = chartConfig.value
  const max = Math.max(...data, 1)

  return labels.map((label, i) => {
    const v = data[i] ?? 0
    return {
      key: `${label}-${i}`,
      label,
      value: v,
      heightPct: Math.max(2, Math.round((v / max) * 94)),
    }
  })
})

const axisLabels = computed(() => {
  const labels = chartConfig.value.labels
  if (labels.length <= 7) return labels
  if (labels.length <= 14) return [labels[0], labels[3], labels[6], labels[9], labels[13]].filter(Boolean)
  return [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]].filter(Boolean)
})

const linePoints = computed(() => {
  const pts = points.value
  const n = pts.length
  if (!n) return []

  return pts.map((p, i) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100
    const y = 100 - p.heightPct
    return { ...p, x, y }
  })
})

const linePath = computed(() => {
  const pts = linePoints.value
  if (!pts.length) return ''

  const d: string[] = []
  pts.forEach((p, i) => {
    d.push(`${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
  })
  return d.join(' ')
})

function smoothBezierPath(pts: Array<{ x: number; y: number }>) {
  if (pts.length < 2) return ''
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`
  }

  const tension = 1
  const controlScale = (tension * 0.18)

  const d: string[] = [`M ${pts[0].x} ${pts[0].y}`]

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2

    const c1x = p1.x + (p2.x - p0.x) * controlScale
    const c1y = p1.y + (p2.y - p0.y) * controlScale
    const c2x = p2.x - (p3.x - p1.x) * controlScale
    const c2y = p2.y - (p3.y - p1.y) * controlScale

    d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`)
  }

  return d.join(' ')
}

const smoothLinePath = computed(() => {
  const pts = linePoints.value.map((p) => ({ x: p.x, y: p.y }))
  return smoothBezierPath(pts)
})

const smoothAreaPath = computed(() => {
  const pts = linePoints.value
  if (!pts.length) return ''
  const top = smoothLinePath.value
  return `${top} L 100 100 L 0 100 Z`
})

const barSvgBars = computed(() => {
  const pts = points.value
  const n = pts.length
  if (!n) return []

  const step = 100 / n
  const w = step * 0.72
  const gap = step - w

  const values = pts.map((p) => p.value)
  const max = Math.max(...values, 1)

  const baseline = 94
  const maxH = 84
  const minH = 6

  return pts.map((p, i) => {
    const ratio = p.value / max
    const h = Math.max(minH, Math.round(minH + ratio * (maxH - minH)))
    const x = i * step + gap / 2
    const y = baseline - h
    return {
      key: p.key,
      label: p.label,
      value: p.value,
      x,
      y,
      w,
      h,
      rx: Math.min(2.4, w / 2),
    }
  })
})

const areaPath = computed(() => {
  const pts = linePoints.value
  if (!pts.length) return ''

  return `${linePath.value} L 100 100 L 0 100 Z`
})

const hoveredPoint = computed(() => {
  if (hoverIndex.value == null) return null
  const p = points.value[hoverIndex.value]
  if (!p) return null
  return { label: p.label, value: p.value }
})

const selectedRangeLabel = computed(() => {
  const opt = rangeOptions.find((o) => o.days === selectedRange.value)
  return opt?.label || `Last ${selectedRange.value} Days`
})

const chartTitle = computed(() => {
  const tab = selectedTab.value
  const noun = tab === 'Page Views' ? 'Views' : tab === 'Link Clicks' ? 'Clicks' : tab === 'QR Scans' ? 'Scans' : 'Plays'
  return `${tab} (${noun})`
})

const chartSubtitle = computed(() => {
  if (selectedRange.value === 1) return 'Hourly activity'
  if (selectedRange.value === 365) return 'Monthly trend'
  return `${selectedRangeLabel.value}`
})

const totalValue = computed(() => {
  return chartConfig.value.data.reduce((a, b) => a + (Number(b) || 0), 0)
})

const engagementRate = computed(() => {
  const seed = hashSeed(`engagement|${selectedTab.value}|${selectedRange.value}`)
  const rand = mulberry32(seed)
  return Math.round((18 + rand() * 52) * 10) / 10
})

const topCity = computed(() => {
  const seed = hashSeed(`city|${selectedTab.value}|${selectedRange.value}`)
  const rand = mulberry32(seed)
  const cities = ['Austin, TX', 'Brooklyn, NY', 'Nashville, TN', 'Los Angeles, CA', 'Chicago, IL', 'Seattle, WA']
  const idx = Math.floor(rand() * cities.length)
  return { name: cities[idx] || 'Austin, TX', count: Math.round(40 + rand() * 260) }
})

const topPlatform = computed(() => {
  const seed = hashSeed(`platform|${selectedTab.value}|${selectedRange.value}`)
  const rand = mulberry32(seed)
  const platforms = ['Spotify', 'YouTube', 'Instagram', 'TikTok', 'Apple Music', 'Facebook']
  const idx = Math.floor(rand() * platforms.length)
  return { name: platforms[idx] || 'Spotify', count: Math.round(20 + rand() * 190) }
})

const topSources = computed(() => {
  const seed = hashSeed(`sources|${selectedTab.value}|${selectedRange.value}`)
  const rand = mulberry32(seed)
  const rows = [
    { name: 'direct', base: 120 },
    { name: 'instagram', base: 90 },
    { name: 'qr', base: 70 },
    { name: 'search', base: 55 },
  ].map((r) => ({
    ...r,
    count: Math.round(r.base * (0.65 + rand() * 0.9)),
  }))

  const max = Math.max(...rows.map((r) => r.count), 1)
  return rows
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((r) => ({
      name: r.name,
      count: r.count,
      pct: Math.max(6, Math.round((r.count / max) * 100)),
    }))
})

const topDevices = computed(() => {
  const seed = hashSeed(`devices|${selectedTab.value}|${selectedRange.value}`)
  const rand = mulberry32(seed)
  const rows = [
    { name: 'mobile', base: 160 },
    { name: 'desktop', base: 70 },
    { name: 'tablet', base: 25 },
    { name: 'bot', base: 15 },
  ].map((r) => ({
    ...r,
    count: Math.round(r.base * (0.65 + rand() * 0.9)),
  }))

  const max = Math.max(...rows.map((r) => r.count), 1)
  return rows
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((r) => ({
      name: r.name,
      count: r.count,
      pct: Math.max(6, Math.round((r.count / max) * 100)),
    }))
})

const youtubeDemo = computed(() => {
  const seed = hashSeed(`youtube|${selectedRange.value}|${selectedTab.value}`)
  const rand = mulberry32(seed)

  const connected = true
  const syncedHours = Math.max(1, Math.round(rand() * 16))
  const syncedAgo = syncedHours <= 1 ? '1h ago' : `${syncedHours}h ago`

  const totalVideos = Math.round(18 + rand() * 46)
  const subs = Math.round(120 + rand() * 8400)
  const channelViews = Math.round(25000 + rand() * 620000)
  const avgViews = Math.max(120, Math.round(channelViews / Math.max(1, totalVideos) * (0.6 + rand() * 0.8)))

  const insights = [
    'Your latest upload is trending — add it as the featured video on your smart link page.',
    'Short-form clips are driving discovery. Repurpose a 15s chorus cut this week.',
    'Most views land after 6pm. Schedule your next post for evening traffic.',
  ].slice(0, 3)

  const videoSeeds = [
    { id: 'cUR4LFl_UME', title: 'Neon Avenue — Turns Me On (Official Video)' },
    { id: 'BmdNv51ORVA', title: 'Behind the Scenes: Studio Session' },
    { id: 'dQw4w9WgXcQ', title: 'Live at The Skyline (Full Set)' },
    { id: 'kJQP7kiw5Fk', title: 'New Single Teaser (Shorts)' },
  ]

  const videos = videoSeeds.map((v, i) => {
    const r = mulberry32(hashSeed(`${seed}|vid|${i}`))
    const views = Math.round(800 + r() * 98000)
    const daysAgo = Math.round(2 + r() * 52)
    const publishedLabel = daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
    return {
      id: v.id,
      title: v.title,
      views,
      publishedLabel,
      thumbnail: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
    }
  })

  return {
    connected,
    syncedAgo,
    totals: {
      totalVideos,
      subs,
      channelViews,
      avgViews,
    },
    insights,
    videos,
  }
})

function formatUsd(amount: number) {
  const v = Number(amount) || 0
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

const paymentsDemo = computed(() => {
  const seed = hashSeed(`payments|${selectedRange.value}|${selectedTab.value}`)
  const rand = mulberry32(seed)

  const statusRoll = rand()
  const status = statusRoll > 0.12 ? 'ready' : statusRoll > 0.05 ? 'pending' : 'not_ready'
  const statusLabel =
    status === 'ready'
      ? 'payouts enabled'
      : status === 'pending'
        ? 'verification pending'
        : 'payouts disabled'

  const nextDays = status === 'ready' ? Math.max(1, Math.round(1 + rand() * 6)) : null
  const nextPayout =
    status === 'ready'
      ? nextDays === 1
        ? 'tomorrow'
        : `in ${nextDays} days`
      : '—'

  const gross = Math.round((220 + rand() * 2200) * (selectedRange.value === 365 ? 8.5 : 1) * (selectedRange.value === 1 ? 0.35 : 1))
  const feeRate = 0.045 + rand() * 0.035
  const fees = Math.round(gross * feeRate)
  const pending = Math.round(gross * (0.08 + rand() * 0.18))
  const net = Math.max(0, gross - fees - pending)

  const sourcesBase = [
    { name: 'tips', label: 'Tips', base: 0.42 },
    { name: 'merch', label: 'Merch', base: 0.34 },
    { name: 'tickets', label: 'Tickets', base: 0.18 },
    { name: 'subs', label: 'Subs', base: 0.06 },
  ]
    .map((r, i) => {
      const r2 = mulberry32(hashSeed(`${seed}|src|${i}`))
      return { ...r, weight: Math.max(0.03, r.base * (0.75 + r2() * 0.7)) }
    })

  const sumW = sourcesBase.reduce((a, b) => a + b.weight, 0) || 1
  const sourcesRaw = sourcesBase.map((s) => ({
    ...s,
    amount: Math.round(gross * (s.weight / sumW)),
  }))
  const maxAmt = Math.max(...sourcesRaw.map((s) => s.amount), 1)
  const sources = sourcesRaw
    .sort((a, b) => b.amount - a.amount)
    .map((s) => ({
      name: s.name,
      label: s.label,
      amount: s.amount,
      pct: Math.max(6, Math.round((s.amount / maxAmt) * 100)),
    }))

  const payoutCount = Math.max(2, Math.round(2 + rand() * (selectedRange.value === 365 ? 28 : 10)))
  const insights = [
    'Fans tip more when the CTA is above the fold — try "Support the band" near the top link block.',
    'Your best conversion happens after shows. Enable QR codes at merch table and stage corners.',
    'Merch bundles lift average order value. Pair a tee + sticker pack and highlight it first.',
  ].slice(0, 3)

  const methods = ['instant payout', 'standard payout', 'manual transfer']
  const recent = Array.from({ length: 4 }, (_v, i) => {
    const r = mulberry32(hashSeed(`${seed}|payout|${i}`))
    const amt = Math.round(28 + r() * 620)
    const daysAgo = Math.max(1, Math.round(1 + r() * 21))
    const statusRoll2 = r()
    const pStatus = statusRoll2 > 0.22 ? 'paid' : 'processing'
    const statusLabel2 = pStatus === 'paid' ? 'paid' : 'processing'
    const method = methods[Math.floor(r() * methods.length)] || methods[0]
    const label = i === 0 ? 'Weekly payout' : i === 1 ? 'Show night tips' : i === 2 ? 'Merch batch' : 'Ticket split'
    return {
      id: `${seed}-${i}`,
      label,
      amount: amt,
      dateLabel: daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`,
      method,
      status: pStatus,
      statusLabel: statusLabel2,
    }
  })

  return {
    status,
    statusLabel,
    nextPayout,
    payoutCount,
    kpis: { gross, fees, net, pending },
    sources,
    insights,
    recent,
  }
})

// Chart.js rendering
function createChart() {
  if (!chartCanvas.value) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const { labels, data } = chartConfig.value
  const isBar = chartType.value === 'bar'

  // Create gradient for line chart fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)')
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')

  chartInstance = new Chart(ctx, {
    type: isBar ? 'bar' : 'line',
    data: {
      labels,
      datasets: [{
        label: selectedTab.value,
        data,
        backgroundColor: isBar 
          ? 'rgba(52, 211, 153, 0.85)' 
          : gradient,
        borderColor: isBar 
          ? 'rgba(52, 211, 153, 1)' 
          : 'rgba(52, 211, 153, 1)',
        borderWidth: isBar ? 0 : 3,
        borderRadius: isBar ? 6 : 0,
        fill: !isBar,
        tension: 0.4,
        pointBackgroundColor: 'rgba(52, 211, 153, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
        pointRadius: isBar ? 0 : 4,
        pointHoverRadius: isBar ? 0 : 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
        easing: 'easeOutQuart',
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'rgba(255, 255, 255, 0.9)',
          bodyColor: 'rgba(52, 211, 153, 1)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          titleFont: {
            size: 12,
            weight: '500',
          },
          bodyFont: {
            size: 16,
            weight: '600',
          },
          callbacks: {
            label: (context) => context.parsed.y.toLocaleString(),
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
            drawBorder: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: {
              size: 11,
            },
            maxRotation: 0,
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
            drawBorder: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: {
              size: 11,
            },
            padding: 8,
          },
          border: {
            display: false,
          },
        },
      },
    },
  })
}

// Watch for changes and update chart
watch([chartConfig, chartType], () => {
  createChart()
}, { deep: true })

onMounted(() => {
  // Small delay to ensure canvas is ready
  setTimeout(createChart, 50)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>
