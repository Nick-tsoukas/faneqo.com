<template>
  <div class="min-h-screen bg-black pt-[var(--header-height)]">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <NuxtLink to="/dashboard" class="text-white/50 hover:text-white/70 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <h1 class="text-2xl md:text-3xl font-bold text-white">Partner Dashboard</h1>
        </div>
        <p class="text-white/50">Track your referrals and estimated commissions</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <span class="text-white/50">Loading your data...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <svg class="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-red-400">{{ error }}</p>
        <button @click="loadData" class="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition">
          Try Again
        </button>
      </div>

      <template v-else>
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="kpi-card">
            <div class="kpi-icon bg-purple-500/20">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="kpi-value">{{ stats.totalReferredUsers }}</div>
            <div class="kpi-label">Total Referrals</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-blue-500/20">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="kpi-value text-blue-400">{{ stats.trialUsers }}</div>
            <div class="kpi-label">On Trial</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-emerald-500/20">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="kpi-value text-emerald-400">{{ stats.activeUsers }}</div>
            <div class="kpi-label">Active Subscribers</div>
          </div>

          <div class="kpi-card highlight">
            <div class="kpi-icon bg-pink-500/20">
              <svg class="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="kpi-value text-pink-400">{{ formatCurrency(stats.estimatedMonthlyCommission) }}</div>
            <div class="kpi-label">Est. Monthly Commission</div>
          </div>
        </div>

        <!-- Click Stats -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div class="click-stat-card">
            <div class="click-stat-icon">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div class="click-stat-value text-cyan-400">{{ stats.totalClicks }}</div>
            <div class="click-stat-label">Total Link Clicks</div>
          </div>
          <div class="click-stat-card">
            <div class="click-stat-icon">
              <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="click-stat-value text-teal-400">{{ stats.clicksToday }}</div>
            <div class="click-stat-label">Clicks Today</div>
          </div>
          <div class="click-stat-card col-span-2 md:col-span-1">
            <div class="click-stat-icon">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="click-stat-value text-amber-400">{{ stats.clickToSignupRate }}%</div>
            <div class="click-stat-label">Click → Signup Rate</div>
          </div>
        </div>

        <!-- Secondary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="stat-pill">
            <span class="stat-pill-label">Signups This Month</span>
            <span class="stat-pill-value">{{ stats.signupsThisMonth }}</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill-label">Conversion Rate</span>
            <span class="stat-pill-value">{{ stats.conversionRate }}%</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill-label">Canceled</span>
            <span class="stat-pill-value text-red-400">{{ stats.canceledUsers }}</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill-label">Commission Rate</span>
            <span class="stat-pill-value text-purple-400">{{ stats.commissionPercent }}%</span>
          </div>
        </div>

        <!-- Referral Link -->
        <div class="referral-link-card mb-8">
          <div class="flex items-center gap-3 mb-3">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span class="font-semibold text-white">Your Referral Link</span>
          </div>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              :value="referralLink"
              class="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm"
            />
            <button
              @click="copyReferralLink"
              class="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <svg v-else class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Referred Users Table -->
        <div class="users-table-card">
          <div class="table-header">
            <h3 class="text-lg font-semibold text-white">Referred Users</h3>
            <span class="text-white/50 text-sm">{{ pagination.total }} total</span>
          </div>

          <div v-if="users.length === 0" class="empty-state">
            <svg class="w-12 h-12 text-white/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p class="text-white/40">No referrals yet</p>
            <p class="text-white/30 text-sm mt-1">Share your link to start earning commissions</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left text-white/50 text-sm border-b border-white/10">
                  <th class="pb-3 font-medium">Email</th>
                  <th class="pb-3 font-medium">Signed Up</th>
                  <th class="pb-3 font-medium">Status</th>
                  <th class="pb-3 font-medium">Trial Ends</th>
                  <th class="pb-3 font-medium text-right">Est. Value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" class="border-b border-white/5">
                  <td class="py-3 text-white">{{ user.email }}</td>
                  <td class="py-3 text-white/70">{{ formatDate(user.createdAt) }}</td>
                  <td class="py-3">
                    <span :class="['status-badge', getStatusColor(user.status)]">
                      {{ formatStatus(user.status) }}
                    </span>
                  </td>
                  <td class="py-3 text-white/70">{{ formatDate(user.trialEndsAt) }}</td>
                  <td class="py-3 text-right text-emerald-400 font-medium">
                    {{ user.estimatedMonthlyValue > 0 ? formatCurrency(user.estimatedMonthlyValue) : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.pageCount > 1" class="pagination">
            <button
              :disabled="pagination.page <= 1"
              @click="goToPage(pagination.page - 1)"
              class="pagination-btn"
            >
              Previous
            </button>
            <span class="text-white/50 text-sm">
              Page {{ pagination.page }} of {{ pagination.pageCount }}
            </span>
            <button
              :disabled="pagination.page >= pagination.pageCount"
              @click="goToPage(pagination.page + 1)"
              class="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMarketer } from '~/composables/useMarketer'

definePageMeta({
  middleware: ['marketer']
})

const { getMarketerStats, getMarketerUsers, formatCurrency, formatDate, getStatusColor, formatStatus } = useMarketer()

const loading = ref(true)
const error = ref('')
const copied = ref(false)
const referralLink = 'https://musicbizqr.com/?ref=shannon'

const stats = ref({
  totalReferredUsers: 0,
  trialUsers: 0,
  activeUsers: 0,
  canceledUsers: 0,
  estimatedMonthlyCommission: 0,
  signupsThisMonth: 0,
  conversionRate: 0,
  commissionPercent: 10,
  totalClicks: 0,
  clicksToday: 0,
  clickToSignupRate: 0,
})

const users = ref([])
const pagination = ref({
  page: 1,
  pageSize: 25,
  pageCount: 1,
  total: 0,
})

async function loadData() {
  console.log('[marketer page] loadData called')
  loading.value = true
  error.value = ''

  try {
    console.log('[marketer page] Fetching stats and users...')
    const [statsResult, usersResult] = await Promise.all([
      getMarketerStats(),
      getMarketerUsers({ page: pagination.value.page, pageSize: pagination.value.pageSize }),
    ])
    console.log('[marketer page] Data loaded:', { statsResult, usersResult })

    stats.value = statsResult.data
    users.value = usersResult.data
    pagination.value = usersResult.meta.pagination
  } catch (err) {
    console.error('[marketer] Failed to load data:', err)
    error.value = err.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
}

async function goToPage(page) {
  pagination.value.page = page
  try {
    const usersResult = await getMarketerUsers({ page, pageSize: pagination.value.pageSize })
    users.value = usersResult.data
    pagination.value = usersResult.meta.pagination
  } catch (err) {
    console.error('[marketer] Failed to load users:', err)
  }
}

function copyReferralLink() {
  navigator.clipboard.writeText(referralLink)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

onMounted(() => {
  console.log('[marketer page] Page mounted, loading data...')
  loadData()
})
</script>

<style scoped>
.kpi-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.25rem;
  text-align: center;
}

.kpi-card.highlight {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-color: rgba(236, 72, 153, 0.2);
}

.kpi-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.kpi-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.click-stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1rem;
  text-align: center;
}

.click-stat-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
}

.click-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.click-stat-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

.stat-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
}

.stat-pill-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.stat-pill-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.referral-link-card {
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 1rem;
  padding: 1.25rem;
}

.users-table-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
