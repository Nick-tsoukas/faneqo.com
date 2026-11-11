<template>
  <div class="band-page-compact bg-black min-h-screen">
    <!-- Hero Section - Compact -->
    <div class="relative w-full aspect-[16/12] max-h-[60vh]">
      <FaneqoArtistHeroImage
        :image="band.bandImg"
        surface="compact"
        :focal-x="band.cyberedImagePositionX ?? 50"
        :focal-y="band.cyberedImagePositionY ?? 50"
        :alt="`${band.name} image`"
        priority
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
      
      <!-- Top Badges Row - Live Shows + Moment Badges on same line -->
      <div class="absolute top-4 left-4 right-4 flex items-center gap-2 z-30 flex-nowrap overflow-x-auto">
        <!-- Live Badge (if has upcoming events) - compact style -->
        <div v-if="hasUpcomingEvents" class="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white shrink-0">
          <span class="relative flex h-1.5 w-1.5">
            <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          </span>
          Live
        </div>
        
        <!-- MomentBadges -->
        <MomentBadges
          :has-show-tonight="hasUpcomingEvents"
          :is-on-tour="hasUpcomingEvents"
          :has-new-release="false"
          class="flex-nowrap"
        />
      </div>

      <!-- Artist Info Overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-5">
        <h1 v-if="!band.isBandNameInLogo" class="text-3xl md:text-4xl font-bold text-white tracking-tight">
          {{ band.name }}
        </h1>
        <p v-if="band.bio" class="text-white/80 text-sm md:text-base mt-2 line-clamp-2">
          {{ band.bio }}
        </p>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SMART LINK LIVE SURFACE COMPONENTS -->
    <!-- ============================================ -->

    <!-- Show Day Header -->
    <div v-if="hasUpcomingEvents" class="w-full px-4 md:px-6 mt-4 max-w-2xl mx-auto">
      <ShowDayHeader
        :event="nextEvent"
        :has-pay-entry="enabledPaymentButtons.length > 0"
        @tickets="$emit('view-event', nextEvent)"
        @pay-entry="$emit('scroll-to-support')"
      />
    </div>

    <!-- NOW Banner -->
    <div class="w-full px-4 md:px-6 mt-4 max-w-2xl mx-auto">
      <NowBanner
        state="ON_TOUR"
        :content="nowBannerContent"
        @cta-click="handleBannerCta"
        @scroll-to="handleScrollTo"
        @share="$emit('share')"
      />
    </div>

    <!-- Continue Chip -->
    <div class="w-full px-4 md:px-6 mt-4 max-w-2xl mx-auto">
      <ContinueChip
        :band-slug="band.slug"
        @continue="handleContinueAction"
      />
    </div>

    <!-- Live Feed -->
    <div class="w-full px-4 md:px-6 mt-4 max-w-2xl mx-auto">
      <LiveFeed
        :feed-items="liveFeedItems"
        :primary-feed-item="primaryFeedItem"
        :has-feed-items="hasLiveFeedItems"
        display-mode="single"
      />
    </div>

    <!-- Content -->
    <div class="px-4 md:px-6 py-6 max-w-2xl mx-auto space-y-6">
      <!-- Featured Song -->
      <section v-if="hasFeaturedSong" class="space-y-2">
        <h3 class="text-white/50 text-xs font-semibold uppercase tracking-wider">Featured Song</h3>
        <slot name="audio-player">
          <!-- Elite Spotify Widget (new oEmbed flow) -->
          <div v-if="isEliteSpotifyEmbed">
            <EliteSpotifyEmbedWidget
              :spotify-url="band.singlesong.spotifyUrl"
              :title="band.singlesong.spotifyOembedTitle || band.singlesong.title"
              :thumbnail-url="band.singlesong.spotifyOembedThumbnailUrl"
              :type="band.singlesong.spotifyOembedType || 'track'"
              :iframe-html="band.singlesong.spotifyOembedHtml"
              :artist-name="band.name"
              @spotify-click="(e) => $emit('link-click', { name: 'spotify_embed_click', url: e.url })"
              @spotify-play="$emit('media-play', { type: 'song', title: 'Spotify Embed Play' })"
            />
          </div>
          <!-- Default: Simple audio player if no slot content provided -->
          <div v-else-if="!isEmbedSong && band.singlesong?.song?.url" class="bg-white/5 border border-white/10 rounded-xl p-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white font-medium truncate">{{ songTitle }}</div>
                <div class="text-white/50 text-sm">{{ band.name }}</div>
              </div>
              <button class="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center hover:bg-purple-400 transition">
                <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
          <!-- Legacy Embed song -->
          <div v-else-if="isEmbedSong && safeEmbedHtml" class="rounded-xl overflow-hidden" v-html="safeEmbedHtml"></div>
        </slot>
      </section>

      <!-- Featured Video -->
      <section v-if="hasFeaturedVideo" class="space-y-2">
        <h3 class="text-white/50 text-xs font-semibold uppercase tracking-wider">Featured Video</h3>
        <slot name="video-player">
          <!-- Default: YouTube embed if no slot content provided -->
          <div class="aspect-video rounded-xl overflow-hidden bg-black/50">
            <iframe
              :src="`https://www.youtube.com/embed/${band.singlevideo.youtubeid}`"
              class="w-full h-full"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </slot>
      </section>

      <div v-if="publicFeaturedGallery" class="w-full px-4 md:px-6 mt-4 max-w-2xl mx-auto">
        <ArtistFeaturedGallery
          :gallery="publicFeaturedGallery"
          :artist-name="band?.name || ''"
          :artist-slug="band?.slug || ''"
          :artist-image="band?.bandImg?.url || ''"
        />
      </div>

      <!-- Streaming Links - Grid -->
      <div v-if="visibleStreamingLinks.length">
        <h3 class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Listen Now</h3>
        <div class="grid grid-cols-2 gap-2">
          <a
            v-for="link in visibleStreamingLinks.slice(0, 4)"
            :key="link.name"
            :href="link.url"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 px-4 py-3 rounded-xl border transition group"
            :class="link.colorClass"
            @click.prevent="$emit('link-click', link)"
          >
            <img :src="link.icon" :alt="link.label" class="w-6 h-6" />
            <span class="text-white text-sm font-medium">{{ link.label }}</span>
          </a>
        </div>
      </div>

      <!-- Social Links - Horizontal -->
      <div v-if="visibleSocialLinks.length">
        <h3 class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Follow</h3>
        <div class="flex gap-2">
          <a
            v-for="link in visibleSocialLinks.slice(0, 4)"
            :key="link.name"
            :href="link.url"
            target="_blank"
            rel="noopener"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition"
            @click.prevent="$emit('link-click', link)"
          >
            <img :src="link.icon" :alt="link.label" class="w-5 h-5" />
            <span class="text-white text-sm">{{ link.label }}</span>
          </a>
        </div>
      </div>

      <!-- Next Show - Compact Card -->
      <div v-if="nextEvent" class="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-400/20 rounded-xl p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-purple-300 text-xs font-semibold uppercase tracking-wider">Next Show</div>
            <div class="text-white font-bold text-lg mt-1">
              {{ nextEvent.city || 'TBA' }}<span v-if="nextEvent.state">, {{ nextEvent.state }}</span>
            </div>
            <div class="text-white/70 text-sm">{{ nextEvent.venue || 'Venue TBA' }} • {{ formatDate(nextEvent.date) }}</div>
          </div>
          <button 
            class="px-4 py-2 bg-purple-500/20 border border-purple-400/40 rounded-lg text-purple-200 text-sm font-semibold hover:bg-purple-500/30 transition"
            @click="$emit('view-event', nextEvent)"
          >
            {{ nextEvent.ticketLink ? 'Tickets' : 'Details' }}
          </button>
        </div>
      </div>

      <!-- Payment Buttons - Compact -->
      <div v-if="enabledPaymentButtons.length" class="bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-violet-900/30 border border-purple-400/20 rounded-2xl p-5 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/10 to-violet-500/5 pointer-events-none" />
        
        <div class="relative">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-white font-bold text-lg flex items-center gap-2">
                <span class="text-xl">💜</span>
                Support {{ band.name }}
              </div>
              <div class="text-white/50 text-sm mt-0.5">One-tap secure checkout</div>
            </div>
          </div>
          
          <!-- Quick Tip Buttons -->
          <div class="grid grid-cols-3 gap-3">
            <button 
              v-for="amount in [5, 10, 20]"
              :key="amount"
              class="group relative px-4 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:-translate-y-0.5"
              :class="amount === 20 
                ? 'bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 border border-pink-400/30 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 font-bold' 
                : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10'"
              @click="$emit('quick-tip', amount)"
            >
              <span class="text-lg">${{ amount }}</span>
              <span v-if="amount === 20" class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full uppercase tracking-wide">Popular</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Fan Capture Slot -->
      <slot name="fan-capture"></slot>

      <div class="mt-6">
        <ArtistPageActions
          variant="compact"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, onMounted } from 'vue'
