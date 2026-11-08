<template>
 <div
  ref="rootEl"
  :class="[
    'w-full text-white',
    variant === 'phone' ? 'text-sm' : 'text-base md:text-lg',
    containerClass,
  ]"
  :style="phoneScaleStyle"
>
    <template v-if="variant === 'inline' || variant === 'phone'">
      <div class="w-full mx-auto overflow-hidden">
        <!-- Hero Section with Overlay MomentBadges -->
        <div
          :class="[
            moduleClass(0),
            'relative w-full overflow-hidden motion-reduce:transition-none motion-reduce:transform-none',
            heroHeightClass,
          ]"
          :style="moduleStyle(0)"
        >
          <img
            :src="neonPoster"
            alt="Neon Avenue image"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          
          <!-- MomentBadges - positioned at top of hero with tight padding -->
          <div 
            :class="[
              moduleClass(8), 
              'absolute motion-reduce:transition-none motion-reduce:transform-none',
              isPhone ? 'top-1.5 left-2 scale-[0.8] origin-top-left' : 'top-3 left-4 right-4'
            ]" 
            :style="moduleStyle(8)"
          >
            <MomentBadges
              :is-on-tour="true"
              :has-new-release="true"
            />
          </div>
        </div>

        <div
          :class="[
            moduleClass(1),
            'text-center text-white font-bold motion-reduce:transition-none motion-reduce:transform-none',
            bandNameClass,
            isPhone ? 'mt-2' : 'mt-4',
          ]"
          :style="moduleStyle(1)"
        >
          Neon Avenue
        </div>

        <div
          :class="[
            moduleClass(2),
            isPhone ? 'mt-2' : 'mt-4',
          ]"
          :style="moduleStyle(2)"
          class="flex justify-center motion-reduce:transition-none motion-reduce:transform-none"
        >
          <div class="text-center text-white max-w-5xl">
            <p :class="bioLineClass">
              Indie pop for night drives and neon signs.
            </p>
            <p :class="bioTaglineClass">
              New single out now — tap play below.
            </p>
          </div>
        </div>

        <div :class="['w-full', isPhone ? 'mt-1' : 'mt-4', contentWrapperClass]">
          <section
            :class="[moduleClass(3), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']"
            :style="moduleStyle(3)"
          >
            <h2 :class="h2Class">
              Featured Song
            </h2>

            <div class="w-full">
              <AudioPlayer
                :album="demoAlbum"
                :placeholder-image="neonPoster"
                @play="onAudioPlay"
                class="rounded-lg"
              />
            </div>
          </section>

          <section
            :class="[moduleClass(4), sectionMtClass, 'w-full motion-reduce:transition-none motion-reduce:transform-none']"
            :style="moduleStyle(4)"
          >
            <h2 :class="h2Class">
              Featured Video
            </h2>

            <div
              v-if="!isVideoPlaying"
              :class="videoCardClass"
            >
              <button
                type="button"
                class="block w-full text-left"
                @click="playVideo"
              >
                <div class="relative aspect-video">
                  <img
                    :src="singleVideoThumbnail"
                    alt="Neon Avenue video thumbnail"
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                  <div class="absolute inset-0 bg-black/30"></div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div
                      class="h-12 w-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15"
                    >
                      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div
              v-else
              :class="videoEmbedClass"
            >
              <iframe
                :src="singleVideoEmbedUrl + '?autoplay=1'"
                allow="autoplay; encrypted-media; fullscreen"
                allowfullscreen
              ></iframe>
            </div>
          </section>

          <section
            :class="[moduleClass(5), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']"
            :style="moduleStyle(5)"
          >
            <h2 :class="h2TightClass">
              Website Link
            </h2>
            <a
              href="#"
              :class="websiteLinkClass"
              @click.prevent
            >
              neonavenue.com
            </a>
          </section>

          <section
            :class="[moduleClass(6), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']"
            :style="moduleStyle(6)"
          >
            <h2 :class="h2Class">
              Streaming Links
            </h2>
            <template v-for="platform in streamingPlatforms" :key="platform.name">
              <a
                href="#"
                @click.prevent
              >
                <button
                  :class="platformButtonClass"
                  type="button"
                >
                  <img
                    :src="platform.img"
                    :class="platformIconClass"
                    :alt="platform.label"
                  />
                  <span class="min-w-0 truncate">{{ platform.label }}</span>
                </button>
              </a>
            </template>
          </section>

          <section
            :class="[moduleClass(7), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']"
            :style="moduleStyle(7)"
          >
            <h2 :class="h2Class">
              Social Media
            </h2>
            <template v-for="platform in socialPlatforms" :key="platform.name">
              <a
                href="#"
                @click.prevent
              >
                <button
                  :class="platformButtonClass"
                  type="button"
                >
                  <img
                    :src="platform.img"
                    :class="platformIconClass"
                    :alt="platform.label"
                  />
                  <span class="min-w-0 truncate">{{ platform.label }}</span>
                </button>
              </a>
            </template>
          </section>

          <!-- ============================================ -->
          <!-- SMART LINK LIVE SURFACE COMPONENTS -->
          <!-- Only show on inline variant, not phone (keep phone clean) -->
          <!-- ============================================ -->

          <template v-if="!isPhone">
            <!-- Show Day Header -->
            <div :class="[moduleClass(9), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']" :style="moduleStyle(9)">
              <ShowDayHeader
                :event="nextEvent"
                :has-pay-entry="true"
              />
            </div>

            <!-- NOW Banner -->
            <div :class="[moduleClass(10), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']" :style="moduleStyle(10)">
              <NowBanner
                state="ON_TOUR"
                :content="nowBannerContent"
              />
            </div>

            <!-- Continue Chip -->
            <div :class="[moduleClass(11), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']" :style="moduleStyle(11)">
              <ContinueChip
                band-slug="neon-avenue"
              />
            </div>

            <!-- Live Feed -->
            <div :class="[moduleClass(12), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']" :style="moduleStyle(12)">
              <LiveFeed
                :feed-items="liveFeedItems"
                :primary-feed-item="primaryFeedItem"
                :has-feed-items="hasLiveFeedItems"
                display-mode="single"
              />
            </div>
          </template>

          <!-- Events and Tip sections - only show on inline, not phone -->
          <template v-if="!isPhone">
            <section
              :class="[moduleClass(13), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']"
              :style="moduleStyle(13)"
            >
              <h2 :class="h2Class">
                Upcoming Events
              </h2>

              <div
                v-if="nextEvent"
                :class="eventsCardClass"
              >
                <div :class="nextShowHeaderClass">
                  <div class="min-w-0">
                    <div class="text-white/70 text-sm font-semibold">Next Show</div>
                    <div :class="nextShowTitleClass">
                      {{ nextEvent.city }}, {{ nextEvent.state }}
                    </div>
                    <div class="text-white/85 mt-1 font-semibold">
                      {{ nextEvent.venue }}
                    </div>
                    <div class="text-purple-300 mt-2 font-semibold">
                      {{ nextEvent.date }}
                    </div>
                  </div>

                  <button
                    type="button"
                    :class="ticketsButtonClass"
                  >
                    Tickets
                  </button>
                </div>

                <div class="mt-4 border-t border-white/15 pt-4">
                  <div v-if="isMobileViewport" class="space-y-3">
                    <div
                      v-for="event in otherEvents"
                      :key="event.id"
                      class="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div class="text-purple-300 font-semibold">{{ event.date }}</div>
                      <div class="text-white font-semibold mt-1">
                        {{ event.city }}, {{ event.state }}
                      </div>
                      <div class="text-white/80">{{ event.venue }}</div>
                      <button type="button" class="mt-3 w-full demo-cta">
                        View Event
                      </button>
                    </div>
                  </div>

                  <div v-else class="relative no-scrollbar overflow-x-auto">
                    <table class="w-full table-fixed bg-transparent text-white rounded-md">
                      <thead>
                        <tr class="border-b border-purple-500 border-opacity-30">
                          <th class="px-2 py-2 text-left w-[7.5rem]">Date</th>
                          <th class="px-2 py-2 text-left">City</th>
                          <th class="px-2 py-2 text-left">Venue</th>
                          <th class="px-2 py-2 text-left w-[6rem]">Tickets</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="event in otherEvents"
                          :key="event.id"
                          class="border-b border-purple-500 border-opacity-20 hover:bg-purple-900 cursor-pointer"
                          @click.prevent
                        >
                          <td class="px-2 py-1 text-purple-400">
                            {{ event.date }}
                          </td>
                          <td class="px-2 py-1 text-purple-400 break-words">
                            {{ event.city }}, {{ event.state }}
                          </td>
                          <td class="px-2 py-1 text-purple-400 break-words">
                            {{ event.venue }}
                          </td>
                          <td class="px-2 py-1 text-purple-400">
                            <button type="button" class="text-purple-400">
                              View Event
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <section
              :class="[moduleClass(9), sectionMtClass, 'motion-reduce:transition-none motion-reduce:transform-none']"
              :style="moduleStyle(9)"
            >
              <div :class="tipCardClass">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div :class="tipTitleClass">
                      Tip Neon Avenue
                    </div>
                    <div class="text-white/80 mt-1">
                      One-tap payout • secure checkout
                    </div>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-3 gap-3">
                  <button type="button" class="demo-chip">$5</button>
                  <button type="button" class="demo-chip">$10</button>
                  <button type="button" class="demo-chip">$20</button>
                </div>

                <button type="button" class="mt-4 w-full demo-cta demo-cta--accent">
                  Send Tip
                </button>
              </div>
            </section>
          </template>

        </div>
      </div>
      
      <!-- MBQ Logo Footer - Only show on phone variant -->
      <div v-if="isPhone" class="flex justify-center">
        <img 
          src="/musicbizlogo.png" 
          alt="MusicBizQR" 
          class="h-8 w-auto opacity-60"
        />
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-3">
        <img
          :src="neonPoster"
          alt="Band profile"
          class="h-14 w-14 rounded-xl object-cover ring-1 ring-white/15"
        />
        <div class="min-w-0">
          <div class="font-extrabold tracking-tight truncate">
            Neon Avenue
          </div>
          <div class="text-white/70 text-sm md:text-base">
            Los Angeles, CA · Indie Pop
          </div>
        </div>
      </div>

      <div
        :class="moduleClass(0)"
        :style="moduleStyle(0)"
        class="mt-5"
      >
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="demo-cta"
          >
            Listen
          </button>
          <button
            type="button"
            class="demo-cta"
          >
            Merch
          </button>
          <button
            type="button"
            class="demo-cta"
          >
            Tickets
          </button>
          <button
            type="button"
            class="demo-cta demo-cta--accent"
          >
            Tip the Band
          </button>
        </div>
      </div>

      <div
        :class="moduleClass(1)"
        :style="moduleStyle(1)"
        class="mt-5"
      >
        <div class="text-white/80 font-bold mb-3">Streaming</div>
        <div class="grid grid-cols-2 gap-2">
          <a
            v-for="p in streamingPlatforms"
            :key="p.name"
            href="#"
            class="demo-link"
            @click.prevent
          >
            <img :src="p.img" :alt="p.label" class="h-6 w-6" />
            <span class="font-semibold">{{ p.label }}</span>
          </a>
        </div>
      </div>

      <div
        :class="moduleClass(2)"
        :style="moduleStyle(2)"
        class="mt-5"
      >
        <div class="text-white/80 font-bold mb-3">Social</div>
        <div class="grid grid-cols-2 gap-2">
          <a
            v-for="p in socialPlatforms"
            :key="p.name"
            href="#"
            class="demo-link"
            @click.prevent
          >
            <img :src="p.img" :alt="p.label" class="h-6 w-6" />
            <span class="font-semibold">{{ p.label }}</span>
          </a>
        </div>
      </div>

      <div
        :class="moduleClass(3)"
        :style="moduleStyle(3)"
        class="mt-5"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="text-white/80 font-bold">Featured Song</div>
          <div
            v-if="isAudioPlaying"
            class="flex items-center gap-2 text-xs font-semibold text-emerald-300"
          >
            <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Playing
          </div>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 shadow-sm">
          <div :class="isPhone ? 'overflow-hidden' : ''">
            <AudioPlayer
              :album="demoAlbum"
              :placeholder-image="neonPoster"
              @play="onAudioPlay"
              class="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div
        :class="moduleClass(4)"
        :style="moduleStyle(4)"
        class="mt-5"
      >
        <div class="text-white/80 font-bold mb-3">Featured Video</div>
        <div class="rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-sm">
          <div class="relative aspect-video">
            <img
              :src="eventPoster"
              alt="Video thumbnail"
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-black/30"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="h-12 w-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
                <svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div class="p-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="font-bold truncate">Live at The Echo</div>
              <div class="text-white/70 text-sm">2:14 highlight</div>
            </div>
            <button type="button" class="demo-cta px-4">Watch</button>
          </div>
        </div>
      </div>

      <div
        :class="moduleClass(5)"
        :style="moduleStyle(5)"
        class="mt-5"
      >
        <div class="text-white/80 font-bold mb-3">Upcoming Events</div>
        <div class="space-y-3">
          <div
            v-for="ev in events"
            :key="ev.id"
            class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-bold">{{ ev.city }}</div>
                <div class="text-white/70 text-sm">{{ ev.venue }}</div>
                <div class="text-white/60 text-sm mt-1">{{ ev.date }}</div>
              </div>
              <button type="button" class="demo-cta px-4">Tickets</button>
            </div>
          </div>
        </div>
      </div>

      <div
        :class="moduleClass(6)"
        :style="moduleStyle(6)"
        class="mt-5"
      >
        <div class="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-pink-500/10 px-4 py-4 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="font-extrabold">Tip the Band</div>
              <div class="text-white/70 text-sm">Support the tour in one tap.</div>
            </div>
            <div class="text-white/80 font-semibold text-sm">Secure</div>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <button type="button" class="demo-chip">$5</button>
            <button type="button" class="demo-chip">$10</button>
            <button type="button" class="demo-chip">$20</button>
          </div>
          <button type="button" class="mt-3 w-full demo-cta demo-cta--accent">
            Send Tip
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import AudioPlayer from '@/components/AudioPlayer.vue'

