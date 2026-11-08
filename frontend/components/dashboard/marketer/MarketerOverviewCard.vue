<template>
  <section v-if="showCard" class="marketer-card">
    <!-- Header -->
    <div class="card-header">
      <div class="header-left">
        <div class="icon-wrapper">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2 class="title">Partner Dashboard</h2>
          <p class="subtitle">Your referral performance</p>
        </div>
      </div>
      <NuxtLink to="/marketer-dashboard" class="view-all-btn">
        View Details
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading stats...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Stats Grid -->
    <div v-else class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalReferredUsers }}</div>
        <div class="stat-label">Total Referrals</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-blue-400">{{ stats.trialUsers }}</div>
        <div class="stat-label">On Trial</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-emerald-400">{{ stats.activeUsers }}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-value text-purple-400">{{ formatCurrency(stats.estimatedMonthlyCommission) }}</div>
        <div class="stat-label">Est. Monthly Commission</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="actions">
      <NuxtLink to="/marketer-dashboard" class="action-btn primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        View Analytics
      </NuxtLink>
      <button type="button" class="action-btn secondary" @click="copyReferralLink">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
        {{ copied ? 'Copied!' : 'Copy Referral Link' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMarketer } from '~/composables/useMarketer'

const { isMarketer, checkIsMarketer, getMarketerStats, formatCurrency } = useMarketer()

const loading = ref(true)
const error = ref('')
const copied = ref(false)
const showCard = ref(false)
const stats = ref({
  totalReferredUsers: 0,
  trialUsers: 0,
  activeUsers: 0,
  canceledUsers: 0,
  estimatedMonthlyCommission: 0,
})

async function loadStats() {
  // First check if user is a marketer via API
  const isMarketerUser = await checkIsMarketer()
  if (!isMarketerUser) {
    showCard.value = false
    loading.value = false
    return
  }
  
  showCard.value = true
  loading.value = true
  error.value = ''
  
  try {
    const result = await getMarketerStats()
    stats.value = result.data
  } catch (err) {
    console.error('[MarketerOverviewCard] Failed to load stats:', err)
    error.value = 'Failed to load stats'
  } finally {
    loading.value = false
  }
}

function copyReferralLink() {
  const link = 'https://musicbizqr.com/?ref=shannon'
  navigator.clipboard.writeText(link)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.marketer-card {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
}

.subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #a78bfa;
  transition: color 0.2s;
}

.view-all-btn:hover {
  color: #c4b5fd;
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.error-state {
  color: #f87171;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
}

.stat-card.highlight {
  grid-column: span 2;
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
}

@media (min-width: 640px) {
  .stat-card.highlight {
    grid-column: span 1;
  }
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}
</style>
