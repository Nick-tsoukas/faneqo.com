<template>
  <div
    class="px-4 sm:px-6 py-10 bg-gradient-to-b from-black via-slate-950 to-black min-h-screen pt-[var(--header-height)] max-w-5xl mx-auto"
  >
    <!-- Header -->
    <div class="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 shadow-[0_25px_60px_rgba(0,0,0,0.55)] mb-6">
      <div class="px-6 py-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0">
            <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Analytics Dashboard</h2>
            <p class="text-white/70 mt-1 text-sm sm:text-base">
              Understand what fans do after they scan.
            </p>
          </div>

          <div class="flex items-center gap-1.5 shrink-0 bg-black/20 border border-white/10 rounded-full p-1">
            <button
              type="button"
              :aria-pressed="chartDisplayType === 'bar'"
              @click="setChartDisplayType('bar')"
              :class="[
                'px-3 py-1 text-xs rounded-full transition',
                chartDisplayType === 'bar'
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : 'text-white/70 hover:bg-white/5',
                'motion-reduce:transition-none',
              ]"
            >
              Bar
            </button>
            <button
              type="button"
              :aria-pressed="chartDisplayType === 'line'"
              @click="setChartDisplayType('line')"
              :class="[
                'px-3 py-1 text-xs rounded-full transition',
                chartDisplayType === 'line'
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : 'text-white/70 hover:bg-white/5',
                'motion-reduce:transition-none',
              ]"
            >
              Line
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Summary - Most important, at top -->
    <div class="chart-card mb-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h3 class="text-white text-lg font-semibold">Performance</h3>
          <!-- Pulse Score Badge -->
          <div 
            v-if="pulseData?.pulseScore" 
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            :class="[
              pulseData.pulseScore >= 70 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              pulseData.pulseScore >= 40 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-red-500/20 text-red-300 border border-red-500/30'
            ]"
            title="MBQ Pulse Score"
          >
            <span class="text-[10px]">⚡</span>
            <span>{{ pulseData.pulseScore }}</span>
          </div>
        </div>
        <span class="text-gray-400 text-xs">{{ museRangeLabel }}</span>
      </div>

      <div v-if="!liveMuseSummary" class="text-gray-400 text-sm">
        No data yet.
      </div>

      <div v-else>
        <!-- Primary metrics row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <!-- Page Views - Hero metric -->
          <div class="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-400/20 rounded-xl p-4">
            <p class="text-purple-300 text-xs font-medium uppercase tracking-wide">Views</p>
            <p class="text-3xl font-bold text-white mt-1">
              {{ (liveMuseSummary.pageViews ?? 0).toLocaleString() }}
            </p>
            <p
              :class="[
                'text-xs font-medium mt-1',
                liveMuseSummary.growthPct > 0
                  ? 'text-emerald-400'
                  : liveMuseSummary.growthPct < 0
                    ? 'text-red-400'
                    : 'text-gray-500',
              ]"
            >
              {{ liveMuseSummary.growthPct > 0 ? '↑' : liveMuseSummary.growthPct < 0 ? '↓' : '' }} {{ Math.abs(liveMuseSummary.growthPct ?? 0) }}% vs prior
            </p>
          </div>

          <!-- Engagement - Hero metric -->
          <div class="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-400/20 rounded-xl p-4">
            <p class="text-emerald-300 text-xs font-medium uppercase tracking-wide">Engagement</p>
            <p class="text-3xl font-bold text-white mt-1">
              {{ liveMuseSummary.engagementRate ?? 0 }}%
            </p>
            <p class="text-xs text-gray-500 mt-1">Clicks + plays + scans</p>
          </div>

          <!-- Top City -->
          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-4">
            <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">Top City</p>
            <p class="text-xl font-semibold text-white mt-1 truncate">
              {{ topCityKpi.city }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ topCityKpi.count.toLocaleString() }} visits</p>
          </div>

          <!-- Top Platform -->
          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-4">
            <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">Top Platform</p>
            <p class="text-xl font-semibold text-white mt-1 truncate capitalize">
              {{ topPlatformKpi.platform || '—' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ topPlatformKpi.count.toLocaleString() }} clicks</p>
          </div>
        </div>

        <!-- Secondary metrics row -->
        <div class="grid grid-cols-4 gap-2">
          <div class="text-center p-3 rounded-lg bg-white/[0.02]">
            <p class="text-xl font-semibold text-white">{{ (liveMuseSummary.linkClicks ?? 0).toLocaleString() }}</p>
            <p class="text-xs text-gray-500">Clicks</p>
          </div>
          <div class="text-center p-3 rounded-lg bg-white/[0.02]">
            <p class="text-xl font-semibold text-white">{{ (liveMuseSummary.qrScans ?? 0).toLocaleString() }}</p>
            <p class="text-xs text-gray-500">QR Scans</p>
          </div>
          <div class="text-center p-3 rounded-lg bg-white/[0.02]">
            <p class="text-xl font-semibold text-white">{{ (liveMuseSummary.songPlays ?? 0).toLocaleString() }}</p>
            <p class="text-xs text-gray-500">Songs</p>
          </div>
          <div class="text-center p-3 rounded-lg bg-white/[0.02]">
            <p class="text-xl font-semibold text-white">{{ (liveMuseSummary.videoPlays ?? 0).toLocaleString() }}</p>
            <p class="text-xs text-gray-500">Videos</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform Clicks - Second most important -->
    <AnalyticsPlatformClicksCard
      :platform-data="topClickPlatforms"
      :loading="isInitialLoading"
      :range-label="museRangeLabel"
      class="mb-6"
    />

    <!-- 💜 Follow Attempts -->
    <div class="chart-card mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-white text-lg font-semibold">Follow Attempts</h3>
          <p class="text-gray-400 text-xs mt-0.5">
            Fans who clicked "Follow" and were redirected to your platforms
          </p>
        </div>
        <span class="text-gray-400 text-xs">{{ museRangeLabel }}</span>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
          <p class="text-gray-400 text-xs">Redirects</p>
          <p class="text-2xl font-semibold text-white tabular-nums">
            {{ followsData?.totals?.redirects ?? 0 }}
          </p>
          <p class="text-xs text-gray-500 mt-0.5">Follow attempts</p>
        </div>

        <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
          <p class="text-gray-400 text-xs">Modal Opens</p>
          <p class="text-2xl font-semibold text-white tabular-nums">
            {{ followsData?.totals?.opens ?? 0 }}
          </p>
        </div>

        <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
          <p class="text-gray-400 text-xs">Confirms</p>
          <p class="text-2xl font-semibold text-white tabular-nums">
            {{ followsData?.totals?.confirms ?? 0 }}
          </p>
        </div>

        <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
          <p class="text-gray-400 text-xs">Conversion</p>
          <p class="text-2xl font-semibold text-white tabular-nums">
            {{ followsData?.funnel?.overallRate ?? 0 }}%
          </p>
          <p class="text-xs text-gray-500 mt-0.5">Opens → Redirects</p>
        </div>
      </div>

      <!-- Platform Breakdown -->
      <div v-if="followsPlatforms.length" class="mb-4">
        <h4 class="text-white font-medium mb-3 text-sm">Top Platforms</h4>
        <ul class="text-gray-200 text-sm space-y-2">
          <li
            v-for="p in followsPlatforms"
            :key="p.platformId"
            class="flex items-center gap-2"
          >
            <span class="inline-block w-28 truncate text-white capitalize">{{
              p.platformId
            }}</span>
            <div class="h-2 bg-gray-800 rounded w-full">
              <div
                class="h-2 bg-purple-500 rounded"
                :style="{
                  width:
                    Math.min(
                      100,
                      Math.round(
                        (p.count / (followsPlatforms[0]?.count || 1)) * 100
                      )
                    ) + '%',
                }"
              />
            </div>
            <span class="text-gray-400 w-10 text-right tabular-nums">{{
              p.count
            }}</span>
          </li>
        </ul>
      </div>

      <!-- Funnel Mini -->
      <div
        v-if="(followsData?.totals?.opens ?? 0) > 0"
        class="flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-white/5"
      >
        <span class="text-white font-medium">Funnel:</span>
        <span>{{ followsData?.totals?.opens ?? 0 }} opens</span>
        <span>→</span>
        <span>{{ followsData?.totals?.confirms ?? 0 }} confirms ({{ followsData?.funnel?.confirmRate ?? 0 }}%)</span>
        <span>→</span>
        <span>{{ followsData?.totals?.redirects ?? 0 }} redirects</span>
      </div>

      <!-- Empty state -->
      <div
        v-if="!followsData || (followsData?.totals?.redirects === 0 && followsData?.totals?.opens === 0)"
        class="text-gray-400 text-sm"
      >
        No follow activity yet. The "Follow" button on your band page will track fan engagement here.
      </div>
    </div>

    <!-- Insights (MUSE) - V2 Panel -->
    <InsightsPanel 
      v-if="bandId"
      :band-id="bandId"
      class="mb-4"
      @action="handleInsightAction"
    />

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="selectedTab = tab"
        :class="[
          'px-3 py-1.5 text-sm rounded-full border transition-colors shadow-sm',
          selectedTab === tab
            ? 'bg-purple-500/20 text-purple-100 border-purple-400/40'
            : 'bg-black/30 text-gray-300 border-white/10 hover:bg-white/5',
        ]"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Range Selector -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="(label, days) in rangeOptions"
        :key="days"
        @click="selectedRange = Number(days)"
        :class="[
          'px-3 py-1 text-sm rounded-full border transition-colors shadow-sm',
          selectedRange === Number(days)
            ? 'bg-purple-500/20 text-purple-100 border-purple-400/40'
            : 'bg-black/30 text-gray-300 border-white/10 hover:bg-white/5',
        ]"
      >
        {{ label }}
      </button>
    </div>

    <!-- Date Picker (Only for Today/Hourly) -->
    <div v-if="selectedRange === 1" class="mb-6 flex items-center gap-3">
      <label class="text-white text-sm">Select Day:</label>
      <input
        type="date"
        v-model="selectedDate"
        class="bg-black/30 text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
      />
    </div>

    <!-- only for first load -->
    <div v-if="isInitialLoading" class="text-white">🔄 Loading data…</div>

    <!-- after first load, never collapse -->
    <div v-else class="space-y-6">
      <!-- Page Views / Clicks / Plays / QR -->
      <div class="chart-card relative">
        <!-- small overlay while refreshing (range change) -->
        <div
          v-if="isRefreshing"
          class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"
        >
          <span class="text-gray-200 text-sm">Refreshing…</span>
        </div>

        <div class="flex items-center justify-between mb-2">
          <div class="min-w-0">
            <h3 class="text-white font-semibold">{{ chartTitle }}</h3>
            <div class="text-white/60 text-xs mt-0.5">
              {{
                selectedRange === 1
                  ? humanDayLabel(selectedDate)
                  : `Last ${selectedRange} days`
              }}
            </div>
          </div>
        </div>
        <div class="chart-wrap ratio-16x9">
          <ClientOnly>
            <canvas ref="viewsCanvas" class="chart-canvas" />
          </ClientOnly>
        </div>
      </div>

      <!-- USA Heat Map -->
      <UsHeatMapCard
        v-if="bandId"
        entity-type="band"
        :entity-id="bandId"
      />

      <!-- Top Cities (from /analytics/geo) -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-white font-semibold">Top Cities</h3>
          <span v-if="topCities.length" class="text-white/50 text-xs">
            {{ topCities.length }} total
          </span>
        </div>

        <div v-if="paginatedCities.length" class="space-y-2">
          <div
            v-for="[city, count] in paginatedCities"
            :key="city"
            class="flex items-center gap-3"
          >
            <div class="w-28 truncate text-white/85 text-sm">{{ city }}</div>
            <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                class="h-2 rounded-full bg-emerald-400/80"
                :style="{
                  width:
                    Math.min(
                      100,
                      Math.round((count / (topCities[0]?.[1] || 1)) * 100)
                    ) + '%',
                }"
              />
            </div>
            <div class="w-10 text-right tabular-nums text-white/60 text-sm">{{ count }}</div>
          </div>
        </div>
        <p v-else class="text-white/50 text-sm">No city data yet.</p>
        
        <!-- Pagination -->
        <div v-if="totalCityPages > 1" class="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <button
            @click="cityPage = Math.max(1, cityPage - 1)"
            :disabled="cityPage === 1"
            class="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="cityPage === 1 ? 'border-white/10 text-gray-500' : 'border-white/20 text-gray-300 hover:bg-white/5'"
          >
            ← Prev
          </button>
          <span class="text-xs text-gray-400">
            Page {{ cityPage }} of {{ totalCityPages }}
          </span>
          <button
            @click="cityPage = Math.min(totalCityPages, cityPage + 1)"
            :disabled="cityPage === totalCityPages"
            class="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="cityPage === totalCityPages ? 'border-white/10 text-gray-500' : 'border-white/20 text-gray-300 hover:bg-white/5'"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Sources / Mediums / Referrers (from server rollups) -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-white font-semibold">Sources</h3>
          <span class="text-white/50 text-xs">{{ totalViewsInRange }} in range</span>
        </div>

        <p class="text-white/60 text-sm mb-4">
          Where your fans are coming from — social media, search, QR codes, or other sites.
        </p>

        <div class="grid md:grid-cols-3 gap-4">
          <!-- By Source -->
          <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h4 class="text-white font-semibold mb-3">By Source</h4>
            <div v-if="sourceCounts.length" class="space-y-2">
              <div
                v-for="[src, count] in sourceCounts"
                :key="src"
                class="flex items-center gap-3"
              >
                <div class="w-28 truncate text-white/85 text-sm capitalize">{{ src }}</div>
                <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    class="h-2 rounded-full bg-purple-400/80"
                    :style="{
                      width:
                        Math.min(
                          100,
                          Math.round(
                            (count / (sourceCounts[0]?.[1] || 1)) * 100
                          )
                        ) + '%',
                    }"
                  ></div>
                </div>
                <div class="w-10 text-right tabular-nums text-white/60 text-sm">{{ count }}</div>
              </div>
            </div>
            <p v-else class="text-white/50 text-sm">No source data yet.</p>
          </div>

          <!-- By Medium -->
          <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h4 class="text-white font-semibold mb-3">By Medium</h4>
            <div v-if="mediumCounts.length" class="space-y-2">
              <div
                v-for="[m, count] in mediumCounts"
                :key="m"
                class="flex items-center gap-3"
              >
                <div class="w-28 truncate text-white/85 text-sm capitalize">{{ m }}</div>
                <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    class="h-2 rounded-full bg-emerald-400/80"
                    :style="{
                      width:
                        Math.min(
                          100,
                          Math.round(
                            (count / (mediumCounts[0]?.[1] || 1)) * 100
                          )
                        ) + '%',
                    }"
                  ></div>
                </div>
                <div class="w-10 text-right tabular-nums text-white/60 text-sm">{{ count }}</div>
              </div>
            </div>
            <p v-else class="text-white/50 text-sm">No medium data yet.</p>
          </div>

          <!-- Top Referrers -->
          <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h4 class="text-white font-semibold mb-3">Top Referrers</h4>
            <div v-if="topRefDomains.length" class="space-y-2">
              <div
                v-for="[d, count] in topRefDomains"
                :key="d"
                class="flex items-center justify-between"
              >
                <span class="truncate text-white/85 text-sm">{{ d }}</span>
                <span class="text-white/60 tabular-nums text-sm">{{ count }}</span>
              </div>
            </div>
            <p v-else class="text-white/50 text-sm">No referrer domains yet.</p>
          </div>
        </div>
      </div>

      <!-- Devices (from server rollups) -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-white font-semibold">Top Devices</h3>
          <span class="text-white/50 text-xs">{{ totalDeviceViews }} total</span>
        </div>

        <div v-if="totalDeviceViews > 0" class="mt-3 space-y-2">
          <div
            v-for="item in deviceBreakdown"
            :key="item.key"
            class="flex items-center gap-3"
          >
            <div class="w-24 sm:w-28 truncate text-white/85 text-sm">
              {{ item.label }}
            </div>
            <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                class="h-2 rounded-full"
                :style="{ width: `${item.pct}%`, backgroundColor: item.color }"
              ></div>
            </div>
            <div class="w-14 text-right tabular-nums text-white/60 text-sm">
              {{ item.count }}
            </div>
          </div>
        </div>
        <div v-else class="text-gray-400 text-sm">No device data yet.</div>
      </div>

      <!-- 🎬 YouTube Analytics -->
      <div
        v-if="!youtubeData"
        class="mb-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center"
      >
        <div class="flex flex-col items-center justify-center gap-4">
          <div
            class="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-500/20 border border-red-400/20"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-7 h-7 text-white"
              fill="currentColor"
            >
              <path
                d="M21.58 7.19a1.52 1.52 0 0 0-1.07-1.08C19.37 5.75 12 5.75 12 5.75s-7.37 0-8.51.36a1.52 1.52 0 0 0-1.07 1.08 16.12 16.12 0 0 0-.35 3.36 16.12 16.12 0 0 0 .35 3.36 1.52 1.52 0 0 0 1.07 1.08c1.14.36 8.51.36 8.51.36s7.37 0 8.51-.36a1.52 1.52 0 0 0 1.07-1.08 16.12 16.12 0 0 0 .35-3.36 16.12 16.12 0 0 0-.35-3.36ZM10.06 14V8.99l4.73 2.51Z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-white text-lg font-semibold mb-1">
              Connect YouTube
            </h3>
            <p class="text-gray-400 text-sm max-w-sm mx-auto">
              Connect your YouTube channel to pull views, subs, and top video
              performance right into Muse analytics.
            </p>
          </div>
          <button
            @click="connectYoutube"
            class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            Connect YouTube
          </button>
        </div>
      </div>

      <!-- ✅ CONNECTED: YouTube Card -->
      <div
        v-else
        class="mb-6 rounded-2xl border border-white/10 bg-black/20 overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 pb-4"
        >
          <!-- Left: brand + title -->
          <div class="flex items-center gap-3">
            <div
              class="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-400/20 flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                class="w-6 h-6 text-white"
                fill="currentColor"
              >
                <path
                  d="M21.58 7.19a1.52 1.52 0 0 0-1.07-1.08C19.37 5.75 12 5.75 12 5.75s-7.37 0-8.51.36a1.52 1.52 0 0 0-1.07 1.08 16.12 16.12 0 0 0-.35 3.36 16.12 16.12 0 0 0 .35 3.36 1.52 1.52 0 0 0 1.07 1.08c1.14.36 8.51.36 8.51.36s7.37 0 8.51-.36a1.52 1.52 0 0 0 1.07-1.08 16.12 16.12 0 0 0 .35-3.36 16.12 16.12 0 0 0-.35-3.36ZM10.06 14V8.99l4.73 2.51Z"
                />
              </svg>
            </div>
            <div>
              <p
                class="text-xs uppercase tracking-wide text-red-200/70"
              >
                Connected platform
              </p>
              <h3
                class="text-white text-lg font-semibold leading-tight"
              >
                YouTube (beta)
              </h3>
            </div>
          </div>

          <!-- Right: actions (status + resync) -->
          <div class="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <!-- Status chip -->
            <span
              class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border"
              :class="
                youtubeStatusChip.tone === 'green'
                  ? 'bg-white/5 text-gray-200 border-white/10'
                  : 'bg-amber-500/10 text-amber-200 border-amber-400/20'
              "
              v-tooltip="youtubeStatusChip.tooltip"
            >
              <span
                class="w-1.5 h-1.5 rounded-full animate-pulse"
                :class="
                  youtubeStatusChip.tone === 'green'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                "
              ></span>
              {{ youtubeStatusChip.text }}
            </span>

            <!-- Re-sync -->
            <button
              @click="resyncYoutube"
              :disabled="youtubeResyncing"
              class="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition
                     disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none
                     focus:ring-2 focus:ring-red-500/50
                     bg-white/5 text-gray-200 border-white/10 hover:bg-white/10"
              aria-label="Re-sync YouTube"
              v-tooltip="'Refresh YouTube data and recent uploads'"
            >
              <svg
                viewBox="0 0 24 24"
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
              {{ youtubeResyncing ? 'Syncing…' : 'Re-sync' }}
            </button>

            <!-- Disconnect + Purge -->
            <button
              @click="purgeYoutube"
              :disabled="youtubePurging"
              class="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition
                     disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none
                     focus:ring-2 focus:ring-red-500/50
                     bg-red-500/10 text-red-200 border-red-400/20 hover:bg-red-500/20"
              aria-label="Disconnect YouTube"
              v-tooltip="'Disconnect YouTube and clear stored YouTube data'"
            >
              {{ youtubePurging ? 'Disconnecting…' : 'Disconnect' }}
            </button>
          </div>
        </div>

        <!-- Metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pb-5">
          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
            <p
              class="text-xs text-gray-300/80 mb-1"
              v-tooltip="'Channel views (fallback: sum of recent videos)'"
            >
              Total views
            </p>
            <p
              class="text-2xl font-semibold text-white tracking-tight"
            >
              {{ (richYoutube.totals.channelViews ?? 0).toLocaleString() }}
            </p>
          </div>

          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
            <p
              class="text-xs text-gray-300/80 mb-1"
              v-tooltip="'Number of uploaded videos found in your uploads feed'"
            >
              Videos
            </p>
            <p
              class="text-2xl font-semibold text-white tracking-tight"
            >
              {{ richYoutube.totals.totalVideos ?? 0 }}
            </p>
          </div>

          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
            <p
              class="text-xs text-gray-300/80 mb-1"
              v-tooltip="'Average views per video (Total views ÷ videos)'"
            >
              Avg views / video
            </p>
            <p
              class="text-2xl font-semibold text-white tracking-tight"
            >
              {{ (richYoutube.totals.avgViews ?? 0).toLocaleString() }}
            </p>
          </div>

          <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
            <p
              class="text-xs text-gray-300/80 mb-1"
              v-tooltip="'Days since your most recent upload'"
            >
              Last upload
            </p>
            <p
              class="text-2xl font-semibold text-white tracking-tight"
            >
              <template
                v-if="richYoutube.freshness.daysSinceLastUpload !== null"
              >
                {{ richYoutube.freshness.daysSinceLastUpload }}
                <span class="text-sm text-gray-400">days ago</span>
              </template>
              <template v-else>—</template>
            </p>
          </div>
        </div>

        <!-- Spotlight (Top & Newest) -->
        <div class="px-6 pb-5">
          <div class="grid gap-3 md:grid-cols-2">
            <!-- Top performer -->
            <div
              v-if="richYoutube.spotlight.top"
              class="relative flex items-center gap-3 bg-black/20 border border-red-500/10 rounded-lg px-4 py-3"
            >
              <span
                class="absolute -top-2 -left-2 text-[10px] uppercase tracking-wide bg-red-500 text-white px-2 py-0.5 rounded-full shadow"
              >
                Top
              </span>
              <div class="relative">
                <img
                  v-if="richYoutube.spotlight.top.thumbnail"
                  :src="richYoutube.spotlight.top.thumbnail"
                  alt=""
                  class="w-20 h-14 object-cover rounded-md"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div class="min-w-0">
                <p
                  class="text-xs uppercase text-gray-400 mb-1 tracking-wide flex items-center gap-1"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-red-400/90"
                  ></span>
                  Top video
                </p>
                <p class="text-sm text-white font-medium truncate">
                  {{ richYoutube.spotlight.top.title }}
                </p>
                <p class="text-xs text-gray-300">
                  {{
                    (richYoutube.spotlight.top.views ?? 0).toLocaleString()
                  }}
                  views
                </p>
              </div>
              <a
                v-if="richYoutube.spotlight.top.id"
                :href="`https://www.youtube.com/watch?v=${richYoutube.spotlight.top.id}`"
                target="_blank"
                rel="noopener"
                class="ml-auto flex items-center gap-1.5 bg-red-500 hover:bg-red-600 transition text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-[0_10px_20px_rgba(239,68,68,0.35)] focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                View
                <svg
                  viewBox="0 0 24 24"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </a>
            </div>

            <!-- Newest upload (hide if same as top) -->
            <div
              v-if="
                richYoutube.spotlight.newest &&
                (!richYoutube.spotlight.top ||
                  richYoutube.spotlight.newest.id !==
                    richYoutube.spotlight.top.id)
              "
              class="relative flex items-center gap-3 bg-black/20 border border-white/10 rounded-lg px-4 py-3"
            >
              <span
                v-if="
                  richYoutube.spotlight.newest.publishedAt &&
                  Date.now() -
                    new Date(
                      richYoutube.spotlight.newest.publishedAt
                    ).getTime() <=
                    7 * 86400000
                "
                class="absolute -top-2 -left-2 text-[10px] uppercase tracking-wide bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow"
              >
                New
              </span>
              <div class="relative">
                <img
                  v-if="richYoutube.spotlight.newest.thumbnail"
                  :src="richYoutube.spotlight.newest.thumbnail"
                  alt=""
                  class="w-20 h-14 object-cover rounded-md"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div class="min-w-0">
                <p
                  class="text-xs uppercase text-gray-400 mb-1 tracking-wide"
                >
                  Newest upload
                </p>
                <p class="text-sm text-white font-medium truncate">
                  {{ richYoutube.spotlight.newest.title }}
                </p>
                <p class="text-xs text-gray-300">
                  {{
                    richYoutube.spotlight.newest.publishedAt
                      ? new Date(
                          richYoutube.spotlight.newest.publishedAt
                        ).toLocaleDateString()
                      : '—'
                  }}
                </p>
              </div>
              <a
                v-if="richYoutube.spotlight.newest.id"
                :href="`https://www.youtube.com/watch?v=${richYoutube.spotlight.newest.id}`"
                target="_blank"
                rel="noopener"
                class="ml-auto inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200 mt-1 focus:outline-none focus:ring-2 focus:ring-red-500/40 rounded-full px-2 py-0.5"
              >
                Watch →
              </a>
            </div>
          </div>
        </div>

        <!-- Quick insights -->
        <div class="px-6 pb-3">
          <p
            class="text-xs uppercase text-gray-400 mb-2 tracking-wide"
          >
            Channel insights
          </p>
          <ul
            v-if="youtubeInsights.length"
            class="list-disc pl-5 text-gray-200 space-y-1"
          >
            <li v-for="(b, i) in youtubeInsights" :key="i">{{ b }}</li>
          </ul>
          <p v-else class="text-gray-400 text-sm">No insights yet.</p>
        </div>

        <!-- CTA line -->
        <div v-if="youtubeCtaLine" class="px-6 pb-6">
          <div
            class="bg-black/10 border border-white/10 rounded-lg p-3 text-sm text-gray-200"
          >
            {{ youtubeCtaLine }}
          </div>
        </div>

        <!-- Recent uploads -->
        <div v-if="richYoutube.videos.length" class="px-6 pb-6">
          <p
            class="text-sm text-white font-semibold mb-2 flex items-center gap-1"
          >
            Recent uploads
            <span class="text-xs text-gray-400"
              >({{ richYoutube.videos.length }})</span
            >
          </p>

          <div class="grid gap-3 md:grid-cols-2">
            <div
              v-for="vid in richYoutube.videos"
              :key="vid.id || vid.title"
              class="relative flex gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3 motion-reduce:transition-none"
            >
              <span
                v-if="(vid.views ?? 0) > 1000"
                class="absolute -top-2 -left-2 text-[10px] uppercase tracking-wide bg-purple-500 text-white px-2 py-0.5 rounded-full shadow"
              >
                1k+
              </span>

              <img
                v-if="vid.thumbnail"
                :src="vid.thumbnail"
                alt=""
                class="w-20 h-14 object-cover rounded-lg flex-shrink-0 border border-white/10"
                loading="lazy"
                decoding="async"
              />
              <div class="min-w-0">
                <p class="text-sm text-white font-medium truncate">
                  {{ vid.title }}
                </p>
                <p class="text-xs text-gray-400">
                  {{
                    vid.publishedAt
                      ? new Date(vid.publishedAt).toLocaleDateString()
                      : '—'
                  }}
                </p>
                <p class="text-xs text-gray-400">
                  {{ (vid.views ?? 0).toLocaleString() }} views
                </p>
                <a
                  v-if="vid.id"
                  :href="`https://www.youtube.com/watch?v=${vid.id}`"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200 mt-1 focus:outline-none focus:ring-2 focus:ring-red-500/40 rounded-full px-2 py-0.5"
                >
                  Watch →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- end youtube -->

      <!-- Payments: totals, fees, chart and full transaction history -->
      <div class="chart-card">
        <PaymentsDashboard v-if="bandId" :band-id="bandId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PaymentsDashboard from "@/components/payments/PaymentsDashboard.vue";
