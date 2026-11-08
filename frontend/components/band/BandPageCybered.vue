<template>
  <PublicationCyberedLayout
    v-if="isPublicationMode"
    :band="band"
    :upcoming-events="upcomingEvents"
    :hidden-links="hiddenLinks"
    :enabled-payment-buttons="enabledPaymentButtons"
    :custom-buttons="customButtons"
    :accent-color="publicationAccent"
    @play-song="$emit('play-song', $event)"
    @play-video="$emit('play-video', $event)"
    @link-click="$emit('link-click', $event)"
    @media-play="$emit('media-play', $event)"
    @view-event="$emit('view-event', $event)"
    @quick-tip="$emit('quick-tip', $event)"
    @checkout="$emit('checkout', $event)"
    @follow="$emit('follow')"
    @message="$emit('message')"
    @save="$emit('save')"
    @share="$emit('share')"
    :message-label="messageLabel"
    :message-pending="messagePending"
    :message-disabled="messageDisabled"
    :saved="saved"
  >
    <template #fan-capture>
      <slot name="fan-capture" />
    </template>
  </PublicationCyberedLayout>

  <div
    v-else
    class="band-page-cybered bg-black min-h-screen"
    :class="{ 'is-motion-settled': motionSettled, 'is-deck-fold': deckFold }"
    :data-profile-variant="visualVariant !== 'default' ? visualVariant : undefined"
    :data-hero-mobile-fit="phoneHeroFraming.fit"
    :data-hero-desktop-fit="desktopHeroFraming.fit"
    :data-hx-mode="heroExperimentMode !== 'original' ? heroExperimentMode : undefined"
    :data-hx-presentation="heroExperimentPresentation"
    :data-hx-fit="heroExperimentFit"
    :data-hx-intro="heroExperimentIntroKind"
  >
    <!-- Cybered Hero Section - Cinematic & Immersive -->
    <div class="cybered-stage relative mx-auto px-3 sm:px-4">
      <div
        ref="heroShellRef"
        class="cybered-hero cybered-hero-shell relative w-full rounded-2xl overflow-hidden mt-3 sm:mt-4"
        :class="`cybered-hero--${heroGeometry.band}`"
        :style="heroShellStyle"
      >
        <!-- Motion layer: visual settle only. Never owns height. -->
        <Motion
          v-if="band.bandImg?.url"
          class="cybered-hero-motion"
          v-bind="heroImageMotion"
        >
          <img
            :src="band.bandImg.url"
            :alt="`${band.name} image`"
            class="cybered-hero-photo"
            :style="heroImageStyle"
          />
        </Motion>
        <Motion
          class="cybered-hero-overlay"
          aria-hidden="true"
          v-bind="heroOverlayMotion"
        />
        <!-- Multi-layer gradient for cinematic depth. Desktop fade is retuned in CSS. -->
        <div class="cybered-hero-fade cybered-hero-fade--base absolute inset-0 z-[2] bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div class="cybered-hero-fade cybered-hero-fade--veil absolute inset-0 z-[2] bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <div class="cybered-hero-fade cybered-hero-fade--foot absolute inset-x-0 bottom-0 z-[2] h-36 sm:h-40 bg-gradient-to-t from-black to-transparent" />
        
        <!-- Badges Row -->
        <div class="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center gap-2 flex-wrap z-30">
          <!-- Live Badge -->
          <div v-if="hasUpcomingEvents" class="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-black/20">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            Live
          </div>
          
          
          <!-- Genre Badge -->
          <Motion
            v-if="band.genre"
            class="px-3 py-1.5 rounded-full bg-white/8 backdrop-blur-md border border-white/10 text-xs text-white/80 font-medium tracking-wide shadow-lg shadow-black/20"
            v-bind="heroMetaMotion"
          >
            {{ band.genre }}
          </Motion>
        </div>

        <!-- Band name overlaid on hero bottom for cinematic feel -->
        <div class="cybered-hero-identity absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-20">
          <Motion
            v-if="!band.isBandNameInLogo"
            v-bind="heroIdentityMotion"
          >
            <h1 class="cybered-hero-name text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight cybered-text-glow">
              {{ heroDisplayName }}
            </h1>
          </Motion>
          <div v-if="heroExperimentMode === 'adaptive'" class="cybered-hero-identity__aside">
            <p v-if="band.genre" class="cybered-hero-identity__genre">{{ band.genre }}</p>
            <p v-if="band.biotagline" class="cybered-hero-identity__tagline">{{ band.biotagline }}</p>
            <ArtistPageActions
              variant="cybered"
              :visual-variant="visualVariant"
              :show-follow="true"
              :show-save="false"
              :message-label="messageLabel"
              :message-pending="messagePending"
              :message-disabled="messageDisabled"
              :saved="saved"
              :followed="followed"
              :follow-busy="followBusy"
              :follow-error="followError"
              @follow="$emit('follow')"
              @message="$emit('message')"
              @save="$emit('save')"
              @share="$emit('share')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Content Card -->
    <div class="cybered-stage mx-auto px-3 sm:px-4">
      <div class="cybered-content-card bg-black/80 backdrop-blur-sm -mt-6 sm:-mt-8 relative z-10 rounded-2xl border border-white/5 shadow-2xl">
        <Motion v-if="!deckFold" v-bind="firstContentMotion">
        <!-- Bio & Tagline Section -->
        <div v-if="band.bio || band.biotagline" class="cybered-intro text-center p-6 sm:p-8 pb-4">
          <p v-if="band.bio" class="text-white/70 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-light">
            {{ band.bio }}
          </p>
          <p v-if="band.biotagline" class="text-purple-400 text-sm sm:text-base mt-3 font-medium tracking-wide">
            {{ band.biotagline }}
          </p>
        </div>

        <!-- Live Surface Components -->
        <div class="px-6">
          <!-- Show Day Header - Only show when event is today -->
          <div v-if="isEventToday" class="mb-4">
            <ShowDayHeader
              :event="nextEvent"
              :has-pay-entry="enabledPaymentButtons.length > 0"
              @tickets="$emit('view-event', nextEvent)"
              @pay-entry="scrollToSupport"
            />
          </div>

          <!-- Continue Chip -->
          <div v-if="!testMode" class="mb-4">
            <ContinueChip
              :band-slug="band.slug"
              @continue="handleContinueAction"
            />
          </div>

          <!-- Live Feed -->
          <div v-if="hasLiveFeedItems" class="mb-4">
            <LiveFeed
              :feed-items="liveFeedItems"
              :primary-feed-item="primaryFeedItem"
              :has-feed-items="hasLiveFeedItems"
              display-mode="single"
            />
          </div>
        </div>
        </Motion>

        <!-- Main Content Sections -->
        <div class="cybered-main-sections p-6 space-y-6">
          <!-- Featured Song - Card Style with inline audio player -->
          <FaneqoReveal v-if="hasFeaturedSong">
          <section>
            <!-- Only show heading for direct audio files, not embeds -->
            <h3 v-if="!isEmbedSong" class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Featured Song</h3>
            
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

            <!-- Legacy Embedded player (Spotify, SoundCloud, etc.) - no extra heading/title -->
            <div v-else-if="isEmbedSong && embedHtml" class="rounded-xl overflow-hidden">
              <div class="w-full" v-html="embedHtml" />
            </div>
            
            <!-- Direct audio file player -->
            <div v-else class="cybered-song-card bg-gradient-to-br from-purple-950/20 to-black/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-sm shadow-xl shadow-purple-500/5">
              <div class="flex items-center gap-4">
                <div class="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-black/30">
                  <img 
                    v-if="songCoverUrl" 
                    :src="songCoverUrl" 
                    alt="Album art" 
                    class="w-full h-full object-cover" 
                  />
                  <div v-else class="w-full h-full bg-gradient-to-br from-purple-500/30 to-purple-700/30 flex items-center justify-center">
                    <svg class="w-8 h-8 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-white font-semibold text-base">{{ songTitle }}</div>
                  <div class="text-white/60 text-sm mt-0.5">{{ band.name }}</div>
                </div>
                <button 
                  v-if="songUrl"
                  @click="toggleAudio"
                  class="cybered-play-button w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center text-white hover:shadow-purple-500/40 hover:-translate-y-px active:scale-[0.99] transition-all duration-200 shrink-0"
                >
                  <svg v-if="!isPlaying" class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                </button>
                <div v-else class="w-14 h-14 rounded-2xl bg-gray-700/30 border border-gray-600/30 flex items-center justify-center text-gray-400 shrink-0">
                  <svg class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <!-- Hidden audio element -->
              <audio 
                v-if="songUrl"
                ref="audioPlayer" 
                :src="songUrl"
                @play="onAudioPlay"
                @pause="onAudioPause"
                @ended="onAudioEnded"
              />
            </div>
          </section>
          </FaneqoReveal>

          <!-- Featured Video - Card Style (matches preview) -->
          <FaneqoReveal v-if="hasVideo && !deckFold">
          <section>
            <h3 class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Featured Video</h3>
            
            <!-- Video Thumbnail (before playing) -->
            <div 
              v-if="!isVideoPlaying"
              class="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
              @click="playVideo"
            >
              <img 
                v-if="videoThumbnail" 
                :src="videoThumbnail" 
                :alt="`${band.name} video thumbnail`" 
                class="absolute inset-0 w-full h-full object-cover opacity-60" 
              />
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 hover:bg-white/20 transition">
                  <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div class="absolute bottom-3 left-3">
                <div class="text-white font-semibold text-sm">{{ videoTitle }}</div>
                <div class="text-white/60 text-xs">{{ band.name }}</div>
              </div>
            </div>
            
            <!-- Video Player (after clicking play) -->
            <div 
              v-else
              class="relative aspect-video rounded-xl overflow-hidden bg-black"
            >
              <iframe
                :src="videoEmbedUrl"
                class="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowfullscreen
              />
            </div>
          </section>
          </FaneqoReveal>

          <ArtistFeaturedGallery
            v-if="featuredGalleryLab"
            lab
            :artist-name="band?.name || ''"
            :artist-slug="band?.slug || ''"
            :artist-image="band?.bandImg?.url || ''"
          />
          <ArtistFeaturedGallery
            v-else-if="publicFeaturedGallery"
            :gallery="publicFeaturedGallery"
            :artist-name="band?.name || ''"
            :artist-slug="band?.slug || ''"
            :artist-image="band?.bandImg?.url || ''"
          />

          <!-- Website Link - Premium Card -->
          <FaneqoReveal v-if="band.websitelink && !deckFold">
          <section class="cybered-website-section">
            <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Website</h3>
            <a
              :href="band.websitelink"
              target="_blank"
              rel="noopener"
              class="cybered-website-card group flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10"
            >
              <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center">
                <svg class="w-5 h-5 text-white/80 group-hover:text-purple-300 transition-colors duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">
                  {{ displayWebsiteLabel(band.websitelink, band.websitelinktext) }}
                </div>
                <div class="text-white/50 text-sm mt-0.5 group-hover:text-purple-300/60 transition-colors duration-300">
                  Official website
                </div>
              </div>
              <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </section>
          </FaneqoReveal>

          <!-- Streaming Links - Premium Cards -->
          <FaneqoReveal v-if="hasStreamingLinks">
          <section class="cybered-streaming-section">
            <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Streaming</h3>
            <div class="space-y-3">
              <template v-for="platform in visibleStreamingPlatforms" :key="platform.name">
                <a
                  v-if="band[platform.name] && !isLinkHidden(platform.name)"
                  :href="band[platform.name]"
                  @click.prevent="$emit('link-click', { name: platform.name, url: band[platform.name] })"
                  class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10"
                >
                  <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center">
                    <PlatformIcon :existing-icon="platform.img" :iconify="platform.iconify" :color="platform.color" :alt="platform.label" class-name="w-5 h-5" />
                  </div>
                  <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">{{ platform.label }}</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-0.5 ml-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </template>
            </div>
          </section>
          </FaneqoReveal>

          <!-- Social Links - Premium Cards -->
          <FaneqoReveal v-if="hasSocialLinks && !deckFold" class="cybered-social-reveal">
          <section class="cybered-social-section">
            <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Social</h3>
            <div class="space-y-3">
              <template v-for="platform in socialIconPlatforms" :key="platform.name">
                <a
                  v-if="band[platform.name] && !isLinkHidden(platform.name)"
                  :href="band[platform.name]"
                  @click.prevent="$emit('link-click', { name: platform.name, url: band[platform.name] })"
                  class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10"
                >
                  <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center">
                    <PlatformIcon :existing-icon="platform.img" :iconify="platform.iconify" :color="platform.color" :alt="platform.label" class-name="w-5 h-5" />
                  </div>
                  <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">{{ platform.label }}</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-0.5 ml-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </template>
              <a
                v-if="officialMerchHref"
                :href="officialMerchHref"
                target="_blank"
                rel="noopener noreferrer"
                class="cybered-platform-card cybered-merch-row group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                @click="onMerchClick($event)"
              >
                <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center shrink-0">
                  <PlatformIcon iconify="lucide:shopping-bag" alt="" class-name="w-5 h-5" />
                </div>
                <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">Official Merch Store</span>
                <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-0.5 ml-auto shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>
          </FaneqoReveal>

          <FaneqoReveal v-if="officialMerchHref && !hasSocialLinks && !deckFold">
          <section class="cybered-social-section">
            <a
              :href="officialMerchHref"
              target="_blank"
              rel="noopener noreferrer"
              class="cybered-platform-card cybered-merch-row group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @click="onMerchClick($event)"
            >
              <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center shrink-0">
                <PlatformIcon iconify="lucide:shopping-bag" alt="" class-name="w-5 h-5" />
              </div>
              <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">Official Merch Store</span>
              <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-0.5 ml-auto shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </section>
          </FaneqoReveal>

          <!-- Editorial Showcase (entitled bands only, when enabled + items) -->
          <FaneqoReveal v-if="!deckFold">
          <EditorialShowcase
            :band="band"
            @link-click="$emit('link-click', $event)"
          />
          </FaneqoReveal>

          <!-- Event Hubs - Premium Cards -->
          <FaneqoReveal v-if="hasEventHubLinks && !deckFold">
          <section>
            <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Event Hubs</h3>
            <div class="space-y-3">
              <template v-for="platform in eventHubPlatforms" :key="platform.name">
                <a
                  v-if="band[platform.name] && !isLinkHidden(platform.name)"
                  :href="band[platform.name]"
                  @click.prevent="$emit('link-click', { name: platform.name, url: band[platform.name] })"
                  class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10"
                >
                  <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center">
                    <PlatformIcon :existing-icon="platform.img" :iconify="platform.iconify" :color="platform.color" :alt="platform.label" class-name="w-5 h-5" />
                  </div>
                  <span class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300">{{ platform.label }}</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-0.5 ml-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </template>
            </div>
          </section>
          </FaneqoReveal>

          <!-- Custom Links — after the standard platform buttons -->
          <FaneqoReveal v-if="visibleCustomButtons.length > 0 && !deckFold">
          <section class="cybered-custom-links-section">
            <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Links</h3>
            <div class="space-y-3">
              <component
                v-for="button in visibleCustomButtons"
                :key="button.id || button.url"
                :is="isInternalUrl(button.url) ? 'NuxtLink' : 'a'"
                :to="isInternalUrl(button.url) ? button.url : undefined"
                :href="!isInternalUrl(button.url) ? button.url : undefined"
                :target="!isInternalUrl(button.url) ? '_blank' : undefined"
                :rel="!isInternalUrl(button.url) ? 'noopener noreferrer' : undefined"
                class="cybered-platform-card group w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10"
                @click="onCustomButtonClick($event, button)"
              >
                <div class="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-colors duration-300 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    v-if="button.iconUrl"
                    :src="button.iconUrl"
                    :alt="button.title"
                    class="w-full h-full object-cover"
                  />
                  <PlatformIcon
                    v-else
                    :iconify="getCustomButtonIcon(button)"
                    :alt="button.title"
                    class-name="w-5 h-5"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-white font-medium text-base group-hover:text-purple-200 transition-colors duration-300 truncate">{{ button.title }}</div>
                  <div v-if="button.subtitle" class="text-white/50 text-sm mt-0.5 truncate">{{ button.subtitle }}</div>
                </div>
                <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-0.5 ml-auto shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </component>
            </div>
          </section>
          </FaneqoReveal>

          <!-- Upcoming Events - Premium Cards -->
          <FaneqoReveal v-if="hasUpcomingEvents && !deckFold">
          <section ref="eventsSection">
            <h3 class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Upcoming Shows</h3>
            <div class="space-y-3">
              <div 
                v-for="event in upcomingEvents.slice(0, 3)" 
                :key="event.id"
                class="cybered-event-card group flex items-center justify-between px-5 py-4 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-500/5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10"
              >
                <div class="flex-1">
                  <div class="text-white font-semibold text-base">{{ event.city }}<span v-if="event.state">, {{ event.state }}</span></div>
                  <div class="text-white/50 text-sm mt-1">{{ event.venue }} • {{ formatEventDate(event.date) }}</div>
                </div>
                <button 
                  @click="$emit('view-event', event)"
                  class="cybered-event-btn px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 border border-purple-400/30 rounded-xl text-white text-sm font-semibold hover:from-purple-600 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-px active:scale-[0.99]"
                >
                  {{ event.ticketLink ? 'Tickets' : 'Details' }}
                </button>
              </div>
            </div>
          </section>
          </FaneqoReveal>

        </div>

        <!-- Support Module -->
        <FaneqoReveal v-if="enabledPaymentButtons.length > 0">
        <div class="px-6 pb-6">
          <section ref="supportSection">
            <SupportModule 
              :band-name="band.name"
              :show-quick-tips="true"
              :quick-tip-amounts="[5, 10, 20]"
              :page-mode="'QUIET'"
              :payment-buttons="enabledPaymentButtons"
              @quick-tip="$emit('quick-tip', $event)"
              @checkout="$emit('checkout', $event)"
            />
          </section>
        </div>
        </FaneqoReveal>

      </div>
    </div>

    <section class="cybered-close" aria-label="Stay with this artist">
      <div class="cybered-close__inner">
        <FaneqoReveal v-if="!deckFold">
          <div class="cybered-fan-capture-slot">
            <slot name="fan-capture"></slot>
          </div>
        </FaneqoReveal>
        <div class="cybered-close__ways">
          <p class="cybered-close__ways-label">More ways to connect</p>
          <ArtistPageActions
            variant="close"
            :visual-variant="visualVariant"
            :show-follow="true"
            :show-save="false"
            :message-label="messageLabel"
            :message-pending="messagePending"
            :message-disabled="messageDisabled"
            :saved="saved"
            :followed="followed"
            :follow-busy="followBusy"
            :follow-error="followError"
            @follow="$emit('follow')"
            @message="$emit('message')"
            @save="$emit('save')"
            @share="$emit('share')"
          />
        </div>
      </div>
    </section>

    <HeroExperimentPanel
      v-if="heroExperimentEnabled"
      :mode="heroExperimentMode"
      :desktop="heroExperimentDesktop"
      :source-ratio="heroExperimentSourceRatio"
      :adaptive-presentation="heroExperimentPresentation || ''"
      :image-width="heroExperimentImage?.width"
      :image-height="heroExperimentImage?.height"
      :desktop-hero-ratio="heroExperimentDesktopHeroRatio"
      @update:mode="setHeroExperimentMode"
      @update:desktop="setHeroExperimentDesktop"
      @reset="resetHeroExperiment"
    />
  </div>

