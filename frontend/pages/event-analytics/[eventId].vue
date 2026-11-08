<template>
  <div class="px-4 sm:px-6 py-10 bg-gradient-to-b from-black via-slate-950 to-black min-h-screen pt-[var(--header-height)] max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-6">
      <div class="min-w-0">
        <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Event Analytics</h2>
        <div class="text-gray-400 text-sm mt-1" v-if="eventInfo.title">
          {{ eventInfo.title }}
        </div>
      </div>
      <NuxtLink
        to="/dashboard"
        class="shrink-0 px-3 py-1.5 text-sm rounded-full border border-white/10 bg-black/30 text-gray-300 hover:bg-white/5 transition-colors"
      >
        ← Back
      </NuxtLink>
    </div>

    <!-- MBQ Pulse Card -->
    <MbqPulseCard
      :pulse="pulseData"
      :loading="pulseLoading"
      :range-label="rangeLabel"
    />

    <!-- Summary Cards -->
    <div class="chart-card mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-white text-lg font-semibold">Performance Overview</h3>
        <span class="text-gray-400 text-xs">{{ rangeLabel }}</span>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
          <p class="text-gray-400 text-xs">Total Views</p>
          <p class="text-2xl font-semibold text-white tabular-nums">
            {{ rollups?.totals?.views ?? 0 }}
          </p>
        </div>

        <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
          <p class="text-gray-400 text-xs">Top Source</p>
          <p class="text-lg font-semibold text-white truncate capitalize">
            {{ topSource }}
          </p>
        </div>

        <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
          <p class="text-gray-400 text-xs">Top Country</p>
          <p class="text-lg font-semibold text-white truncate">
            {{ topCountry }}
          </p>
        </div>

        <div class="bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl p-3">
          <p class="text-gray-400 text-xs">QR vs Web</p>
          <p class="text-lg font-semibold text-white">
            {{ qrPercent }}% QR
          </p>
        </div>
      </div>
    </div>

    <!-- Range Selector -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="(label, days) in rangeOptions"
        :key="days"
        @click="selectedRange = Number(days)"
        :class="[
          'px-3 py-1.5 text-sm rounded-full border transition-colors shadow-sm',
          selectedRange === Number(days)
            ? 'bg-purple-500/20 text-purple-100 border-purple-400/40'
            : 'bg-black/30 text-gray-300 border-white/10 hover:bg-white/5',
        ]"
      >
        {{ label }}
      </button>
    </div>

    <!-- Loading State (initial only) -->
    <div v-if="isLoading" class="text-white py-8 text-center">🔄 Loading analytics…</div>

    <!-- Main Content -->
    <div v-else class="space-y-6 relative">
      <!-- Refresh overlay for range changes -->
      <div
        v-if="isRefreshing"
        class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"
      >
        <span class="text-gray-200 text-sm">Refreshing…</span>
      </div>
      <!-- Views Time Series Chart -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-white text-lg font-semibold">Page Views Over Time</h3>
          <span class="text-gray-400 text-xs">{{ rangeLabel }}</span>
        </div>
        <div class="chart-wrap">
          <ClientOnly>
            <canvas ref="viewsCanvas" class="chart-canvas" />
          </ClientOnly>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Traffic Sources -->
        <div class="chart-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-white text-lg font-semibold">Traffic Sources</h3>
          </div>
          <ul v-if="rollups?.sources?.length" class="text-gray-200 text-sm space-y-2">
            <li v-for="[name, count] in rollups.sources.slice(0, 8)" :key="name" class="flex items-center gap-2">
              <span class="inline-block w-24 truncate text-white capitalize">{{ name }}</span>
              <div class="h-2 bg-gray-800 rounded flex-1">
                <div
                  class="h-2 bg-purple-500 rounded"
                  :style="{ width: Math.round((count / (rollups.sources[0]?.[1] || 1)) * 100) + '%' }"
                />
              </div>
              <span class="text-gray-400 w-10 text-right tabular-nums">{{ count }}</span>
            </li>
          </ul>
          <div v-else class="text-gray-400 text-sm">No source data yet.</div>
        </div>

        <!-- Devices -->
        <div class="chart-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-white text-lg font-semibold">Devices</h3>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="(count, device) in rollups?.devices || {}" :key="device" class="bg-white/5 border border-white/10 rounded-lg p-3">
              <p class="text-gray-400 text-xs capitalize">{{ device }}</p>
              <p class="text-xl font-semibold text-white tabular-nums">{{ count }}</p>
            </div>
          </div>
        </div>

        <!-- Countries -->
        <div class="chart-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-white text-lg font-semibold">Top Countries</h3>
          </div>
          <ul v-if="rollups?.countries?.length" class="text-gray-200 text-sm space-y-2">
            <li v-for="[name, count] in rollups.countries.slice(0, 8)" :key="name" class="flex items-center gap-2">
              <span class="inline-block w-24 truncate text-white uppercase">{{ name || 'Unknown' }}</span>
              <div class="h-2 bg-gray-800 rounded flex-1">
                <div
                  class="h-2 bg-emerald-500 rounded"
                  :style="{ width: Math.round((count / (rollups.countries[0]?.[1] || 1)) * 100) + '%' }"
                />
              </div>
              <span class="text-gray-400 w-10 text-right tabular-nums">{{ count }}</span>
            </li>
          </ul>
          <div v-else class="text-gray-400 text-sm">No geo data yet.</div>
        </div>

        <!-- Browsers -->
        <div class="chart-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-white text-lg font-semibold">Browsers</h3>
          </div>
          <ul v-if="rollups?.browsers?.length" class="text-gray-200 text-sm space-y-2">
            <li v-for="[name, count] in rollups.browsers.slice(0, 6)" :key="name" class="flex items-center gap-2">
              <span class="inline-block w-24 truncate text-white capitalize">{{ name }}</span>
              <div class="h-2 bg-gray-800 rounded flex-1">
                <div
                  class="h-2 bg-blue-500 rounded"
                  :style="{ width: Math.round((count / (rollups.browsers[0]?.[1] || 1)) * 100) + '%' }"
                />
              </div>
              <span class="text-gray-400 w-10 text-right tabular-nums">{{ count }}</span>
            </li>
          </ul>
          <div v-else class="text-gray-400 text-sm">No browser data yet.</div>
        </div>

        <!-- Entry Types (QR vs Web) -->
        <div class="chart-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-white text-lg font-semibold">Entry Type</h3>
          </div>
          <ul v-if="rollups?.entryTypes?.length" class="text-gray-200 text-sm space-y-2">
            <li v-for="[name, count] in rollups.entryTypes" :key="name" class="flex items-center gap-2">
              <span class="inline-block w-24 truncate text-white uppercase">{{ name }}</span>
              <div class="h-2 bg-gray-800 rounded flex-1">
                <div
                  class="h-2 bg-amber-500 rounded"
                  :style="{ width: Math.round((count / (rollups.entryTypes[0]?.[1] || 1)) * 100) + '%' }"
                />
              </div>
              <span class="text-gray-400 w-10 text-right tabular-nums">{{ count }}</span>
            </li>
          </ul>
          <div v-else class="text-gray-400 text-sm">No entry type data yet.</div>
        </div>

        <!-- OS -->
        <div class="chart-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-white text-lg font-semibold">Operating Systems</h3>
          </div>
          <ul v-if="rollups?.osList?.length" class="text-gray-200 text-sm space-y-2">
            <li v-for="[name, count] in rollups.osList.slice(0, 6)" :key="name" class="flex items-center gap-2">
              <span class="inline-block w-24 truncate text-white capitalize">{{ name }}</span>
              <div class="h-2 bg-gray-800 rounded flex-1">
                <div
                  class="h-2 bg-pink-500 rounded"
                  :style="{ width: Math.round((count / (rollups.osList[0]?.[1] || 1)) * 100) + '%' }"
                />
              </div>
              <span class="text-gray-400 w-10 text-right tabular-nums">{{ count }}</span>
            </li>
          </ul>
          <div v-else class="text-gray-400 text-sm">No OS data yet.</div>
        </div>
      </div>

      <!-- USA Heat Map -->
      <UsHeatMapCard
        v-if="eventId"
        entity-type="event"
        :entity-id="eventId"
      />

      <!-- Geo Map Section -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-white text-lg font-semibold">Top Locations</h3>
          <span v-if="geoList.length" class="text-gray-400 text-xs">{{ geoList.length }} total</span>
        </div>
        <ul v-if="paginatedLocations.length" class="text-gray-200 text-sm space-y-2">
          <li v-for="loc in paginatedLocations" :key="`${loc.city}-${loc.country}`" class="flex items-center gap-2">
            <span class="inline-block w-40 truncate text-white">
              {{ loc.city }}{{ loc.region ? `, ${loc.region}` : '' }}{{ loc.country ? ` (${loc.country})` : '' }}
            </span>
            <div class="h-2 bg-gray-800 rounded flex-1">
              <div
                class="h-2 bg-cyan-500 rounded"
                :style="{ width: Math.round((loc.count / (geoList[0]?.count || 1)) * 100) + '%' }"
              />
            </div>
            <span class="text-gray-400 w-10 text-right tabular-nums">{{ loc.count }}</span>
          </li>
        </ul>
        <div v-else class="text-gray-400 text-sm">No location data yet.</div>
        
        <!-- Pagination -->
        <div v-if="totalLocationPages > 1" class="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <button
            @click="locationPage = Math.max(1, locationPage - 1)"
            :disabled="locationPage === 1"
            class="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="locationPage === 1 ? 'border-white/10 text-gray-500' : 'border-white/20 text-gray-300 hover:bg-white/5'"
          >
            ← Prev
          </button>
          <span class="text-xs text-gray-400">
            Page {{ locationPage }} of {{ totalLocationPages }}
          </span>
          <button
            @click="locationPage = Math.min(totalLocationPages, locationPage + 1)"
            :disabled="locationPage === totalLocationPages"
            class="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="locationPage === totalLocationPages ? 'border-white/10 text-gray-500' : 'border-white/20 text-gray-300 hover:bg-white/5'"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { useRoute, useStrapiClient } from "#imports";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const route = useRoute();