import {
  ref,
  watch,
  onMounted,
  nextTick,
  onBeforeUnmount,
  computed,
} from "vue";
import { useRoute, useStrapiClient, useStrapiToken, useRuntimeConfig } from "#imports";
import { format as fmt, parseISO, isValid, getHours } from "date-fns";
import qs from "qs";

/* ---------- Strapi client / route ---------- */
const client = useStrapiClient();
const route = useRoute();
const token = useStrapiToken();
const config = useRuntimeConfig();

/* ---------- Muse (top insights box) ---------- */
const museLoading = ref(false);
const museError = ref<any>(null);

const bandId = computed(() => Number(route.params.id));

/* ---------- Band info for PulseMomentsPanel ---------- */
const bandInfo = ref<{ name: string; slug: string; imageUrl: string | null; isBandNameInLogo: boolean } | null>(null);
const bandName = computed(() => bandInfo.value?.name || 'This Artist');
const bandSlug = computed(() => bandInfo.value?.slug || '');
const bandImageUrl = computed(() => bandInfo.value?.imageUrl || null);
const isBandNameInLogo = computed(() => bandInfo.value?.isBandNameInLogo || false);

async function fetchBandInfo() {
  if (!bandId.value) return;
  try {
    const res: any = await client(`/bands/${bandId.value}`, {
      params: { 
        fields: ['name', 'slug', 'isBandNameInLogo'],
        populate: ['bandImg'],
      },
    });
    if (res?.data) {
      const attrs = res.data.attributes || res.data;
      bandInfo.value = {
        name: attrs.name || 'This Artist',
        slug: attrs.slug || '',
        imageUrl: attrs.bandImg?.data?.attributes?.url || attrs.bandImg?.url || null,
        isBandNameInLogo: attrs.isBandNameInLogo || false,
      };
    }
  } catch (err) {
    console.warn('[analytics] Failed to fetch band info:', err);
  }
}