// Live Surface Components
import LiveFeed from '~/components/smartlink/LiveFeed.vue'
import MomentBadges from '~/components/smartlink/MomentBadges.vue'
import ShowDayHeader from '~/components/smartlink/ShowDayHeader.vue'
import NowBanner from '~/components/smartlink/NowBanner.vue'
import ContinueChip from '~/components/smartlink/ContinueChip.vue'

import neonPoster from '@/assets/neonposter.png'
import eventPoster from '@/assets/eventposter1.png'
import aisixPoster from '@/assets/aisix.webp'

import facebookIcon from '@/assets/facebookfree.png'
import instagramIcon from '@/assets/instagramfree.png'
import twitchIcon from '@/assets/twitchfree.png'
import appleMusicIcon from '@/assets/apple.svg'
import soundcloudIcon from '@/assets/soundcloudlast.png'
import deezerIcon from '@/assets/dezzer.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'
import bandcampIcon from '@/assets/bandcamp.svg'
import spotifyIcon from '@/assets/spotify.svg'
import tiktokIcon from '@/assets/tiktok.png'
import twitterIcon from '@/assets/twitter.png'

import demoSongUrl from '@/assets/Turns Me On.mp3'

// Live Surface Data
const liveFeedItems = ref([])
const hasLiveFeedItems = computed(() => liveFeedItems.value.length > 0)
const primaryFeedItem = computed(() => liveFeedItems.value[0] || null)