</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Motion } from 'motion-v'
import { useProfileMotion } from '@/composables/useProfileMotion'
import FaneqoReveal from '@/components/band/FaneqoReveal.vue'
import { getDemoFlag } from '@/composables/useDemoFlags'
import PlatformIcon from '@/components/ui/PlatformIcon.vue'

// Live Surface Components
import ShowDayHeader from '@/components/smartlink/ShowDayHeader.vue'
import NowBanner from '@/components/smartlink/NowBanner.vue'
import ContinueChip from '@/components/smartlink/ContinueChip.vue'
import LiveFeed from '@/components/smartlink/LiveFeed.vue'
import SupportModule from '@/components/smartlink/SupportModule.vue'
import EliteSpotifyEmbedWidget from '@/components/smartlink/EliteSpotifyEmbedWidget.vue'
import EditorialShowcase from '@/components/editorial/EditorialShowcase.vue'
import PublicationCyberedLayout from '@/components/publication/PublicationCyberedLayout.vue'
import ArtistPageActions from '@/components/band/ArtistPageActions.vue'
import { displayWebsiteLabel } from '@/utils/displayWebsiteLabel'
import { detectPlatform, isInternalUrl } from '@/utils/detectPlatform'
import { isSameLocalCalendarDay } from '@/utils/dates/calendarDate'
import { isPublicationProfile as checkPublicationProfile, getPublicationAccent } from '@/utils/publicationProfile'
import { unwrapBandImage } from '@/utils/media/artistImage'
import {
  getCyberedDesktopPhotoVars,
  getCyberedSurfacePhotoStyle,
  resolveCyberedSurfaceFraming,
} from '@/utils/media/cyberedArtistFraming'
import {
  getCyberedPublicHeroFrame,
  resolveCyberedHeroGeometry,
} from '@/utils/media/cyberedHeroGeometry'
import { useCyberedProfileChrome } from '@/composables/useCyberedProfileChrome'
import HeroExperimentPanel from '@/components/band/HeroExperimentPanel.vue'
import { useHeroExperiment } from '@/composables/useHeroExperiment'
import { useFeaturedGalleryLab } from '@/composables/useFeaturedGalleryLab'
import { resolvePublicFeaturedGallery } from '@/utils/galleries/publicFeaturedGallery'
import { getAdaptivePhotoStyle } from '@/utils/media/heroExperiment'