/* ---------- Analytics composable (rollups, geo, transitions, follows) ---------- */
const { getRollups, getGeo, getTransitions, getFollows } = useMuse();

/* ---------- Local directive: v-tooltip ---------- */
const vTooltip = {
  mounted(el: HTMLElement, binding: any) {
    if (binding?.value) el.setAttribute("title", String(binding.value));
  },
  updated(el: HTMLElement, binding: any) {
    if (binding?.value) el.setAttribute("title", String(binding.value));
  },
};

defineProps(); // no-op
defineEmits(); // no-op
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const directives = { tooltip: vTooltip };

/* ---------- UI state ---------- */
const tabs = ["Page Views", "Link Clicks", "Songs", "Videos", "QR Scans"] as const;
const selectedTab = ref<(typeof tabs)[number]>("Page Views");

const chartDisplayType = ref<"bar" | "line">("bar");

function setChartDisplayType(t: "bar" | "line") {
  chartDisplayType.value = t;
  try {
    localStorage.setItem("analytics_chart_type", t);
  } catch {}
}

const rangeOptions: Record<number, string> = {
  1: "Daily",
  7: "Last 7 Days",
  30: "Last 30 Days",
  365: "Last 1 Year",
};
const selectedRange = ref<number>(30);
const selectedDate = ref(fmt(new Date(), "yyyy-MM-dd"));