const client = useStrapiClient();

const selectedRange = ref(30);
const rangeOptions = {
  7: "7 Days",
  30: "30 Days",
  90: "90 Days",
  365: "1 Year",
};

const rangeLabel = computed(() => `Last ${selectedRange.value} days`);

const isLoading = ref(true);
const isRefreshing = ref(false);
const rollups = ref(null);
const geoList = ref([]);
const eventInfo = ref({ title: '', id: null });

// Pagination for Top Locations
const locationPage = ref(1);
const locationsPerPage = 8;
const totalLocationPages = computed(() => Math.ceil(geoList.value.length / locationsPerPage));
const paginatedLocations = computed(() => {
  const start = (locationPage.value - 1) * locationsPerPage;
  return geoList.value.slice(start, start + locationsPerPage);
});

const eventId = computed(() => Number(route.params.eventId));

// Pulse data
const pulseData = ref(null);
const pulseLoading = ref(true);

const viewsCanvas = ref(null);
let viewsChart = null;

// Computed helpers
const topSource = computed(() => {
  const src = rollups.value?.sources?.[0];
  return src ? src[0] : 'N/A';
});

const topCountry = computed(() => {
  const c = rollups.value?.countries?.[0];
  return c ? c[0] : 'N/A';
});

const qrPercent = computed(() => {
  const entries = rollups.value?.entryTypes || [];
  const qr = entries.find(e => e[0] === 'qr')?.[1] || 0;
  const total = rollups.value?.totals?.views || 0;
  return total > 0 ? Math.round((qr / total) * 100) : 0;
});

