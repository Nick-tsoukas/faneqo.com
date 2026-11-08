<template>
  <div class="publication-cybered bg-black min-h-screen">
    <div class="mx-auto max-w-3xl px-3 sm:px-4 pt-3 sm:pt-4 pb-10">
      <div class="space-y-6" :style="accentStyle">
        <!-- Publication identity -->
        <PublicationProfileHeader :band="band" :accent-color="accentColor" />

        <!-- Primary website button -->
        <section v-if="band.websitelink">
          <a
            :href="band.websitelink"
            target="_blank"
            rel="noopener noreferrer"
            class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            @click="$emit('link-click', { name: 'website', url: band.websitelink, label: band.websitelinktext || 'Website' })"
          >
            <div class="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0" aria-hidden="true">
              <svg class="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300 truncate">
                {{ displayWebsiteLabel(band.websitelink, band.websitelinktext) }}
              </div>
              <div class="text-white/50 text-sm mt-0.5">Official website</div>
            </div>
            <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-1 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </section>

        <!-- Editorial Showcase (centerpiece) -->
        <EditorialShowcase
          :band="band"
          :accent-color="accentColor"
          class="publication-editorial"
          @link-click="$emit('link-click', $event)"
        />

        <!-- Optional featured audio -->
        <section v-if="hasFeaturedSong">
          <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Featured Audio</h3>
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
          <div v-else-if="isEmbedSong && embedHtml" class="rounded-xl overflow-hidden border border-white/10">
            <div class="w-full" v-html="embedHtml" />
          </div>
        </section>

        <!-- Optional featured video -->
        <section v-if="hasVideo">
          <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Featured Video</h3>
          <div
            v-if="!isVideoPlaying"
            class="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
            @click="playVideo"
          >
            <img
              v-if="videoThumbnail"
              :src="videoThumbnail"
              :alt="videoTitle"
              class="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          </div>
          <div v-else class="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
            <iframe :src="videoEmbedUrl" class="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; fullscreen" allowfullscreen />
          </div>
        </section>

        <!-- Streaming / video destination buttons -->
        <section v-if="hasStreamingLinks">
          <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Streaming</h3>
          <div class="space-y-3">
            <template v-for="platform in streamingPlatforms" :key="platform.name">
              <a
                v-if="band[platform.name] && !isLinkHidden(platform.name)"
                :href="band[platform.name]"
                @click.prevent="$emit('link-click', { name: platform.name, url: band[platform.name] })"
                class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center shrink-0">
                  <PlatformIcon :existing-icon="platform.img" :iconify="platform.iconify" :color="platform.color" :alt="platform.label" class-name="w-5 h-5" />
                </div>
                <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">{{ platform.label }}</span>
                <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-1 ml-auto shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </template>
          </div>
        </section>

        <!-- Full-width social platform buttons -->
        <section v-if="hasSocialLinks">
          <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Social</h3>
          <div class="space-y-3">
            <template v-for="platform in socialPlatforms" :key="platform.name">
              <a
                v-if="band[platform.name] && !isLinkHidden(platform.name)"
                :href="band[platform.name]"
                @click.prevent="$emit('link-click', { name: platform.name, url: band[platform.name] })"
                class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center shrink-0">
                  <PlatformIcon :existing-icon="platform.img" :iconify="platform.iconify" :color="platform.color" :alt="platform.label" class-name="w-5 h-5" />
                </div>
                <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">{{ platform.label }}</span>
                <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-1 ml-auto shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </template>
          </div>
        </section>

        <!-- Event hub buttons -->
        <section v-if="hasEventHubLinks">
          <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Event Hubs</h3>
          <div class="space-y-3">
            <template v-for="platform in eventHubPlatforms" :key="platform.name">
              <a
                v-if="band[platform.name] && !isLinkHidden(platform.name)"
                :href="band[platform.name]"
                @click.prevent="$emit('link-click', { name: platform.name, url: band[platform.name] })"
                class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center shrink-0">
                  <PlatformIcon :existing-icon="platform.img" :iconify="platform.iconify" :color="platform.color" :alt="platform.label" class-name="w-5 h-5" />
                </div>
                <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">{{ platform.label }}</span>
                <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-1 ml-auto shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </template>
          </div>
        </section>

        <!-- Custom publication links -->
        <section v-if="customLinks.length > 0">
          <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">{{ customLinksHeading }}</h3>
          <div class="space-y-3">
            <a
              v-for="link in customLinks"
              :key="link.id || link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @click="$emit('link-click', { name: 'custom', url: link.url, label: link.title })"
            >
              <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center shrink-0 overflow-hidden">
                <PlatformIcon :existing-icon="link.iconUrl" :alt="link.title" class-name="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300 truncate">{{ link.title }}</div>
                <div v-if="link.subtitle" class="text-white/50 text-sm mt-0.5 truncate">{{ link.subtitle }}</div>
              </div>
              <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-1 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </section>

        <!-- Official store (after custom links, before subscription) -->
        <section v-if="officialMerchHref">
          <a
            :href="officialMerchHref"
            target="_blank"
            rel="noopener noreferrer"
            class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            @click="$emit('link-click', { name: 'official_merch_store', url: officialMerchHref })"
          >
            <div class="w-8 h-8 rounded-lg bg-fuchsia-400/10 border border-fuchsia-400/20 flex items-center justify-center shrink-0" aria-hidden="true">
              <PlatformIcon iconify="lucide:shopping-bag" alt="" class-name="w-5 h-5" color="#f0abfc" />
            </div>
            <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">Official Store</span>
            <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-1 ml-auto shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </section>

        <!-- Upcoming events -->
        <section v-if="hasUpcomingEvents">
          <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Upcoming Shows</h3>
          <div class="space-y-3">
            <div
              v-for="event in upcomingEvents.slice(0, 3)"
              :key="event.id"
              class="cybered-event-card group flex items-center justify-between px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10"
            >
              <div class="min-w-0 flex-1">
                <div class="text-white font-semibold text-base truncate">{{ event.city }}<span v-if="event.state">, {{ event.state }}</span></div>
                <div class="text-white/50 text-sm mt-1 truncate">{{ event.venue }}</div>
              </div>
              <button
                type="button"
                class="shrink-0 ml-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 border border-purple-400/30 rounded-xl text-white text-sm font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
                @click="$emit('view-event', event)"
              >
                Details
              </button>
            </div>
          </div>
        </section>

        <!-- Publication subscription -->
        <div>
          <slot name="fan-capture" />
        </div>

        <!-- Support / tips -->
        <section v-if="enabledPaymentButtons.length > 0">
          <SupportModule
            :band-name="band.name"
            :show-quick-tips="true"
            :quick-tip-amounts="[5, 10, 20]"
            page-mode="QUIET"
            :payment-buttons="enabledPaymentButtons"
            @quick-tip="$emit('quick-tip', $event)"
            @checkout="$emit('checkout', $event)"
          />
        </section>

        <ArtistPageActions
          variant="cybered"
          :show-follow="true"
          :message-label="messageLabel"
          :message-pending="messagePending"
          :message-disabled="messageDisabled"
          :saved="saved"
          @follow="$emit('follow')"
          @message="$emit('message')"
          @save="$emit('save')"
          @share="$emit('share')"
        />

        <!-- Subtle attribution -->
        <p class="text-center text-[10px] uppercase tracking-widest text-white/25 pt-1">
          Powered by Faneqo
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import PlatformIcon from '@/components/ui/PlatformIcon.vue';
import EditorialShowcase from '@/components/editorial/EditorialShowcase.vue';
import SupportModule from '@/components/smartlink/SupportModule.vue';
import EliteSpotifyEmbedWidget from '@/components/smartlink/EliteSpotifyEmbedWidget.vue';
import { getPublicationFeaturedHeading } from '@/utils/publicationProfile';
import { displayWebsiteLabel } from '@/utils/displayWebsiteLabel';

