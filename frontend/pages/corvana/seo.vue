<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Corvana SEO Dashboard</h1>
            <p class="text-sm text-gray-500 mt-1">AI-powered SEO analysis for MusicBizQR</p>
          </div>
          <div class="flex items-center gap-3">
            <span 
              :class="connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              class="px-3 py-1 rounded-full text-sm font-medium"
            >
              {{ connectionStatus === 'connected' ? '● Connected' : '● Disconnected' }}
            </span>
            <button
              @click="testConnection"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Error Alert -->
      <div v-if="error" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <span class="text-red-600 font-medium">Error:</span>
          <p class="ml-2 text-red-700">{{ error }}</p>
        </div>
      </div>

      <!-- Action Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <!-- SEO Snapshot -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">SEO Snapshot</h3>
            <span class="text-2xl">📊</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">Full site analysis for ChatGPT</p>
          <div class="space-y-2">
            <button
              @click="fetchData('snapshot')"
              :disabled="loading.snapshot"
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {{ loading.snapshot ? 'Loading...' : 'Load Data' }}
            </button>
            <button
              v-if="data.snapshot"
              @click="copyToClipboard('snapshot')"
              class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              {{ copied.snapshot ? '✓ Copied!' : 'Copy JSON' }}
            </button>
          </div>
        </div>

        <!-- Upgrade Queue -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Upgrade Queue</h3>
            <span class="text-2xl">🚀</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">Prioritized pages to upgrade</p>
          <div class="space-y-2">
            <button
              @click="fetchData('upgrade-queue')"
              :disabled="loading.upgradeQueue"
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {{ loading.upgradeQueue ? 'Loading...' : 'Load Data' }}
            </button>
            <button
              v-if="data.upgradeQueue"
              @click="copyToClipboard('upgradeQueue')"
              class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              {{ copied.upgradeQueue ? '✓ Copied!' : 'Copy JSON' }}
            </button>
          </div>
        </div>

        <!-- Cannibalization -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Cannibalization</h3>
            <span class="text-2xl">⚔️</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">Query conflicts across pages</p>
          <div class="space-y-2">
            <button
              @click="fetchData('cannibalization')"
              :disabled="loading.cannibalization"
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {{ loading.cannibalization ? 'Loading...' : 'Load Data' }}
            </button>
            <button
              v-if="data.cannibalization"
              @click="copyToClipboard('cannibalization')"
              class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              {{ copied.cannibalization ? '✓ Copied!' : 'Copy JSON' }}
            </button>
          </div>
        </div>

        <!-- Cluster Health -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Cluster Health</h3>
            <span class="text-2xl">🌳</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">Per-cluster performance</p>
          <div class="space-y-2">
            <button
              @click="fetchData('cluster-health')"
              :disabled="loading.clusterHealth"
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {{ loading.clusterHealth ? 'Loading...' : 'Load Data' }}
            </button>
            <button
              v-if="data.clusterHealth"
              @click="copyToClipboard('clusterHealth')"
              class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              {{ copied.clusterHealth ? '✓ Copied!' : 'Copy JSON' }}
            </button>
          </div>
        </div>

        <!-- Query Ownership -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Query Ownership</h3>
            <span class="text-2xl">👑</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">Which page owns each query</p>
          <div class="space-y-2">
            <button
              @click="fetchData('query-ownership')"
              :disabled="loading.queryOwnership"
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {{ loading.queryOwnership ? 'Loading...' : 'Load Data' }}
            </button>
            <button
              v-if="data.queryOwnership"
              @click="copyToClipboard('queryOwnership')"
              class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              {{ copied.queryOwnership ? '✓ Copied!' : 'Copy JSON' }}
            </button>
          </div>
        </div>

        <!-- Internal Links -->
        <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Internal Links</h3>
            <span class="text-2xl">🔗</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">Link recommendations</p>
          <div class="space-y-2">
            <button
              @click="fetchData('internal-links')"
              :disabled="loading.internalLinks"
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {{ loading.internalLinks ? 'Loading...' : 'Load Data' }}
            </button>
            <button
              v-if="data.internalLinks"
              @click="copyToClipboard('internalLinks')"
              class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              {{ copied.internalLinks ? '✓ Copied!' : 'Copy JSON' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Page Detail Section -->
      <div class="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Page Detail Analysis</h3>
        <div class="flex gap-4 mb-4">
          <input
            v-model="pageUrl"
            type="text"
            placeholder="https://musicbizqr.com/article/..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            @click="fetchPageDetail"
            :disabled="loading.pageDetail || !pageUrl"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {{ loading.pageDetail ? 'Loading...' : 'Analyze' }}
          </button>
        </div>
        <div v-if="data.pageDetail" class="flex gap-2">
          <button
            @click="copyToClipboard('pageDetail')"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
          >
            {{ copied.pageDetail ? '✓ Copied!' : 'Copy JSON' }}
          </button>
        </div>
      </div>

      <!-- Upgrade Tracker -->
      <div class="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Upgrade Tracker</h3>
          <div class="flex gap-2">
            <button
              @click="fetchUpgrades"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              View All
            </button>
            <button
              @click="fetchUpgradeReport"
              class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
            >
              View Report
            </button>
          </div>
        </div>

        <!-- Mark Upgrade Form -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 class="font-medium text-gray-900 mb-3">Mark New Upgrade</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              v-model="upgradeForm.page"
              type="text"
              placeholder="Page URL"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              v-model="upgradeForm.type"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select type...</option>
              <option value="TITLE_META_REWRITE">Title/Meta Rewrite</option>
              <option value="ARTICLE_REFRESH">Article Refresh</option>
              <option value="INTERNAL_LINKING">Internal Linking</option>
              <option value="PILLAR_STRENGTHENING">Pillar Strengthening</option>
              <option value="HOMEPAGE_SEO_UPGRADE">Homepage SEO Upgrade</option>
            </select>
          </div>
          <textarea
            v-model="upgradeForm.notes"
            placeholder="What was changed?"
            rows="2"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
          ></textarea>
          <button
            @click="markUpgrade"
            :disabled="markingUpgrade || !upgradeForm.page || !upgradeForm.type"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {{ markingUpgrade ? 'Saving...' : 'Mark Upgrade' }}
          </button>
        </div>

        <!-- Upgrade List -->
        <div v-if="data.upgrades?.upgrades?.length" class="space-y-2">
          <div
            v-for="upgrade in data.upgrades.upgrades.slice(0, 5)"
            :key="upgrade.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">{{ upgrade.upgradeType }}</p>
              <p class="text-sm text-gray-500">{{ upgrade.page.split('/').pop() }}</p>
              <p class="text-xs text-gray-400">{{ new Date(upgrade.upgradeDate).toLocaleDateString() }}</p>
            </div>
            <span
              :class="upgrade.afterMetrics ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
              class="px-2 py-1 rounded text-xs font-medium"
            >
              {{ upgrade.afterMetrics ? 'Results recorded' : 'Pending results' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ChatGPT Prompts -->
      <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">ChatGPT Prompts</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            v-for="type in promptTypes"
            :key="type.value"
            @click="generatePrompt(type.value)"
            :disabled="loading[`prompt-${type.value}`]"
            class="px-4 py-3 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 disabled:opacity-50 transition text-left"
          >
            {{ loading[`prompt-${type.value}`] ? 'Generating...' : type.label }}
          </button>
        </div>
        <div v-if="data.prompt" class="mt-4">
          <textarea
            :value="data.prompt.prompt"
            rows="10"
            readonly
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
          ></textarea>
          <button
            @click="copyPromptToClipboard"
            class="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            {{ copied.prompt ? '✓ Copied!' : 'Copy Prompt' }}
          </button>
        </div>
      </div>

      <!-- Data Preview -->
      <div v-if="activePreview" class="mt-8 bg-white rounded-lg shadow border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Data Preview</h3>
          <button
            @click="activePreview = null"
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <pre class="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">{{ JSON.stringify(data[activePreview], null, 2) }}</pre>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

// Connection status
const connectionStatus = ref('unknown')
const error = ref('')

// Loading states
const loading = reactive({
  snapshot: false,
  upgradeQueue: false,
  cannibalization: false,
  clusterHealth: false,
  queryOwnership: false,
  internalLinks: false,
  pageDetail: false
})

// Data storage
const data = reactive({
  snapshot: null,
  upgradeQueue: null,
  cannibalization: null,
  clusterHealth: null,
  queryOwnership: null,
  internalLinks: null,
  pageDetail: null,
  upgrades: null,
  upgradeReport: null,
  prompt: null
})

// Copy states
const copied = reactive({
  snapshot: false,
  upgradeQueue: false,
  cannibalization: false,
  clusterHealth: false,
  queryOwnership: false,
  internalLinks: false,
  pageDetail: false,
  prompt: false
})

// Page detail input
const pageUrl = ref('')

// Upgrade form
const upgradeForm = reactive({
  page: '',
  type: '',
  notes: ''
})
const markingUpgrade = ref(false)

// Active preview
const activePreview = ref(null)

// Prompt types
const promptTypes = [
  { value: 'snapshot', label: '📊 SEO Snapshot' },
  { value: 'upgrade', label: '🚀 Upgrade Plan' },
  { value: 'cannibalization', label: '⚔️ Fix Conflicts' },
  { value: 'cluster', label: '🌳 Cluster Strategy' },
  { value: 'internal-links', label: '🔗 Link Building' }
]

// Test Search Console connection
async function testConnection() {
  try {
    const response = await fetch('/api/corvana/search-console/test')
    if (response.ok) {
      connectionStatus.value = 'connected'
      error.value = ''
    } else {
      connectionStatus.value = 'disconnected'
      const data = await response.json()
      error.value = data.error || 'Connection failed'
    }
  } catch (err) {
    connectionStatus.value = 'disconnected'
    error.value = err.message
  }
}

// Fetch data from endpoints
async function fetchData(type) {
  const loadingKey = type === 'upgrade-queue' ? 'upgradeQueue' : 
                     type === 'cluster-health' ? 'clusterHealth' :
                     type === 'query-ownership' ? 'queryOwnership' :
                     type === 'internal-links' ? 'internalLinks' : type
  
  loading[loadingKey] = true
  error.value = ''
  
  try {
    const endpoint = type === 'snapshot' ? '/api/corvana/seo/export/snapshot' :
                    type === 'upgrade-queue' ? '/api/corvana/seo/export/upgrade-queue' :
                    type === 'cannibalization' ? '/api/corvana/seo/export/cannibalization' :
                    type === 'cluster-health' ? '/api/corvana/seo/report/cluster-health' :
                    type === 'query-ownership' ? '/api/corvana/seo/report/query-ownership' :
                    type === 'internal-links' ? '/api/corvana/seo/report/internal-links' : ''
    
    const response = await fetch(`${endpoint}?days=28`)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || result.message || 'Failed to fetch')
    }
    
    data[loadingKey] = result
    activePreview.value = loadingKey
  } catch (err) {
    error.value = err.message
  } finally {
    loading[loadingKey] = false
  }
}

// Fetch page detail
async function fetchPageDetail() {
  if (!pageUrl.value) return
  
  loading.pageDetail = true
  error.value = ''
  
  try {
    const encodedUrl = encodeURIComponent(pageUrl.value)
    const response = await fetch(`/api/corvana/seo/export/page-detail?url=${encodedUrl}&days=28`)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || result.message || 'Failed to fetch')
    }
    
    data.pageDetail = result
    activePreview.value = 'pageDetail'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.pageDetail = false
  }
}