import { resolvePublicFeaturedGallery } from '@/utils/galleries/publicFeaturedGallery'
import AudioPlayer from "@/components/AudioPlayer.vue"

// Live Surface Components
import MomentBadges from '~/components/smartlink/MomentBadges.vue'
import ShowDayHeader from '~/components/smartlink/ShowDayHeader.vue'
import NowBanner from '~/components/smartlink/NowBanner.vue'
import ContinueChip from '~/components/smartlink/ContinueChip.vue'
import LiveFeed from '~/components/smartlink/LiveFeed.vue'
import EliteSpotifyEmbedWidget from '@/components/smartlink/EliteSpotifyEmbedWidget.vue'
import FaneqoArtistHeroImage from '@/components/band/FaneqoArtistHeroImage.vue'

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

defineEmits(['play-song', 'link-click', 'media-play', 'view-event', 'quick-tip', 'follow', 'message', 'save', 'share'])

const streamingPlatforms = [
  { name: 'spotify', label: 'Spotify', icon: spotifyIcon, colorClass: 'bg-[#1DB954]/10 border-[#1DB954]/30 hover:bg-[#1DB954]/20' },
  { name: 'appleMusic', label: 'Apple', icon: appleMusicIcon, colorClass: 'bg-white/5 border-white/10 hover:bg-white/10' },
  { name: 'youtube', label: 'YouTube', icon: youtubeIcon, colorClass: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' },
  { name: 'soundcloud', label: 'SoundCloud', icon: soundcloudIcon, colorClass: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' },
  { name: 'deezer', label: 'Deezer', icon: deezerIcon, colorClass: 'bg-white/5 border-white/10 hover:bg-white/10' },
  { name: 'bandcamp', label: 'Bandcamp', icon: bandcampIcon, colorClass: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20' },
]

const socialPlatforms = [
  { name: 'instagram', label: 'Instagram', icon: instagramIcon },
  { name: 'tiktok', label: 'TikTok', icon: tiktokIcon },
  { name: 'twitter', label: 'X', icon: twitterIcon },
  { name: 'facebook', label: 'Facebook', icon: facebookIcon },
  { name: 'twitch', label: 'Twitch', icon: twitchIcon },
  { name: 'threads', iconify: 'simple-icons:threads', label: 'Threads', color: '#FFFFFF' },
  { name: 'discord', iconify: 'simple-icons:discord', label: 'Discord', color: '#5865F2' },
  { name: 'telegram', iconify: 'simple-icons:telegram', label: 'Telegram', color: '#26A5E4' },
  { name: 'reddit', iconify: 'simple-icons:reddit', label: 'Reddit', color: '#FF4500' },
  { name: 'pinterest', iconify: 'simple-icons:pinterest', label: 'Pinterest', color: '#E60023' },
  { name: 'linkedin', iconify: 'simple-icons:linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { name: 'whatsapp', iconify: 'simple-icons:whatsapp', label: 'WhatsApp', color: '#25D366' },
  { name: 'snapchat', iconify: 'simple-icons:snapchat', label: 'Snapchat', color: '#FFFC00' },
  { name: 'patreon', iconify: 'simple-icons:patreon', label: 'Patreon', color: '#FF424D' },
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

const isEmbedSong = computed(() => {
  return props.band.singlesong?.isEmbed === true
})

// Check if this is an Elite Spotify embed (new oEmbed flow with metadata)
const isEliteSpotifyEmbed = computed(() => {
  const s = props.band.singlesong
  if (!s) return false
  return s.isEmbed && s.platform === 'spotify' && s.spotifyUrl && s.spotifyOembedHtml
})

const safeEmbedHtml = computed(() => {
  const html = props.band.singlesong?.embedHtml || ''
  if (!html) return ''
  // Basic sanitization - only allow iframe tags
  const iframeMatch = html.match(/<iframe[\s\S]*?<\/iframe>/i)
  return iframeMatch ? iframeMatch[0] : ''
})

const formattedSong = computed(() => {
  const single = props.band.singlesong
  if (!single) return null
  
  const nestedUrl = single?.song?.data?.attributes?.url
  const directUrl = single?.song?.url
  const fileUrl = nestedUrl || directUrl || null
  
  if (!fileUrl) return null
  
  return {
    id: single?.id,
    attributes: {
      title: single?.title || 'Featured Track',
      songs: {
        data: [
          {
            id: 1,
            attributes: {
              title: single?.title || 'Featured Track',
              audioFile: { data: { attributes: { url: fileUrl } } },
            },
          },
        ],
      },
      coverImage: {
        data: props.band.bandImg ? { attributes: { url: props.band.bandImg.url } } : null,
      },
    },
  }
})

const songTitle = computed(() => {
  return props.band.singlesong?.title || 'Featured Track'
})

const hasFeaturedVideo = computed(() => {
  return !!props.band.singlevideo?.youtubeid
})

const hasUpcomingEvents = computed(() => props.upcomingEvents.length > 0)
const nextEvent = computed(() => props.upcomingEvents[0] || null)

const hasFollowablePlatforms = computed(() => props.followablePlatforms.length > 0)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ArtistFeaturedGallery = defineAsyncComponent(() => import('@/components/band/ArtistFeaturedGallery.vue'))
const publicFeaturedGallery = computed(() => resolvePublicFeaturedGallery(props.band?.featuredGallery))
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
