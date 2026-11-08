<template>
  <div class="band-page-bold bg-black min-h-screen">
    <!-- Immersive Hero with Parallax Effect -->
    <div class="relative w-full h-screen max-h-[85vh] overflow-hidden">
      <FaneqoArtistHeroImage
        :image="band.bandImg"
        surface="bold"
        :focal-x="band.cyberedImagePositionX ?? 50"
        :focal-y="band.cyberedImagePositionY ?? 50"
        :alt="`${band.name} image`"
        priority
      />
      
      <!-- Gradient Overlays -->
      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/25" />
      <div class="absolute inset-0 bg-gradient-to-r from-purple-900/15 via-transparent to-pink-900/15" />
      
      <!-- Floating Genre Badge -->
      <div v-if="band.genre" class="absolute top-6 left-6">
        <div class="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
          {{ band.genre }}
        </div>
      </div>

      <!-- Artist Name & Bio Overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div class="max-w-4xl">
          <h1 
            v-if="!band.isBandNameInLogo" 
            class="text-5xl md:text-7xl font-black text-white tracking-tight leading-none"
            style="text-shadow: 0 4px 30px rgba(0,0,0,0.5);"
          >
            {{ band.name }}
          </h1>
          <p 
            v-if="band.bio" 
            class="text-white/80 text-lg md:text-xl mt-4 max-w-2xl leading-relaxed"
            style="text-shadow: 0 2px 10px rgba(0,0,0,0.5);"
          >
            {{ band.bio }}
          </p>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SMART LINK LIVE SURFACE COMPONENTS -->
    <!-- ============================================ -->

    <!-- MomentBadges Overlay -->
    <div class="absolute top-8 left-6 z-30">
      <MomentBadges
        :has-show-tonight="hasUpcomingEvents"
        :is-on-tour="hasUpcomingEvents"
        :has-new-release="false"
      />
    </div>

    <!-- Show Day Header -->
    <div v-if="hasUpcomingEvents" class="max-w-4xl mx-auto px-4 mt-6">
      <ShowDayHeader
        :event="nextEvent"
        :has-pay-entry="enabledPaymentButtons.length > 0"
        @tickets="$emit('view-event', nextEvent)"
        @pay-entry="$emit('scroll-to-support')"
      />
    </div>

    <!-- NOW Banner -->
    <div class="max-w-4xl mx-auto px-4 mt-6">
      <NowBanner
        state="ON_TOUR"
        :content="nowBannerContent"
        @cta-click="handleBannerCta"
        @scroll-to="handleScrollTo"
        @share="$emit('share')"
      />
    </div>

    <!-- Continue Chip -->
    <div class="max-w-4xl mx-auto px-4 mt-6">
      <ContinueChip
        :band-slug="band.slug"
        @continue="handleContinueAction"
      />
    </div>

    <!-- Live Feed -->
    <div class="max-w-4xl mx-auto px-4 mt-6">
      <LiveFeed
        :feed-items="liveFeedItems"
        :primary-feed-item="primaryFeedItem"
        :has-feed-items="hasLiveFeedItems"
        display-mode="single"
      />
    </div>

    <!-- Quick Actions Bar -->
    <div class="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div v-if="band.bandImg?.url" class="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
            <img
              :src="band.bandImg.url"
              :alt="band.name"
              class="w-full h-full object-cover"
              :style="{ objectPosition: `${band.cyberedImagePositionX ?? 50}% ${band.cyberedImagePositionY ?? 50}%` }"
            />
          </div>
          <span class="text-white font-semibold truncate">{{ band.name }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            v-if="hasFollowablePlatforms"
            @click="$emit('follow')"
            class="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition"
          >
            Follow
          </button>
          <button 
            @click="$emit('share')"
            class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <!-- Featured Media Section -->
      <section v-if="hasFeaturedSong || hasFeaturedVideo" class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          <h2 class="text-2xl font-bold text-white">Featured</h2>
        </div>
        
        <!-- Audio Player Slot -->
        <div v-if="hasFeaturedSong" class="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
          <slot name="audio-player"></slot>
        </div>
        
        <!-- Video Player Slot -->
        <div v-if="hasFeaturedVideo" class="rounded-2xl overflow-hidden">
          <slot name="video-player"></slot>
        </div>
      </section>

      <!-- Streaming Platforms - Bento Grid -->
      <section v-if="visibleStreamingLinks.length" class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <h2 class="text-2xl font-bold text-white">Listen</h2>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <a
            v-for="(link, index) in visibleStreamingLinks"
            :key="link.name"
            :href="link.url"
            target="_blank"
            rel="noopener"
            class="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
            :class="[
              index === 0 ? 'col-span-2 md:col-span-1 bg-gradient-to-br from-[#1DB954]/20 to-[#1DB954]/5 border border-[#1DB954]/30' : 'bg-white/5 border border-white/10 hover:border-white/20'
            ]"
            @click.prevent="$emit('link-click', link)"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
                <img :src="link.icon" :alt="link.label" class="w-7 h-7" />
              </div>
              <div>
                <div class="text-white font-semibold">{{ link.label }}</div>
                <div class="text-white/50 text-sm">Stream now</div>
              </div>
            </div>
            <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        </div>
      </section>

      <!-- Social Links - Icon Row -->
      <section v-if="visibleSocialLinks.length" class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="w-1 h-8 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
          <h2 class="text-2xl font-bold text-white">Connect</h2>
        </div>
        
        <div class="flex flex-wrap gap-3">
          <a
            v-for="link in visibleSocialLinks"
            :key="link.name"
            :href="link.url"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            @click.prevent="$emit('link-click', link)"
          >
            <img :src="link.icon" :alt="link.label" class="w-5 h-5" />
            <span class="text-white font-medium">{{ link.label }}</span>
          </a>
        </div>
      </section>

      <!-- Upcoming Shows - Timeline Style -->
      <section v-if="upcomingEvents.length" class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="w-1 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
          <h2 class="text-2xl font-bold text-white">Live Shows</h2>
        </div>
        
        <div class="space-y-4">
          <!-- Featured Next Show -->
          <div 
            v-if="nextEvent"
            class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-400/20 p-6 cursor-pointer hover:border-orange-400/40 transition"
            @click="$emit('view-event', nextEvent)"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
            <div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold mb-3">
                  <span class="relative flex h-2 w-2">
                    <span class="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping"></span>
                    <span class="relative inline-flex h-2 w-2 rounded-full bg-orange-400"></span>
                  </span>
                  Next Show
                </div>
                <div class="text-2xl font-bold text-white">
                  {{ nextEvent.city || 'TBA' }}<span v-if="nextEvent.state">, {{ nextEvent.state }}</span>
                </div>
                <div class="text-white/70 mt-1">{{ nextEvent.venue || 'Venue TBA' }}</div>
                <div class="text-orange-300 font-semibold mt-2">{{ formatDate(nextEvent.date) }}</div>
              </div>
              <button class="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition">
                {{ nextEvent.ticketLink ? 'Get Tickets' : 'View Details' }}
              </button>
            </div>
          </div>

          <!-- Other Shows -->
          <div v-if="otherEvents.length" class="grid gap-3">
            <div
              v-for="event in otherEvents.slice(0, 3)"
              :key="event.id"
              class="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition"
              @click="$emit('view-event', event)"
            >
              <div class="flex items-center gap-4">
                <div class="text-center min-w-[50px]">
                  <div class="text-orange-400 text-sm font-semibold">{{ formatDateShort(event.date).month }}</div>
                  <div class="text-white text-xl font-bold">{{ formatDateShort(event.date).day }}</div>
                </div>
                <div>
                  <div class="text-white font-semibold">
                    {{ event.city || 'TBA' }}<span v-if="event.state">, {{ event.state }}</span>
                  </div>
                  <div class="text-white/60 text-sm">{{ event.venue || 'Venue TBA' }}</div>
                </div>
              </div>
              <svg class="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- Support Section - Bold CTA -->
      <section v-if="enabledPaymentButtons.length" class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="w-1 h-8 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full" />
          <h2 class="text-2xl font-bold text-white">Support</h2>
        </div>
        
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-violet-900/30 to-pink-900/40 border border-purple-400/20 p-8">
          <!-- Decorative Elements -->
          <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
          
          <div class="relative">
            <div class="text-center mb-6">
              <div class="text-3xl mb-2">💜</div>
              <h3 class="text-2xl font-bold text-white">Support {{ band.name }}</h3>
              <p class="text-white/60 mt-2">Help fuel the music. Every bit counts.</p>
            </div>
            
            <!-- Quick Tip Amounts -->
            <div class="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <button 
                v-for="amount in [5, 10, 20]"
                :key="amount"
                class="relative py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:-translate-y-1"
                :class="amount === 20 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'"
                @click="$emit('quick-tip', amount)"
              >
                ${{ amount }}
                <span v-if="amount === 20" class="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                  Popular
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Fan Capture Slot -->
      <slot name="fan-capture"></slot>

      <section class="pt-4 pb-10">
        <ArtistPageActions
          variant="bold"
          :show-follow="true"
          :followed="followed"
          :follow-busy="followBusy"
          :follow-error="followError"
          :message-label="messageLabel"
          :message-pending="messagePending"
          :message-disabled="messageDisabled"
          :saved="saved"
          @follow="$emit('follow')"
          @message="$emit('message')"
          @save="$emit('save')"
          @share="$emit('share')"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import FaneqoArtistHeroImage from '@/components/band/FaneqoArtistHeroImage.vue'

