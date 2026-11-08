<template>
  <div class="min-h-screen pt-[var(--header-height)]">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink
          to="/dashboard"
          class="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mb-4 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </NuxtLink>
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-white">Fans</h1>
            <p class="text-white/60 mt-2">Manage your fan list and track audience growth</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="showImportModal = true"
              class="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import CSV
            </button>
            <button
              @click="handleExport"
              :disabled="exporting"
              class="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-16 flex justify-center">
        <div class="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <!-- Show Recap Section -->
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <div class="md:col-span-2">
            <!-- Stats -->
            <FansStats :analytics="analytics" />
          </div>
          <div class="md:col-span-1">
            <!-- Recent Show Recap -->
            <ShowRecapCard :recap="recentRecap" />
          </div>
        </div>

        <!-- Charts -->
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <FansGrowthChart :growth-series="analytics?.growthSeries" />
          <FansSourceBreakdown :source-breakdown="analytics?.sourceBreakdown" />
        </div>

        <!-- Fans Table Section -->
        <div class="fans-table-section">
          <div class="table-header">
            <h2 class="text-lg font-semibold text-white">All Fans</h2>
            <p class="text-white/50 text-sm">{{ pagination.total }} total</p>
          </div>

          <!-- Filters -->
          <div class="table-filters">
            <div class="search-wrapper">
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchQuery"
                @input="debouncedSearch"
                type="text"
                placeholder="Search by email..."
                class="search-input"
              />
            </div>
            <div class="filter-group">
              <select v-model="sourceFilter" @change="loadFans" class="filter-select">
                <option value="">All Sources</option>
                <option value="band_page">Band Page</option>
                <option value="follow_modal">Follow Modal</option>
                <option value="import">Import</option>
                <option value="manual">Manual</option>
                <option value="other">Other</option>
              </select>
              <select v-model="statusFilter" @change="loadFans" class="filter-select">
                <option value="">All Status</option>
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>
          </div>

          <!-- Table -->
          <div class="table-container">
            <table class="fans-table">
              <thead>
                <tr>
                  <th @click="toggleSort('email')" class="sortable">
                    Email
                    <span v-if="sortField === 'email'" class="sort-indicator">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                  <th @click="toggleSort('source')" class="sortable">
                    Source
                    <span v-if="sortField === 'source'" class="sort-indicator">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                  <th>Status</th>
                  <th @click="toggleSort('subscribedAt')" class="sortable">
                    Joined
                    <span v-if="sortField === 'subscribedAt'" class="sort-indicator">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="fans.length === 0">
                  <td colspan="4" class="empty-row">
                    <div class="text-center py-8">
                      <p class="text-white/50">No fans found</p>
                    </div>
                  </td>
                </tr>
                <tr v-for="fan in fans" :key="fan.id">
                  <td class="email-cell">{{ fan.email }}</td>
                  <td>
                    <span class="source-badge" :class="'source-' + fan.source">
                      {{ formatSource(fan.source) }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" :class="'status-' + fan.status">
                      {{ fan.status }}
                    </span>
                  </td>
                  <td class="date-cell">{{ formatDate(fan.subscribedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.pageCount > 1" class="table-pagination">
            <button
              @click="goToPage(pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="pagination-btn"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <span class="pagination-info">
              Page {{ pagination.page }} of {{ pagination.pageCount }}
            </span>
            <button
              @click="goToPage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.pageCount"
              class="pagination-btn"
            >
              Next
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Import Modal -->
    <FansImportModal
      v-model="showImportModal"
      :band-id="bandId"
      @imported="handleImported"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFans } from '~/composables/useFans';
import { useShowRecaps } from '~/composables/useShowRecaps';
import { usePrimaryBandId } from '~/composables/usePrimaryBandId';
import FansStats from '~/components/dashboard/fans/FansStats.vue';
import FansGrowthChart from '~/components/dashboard/fans/FansGrowthChart.vue';
import FansSourceBreakdown from '~/components/dashboard/fans/FansSourceBreakdown.vue';
import FansImportModal from '~/components/dashboard/fans/FansImportModal.vue';
import ShowRecapCard from '~/components/dashboard/fans/ShowRecapCard.vue';

definePageMeta({
  middleware: 'auth',
});

const { getFans, getFanAnalytics, exportFans, generateCSV, downloadCSV, formatSource, formatDate } = useFans();
const { getLatestRecap } = useShowRecaps();
const { bandId, resolve: resolveBandId } = usePrimaryBandId();

const loading = ref(true);
const exporting = ref(false);
const fans = ref([]);
const analytics = ref(null);
const pagination = ref({ page: 1, pageSize: 25, pageCount: 1, total: 0 });
const sortField = ref('subscribedAt');
const sortOrder = ref('desc');
const searchQuery = ref('');
const sourceFilter = ref('');
const statusFilter = ref('');
const showImportModal = ref(false);
const recentRecap = ref(null);

const route = useRoute();
const router = useRouter();

let searchTimeout = null;

async function scopedBandId() {
  return bandId.value || (await resolveBandId());
}

async function loadData() {
  loading.value = true;
  try {
    const id = await scopedBandId();
    if (!id) {
      fans.value = [];
      analytics.value = null;
      return;
    }
    const [fansResult, analyticsResult, latestRecap] = await Promise.all([
      getFans({
        bandId: id,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        sortField: sortField.value,
        sortOrder: sortOrder.value,
        search: searchQuery.value,
        source: sourceFilter.value,
        status: statusFilter.value,
      }),
      getFanAnalytics(id),
      getLatestRecap(id),
    ]);
    fans.value = fansResult.data;
    pagination.value = fansResult.meta.pagination;
    analytics.value = analyticsResult.data;
    recentRecap.value = latestRecap;
  } catch (error) {
    console.error('Failed to load fans data:', error);
  } finally {
    loading.value = false;
  }
}

async function loadFans() {
  try {
    const id = await scopedBandId();
    if (!id) {
      fans.value = [];
      return;
    }
    const result = await getFans({
      bandId: id,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      search: searchQuery.value,
      source: sourceFilter.value,
      status: statusFilter.value,
    });
    fans.value = result.data;
    pagination.value = result.meta.pagination;
  } catch (error) {
    console.error('Failed to load fans:', error);
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadFans();
  }, 300);
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
  } else {
    sortField.value = field;
    sortOrder.value = 'desc';
  }
  loadFans();
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.pageCount) return;
  pagination.value.page = page;
  loadFans();
}