/* ---------- server rollup state ---------- */
const rollups = ref<any | null>(null);
const geo = ref<any | null>(null);
const transitions = ref<any | null>(null);
const externalMuse = ref<any>(null);
const followsData = ref<any | null>(null);

/* ---------- MBQ Pulse state ---------- */
const pulseData = ref<any | null>(null);
const pulseLoading = ref(true);

/* ---------- raw events (only used for hourly chart + daily split) ---------- */
const rawPageViews = ref<any[]>([]);
const rawLinkClicks = ref<any[]>([]);
const rawMediaPlays = ref<any[]>([]);
const rawQrScans = ref<any[]>([]);

const isInitialLoading = ref(true);
const isRefreshing = ref(false);

/* ---------- follows computed ---------- */
const followsPlatforms = computed<{ platformId: string; count: number }[]>(() => {
  const p = followsData.value?.platforms;
  return Array.isArray(p) ? p.slice(0, 10) : [];
});

function formatUsd(n: any) {
  const v = Number(n || 0);
  return `$${v.toFixed(2)}`;
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

/* ---------- canvases / chart handles ---------- */
const viewsCanvas = ref<HTMLCanvasElement | null>(null);
let viewsChart: any = null;

/* ---------- helpers (format) ---------- */
function humanDayLabel(yyyy_mm_dd: string) {
  const d = parseISO(`${yyyy_mm_dd}T00:00:00`);
  return isValid(d) ? fmt(d, "EEE, MMM d") : "";
}

/* ---------- Insights Panel action handler ---------- */
function handleInsightAction({ action, insight }: { action: any; insight: any }) {
  console.log('[Analytics] Insight action:', action, insight);
}

/* ---------- YouTube re-sync helpers ---------- */
const youtubeResyncing = ref(false);
const youtubePurging = ref(false);
let youtubeResyncTimer: any = null;

function debounce(fn: Function, ms = 800) {
  return (...args: any[]) => {
    clearTimeout(youtubeResyncTimer);
    youtubeResyncTimer = setTimeout(() => fn(...args), ms);
  };
}

const track = (event: string, props: Record<string, any> = {}) => {
  try {
    navigator.sendBeacon?.(
      "/api/track",
      new Blob([JSON.stringify({ event, ts: Date.now(), ...props })], {
        type: "application/json",
      })
    );
  } catch {}
};

const resyncYoutubeNow = async () => {
  if (youtubeResyncing.value) return;
  if (!bandId.value) return;

  youtubeResyncing.value = true;
  track("youtube_resync_clicked", { bandId: bandId.value });

  try {
    // Authenticated client: the API requires edit access to the band.
    const res = await client("/youtube/sync", {
      method: "POST",
      body: { bandId: bandId.value },
    });

    console.log("[youtube] resync response", res);

    await fetchAndRender(true);
  } catch (e) {
    console.warn("[youtube] resync failed", e);
    alert("YouTube re-sync failed. Try again in a minute.");
  } finally {
    youtubeResyncing.value = false;
  }
};

const resyncYoutube = debounce(resyncYoutubeNow, 800);

const purgeYoutube = async () => {
  if (youtubePurging.value) return;
  if (!bandId.value) return;

  const ok = confirm(
    "Disconnect YouTube and clear stored YouTube data for this band? You can reconnect anytime."
  );
  if (!ok) return;

  youtubePurging.value = true;

  try {
    const res = await client("/youtube/purge", {
      method: "POST",
      body: { bandId: bandId.value },
    });

    console.log("[youtube] purge response", res);
    await fetchAndRender(true);
  } catch (e) {
    console.warn("[youtube] purge failed", e);
    alert("YouTube disconnect failed. Try again in a minute.");
  } finally {
    youtubePurging.value = false;
  }
};

/* ---------- YouTube connect ---------- */
async function connectYoutube() {
  if (!bandId.value) {
    alert("No band selected");
    return;
  }

  try {
    const res = await client("/youtube/oauth/init", {
      params: { bandId: bandId.value },
    });
    if (res?.authUrl) {
      window.location.href = res.authUrl;
    } else {
      console.warn("No authUrl returned", res);
      alert("YouTube connection failed. Try again.");
    }
  } catch (err) {
    console.error("[YouTube connect error]", err);
    const anyErr: any = err as any;
    const status = anyErr?.status || anyErr?.response?.status || null;
    const msg =
      anyErr?.data?.error ||
      anyErr?.response?._data?.error ||
      anyErr?.message ||
      "Error starting YouTube connection.";

    if (status === 404 && String(msg).toLowerCase().includes("band")) {
      alert(
        `${msg}\n\nTip (local dev): your Nuxt app is pointing at local Strapi, but that band id may only exist in production. Create/import the band in your local DB (same id) or point STRAPI_URL to prod.`
      );
      return;
    }

    alert(msg);
  }
}

/* ---------- YouTube rich model ---------- */
const richYoutube = computed(() => {
  const fallback = {
    connected: false,
    syncedAt: null,
    videos: [] as any[],
    totals: { channelViews: 0, totalVideos: 0, avgViews: 0, subs: 0 },
    spotlight: { top: null as any, newest: null as any },
    freshness: {
      daysSinceLastUpload: null as number | null,
      activity: "unknown",
      sameDayBatch: false,
    },
  };

  const yt = externalMuse.value?.external?.youtube;
  if (!yt || !yt.connected) return fallback;

  const vids = Array.isArray(yt.recentVideos) ? yt.recentVideos : [];
  const videos = vids
    .filter((v) => v && (v.videoId || v.title))
    .map((v) => ({
      id: v.videoId || null,
      title: v.title || "Untitled",
      views: Number(v.views ?? 0),
      publishedAt: v.publishedAt || null,
      thumbnail: v.thumbnail || null,
    }));

  const totalVideos = videos.length;
  const totalViewsFromVideos = videos.reduce(
    (s, v) => s + (v.views || 0),
    0
  );
  const channelViews =
    Number(yt.views ?? 0) > 0 ? Number(yt.views) : totalViewsFromVideos;
  const avgViews = totalVideos ? +(channelViews / totalVideos).toFixed(1) : 0;

  const newest =
    [...videos].sort(
      (a, b) =>
        new Date(b.publishedAt || 0).getTime() -
        new Date(a.publishedAt || 0).getTime()
    )[0] || null;

  const daysSinceLastUpload = newest?.publishedAt
    ? Math.max(
        0,
        Math.round(
          (Date.now() - new Date(newest.publishedAt).getTime()) / 86400000
        )
      )
    : null;

  let activity = "unknown";
  if (daysSinceLastUpload == null) activity = "unknown";
  else if (daysSinceLastUpload <= 14) activity = "active";
  else if (daysSinceLastUpload <= 45) activity = "post-soon";
  else activity = "cooling";

  let sameDayBatch = false;
  if (videos.length >= 2) {
    const dayKey = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
    const dayCounts = videos.reduce((m: any, v: any) => {
      const k = dayKey(v.publishedAt);
      m[k] = (m[k] || 0) + 1;
      return m;
    }, {});
    sameDayBatch = Object.values(dayCounts).some((n: any) => n >= 2);
  }

  return {
    connected: true,
    syncedAt: yt.date || yt.lastSynced || yt.lastFetchedAt || null,
    videos,
    totals: {
      channelViews,
      totalVideos,
      avgViews,
      subs: Number(yt.subs ?? 0),
    },
    spotlight: {
      top: videos.sort((a, b) => b.views - a.views)[0] || null,
      newest,
    },
    freshness: { daysSinceLastUpload, activity, sameDayBatch },
  };
});

const youtubeInsights = computed(() => {
  const r = richYoutube.value;
  if (!r?.connected) return [];

  const out: string[] = [];
  const { channelViews, totalVideos, avgViews } = r.totals || {};
  const { daysSinceLastUpload, activity, sameDayBatch } = r.freshness || {};
  const top = r.spotlight?.top;

  if (typeof daysSinceLastUpload === "number" && daysSinceLastUpload > 30) {
    out.push(
      "You haven’t uploaded in over 30 days. A fresh video will help convert QR page visitors into YouTube views."
    );
  }

  if ((totalVideos ?? 0) < 3) {
    out.push(
      "Your channel is connected but still early. Keep publishing — we’ll surface top videos here as you post."
    );
  }

  if (top && avgViews && top.views >= avgViews * 3) {
    out.push(
      "One video is outperforming your average. Feature it on your MusicBizQR smart page to capture more plays."
    );
  }

  if (sameDayBatch) {
    out.push(
      "You batch-published videos on the same day. Consider spacing uploads to extend reach."
    );
  }

  if (out.length === 0) {
    if (activity === "active") {
      out.push(
        "Nice — you’re uploading consistently. Link your latest video on your MusicBizQR page to capture momentum."
      );
    } else {
      out.push(
        "YouTube is connected and pulling data. We’ll add deeper insights as you publish more content."
      );
    }
  }

  return out.slice(0, 3);
});

const youtubeCtaLine = computed(() => {
  const r = richYoutube.value;
  if (!r?.connected) return null;
  const { channelViews } = r.totals || {};
  const top = r.spotlight?.top;

  if ((channelViews ?? 0) <= 50) {
    return "Add your top video to your MusicBizQR smart page so fans from shows can watch instantly.";
  }
  if (top) {
    return "Link your latest YouTube video on your MusicBizQR page to capture momentum.";
  }
  return null;
});

const youtubeStatusChip = computed(() => {
  const r = richYoutube.value;
  if (!r?.connected)
    return {
      tone: "red",
      text: "disconnected",
      health: "amber",
      tooltip: "YouTube is not connected yet.",
    };

  const syncedAt = r.syncedAt ? new Date(r.syncedAt) : null;
  const ageDays = syncedAt
    ? Math.round((Date.now() - syncedAt.getTime()) / 86400000)
    : 0;
  const stale = ageDays > 3;

  let health: "ok" | "amber" = "ok";
  if (r.freshness?.activity === "cooling") health = "amber";
  if ((r.totals?.totalVideos ?? 0) === 0) health = "amber";

  return {
    tone: stale ? "amber" : "green",
    text: stale
      ? `data is ${ageDays}d old — re-sync`
      : `synced ${syncedAt ? syncedAt.toLocaleString() : "just now"}`,
    health,
    tooltip: stale
      ? "YouTube data is a few days old. Tap re-sync to refresh."
      : "YouTube data is up to date.",
  };
});

/* ---------- computed from server rollups ---------- */
const totalViewsInRange = computed(
  () => rollups.value?.totals?.views ?? 0
);
const totalClicksInRange = computed(
  () => rollups.value?.totals?.clicks ?? 0
);
const totalQrInRange = computed(
  () => rollups.value?.totals?.qrScans ?? 0
);

/* ---------- KPI helpers (for the new Performance Overview strip) ---------- */
const kpiTotalLabel = computed(() => {
  if (selectedTab.value === "Page Views") return "Page Views";
  if (selectedTab.value === "Link Clicks") return "Link Clicks";
  if (selectedTab.value === "Songs") return "Song Plays";
  if (selectedTab.value === "Videos") return "Video Plays";
  if (selectedTab.value === "QR Scans") return "QR Scans";
  return "Total";
});

const kpiTotalValue = computed(() => {
  if (selectedTab.value === "Page Views") return totalViewsInRange.value;
  if (selectedTab.value === "Link Clicks") return totalClicksInRange.value;
  if (selectedTab.value === "QR Scans") return totalQrInRange.value;
  if (selectedTab.value === "Songs") return liveMuseSummary.value?.songPlays ?? 0;
  if (selectedTab.value === "Videos") return liveMuseSummary.value?.videoPlays ?? 0;
  return totalViewsInRange.value;
});

const topCityKpi = computed(() => {
  const first = topCities.value?.[0];
  return {
    city: first?.[0] || "—",
    count: first?.[1] || 0,
  };
});

const topPlatformKpi = computed(() => {
  const list = rollups.value?.platforms;
  const first = Array.isArray(list) && list.length ? list[0] : null;
  const platform = first?.[0] || "—";
  const count = Number(first?.[1] ?? 0) || 0;
  return { platform, count };
});

const youtubeData = computed(() => {
  const raw = externalMuse.value?.external?.youtube;
  if (!raw) return null;

  const m = raw.metrics || {};

  return {
    connected: raw.connected ?? true,
    date: raw.date || raw.lastFetchedAt || null,
    views: m.views ?? raw.views ?? m.viewCount ?? 0,
    subs: m.subs ?? m.subscriberCount ?? raw.subs ?? 0,
    videos: m.videos ?? m.videoCount ?? raw.videos ?? 0,
    topVideo: m.topVideo || raw.topVideo || null,
    recentVideos: m.recentVideos || [],
  };
});

const sourceCounts = computed<[string, number][]>(() => {
  return rollups.value?.sources ?? [];
});
const mediumCounts = computed<[string, number][]>(() => {
  return rollups.value?.mediums ?? [];
});
const topRefDomains = computed<[string, number][]>(() => {
  return rollups.value?.refDomains ?? [];
});
const topClickPlatforms = computed<[string, number][]>(() => {
  return rollups.value?.platforms ?? [];
});

/* ---------- Top cities (from /analytics/geo) ---------- */
const topCities = computed<[string, number][]>(() => {
  const list = geo.value?.list ?? [];
  return list.map((r: any) => [r.city || "Unknown", r.count]) as [
    string,
    number
  ][];
});

// Pagination for Top Cities
const cityPage = ref(1);
const citiesPerPage = 8;
const totalCityPages = computed(() => Math.ceil(topCities.value.length / citiesPerPage));
const paginatedCities = computed(() => {
  const start = (cityPage.value - 1) * citiesPerPage;
  return topCities.value.slice(start, start + citiesPerPage);
});

// Reset page when data changes
watch(topCities, () => {
  cityPage.value = 1;
});

/* ---------- devices (from rollups) ---------- */
const deviceLegend = [
  { key: "desktop", label: "Desktop", color: "#8B5CF6" },
  { key: "mobile", label: "Mobile", color: "#10B981" },
  { key: "tablet", label: "Tablet", color: "#F59E0B" },
  { key: "bot", label: "Bot", color: "#6B7280" },
  { key: "unknown", label: "Unknown", color: "#9CA3AF" },
] as const;

const deviceCounts = computed(
  () =>
    rollups.value?.devices ?? {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      bot: 0,
      unknown: 0,
    }
);
const totalDeviceViews = computed(() =>
  Object.values(deviceCounts.value).reduce(
    (a: any, b: any) => a + (Number.isFinite(b) ? b : 0),
    0
  )
);
const deviceBreakdown = computed(() => {
  const counts: any = deviceCounts.value;
  const total = totalDeviceViews.value || 1;
  return deviceLegend.map((x) => ({
    ...x,
    count: counts[x.key] || 0,
    pct: Math.round(((counts[x.key] || 0) / total) * 1000) / 10,
  }));
});

/* ---------- Muse range label ---------- */
const museRangeLabel = computed(() => {
  if (selectedRange.value === 7) return "Last 7 Days";
  if (selectedRange.value === 30) return "Last 30 Days";
  if (selectedRange.value === 365) return "Last 1 Year";
  if (selectedRange.value === 1) return "Today";
  return `Last ${selectedRange.value} Days`;
});

const chartTitle = computed(() => {
  if (selectedRange.value === 1) {
    if (selectedTab.value === "Page Views") return "Page Views (Hourly)";
    if (selectedTab.value === "Link Clicks") return "Link Clicks (Hourly)";
    if (selectedTab.value === "Songs") return "Song Plays (Hourly)";
    if (selectedTab.value === "Videos") return "Video Plays (Hourly)";
    if (selectedTab.value === "QR Scans") return "QR Scans (Hourly)";
  } else {
    if (selectedTab.value === "Page Views")
      return `Page Views (Last ${selectedRange.value} Days)`;
    if (selectedTab.value === "Link Clicks")
      return `Link Clicks (Last ${selectedRange.value} Days)`;
    if (selectedTab.value === "Songs")
      return `Song Plays (Last ${selectedRange.value} Days)`;
    if (selectedTab.value === "Videos")
      return `Video Plays (Last ${selectedRange.value} Days)`;
    if (selectedTab.value === "QR Scans")
      return `QR Scans (Last ${selectedRange.value} Days)`;
  }
  return "Analytics";
});

/* ---------- helper: count songs/videos from raw ---------- */
function countMediaFromRaw(rows: any[], yyyymmdd: string) {
  let songs = 0;
  let videos = 0;

  for (const r of rows) {
    const a = r?.attributes || r || {};
    const ts = a.timestamp || a.createdAt || a.updatedAt;
    if (!ts) continue;

    const d = parseISO(ts);
    if (!isValid(d)) continue;
    const day = fmt(d, "yyyy-MM-dd");
    if (day !== yyyymmdd) continue;

    const kind = String(a.kind || a.mediaType || a.type || "")
      .toLowerCase()
      .trim();

    const isSong =
      kind.includes("song") ||
      kind.includes("audio") ||
      kind.includes("spotify") ||
      kind.includes("apple") ||
      kind.includes("music") ||
      kind.includes("soundcloud");

    const isVideo =
      kind.includes("video") ||
      kind.includes("youtube") ||
      kind.includes("vimeo") ||
      kind.includes("tiktok");

    if (isSong) songs++;
    else if (isVideo) videos++;
  }

  return { songs, videos };
}

/* ---------- core media splitter ---------- */
function deriveSongVideoSplit(opts: {
  selectedRange: number;
  rollups: any;
  transitions: any;
  rawMediaPlays: any[];
  selectedDate: string;
}) {
  const { selectedRange, rollups, transitions, rawMediaPlays, selectedDate } =
    opts;

  const totals = rollups?.totals || {};
  const totalPlays = totals.plays ?? 0;
  const totalSongPlays = totals.songPlays ?? 0;
  const totalVideoPlays = totals.videoPlays ?? 0;

  if (selectedRange === 1) {
    const fromRaw = countMediaFromRaw(rawMediaPlays, selectedDate);
    if (fromRaw.songs > 0 || fromRaw.videos > 0) {
      return {
        songPlays: fromRaw.songs,
        videoPlays: fromRaw.videos,
        source: "raw-daily",
      };
    }

    return {
      songPlays: totalSongPlays,
      videoPlays: totalVideoPlays,
      source: "rollups-daily-fallback",
    };
  }

  if (
    typeof totalSongPlays === "number" ||
    typeof totalVideoPlays === "number"
  ) {
    return {
      songPlays: totalSongPlays,
      videoPlays: totalVideoPlays,
      source: "rollups-range",
    };
  }

  const tMedia = transitions?.media;
  if (
    tMedia &&
    (typeof tMedia.songs === "number" || typeof tMedia.videos === "number")
  ) {
    return {
      songPlays: tMedia.songs ?? 0,
      videoPlays: tMedia.videos ?? 0,
      source: "transitions-range",
    };
  }

  return {
    songPlays: totalPlays,
    videoPlays: 0,
    source: "range-last-fallback",
  };
}

/* ============================================================================ */
/*   Live Muse summary from rollups + transitions + raw                         */
/* ============================================================================ */
const liveMuseSummary = computed(() => {
  const r = rollups.value;
  if (!r) return null;

  const views = r.totals?.views ?? 0;
  const clicks = r.totals?.clicks ?? 0;
  const plays = r.totals?.plays ?? 0;
  const qrScans = r.totals?.qrScans ?? 0;

  const split = deriveSongVideoSplit({
    selectedRange: selectedRange.value,
    rollups: r,
    transitions: transitions.value,
    rawMediaPlays: rawMediaPlays.value,
    selectedDate: selectedDate.value,
  });

  const engagementRate =
    views > 0
      ? Math.round(((clicks + plays + qrScans) / views) * 1000) / 10
      : 0;

  const series = Array.isArray(r.series) ? r.series : [];
  let growthPct = 0;
  if (series.length >= 2) {
    const last = series[series.length - 1]?.views || 0;
    const prev = series[series.length - 2]?.views || 0;
    if (prev > 0) {
      growthPct = Math.round(((last - prev) / prev) * 1000) / 10;
    } else if (last > 0) {
      growthPct = 100;
    }
  }

  const topCities = Array.isArray(geo.value?.list)
    ? geo.value!.list
        .map((r: any) => [r.city || "unknown", r.count])
        .slice(0, 3)
    : [];

  const topSources = Array.isArray(r.sources) ? r.sources.slice(0, 3) : [];
  const topPlatforms = Array.isArray(r.platforms)
    ? r.platforms.slice(0, 3)
    : [];

  const summary = {
    pageViews: views,
    linkClicks: clicks,
    songPlays: split.songPlays,
    videoPlays: split.videoPlays,
    qrScans,
    engagementRate,
    growthPct,
    prevComparison: 0,
    topCities,
    topSources,
    topPlatforms,
    days: selectedRange.value,
    mediaSource: split.source,
  };

  console.log("[muse] liveMuseSummary →", summary);
  return summary;
});

/* ---------- Muse display date & bullets (LIVE ONLY) ---------- */
const museDisplayDate = computed(() => {
  const s = rollups.value?.series;
  if (Array.isArray(s) && s.length) {
    const last = s[s.length - 1];
    if (last?.date) return last.date;
  }
  return fmt(new Date(), "yyyy-MM-dd");
});

const insightBullets = computed(() => {
  const summary = liveMuseSummary.value;
  if (!summary) return [];

  const bullets: string[] = [];

  const g = summary.growthPct || 0;
  const engagement = summary.engagementRate || 0;
  const views = summary.pageViews || 0;
  const clicks = summary.linkClicks || 0;
  const songPlays = summary.songPlays || 0;
  const videoPlays = summary.videoPlays || 0;
  const qrScans = summary.qrScans || 0;

  // 1) Traffic trend
  if (g > 0) {
    bullets.push(`Traffic grew ${g}% vs. yesterday.`);
  } else if (g < 0) {
    bullets.push(`Traffic fell ${Math.abs(g)}% vs. yesterday.`);
  } else {
    bullets.push("Traffic is flat vs. yesterday.");
  }

  // 2) Engagement quality
  if (engagement >= 40) {
    bullets.push(
      `Strong engagement: ${engagement}% of visitors clicked, played, or scanned something on your page.`
    );
  } else if (views >= 20 && engagement < 20) {
    bullets.push(
      `Engagement is on the low side (${engagement}%). Try featuring your strongest link or media at the top of the page.`
    );
  }

  // 3) Behavior highlight
  const totalMediaPlays = songPlays + videoPlays;
  if (totalMediaPlays > clicks && totalMediaPlays > 0) {
    bullets.push(
      `Fans are leaning into your media: ${totalMediaPlays} plays versus ${clicks} link clicks.`
    );
  } else if (clicks > 0) {
    bullets.push(
      `Fans are exploring your links (${clicks} clicks) — make sure merch, tickets, and socials are all up to date.`
    );
  }

  // 4) QR behavior
  if (qrScans > 0) {
    bullets.push(
      `${qrScans} QR scans in this period — your posters, flyers, or in-venue codes are doing work.`
    );
  }

  // 5) Geo / platform flavor
  if (summary.topCities?.length) {
    const cityNames = summary.topCities.map((c: any) => c[0]).join(", ");
    bullets.push(`Top cities right now: ${cityNames}.`);
  } else if (summary.topPlatforms?.length) {
    const platforms = summary.topPlatforms.map((p: any) => p[0]).join(", ");
    bullets.push(`Most activity is coming from ${platforms}.`);
  }

  // 6) Blend in one YouTube insight
  const yt = youtubeInsights.value;
  if (yt.length) {
    bullets.push(yt[0]);
  }

  return bullets.filter(Boolean).slice(0, 3);
});

/* ---------- Chart.js lazy load ---------- */
let ChartJs: any = null;
async function ensureChart() {
  if (process.server) return null;
  if (!ChartJs) {
    ChartJs = (await import("chart.js/auto")).default;
  }
  return ChartJs;
}

/* ---------- normalize timestamp on raw rows ---------- */
function tsOf(row: any): string | null {
  const a = row?.attributes || row || {};
  return a.timestamp || a.createdAt || a.updatedAt || null;
}

/* ---------- fetch pulse ---------- */
async function fetchPulse() {
  if (!bandId.value) return;
  pulseLoading.value = true;
  try {
    const data = await client('/analytics/pulse', {
      params: { entityType: 'band', entityId: bandId.value, range: `${selectedRange.value}d` }
    });
    pulseData.value = data?.pulse || null;
  } catch (err) {
    console.error('Failed to fetch pulse:', err);
    pulseData.value = null;
  } finally {
    pulseLoading.value = false;
  }
}

/* ---------- fetch + render ---------- */
async function fetchAndRender(silent: boolean) {
  if (!bandId.value) return;

  if (silent) {
    isRefreshing.value = true;
  } else {
    isInitialLoading.value = true;
  }
  museLoading.value = true;
  museError.value = null;
 

  const bandIdNum = Number(route.params.id);
  const rangeKey = `${selectedRange.value}d`;

  console.log("[analytics] fetching rollups for", { bandId: bandIdNum, rangeKey });

  try {
    const [r, g, t, m, f] = await Promise.all([
      getRollups(bandIdNum, rangeKey),
      getGeo(bandIdNum, rangeKey),
      getTransitions(bandIdNum, rangeKey),
      client("/muse/aggregate", {
        params: {
          bandId: bandIdNum,
          range: rangeKey,
        },
      }).catch((e) => {
        console.warn("[analytics] external muse failed", e);
        return null;
      }),
      getFollows(bandIdNum, rangeKey).catch((e) => {
        console.warn("[analytics] follows failed", e);
        return null;
      }),
    ]);

    rollups.value = r;
    geo.value = g;
    transitions.value = t;
    externalMuse.value = m;
    followsData.value = f;
    console.log("[muse external]", m);
    console.log("[follows]", f);


    if (selectedRange.value === 1) {
      const scansDirectQuery = qs.stringify(
        {
          filters: {
            band: {
              id: { $eq: bandIdNum },
            },
          },
          sort: ["date:desc"],
          pagination: { limit: 500 },
          populate: { qr: { populate: ["band"] } },
        },
        { encodeValuesOnly: true }
      );

      const scansViaQrQuery = qs.stringify(
        {
          filters: {
            qr: {
              band: {
                id: { $eq: bandIdNum },
              },
            },
          },
          sort: ["date:desc"],
          pagination: { limit: 500 },
          populate: { qr: { populate: ["band"] } },
        },
        { encodeValuesOnly: true }
      );

      const [viewsRes, clicksRes, mediaRes, scansDirectRes, scansViaQrRes] =
        await Promise.all([
          client("/band-page-views", {
            params: {
              filters: { band: { id: bandIdNum } },
              sort: ["timestamp:desc"],
              pagination: { limit: 500 },
            },
          }),
          client(`/link-clicks/band/${bandIdNum}`),
          client(`/media-plays/band/${bandIdNum}`).catch(() =>
            client("/media-plays", {
              params: {
                filters: { band: { id: bandIdNum } },
                sort: ["timestamp:desc"],
                pagination: { limit: 500 },
              },
            })
          ),
          client(`/scans?${scansDirectQuery}`),
          client(`/scans?${scansViaQrQuery}`),
        ]);

      const toArray = (res: any) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.results)) return res.results;
        if (res.data && !Array.isArray(res.data)) return [res.data];
        return [];
      };

      const unifyMedia = (rows: any[]) =>
        rows.map((r) => {
          const a = r?.attributes || r || {};
          return {
            id: r?.id ?? a?.id,
            attributes: {
              ...a,
              timestamp:
                a.timestamp ||
                a.createdAt ||
                a.updatedAt ||
                r?.timestamp ||
                r?.createdAt ||
                r?.updatedAt ||
                null,
              kind: String(a.kind ?? a.type ?? a.mediaType ?? "").toLowerCase(),
              title: a.title ?? r?.title ?? "",
            },
          };
        });

      const unifyClicks = (rows: any[]) =>
        rows.map((r) => {
          const a = r?.attributes || r || {};
          return {
            id: r?.id ?? a?.id,
            attributes: {
              ...a,
              timestamp:
                a.timestamp ||
                a.createdAt ||
                r?.timestamp ||
                r?.createdAt ||
                null,
              platform:
                a.platform ??
                a.provider ??
                a.source ??
                r?.platform ??
                r?.provider ??
                r?.source ??
                "",
              url: a.url ?? r?.url ?? "",
            },
          };
        });

      const unifyScans = (rows: any[]) =>
        rows.map((r) => {
          const a = r?.attributes || r || {};
          return {
            id: r?.id ?? a?.id,
            attributes: {
              ...a,
              timestamp:
                a.date || a.timestamp || a.createdAt || a.updatedAt || null,
              qr: a.qr || null,
            },
          };
        });

      rawPageViews.value = toArray(viewsRes);
      rawLinkClicks.value = unifyClicks(toArray(clicksRes));
      rawMediaPlays.value = unifyMedia(toArray(mediaRes));

      const scansDirect = unifyScans(toArray(scansDirectRes));
      const scansViaQr = unifyScans(toArray(scansViaQrRes));

      const seen = new Set<string | number>();
      const merged: any[] = [];

      for (const s of [...scansDirect, ...scansViaQr]) {
        const key = s.id || s.attributes?.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(s);
        }
      }

      rawQrScans.value = merged;
    } else {
      rawPageViews.value = [];
      rawLinkClicks.value = [];
      rawMediaPlays.value = [];
      rawQrScans.value = [];
    }

    await ensureChart();
    await nextTick();
    renderViewsChart();
  } catch (e: any) {
    console.error("[analytics] fetchAndRender failed", e);
    museError.value = e?.response?._data || e;
  } finally {
    isInitialLoading.value = false;
    isRefreshing.value = false;
    museLoading.value = false;
  }
}