// Streaming icons (existing platforms only - new ones use iconify)
import youtubeIcon from '@/assets/youtube-icon.svg'
import youtubeMusicIcon from '@/assets/youtube-icon.svg'
import spotifyIcon from '@/assets/spotify.svg'
import appleMusicIcon from '@/assets/apple.svg'
import soundcloudIcon from '@/assets/soundcloudlast.png'
import bandcampIcon from '@/assets/bandcamp.svg'
import deezerIcon from '@/assets/dezzer.svg'
import twitchIcon from '@/assets/twitchfree.png'
import reverbnationIcon from '@/assets/reverbnation.png'

// Social icons (existing platforms only - new ones use iconify)
import facebookIcon from '@/assets/facebookfree.png'
import instagramIcon from '@/assets/instagramfree.png'
import twitterIcon from '@/assets/twitter.png'
import tiktokIcon from '@/assets/tiktok.png'

const props = defineProps({
  band: { type: Object, required: true },
  upcomingEvents: { type: Array, default: () => [] },
  hiddenLinks: { type: Array, default: () => [] },
  enabledPaymentButtons: { type: Array, default: () => [] },
  followablePlatforms: { type: Array, default: () => [] },
  customButtons: { type: Array, default: () => [] },
  messageLabel: { type: String, default: 'Message' },
  messagePending: { type: Boolean, default: false },
  messageDisabled: { type: Boolean, default: false },
  saved: { type: Boolean, default: false },
  followed: { type: Boolean, default: false },
  followBusy: { type: Boolean, default: false },
  followError: { type: String, default: '' },
  visualVariant: { type: String, default: 'polish-test' },
  testMode: { type: Boolean, default: false },
  deckFold: { type: Boolean, default: false },
})

const isPublicationMode = computed(() => checkPublicationProfile(props.band))
const publicationAccent = computed(() => getPublicationAccent(props.band))

const emit = defineEmits([
  'play-song',
  'play-video',
  'link-click',
  'media-play',
  'view-event',
  'quick-tip',
  'checkout',
  'follow',
  'message',
  'save',
  'share',
  'scroll-to-support',
])

const eventsSection = ref(null)
const supportSection = ref(null)
const audioPlayer = ref(null)
const isPlaying = ref(false)
const isVideoPlaying = ref(false)
const heroShellRef = ref(null)
const { beginOpening, observeHero, endOpening } = useCyberedProfileChrome()

if (!isPublicationMode.value) {
  beginOpening()
}

const {
  heroImage: heroImageMotion,
  heroOverlay: heroOverlayMotion,
  heroIdentity: heroIdentityMotion,
  heroMeta: heroMetaMotion,
  firstContent: firstContentMotion,
} = useProfileMotion()
const motionSettled = ref(false)
const heroGeometry = computed(() => resolveCyberedHeroGeometry(props.band?.bandImg))

onMounted(() => {
  window.setTimeout(() => {
    motionSettled.value = true
  }, 900)
  if (!isPublicationMode.value) {
    nextTick(() => observeHero(heroShellRef.value))
  }
  loadHeroExperiment()
})

onBeforeUnmount(() => {
  endOpening()
})

const phoneHeroFraming = computed(() => resolveCyberedSurfaceFraming(props.band, 'phone'))
const desktopHeroFraming = computed(() => resolveCyberedSurfaceFraming(props.band, 'desktop'))
const heroImageStyle = computed(() => getCyberedSurfacePhotoStyle(phoneHeroFraming.value))