async function handleExport() {
  exporting.value = true;
  try {
    const id = await scopedBandId();
    if (!id) return;
    const result = await exportFans(id);
    const csv = generateCSV(result.data);
    downloadCSV(csv, `fans-${new Date().toISOString().split('T')[0]}.csv`);
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    exporting.value = false;
  }
}

async function handleImported() {
  pagination.value.page = 1;
  await loadData();
}

/**
 * Recaps used to open as a modal here via `?recap=123` (optionally `&message=1`).
 * They now live at their own route, so old links are forwarded instead of broken.
 */
function redirectLegacyRecapLink() {
  const recapId = route.query.recap;
  if (!recapId) return false;

  router.replace({
    path: `/fans/recaps/${recapId}`,
    query: route.query.message === '1' ? { message: '1' } : {},
  });
  return true;
}

onMounted(async () => {
  if (redirectLegacyRecapLink()) return;
  await loadData();
});
</script>

<style scoped>
.fans-table-section {
  background: var(--fq-surface, #0B0C10);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  border-radius: 1rem;
  overflow: hidden;
}

.table-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: rgba(255, 255, 255, 0.4);
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  background: var(--fq-surface-raised, #111217);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-input:focus {
  outline: none;
  border-color: rgba(57, 255, 20, 0.45);
  box-shadow: 0 0 0 1px rgba(57, 255, 20, 0.16);
}

.filter-group {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  background: var(--fq-surface-raised, #111217);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
}

.filter-select:focus {
  outline: none;
  border-color: rgba(57, 255, 20, 0.45);
  box-shadow: 0 0 0 1px rgba(57, 255, 20, 0.16);
}

.table-container {
  overflow-x: auto;
}

.fans-table {
  width: 100%;
  border-collapse: collapse;
}

.fans-table th {
  padding: 0.75rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.fans-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.fans-table th.sortable:hover {
  color: rgba(255, 255, 255, 0.8);
}

.sort-indicator {
  margin-left: 0.25rem;
}

.fans-table td {
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.fans-table tr:hover td {
  background: var(--fq-surface-hover, #14161B);
}

.email-cell {
  font-weight: 500;
  color: white;
}

.date-cell {
  color: rgba(255, 255, 255, 0.5);
}

.source-badge {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.source-band_page {
  background: rgba(236, 72, 153, 0.15);
  color: rgb(236, 72, 153);
}

.source-follow_modal {
  background: rgba(168, 85, 247, 0.15);
  color: rgb(168, 85, 247);
}

.source-import {
  background: rgba(59, 130, 246, 0.15);
  color: rgb(59, 130, 246);
}

.source-manual {
  background: rgba(16, 185, 129, 0.15);
  color: rgb(16, 185, 129);
}

.source-other {
  background: rgba(107, 114, 128, 0.15);
  color: rgb(156, 163, 175);
}

.status-badge {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-subscribed {
  background: rgba(16, 185, 129, 0.15);
  color: rgb(52, 211, 153);
}

.status-unsubscribed {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(248, 113, 113);
}

.table-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.empty-row td {
  border-bottom: none;
}
</style>