const nowBannerContent = {
  icon: '',
  headline: 'On Tour',
  subtext: '3 upcoming shows across the west coast',
  accent: 'purple',
  cta: 'See Dates',
  ctaAction: 'scroll-to-events'
}

// Generate initial feed items
onMounted(() => {
  const feedItems = [
    { id: 1, icon: '📍', copy: 'Los Angeles tuning in', type: 'city', timestamp: Date.now() - 5000 },
    { id: 2, icon: '🎵', copy: 'Turns Me On played', type: 'song_play', timestamp: Date.now() - 15000 },
    { id: 3, icon: '👤', copy: 'New follower', type: 'new_follower', timestamp: Date.now() - 30000 },
  ]
  liveFeedItems.value = feedItems
})

const props = defineProps({
  variant: {
    type: String,
    default: 'inline',
  },
  containerClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['play-audio'])

const rootEl = ref(null)
const revealed = ref(false)

const isMobileViewport = ref(false)
let mobileMql = null
let onMobileMqlChange = null

const isPhone = computed(() => props.variant === 'phone')

const phoneScaleStyle = computed(() => {
  if (!isPhone.value) return {}
  return {
    transform: 'scale(0.92)',
    transformOrigin: 'top center',
  }
})

const heroHeightClass = computed(() => {
  return isPhone.value ? 'h-[165px]' : 'h-[35vh] md:h-[60vh]'
})

const bandNameClass = computed(() => {
  return isPhone.value ? 'text-3xl' : 'text-4xl'
})

const bioLineClass = computed(() => {
  return isPhone.value
    ? 'text-sm leading-tight whitespace-pre-line'
    : 'md:text-2xl leading-tight whitespace-pre-line'
})

const bioTaglineClass = computed(() => {
  return isPhone.value
    ? 'text-sm leading-tight whitespace-pre-line mt-1'
    : 'md:text-2xl leading-tight whitespace-pre-line mt-2'
})

const contentWrapperClass = computed(() => {
  return isPhone.value ? 'px-4' : 'px-6 md:max-w-[80vw] md:mx-auto'
})

const sectionMtClass = computed(() => {
  return isPhone.value ? 'mt-3' : 'mt-10'
})

const h2Class = computed(() => {
  return isPhone.value
    ? 'text-lg font-bold text-white mb-3'
    : 'text-2xl md:text-3xl font-bold text-white mb-4'
})

const h2TightClass = computed(() => {
  return isPhone.value
    ? 'text-xl font-bold text-white mb-2'
    : 'text-2xl md:text-3xl font-bold text-white mb-2'
})

const websiteLinkClass = computed(() => {
  return isPhone.value ? 'text-purple-500 text-lg' : 'text-purple-500 text-xl'
})

const platformIconClass = computed(() => {
  return isPhone.value ? 'h-7 w-7 shrink-0' : 'h-8 w-8 shrink-0'
})

const platformButtonClass = computed(() => {
  return [
    'w-full border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-4 rounded-md min-w-0',
    isPhone.value ? 'text-base mb-4' : 'text-lg md:text-xl mb-6',
    'hover:bg-white/5 active:bg-white/10 transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0',
    'motion-reduce:transition-none motion-reduce:transform-none',
  ].join(' ')
})

const videoCardClass = computed(() => {
  return [
    'rounded-lg bg-black overflow-hidden',
    'transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0',
    'motion-reduce:transition-none motion-reduce:transform-none',
  ].join(' ')
})

const videoEmbedClass = computed(() => {
  return 'embed-container rounded-lg overflow-hidden'
})

const eventsCardClass = computed(() => {
  return [
    'border border-white/70 bg-black/10 rounded-2xl',
    isPhone.value ? 'p-4' : 'p-4 md:p-5',
    'transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:border-white',
    'motion-reduce:transition-none motion-reduce:transform-none',
  ].join(' ')
})

const ticketsButtonClass = computed(() => {
  return [
    'rounded-xl border border-white bg-transparent font-semibold text-white hover:bg-white/5 active:bg-white/10',
    isPhone.value ? 'w-full' : 'w-full md:w-auto',
    isPhone.value ? 'px-3 py-2 text-sm' : 'px-4 py-3',
    'transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0',
    'motion-reduce:transition-none motion-reduce:transform-none',
  ].join(' ')
})

const nextShowHeaderClass = computed(() => {
  if (isPhone.value) return 'flex flex-col gap-3'
  return 'flex flex-col md:flex-row md:items-start md:justify-between gap-4'
})

const nextShowTitleClass = computed(() => {
  return isPhone.value ? 'text-xl font-bold text-white mt-1' : 'text-2xl md:text-3xl font-bold text-white mt-1'
})

const tipCardClass = computed(() => {
  return [
    'border border-white bg-transparent rounded-2xl',
    isPhone.value ? 'p-4' : 'p-5',
    'transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:border-white hover:bg-white/[0.03]',
    'motion-reduce:transition-none motion-reduce:transform-none',
  ].join(' ')
})

const tipTitleClass = computed(() => {
  return isPhone.value ? 'text-2xl font-bold text-white' : 'text-2xl md:text-3xl font-bold text-white'
})

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mobileMql = window.matchMedia('(max-width: 767px)')
    isMobileViewport.value = mobileMql.matches
    onMobileMqlChange = (e) => {
      isMobileViewport.value = !!e.matches
    }
    if (mobileMql.addEventListener) {
      mobileMql.addEventListener('change', onMobileMqlChange)
    } else if (mobileMql.addListener) {
      mobileMql.addListener(onMobileMqlChange)
    }
  }

  if (prefersReducedMotion()) {
    revealed.value = true
    return
  }

  const el = rootEl.value
  if (!el || typeof IntersectionObserver === 'undefined') {
    revealed.value = true
    return
  }

  const fallback = window.setTimeout(() => {
    revealed.value = true
  }, 600)

  const obs = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        revealed.value = true
        window.clearTimeout(fallback)
        obs.disconnect()
      }
    },
    { threshold: 0.01, rootMargin: '180px 0px 0px 0px' }
  )
  obs.observe(el)
})

