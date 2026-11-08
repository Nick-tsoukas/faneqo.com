<template>
  <div class="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-400/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">Platform Clicks</h3>
            <p class="text-white/50 text-xs">Where fans go after visiting your page</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-white tabular-nums">{{ totalClicks.toLocaleString() }}</div>
          <div class="text-xs text-white/50">total clicks</div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span class="text-white/50 text-sm">Loading platform data...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!platforms.length" class="flex flex-col items-center justify-center py-12 text-center">
        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <p class="text-white/60 font-medium">No link clicks yet</p>
        <p class="text-white/40 text-sm mt-1">Clicks will appear here as fans explore your links</p>
      </div>

      <!-- Platform List -->
      <div v-else class="space-y-3">
        <div
          v-for="(item, index) in platforms"
          :key="item.platform"
          class="group relative"
        >
          <div class="flex items-center gap-3">
            <!-- Platform Icon -->
            <div 
              class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              :class="getPlatformBgClass(item.platform)"
            >
              <component 
                :is="getPlatformIcon(item.platform)" 
                class="w-5 h-5"
                :style="{ color: getPlatformColor(item.platform) }"
              />
            </div>

            <!-- Platform Name & Bar -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-white font-medium text-sm capitalize truncate">
                  {{ formatPlatformName(item.platform) }}
                </span>
                <span class="text-white/70 text-sm tabular-nums font-medium ml-2">
                  {{ item.count.toLocaleString() }}
                </span>
              </div>
              
              <!-- Progress Bar -->
              <div class="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 ease-out"
                  :class="getBarClass(index)"
                  :style="{ width: getBarWidth(item.count) + '%' }"
                />
              </div>
            </div>

            <!-- Percentage -->
            <div class="w-12 text-right shrink-0">
              <span class="text-white/50 text-xs tabular-nums">
                {{ getPercentage(item.count) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Show More / Less -->
      <div v-if="hasMore" class="mt-4 pt-4 border-t border-white/10">
        <button
          @click="expanded = !expanded"
          class="w-full flex items-center justify-center gap-2 py-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          <span>{{ expanded ? 'Show less' : `Show all ${allPlatforms.length} platforms` }}</span>
          <svg 
            class="w-4 h-4 transition-transform" 
            :class="{ 'rotate-180': expanded }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'

const props = defineProps<{
  platformData: [string, number][]
  loading?: boolean
  rangeLabel?: string
}>()

const expanded = ref(false)
const INITIAL_SHOW = 8

const allPlatforms = computed(() => {
  return (props.platformData || []).map(([platform, count]) => ({
    platform,
    count: Number(count) || 0
  })).sort((a, b) => b.count - a.count)
})

const platforms = computed(() => {
  if (expanded.value) return allPlatforms.value
  return allPlatforms.value.slice(0, INITIAL_SHOW)
})

const hasMore = computed(() => allPlatforms.value.length > INITIAL_SHOW)

const totalClicks = computed(() => {
  return allPlatforms.value.reduce((sum, p) => sum + p.count, 0)
})

const maxCount = computed(() => {
  return allPlatforms.value[0]?.count || 1
})

function getBarWidth(count: number): number {
  return Math.max(2, Math.round((count / maxCount.value) * 100))
}

function getPercentage(count: number): string {
  if (totalClicks.value === 0) return '0'
  return ((count / totalClicks.value) * 100).toFixed(1)
}

function getRankClass(index: number): string {
  if (index === 0) return 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950'
  if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
  if (index === 2) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100'
  return 'bg-white/10 text-white/60'
}

function getBarClass(index: number): string {
  if (index === 0) return 'bg-gradient-to-r from-violet-500 to-purple-500'
  if (index === 1) return 'bg-gradient-to-r from-violet-500/80 to-purple-500/80'
  if (index === 2) return 'bg-gradient-to-r from-violet-500/60 to-purple-500/60'
  return 'bg-violet-500/40'
}

const PLATFORM_CONFIG: Record<string, { color: string; bgClass: string; icon: string }> = {
  spotify: { color: '#1DB954', bgClass: 'bg-[#1DB954]/10 border-[#1DB954]/20', icon: 'spotify' },
  'apple music': { color: '#FC3C44', bgClass: 'bg-[#FC3C44]/10 border-[#FC3C44]/20', icon: 'apple' },
  applemusic: { color: '#FC3C44', bgClass: 'bg-[#FC3C44]/10 border-[#FC3C44]/20', icon: 'apple' },
  youtube: { color: '#FF0000', bgClass: 'bg-[#FF0000]/10 border-[#FF0000]/20', icon: 'youtube' },
  'youtube music': { color: '#FF0000', bgClass: 'bg-[#FF0000]/10 border-[#FF0000]/20', icon: 'youtube' },
  youtubemusic: { color: '#FF0000', bgClass: 'bg-[#FF0000]/10 border-[#FF0000]/20', icon: 'youtube' },
  soundcloud: { color: '#FF5500', bgClass: 'bg-[#FF5500]/10 border-[#FF5500]/20', icon: 'soundcloud' },
  bandcamp: { color: '#1DA0C3', bgClass: 'bg-[#1DA0C3]/10 border-[#1DA0C3]/20', icon: 'bandcamp' },
  deezer: { color: '#FEAA2D', bgClass: 'bg-[#FEAA2D]/10 border-[#FEAA2D]/20', icon: 'deezer' },
  tidal: { color: '#000000', bgClass: 'bg-white/10 border-white/20', icon: 'tidal' },
  amazon: { color: '#FF9900', bgClass: 'bg-[#FF9900]/10 border-[#FF9900]/20', icon: 'amazon' },
  'amazon music': { color: '#FF9900', bgClass: 'bg-[#FF9900]/10 border-[#FF9900]/20', icon: 'amazon' },
  amazonmusic: { color: '#FF9900', bgClass: 'bg-[#FF9900]/10 border-[#FF9900]/20', icon: 'amazon' },
  pandora: { color: '#3668FF', bgClass: 'bg-[#3668FF]/10 border-[#3668FF]/20', icon: 'pandora' },
  tiktok: { color: '#000000', bgClass: 'bg-white/10 border-white/20', icon: 'tiktok' },
  instagram: { color: '#E4405F', bgClass: 'bg-[#E4405F]/10 border-[#E4405F]/20', icon: 'instagram' },
  facebook: { color: '#1877F2', bgClass: 'bg-[#1877F2]/10 border-[#1877F2]/20', icon: 'facebook' },
  twitter: { color: '#1DA1F2', bgClass: 'bg-[#1DA1F2]/10 border-[#1DA1F2]/20', icon: 'twitter' },
  x: { color: '#000000', bgClass: 'bg-white/10 border-white/20', icon: 'twitter' },
  threads: { color: '#000000', bgClass: 'bg-white/10 border-white/20', icon: 'threads' },
  discord: { color: '#5865F2', bgClass: 'bg-[#5865F2]/10 border-[#5865F2]/20', icon: 'discord' },
  twitch: { color: '#9146FF', bgClass: 'bg-[#9146FF]/10 border-[#9146FF]/20', icon: 'twitch' },
  kick: { color: '#53FC18', bgClass: 'bg-[#53FC18]/10 border-[#53FC18]/20', icon: 'kick' },
  vimeo: { color: '#1AB7EA', bgClass: 'bg-[#1AB7EA]/10 border-[#1AB7EA]/20', icon: 'vimeo' },
  reverbnation: { color: '#E43526', bgClass: 'bg-[#E43526]/10 border-[#E43526]/20', icon: 'reverbnation' },
  audiomack: { color: '#FFA200', bgClass: 'bg-[#FFA200]/10 border-[#FFA200]/20', icon: 'audiomack' },
  mixcloud: { color: '#5000FF', bgClass: 'bg-[#5000FF]/10 border-[#5000FF]/20', icon: 'mixcloud' },
  beatport: { color: '#94D500', bgClass: 'bg-[#94D500]/10 border-[#94D500]/20', icon: 'beatport' },
  napster: { color: '#000000', bgClass: 'bg-white/10 border-white/20', icon: 'napster' },
  bandsintown: { color: '#00CEC8', bgClass: 'bg-[#00CEC8]/10 border-[#00CEC8]/20', icon: 'bandsintown' },
  songkick: { color: '#F80046', bgClass: 'bg-[#F80046]/10 border-[#F80046]/20', icon: 'songkick' },
  jambase: { color: '#FF6B00', bgClass: 'bg-[#FF6B00]/10 border-[#FF6B00]/20', icon: 'jambase' },
  relix: { color: '#E31837', bgClass: 'bg-[#E31837]/10 border-[#E31837]/20', icon: 'relix' },
  website: { color: '#8B5CF6', bgClass: 'bg-violet-500/10 border-violet-500/20', icon: 'globe' },
  merch: { color: '#10B981', bgClass: 'bg-emerald-500/10 border-emerald-500/20', icon: 'shopping' },
  tickets: { color: '#F59E0B', bgClass: 'bg-amber-500/10 border-amber-500/20', icon: 'ticket' },
  linkedin: { color: '#0A66C2', bgClass: 'bg-[#0A66C2]/10 border-[#0A66C2]/20', icon: 'linkedin' },
  pinterest: { color: '#E60023', bgClass: 'bg-[#E60023]/10 border-[#E60023]/20', icon: 'pinterest' },
  reddit: { color: '#FF4500', bgClass: 'bg-[#FF4500]/10 border-[#FF4500]/20', icon: 'reddit' },
  telegram: { color: '#26A5E4', bgClass: 'bg-[#26A5E4]/10 border-[#26A5E4]/20', icon: 'telegram' },
}

function getPlatformColor(platform: string): string {
  const key = platform.toLowerCase().replace(/[\s_-]/g, '')
  for (const [k, v] of Object.entries(PLATFORM_CONFIG)) {
    if (k.replace(/[\s_-]/g, '') === key) return v.color
  }
  return '#8B5CF6'
}

function getPlatformBgClass(platform: string): string {
  const key = platform.toLowerCase().replace(/[\s_-]/g, '')
  for (const [k, v] of Object.entries(PLATFORM_CONFIG)) {
    if (k.replace(/[\s_-]/g, '') === key) return v.bgClass
  }
  return 'bg-violet-500/10 border-violet-500/20'
}

function formatPlatformName(platform: string): string {
  const nameMap: Record<string, string> = {
    applemusic: 'Apple Music',
    youtubemusic: 'YouTube Music',
    amazonmusic: 'Amazon Music',
    bandsintown: 'Bandsintown',
    soundcloud: 'SoundCloud',
    reverbnation: 'ReverbNation',
    audiomack: 'Audiomack',
    mixcloud: 'Mixcloud',
    beatport: 'Beatport',
    jambase: 'JamBase',
    relix: 'Relix',
  }
  const key = platform.toLowerCase().replace(/[\s_-]/g, '')
  return nameMap[key] || platform.charAt(0).toUpperCase() + platform.slice(1)
}

function getPlatformIcon(platform: string) {
  const key = platform.toLowerCase().replace(/[\s_-]/g, '')
  
  const iconMap: Record<string, () => any> = {
    spotify: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' })
    ]),
    apple: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701' })
    ]),
    youtube: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' })
    ]),
    soundcloud: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.19-1.334c-.01-.057-.044-.09-.078-.09zm1.83-1.229c-.06 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.06-.104-.121-.104zm.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.24-2.544-.24-2.64c-.015-.075-.06-.135-.135-.135l-.031-.001zm.96-.165c-.09 0-.149.075-.165.164l-.18 2.79.195 2.595c.015.09.075.164.165.164.089 0 .164-.074.179-.164l.21-2.595-.225-2.79c-.015-.089-.074-.164-.179-.164zm.989-.12c-.104 0-.179.09-.194.179l-.165 2.895.18 2.625c.015.104.09.179.194.179.104 0 .179-.075.194-.179l.195-2.625-.21-2.895c-.015-.089-.09-.179-.194-.179zm1.02-.135c-.119 0-.209.09-.224.209l-.15 3.015.165 2.64c.015.119.105.209.224.209.12 0 .209-.09.224-.209l.18-2.64-.195-3.015c-.015-.119-.105-.209-.224-.209zm1.005-.12c-.135 0-.239.105-.254.24l-.135 3.12.15 2.655c.015.135.12.24.255.24s.24-.105.254-.24l.166-2.655-.181-3.12c-.015-.135-.119-.24-.254-.24zm1.021-.09c-.149 0-.269.12-.284.27l-.12 3.195.135 2.67c.015.149.135.27.284.27.149 0 .269-.121.284-.27l.15-2.67-.165-3.195c-.015-.15-.135-.27-.284-.27zm1.005-.075c-.164 0-.299.135-.314.3l-.105 3.255.12 2.685c.015.165.15.3.314.3.165 0 .3-.135.315-.3l.135-2.685-.15-3.255c-.015-.165-.15-.3-.315-.3zm1.021-.06c-.18 0-.329.15-.344.33l-.09 3.3.105 2.7c.015.18.165.33.344.33.18 0 .33-.15.345-.33l.12-2.7-.135-3.3c-.015-.18-.165-.33-.345-.33zm1.02-.045c-.194 0-.359.165-.374.36l-.075 3.33.09 2.715c.015.195.18.36.374.36.195 0 .36-.165.375-.36l.105-2.715-.12-3.33c-.015-.195-.18-.36-.375-.36zm1.005-.03c-.21 0-.374.165-.389.375l-.06 3.345.075 2.73c.015.21.18.375.389.375.21 0 .375-.165.39-.375l.09-2.73-.105-3.345c-.015-.21-.18-.375-.39-.375zm2.039-.18c-.225 0-.405.18-.42.405l-.045 3.51.06 2.745c.015.225.195.405.42.405.225 0 .405-.18.42-.405l.075-2.745-.09-3.51c-.015-.225-.195-.405-.42-.405zm1.02.135c-.24 0-.42.18-.435.42l-.03 3.375.045 2.76c.015.24.195.42.435.42.24 0 .42-.18.435-.42l.06-2.76-.075-3.375c-.015-.24-.195-.42-.435-.42zm2.04-.405c-.256 0-.45.195-.465.45l-.015 3.195.03 2.775c.015.255.21.45.465.45.255 0 .45-.195.465-.45l.045-2.775-.06-3.195c-.015-.255-.21-.45-.465-.45zm1.005.165c-.27 0-.465.195-.48.465v3.03l.015 2.79c.015.27.21.465.48.465.27 0 .465-.195.48-.465l.03-2.79-.045-3.03c-.015-.27-.21-.465-.48-.465zm3.09.39c-.405 0-.75.345-.765.765v.045l-.03 2.235.045 2.79c.015.42.36.765.78.765.405 0 .75-.345.765-.765l.06-2.79-.075-2.28c-.015-.42-.36-.765-.78-.765zm-2.055-.585c-.285 0-.51.225-.525.51l-.015 3.06.03 2.805c.015.285.24.51.525.51.285 0 .51-.225.525-.51l.045-2.805-.06-3.06c-.015-.285-.24-.51-.525-.51zm-1.02.27c-.3 0-.525.225-.54.525l-.015 2.79.03 2.82c.015.3.24.525.54.525.3 0 .525-.225.54-.525l.045-2.82-.06-2.79c-.015-.3-.24-.525-.54-.525zm5.1.075c-.36 0-.66.3-.675.66l-.015 2.505.03 2.805c.015.36.315.66.675.66.36 0 .66-.3.675-.66l.045-2.805-.06-2.505c-.015-.36-.315-.66-.675-.66zm1.02-.225c-.375 0-.69.315-.705.69l-.015 2.715.03 2.82c.015.375.33.69.705.69.375 0 .69-.315.705-.69l.045-2.82-.06-2.715c-.015-.375-.33-.69-.705-.69zm1.02.45c-.39 0-.705.315-.72.705l-.015 2.265.03 2.835c.015.39.33.705.72.705.39 0 .705-.315.72-.705l.045-2.835-.06-2.265c-.015-.39-.33-.705-.72-.705zm1.02-.675c-.405 0-.735.33-.75.735l-.015 2.925.03 2.85c.015.405.345.735.75.735.405 0 .735-.33.75-.735l.045-2.85-.06-2.925c-.015-.405-.345-.735-.75-.735zm1.02.9c-.42 0-.75.33-.765.75l-.015 1.995.03 2.865c.015.42.345.75.765.75.42 0 .75-.33.765-.75l.045-2.865-.06-1.995c-.015-.42-.345-.75-.765-.75z' })
    ]),
    tiktok: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' })
    ]),
    instagram: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' })
    ]),
    facebook: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' })
    ]),
    twitter: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' })
    ]),
    discord: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' })
    ]),
    twitch: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z' })
    ]),
    linkedin: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' })
    ]),
  }

  // Find matching icon
  for (const [k, iconFn] of Object.entries(iconMap)) {
    if (k === key || key.includes(k)) {
      return iconFn()
    }
  }

  // Default globe icon
  return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 
      'stroke-linecap': 'round', 
      'stroke-linejoin': 'round', 
      'stroke-width': '2', 
      d: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' 
    })
  ])
}
</script>