// Streaming icons (existing platforms only - new ones use iconify)
import youtubeIcon from '@/assets/youtube-icon.svg';
import spotifyIcon from '@/assets/spotify.svg';
import appleMusicIcon from '@/assets/apple.svg';
import soundcloudIcon from '@/assets/soundcloudlast.png';
import bandcampIcon from '@/assets/bandcamp.svg';
import deezerIcon from '@/assets/dezzer.svg';
import twitchIcon from '@/assets/twitchfree.png';
import reverbnationIcon from '@/assets/reverbnation.png';

// Social icons (existing platforms only - new ones use iconify)
import facebookIcon from '@/assets/facebookfree.png';
import instagramIcon from '@/assets/instagramfree.png';
import twitterIcon from '@/assets/twitter.png';
import tiktokIcon from '@/assets/tiktok.png';

const props = defineProps({
  band: { type: Object, required: true },
  upcomingEvents: { type: Array, default: () => [] },
  hiddenLinks: { type: Array, default: () => [] },
  enabledPaymentButtons: { type: Array, default: () => [] },
  customButtons: { type: Array, default: () => [] },
  accentColor: { type: String, default: '#34d399' },
  messageLabel: { type: String, default: 'Message' },
  messagePending: { type: Boolean, default: false },
  messageDisabled: { type: Boolean, default: false },
  saved: { type: Boolean, default: false },
});

defineEmits([
  'play-song', 'play-video', 'link-click', 'media-play', 'view-event',
  'quick-tip', 'checkout', 'follow', 'message', 'save', 'share',
]);

// Canonical Cybered platform lists (kept in sync with BandPageCybered)
const streamingPlatforms = [
  { name: 'youtube', img: youtubeIcon, label: 'YouTube' },
  { name: 'youtubeMusic', img: youtubeIcon, label: 'YouTube Music' },
  { name: 'spotify', img: spotifyIcon, label: 'Spotify' },
  { name: 'appleMusic', img: appleMusicIcon, label: 'Apple Music' },
  { name: 'soundcloud', img: soundcloudIcon, label: 'SoundCloud' },
  { name: 'bandcamp', img: bandcampIcon, label: 'Bandcamp' },
  { name: 'deezer', img: deezerIcon, label: 'Deezer' },
  { name: 'twitch', img: twitchIcon, label: 'Twitch' },
  { name: 'reverbnation', img: reverbnationIcon, label: 'Reverbnation' },
  { name: 'amazonMusic', iconify: 'simple-icons:amazonmusic', label: 'Amazon Music', color: '#00A8E1' },
  { name: 'tidal', iconify: 'simple-icons:tidal', label: 'TIDAL', color: '#00FFFF' },
  { name: 'pandora', iconify: 'simple-icons:pandora', label: 'Pandora', color: '#3668FF' },
];