/* ---------- HiDPI canvas ---------- */
function prepHiDPICanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* ---------- charts ---------- */
function renderViewsChart() {
  if (!ChartJs) return;
  const canvas = viewsCanvas.value;
  if (!canvas) return;
  const ctx = prepHiDPICanvas(canvas);

  let labels: string[] = [];
  let data: number[] = [];
  const chartType: "bar" | "line" = chartDisplayType.value;
  let title = "";

  if (selectedRange.value === 1) {
    let rows: any[] = [];
    if (selectedTab.value === "Page Views") {
      rows = rawPageViews.value;
    } else if (selectedTab.value === "Link Clicks") {
      rows = rawLinkClicks.value;
    } else if (selectedTab.value === "QR Scans") {
      rows = rawQrScans.value;
    } else {
      rows = rawMediaPlays.value;
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const counts: Record<number, number> = Object.fromEntries(
      hours.map((h) => [h, 0])
    );
    const dayISO = selectedDate.value;

    for (const v of rows) {
      const ts = tsOf(v);
      if (!ts) continue;
      const d = parseISO(ts);
      if (!isValid(d)) continue;
      if (fmt(d, "yyyy-MM-dd") !== dayISO) continue;

      if (selectedTab.value === "Songs" || selectedTab.value === "Videos") {
        const a = v?.attributes || v || {};
        const kind = String(a.kind || a.mediaType || a.type || "")
          .toLowerCase()
          .trim();

        const isSong =
          kind.includes("song") ||
          kind.includes("audio") ||
          kind.includes("spotify") ||
          kind.includes("apple") ||
          kind.includes("music") ||
          kind.includes("soundcloud");

        const isVideo =
          kind.includes("video") ||
          kind.includes("youtube") ||
          kind.includes("vimeo") ||
          kind.includes("tiktok");

        if (selectedTab.value === "Songs" && !isSong) continue;
        if (selectedTab.value === "Videos" && !isVideo) continue;
      }

      counts[getHours(d)]++;
    }

    labels = hours.map((h) => fmt(new Date(2000, 0, 1, h), "h a"));
    data = hours.map((h) => counts[h] || 0);
    title =
      selectedTab.value === "Page Views"
        ? "Page Views (Hourly)"
        : selectedTab.value === "Link Clicks"
          ? "Link Clicks (Hourly)"
          : selectedTab.value === "QR Scans"
            ? "QR Scans (Hourly)"
            : `${selectedTab.value} (Hourly)`;
  } else {
    const s = rollups.value?.series ?? [];
    labels = s.map((d: any) => fmt(parseISO(`${d.date}T00:00:00`), "MMM d"));

    data = s.map((d: any) => {
      if (selectedTab.value === "Page Views") return d.views;
      if (selectedTab.value === "Link Clicks") return d.clicks;
      if (selectedTab.value === "Songs") return d.songPlays ?? 0;
      if (selectedTab.value === "Videos") return d.videoPlays ?? 0;
      if (selectedTab.value === "QR Scans") return d.qrScans ?? 0;
      return d.plays ?? 0;
    });
    title =
      selectedTab.value === "Page Views"
        ? `Page Views (Last ${selectedRange.value} Days)`
        : selectedTab.value === "Link Clicks"
          ? `Link Clicks (Last ${selectedRange.value} Days)`
          : selectedTab.value === "QR Scans"
            ? `QR Scans (Last ${selectedRange.value} Days)`
            : `${selectedTab.value} (Last ${selectedRange.value} Days)`;
  }

  const datasetLabel =
    selectedTab.value === "Page Views"
      ? selectedRange.value === 1
        ? "Views"
        : "Page Views"
      : selectedTab.value === "Link Clicks"
        ? "Link Clicks"
        : selectedTab.value === "Songs"
          ? "Song Plays"
          : selectedTab.value === "Videos"
            ? "Video Plays"
            : "QR Scans";

  viewsChart?.destroy();
  viewsChart = new ChartJs(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data,
          borderWidth: 2,
          borderColor: "#10B981",
          backgroundColor:
            chartType === "bar" ? "#10B981" : "rgba(16,185,129,.25)",
          tension: chartType === "line" ? 0.3 : 0,
          pointRadius: chartType === "line" ? 3 : 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 6 },
      scales: {
        x: {
          ticks: {
            color: "#E5E7EB",
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 8,
          },
          grid: { color: "#30343b", drawTicks: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#E5E7EB", precision: 0 },
          grid: { color: "#30343b" },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#E5E7EB",
            usePointStyle: true,
            pointStyle: "circle",
          },
          position: "bottom",
        },
        title: {
          display: true,
          text: title,
          color: "white",
          font: { size: 16, weight: "600" },
        },
        tooltip: {
          callbacks: {
            title(items) {
              return items[0]?.label || "";
            },
            label(ctx) {
              const v = ctx.raw as number;
              const noun =
                selectedTab.value === "Page Views"
                  ? "view"
                  : selectedTab.value === "Link Clicks"
                    ? "click"
                    : selectedTab.value === "QR Scans"
                      ? "scan"
                      : "play";
              return `${v} ${v === 1 ? noun : noun + "s"}`;
            },
          },
        },
      },
    },
  });
}