const {
  enabled: heroExperimentEnabled,
  mode: heroExperimentMode,
  desktop: heroExperimentDesktop,
  sourceRatio: heroExperimentSourceRatio,
  adaptivePresentation,
  setMode: setHeroExperimentMode,
  setDesktop: setHeroExperimentDesktop,
  reset: resetHeroExperiment,
  loadFromStorage: loadHeroExperiment,
} = useHeroExperiment(() => props.band)

const ArtistFeaturedGallery = defineAsyncComponent(() => import('@/components/band/ArtistFeaturedGallery.vue'))
const { enabled: featuredGalleryLab } = useFeaturedGalleryLab()
const publicFeaturedGallery = computed(() => resolvePublicFeaturedGallery(props.band?.featuredGallery))

const persistedDesktopPhotoVars = computed(() => {
  if (heroExperimentEnabled.value && heroExperimentMode.value !== 'original') return null
  return getCyberedDesktopPhotoVars(desktopHeroFraming.value)
})

const heroExperimentImage = computed(() => unwrapBandImage(props.band?.bandImg))

const heroExperimentPresentation = computed(() =>
  heroExperimentMode.value === 'adaptive' ? adaptivePresentation.value : undefined
)

const heroExperimentFit = computed(() =>
  heroExperimentMode.value === 'original' ? undefined : heroExperimentDesktop.value.fit
)

const heroExperimentDesktopHeroRatio = computed(() => {
  const frame = getCyberedPublicHeroFrame({
    surface: 'desktop',
    image: heroExperimentImage.value,
    viewportWidth: 1440,
    viewportHeight: 900,
  })
  return frame.ratio
})

const heroExperimentPhotoVars = computed(() => {
  if (!heroExperimentEnabled.value || heroExperimentMode.value === 'original') return null
  const style = heroExperimentMode.value === 'adaptive'
    ? getAdaptivePhotoStyle(adaptivePresentation.value, heroExperimentDesktop.value)
    : getAdaptivePhotoStyle('cinematic', heroExperimentDesktop.value)
  return {
    '--hx-object-fit': style.objectFit,
    '--hx-object-position': style.objectPosition,
    '--hx-transform': style.transform,
    '--hx-transform-origin': style.transformOrigin,
    '--hx-src-ratio': String(heroExperimentSourceRatio.value || 1.6),
  }
})

const heroShellStyle = computed(() => ({
  ...heroGeometry.value.style,
  ...(persistedDesktopPhotoVars.value || {}),
  ...(heroExperimentPhotoVars.value || {}),
}))

const heroExperimentRoute = useRoute()
const heroExperimentPreview = computed(() => {
  if (!heroExperimentEnabled.value) return { intro: null, name: null }
  const introRaw = heroExperimentRoute.query?.hxIntro
  const nameRaw = heroExperimentRoute.query?.hxName
  const intro = String(Array.isArray(introRaw) ? introRaw[0] : introRaw || '').trim().toLowerCase()
  const name = String(Array.isArray(nameRaw) ? nameRaw[0] : nameRaw || '').trim()
  return {
    intro: intro === 'none' || intro === 'tagline' || intro === 'long' ? intro : null,
    name: name || null,
  }
})

const heroDisplayName = computed(() => heroExperimentPreview.value.name || props.band?.name || '')

const heroExperimentIntroKind = computed(() => {
  if (!heroExperimentEnabled.value || heroExperimentMode.value === 'original') return undefined
  if (props.band?.bio) return 'bio'
  if (props.band?.biotagline) return 'tagline'
  return 'none'
})

const hasUpcomingEvents = computed(() => props.upcomingEvents.length > 0)
const nextEvent = computed(() => props.upcomingEvents[0] || null)

// Check if the next event is today (for "Tonight" banner)
const isEventToday = computed(() => {
  if (!nextEvent.value) return false
  return isSameLocalCalendarDay(nextEvent.value.date)
})
const hasFeaturedSong = computed(() => {
  const s = props.band.singlesong
  if (!s) return false

  if (s.isEmbed && s.platform === 'spotify' && s.spotifyUrl && s.spotifyOembedHtml) {
    return true
  }

  if (s.isEmbed) {
    return !!String(s.embedHtml || '').trim()
  }

  const nestedUrl = s?.song?.data?.attributes?.url
  const directUrl = s?.song?.url
  return !!(nestedUrl || directUrl)
})
const hasVideo = computed(() => !!props.band.singlevideo?.youtubeid || !!props.band.singlevideo?.thumbnailUrl)
const videoTitle = computed(() => props.band.singlevideo?.title || 'Featured Video')
const videoThumbnail = computed(() => {
  if (props.band.singlevideo?.thumbnailUrl) return props.band.singlevideo.thumbnailUrl
  const youtubeId = props.band.singlevideo?.youtubeid
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
  }
  return props.band.bandImg?.url || null
})
const videoEmbedUrl = computed(() => {
  const youtubeId = props.band.singlevideo?.youtubeid
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`
  }
  return null
})

const songTitle = computed(() => props.band.singlesong?.title || 'Featured Track')
const songCoverUrl = computed(() => props.band.singlesong?.cover?.url || props.band.bandImg?.url || null)
const isEmbedSong = computed(() => !!props.band.singlesong?.isEmbed)
const embedHtml = computed(() => props.band.singlesong?.embedHtml || null)

// Check if this is an Elite Spotify embed (new oEmbed flow with metadata)
const isEliteSpotifyEmbed = computed(() => {
  const s = props.band.singlesong
  if (!s) return false
  return s.isEmbed && s.platform === 'spotify' && s.spotifyUrl && s.spotifyOembedHtml
})
const songUrl = computed(() => {
  // Get the song file URL for playback (matches formatSingleSong logic)
  const song = props.band.singlesong
  if (!song) return null
  const nestedUrl = song?.song?.data?.attributes?.url
  const directUrl = song?.song?.url
  return nestedUrl || directUrl || null
})

const hasStreamingLinks = computed(() => {
  const result = streamingPlatforms.some(p => !!props.band[p.name] && !isLinkHidden(p.name))
  console.log('[DEBUG] hasStreamingLinks:', result, 'band keys:', Object.keys(props.band || {}))
  console.log('[DEBUG] streaming check:', streamingPlatforms.map(p => ({ name: p.name, value: props.band[p.name] })))
  return result
})
const hasSocialLinks = computed(() => {
  const result = socialPlatforms.some(p => !!props.band[p.name] && !isLinkHidden(p.name))
  console.log('[DEBUG] hasSocialLinks:', result)
  console.log('[DEBUG] social check:', socialPlatforms.map(p => ({ name: p.name, value: props.band[p.name] })))
  return result
})
const hasEventHubLinks = computed(() => {
  const result = eventHubPlatforms.some(p => !!props.band[p.name] && !isLinkHidden(p.name))
  console.log('[DEBUG] hasEventHubLinks:', result)
  return result
})

const officialMerchHref = computed(() => {
  const raw = props.band?.officialMerchUrl
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (!/^https?:\/\//i.test(trimmed)) return null
  return trimmed
})

// Live Feed Data
const liveFeedItems = ref([])
const hasLiveFeedItems = computed(() => liveFeedItems.value.length > 0)
const primaryFeedItem = computed(() => liveFeedItems.value[0] || null)

// NOW Banner
const nowBannerState = computed(() => {
  if (hasUpcomingEvents.value) return 'ON_TOUR'
  return 'QUIET_DEFAULT'
})

const nowBannerContent = computed(() => ({
  icon: '',
  headline: hasUpcomingEvents.value ? 'On Tour' : 'Discover',
  subtext: hasUpcomingEvents.value 
    ? `${props.upcomingEvents.length} upcoming show${props.upcomingEvents.length > 1 ? 's' : ''}`
    : 'Check out the latest music',
  accent: 'purple',
  cta: hasUpcomingEvents.value ? 'See Dates' : 'Listen Now',
  ctaAction: hasUpcomingEvents.value ? 'scroll-to-events' : 'scroll-to-streaming'
}))

// Platform definitions
const streamingPlatforms = [
  // Existing platforms (keep img)
  { name: 'youtube', img: youtubeIcon, label: 'YouTube' },
  { name: 'youtubeMusic', img: youtubeMusicIcon, label: 'YouTube Music' },
  { name: 'spotify', img: spotifyIcon, label: 'Spotify' },
  { name: 'appleMusic', img: appleMusicIcon, label: 'Apple Music' },
  { name: 'soundcloud', img: soundcloudIcon, label: 'SoundCloud' },
  { name: 'bandcamp', img: bandcampIcon, label: 'Bandcamp' },
  { name: 'deezer', img: deezerIcon, label: 'Deezer' },
  { name: 'twitch', img: twitchIcon, label: 'Twitch' },
  { name: 'reverbnation', img: reverbnationIcon, label: 'Reverbnation' },
  // New platforms (use iconify with brand colors)
  { name: 'amazonMusic', iconify: 'simple-icons:amazonmusic', label: 'Amazon Music', color: '#00A8E1' },
  { name: 'tidal', iconify: 'simple-icons:tidal', label: 'TIDAL', color: '#00FFFF' },
  { name: 'pandora', iconify: 'simple-icons:pandora', label: 'Pandora', color: '#3668FF' },
  { name: 'audiomack', iconify: 'simple-icons:audiomack', label: 'Audiomack', color: '#FFA200' },
  { name: 'mixcloud', iconify: 'simple-icons:mixcloud', label: 'Mixcloud', color: '#5000FF' },
  { name: 'beatport', iconify: 'simple-icons:beatport', label: 'Beatport', color: '#94D500' },
  { name: 'napster', iconify: 'simple-icons:napster', label: 'Napster', color: '#00A9E0' },
  { name: 'vimeo', iconify: 'simple-icons:vimeo', label: 'Vimeo', color: '#1AB7EA' },
  { name: 'kick', iconify: 'simple-icons:kick', label: 'Kick', color: '#53FC18' },
]

const socialPlatforms = [
  // Existing platforms (keep img)
  { name: 'facebook', img: facebookIcon, label: 'Facebook' },
  { name: 'instagram', img: instagramIcon, label: 'Instagram' },
  { name: 'twitter', img: twitterIcon, label: 'Twitter' },
  { name: 'tiktok', img: tiktokIcon, label: 'TikTok' },
  // New platforms (use iconify with brand colors)
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

const LAB_SOCIAL_VECTORS = {
  facebook: { iconify: 'simple-icons:facebook', color: '#1877F2' },
  instagram: { iconify: 'simple-icons:instagram', color: '#E4405F' },
  twitter: { iconify: 'simple-icons:x', color: '#FFFFFF' },
  tiktok: { iconify: 'simple-icons:tiktok', color: '#25F4EE' },
}

const socialIconPlatforms = computed(() =>
  socialPlatforms.map((platform) => {
    const vector = LAB_SOCIAL_VECTORS[platform.name]
    if (!vector) return platform
    return { name: platform.name, label: platform.label, iconify: vector.iconify, color: vector.color }
  })
)

const eventHubPlatforms = [
  // New platforms (use iconify with brand colors)
  { name: 'bandsintown', iconify: 'simple-icons:bandsintown', label: 'Bandsintown', color: '#00CEC8' },
  { name: 'songkick', iconify: 'simple-icons:songkick', label: 'Songkick', color: '#F80046' },
  { name: 'jambase', iconify: 'mdi:music-note', label: 'JamBase', color: '#FF6B00' },
  { name: 'relix', iconify: 'mdi:microphone-variant', label: 'Relix', color: '#E31837' },
]

// Methods
function isLinkHidden(linkName) {
  return props.hiddenLinks.includes(linkName)
}

const visibleCustomButtons = computed(() => {
  const list = Array.isArray(props.customButtons) ? props.customButtons : []
  return list
    .map((button) => ({
      id: button.id,
      title: String(button.title || '').trim() || 'Learn more',
      subtitle: String(button.subtitle || '').trim(),
      url: String(button.url || '').trim(),
      iconName: button.iconName || '',
      iconUrl: button.customIcon?.url || button.customIcon?.data?.attributes?.url || null,
    }))
    .filter((button) => button.url)
})

function getCustomButtonIcon(button) {
  if (button.iconName) {
    return detectPlatform(`https://${button.iconName}.com`).iconify
  }
  return detectPlatform(button.url)?.iconify || 'mdi:link-variant'
}