// Live Surface Components
import MomentBadges from '~/components/smartlink/MomentBadges.vue'
import ShowDayHeader from '~/components/smartlink/ShowDayHeader.vue'
import NowBanner from '~/components/smartlink/NowBanner.vue'
import ContinueChip from '~/components/smartlink/ContinueChip.vue'
import LiveFeed from '~/components/smartlink/LiveFeed.vue'

import facebookIcon from "@/assets/facebookfree.png"
import instagramIcon from "@/assets/instagramfree.png"
import twitchIcon from "@/assets/twitchfree.png"
import appleMusicIcon from "@/assets/apple.svg"
import soundcloudIcon from "@/assets/soundcloudlast.png"
import deezerIcon from "@/assets/dezzer.svg"
import youtubeIcon from "@/assets/youtube-icon.svg"
import bandcampIcon from "@/assets/bandcamp.svg"
import spotifyIcon from "@/assets/spotify.svg"
import tiktokIcon from "@/assets/tiktok.png"
import twitterIcon from "@/assets/twitter.png"

// Live Surface Data
const liveFeedItems = ref([])
const hasLiveFeedItems = computed(() => liveFeedItems.value.length > 0)
const primaryFeedItem = computed(() => liveFeedItems.value[0] || null)

const nowBannerContent = {
  icon: '',
  headline: 'On Tour',
  subtext: 'Live shows and new music',
  accent: 'purple',
  cta: 'See Dates',
  ctaAction: 'scroll-to-events'
}