onBeforeUnmount(() => {
  if (!mobileMql || !onMobileMqlChange) return
  if (mobileMql.removeEventListener) {
    mobileMql.removeEventListener('change', onMobileMqlChange)
  } else if (mobileMql.removeListener) {
    mobileMql.removeListener(onMobileMqlChange)
  }
})

const moduleClass = (i) => {
  if (revealed.value) {
    return 'opacity-100 translate-y-0'
  }
  return 'opacity-0 translate-y-2'
}

const moduleStyle = (i) => {
  if (prefersReducedMotion()) return {}
  return {
    transitionDelay: `${Math.min(i, 10) * 35}ms`,
  }
}

const isAudioPlaying = ref(false)
let audioIdleTimeout = null

const isVideoPlaying = ref(false)
const demoVideoId = 'cUR4LFl_UME'

const singleVideoEmbedUrl = computed(() => {
  return `https://www.youtube.com/embed/${demoVideoId}`
})

const singleVideoThumbnail = computed(() => {
  return aisixPoster
})

function playVideo() {
  isVideoPlaying.value = true
}

function onAudioPlay() {
  isAudioPlaying.value = true
  emit('play-audio')
  if (audioIdleTimeout) window.clearTimeout(audioIdleTimeout)
  audioIdleTimeout = window.setTimeout(() => {
    isAudioPlaying.value = false
  }, 2000)
}