function onCustomButtonClick(event, button) {
  if (isInternalUrl(button.url)) return
  event.preventDefault()
  emit('link-click', { name: 'custom', url: button.url, label: button.title })
}

const visibleStreamingPlatforms = computed(() => {
  if (!props.deckFold) return streamingPlatforms
  return streamingPlatforms
    .filter((platform) => props.band[platform.name] && !isLinkHidden(platform.name))
    .slice(0, 3)
})

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  // Parse date in local timezone by adding time component
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scrollToSupport() {
  supportSection.value?.scrollIntoView({ behavior: 'smooth' })
}

function handleBannerCta(action) {
  if (action.action === 'scroll-to-events' && nextEvent.value) {
    // Navigate to event page instead of scrolling
    emit('view-event', nextEvent.value)
  }
}

function handleScrollTo(section) {
  if (section === 'events' && nextEvent.value) {
    // Navigate to event page instead of scrolling
    emit('view-event', nextEvent.value)
  }
}

function handleContinueAction(action) {
  // Handle continue chip action
}

// Audio player methods
async function toggleAudio() {
  if (!audioPlayer.value) return
  
  if (isPlaying.value) {
    audioPlayer.value.pause()
  } else {
    try {
      await audioPlayer.value.play()
      emit('play-song')
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }
}

function onAudioPlay() {
  isPlaying.value = true
}

function onAudioPause() {
  isPlaying.value = false
}

function onAudioEnded() {
  isPlaying.value = false
}

// Video player methods
function playVideo() {
  emit('play-video')
  if (props.testMode || !videoEmbedUrl.value) return
  isVideoPlaying.value = true
}

function onMerchClick(event) {
  emit('link-click', { name: 'official_merch_store', url: officialMerchHref.value })
  if (props.testMode) event.preventDefault()
}

</script>

<style scoped>
.band-page-cybered {
  background: linear-gradient(to bottom, #000 0%, #0a0a0a 100%);
}

.cybered-stage {
  max-width: 48rem;
}

.cybered-hero-shell {
  width: 100%;
  height: auto;
  aspect-ratio: var(--fq-hero-ratio, 1.6);
  min-height: 17.5rem;
  max-height: 35rem;
  transform: none;
  isolation: isolate;
}

@media (min-width: 768px) {
  .cybered-hero-shell {
    min-height: 22.5rem;
    max-height: 42.5rem;
  }
}

@media (min-width: 1024px) {
  /* Desktop: cinematic stage, not a full-viewport poster.
     Drop source aspect-ratio so tall photos crop cover-style instead of stretching the shell. */
  .cybered-stage {
    max-width: clamp(52rem, 68vw, 62rem);
  }

  .cybered-hero-shell,
  .cybered-hero-shell.cybered-hero--portrait,
  .cybered-hero-shell.cybered-hero--deep {
    aspect-ratio: auto;
    height: clamp(31rem, 56vh, 35rem);
    min-height: 31rem;
    max-height: 35rem;
  }

  /*
   * Name clip cause: hero overflow-hidden + isolation:isolate + bottom:0
   * identity + content-card -mt-8. The card is a sibling stacking context,
   * so it covers descenders sitting on the hero cut line.
   */
  .cybered-hero-identity {
    bottom: 1.75rem;
    overflow: visible;
  }

  .cybered-hero-identity :deep(*) {
    overflow: visible;
  }

  .cybered-hero-name {
    line-height: 1.15;
    overflow: visible;
    padding-bottom: 0.18em;
  }

  .cybered-content-card {
    margin-top: -1.25rem;
  }
}

@media (max-width: 767px) {
  /* Tall/portrait sources: controlled viewport. Do not size from source ratio. */
  .cybered-hero-shell.cybered-hero--portrait,
  .cybered-hero-shell.cybered-hero--deep {
    aspect-ratio: auto;
    height: var(--fq-hero-portrait-height-mobile, clamp(23.75rem, 48vh, 26.875rem));
    min-height: var(--fq-hero-portrait-min-mobile, 23.75rem);
    max-height: var(--fq-hero-portrait-max-mobile, 26.875rem);
  }

  .cybered-hero--portrait .cybered-hero-identity,
  .cybered-hero--deep .cybered-hero-identity {
    bottom: var(--fq-hero-portrait-name-inset, var(--fq-hero-deep-name-inset, 1rem));
  }
}

.cybered-hero-motion,
.cybered-hero-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cybered-hero-overlay {
  background: #000;
  pointer-events: none;
  z-index: 1;
}

.cybered-hero-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (min-width: 1024px) {
  .band-page-cybered:not([data-hx-mode]) .cybered-hero-photo {
    object-fit: var(--hero-desk-object-fit, cover) !important;
    object-position: var(--hero-desk-object-position, 50% 50%) !important;
    transform: var(--hero-desk-transform, none) !important;
    transform-origin: var(--hero-desk-transform-origin, 50% 50%) !important;
  }

  .band-page-cybered:not([data-hx-mode])[data-hero-desktop-fit='full'] .cybered-hero-shell {
    background: #040507;
  }

  .band-page-cybered:not([data-hx-mode])[data-hero-desktop-fit='full'] .cybered-hero-identity {
    text-align: center;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .band-page-cybered:not([data-hx-mode])[data-hero-desktop-fit='full'] .cybered-hero-name {
    display: inline-block;
    max-width: min(36rem, 100%);
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  .band-page-cybered:not([data-hx-mode])[data-hero-desktop-fit='full'] .cybered-intro {
    padding: 0.7rem 2rem 0.15rem;
  }

  .band-page-cybered:not([data-hx-mode])[data-hero-desktop-fit='full'] .cybered-main-sections {
    padding-top: 0.55rem;
  }

  .band-page-cybered:not([data-hx-mode])[data-hero-desktop-fit='full'] .cybered-continue-slot {
    margin-bottom: 0;
  }

  .band-page-cybered:not([data-hx-mode])[data-hero-desktop-fit='full'] .cybered-continue-slot:has(.continue-chip) {
    margin-bottom: 0.75rem;
  }
}

/* Text Glow Effect */
.cybered-text-glow {
  text-shadow: 0 0 12px rgba(168, 85, 247, 0.3),
               0 0 24px rgba(168, 85, 247, 0.15);
}

.cybered-play-button {
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.35);
}

/* Platform Card Hover Effects */
.cybered-platform-card {
  position: relative;
  overflow: hidden;
}

.cybered-platform-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.1), transparent);
  transition: left 0.5s;
}

