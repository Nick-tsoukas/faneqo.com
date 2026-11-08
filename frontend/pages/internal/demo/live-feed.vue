<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Page Header -->
    <div class="border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Live Feed Demo</h1>
            <p class="text-white/70">Real-time momentum feed for bands and events</p>
          </div>
          
          <!-- Controls -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- View Toggle -->
            <div class="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                @click="viewType = 'band'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  viewType === 'band' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/60 hover:text-white/80'
                ]"
              >
                Band View
              </button>
              <button
                @click="viewType = 'event'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  viewType === 'event' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/60 hover:text-white/80'
                ]"
              >
                Event View
              </button>
            </div>

            <!-- Simulate Activity Button -->
            <button
              @click="simulateActivity"
              class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all transform hover:scale-105"
            >
              Simulate Activity
            </button>

            <!-- Auto-run Toggle -->
            <div class="flex items-center gap-2">
              <input
                v-model="autoRun"
                type="checkbox"
                id="autoRun"
                class="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
              >
              <label for="autoRun" class="text-sm text-white/70">Auto-run</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Feed -->
        <div class="lg:col-span-2 space-y-6">
          <!-- NOW Banner -->
          <NowBanner
            :state="nowBannerState"
            :content="nowBannerContent"
            @cta-click="handleBannerCta"
          />

          <!-- Filters -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="filter in filters"
              :key="filter.key"
              @click="activeFilter = filter.key"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                activeFilter === filter.key
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              ]"
            >
              {{ filter.label }}
            </button>

            <!-- Density Toggle -->
            <div class="flex items-center gap-2 ml-auto">
              <button
                @click="density = 'comfortable'"
                :class="[
                  'px-3 py-1 rounded text-xs font-medium transition-all',
                  density === 'comfortable'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                ]"
              >
                Comfortable
              </button>
              <button
                @click="density = 'compact'"
                :class="[
                  'px-3 py-1 rounded text-xs font-medium transition-all',
                  density === 'compact'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                ]"
              >
                Compact
              </button>
            </div>
          </div>

          <!-- Live Feed -->
          <div class="space-y-3">
            <TransitionGroup
              name="feed-item"
              tag="div"
              class="space-y-3"
            >
              <div
                v-for="item in filteredFeedItems"
                :key="item.id"
                :class="[
                  'feed-item flex items-start gap-3 p-4 rounded-xl border transition-all',
                  density === 'comfortable' ? 'py-4' : 'py-3',
                  getItemClasses(item)
                ]"
              >
                <!-- Icon -->
                <div :class="getIconClasses(item.icon)" class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <span class="text-sm">{{ item.icon }}</span>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-white mb-1">{{ item.title }}</div>
                  <div class="text-sm text-white/70 mb-2">{{ item.subtitle }}</div>
                  
                  <!-- Additional Info -->
                  <div class="flex items-center gap-4 text-xs text-white/50">
                    <span v-if="item.city">{{ item.city }}</span>
                    <span>{{ formatTimeAgo(item.timestamp) }}</span>
                  </div>
                </div>

                <!-- Metric -->
                <div v-if="item.metricValue" class="shrink-0 text-right">
                  <div class="text-lg font-semibold text-white">{{ item.metricValue }}</div>
                  <div class="text-xs text-white/50">{{ item.metricLabel }}</div>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Shareable Moments Preview -->
          <div v-if="shareableMoments.length" class="space-y-4">
            <h3 class="text-lg font-semibold text-white">Shareable Moments</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="moment in shareableMoments.slice(0, 6)"
                :key="moment.id"
                @click="selectedMoment = moment"
                class="cursor-pointer group"
              >
                <div class="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-white/10 p-4 flex flex-col items-center justify-center text-center transition-all group-hover:border-purple-400/30 group-hover:scale-105">
                  <div class="text-2xl mb-2">{{ moment.icon }}</div>
                  <div class="text-sm font-medium text-white mb-1">{{ moment.title }}</div>
                  <div class="text-xs text-white/70">{{ moment.subtitle }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Rail: Summary -->
        <div class="space-y-6">
          <!-- Momentum Score -->
          <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-400/20 p-4">
            <div class="text-sm text-white/70 mb-2">Momentum Score</div>
            <div class="text-3xl font-bold text-white mb-1">{{ momentumScore }}</div>
            <div class="text-xs text-white/50">{{ momentumChange }}</div>
          </div>

          <!-- Top City -->
          <div class="bg-white/5 rounded-xl border border-white/10 p-4">
            <div class="text-sm text-white/70 mb-2">Top City Right Now</div>
            <div class="text-lg font-semibold text-white mb-1">{{ topCity.name }}</div>
            <div class="text-xs text-white/50">{{ topCity.activity }} activity</div>
          </div>

          <!-- Top Link -->
          <div class="bg-white/5 rounded-xl border border-white/10 p-4">
            <div class="text-sm text-white/70 mb-2">Top Link Today</div>
            <div class="text-lg font-semibold text-white mb-1">{{ topLink.platform }}</div>
            <div class="text-xs text-white/50">{{ topLink.clicks }} clicks</div>
          </div>

          <!-- Recent Plays -->
          <div class="bg-white/5 rounded-xl border border-white/10 p-4">
            <div class="text-sm text-white/70 mb-2">Plays (60 min)</div>
            <div class="text-lg font-semibold text-white mb-1">{{ recentPlays }}</div>
            <div class="text-xs text-white/50">Last hour</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shareable Moment Modal -->
    <div
      v-if="selectedMoment"
      @click="selectedMoment = null"
      class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
    >
      <div
        @click.stop
        class="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-md w-full"
      >
        <div class="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-white/10 mb-4 flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-2">{{ selectedMoment.icon }}</div>
            <div class="text-lg font-semibold text-white mb-1">{{ selectedMoment.title }}</div>
            <div class="text-sm text-white/70">{{ selectedMoment.subtitle }}</div>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button
            @click="copyCaption(selectedMoment)"
            class="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
          >
            Copy Caption
          </button>
          <button
            @click="downloadImage(selectedMoment)"
            class="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
          >
            Download Image
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import NowBanner from '~/components/smartlink/NowBanner.vue'

// State
const viewType = ref('band')
const activeFilter = ref('all')
const density = ref('comfortable')
const autoRun = ref(false)
const selectedMoment = ref(null)
const feedItems = ref([])
const shareableMoments = ref([])
let autoRunInterval = null

// Demo Data
const demoData = {
  band: {
    name: 'Midnight Waves',
    city: 'Austin, TX',
    momentumScore: 87,
    momentumChange: '+12 this week',
    topCity: { name: 'Austin, TX', activity: '45 sessions' },
    topLink: { platform: 'Spotify', clicks: '234' },
    recentPlays: '1,847',
    nowBannerState: 'HEATING_UP',
    nowBannerContent: {
      icon: '🔥',
      headline: 'Heating Up in Austin',
      subtext: '3x activity spike this week',
      accent: 'orange'
    }
  },
  event: {
    name: 'Summer Music Festival',
    city: 'Chicago, IL',
    momentumScore: 92,
    momentumChange: '+25 this week',
    topCity: { name: 'Chicago, IL', activity: '128 sessions' },
    topLink: { platform: 'Tickets', clicks: '567' },
    recentPlays: '892',
    nowBannerState: 'SHOW_TONIGHT',
    nowBannerContent: {
      icon: '🎤',
      headline: 'Live Tonight in Chicago',
      subtext: 'The Metro • 8:00 PM',
      accent: 'purple',
      cta: 'Get Tickets',
      ctaLink: '#'
    }
  }
}

// Feed item templates
const feedItemTemplates = {
  band: [
    { type: 'page_view', icon: '👁️', title: 'Page view burst', metricValue: '+24', metricLabel: 'views' },
    { type: 'link_click', icon: '🎵', title: 'Spotify link clicked', metricValue: '12', metricLabel: 'clicks' },
    { type: 'song_play', icon: '▶️', title: 'Midnight Dreams played', metricValue: '48', metricLabel: 'plays' },
    { type: 'new_follower', icon: '👤', title: 'New follower', metricValue: '+1', metricLabel: 'follower' },
    { type: 'shareable_moment', icon: '📸', title: 'Shareable moment created', metricValue: '3.2x', metricLabel: 'engagement' },
    { type: 'city_signal', icon: '📍', title: 'Austin tuning in', metricValue: '67%', metricLabel: 'of traffic' },
    { type: 'momentum_surge', icon: '📈', title: 'Momentum surge detected', metricValue: '2.8x', metricLabel: 'velocity' },
    { type: 'support_received', icon: '💜', title: 'Support received', metricValue: '$20', metricLabel: 'tip' }
  ],
  event: [
    { type: 'ticket_click', icon: '🎫', title: 'Ticket link clicked', metricValue: '34', metricLabel: 'clicks' },
    { type: 'page_view', icon: '👁️', title: 'Event page views', metricValue: '+156', metricLabel: 'views' },
    { type: 'city_signal', icon: '📍', title: 'Chicago fans checking in', metricValue: '89%', metricLabel: 'local' },
    { type: 'shareable_moment', icon: '📸', title: 'Event hype moment', metricValue: '5.1x', metricLabel: 'shares' },
    { type: 'momentum_surge', icon: '📈', title: 'Pre-show spike', metricValue: '4.2x', metricLabel: 'activity' },
    { type: 'after_show', icon: '🎉', title: 'After-show energy', metricValue: '2.3x', metricLabel: 'engagement' }
  ]
}

// Shareable moment templates
const shareableMomentTemplates = [
  { icon: '🔥', title: 'Heating Up', subtitle: 'Austin loves us' },
  { icon: '🎤', title: 'Show Night', subtitle: 'Chicago tonight!' },
  { icon: '💜', title: 'Support', subtitle: 'Amazing fans' },
  { icon: '📈', title: 'Trending', subtitle: 'On the rise' },
  { icon: '🎵', title: 'New Music', subtitle: 'Fresh sounds' },
  { icon: '🌟', title: 'Milestone', subtitle: '1000 plays!' }
]

// Filters
const filters = [
  { key: 'all', label: 'All' },
  { key: 'views', label: 'Views' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'plays', label: 'Plays' },
  { key: 'follows', label: 'Follows' },
  { key: 'shares', label: 'Shares' },
  { key: 'cities', label: 'Cities' }
]

// Computed
const currentDemoData = computed(() => demoData[viewType.value])
const nowBannerState = computed(() => currentDemoData.value.nowBannerState)
const nowBannerContent = computed(() => currentDemoData.value.nowBannerContent)
const momentumScore = computed(() => currentDemoData.value.momentumScore)
const momentumChange = computed(() => currentDemoData.value.momentumChange)
const topCity = computed(() => currentDemoData.value.topCity)
const topLink = computed(() => currentDemoData.value.topLink)
const recentPlays = computed(() => currentDemoData.value.recentPlays)

const filteredFeedItems = computed(() => {
  let items = feedItems.value
  
  if (activeFilter.value !== 'all') {
    const filterMap = {
      views: ['page_view'],
      clicks: ['link_click', 'ticket_click'],
      plays: ['song_play'],
      follows: ['new_follower'],
      shares: ['shareable_moment'],
      cities: ['city_signal']
    }
    
    const allowedTypes = filterMap[activeFilter.value] || []
    items = items.filter(item => allowedTypes.includes(item.type))
  }
  
  return items.sort((a, b) => b.timestamp - a.timestamp)
})

// Methods
function generateFeedItem() {
  const templates = feedItemTemplates[viewType.value]
  const template = templates[Math.floor(Math.random() * templates.length)]
  const cities = viewType.value === 'band' 
    ? ['Austin, TX', 'Seattle, WA', 'Portland, OR', 'Denver, CO']
    : ['Chicago, IL', 'Milwaukee, WI', 'Indianapolis, IN']
  
  return {
    id: Date.now() + Math.random(),
    type: template.type,
    icon: template.icon,
    title: template.title,
    subtitle: `${currentDemoData.value.name} • ${cities[Math.floor(Math.random() * cities.length)]}`,
    metricValue: template.metricValue,
    metricLabel: template.metricLabel,
    city: cities[Math.floor(Math.random() * cities.length)],
    timestamp: Date.now(),
    level: ['info', 'success', 'warn'][Math.floor(Math.random() * 3)]
  }
}

function simulateActivity() {
  const newItem = generateFeedItem()
  feedItems.value.unshift(newItem)
  
  // Update momentum score occasionally
  if (Math.random() > 0.7) {
    currentDemoData.value.momentumScore = Math.min(100, currentDemoData.value.momentumScore + Math.floor(Math.random() * 5))
  }
  
  // Add shareable moment occasionally
  if (Math.random() > 0.8 && shareableMoments.value.length < 6) {
    const template = shareableMomentTemplates[Math.floor(Math.random() * shareableMomentTemplates.length)]
    shareableMoments.value.unshift({
      id: Date.now() + Math.random(),
      ...template
    })
  }
}

function formatTimeAgo(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return 'Today'
}

function getIconClasses(icon) {
  const iconMap = {
    '👁️': 'bg-blue-500/20 text-blue-400',
    '🎵': 'bg-purple-500/20 text-purple-400',
    '▶️': 'bg-green-500/20 text-green-400',
    '👤': 'bg-pink-500/20 text-pink-400',
    '📸': 'bg-yellow-500/20 text-yellow-400',
    '📍': 'bg-orange-500/20 text-orange-400',
    '📈': 'bg-emerald-500/20 text-emerald-400',
    '💜': 'bg-pink-500/20 text-pink-400',
    '🎫': 'bg-purple-500/20 text-purple-400',
    '🎉': 'bg-orange-500/20 text-orange-400'
  }
  return iconMap[icon] || 'bg-white/10 text-white/70'
}

function getItemClasses(item) {
  const levelMap = {
    info: 'bg-white/[0.03] border-white/10',
    success: 'bg-green-500/[0.05] border-green-400/20',
    warn: 'bg-orange-500/[0.05] border-orange-400/20'
  }
  return levelMap[item.level] || levelMap.info
}

function handleBannerCta(action) {
  console.log('Banner CTA clicked:', action)
}

function copyCaption(moment) {
  const caption = `${moment.icon} ${moment.title} - ${moment.subtitle} #${currentDemoData.value.name.replace(/\s+/g, '')}`
  navigator.clipboard.writeText(caption)
  selectedMoment.value = null
}

function downloadImage(moment) {
  // UI only - no real download
  console.log('Download image:', moment)
  selectedMoment.value = null
}

// Auto-run
watch(autoRun, (newValue) => {
  if (newValue) {
    autoRunInterval = setInterval(() => {
      simulateActivity()
    }, 3000)
  } else {
    if (autoRunInterval) {
      clearInterval(autoRunInterval)
      autoRunInterval = null
    }
  }
})

// Initialize
onMounted(() => {
  // Generate initial feed items
  for (let i = 0; i < 8; i++) {
    feedItems.value.push(generateFeedItem())
  }
  
  // Generate initial shareable moments
  for (let i = 0; i < 3; i++) {
    const template = shareableMomentTemplates[i]
    shareableMoments.value.push({
      id: Date.now() + i,
      ...template
    })
  }
})

onUnmounted(() => {
  if (autoRunInterval) {
    clearInterval(autoRunInterval)
  }
})
</script>

<style scoped>
.feed-item-enter-active {
  transition: all 0.3s ease-out;
}

.feed-item-leave-active {
  transition: all 0.3s ease-in;
}

.feed-item-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.feed-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.feed-item-move {
  transition: transform 0.3s ease;
}
</style>