const demoAlbum = computed(() => {
  return {
    id: 1,
    attributes: {
      title: 'Turns Me On',
      artist: 'Neon Avenue',
      duration: 0,
      song: { data: { attributes: { url: demoSongUrl } } },
      cover: { data: { attributes: { url: neonPoster } } },
    },
  }
})

const streamingPlatforms = [
  { name: 'spotify', img: spotifyIcon, label: 'Spotify' },
  { name: 'appleMusic', img: appleMusicIcon, label: 'Apple Music' },
  { name: 'youtube', img: youtubeIcon, label: 'YouTube' },
  { name: 'soundcloud', img: soundcloudIcon, label: 'SoundCloud' },
  { name: 'bandcamp', img: bandcampIcon, label: 'Bandcamp' },
  { name: 'deezer', img: deezerIcon, label: 'Deezer' },
]

const socialPlatforms = [
  { name: 'instagram', img: instagramIcon, label: 'Instagram' },
  { name: 'tiktok', img: tiktokIcon, label: 'TikTok' },
  { name: 'twitter', img: twitterIcon, label: 'Twitter' },
  { name: 'facebook', img: facebookIcon, label: 'Facebook' },
  { name: 'twitch', img: twitchIcon, label: 'Twitch' },
]

const events = [
  { id: 1, date: 'Fri · Feb 21', venue: 'The Echo', city: 'Los Angeles', state: 'CA' },
  { id: 2, date: 'Sat · Mar 08', venue: 'Brick & Mortar', city: 'San Francisco', state: 'CA' },
  { id: 3, date: 'Thu · Apr 10', venue: 'Mohawk', city: 'Austin', state: 'TX' },
]

const nextEvent = computed(() => {
  return events.length ? events[0] : null
})

const otherEvents = computed(() => {
  return events.length > 1 ? events.slice(1) : []
})
</script>

<style scoped>
.embed-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
}

.embed-container iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.demo-cta {
  @apply rounded-xl border border-white/15 bg-white/5 px-3 py-3 font-semibold shadow-sm transition duration-200 ease-out hover:bg-white/10 active:scale-[0.98];
}

.demo-cta--accent {
  @apply border-violet-400/30 bg-gradient-to-r from-pink-500/80 to-violet-600/80 hover:from-pink-500 hover:to-violet-600;
}

.demo-link {
  @apply flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 shadow-sm transition duration-200 ease-out hover:bg-white/10 active:scale-[0.99];
}

.demo-chip {
  @apply rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm font-bold transition duration-200 ease-out hover:bg-white/10 active:scale-[0.98];
}

.opacity-0 {
  transition-property: opacity, transform;
  transition-duration: 220ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

.opacity-100 {
  transition-property: opacity, transform;
  transition-duration: 220ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