.cybered-platform-card:hover::before {
  left: 100%;
}

/* Event Card Button */
.cybered-event-btn {
  position: relative;
  overflow: hidden;
}

.cybered-event-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.cybered-event-btn:active::after {
  width: 300px;
  height: 300px;
}

/* Action Button Premium Feel */
.cybered-action-btn {
  backdrop-filter: blur(10px);
}

/* Fan Capture Area */
.cybered-fan-capture {
  position: relative;
}

.cybered-fan-capture::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent);
}

/* Website Card Special Effect */
.cybered-website-card {
  position: relative;
}

.cybered-website-card::after {
  content: '↗';
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 12px;
  color: rgba(168, 85, 247, 0.4);
  transition: all 0.3s;
}

.cybered-website-card:hover::after {
  color: rgba(168, 85, 247, 0.8);
  transform: translateX(2px) translateY(-2px);
}

/* Smooth Transitions */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .cybered-hero :deep(*),
  .fq-reveal :deep(*) {
    animation: none !important;
    transition: none !important;
  }
}

.band-page-cybered.is-motion-settled :deep(h1),
.band-page-cybered.is-motion-settled :deep(.fq-reveal) {
  opacity: 1;
}

/*
 * polish-test is the live Cybered profile craft (promoted from the design lab).
 * Do not target FanCaptureSection / .fan-capture-* here.
 */