// Fetch upgrades
async function fetchUpgrades() {
  try {
    const response = await fetch('/api/corvana/seo/upgrades')
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch')
    }
    
    data.upgrades = result
    activePreview.value = 'upgrades'
  } catch (err) {
    error.value = err.message
  }
}

// Fetch upgrade report
async function fetchUpgradeReport() {
  try {
    const response = await fetch('/api/corvana/seo/upgrades/report')
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch')
    }
    
    data.upgradeReport = result
    activePreview.value = 'upgradeReport'
  } catch (err) {
    error.value = err.message
  }
}

// Mark upgrade
async function markUpgrade() {
  markingUpgrade.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/corvana/seo/upgrades/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: upgradeForm.page,
        upgradeType: upgradeForm.type,
        notes: upgradeForm.notes,
        changedFields: []
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to mark upgrade')
    }
    
    // Clear form
    upgradeForm.page = ''
    upgradeForm.type = ''
    upgradeForm.notes = ''
    
    // Refresh list
    await fetchUpgrades()
  } catch (err) {
    error.value = err.message
  } finally {
    markingUpgrade.value = false
  }
}

// Generate ChatGPT prompt
async function generatePrompt(type) {
  loading[`prompt-${type}`] = true
  error.value = ''
  
  try {
    const response = await fetch(`/api/corvana/seo/export/chatgpt-prompt?type=${type}&days=28`)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate prompt')
    }
    
    data.prompt = result
  } catch (err) {
    error.value = err.message
  } finally {
    loading[`prompt-${type}`] = false
  }
}

// Copy to clipboard
async function copyToClipboard(key) {
  const dataToCopy = data[key]
  if (!dataToCopy) return
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2))
    copied[key] = true
    setTimeout(() => copied[key] = false, 2000)
  } catch (err) {
    error.value = 'Failed to copy to clipboard'
  }
}

// Copy prompt to clipboard
async function copyPromptToClipboard() {
  if (!data.prompt?.prompt) return
  
  try {
    await navigator.clipboard.writeText(data.prompt.prompt)
    copied.prompt = true
    setTimeout(() => copied.prompt = false, 2000)
  } catch (err) {
    error.value = 'Failed to copy to clipboard'
  }
}

// Test connection on mount
onMounted(() => {
  testConnection()
})

useHead({
  title: 'Corvana SEO Dashboard'
})
</script>