/* ---------- DEBUG WATCHES ---------- */
watch(
  () => [selectedRange.value, selectedDate.value],
  ([r, d]) => {
    console.log("[watch] selectedRange/date →", { r, d });
  }
);

watch(
  () => rawMediaPlays.value,
  (val) => {
    console.log(
      "[watch] rawMediaPlays changed →",
      val.map((v: any) => v?.attributes ?? v)
    );
  }
);

watch(
  () => transitions.value,
  (val) => {
    console.log("[watch] transitions changed →", val);
  }
);

watch(
  () => rollups.value,
  (val) => {
    console.log("[watch] rollups changed →", val);
  }
);

/* ---------- lifecycle ---------- */
watch(
  () => viewsCanvas.value,
  async (canvas) => {
    if (!canvas) return;
    await ensureChart();
    renderViewsChart();
  }
);

onMounted(async () => {
  console.log("🔍 Route params:", route.params);
  console.log("🔍 Route query:", route.query);
  console.log(
    "🔍 Resolved bandId:",
    route.params.id || route.params.bandId || route.query.bandId
  );
  try {
    const saved = localStorage.getItem("analytics_chart_type");
    if (saved === "bar" || saved === "line") {
      chartDisplayType.value = saved;
    }
  } catch {}
  await ensureChart();
  await fetchAndRender(false);
  fetchPulse(); // non-blocking pulse fetch after initial load
  fetchBandInfo(); // fetch band info for PulseMomentsPanel
});

// when range changes → silent refresh
watch(selectedRange, async () => {
  await fetchAndRender(true);
  fetchPulse(); // refresh pulse when range changes
});

// when tab/date/rollups change → just re-render
watch([selectedTab, selectedDate, rollups, chartDisplayType], async () => {
  if (!isInitialLoading.value) {
    await ensureChart();
    renderViewsChart();
  }
});

onBeforeUnmount(() => {
  viewsChart?.destroy();
});
</script>

<style scoped>
.chart-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.chart-wrap {
  position: relative;
  width: 100%;
  border-radius: 0.875rem;
  overflow: hidden;
}
.chart-wrap.ratio-16x9 {
  aspect-ratio: 16 / 9;
}
.chart-wrap.square {
  aspect-ratio: 1 / 1;
}

.chart-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}
</style>