// Generate initial feed items
onMounted(() => {
  const feedItems = [
    { id: 1, icon: '📍', copy: 'Fans tuning in', type: 'city', timestamp: Date.now() - 5000 },
    { id: 2, icon: '🎵', copy: 'Music playing', type: 'song_play', timestamp: Date.now() - 15000 },
    { id: 3, icon: '👤', copy: 'New follower', type: 'new_follower', timestamp: Date.now() - 30000 },
  ]
  liveFeedItems.value = feedItems
})

// Event Handlers
function handleBannerCta(action) {
  if (action.action === 'scroll-to-events') {
    // Emit event to parent to scroll to events section
    console.log('Scroll to events')
  }
}

function handleScrollTo(section) {
  if (section === 'events') {
    // Emit event to parent to scroll to events section
    console.log('Scroll to events')
  }
}

function handleContinueAction(action) {
  console.log('Continue action:', action)
}

const props = defineProps({
  band: {
    type: Object,
    required: true
  },
  upcomingEvents: {
    type: Array,
    default: () => []
  },
  hiddenLinks: {
    type: Array,
    default: () => []
  },
  enabledPaymentButtons: {
    type: Array,
    default: () => []
  },
  followablePlatforms: {
    type: Array,
    default: () => []
  },
  messageLabel: { type: String, default: 'Message' },
  messagePending: { type: Boolean, default: false },
  messageDisabled: { type: Boolean, default: false },
  saved: { type: Boolean, default: false },
  followed: { type: Boolean, default: false },
  followBusy: { type: Boolean, default: false },
  followError: { type: String, default: '' },
})

defineEmits(['play-song', 'link-click', 'view-event', 'quick-tip', 'follow', 'message', 'save', 'share'])

const streamingPlatforms = [
  { name: 'spotify', label: 'Spotify', icon: spotifyIcon },
  { name: 'appleMusic', label: 'Apple Music', icon: appleMusicIcon },
  { name: 'youtube', label: 'YouTube', icon: youtubeIcon },
  { name: 'soundcloud', label: 'SoundCloud', icon: soundcloudIcon },
  { name: 'deezer', label: 'Deezer', icon: deezerIcon },
  { name: 'bandcamp', label: 'Bandcamp', icon: bandcampIcon },
]

const socialPlatforms = [
  { name: 'instagram', label: 'Instagram', icon: instagramIcon },
  { name: 'tiktok', label: 'TikTok', icon: tiktokIcon },
  { name: 'twitter', label: 'X', icon: twitterIcon },
  { name: 'facebook', label: 'Facebook', icon: facebookIcon },
  { name: 'twitch', label: 'Twitch', icon: twitchIcon },
  { name: 'patreon', label: 'Patreon', iconify: 'simple-icons:patreon', color: '#FF424D' },
]

const isLinkHidden = (name) => props.hiddenLinks.includes(name)

const visibleStreamingLinks = computed(() => {
  return streamingPlatforms
    .filter(p => props.band[p.name] && !isLinkHidden(p.name))
    .map(p => ({ ...p, url: props.band[p.name] }))
})

const visibleSocialLinks = computed(() => {
  return socialPlatforms
    .filter(p => props.band[p.name] && !isLinkHidden(p.name))
    .map(p => ({ ...p, url: props.band[p.name] }))
})

const hasFeaturedSong = computed(() => {
  const ss = props.band.singlesong
  if (!ss) return false
  return ss.isEmbed || ss.song?.url
})

const hasFeaturedVideo = computed(() => {
  return !!props.band.singlevideo?.youtubeid
})

const nextEvent = computed(() => props.upcomingEvents[0] || null)
const otherEvents = computed(() => props.upcomingEvents.slice(1))

const hasFollowablePlatforms = computed(() => props.followablePlatforms.length > 0)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr) {
  if (!dateStr) return { month: '', day: '' }
  const d = new Date(dateStr + 'T00:00:00')
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.getDate()
  }
}
</script>