.band-page-cybered[data-profile-variant='polish-test'] {
  background: #050506;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-content-card {
  background-color: rgba(7, 8, 10, 0.92);
  border-color: rgba(255, 255, 255, 0.04);
  border-top-color: transparent;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-main-sections {
  padding-bottom: 0.2rem;
}

.band-page-cybered[data-profile-variant='polish-test'] section > h3 {
  font-weight: 650;
  letter-spacing: 0.16em;
  color: rgba(255, 255, 255, 0.38);
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-website-section > h3,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-streaming-section > h3,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-social-section > h3,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-custom-links-section > h3 {
  font-weight: 650;
  letter-spacing: 0.16em;
  color: #E8E8EC;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-streaming-section .space-y-3 > :not([hidden]) ~ :not([hidden]),
.band-page-cybered[data-profile-variant='polish-test'] .cybered-social-section .space-y-3 > :not([hidden]) ~ :not([hidden]),
.band-page-cybered[data-profile-variant='polish-test'] .cybered-custom-links-section .space-y-3 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 0.58rem;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-social-reveal {
  margin-top: 2.05rem;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card {
  background: #0D0F13;
  background-image: none;
  border-color: rgba(255, 255, 255, 0.065);
  border-radius: 1rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card::before,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card::after {
  display: none;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card .w-8.h-8,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card .w-8.h-8 {
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.65rem;
  background: #181B22;
  overflow: hidden;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card .w-8.h-8 img,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card .w-8.h-8 svg {
  display: block;
  max-width: 1.15rem;
  max-height: 1.15rem;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card span,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card .text-white {
  font-weight: 600;
  letter-spacing: -0.011em;
  color: #F5F5F6;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card .text-white\/50 {
  color: rgba(245, 245, 246, 0.58);
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card > svg:last-child,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card > svg:last-child {
  width: 1.05rem;
  height: 1.05rem;
  color: rgba(245, 245, 246, 0.30);
  transition: transform 180ms ease, opacity 180ms ease, color 180ms ease;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-merch-row {
  color: inherit;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-fan-capture-slot {
  margin-top: 1.75rem;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-actions-wrap {
  margin-top: clamp(1.25rem, 1.125rem + 0.5vw, 1.5rem);
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: clamp(1.5rem, 1.25rem + 1vw, 2.25rem);
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card:active {
  background: #16191F;
}

@media (min-width: 1024px) {
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card {
    background: #0D0F13;
    border-color: rgba(255, 255, 255, 0.065);
  }
}

@media (hover: hover) and (min-width: 1024px) {
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card:hover,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card:hover {
    background: #16191F;
    background-image: none;
    border-color: rgba(255, 255, 255, 0.13);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card:hover span,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card:hover .text-white {
    color: #F5F5F6;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card:hover > svg:last-child,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card:hover > svg:last-child {
    transform: translateX(3px);
    opacity: 0.85;
    color: rgba(245, 245, 246, 0.30);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card:hover .text-white\/50 {
    color: rgba(245, 245, 246, 0.58);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card:hover .w-8.h-8,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card:hover .w-8.h-8 {
    background: #181B22;
  }
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card:focus-visible,
.band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card:focus-visible {
  outline: none;
  background: #16191F;
  border-color: rgba(57, 213, 255, 0.55);
  box-shadow: 0 0 0 2px rgba(57, 213, 255, 0.2);
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions) {
  column-gap: 0.5rem;
  row-gap: 0;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio) {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-areas: 'message follow share';
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn) {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 4.35rem;
  padding: 0.72rem 0.28rem;
  background: #18191f;
  border-color: rgba(255, 255, 255, 0.15);
  border-radius: 0.95rem;
  color: #f4f6f8;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: -0.012em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-follow:not(.is-followed)) {
  background: #ECEEF2;
  border-color: transparent;
  color: #0c0d12;
  box-shadow: none;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-share) {
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(244, 246, 248, 0.84);
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .artist-actions__icon),
.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .artist-actions__icon-wrap) {
  width: 1.42rem;
  height: 1.42rem;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .is-message) {
  flex-direction: column;
  justify-content: center;
  gap: 0.42rem;
  min-height: 4.35rem;
  padding: 0.72rem 0.28rem;
  font-size: 0.8125rem;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .is-message .artist-actions__msg-copy) {
  align-items: center;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .is-message .artist-actions__icon-wrap) {
  background: transparent;
  border: 0;
  border-radius: 0;
  color: #39d5ff;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .is-message .artist-actions__icon) {
  width: 1.42rem;
  height: 1.42rem;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .artist-actions__chevron) {
  display: none;
}

@media (max-width: 639px) {
  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn),
  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .is-message) {
    min-height: 3.85rem;
    padding: 0.55rem 0.12rem;
    font-size: 0.75rem;
    border-radius: 0.85rem;
  }
}

@media (hover: hover) and (min-width: 1024px) {
  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-message.is-accent:hover),
  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-message.is-accent:focus-visible),
  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-share:hover) {
    background: #1d1e27;
    border-color: rgba(255, 255, 255, 0.22);
    color: #f7f9fc;
  }

  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-follow:not(.is-followed):hover) {
    background: #ffffff;
    border-color: transparent;
    color: #0c0d12;
  }

  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .is-message.is-accent:hover .artist-actions__icon-wrap),
  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions.is-trio .is-message.is-accent:focus-visible .artist-actions__icon-wrap) {
    color: #5ee0ff;
    background: transparent;
    border: 0;
  }
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-followed) {
  background: #15181a;
  border-color: rgba(69, 227, 174, 0.28);
  color: #e7fbf4;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-followed .artist-actions__icon) {
  color: #45e3ae;
}

.band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn:focus-visible) {
  outline: 2px solid rgba(139, 108, 255, 0.7);
  outline-offset: 2px;
  box-shadow: none;
}

/*
 * AP.D2 — desktop-only surface pass.
 * Mobile polish-test colors and approved geometry stay untouched.
 */
@media (min-width: 1024px) {
  .band-page-cybered[data-profile-variant='polish-test'] {
    background: var(--faneqo-obsidian, #050608);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-hero-fade--base {
    background-image: linear-gradient(
      to top,
      #050608 0%,
      #050608 8%,
      rgba(5, 6, 8, 0.86) 22%,
      rgba(5, 6, 8, 0.48) 40%,
      rgba(5, 6, 8, 0.16) 55%,
      rgba(5, 6, 8, 0.04) 68%,
      transparent 80%
    );
    background-color: transparent;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-hero-fade--veil,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-hero-fade--foot {
    background-image: none;
    background-color: transparent;
    opacity: 0;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-content-card {
    background: var(--faneqo-obsidian, #050608);
    background-color: var(--faneqo-obsidian, #050608);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-color: transparent;
    box-shadow: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-hero-name {
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.72);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-song-card,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-event-card {
    background: var(--faneqo-raised, #0B0E14);
    background-image: none;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: none;
    backdrop-filter: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-song-card {
    border-color: rgba(255, 255, 255, 0.11);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card .w-8.h-8,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card .w-8.h-8 {
    background: #181B22;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-main-sections .aspect-video {
    background: #0B0E14;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-play-button {
    background: #161822;
    background-image: none;
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: none;
    color: #f7f9fc;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-event-btn {
    background: linear-gradient(
      90deg,
      rgba(76, 166, 255, 0.24),
      rgba(57, 213, 255, 0.2),
      rgba(69, 227, 174, 0.18)
    );
    border-color: rgba(57, 213, 255, 0.32);
    color: #f7f9fc;
    box-shadow: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn) {
    background: var(--faneqo-raised, #0B0E14);
    border-color: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.88);
    box-shadow: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-follow:not(.is-followed)) {
    background: #ECEEF2;
    border-color: transparent;
    color: #0c0d12;
    box-shadow: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-followed) {
    background: rgba(69, 227, 174, 0.08);
    border-color: rgba(69, 227, 174, 0.28);
    color: #e7fbf4;
  }

  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn:focus-visible) {
    outline: 2px solid rgba(139, 108, 255, 0.7);
    outline-offset: 2px;
    box-shadow: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-play-button:focus-visible,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-event-btn:focus-visible {
    outline: 2px solid rgba(57, 213, 255, 0.7);
    outline-offset: 2px;
    box-shadow: none;
  }
}

@media (hover: hover) and (min-width: 1024px) {
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-event-card:hover {
    background: #111218;
    background-image: none;
    border-color: rgba(255, 255, 255, 0.16);
    box-shadow: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-platform-card:hover .w-8.h-8,
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-website-card:hover .w-8.h-8 {
    background: #181B22;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-play-button:hover {
    background: #1c1e28;
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: none;
    transform: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-event-btn:hover {
    background: linear-gradient(
      90deg,
      rgba(76, 166, 255, 0.32),
      rgba(57, 213, 255, 0.28),
      rgba(69, 227, 174, 0.24)
    );
    border-color: rgba(57, 213, 255, 0.42);
    box-shadow: none;
    transform: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-message.is-accent:hover),
  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-share:hover) {
    background: #111218;
    border-color: rgba(255, 255, 255, 0.18);
    color: #f7f9fc;
  }

  .band-page-cybered[data-profile-variant='polish-test'] :deep(.artist-actions__btn.is-follow:not(.is-followed):hover) {
    background: #ffffff;
    border-color: transparent;
    color: #0c0d12;
  }
}

/* Deck fold keeps normal block flow: the stage relies on `mx-auto`, which
   shrink-to-fits (and overflows) the moment an ancestor becomes a flex box. */
.band-page-cybered.is-deck-fold {
  min-height: 0;
  overflow: hidden;
}

.band-page-cybered.is-deck-fold .cybered-hero-shell {
  min-height: 15.5rem;
  max-height: 19.5rem;
}

.band-page-cybered.is-deck-fold .cybered-hero-shell.cybered-hero--portrait,
.band-page-cybered.is-deck-fold .cybered-hero-shell.cybered-hero--deep {
  height: 17.5rem;
  min-height: 17.5rem;
  max-height: 17.5rem;
}

.band-page-cybered.is-deck-fold .cybered-main-sections {
  padding-top: 1.25rem;
  padding-bottom: 0;
}

.band-page-cybered.is-deck-fold .cybered-actions-wrap {
  margin-top: 1.5rem;
  padding-bottom: 1.5rem;
}

/* =======================================================================
 * LOCAL-ONLY HERO EXPERIMENT  (dev + ?heroExperiment=1)
 *
 * Every rule below is gated on BOTH:
 *   - a [data-hx-mode] attribute that only exists when the experiment is on
 *   - @media (min-width: 1024px)
 *
 * Nothing here can reach mobile or the public rendering path.
 * Delete this block and the markup/script marked "hero experiment" to revert.
 * ===================================================================== */

/* The experiment aside is inert until editorial desktop claims it. */
.cybered-hero-identity__aside {
  display: none;
}

@media (min-width: 1024px) {
  /* ---- Option A: Improved hero. Same layout, desktop-only framing. ----
     `!important` is required only because the canonical mobile framing is an
     inline style (higher specificity). Scoped to the experiment attribute. */
  .band-page-cybered[data-hx-mode='improved'] .cybered-hero-photo,
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='cinematic'] .cybered-hero-photo {
    object-fit: var(--hx-object-fit, cover) !important;
    object-position: var(--hx-object-position, 50% 50%) !important;
    transform: var(--hx-transform, none) !important;
    transform-origin: var(--hx-transform-origin, 50% 50%) !important;
  }

  /* Full photo: restrained near-black surround, no blurred duplicate. */
  .band-page-cybered[data-hx-mode='improved'][data-hx-fit='full'] .cybered-hero-shell {
    background: #040507;
  }

  /* Full photo only: sit the name on the same center axis as the contained
     photograph. Vertical placement stays on the existing fade. Fill Frame
     keeps the live left alignment. The fade rules above are not restated. */
  .band-page-cybered[data-hx-mode='improved'][data-hx-fit='full'] .cybered-hero-identity {
    text-align: center;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .band-page-cybered[data-hx-mode='improved'][data-hx-fit='full'] .cybered-hero-name {
    display: inline-block;
    max-width: min(36rem, 100%);
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  /* Improved desktop: close the stretch from name → intro → featured media.
     Hero height and fade stay as-is; this only trims reserved card padding. */
  .band-page-cybered[data-hx-mode='improved'] .cybered-intro {
    padding: 0.85rem 2rem 0.2rem;
  }
  .band-page-cybered[data-hx-mode='improved'][data-hx-intro='tagline'] .cybered-intro {
    padding-top: 0.4rem;
    padding-bottom: 0;
  }
  .band-page-cybered[data-hx-mode='improved'][data-hx-intro='tagline'] .cybered-intro .mt-3 {
    margin-top: 0;
  }
  .band-page-cybered[data-hx-mode='improved'][data-hx-intro='bio'] .cybered-intro {
    padding-top: 0.7rem;
    padding-bottom: 0.15rem;
  }
  .band-page-cybered[data-hx-mode='improved'][data-hx-intro='none'] .cybered-main-sections {
    padding-top: 0.35rem;
  }
  .band-page-cybered[data-hx-mode='improved'][data-hx-intro='tagline'] .cybered-main-sections,
  .band-page-cybered[data-hx-mode='improved'][data-hx-intro='bio'] .cybered-main-sections {
    padding-top: 0.55rem;
  }
  .band-page-cybered[data-hx-mode='improved'] .cybered-continue-slot {
    margin-bottom: 0;
  }
  .band-page-cybered[data-hx-mode='improved'] .cybered-continue-slot:has(.continue-chip) {
    margin-bottom: 0.75rem;
  }

  /* ---- Option B: Adaptive composition ---- */

  /* Panorama: never cut off edge band members. The image area takes the
     photograph's own proportions across the full stage width. */
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='panorama'] .cybered-hero-shell {
    height: auto;
    min-height: 0;
    max-height: none;
    aspect-ratio: var(--hx-src-ratio, 2.6);
    background: #040507;
  }
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='panorama'] .cybered-hero-photo {
    object-fit: contain !important;
    object-position: 50% 50% !important;
    transform: none !important;
  }

  /* Editorial: portrait / square photograph beside the identity.
     The hero shell becomes a grid and the EXISTING identity node is relocated
     into column 2 — so there is still exactly one <h1> in the document. */
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-shell {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(19rem, 0.95fr);
    align-items: center;
    column-gap: clamp(2rem, 3.5vw, 3.75rem);
    height: auto;
    min-height: 0;
    max-height: none;
    aspect-ratio: auto;
    overflow: visible;
    border-radius: 0;
    background: transparent;
    isolation: auto;
    margin-top: clamp(1.5rem, 2.5vw, 2.75rem);
  }

  /* Photograph: full proportions, meaningful size, its own quiet frame. */
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-motion {
    position: relative;
    inset: auto;
    grid-column: 1;
    width: 100%;
    height: auto;
    aspect-ratio: var(--hx-src-ratio, 0.8);
    max-height: 41rem;
    justify-self: end;
    border-radius: 1.25rem;
    overflow: hidden;
    background: #040507;
  }
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-photo {
    object-fit: contain !important;
    object-position: 50% 50% !important;
    transform: none !important;
  }

  /* The photograph is no longer behind the type, so the scrims must go. */
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-overlay,
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-fade {
    display: none;
  }

  /* Relocate the existing identity block into column 2. */
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-identity {
    position: static;
    grid-column: 2;
    inset: auto;
    bottom: auto;
    padding: 0;
    max-width: 30rem;
  }
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-name {
    font-size: clamp(2.75rem, 3.4vw, 4rem);
    line-height: 1.04;
    letter-spacing: -0.028em;
    text-shadow: none;
  }

  /* Badges row belongs to the cinematic overlay; genre moves to the column. */
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-badges {
    display: none;
  }

  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-identity__aside {
    display: grid;
    gap: 1.15rem;
    margin-top: 1.5rem;
  }
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-identity__genre {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 650;
    letter-spacing: 0.17em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.42);
    order: -1;
  }
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-hero-identity__tagline {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.62);
  }

  /* Exactly one ArtistPageActions is visible/focusable at any viewport. */
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-close__ways {
    display: none;
  }

  /* The content card no longer tucks under a full-bleed photo. */
  .band-page-cybered[data-hx-mode='adaptive'][data-hx-presentation='editorial'] .cybered-content-card {
    margin-top: clamp(1.75rem, 3vw, 3rem);
  }
}

.cybered-close {
  position: relative;
  isolation: isolate;
  container-name: artist-close;
  container-type: inline-size;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  margin-top: 0;
  margin-bottom: 0;
  padding: clamp(3.25rem, 7vw, 4.75rem) 0 clamp(3.75rem, 8vw, 5.5rem);
  border: 0;
  border-radius: 0;
  overflow: visible;
  background: transparent;
  box-shadow: none;
}

.cybered-close__inner {
  width: min(100%, 48rem);
  margin-inline: auto;
  padding-inline: calc(0.75rem + 1.5rem);
}

@media (min-width: 640px) {
  .cybered-close__inner {
    padding-inline: calc(1rem + 1.5rem);
  }
}

@media (min-width: 1024px) {
  .cybered-close__inner {
    width: min(100%, clamp(52rem, 68vw, 62rem));
  }
}

.cybered-close > * {
  position: relative;
  z-index: 1;
}

.cybered-close .cybered-fan-capture-slot {
  margin: 0;
  padding: 0;
}

.cybered-close:not(:has(.fan-capture-section)) .fq-reveal {
  display: none;
}

.cybered-close__ways {
  margin-top: 0.15rem;
}

.cybered-close:has(.fan-capture-section) .cybered-close__ways {
  margin-top: 2rem;
  padding-top: 0;
  border-top: 0;
}

.cybered-close__ways-label {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0 0 0.7rem;
  color: rgba(246, 243, 238, 0.48);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  line-height: 1;
  text-transform: uppercase;
}

.cybered-close__ways-label::after {
  content: none;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-close .cybered-fan-capture-slot {
  margin-top: 0;
  padding: 0;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close) {
  display: flex;
  grid-template-areas: none;
  grid-template-columns: none;
  column-gap: 0.45rem;
  row-gap: 0;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__btn),
.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message) {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.38rem;
  min-height: 44px;
  padding: 0.5rem 0.65rem;
  border-radius: 999px;
  background: transparent;
  border-color: rgba(246, 243, 238, 0.14);
  color: rgba(246, 243, 238, 0.82);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.012em;
  box-shadow: none;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-follow:not(.is-followed)) {
  background: #f4f1ea;
  border-color: transparent;
  color: #14151c;
  box-shadow: none;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-follow.is-followed) {
  background: rgba(246, 243, 238, 0.08);
  border-color: rgba(246, 243, 238, 0.2);
  color: #f7f4ef;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-follow.is-followed .artist-actions__icon) {
  color: inherit;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__icon),
.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__icon-wrap),
.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message .artist-actions__icon),
.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message .artist-actions__icon-wrap),
.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message.is-accent .artist-actions__icon-wrap) {
  width: 1rem;
  height: 1rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
}

.band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__msg-copy) {
  flex-direction: row;
  align-items: center;
}

@container artist-close (min-width: 40rem) {
  .cybered-close:has(.fan-capture-section) .cybered-close__ways {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
    margin-top: 1.2rem;
    padding-top: 1rem;
  }

  .cybered-close__ways-label {
    margin: 0;
  }
}

@media (max-width: 639px) {
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__btn),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message) {
    min-height: 50px;
  }
}

@media (hover: hover) {
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-message.is-accent:hover),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-message.is-accent:focus-visible),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-share:hover),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-message.is-accent:hover .artist-actions__icon-wrap),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-message.is-accent:focus-visible .artist-actions__icon-wrap) {
    background: rgba(246, 243, 238, 0.06);
    border-color: rgba(246, 243, 238, 0.24);
    color: #f7f4ef;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-follow:not(.is-followed):hover) {
    background: #fffcf7;
    border-color: transparent;
    color: #14151c;
  }
}

/* Phone actions. Desktop container (min-width: 40rem) keeps the approved pills. */
@container artist-close (max-width: 39.99rem) {
  .cybered-close__ways-label {
    display: none;
  }

  .cybered-close:has(.fan-capture-section) .cybered-close__ways {
    margin-top: 1.75rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(246, 243, 238, 0.1);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close) {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;
    width: 100%;
    gap: 0.5rem;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__btn),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message) {
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;
    min-height: 54px;
    padding: 0.45rem 0.3rem;
    border-radius: 0.8rem;
    border: 1px solid rgba(246, 243, 238, 0.14);
    background: rgba(246, 243, 238, 0.04);
    color: rgba(246, 243, 238, 0.9);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.1;
    gap: 0.22rem;
    box-shadow: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__btn > span) {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__icon),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__icon-wrap),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message .artist-actions__icon),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message .artist-actions__icon-wrap) {
    width: 1.125rem;
    height: 1.125rem;
    flex: 0 0 auto;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-follow:not(.is-followed)) {
    background: rgba(246, 243, 238, 0.09);
    border-color: rgba(246, 243, 238, 0.24);
    color: #f7f4ef;
    box-shadow: none;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-follow.is-followed) {
    background: rgba(246, 243, 238, 0.05);
    border-color: rgba(246, 243, 238, 0.16);
    color: rgba(246, 243, 238, 0.78);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__btn:active:not(:disabled)) {
    background: rgba(246, 243, 238, 0.12);
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-follow:not(.is-followed):hover),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .is-follow:not(.is-followed):active) {
    background: rgba(246, 243, 238, 0.14);
    border-color: rgba(246, 243, 238, 0.3);
    color: #f7f4ef;
  }
}

@container artist-close (max-width: 21.25rem) {
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close) {
    flex-direction: column;
    gap: 0.5rem;
  }

  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close .artist-actions__btn),
  .band-page-cybered[data-profile-variant='polish-test'] .cybered-close :deep(.artist-actions.is-close.is-trio .is-message) {
    flex: 1 1 auto;
    flex-direction: row;
    width: 100%;
    min-height: 50px;
    gap: 0.4rem;
  }
}

</style>