const socialPlatforms = [
  { name: 'facebook', img: facebookIcon, label: 'Facebook' },
  { name: 'instagram', img: instagramIcon, label: 'Instagram' },
  { name: 'twitter', img: twitterIcon, label: 'Twitter' },
  { name: 'tiktok', img: tiktokIcon, label: 'TikTok' },
  { name: 'threads', iconify: 'simple-icons:threads', label: 'Threads', color: '#FFFFFF' },
  { name: 'discord', iconify: 'simple-icons:discord', label: 'Discord', color: '#5865F2' },
  { name: 'telegram', iconify: 'simple-icons:telegram', label: 'Telegram', color: '#26A5E4' },
  { name: 'reddit', iconify: 'simple-icons:reddit', label: 'Reddit', color: '#FF4500' },
  { name: 'pinterest', iconify: 'simple-icons:pinterest', label: 'Pinterest', color: '#E60023' },
  { name: 'linkedin', iconify: 'simple-icons:linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { name: 'whatsapp', iconify: 'simple-icons:whatsapp', label: 'WhatsApp', color: '#25D366' },
  { name: 'snapchat', iconify: 'simple-icons:snapchat', label: 'Snapchat', color: '#FFFC00' },
];

const eventHubPlatforms = [
  { name: 'bandsintown', iconify: 'simple-icons:bandsintown', label: 'Bandsintown', color: '#00CEC8' },
  { name: 'songkick', iconify: 'simple-icons:songkick', label: 'Songkick', color: '#F80046' },
  { name: 'jambase', iconify: 'mdi:music-note', label: 'JamBase', color: '#FF6B00' },
  { name: 'relix', iconify: 'mdi:microphone-variant', label: 'Relix', color: '#E31837' },
];

function isLinkHidden(name) {
  return (props.hiddenLinks || []).includes(name);
}

const hasStreamingLinks = computed(() =>
  streamingPlatforms.some((p) => !!props.band[p.name] && !isLinkHidden(p.name))
);
const hasSocialLinks = computed(() =>
  socialPlatforms.some((p) => !!props.band[p.name] && !isLinkHidden(p.name))
);
const hasEventHubLinks = computed(() =>
  eventHubPlatforms.some((p) => !!props.band[p.name] && !isLinkHidden(p.name))
);

const customLinks = computed(() => {
  const list = Array.isArray(props.customButtons) ? props.customButtons : [];
  return list
    .filter((b) => b?.url && /^https?:\/\//i.test(String(b.url).trim()))
    .map((b) => ({
      id: b.id,
      title: String(b.title || '').trim() || 'Learn more',
      subtitle: String(b.subtitle || '').trim(),
      url: String(b.url).trim(),
      iconUrl: b.customIcon?.url || b.customIcon?.data?.attributes?.url || null,
    }));
});

const customLinksHeading = computed(() => getPublicationFeaturedHeading(props.band));

const accentStyle = computed(() => ({ '--pub-accent': props.accentColor }));

const isVideoPlaying = ref(false);

const hasUpcomingEvents = computed(() => props.upcomingEvents.length > 0);

const hasFeaturedSong = computed(() => {
  const s = props.band.singlesong;
  if (!s) return false;
  if (s.isEmbed && s.platform === 'spotify' && s.spotifyUrl && s.spotifyOembedHtml) return true;
  if (s.isEmbed) return !!String(s.embedHtml || '').trim();
  return false;
});

const isEliteSpotifyEmbed = computed(() => {
  const s = props.band.singlesong;
  return s?.isEmbed && s.platform === 'spotify' && s.spotifyUrl && s.spotifyOembedHtml;
});

const isEmbedSong = computed(() => !!props.band.singlesong?.isEmbed);
const embedHtml = computed(() => props.band.singlesong?.embedHtml || null);
const hasVideo = computed(() => !!props.band.singlevideo?.youtubeid);
const videoTitle = computed(() => props.band.singlevideo?.title || 'Featured Video');
const videoThumbnail = computed(() => {
  const id = props.band.singlevideo?.youtubeid;
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : props.band.bandImg?.url || null;
});
const videoEmbedUrl = computed(() => {
  const id = props.band.singlevideo?.youtubeid;
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
});

const officialMerchHref = computed(() => {
  const raw = props.band?.officialMerchUrl;
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
});

function playVideo() {
  isVideoPlaying.value = true;
}
</script>

<style scoped>
.publication-editorial :deep(.editorial-showcase h2) {
  letter-spacing: -0.01em;
}
</style>