async function fetchEventInfo() {
  try {
    const { data } = await client(`/events/${route.params.eventId}`, {
      params: { fields: ['title', 'slug'] }
    });
    if (data?.attributes) {
      eventInfo.value = { title: data.attributes.title, id: data.id };
    }
  } catch (err) {
    console.error('Failed to fetch event info:', err);
  }
}

async function fetchRollups() {
  try {
    const data = await client('/analytics/event-rollups', {
      params: { eventId: route.params.eventId, range: `${selectedRange.value}d` }
    });
    rollups.value = data;
  } catch (err) {
    console.error('Failed to fetch event rollups:', err);
    rollups.value = null;
  }
}

async function fetchGeo() {
  try {
    const data = await client('/analytics/event-geo', {
      params: { eventId: route.params.eventId, range: `${selectedRange.value}d` }
    });
    geoList.value = data?.list || [];
  } catch (err) {
    console.error('Failed to fetch event geo:', err);
    geoList.value = [];
  }
}

async function fetchPulse() {
  pulseLoading.value = true;
  try {
    const data = await client('/analytics/pulse', {
      params: { entityType: 'event', entityId: route.params.eventId, range: `${selectedRange.value}d` }
    });
    pulseData.value = data?.pulse || null;
  } catch (err) {
    console.error('Failed to fetch pulse:', err);
    pulseData.value = null;
  } finally {
    pulseLoading.value = false;
  }
}

async function loadData() {
  isLoading.value = true;
  await Promise.all([fetchEventInfo(), fetchRollups(), fetchGeo(), fetchPulse()]);
  isLoading.value = false;
  await nextTick();
  renderViewsChart();
}

function renderViewsChart() {
  const ctx = viewsCanvas.value?.getContext('2d');
  if (!ctx) return;

  const series = rollups.value?.series || [];
  const labels = series.map(s => s.date?.slice(5) || ''); // MM-DD format
  const data = series.map(s => s.views || 0);

  viewsChart?.destroy();
  viewsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Views',
        data,
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      scales: {
        x: {
          ticks: { color: '#9CA3AF', maxTicksLimit: 10 },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#9CA3AF' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#9CA3AF',
        }
      }
    }
  });
}

onMounted(loadData);

watch(selectedRange, async () => {
  isRefreshing.value = true;
  await Promise.all([fetchRollups(), fetchGeo(), fetchPulse()]);
  isRefreshing.value = false;
  await nextTick();
  renderViewsChart();
});

onBeforeUnmount(() => {
  viewsChart?.destroy();
});
</script>

<style scoped>
.chart-card {
  @apply bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg;
}

.chart-wrap {
  position: relative;
  width: 100%;
  height: 280px;
}

.chart-canvas {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}
</style>
