<template>
  <div>
    <div v-if="loadingData" class="loading-container">
      <div class="spinner"></div>
    </div>

    <div
      v-else-if="notFound"
      class="bg-black w-screen min-h-[60vh] mx-auto pt-[var(--header-height)] fade-in"
    >
      <div class="max-w-5xl mx-auto px-6 py-10">
        <div class="text-white text-2xl font-bold">Band not found</div>
        <div class="text-white/70 mt-2">
          Check the link and try again.
        </div>
      </div>
    </div>

    <!-- Compact Style -->
    <div
      v-else-if="isCompactStyle"
      class="bg-black w-screen mx-auto pt-[var(--header-height)] fade-in"
    >
      <BandPageCompact
        :band="band.data"
        :upcoming-events="upcomingEvents"
        :hidden-links="hiddenLinks"
        :enabled-payment-buttons="enabledPaymentButtons"
        :followable-platforms="followablePlatforms"
        @play-song="onSongPlay"
        @link-click="(link) => handleClick(band.data.id, link.name, link.url, { linkUrl: link.url, linkLabel: link.label })"
        @view-event="(event) => router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
        @quick-tip="(amount) => handleQuickTip(amount)"
        @checkout="handleSupportModuleCheckout"
        @follow="onFollowAction"
        @message="onMessageArtist"
        @save="onToggleSaveBand"
        @share="openShareModal"
        :message-label="messageActionLabel"
        :message-pending="messageActionPending"
        :message-disabled="messageActionDisabled"
        :saved="isCurrentBandSaved"
        :followed="isNativeFollowing"
        :follow-busy="followBusy"
        :follow-error="followError"
      >
        <template #audio-player>
          <!-- Elite Spotify Widget (new oEmbed flow) -->
          <div v-if="isEliteSpotifyEmbed" class="w-full">
            <EliteSpotifyEmbedWidget
              :spotify-url="band.data.singlesong.spotifyUrl"
              :title="band.data.singlesong.spotifyOembedTitle || band.data.singlesong.title"
              :thumbnail-url="band.data.singlesong.spotifyOembedThumbnailUrl"
              :type="band.data.singlesong.spotifyOembedType || 'track'"
              :iframe-html="band.data.singlesong.spotifyOembedHtml"
              :artist-name="band.data.name"
              @spotify-click="(e) => handleClick(band.data.id, 'spotify_embed_click', e.url)"
              @spotify-play="() => trackMediaPlay(band.data.id, 'song', 'Spotify Embed Play')"
            />
          </div>

          <!-- Legacy Embedded Track (iframe paste) -->
          <div
            v-else-if="band.data.singlesong?.isEmbed && safeEmbedHtml"
            class="w-full"
          >
            <div
              class="relative w-full rounded-xl overflow-hidden"
              :class="[embedHeightClass, { 'embed-shake': embedShake }]"
            >
              <div
                ref="embedPlayerWrapperEl"
                class="absolute inset-0 w-full h-full"
                v-html="safeEmbedHtml"
              ></div>

              <div
                v-if="!hasTrackedEmbedClick"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black/35 text-white text-sm font-semibold"
                @click.prevent.stop="onEmbedOverlayTap"
              >
                Tap to play
              </div>

              <div
                v-if="showEmbedTapAgainHint"
                class="absolute inset-x-0 bottom-2 z-20 flex justify-center pointer-events-none"
              >
                <div class="px-3 py-1 rounded-md bg-black/70 text-white text-xs">
                  Tap again to play
                </div>
              </div>
            </div>
          </div>

          <!-- Raw Audio -->
          <div v-else class="w-full">
            <AudioPlayer
              :album="formatSingleSong(band.data.singlesong)"
              :placeholderImage="'/placeholder-image.svg'"
              @play="onSongPlay"
              class="rounded-xl"
            />
          </div>
        </template>

        <template #video-player>
          <div
            v-if="!isVideoPlaying"
            @click="playVideo"
            class="relative w-full overflow-hidden bg-black cursor-pointer rounded-xl embed-container"
          >
            <img
              :src="singleVideoThumbnail"
              :alt="`${band.data.name} video thumbnail`"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-black/30"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="h-12 w-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15"
              >
                <svg viewBox="0 0 24 24" class="h-6 w-6 text-white" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div v-else class="embed-container rounded-xl overflow-hidden">
            <iframe
              :src="singleVideoEmbedUrl + '?autoplay=1'"
              allow="autoplay; encrypted-media; fullscreen"
              allowfullscreen
            ></iframe>
          </div>
        </template>
        
        <template #fan-capture>
          <FanCaptureSection
            v-if="band?.data?.id && (band.data.fanCaptureEnabled !== false)"
            :band-id="band.data.id"
            :band-slug="currentBandSlug"
            :show-mode-enabled="isShowModeLive"
            :show-mode-title="band.data.showModeTitle || ''"
            :show-mode-venue="band.data.showModeVenue || ''"
            :show-mode-city="band.data.showModeCity || ''"
            :event-id="band.data.showModeEventId || null"
            :campaign-id="band.data.showModeCampaignId || null"
            capture-surface="band_page"
            :artist-name="band.data.name || ''"
            :headline="fanCaptureDisplayCopy.headline"
            :message="fanCaptureDisplayCopy.message"
            :button-label="fanCaptureDisplayCopy.buttonLabel"
            :success-message="fanCaptureDisplayCopy.successMessage"
            :followed="isNativeFollowing"
            :subscribed="isFanListContactable"
            :already-checked-in="hasCheckedIn"
            :attendance-resolved="attendanceResolved"
            @subscribed="onFanSubscribed"
            @open-check-in-modal="openCheckInModal"
          />
        </template>
      </BandPageCompact>
      <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
      <!--
      <div class="w-full px-6 mt-8 md:max-w-[80vw] md:mx-auto">
        <ArtistUpdatesSection
          :band-id="band?.data?.id"
          :band-slug="currentBandSlug"
          :band-name="band?.data?.name || ''"
        />
      </div>
      -->
      
      <!-- Fan Moment Section for compact - TEMPORARILY DISABLED FOR UI IMPROVEMENTS
      <client-only>
        <FanMomentSection
          v-if="band?.data?.id"
          ref="fanMomentRef"
          :band-id="band.data.id"
          :band-slug="currentBandSlug"
          :band-name="band.data.name || 'This Artist'"
          :band-image-url="band.data.bandImg?.url || null"
          :is-band-name-in-logo="band.data.isBandNameInLogo || false"
          :pulse-data="pulseData"
        />
      </client-only>
      -->

      <ArtistPageSignature />

    </div>

    <!-- Cybered Style -->
    <div
      v-else-if="isCyberedStyle"
      class="artist-page-canvas w-screen mx-auto pt-[var(--header-height)] fade-in"
    >
      <BandPageCybered
        :band="band.data"
        :upcoming-events="upcomingEvents"
        :hidden-links="hiddenLinks"
        :enabled-payment-buttons="enabledPaymentButtons"
        :followable-platforms="followablePlatforms"
        :custom-buttons="customButtons"
        visual-variant="polish-test"
        @play-song="onSongPlay"
        @play-video="playVideo"
        @link-click="(link) => handleClick(band.data.id, link.name, link.url, { linkUrl: link.url, linkLabel: link.label })"
        @view-event="(event) => router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
        @quick-tip="(amount) => handleQuickTip(amount)"
        @checkout="handleSupportModuleCheckout"
        @follow="onFollowAction"
        @message="onMessageArtist"
        @save="onToggleSaveBand"
        @share="shareDrawerOpen = true"
        :message-label="messageActionLabel"
        :message-pending="messageActionPending"
        :message-disabled="messageActionDisabled"
        :saved="isCurrentBandSaved"
        :followed="isNativeFollowing"
        :follow-busy="followBusy"
        :follow-error="followError"
      >
        <template #fan-capture>
          <FanCaptureSection
            v-if="band?.data?.id && (band.data.fanCaptureEnabled !== false)"
            :band-id="band.data.id"
            :band-slug="currentBandSlug"
            :show-mode-enabled="isShowModeLive"
            :show-mode-title="band.data.showModeTitle || ''"
            :show-mode-venue="band.data.showModeVenue || ''"
            :show-mode-city="band.data.showModeCity || ''"
            :event-id="band.data.showModeEventId || null"
            :campaign-id="band.data.showModeCampaignId || null"
            capture-surface="band_page"
            :variant="isPublicationBand ? 'publication' : 'artist'"
            composition="close"
            :artist-image="band.data.bandImg?.url || ''"
            :image-focal-x="band.data.cyberedImagePositionX ?? 50"
            :image-focal-y="band.data.cyberedImagePositionY ?? 50"
            :artist-name="band.data.name || ''"
            :headline="fanCaptureDisplayCopy.headline"
            :message="fanCaptureDisplayCopy.message"
            :button-label="fanCaptureDisplayCopy.buttonLabel"
            :success-message="fanCaptureDisplayCopy.successMessage"
            :featured-gallery="band.data.featuredGallery || null"
            :followed="isNativeFollowing"
            :subscribed="isFanListContactable"
            :already-checked-in="hasCheckedIn"
            :attendance-resolved="attendanceResolved"
            @subscribed="onFanSubscribed"
            @open-check-in-modal="openCheckInModal"
          />
        </template>
      </BandPageCybered>
      <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
      <!--
      <div class="w-full px-6 mt-8 md:max-w-[80vw] md:mx-auto">
        <ArtistUpdatesSection
          :band-id="band?.data?.id"
          :band-slug="currentBandSlug"
          :band-name="band?.data?.name || ''"
        />
      </div>
      -->
      
      <!-- Fan Moment Section for cybered - TEMPORARILY DISABLED FOR UI IMPROVEMENTS
      <client-only>
        <FanMomentSection
          v-if="band?.data?.id"
          ref="fanMomentRef"
          :band-id="band.data.id"
          :band-slug="currentBandSlug"
          :band-name="band.data.name || 'This Artist'"
          :band-image-url="band.data.bandImg?.url || null"
          :is-band-name-in-logo="band.data.isBandNameInLogo || false"
          :pulse-data="pulseData"
        />
      </client-only>
      -->

      <ArtistPageSignature />

      <!-- Share Drawer -->
      <client-only>
        <ShareDrawer
          v-if="band?.data?.id"
          :is-open="shareDrawerOpen"
          :band-id="band.data.id"
          :band-slug="currentBandSlug"
          :band-name="band.data.name || 'This Artist'"
          :band-image-url="band.data.bandImg?.url || null"
          :is-band-name-in-logo="band.data.isBandNameInLogo || false"
          @close="shareDrawerOpen = false"
        />
      </client-only>
    </div>

    <!-- Bold Style -->
    <div
      v-else-if="isBoldStyle"
      class="bg-black w-screen mx-auto pt-[var(--header-height)] fade-in"
    >
      <BandPageBold
        :band="band.data"
        :upcoming-events="upcomingEvents"
        :hidden-links="hiddenLinks"
        :enabled-payment-buttons="enabledPaymentButtons"
        :followable-platforms="followablePlatforms"
        @play-song="onSongPlay"
        @link-click="(link) => handleClick(band.data.id, link.name, link.url, { linkUrl: link.url, linkLabel: link.label })"
        @view-event="(event) => router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
        @quick-tip="(amount) => handleQuickTip(amount)"
        @checkout="handleSupportModuleCheckout"
        @follow="onFollowAction"
        @message="onMessageArtist"
        @save="onToggleSaveBand"
        @share="shareDrawerOpen = true"
        :message-label="messageActionLabel"
        :message-pending="messageActionPending"
        :message-disabled="messageActionDisabled"
        :saved="isCurrentBandSaved"
        :followed="isNativeFollowing"
        :follow-busy="followBusy"
        :follow-error="followError"
      >
        <template #audio-player>
          <!-- Elite Spotify Widget (new oEmbed flow) -->
          <div v-if="isEliteSpotifyEmbed" class="w-full">
            <EliteSpotifyEmbedWidget
              :spotify-url="band.data.singlesong.spotifyUrl"
              :title="band.data.singlesong.spotifyOembedTitle || band.data.singlesong.title"
              :thumbnail-url="band.data.singlesong.spotifyOembedThumbnailUrl"
              :type="band.data.singlesong.spotifyOembedType || 'track'"
              :iframe-html="band.data.singlesong.spotifyOembedHtml"
              :artist-name="band.data.name"
              @spotify-click="(e) => handleClick(band.data.id, 'spotify_embed_click', e.url)"
              @spotify-play="() => trackMediaPlay(band.data.id, 'song', 'Spotify Embed Play')"
            />
          </div>

          <!-- Legacy Embedded Track (iframe paste) -->
          <div
            v-else-if="band.data.singlesong?.isEmbed && safeEmbedHtml"
            class="w-full"
          >
            <div
              class="relative w-full rounded-xl overflow-hidden"
              :class="[embedHeightClass, { 'embed-shake': embedShake }]"
            >
              <div
                ref="embedPlayerWrapperEl"
                class="absolute inset-0 w-full h-full"
                v-html="safeEmbedHtml"
              ></div>

              <div
                v-if="!hasTrackedEmbedClick"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black/35 text-white text-sm font-semibold"
                @click.prevent.stop="onEmbedOverlayTap"
              >
                Tap to play
              </div>

              <div
                v-if="showEmbedTapAgainHint"
                class="absolute inset-x-0 bottom-2 z-20 flex justify-center pointer-events-none"
              >
                <div class="px-3 py-1 rounded-md bg-black/70 text-white text-xs">
                  Tap again to play
                </div>
              </div>
            </div>
          </div>

          <!-- Raw Audio -->
          <div v-else class="w-full">
            <AudioPlayer
              :album="formatSingleSong(band.data.singlesong)"
              :placeholderImage="'/placeholder-image.svg'"
              @play="onSongPlay"
              class="rounded-xl"
            />
          </div>
        </template>

        <template #video-player>
          <div
            v-if="!isVideoPlaying"
            @click="playVideo"
            class="relative w-full overflow-hidden bg-black cursor-pointer rounded-xl embed-container"
          >
            <img
              :src="singleVideoThumbnail"
              :alt="`${band.data.name} video thumbnail`"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-black/30"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="h-12 w-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15"
              >
                <svg viewBox="0 0 24 24" class="h-6 w-6 text-white" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div v-else class="embed-container rounded-xl overflow-hidden">
            <iframe
              :src="singleVideoEmbedUrl + '?autoplay=1'"
              allow="autoplay; encrypted-media; fullscreen"
              allowfullscreen
            ></iframe>
          </div>
        </template>
        
        <template #fan-capture>
          <FanCaptureSection
            v-if="band?.data?.id && (band.data.fanCaptureEnabled !== false)"
            :band-id="band.data.id"
            :band-slug="currentBandSlug"
            :show-mode-enabled="isShowModeLive"
            :show-mode-title="band.data.showModeTitle || ''"
            :show-mode-venue="band.data.showModeVenue || ''"
            :show-mode-city="band.data.showModeCity || ''"
            :event-id="band.data.showModeEventId || null"
            :campaign-id="band.data.showModeCampaignId || null"
            capture-surface="band_page"
            :artist-name="band.data.name || ''"
            :headline="fanCaptureDisplayCopy.headline"
            :message="fanCaptureDisplayCopy.message"
            :button-label="fanCaptureDisplayCopy.buttonLabel"
            :success-message="fanCaptureDisplayCopy.successMessage"
            :followed="isNativeFollowing"
            :subscribed="isFanListContactable"
            :already-checked-in="hasCheckedIn"
            :attendance-resolved="attendanceResolved"
            @subscribed="onFanSubscribed"
            @open-check-in-modal="openCheckInModal"
          />
        </template>
      </BandPageBold>
      <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
      <!--
      <div class="w-full px-6 mt-8 md:max-w-[80vw] md:mx-auto">
        <ArtistUpdatesSection
          :band-id="band?.data?.id"
          :band-slug="currentBandSlug"
          :band-name="band?.data?.name || ''"
        />
      </div>
      -->
      
      <!-- Fan Moment Section for bold - TEMPORARILY DISABLED FOR UI IMPROVEMENTS
      <client-only>
        <FanMomentSection
          v-if="band?.data?.id"
          ref="fanMomentRef"
          :band-id="band.data.id"
          :band-slug="currentBandSlug"
          :band-name="band.data.name || 'This Artist'"
          :band-image-url="band.data.bandImg?.url || null"
          :is-band-name-in-logo="band.data.isBandNameInLogo || false"
          :pulse-data="pulseData"
        />
      </client-only>
      -->

      <ArtistPageSignature />

      <!-- Share Drawer -->
      <client-only>
        <ShareDrawer
          v-if="band?.data?.id"
          :is-open="shareDrawerOpen"
          :band-id="band.data.id"
          :band-slug="currentBandSlug"
          :band-name="band.data.name || 'This Artist'"
          :band-image-url="band.data.bandImg?.url || null"
          :is-band-name-in-logo="band.data.isBandNameInLogo || false"
          @close="shareDrawerOpen = false"
        />
      </client-only>
    </div>

    <!-- Default Style -->
    <div
      v-else
      class="bg-black w-screen h-[35vh] md:h-[60vh] mx-auto pt-[var(--header-height)] fade-in"
    >
      <div
        v-if="paymentBannerVisible"
        class="w-full px-4 md:px-8 py-3 bg-purple-900/60 text-white border-b border-purple-500/40"
      >
        <div class="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div class="text-sm md:text-base">
            <div class="font-semibold">
              {{ paymentBannerTitle }}
            </div>
            <div v-if="paymentBannerDetail" class="text-white/90 mt-1">
              {{ paymentBannerDetail }}
            </div>
          </div>
          <button
            type="button"
            class="text-white/80 hover:text-white text-lg leading-none"
            @click="dismissPaymentBanner"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Hero Section - Taller, Full Width -->
      <div class="relative w-full h-[50vh] md:h-[75vh]">
        <FaneqoArtistHeroImage
          v-if="band.data.bandImg"
          :image="band.data.bandImg"
          surface="default"
          :focal-x="band.data.cyberedImagePositionX ?? 50"
          :focal-y="band.data.cyberedImagePositionY ?? 50"
          :alt="`${band.data.name} image`"
          priority
        />

        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"></div>
      </div>

      <!-- Band Name -->
      <div
        v-if="!band.data.isBandNameInLogo"
        class="text-center text-white text-4xl font-bold mt-4"
      >
        {{ band.data.name }}
      </div>

      <!-- Bio & Tagline -->
      <div class="flex justify-center mt-4">
        <div class="text-center text-white max-w-5xl">
          <p
            v-if="band.data.bio"
            class="md:text-2xl leading-tight whitespace-pre-line"
          >
            {{ band.data.bio }}
          </p>
          <p
            v-if="band.data.biotagline"
            class="md:text-2xl leading-tight whitespace-pre-line mt-2"
          >
            {{ band.data.biotagline }}
          </p>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- SMART LINK LIVE SURFACE COMPONENTS -->
      <!-- Only shown when SMARTLINK_LIVE_SURFACE_ENABLED is true -->
      <!-- ============================================ -->

      <!-- V2: Show Day Header (only on SHOW_DAY mode) -->
      <div v-if="shouldShowShowDayHeader && upcomingEvents.length > 0" class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
        <ShowDayHeader
          :event="upcomingEvents[0]"
          :has-pay-entry="enabledPaymentButtons.length > 0"
          @tickets="(e) => handleClick(band.data.id, 'tickets', e.ticketLink)"
          @pay-entry="scrollToSupport"
        />
      </div>

      <!-- NOW Banner -->
      <div v-if="showNowBanner && nowBannerContent" class="w-full px-6 mt-6 md:max-w-[80vw] md:mx-auto">
        <NowBanner
          :state="nowBannerState"
          :content="nowBannerContent"
          @cta-click="handleNowBannerCta"
          @scroll-to="handleScrollTo"
          @share="shareDrawerOpen = true"
        />
      </div>

      <!-- V2: Moment Badges -->
      <div v-if="showMomentBadges" class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
        <MomentBadges
          :has-show-tonight="nowBannerState === 'SHOW_TONIGHT'"
          :is-on-tour="nowBannerState === 'ON_TOUR'"
          :has-new-release="nowBannerState === 'NEW_RELEASE'"
        />
      </div>

      <!-- Continue Chip (for returning visitors) -->
      <div v-if="showContinueChip" class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
        <ContinueChip
          ref="continueChipRef"
          :band-slug="currentBandSlug"
          @continue="handleContinueAction"
        />
      </div>

      <!-- Live Feed Micro-signals -->
      <div v-if="showLiveFeed && hasLiveFeedItems" class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
        <LiveFeed
          :feed-items="liveFeedItems"
          :primary-feed-item="primaryFeedItem"
          :has-feed-items="hasLiveFeedItems"
          display-mode="single"
        />
      </div>

      <!-- Main Content -->
      <div class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
        <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
        <!--
        <ArtistUpdatesSection
          :band-id="band?.data?.id"
          :band-slug="currentBandSlug"
          :band-name="band?.data?.name || ''"
        />
        -->
        <!-- Featured Song -->
        <section v-if="hasFeaturedSong && isSectionVisible('audio')" class="mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Featured Song
          </h2>

          <!-- Elite Spotify Widget (new oEmbed flow) -->
          <div v-if="isEliteSpotifyEmbed" class="w-full">
            <EliteSpotifyEmbedWidget
              :spotify-url="band.data.singlesong.spotifyUrl"
              :title="band.data.singlesong.spotifyOembedTitle || band.data.singlesong.title"
              :thumbnail-url="band.data.singlesong.spotifyOembedThumbnailUrl"
              :type="band.data.singlesong.spotifyOembedType || 'track'"
              :iframe-html="band.data.singlesong.spotifyOembedHtml"
              :artist-name="band.data.name"
              @spotify-click="(e) => handleClick(band.data.id, 'spotify_embed_click', e.url)"
              @spotify-play="() => trackMediaPlay(band.data.id, 'song', 'Spotify Embed Play')"
            />
          </div>

          <!-- Legacy Embedded Track (iframe paste) -->
          <div
            v-else-if="band.data.singlesong.isEmbed && safeEmbedHtml"
            class="w-full"
          >
            <div
              class="relative w-full rounded-lg overflow-hidden"
              :class="[embedHeightClass, { 'embed-shake': embedShake }]"
            >
              <div
                id="embedPlayerWrapper"
                ref="embedPlayerWrapperEl"
                class="absolute inset-0 w-full h-full"
                v-html="safeEmbedHtml"
              ></div>

              <div
                v-if="!hasTrackedEmbedClick"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black/35 text-white text-sm font-semibold"
                @click.prevent.stop="onEmbedOverlayTap"
              >
                Tap to play
              </div>

              <div
                v-if="showEmbedTapAgainHint"
                class="absolute inset-x-0 bottom-2 z-20 flex justify-center pointer-events-none"
              >
                <div class="px-3 py-1 rounded-md bg-black/70 text-white text-xs">
                  Tap again to play
                </div>
              </div>
            </div>
          </div>

          <!-- Raw Audio -->
          <div v-else class="w-full">
            <AudioPlayer
              :album="formatSingleSong(band.data.singlesong)"
              :placeholderImage="'/placeholder-image.svg'"
              @play="onSongPlay"
              class="rounded-lg"
            />
          </div>
        </section>

        <!-- Featured Video -->
        <section v-if="band.data.singlevideo?.youtubeid && isSectionVisible('video')" class="w-full mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Featured Video
          </h2>

          <div class="md:max-w-[640px]">
            <div
              v-if="!isVideoPlaying"
              @click="playVideo"
              class="relative w-full overflow-hidden bg-black cursor-pointer rounded-lg embed-container"
            >
              <img
                :src="singleVideoThumbnail"
                :alt="`${band.data.name} video thumbnail`"
                class="absolute inset-0 w-full h-full object-cover"
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

            <div v-else class="embed-container rounded-lg overflow-hidden">
              <iframe
                :src="singleVideoEmbedUrl + '?autoplay=1'"
                allow="autoplay; encrypted-media; fullscreen"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </section>

        <!-- Website Link -->
        <section v-if="band.data.websitelink && isSectionVisible('website')" class="mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-2">
            Website Link
          </h2>
          <a
            :href="band.data.websitelink"
            class="text-purple-500 text-xl"
            target="_blank"
            rel="noopener"
          >
            {{ band.data.websitelinktext || band.data.websitelink }}
          </a>
        </section>

        <!-- Dynamic Link Sections (ordered by layoutConfig.sections) -->
        <template v-for="section in orderedSections" :key="section.id">
          <!-- Custom Buttons -->
          <section v-if="section.id === 'customButtons' && section.enabled && customButtons.length > 0" class="mt-10">
            <div :class="buttonStyle === 'modern' ? 'space-y-2' : ''">
              <template v-for="(button, index) in customButtons" :key="button.id || index">
                <component
                  :is="isInternalUrl(button.url) ? 'NuxtLink' : 'a'"
                  :to="isInternalUrl(button.url) ? button.url : undefined"
                  :href="!isInternalUrl(button.url) ? button.url : undefined"
                  :target="!isInternalUrl(button.url) ? '_blank' : undefined"
                  :rel="!isInternalUrl(button.url) ? 'noopener noreferrer' : undefined"
                  @click="!isInternalUrl(button.url) && handleCustomButtonClick($event, button)"
                  :class="streamingButtonClasses"
                >
                  <div class="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <img 
                      v-if="button.customIcon?.url" 
                      :src="button.customIcon.url" 
                      :alt="button.title"
                      class="w-full h-full object-cover"
                    />
                    <PlatformIcon 
                      v-else 
                      :iconify="getCustomButtonIcon(button)" 
                      :alt="button.title"
                      class-name="w-5 h-5"
                      color="#c4b5fd"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <span :class="buttonStyle === 'modern' ? 'text-white font-medium' : 'text-white font-semibold text-lg md:text-xl'">{{ button.title }}</span>
                    <span v-if="button.subtitle" class="block text-white/50 text-sm truncate">{{ button.subtitle }}</span>
                  </div>
                </component>
              </template>
            </div>
          </section>

          <!-- Streaming Links -->
          <section v-if="section.id === 'streaming' && section.enabled && hasStreamingLinks" class="mt-10">
            <h3 v-if="buttonStyle === 'modern'" class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Streaming</h3>
            <h2 v-else class="text-2xl md:text-3xl font-bold text-white mb-4">Streaming Links</h2>
            <div :class="buttonStyle === 'modern' ? 'space-y-2' : ''">
              <template v-for="platform in orderedStreamingPlatforms" :key="platform.name">
                <a
                  v-if="band.data[platform.name] && !isLinkHidden(platform.name)"
                  :href="band.data[platform.name]"
                  @click.prevent="
                    handleClick(
                      band.data.id,
                      platform.name,
                      band.data[platform.name]
                    )
                  "
                  :class="streamingButtonClasses"
                >
                  <PlatformIcon
                    :existing-icon="platform.img"
                    :iconify="platform.iconify"
                    :alt="platform.label"
                    :class-name="buttonStyle === 'modern' ? 'w-6 h-6 shrink-0' : 'w-8 h-8 shrink-0'"
                  />
                  <span :class="buttonStyle === 'modern' ? 'text-white font-medium' : 'text-white font-semibold text-lg md:text-xl min-w-0 truncate'">{{ platform.label }}</span>
                </a>
              </template>
            </div>
          </section>

          <!-- Social Media -->
          <section v-if="section.id === 'social' && section.enabled && hasSocialLinks" class="mt-10">
            <h3 v-if="buttonStyle === 'modern'" class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Social</h3>
            <h2 v-else class="text-2xl md:text-3xl font-bold text-white mb-4">Social Media</h2>
            <div :class="buttonStyle === 'modern' ? 'space-y-2' : ''">
              <template v-for="platform in orderedSocialPlatforms" :key="platform.name">
                <a
                  v-if="band.data[platform.name] && !isLinkHidden(platform.name)"
                  :href="band.data[platform.name]"
                  @click.prevent="
                    handleClick(
                      band.data.id,
                      platform.name,
                      band.data[platform.name]
                    )
                  "
                  :class="streamingButtonClasses"
                >
                  <PlatformIcon
                    :existing-icon="platform.img"
                    :iconify="platform.iconify"
                    :alt="platform.label"
                    :class-name="buttonStyle === 'modern' ? 'w-6 h-6 shrink-0' : 'w-8 h-8 shrink-0'"
                  />
                  <span :class="buttonStyle === 'modern' ? 'text-white font-medium' : 'text-white font-semibold text-lg md:text-xl min-w-0 truncate'">{{ platform.label }}</span>
                </a>
              </template>
            </div>
          </section>

          <!-- Event Hubs -->
          <section v-if="section.id === 'eventHubs' && section.enabled && hasEventHubLinks" class="mt-10">
            <h3 v-if="buttonStyle === 'modern'" class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Event Hubs</h3>
            <h2 v-else class="text-2xl md:text-3xl font-bold text-white mb-4">Event Hubs</h2>
            <div :class="buttonStyle === 'modern' ? 'space-y-2' : ''">
              <template v-for="platform in orderedEventHubPlatforms" :key="platform.name">
                <a
                  v-if="band.data[platform.name] && !isLinkHidden(platform.name)"
                  :href="band.data[platform.name]"
                  @click.prevent="
                    handleClick(
                      band.data.id,
                      platform.name,
                      band.data[platform.name]
                    )
                  "
                  :class="streamingButtonClasses"
                >
                  <PlatformIcon
                    :existing-icon="platform.img"
                    :iconify="platform.iconify"
                    :alt="platform.label"
                    :class-name="buttonStyle === 'modern' ? 'w-6 h-6 shrink-0' : 'w-8 h-8 shrink-0'"
                  />
                  <span :class="buttonStyle === 'modern' ? 'text-white font-medium' : 'text-white font-semibold text-lg md:text-xl min-w-0 truncate'">{{ platform.label }}</span>
                </a>
              </template>
            </div>
          </section>
        </template>

        <!-- Contact / Booking (Minimal) -->
        <section v-if="hasContactInfo" class="mt-16 pt-8 border-t border-white/10">
          <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            <a v-if="band.data.labelName && band.data.labelUrl" :href="band.data.labelUrl" target="_blank" rel="noopener" class="flex items-center gap-1.5 hover:text-white transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke-width="1.5"/></svg>
              {{ band.data.labelName }}
            </a>
            <span v-else-if="band.data.labelName" class="flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke-width="1.5"/></svg>
              {{ band.data.labelName }}
            </span>
            <a v-if="band.data.bookingEmail" :href="`mailto:${band.data.bookingEmail}`" class="hover:text-white transition">
              Booking
            </a>
            <a v-if="band.data.managementEmail" :href="`mailto:${band.data.managementEmail}`" class="hover:text-white transition">
              Management
            </a>
            <a v-if="band.data.pressEmail" :href="`mailto:${band.data.pressEmail}`" class="hover:text-white transition">
              Press
            </a>
            <span v-if="band.data.bookingAgent" class="text-white/40">
              {{ band.data.bookingAgent }}
            </span>
          </div>
        </section>

        <!-- Upcoming Events -->
        <section
          v-if="upcomingEvents.length && isSectionVisible('events')"
          id="upcoming-events"
          class="mt-10"
        >
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Upcoming Events
          </h2>

          <div class="border border-white/70 bg-black/10 rounded-2xl p-4 md:p-5 hover:border-white transition motion-reduce:transition-none">
            <!-- Next Show (Featured) -->
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div class="min-w-0">
                <div class="text-white/70 text-sm font-semibold">Next Show</div>
                <div class="text-2xl md:text-3xl font-bold text-white mt-1">
                  {{ nextUpcomingEvent.city || 'TBA' }}<span v-if="nextUpcomingEvent.state">, {{ nextUpcomingEvent.state }}</span>
                </div>
                <div class="text-white/85 mt-1 font-semibold">
                  {{ nextUpcomingEvent.venue || 'Venue TBA' }}
                </div>
                <div class="text-purple-300 mt-2 font-semibold">
                  {{ formatDate(nextUpcomingEvent.date) }}
                </div>
              </div>

              <button
                type="button"
                class="w-full md:w-auto rounded-xl border border-white bg-transparent font-semibold text-white hover:bg-white/5 active:bg-white/10 px-4 py-3 transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0 motion-reduce:transition-none motion-reduce:transform-none"
                @click.stop="router.push(`/${route.params.bandSlug}/event/${nextUpcomingEvent.slug}`)"
              >
                {{ nextUpcomingEvent.ticketLink ? 'Tickets' : 'View Event' }}
              </button>
            </div>

            <!-- Other Upcoming Events -->
            <div v-if="otherUpcomingEvents.length" class="mt-4 border-t border-white/15 pt-4">
              <!-- Mobile: Card list -->
              <div class="md:hidden space-y-3">
                <div
                  v-for="event in paginatedUpcomingEvents"
                  :key="event.id"
                  class="rounded-xl border border-white/10 bg-black/20 px-4 py-3 cursor-pointer hover:bg-white/5 transition motion-reduce:transition-none"
                  @click.stop="router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
                >
                  <div class="text-purple-300 font-semibold">{{ formatDate(event.date) }}</div>
                  <div class="text-white font-semibold mt-1">
                    {{ event.city || 'TBA' }}<span v-if="event.state">, {{ event.state }}</span>
                  </div>
                  <div class="text-white/80">{{ event.venue || 'Venue TBA' }}</div>
                  <button
                    type="button"
                    class="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 font-semibold text-white shadow-sm transition duration-200 ease-out hover:bg-white/10 active:scale-[0.98] motion-reduce:transition-none"
                    @click.stop="router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
                  >
                    View Event
                  </button>
                </div>
              </div>

              <!-- Desktop: Table -->
              <div class="hidden md:block relative overflow-x-auto">
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
                      v-for="event in paginatedUpcomingEvents"
                      :key="event.id"
                      class="border-b border-purple-500 border-opacity-20 hover:bg-purple-900/30 cursor-pointer transition motion-reduce:transition-none"
                      @click.stop="router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
                    >
                      <td class="px-2 py-2 text-purple-400">
                        {{ formatDate(event.date) }}
                      </td>
                      <td class="px-2 py-2 text-purple-400 break-words">
                        {{ event.city || 'TBA' }}<span v-if="event.state">, {{ event.state }}</span>
                      </td>
                      <td class="px-2 py-2 text-purple-400 break-words">
                        {{ event.venue || 'Venue TBA' }}
                      </td>
                      <td class="px-2 py-2 text-purple-400">
                        <button type="button" class="text-purple-400 hover:text-white transition">
                          View Event
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination for Upcoming Events -->
              <div v-if="totalUpcomingPages > 1" class="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <button
                  @click="upcomingEventsPage = Math.max(1, upcomingEventsPage - 1)"
                  :disabled="upcomingEventsPage === 1"
                  class="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="upcomingEventsPage === 1 ? 'border-white/10 text-white/40' : 'border-white/20 text-white hover:bg-white/5'"
                >
                  ← Prev
                </button>
                <span class="text-sm text-white/60">
                  {{ upcomingEventsPage }} of {{ totalUpcomingPages }}
                </span>
                <button
                  @click="upcomingEventsPage = Math.min(totalUpcomingPages, upcomingEventsPage + 1)"
                  :disabled="upcomingEventsPage === totalUpcomingPages"
                  class="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="upcomingEventsPage === totalUpcomingPages ? 'border-white/10 text-white/40' : 'border-white/20 text-white hover:bg-white/5'"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Past Events -->
        <section v-if="pastEvents.length && isSectionVisible('events')" class="mt-10">
          <div class="flex items-end justify-between gap-4 mb-4">
            <h2 class="text-2xl md:text-3xl font-bold text-white">
              Past Events
            </h2>
            <div class="text-white/50 text-sm">{{ pastEvents.length }} total</div>
          </div>

          <!-- Mobile: Simple list -->
          <div class="md:hidden space-y-2">
            <div
              v-for="event in paginatedPastEvents"
              :key="event.id"
              class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 cursor-pointer hover:bg-white/5 transition motion-reduce:transition-none"
              @click.stop="router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
            >
              <div class="min-w-0">
                <div class="text-white/60 text-sm">{{ formatDate(event.date) }}</div>
                <div class="text-white font-semibold truncate">
                  {{ event.city || 'TBA' }}<span v-if="event.state">, {{ event.state }}</span>
                </div>
                <div class="text-white/70 text-sm truncate">{{ event.venue || 'Venue' }}</div>
              </div>
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/40 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>

          <!-- Desktop: Table -->
          <div class="hidden md:block relative overflow-x-auto rounded-xl border border-white/10 bg-black/20">
            <table class="w-full table-fixed bg-transparent text-white">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="px-4 py-3 text-left text-sm font-semibold text-white/70 w-[8rem]">Date</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-white/70">City</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-white/70">Venue</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-white/70 w-[5rem]"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="event in paginatedPastEvents"
                  :key="event.id"
                  class="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition motion-reduce:transition-none"
                  @click.stop="router.push(`/${route.params.bandSlug}/event/${event.slug}`)"
                >
                  <td class="px-4 py-3 text-white/60 text-sm">
                    {{ formatDate(event.date) }}
                  </td>
                  <td class="px-4 py-3 text-white break-words">
                    {{ event.city || 'TBA' }}<span v-if="event.state">, {{ event.state }}</span>
                  </td>
                  <td class="px-4 py-3 text-white/80 break-words">
                    {{ event.venue || 'Venue' }}
                  </td>
                  <td class="px-4 py-3">
                    <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination for Past Events -->
          <div v-if="totalPastPages > 1" class="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <button
              @click="pastEventsPage = Math.max(1, pastEventsPage - 1)"
              :disabled="pastEventsPage === 1"
              class="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="pastEventsPage === 1 ? 'border-white/10 text-white/40' : 'border-white/20 text-white hover:bg-white/5'"
            >
              ← Prev
            </button>
            <span class="text-sm text-white/60">
              {{ pastEventsPage }} of {{ totalPastPages }}
            </span>
            <button
              @click="pastEventsPage = Math.min(totalPastPages, pastEventsPage + 1)"
              :disabled="pastEventsPage === totalPastPages"
              class="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="pastEventsPage === totalPastPages ? 'border-white/10 text-white/40' : 'border-white/20 text-white hover:bg-white/5'"
            >
              Next →
            </button>
          </div>
        </section>

        <section v-if="canShowMerchConcierge && isSectionVisible('merch')" class="mt-10">
          <div class="border border-violet-500/40 bg-gradient-to-br from-violet-900/40 to-black/40 rounded-2xl p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-2xl md:text-3xl font-bold text-white">Skip the merch line</div>
                <div class="text-white/80 mt-1">Show-only merch • Pick up after the set</div>
                <div v-if="merchPickupLine" class="text-violet-200 mt-2">
                  Pickup: <span class="text-white">{{ merchPickupLine }}</span>
                </div>
              </div>
            </div>

            <div v-if="merchError" class="text-red-300 mt-3">{{ merchError }}</div>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                v-for="(item, i) in merchItems"
                :key="i"
                class="border border-white/10 bg-black/30 rounded-xl overflow-hidden"
              >
                <div class="w-full h-44 bg-white/5">
                  <img
                    v-if="item.imageUrl"
                    :src="item.imageUrl"
                    :alt="item.title"
                    class="w-full h-full object-cover"
                  />
                </div>

                <div class="p-4">
                  <div class="text-white font-semibold text-lg">{{ item.title }}</div>
                  <div v-if="item.description" class="text-white/70 text-sm mt-1">
                    {{ item.description }}
                  </div>
                  <div class="text-white mt-3 font-semibold">
                    {{ formatUsd(item.priceCents) }}
                  </div>

                  <div v-if="item.sizesEnabled" class="mt-3">
                    <div class="text-white/70 text-sm mb-2">Select a size</div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="sz in item.availableSizes"
                        :key="sz"
                        type="button"
                        class="px-3 py-2 rounded-md border border-white/20 text-white disabled:opacity-50"
                        :class="
                          selectedMerchSizeByIndex?.[i] === sz
                            ? 'bg-violet-900/60 hover:bg-violet-900/60 focus:bg-violet-900/60'
                            : 'hover:bg-white/5 focus:bg-white/5'
                        "
                        :disabled="Number(item.sizeStock?.[sz] || 0) <= 0"
                        @click="selectMerchSize(i, sz)"
                      >
                        {{ sz }}
                      </button>
                    </div>
                  </div>

                  <div v-else class="mt-3 text-white/70 text-sm">
                    <span v-if="item.availableQty > 0">Remaining: {{ item.availableQty }}</span>
                    <span v-else>Sold out</span>
                  </div>

                  <button
                    type="button"
                    class="w-full mt-4 px-4 py-3 rounded-lg font-semibold text-white border border-violet-400/40 bg-violet-700/40 hover:bg-violet-700/55 disabled:opacity-60"
                    :disabled="!canBuyMerchItem(i) || merchCheckoutLoadingIndex === i"
                    @click="startMerchCheckout(i)"
                  >
                    <span v-if="merchCheckoutLoadingIndex === i">Loading…</span>
                    <span v-else>{{ isMerchSoldOut(i) ? "Sold out" : "Reserve & Pay" }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="canShowPayments && isSectionVisible('payments')" class="mt-10">
          <div v-if="paymentError" class="text-red-400 mb-3">
            {{ paymentError }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div
              v-for="btn in enabledPaymentButtons"
              :key="btn.key"
              class="border border-white/20 rounded-lg p-4 bg-black/40"
            >
              <div class="text-white font-semibold text-lg">
                {{ btn.title }}
              </div>
              <div v-if="btn.description" class="text-white/80 mt-1">
                {{ btn.description }}
              </div>

              <div class="mt-3">
                <div v-if="btn.pricingMode === 'min'">
                  <div class="text-white/70 text-sm mb-2">Enter an amount</div>
                  <div class="flex items-center gap-2">
                    <span class="text-white/80">$</span>
                    <input
                      v-model.number="paymentAmountByKey[btn.key]"
                      type="number"
                      step="1"
                      :min="minimumForMinMode(btn)"
                      class="w-32 px-3 py-2 rounded-md bg-black border border-white/20 text-white"
                    />
                    <span class="text-white/60">
                      Minimum ${{ formatDollars(minimumForMinMode(btn)) }}
                    </span>
                  </div>
                </div>

                <div v-else-if="btn.pricingMode === 'presets'">
                  <div class="text-white/70 text-sm mb-2">Select an amount</div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="amt in (btn.presetAmounts || [])"
                      :key="amt"
                      type="button"
                      class="px-3 py-2 rounded-md border border-white/20 text-white hover:bg-purple-900/40"
                      :class="{
                        'bg-purple-900/60': !customAmountActiveByKey[btn.key] && Number(paymentAmountByKey[btn.key]) === Number(amt),
                      }"
                      @click="selectPresetAmount(btn.key, Number(amt))"
                    >
                      ${{ amt }}
                    </button>
                    <button
                      type="button"
                      class="px-3 py-2 rounded-md border border-white/20 text-white hover:bg-purple-900/40"
                      :class="{ 'bg-purple-900/60': customAmountActiveByKey[btn.key] }"
                      @click="toggleCustomAmount(btn.key)"
                    >
                      + Custom
                    </button>
                  </div>
                  <div v-if="customAmountActiveByKey[btn.key]" class="mt-3 flex items-center gap-2">
                    <span class="text-white/80">$</span>
                    <input
                      v-model.number="paymentAmountByKey[btn.key]"
                      type="number"
                      step="1"
                      :min="minimumForCustomPreset(btn)"
                      :placeholder="`${formatDollars(minimumForCustomPreset(btn))} or more`"
                      class="w-32 px-3 py-2 rounded-md bg-black border border-white/20 text-white"
                    />
                  </div>
                </div>

                <div v-else-if="btn.pricingMode === 'fixed'">
                  <div class="text-white/70 text-sm mb-1">Fixed price</div>
                  <div class="text-white text-xl font-semibold">
                    ${{ btn.fixedAmount }}
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="w-full mt-4 custom-border text-white text-lg flex justify-center font-semibold px-4 py-3 items-center relative shadow-lg rounded-md md:text-xl disabled:opacity-60"
                :disabled="paymentLoadingKey === btn.key"
                @click="startCheckout(btn)"
              >
                <span v-if="paymentLoadingKey === btn.key">Loading…</span>
                <span v-else>Continue to Payment</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Fan Capture Section -->
      <FanCaptureSection
        v-if="band?.data?.id && (band.data.fanCaptureEnabled !== false)"
        :band-id="band.data.id"
        :band-slug="currentBandSlug"
        :show-mode-enabled="isShowModeLive"
        :show-mode-title="band.data.showModeTitle || ''"
        :show-mode-venue="band.data.showModeVenue || ''"
        :show-mode-city="band.data.showModeCity || ''"
        :event-id="band.data.showModeEventId || null"
        :campaign-id="band.data.showModeCampaignId || null"
        capture-surface="band_page"
        :enabled="band.data.fanCaptureEnabled !== false"
        :artist-name="band.data.name || ''"
        :headline="fanCaptureDisplayCopy.headline"
        :message="fanCaptureDisplayCopy.message"
        :button-label="fanCaptureDisplayCopy.buttonLabel"
        :success-message="fanCaptureDisplayCopy.successMessage"
        :followed="isNativeFollowing"
        :subscribed="isFanListContactable"
        :already-checked-in="hasCheckedIn"
        :attendance-resolved="attendanceResolved"
        @subscribed="onFanSubscribed"
        @open-check-in-modal="openCheckInModal"
      />

      <div class="w-full px-6 mt-6 mb-8 md:max-w-[80vw] md:mx-auto">
        <ArtistPageActions
          variant="default"
          :show-follow="isSectionVisible('follow')"
          :followed="isNativeFollowing"
          :follow-busy="followBusy"
          :follow-error="followError"
          :message-label="messageActionLabel"
          :message-pending="messageActionPending"
          :message-disabled="messageActionDisabled"
          :saved="isCurrentBandSaved"
          @follow="onFollowAction"
          @message="onMessageArtist"
          @save="onToggleSaveBand"
          @share="shareDrawerOpen = true"
        />
      </div>

      <!-- Share Drawer -->
      <client-only>
        <ShareDrawer
          v-if="band?.data?.id"
          :is-open="shareDrawerOpen"
          :band-id="band.data.id"
          :band-slug="currentBandSlug"
          :band-name="band.data.name || 'This Artist'"
          :band-image-url="band.data.bandImg?.url || null"
          :is-band-name-in-logo="band.data.isBandNameInLogo || false"
          @close="shareDrawerOpen = false"
        />
      </client-only>

      <!-- Fan Moment Section (shows only when moment is earned) - TEMPORARILY DISABLED FOR UI IMPROVEMENTS
      <client-only>
        <FanMomentSection
          v-if="band?.data?.id"
          ref="fanMomentRef"
          :band-id="band.data.id"
          :band-slug="currentBandSlug"
          :band-name="band.data.name || 'This Artist'"
          :band-image-url="band.data.bandImg?.url || null"
          :is-band-name-in-logo="band.data.isBandNameInLogo || false"
          :pulse-data="pulseData"
        />
      </client-only>
      -->

      <ArtistPageSignature />
    </div>

    <client-only>
      <FollowArtistSheet
        :is-open="followSheetOpen"
        :band-id="band?.data?.id"
        :band-name="band?.data?.name || ''"
        :band-slug="currentBandSlug"
        :profile-image="band?.data?.bandImg?.url || ''"
        :followed="isNativeFollowing"
        @close="followSheetOpen = false"
        @followed="onFollowSheetJoined"
        @sign-in="onFollowPassportPath"
        @claim-passport="onFollowPassportPath"
      />
      <UnfollowArtistSheet
        :is-open="unfollowSheetOpen"
        :band-name="band?.data?.name || ''"
        :profile-image="band?.data?.bandImg?.url || ''"
        :subscribed="isFanListContactable"
        :busy="followBusy"
        :error="followError"
        @close="unfollowSheetOpen = false"
        @confirm="onUnfollowConfirmed"
      />
      <FanMessageRequestSheet
        :open="messageSheetOpen"
        :step="messageSheetStep"
        :band-id="band?.data?.id"
        :band-name="band?.data?.name || 'this artist'"
        :artist-image="band?.data?.bandImg?.url || ''"
        :sending="messageSending"
        :error="messageError"
        :initial-first-name="messageStatus.firstName"
        :initial-last-name="messageStatus.lastName"
        @close="closeMessageSheet"
        @done="closeMessageSheet"
        @continue-free="onMessageContinueFree"
        @save-name="onMessageSaveName"
        @send="onMessageSendRequest"
      />
    </client-only>

    <!-- Smart Link Live Surface: Fan Toast (recognition after actions) -->
    <client-only>
      <FanToast
        v-if="showFanToasts"
        ref="fanToastRef"
      />
    </client-only>

    <!-- Check-in has no floating page CTA. Entry belongs to the show context:
         the fan capture show module, and the zero-tap open when a show is live. -->

    <!-- Full-viewport Show Check-In experience (global - works for ALL templates) -->
    <ShowCheckInModal
      :is-open="checkInModalOpen"
      :band-id="band?.data?.id"
      :band-name="band?.data?.name"
      :band-slug="band?.data?.slug || route.params?.bandSlug || ''"
      :band-image="band?.data?.bandImg || null"
      :band-image-url="band?.data?.bandImg?.url || null"
      :image-focal-x="band?.data?.cyberedImagePositionX ?? 50"
      :image-focal-y="band?.data?.cyberedImagePositionY ?? 50"
      :show-title="band?.data?.showModeTitle || ''"
      :venue="band?.data?.showModeVenue || ''"
      :city="band?.data?.showModeCity || ''"
      :show-date="band?.data?.showModeStartedAt || ''"
      :event-id="band?.data?.showModeEventId || null"
      :campaign-id="band?.data?.showModeCampaignId || ''"
      :fan-email="checkInFanEmail"
      @close="closeCheckInModal"
      @success="onCheckInSuccess"
      @already-checked-in="onCheckInSuccess"
      @error="onCheckInError"
      @open-badge="openBadgeModal"
    />

    <!-- Optional shareable badge. Kept for later Night / Passport / Share Kit.
         Check-in success no longer opens this automatically. -->
    <ShowCheckInBadgeModal
      :is-open="badgeModalOpen"
      :attendance-data="badgeAttendance"
      :band-slug="band?.data?.slug || route.params?.bandSlug || ''"
      @close="badgeModalOpen = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { useRuntimeConfig, useHead, useAsyncData } from "#imports";
import { pickArtistHeadFields } from "~/utils/band/artistPageHead";
import { useBeacon } from "@/composables/useBeacon";
import {
  checkoutAmountError,
  formatDollars,
  minimumForCustomPreset,
  minimumForMinMode,
  newCheckoutAttemptId,
} from "@/utils/payments/checkoutAmount";
import { useSavedBands } from "@/composables/useSavedBands";
import { useFanInteractionTracker } from "@/composables/useFanInteractionTracker";
import { useRoute, useRouter } from "vue-router";
import { useNuxtApp } from "#app";
import AudioPlayer from "@/components/AudioPlayer.vue";
import ArtistPageActions from "@/components/band/ArtistPageActions.vue";
import ArtistPageSignature from "@/components/band/ArtistPageSignature.vue";
import FanMessageRequestSheet from "@/components/band/FanMessageRequestSheet.vue";
import FollowArtistSheet from "@/components/band/FollowArtistSheet.vue";
import { useArtistPageFollow } from "~/composables/useArtistPageFollow";
import { usePublicArtistShare } from "~/composables/usePublicArtistShare";
import { publicArtistShareRecord } from "~/utils/share/dockShareTarget";
import UnfollowArtistSheet from "@/components/band/UnfollowArtistSheet.vue";
import { useFanMessageRequest } from "@/composables/useFanMessageRequest";
import { featuredGalleryTeaser } from "~/utils/galleries/publicFeaturedGallery";
import { livePaymentButtons } from "~/utils/payments/livePaymentButtons";
import FanMomentSection from "@/components/FanMomentSection.vue";
import FanCaptureSection from "@/components/band/FanCaptureSection.vue";
import ShareBandStrip from "@/components/ShareBandStrip.vue";
import ShareDrawer from "@/components/band/ShareDrawer.vue";
import BandPageCompact from "@/components/band/BandPageCompact.vue";
import BandPageBold from "@/components/band/BandPageBold.vue";
// Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable.
// import ArtistUpdatesSection from "@/components/updates/ArtistUpdatesSection.vue";
import BandPageCybered from "@/components/band/BandPageCybered.vue";
import FaneqoArtistHeroImage from "@/components/band/FaneqoArtistHeroImage.vue";
import ShowCheckInModal from "@/components/band/ShowCheckInModal.vue";
import ShowCheckInBadgeModal from "@/components/band/ShowCheckInBadgeModal.vue";
import {
  normalizeLayoutConfig,
  isSectionEnabled,
} from "@/utils/bandLayout";

// Smart Link Live Surface Components
import NowBanner from "@/components/smartlink/NowBanner.vue";
import LiveFeed from "@/components/smartlink/LiveFeed.vue";
import ContinueChip from "@/components/smartlink/ContinueChip.vue";
import FanToast from "@/components/smartlink/FanToast.vue";
import SupportModule from "@/components/smartlink/SupportModule.vue";
import EliteSpotifyEmbedWidget from "@/components/smartlink/EliteSpotifyEmbedWidget.vue";
// V2 Components
import MomentBadges from "@/components/smartlink/MomentBadges.vue";
import ShowDayHeader from "@/components/smartlink/ShowDayHeader.vue";
import MomentShareCard from "@/components/smartlink/MomentShareCard.vue";
import { getDemoFlag } from '@/composables/useDemoFlags';
import PlatformIcon from "@/components/ui/PlatformIcon.vue";
import { detectPlatform, isInternalUrl } from '~/utils/detectPlatform';
import { getPublicationFanCaptureCopy, isPublicationProfile } from '@/utils/publicationProfile';
import { resolveFanCaptureCopy, FAN_CAPTURE_DEFAULT_SUCCESS } from '@/utils/fanCaptureCopy';

// Streaming icons (existing platforms only - new ones use iconify)
import youtubeIcon from "@/assets/youtube-icon.svg";
import youtubeMusicIcon from "@/assets/youtube-icon.svg";
import spotifyIcon from "@/assets/spotify.svg";
import appleMusicIcon from "@/assets/apple.svg";
import soundcloudIcon from "@/assets/soundcloudlast.png";
import bandcampIcon from "@/assets/bandcamp.svg";
import deezerIcon from "@/assets/dezzer.svg";
import twitchIcon from "@/assets/twitchfree.png";
import reverbnationIcon from "@/assets/reverbnation.png";

// Social icons (existing platforms only - new ones use iconify)
import facebookIcon from "@/assets/facebookfree.png";
import instagramIcon from "@/assets/instagramfree.png";
import twitterIcon from "@/assets/twitter.png";
import tiktokIcon from "@/assets/tiktok.png";

const hasTrackedEmbedClick = ref(false);
const embedPlayerWrapperEl = ref(null);
const embedIframeEl = ref(null);
const showEmbedTapAgainHint = ref(false);
const embedShake = ref(false);
let embedTapAgainTimeout = null;
let embedShakeTimeout = null;
let onEmbedWrapperPointerDown = null;
let onEmbedWrapperMouseDown = null;
let onEmbedWrapperTouchStart = null;
let onEmbedWrapperPointerEnter = null;
let onEmbedIframeFocus = null;
let onEmbedIframePointerDown = null;
let onEmbedIframeTouchStart = null;
let onEmbedIframeMouseEnter = null;
let onEmbedIframeMouseLeave = null;
let onWindowBlur = null;
let onDocumentVisibilityChange = null;
let embedActivePollInterval = null;
let embedActivePollTimeout = null;
let embedHovering = false;
let lastEmbedHoverAt = 0;
const nuxtApp = useNuxtApp();

const { trackClick, trackClickBeacon, trackMediaPlay } = useBeacon();
const { isSaved, toggleSaveBand } = useSavedBands();
const { 
  trackPageView, 
  trackShowModePageView, 
  trackFollowModalOpen, 
  trackSpotifyClick, 
  trackAppleMusicClick, 
  trackYouTubeClick, 
  trackTicketClick,
  trackMerchClick,
  trackShareClick,
  trackFeaturedSongPlay,
  trackVideoClick,
} = useFanInteractionTracker();
const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

const showSavedConfirmation = ref(false);
let savedConfirmationTimeout = null;

const paymentBannerVisible = ref(false);
const paymentBannerTitle = ref("");
const paymentBannerDetail = ref("");

const paymentError = ref("");
const paymentLoadingKey = ref(null);
const paymentAmountByKey = ref({});
const customAmountActiveByKey = ref({});

const merchError = ref("");
const merchCheckoutLoadingIndex = ref(null);
const selectedMerchSizeByIndex = ref({});

function selectMerchSize(index, size) {
  const next = { ...(selectedMerchSizeByIndex.value || {}) };
  next[index] = size;
  selectedMerchSizeByIndex.value = next;
}

const merchConfig = computed(() => {
  const mc = band.value?.data?.merchConcierge;
  if (!mc || typeof mc !== "object") return null;
  return mc;
});

const merchPickupLine = computed(() => {
  const v = merchConfig.value?.pickupInstructions;
  return v ? String(v) : "";
});

const merchItems = computed(() => {
  const items = Array.isArray(merchConfig.value?.merchItems)
    ? merchConfig.value.merchItems
    : [];

  return items
    .slice(0, 3)
    .map((raw) => {
      const sizesEnabled = raw?.sizesEnabled === true;
      const sizeStock = raw?.sizeStock && typeof raw.sizeStock === "object" ? raw.sizeStock : {};
      const availableSizes = sizesEnabled
        ? Object.keys(sizeStock)
            .filter((k) => Number(sizeStock?.[k] || 0) > 0)
            .map(String)
        : [];

      return {
        title: String(raw?.title || ""),
        description: String(raw?.description || ""),
        imageUrl: raw?.imageUrl ? String(raw.imageUrl) : null,
        priceCents: Number(raw?.priceCents || 0),
        sizesEnabled,
        availableQty: Number(raw?.availableQty || 0),
        sizeStock,
        availableSizes,
      };
    })
    .filter((x) => !!x.title && Number(x.priceCents || 0) > 0);
});

const canShowMerchConcierge = computed(() => {
  const mc = merchConfig.value;
  if (!mc) return false;
  if (mc.enabled !== true) return false;
  if (mc.staffReadyConfirmed !== true) return false;
  if (!merchPickupLine.value.trim()) return false;

  // Require Stripe connect to be ready (same as payments)
  const enabled = band.value?.data?.paymentsEnabled;
  const onboarded = band.value?.data?.stripeOnboardingComplete;
  if (enabled === false || onboarded === false) return false;

  return merchItems.value.length > 0;
});

// Buttons the artist enabled, shown only while the server says payments are
// live. Every layout and the pay-entry chip read this one list, so a band that
// hasn't finished Stripe setup shows no checkout anywhere.
const enabledPaymentButtons = computed(() => livePaymentButtons(band.value?.data));

const canShowPayments = computed(() => enabledPaymentButtons.value.length > 0);

function initPaymentDefaults() {
  const next = { ...(paymentAmountByKey.value || {}) };
  for (const btn of enabledPaymentButtons.value) {
    if (next[btn.key] != null) continue;
    if (btn.pricingMode === "min") {
      next[btn.key] = Number(btn.minAmount || 5);
    } else if (btn.pricingMode === "presets") {
      const first = Array.isArray(btn.presetAmounts) ? btn.presetAmounts[0] : null;
      next[btn.key] = first != null ? Number(first) : 5;
    } else if (btn.pricingMode === "fixed") {
      next[btn.key] = Number(btn.fixedAmount || 0);
    }
  }
  paymentAmountByKey.value = next;
}

function formatUsd(cents) {
  const n = Number(cents || 0);
  return `$${(n / 100).toFixed(2)}`;
}

function selectPresetAmount(key, amount) {
  customAmountActiveByKey.value[key] = false;
  paymentAmountByKey.value[key] = amount;
}

function toggleCustomAmount(key) {
  customAmountActiveByKey.value[key] = !customAmountActiveByKey.value[key];
  if (customAmountActiveByKey.value[key]) {
    paymentAmountByKey.value[key] = null;
  }
}

function isMerchSoldOut(index) {
  const item = merchItems.value?.[index];
  if (!item) return true;
  if (item.sizesEnabled) {
    return item.availableSizes.length === 0;
  }
  return Number(item.availableQty || 0) <= 0;
}

function canBuyMerchItem(index) {
  const item = merchItems.value?.[index];
  if (!item) return false;
  if (isMerchSoldOut(index)) return false;

  if (item.sizesEnabled) {
    const sz = selectedMerchSizeByIndex.value?.[index] || null;
    if (!sz) return false;
    return Number(item.sizeStock?.[sz] || 0) > 0;
  }

  return Number(item.availableQty || 0) > 0;
}

async function startMerchCheckout(index) {
  merchError.value = "";
  merchCheckoutLoadingIndex.value = index;

  try {
    const item = merchItems.value?.[index];
    if (!item) throw new Error("Item not found");

    const bandSlug = currentBandSlug.value;
    if (!bandSlug) throw new Error("Band not loaded");

    const body = {
      bandSlug,
      itemSlotIndex: index + 1,
      selectedSize: item.sizesEnabled
        ? (selectedMerchSizeByIndex.value?.[index] || null)
        : null,
    };

    const res = await $fetch("/api/merch-concierge/create-checkout", {
      method: "POST",
      body,
    });

    const url = res?.checkoutUrl;
    if (!url) throw new Error("Checkout URL missing");

    window.location.href = url;
  } catch (e) {
    merchError.value = e?.data?.message || e?.message || String(e);
  } finally {
    merchCheckoutLoadingIndex.value = null;
  }
}

async function startCheckout(btn) {
  // One checkout at a time: ignore repeat taps while one is opening
  if (paymentLoadingKey.value || checkoutRedirecting) return;
  paymentError.value = "";
  paymentLoadingKey.value = btn.key;

  try {
    const api = config.public.strapiUrl;
    const bandId = band.value?.data?.id;
    if (!bandId) throw new Error("Band not loaded yet");

    const body = { buttonKey: btn.key, attemptId: newCheckoutAttemptId() };

    if (btn.pricingMode === "min" || btn.pricingMode === "presets") {
      const a = Number(paymentAmountByKey.value?.[btn.key]);
      const amountError = checkoutAmountError(btn, a, {
        custom: btn.pricingMode === "presets" && !!customAmountActiveByKey.value?.[btn.key],
      });
      if (amountError) throw new Error(amountError);
      body.amount = a;
    }

    const res = await fetch(`${api}/api/bands/${bandId}/payments/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    const url = json?.url || json?.data?.url;
    if (!res.ok) {
      const msg = json?.error?.message || "Unable to start checkout";
      throw new Error(msg);
    }

    if (!url) throw new Error("Checkout URL missing");

    // Keep the button locked while the browser leaves for Stripe
    checkoutRedirecting = true;
    window.location.href = url;
  } catch (e) {
    const message = e?.message === "Failed to fetch" ? "Couldn’t reach checkout. Check your connection and try again." : (e?.message || String(e));
    paymentError.value = message;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("faneqo:checkout-failed", { detail: { key: btn?.key || null, message } }));
    }
  } finally {
    if (!checkoutRedirecting) paymentLoadingKey.value = null;
  }
}

let checkoutRedirecting = false;
if (typeof window !== "undefined") {
  // Back from Stripe via browser history: allow a new checkout
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      checkoutRedirecting = false;
      paymentLoadingKey.value = null;
    }
  });
}

function handleSupportModuleCheckout(payload) {
  const button = payload?.button;
  const amount = payload?.amount;

  if (!button) {
    console.warn("[payments] Missing support checkout button", payload);
    return;
  }

  if (button.key && amount !== undefined && amount !== null) {
    paymentAmountByKey.value[button.key] = amount;
  }

  startCheckout(button);
}

async function handlePaymentQuery() {
  const paid = String(route.query?.paid || "");
  const canceled = String(route.query?.canceled || "");
  const sm = route.query?.sm ? String(route.query.sm) : null;
  const receiptToken = route.query?.r ? String(route.query.r) : null;

  // A redirect back from checkout is not proof of payment. Send the fan to the
  // receipt, which verifies the payment status with the server.
  if (paid === "1" && (receiptToken || sm)) {
    const slug = String(route.params.bandSlug || "");
    await router.replace({ path: `/${slug}/support/receipt`, query: receiptToken ? { r: receiptToken } : { sm } });
    return;
  }

  if (paid === "1") {
    paymentBannerVisible.value = true;
    paymentBannerTitle.value = "Payment submitted";
    paymentBannerDetail.value = "If your payment went through, your receipt will arrive by email.";
  } else if (canceled === "1") {
    paymentBannerVisible.value = true;
    paymentBannerTitle.value = "Checkout canceled";
    paymentBannerDetail.value = "No payment was made. You can try again anytime.";
  }
}

function dismissPaymentBanner() {
  paymentBannerVisible.value = false;
  const nextQuery = { ...(route.query || {}) };
  delete nextQuery.paid;
  delete nextQuery.canceled;
  delete nextQuery.sm;
  delete nextQuery.r;
  router.replace({ query: nextQuery });
}

// replace: const loading = ref(true);
const loadingData = ref(true);
const heroReady = ref(false);
const notFound = ref(false);

const showPage = computed(() => {
  const url = band.value?.data?.bandImg?.url;
  // show when data is fetched AND either no hero or hero preloaded
  return !loadingData.value && (!url || heroReady.value);
});
const band = ref(null);
const events = ref([]);

const layoutConfig = computed(() => {
  return normalizeLayoutConfig(band.value?.data?.layoutConfig);
});

const orderedSections = computed(() => {
  return layoutConfig.value?.sections || [];
});

const pageStyle = computed(() => {
  return band.value?.data?.pageStyle || 'smartlink';
});

const isCompactStyle = computed(() => pageStyle.value === 'compact');
const isBoldStyle = computed(() => pageStyle.value === 'bold');
const isCyberedStyle = computed(() => pageStyle.value === 'smartlink' || pageStyle.value === 'default');

// Button style for streaming/social links: 'classic' (original) or 'modern' (updated)
// Cybered (smartlink) style automatically uses modern buttons
const buttonStyle = computed(() => {
  if (isCyberedStyle.value) return 'modern';
  return band.value?.data?.buttonStyle || 'classic';
});

// Streaming/Social button classes based on buttonStyle
const streamingButtonClasses = computed(() => {
  if (buttonStyle.value === 'modern') {
    // Modern style: subtle background, rounded-xl, smaller
    return 'w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition';
  }
  // Classic style: white border, transparent bg, larger, with hover effects
  return 'w-full mb-4 border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-4 rounded-md hover:bg-white/5 active:bg-white/10 transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0';
});

// ============================================
// SMART LINK LIVE SURFACE
// ============================================
// HOW TO DEMO: Use Dashboard > Demo Controls panel to toggle features
// When disabled, page behaves exactly as before (no layout shifts)

// Live Surface Feature Flags - from useDemoFlags (localStorage > config defaults)
const showNowBanner = computed(() => getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && getDemoFlag('SMARTLINK_SHOW_NOW_BANNER'));
const showLiveFeed = computed(() => getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && getDemoFlag('SMARTLINK_SHOW_LIVE_FEED'));
const showContinueChip = computed(() => getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && getDemoFlag('SMARTLINK_SHOW_CONTINUE_CHIP'));
const showFanToasts = computed(() => getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && getDemoFlag('SMARTLINK_SHOW_FAN_TOASTS'));
const showSupportModuleRefactor = computed(() => getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && getDemoFlag('SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR'));
const showMomentBadges = computed(() => getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && getDemoFlag('SMARTLINK_V2_ENABLED') && getDemoFlag('SMARTLINK_SHOW_MOMENT_BADGES'));
const shouldShowShowDayHeader = computed(() => getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && getDemoFlag('SMARTLINK_V2_ENABLED') && getDemoFlag('SMARTLINK_SHOW_SHOW_DAY_HEADER'));
const showMomentShareCard = computed(() => getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && getDemoFlag('SMARTLINK_V2_ENABLED') && getDemoFlag('SMARTLINK_SHOW_MOMENT_SHARE_CARD'));

// Live Surface Data - computed from band/events
const nowBannerState = computed(() => {
  if (!getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') || !getDemoFlag('SMARTLINK_SHOW_NOW_BANNER')) return 'QUIET_DEFAULT';
  
  // Check for demo force override (highest priority for demo users)
  const forcedBanner = getDemoFlag('DEMO_FORCE_NOW_BANNER');
  if (forcedBanner) {
    return forcedBanner;
  }
  
  // Check for manual override from band data
  if (band.value?.data?.nowBannerOverride) {
    return band.value.data.nowBannerOverride;
  }
  
  const now = new Date();
  const events = upcomingEvents.value || [];
  
  // Check for show tonight (event within 24h)
  if (events.length > 0) {
    const nextEvent = events[0];
    const eventDate = new Date(nextEvent.date + 'T20:00:00');
    const hoursUntil = (eventDate - now) / (1000 * 60 * 60);
    if (hoursUntil >= 0 && hoursUntil <= 24) {
      return 'SHOW_TONIGHT';
    }
  }
  
  // Check for post-show (event ended within 12h)
  // TODO: Need past events data
  
  // Check for new release
  const releaseDate = band.value?.data?.newReleaseDate;
  if (releaseDate) {
    const daysSince = (now - new Date(releaseDate)) / (1000 * 60 * 60 * 24);
    if (daysSince >= 0 && daysSince <= 30) {
      return 'NEW_RELEASE';
    }
  }
  
  // Check for on tour (2+ upcoming events)
  if (events.length >= 2) {
    return 'ON_TOUR';
  }
  
  return 'QUIET_DEFAULT';
});

const nowBannerContent = computed(() => {
  const state = nowBannerState.value;
  const events = upcomingEvents.value || [];
  const nextEvent = events[0] || null;
  
  switch (state) {
    case 'SHOW_TONIGHT':
      return {
        icon: '🎤',
        headline: 'Live Tonight',
        subtext: nextEvent ? `${nextEvent.venue || 'Show'} in ${nextEvent.city || 'your city'}` : 'Catch the show',
        cta: nextEvent?.link ? 'Get Tickets' : null,
        ctaLink: nextEvent?.link || null,
        accent: 'orange',
      };
    case 'POST_SHOW_THANKS':
      return {
        icon: '🙏',
        headline: 'Thanks for coming out',
        subtext: 'Hope you had a great time',
        cta: 'Share the moment',
        ctaAction: 'share',
        accent: 'purple',
      };
    case 'NEW_RELEASE':
      return {
        icon: '🔥',
        headline: 'New Music',
        subtext: 'Fresh release — check it out',
        cta: 'Listen Now',
        ctaAction: 'scroll-to-featured',
        accent: 'pink',
      };
    case 'ON_TOUR':
      return {
        icon: '🚐',
        headline: 'On Tour',
        subtext: `${events.length} shows coming up`,
        cta: 'See Dates',
        ctaAction: 'scroll-to-events',
        accent: 'blue',
      };
    default:
      return {
        icon: '🎵',
        headline: band.value?.data?.name || 'Welcome',
        subtext: 'Thanks for stopping by',
        cta: null,
        accent: 'neutral',
      };
  }
});

const effectivePageMode = computed(() => {
  if (!getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') || !getDemoFlag('SMARTLINK_SHOW_PAGE_MODES')) return 'QUIET';
  
  // Check for demo force override (highest priority for demo users)
  const forcedMode = getDemoFlag('DEMO_FORCE_MODE');
  if (forcedMode) {
    return forcedMode;
  }
  
  const now = new Date();
  const events = upcomingEvents.value || [];
  
  // SHOW_DAY: event within 24h
  if (events.length > 0) {
    const nextEvent = events[0];
    const eventDate = new Date(nextEvent.date + 'T20:00:00');
    const hoursUntil = (eventDate - now) / (1000 * 60 * 60);
    if (hoursUntil >= 0 && hoursUntil <= 24) {
      return 'SHOW_DAY';
    }
  }
  
  // POST_SHOW: event ended within 12h
  // TODO: Need past events data
  
  return 'QUIET';
});

// Demo feed items
const liveFeedItems = computed(() => {
  if (!getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') || !getDemoFlag('SMARTLINK_SHOW_LIVE_FEED')) return [];
  if (!getDemoFlag('DEMO_FEED_ENABLED')) return [];
  
  const mode = effectivePageMode.value;
  const now = Date.now();
  const cities = ['Los Angeles', 'New York', 'Chicago', 'Austin', 'Nashville'];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  
  const items = [];
  
  // City tuning in (always show)
  items.push({
    id: 'demo-city',
    icon: '📍',
    copy: `${randomCity} is tuning in`,
    timestamp: now - (30 * 60 * 1000),
  });
  
  if (mode === 'SHOW_DAY') {
    items.push({
      id: 'demo-heating',
      icon: '🔥',
      copy: 'Activity heating up',
      timestamp: now - (15 * 60 * 1000),
    });
  } else if (mode === 'POST_SHOW') {
    items.push({
      id: 'demo-spike',
      icon: '📈',
      copy: 'Post-show surge happening',
      timestamp: now - (20 * 60 * 1000),
    });
  } else {
    items.push({
      id: 'demo-link',
      icon: '🎵',
      copy: 'Spotify trending today',
      timestamp: now - (2 * 60 * 60 * 1000),
    });
  }
  
  return items.slice(0, 3);
});

const primaryFeedItem = computed(() => liveFeedItems.value[0] || null);
const hasLiveFeedItems = computed(() => liveFeedItems.value.length > 0);
const momentShareType = computed(() => {
  if (effectivePageMode.value === 'SHOW_DAY') return 'you_were_here';
  if (effectivePageMode.value === 'POST_SHOW') return 'post_show';
  return 'default';
});

// Component refs
const fanToastRef = ref(null);
const continueChipRef = ref(null);

// Fan Toast helper - call after key actions
function showFanToast(actionType, options = {}) {
  if (!showFanToasts.value) return;
  fanToastRef.value?.showToast(actionType, options);
}

// Continue Chip helper - record user actions
function recordContinueAction(type, url = null) {
  if (!showContinueChip.value) return;
  continueChipRef.value?.recordAction(type, url);
}

const isSectionVisible = (sectionId) => {
  return isSectionEnabled(layoutConfig.value, sectionId);
};

const currentBandSlug = computed(() => {
  return (
    band.value?.data?.slug ||
    String(route.params.bandSlug || "").toLowerCase() ||
    ""
  );
});

const { publish: publishPublicArtist } = usePublicArtistShare()
watch(
  () => [
    route.params.bandSlug,
    band.value?.data?.slug || '',
    band.value?.data?.name || '',
    band.value?.data?.bandImg?.url || '',
  ],
  () => {
    const record = publicArtistShareRecord({
      routeSlug: route.params.bandSlug,
      loaded: {
        slug: band.value?.data?.slug,
        name: band.value?.data?.name,
        profileImage: band.value?.data?.bandImg?.url,
      },
    })
    if (record) publishPublicArtist(record)
  },
  { immediate: true }
)

// Show mode gating. The backend deactivation cron runs every 15 minutes, so a
// band can still read as enabled after showModeEndsAt has passed — check the
// end time here before offering check-in.
const showModeNowTs = ref(Date.now());
let showModeTicker = null;
let autoOpenTimer = null;
let autoOpenHandled = false;
let stopAutoOpenWatch = null;
let stopAttendanceWatch = null;
let attendanceLookupGeneration = 0;
let showPageUnmounted = false;

const attendanceState = ref('unknown'); // unknown | not_checked_in | checked_in
const attendanceResolved = computed(() => attendanceState.value !== 'unknown');
const hasCheckedIn = computed(() => attendanceState.value === 'checked_in');

const isShowModeLive = computed(() => {
  const data = band.value?.data;
  if (!data?.showModeEnabled) return false;
  if (data.showModeStatus && data.showModeStatus !== 'live') return false;

  const endsAt = data.showModeEndsAt ? new Date(data.showModeEndsAt).getTime() : null;
  if (endsAt && !Number.isNaN(endsAt) && showModeNowTs.value >= endsAt) return false;

  return true;
});

const canOfferCheckIn = computed(
  () => isShowModeLive.value && attendanceState.value === 'not_checked_in'
);

const showAttendanceIdentity = computed(() => {
  if (!isShowModeLive.value || !band.value?.data?.id) return '';
  const campaignId = band.value.data.showModeCampaignId || '';
  const eventId = band.value.data.showModeEventId || '';
  if (!campaignId && !eventId) return '';
  return `${band.value.data.id}:${campaignId}:${eventId}`;
});

async function resolveShowAttendance() {
  const generation = ++attendanceLookupGeneration;
  attendanceState.value = 'unknown';

  if (!showAttendanceIdentity.value) return;

  try {
    const { ensureSession, getVisitorToken } = useFanIdentity();
    await ensureSession();

    const strapiToken = useStrapiToken();
    const headers = strapiToken.value
      ? { Authorization: `Bearer ${strapiToken.value}` }
      : {};
    const response = await $fetch(`${config.public.strapiUrl}/api/fan-interactions/check-in-status`, {
      params: {
        bandId: band.value.data.id,
        campaignId: band.value.data.showModeCampaignId || undefined,
        eventId: band.value.data.showModeEventId || undefined,
        visitorToken: getVisitorToken() || undefined,
      },
      headers,
    });

    if (generation !== attendanceLookupGeneration || showPageUnmounted) return;
    if (response?.data?.resolved !== true) return;
    attendanceState.value = response.data.checkedIn ? 'checked_in' : 'not_checked_in';
  } catch (error) {
    // Fail closed: unknown attendance never renders or auto-opens a check-in CTA.
    if (generation === attendanceLookupGeneration) attendanceState.value = 'unknown';
  }
}

// Analytics has to agree with the visible check-in surface about when a show is
// live, so every tracking call reads this instead of the raw showModeEnabled
// flag. Campaign tagging stops the moment the show is over — otherwise late
// interactions land in the recap of a show that already ended.
function showTrackingContext() {
  if (!isShowModeLive.value) {
    return { campaignId: null, interactionContext: 'normal' };
  }
  return {
    campaignId: band.value?.data?.showModeCampaignId || null,
    interactionContext: 'show_mode',
  };
}

onMounted(() => {
  showModeNowTs.value = Date.now();
  showModeTicker = setInterval(() => {
    showModeNowTs.value = Date.now();
  }, 60000);

  // Prefill check-in for returning fans (client only — never during SSR).
  const storedEmail = readStoredFanEmail();
  if (storedEmail) checkInFanEmail.value = storedEmail;

  // Replay any check-in that couldn't reach the server at the venue before
  // resolving attendance, so a queued success cannot briefly re-offer check-in.
  flushCheckInQueue().finally(() => {
    if (showPageUnmounted) return;
    stopAttendanceWatch = watch(
      showAttendanceIdentity,
      (identity, previousIdentity) => {
        if (identity !== previousIdentity) autoOpenHandled = false;
        resolveShowAttendance();
      },
      { immediate: true }
    );
  });
  window.addEventListener('online', refreshAttendanceAfterQueue);

  // Zero-tap check-in waits for confirmed non-attendance. Unknown never opens.
  stopAutoOpenWatch = watch(
    canOfferCheckIn,
    (canOffer) => {
      if (!canOffer || autoOpenHandled) return;
      autoOpenHandled = true;

      if (readMark('mbq_show_checkin_dismissed')) return;
      // Returning from a payment redirect deserves the payment banner, not a modal.
      if (route.query?.paid || route.query?.canceled) return;

      autoOpenTimer = setTimeout(() => {
        if (!checkInModalOpen.value) openCheckInModal();
      }, 1200);
    },
    { immediate: true }
  );
});

onUnmounted(() => {
  showPageUnmounted = true;
  attendanceLookupGeneration += 1;
  if (showModeTicker) clearInterval(showModeTicker);
  showModeTicker = null;

  if (autoOpenTimer) clearTimeout(autoOpenTimer);
  autoOpenTimer = null;
  if (stopAutoOpenWatch) stopAutoOpenWatch();
  if (stopAttendanceWatch) stopAttendanceWatch();

  window.removeEventListener('online', refreshAttendanceAfterQueue);
});

// Dynamic OG tags for social sharing
const siteUrl = 'https://faneqo.com'

// The full band loads in the browser; fetch just the head fields during the
// server render so link previews and crawlers get the artist's name and bio.
const headSlug = String(route.params.bandSlug || '').toLowerCase()
const { data: serverHead } = useAsyncData(
  `artist-head-${headSlug}`,
  () =>
    $fetch(`${config.public.strapiUrl}/api/bands/slug/${encodeURIComponent(headSlug)}`, { timeout: 4000 })
      .catch(() => null),
  { transform: pickArtistHeadFields, server: true }
)
const headBand = computed(() => band.value?.data || serverHead.value || {})

const ogBandName = computed(() => headBand.value.name || currentBandSlug.value)

// Page <title> — band name + music context for SEO
const ogTitle = computed(() => `${ogBandName.value} | Music, Tour Dates & Links`)

// Strip markdown/HTML and collapse whitespace from a bio string
function cleanBio(raw) {
  if (!raw || typeof raw !== 'string') return ''
  return raw
    .replace(/<[^>]*>/g, ' ')      // strip HTML tags
    .replace(/[#*_>`~]/g, '')       // strip common markdown chars
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim()
}

function truncate(str, max = 160) {
  if (!str) return ''
  if (str.length <= max) return str
  return str.slice(0, max - 1).replace(/\s+\S*$/, '').trim() + '…'
}

// Rich, SEO-friendly description: prefer the band bio, then build one
const ogDescription = computed(() => {
  const d = headBand.value
  const bio = cleanBio(d.description || d.bio || '')
  if (bio) return truncate(bio, 200)

  const genre = (d.genre || d.genres || '').toString().trim()
  const location = (d.location || d.hometown || d.city || '').toString().trim()
  const bits = [ogBandName.value]
  if (genre) bits.push(genre)
  if (location) bits.push(location)
  const lead = bits.join(' • ')
  return `${lead} — stream music, watch videos, see tour dates, and follow ${ogBandName.value} on Faneqo.`
})

const ogUpdatedAt = computed(() => headBand.value.updatedAt || '')
// Version by the band's last update so previews cache; never the request time,
// which made every crawl a new URL (and a fresh server-side render).
const ogCacheVersion = computed(() => ogUpdatedAt.value ? new Date(ogUpdatedAt.value).getTime() : null)
const ogImageUrl = computed(() => `${siteUrl}/api/og/band/${currentBandSlug.value}.png${ogCacheVersion.value ? `?v=${ogCacheVersion.value}` : ''}`)
const ogCanonicalUrl = computed(() => `${siteUrl}/${currentBandSlug.value}`)

useHead({
  title: () => ogTitle.value,
  htmlAttrs: { class: 'fq-artist-route' },
  bodyAttrs: { class: 'fq-artist-route' },
  meta: [
    { name: 'description', content: () => ogDescription.value },
    { property: 'og:site_name', content: 'Faneqo' },
    { property: 'og:title', content: () => ogBandName.value },
    { property: 'og:description', content: () => ogDescription.value },
    { property: 'og:type', content: 'profile' },
    { property: 'og:url', content: () => ogCanonicalUrl.value },
    { property: 'og:image', content: () => ogImageUrl.value },
    { property: 'og:image:secure_url', content: () => ogImageUrl.value },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: () => `${ogBandName.value} on Faneqo` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: () => ogBandName.value },
    { name: 'twitter:description', content: () => ogDescription.value },
    { name: 'twitter:image', content: () => ogImageUrl.value },
    { name: 'twitter:image:alt', content: () => `${ogBandName.value} on Faneqo` },
  ],
  link: [
    { rel: 'canonical', href: () => ogCanonicalUrl.value },
  ],
})

const isCurrentBandSaved = computed(() => {
  const slug = currentBandSlug.value;
  if (!slug) return false;
  return isSaved(slug);
});

function onFanSubscribed(data) {
  if (data?.email) checkInFanEmail.value = data.email;
  showFanToast('fan_subscribe');
  markSessionFollowed({ subscribed: true });
  refreshFollowState();
}

function onToggleSaveBand() {
  const slug = currentBandSlug.value;
  if (!slug) return;

  const payload = {
    bandSlug: slug,
    bandName: band.value?.data?.name || slug,
    bandImageUrl: band.value?.data?.bandImg?.url || null,
  };

  const didSave = toggleSaveBand(payload);
  if (didSave) {
    showSavedConfirmation.value = true;
    showFanToast('save'); // Smart Link Live Surface toast
    if (savedConfirmationTimeout) clearTimeout(savedConfirmationTimeout);
    savedConfirmationTimeout = setTimeout(() => {
      showSavedConfirmation.value = false;
      savedConfirmationTimeout = null;
    }, 2500);
  } else {
    showSavedConfirmation.value = false;
    if (savedConfirmationTimeout) {
      clearTimeout(savedConfirmationTimeout);
      savedConfirmationTimeout = null;
    }
  }
}

// ⬇️ add this small helper near the top of <script setup>
function readQrStampFromCookie() {
  if (typeof document === 'undefined') return null
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith('mbq_qr_src='))
  if (!raw) return null
  try {
    const json = decodeURIComponent(raw.split('=')[1] || '')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function clearQrStampCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `mbq_qr_src=; path=/; max-age=0; sameSite=lax`
}


function preloadHero(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(true); // nothing to wait on
    const img = new Image();
    // ask browser to prioritize this
    img.loading = "eager";
    img.decoding = "sync";
    // if you serve from a different origin and need it later on canvas, uncomment:
    // img.crossOrigin = 'anonymous'
    const done = () => resolve(true);
    img.onload = done;
    img.onerror = done; // don’t hang the UI if it fails
    img.src = src;
    if (img.complete) return resolve(true); // cached path
    // final guard so we never spin forever (network weirdness)
    setTimeout(done, 3000);
  });
}

const isVideoPlaying = ref(false);

/* ---------- helpers ---------- */
function extractYouTubeId(url) {
  const m = url?.match(/[?&]v=([^&]+)/) || url?.match(/youtu\.be\/([^?]+)/);
  return m ? m[1] : "";
}

function sanitizeEmbed(html) {
  if (!html) return "";
  // must contain an iframe; strip scripts
  if (!/<iframe[\s\S]*<\/iframe>/i.test(html)) return "";
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  
  // Improve Spotify embeds - ensure proper sizing
  if (cleaned.includes('open.spotify.com/embed')) {
    // Force iframe to fill container
    cleaned = cleaned.replace(/<iframe/i, '<iframe style="width:100%;height:100%;border:none;border-radius:12px;"');
    // Remove any fixed width/height attributes that conflict
    cleaned = cleaned.replace(/\s(width|height)=["'][^"']*["']/gi, '');
  }
  
  return cleaned;
}

// Detect Spotify embed type for smart height sizing
function getSpotifyEmbedType(html) {
  if (!html) return 'track';
  if (/spotify\.com\/embed\/playlist/i.test(html)) return 'playlist';
  if (/spotify\.com\/embed\/album/i.test(html)) return 'album';
  if (/spotify\.com\/embed\/artist/i.test(html)) return 'artist'; // Artist top tracks
  if (/spotify\.com\/embed\/track/i.test(html)) return 'track';
  if (/soundcloud\.com.*playlists/i.test(html)) return 'playlist';
  return 'track'; // default
}

/* ---------- embed & featured song ---------- */
const rawEmbedHtml = computed(
  () => band.value?.data?.singlesong?.embedHtml || ""
);
const safeEmbedHtml = computed(() => sanitizeEmbed(rawEmbedHtml.value));
const embedType = computed(() => getSpotifyEmbedType(rawEmbedHtml.value));

// Smart height based on content type:
// - track: compact (152px) - just the player
// - album: medium (352px) - shows several tracks  
// - artist: tall (400px) - shows top tracks
// - playlist: tall (500px) - shows many tracks for proper playlist experience
const embedHeightClass = computed(() => {
  switch (embedType.value) {
    case 'playlist': return 'h-[500px]';
    case 'artist': return 'h-[400px]';
    case 'album': return 'h-[352px]';
    default: return 'h-[152px]';
  }
});

const hasFeaturedSong = computed(() => {
  const s = band.value?.data?.singlesong;
  if (!s) return false;

  // Elite Spotify embed (new oEmbed flow)
  if (s.isEmbed && s.platform === 'spotify' && s.spotifyUrl && s.spotifyOembedHtml) {
    return true;
  }

  if (s.isEmbed) {
    // Only render if we truly have a valid iframe after sanitization
    return !!safeEmbedHtml.value;
  }

  // Raw audio mode: require a real file URL
  const nestedUrl = s?.song?.data?.attributes?.url;
  const directUrl = s?.song?.url;
  return !!(nestedUrl || directUrl);
});

// Check if this is an Elite Spotify embed (new oEmbed flow with metadata)
const isEliteSpotifyEmbed = computed(() => {
  const s = band.value?.data?.singlesong;
  if (!s) return false;
  return s.isEmbed && s.platform === 'spotify' && s.spotifyUrl && s.spotifyOembedHtml;
});

function handleFirstClick() {
  // Track the first interaction with the embed without blocking it
  if (!hasTrackedEmbedClick.value) {
    try {
      const bandId = band.value?.data?.id;
      const title = band.value?.data?.singlesong?.title || "song";
      trackMediaPlay(bandId, "song", title);
    } catch (e) {
      console.error("trackMediaPlay (embed) error:", e);
    } finally {
      hasTrackedEmbedClick.value = true;
      // Once we have recorded the first engagement, remove listeners to keep it lightweight.
      detachEmbedIframeListeners();
    }
  }
}

function onEmbedOverlayTap() {
  if (hasTrackedEmbedClick.value) return;

  embedShake.value = true;
  if (embedShakeTimeout) clearTimeout(embedShakeTimeout);
  embedShakeTimeout = setTimeout(() => {
    embedShake.value = false;
    embedShakeTimeout = null;
  }, 400);

  handleFirstClick();

  showEmbedTapAgainHint.value = true;
  if (embedTapAgainTimeout) clearTimeout(embedTapAgainTimeout);
  embedTapAgainTimeout = setTimeout(() => {
    showEmbedTapAgainHint.value = false;
    embedTapAgainTimeout = null;
  }, 2000);
}

function detachEmbedIframeListeners() {
  if (embedPlayerWrapperEl.value && onEmbedWrapperPointerDown) {
    embedPlayerWrapperEl.value.removeEventListener(
      "pointerdown",
      onEmbedWrapperPointerDown,
      true
    );
  }
  if (embedPlayerWrapperEl.value && onEmbedWrapperMouseDown) {
    embedPlayerWrapperEl.value.removeEventListener(
      "mousedown",
      onEmbedWrapperMouseDown,
      true
    );
  }
  if (embedPlayerWrapperEl.value && onEmbedWrapperTouchStart) {
    embedPlayerWrapperEl.value.removeEventListener(
      "touchstart",
      onEmbedWrapperTouchStart,
      true
    );
  }
  if (embedPlayerWrapperEl.value && onEmbedWrapperPointerEnter) {
    embedPlayerWrapperEl.value.removeEventListener(
      "pointerenter",
      onEmbedWrapperPointerEnter,
      true
    );
  }

  if (embedIframeEl.value && onEmbedIframeFocus) {
    embedIframeEl.value.removeEventListener("focus", onEmbedIframeFocus, true);
  }
  if (embedIframeEl.value && onEmbedIframePointerDown) {
    embedIframeEl.value.removeEventListener(
      "pointerdown",
      onEmbedIframePointerDown,
      true
    );
  }
  if (embedIframeEl.value && onEmbedIframeTouchStart) {
    embedIframeEl.value.removeEventListener(
      "touchstart",
      onEmbedIframeTouchStart,
      true
    );
  }
  if (embedIframeEl.value && onEmbedIframeMouseEnter) {
    embedIframeEl.value.removeEventListener(
      "mouseenter",
      onEmbedIframeMouseEnter,
      true
    );
  }
  if (embedIframeEl.value && onEmbedIframeMouseLeave) {
    embedIframeEl.value.removeEventListener(
      "mouseleave",
      onEmbedIframeMouseLeave,
      true
    );
  }

  if (typeof window !== "undefined" && onWindowBlur) {
    window.removeEventListener("blur", onWindowBlur, true);
  }

  if (typeof document !== "undefined" && onDocumentVisibilityChange) {
    document.removeEventListener(
      "visibilitychange",
      onDocumentVisibilityChange,
      true
    );
  }

  if (embedActivePollInterval) {
    clearInterval(embedActivePollInterval);
    embedActivePollInterval = null;
  }
  if (embedActivePollTimeout) {
    clearTimeout(embedActivePollTimeout);
    embedActivePollTimeout = null;
  }
  embedIframeEl.value = null;
  onEmbedWrapperPointerDown = null;
  onEmbedWrapperMouseDown = null;
  onEmbedWrapperTouchStart = null;
  onEmbedWrapperPointerEnter = null;
  onEmbedIframeFocus = null;
  onEmbedIframePointerDown = null;
  onEmbedIframeTouchStart = null;
  onEmbedIframeMouseEnter = null;
  onEmbedIframeMouseLeave = null;
  onWindowBlur = null;
  onDocumentVisibilityChange = null;
  embedHovering = false;
  lastEmbedHoverAt = 0;
}

async function attachEmbedIframeListeners() {
  if (typeof window === "undefined") return;

  await nextTick();

  const wrapper = embedPlayerWrapperEl.value;
  if (!wrapper) return;

  const iframe = wrapper.querySelector("iframe");
  if (!iframe) return;

  // Always detach first to avoid stale handlers if Nuxt re-renders.
  detachEmbedIframeListeners();

  // Wrapper-level listeners (more reliable across cross-origin iframe providers)
  onEmbedWrapperPointerDown = () => handleFirstClick();
  onEmbedWrapperMouseDown = () => handleFirstClick();
  onEmbedWrapperTouchStart = () => handleFirstClick();
  onEmbedWrapperPointerEnter = () => {
    embedHovering = true;
    lastEmbedHoverAt = Date.now();
  };

  wrapper.addEventListener("pointerdown", onEmbedWrapperPointerDown, true);
  wrapper.addEventListener("mousedown", onEmbedWrapperMouseDown, true);
  wrapper.addEventListener("touchstart", onEmbedWrapperTouchStart, true);
  wrapper.addEventListener("pointerenter", onEmbedWrapperPointerEnter, true);

  embedIframeEl.value = iframe;
  // Some providers/UA combos won't focus the iframe unless it is explicitly focusable.
  try {
    iframe.setAttribute("tabindex", "0");
  } catch {
    // ignore
  }

  onEmbedIframeFocus = () => handleFirstClick();
  onEmbedIframePointerDown = () => handleFirstClick();
  onEmbedIframeTouchStart = () => handleFirstClick();
  onEmbedIframeMouseEnter = () => {
    embedHovering = true;
    lastEmbedHoverAt = Date.now();
  };
  onEmbedIframeMouseLeave = () => {
    embedHovering = false;
  };

  // Hacky-but-good-UX: when a user clicks into a cross-origin iframe,
  // some browsers won't fire parent click/pointer events, but they often:
  // - focus the iframe element, or
  // - cause the top window to blur while the mouse is hovering over the iframe.
  onWindowBlur = () => {
    if (hasTrackedEmbedClick.value) return;
    if (!embedHovering) return;
    if (Date.now() - lastEmbedHoverAt > 2000) return;
    handleFirstClick();
  };

  // On some mobile browsers, a tap into an iframe can sometimes trigger visibility transitions.
  // This is a weak signal, so we only treat it as engagement if the iframe is currently focused.
  onDocumentVisibilityChange = () => {
    if (hasTrackedEmbedClick.value) return;
    if (document.visibilityState !== "hidden") return;
    if (document.activeElement === iframe) {
      handleFirstClick();
    }
  };

  // When the user clicks/taps inside the embed, the iframe element becomes focused.
  iframe.addEventListener("focus", onEmbedIframeFocus, true);
  iframe.addEventListener("pointerdown", onEmbedIframePointerDown, true);
  iframe.addEventListener("touchstart", onEmbedIframeTouchStart, true);
  iframe.addEventListener("mouseenter", onEmbedIframeMouseEnter, true);
  iframe.addEventListener("mouseleave", onEmbedIframeMouseLeave, true);
  window.addEventListener("blur", onWindowBlur, true);
  document.addEventListener("visibilitychange", onDocumentVisibilityChange, true);

  // Poll fallback: if the provider focuses the iframe without firing focus listeners reliably,
  // we still detect it (lightweight, short lived).
  embedActivePollInterval = setInterval(() => {
    if (hasTrackedEmbedClick.value) return;
    if (!embedIframeEl.value) return;
    if (document.activeElement === embedIframeEl.value) {
      handleFirstClick();
    }
  }, 500);

  // Don't poll forever; if the user never interacts, stop after a short window.
  embedActivePollTimeout = setTimeout(() => {
    if (embedActivePollInterval) {
      clearInterval(embedActivePollInterval);
      embedActivePollInterval = null;
    }
    if (embedActivePollTimeout) {
      clearTimeout(embedActivePollTimeout);
      embedActivePollTimeout = null;
    }
  }, 120000);
}

watch(
  () => safeEmbedHtml.value,
  async () => {
    await attachEmbedIframeListeners();
  }
);

onMounted(async () => {
  await attachEmbedIframeListeners();
});

onBeforeUnmount(() => {
  detachEmbedIframeListeners();
  if (savedConfirmationTimeout) {
    clearTimeout(savedConfirmationTimeout);
    savedConfirmationTimeout = null;
  }

  if (embedTapAgainTimeout) {
    clearTimeout(embedTapAgainTimeout);
    embedTapAgainTimeout = null;
  }
  if (embedShakeTimeout) {
    clearTimeout(embedShakeTimeout);
    embedShakeTimeout = null;
  }
});

/* ---------- streaming & social sections ---------- */
const hiddenLinkKeys = computed(() => {
  const v = band.value?.data?.hiddenLinks;
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (v && typeof v === 'object') return Object.keys(v).filter((k) => v[k]);
  return [];
});

// Alias for compact component
const hiddenLinks = hiddenLinkKeys;

function isLinkHidden(key) {
  return hiddenLinkKeys.value.includes(key);
}

/* ---------- compact style helpers ---------- */
function handleQuickTip(amount) {
  // Use a button that really charges this amount (tip_band first). A fixed-price
  // button would charge its own price, and a higher minimum would be refused.
  const accepts = (b) => b.pricingMode !== 'fixed' && !checkoutAmountError(b, amount, { custom: true });
  const buttons = enabledPaymentButtons.value;
  const tipBtn = buttons.find((b) => b.key === 'tip_band' && accepts(b)) || buttons.find(accepts);
  if (!tipBtn) {
    paymentError.value = `A $${amount} tip isn't available here. Choose an option below.`;
    return;
  }
  paymentAmountByKey.value[tipBtn.key] = amount;
  startCheckout(tipBtn);
}

function openShareModal() {
  // Use native share if available, otherwise copy link
  const shareUrl = `${window.location.origin}/${currentBandSlug.value}`;
  const shareData = {
    title: band.value?.data?.name || 'Check out this artist',
    text: `Check out ${band.value?.data?.name || 'this artist'} on Faneqo`,
    url: shareUrl
  };
  
  // V3: Track share action
  const bandId = band.value?.data?.id;
  if (bandId) {
    trackShareClick(bandId, navigator.share ? 'native' : 'clipboard', showTrackingContext());
  }
  
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {});
  }
}

const hasStreamingLinks = computed(() =>
  streamingPlatforms.some((p) => !!band.value?.data?.[p.name] && !isLinkHidden(p.name))
);
const hasSocialLinks = computed(() =>
  socialPlatforms.some((p) => !!band.value?.data?.[p.name] && !isLinkHidden(p.name))
);
const hasEventHubLinks = computed(() =>
  eventHubPlatforms.some((p) => !!band.value?.data?.[p.name] && !isLinkHidden(p.name))
);
const hasContactInfo = computed(() => {
  const d = band.value?.data;
  return d?.bookingEmail || d?.managementEmail || d?.pressEmail || d?.bookingAgent || d?.labelName;
});

/* ---------- video ---------- */
const singleVideoThumbnail = computed(() => {
  const id = extractYouTubeId(band.value?.data?.singlevideo?.youtubeid || "");
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
});
const singleVideoEmbedUrl = computed(() => {
  const id = extractYouTubeId(band.value?.data?.singlevideo?.youtubeid || "");
  return id ? `https://www.youtube.com/embed/${id}` : "";
});

/* ---------- formatting ---------- */
function formatDate(dateStr) {
  // Always English (US)
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSingleSong(single) {
  if (!single) return null;
  const nestedUrl = single?.song?.data?.attributes?.url;
  const directUrl = single?.song?.url;
  const fileUrl = nestedUrl || directUrl || null;

  return {
    id: single?.id,
    attributes: {
      title: single?.title || "Untitled",
      song: { data: { attributes: { url: fileUrl } } },
      duration: single?.duration || 0,
      cover: single?.cover || null,
      artist: band.value?.data?.name || "Artist",
    },
  };
}

/* ---------- tracking ---------- */
async function onSongPlay() {
  if (!band.value?.data?.singlesong) return;
  const bandId = band.value.data.id;
  const title = band.value.data.singlesong.title || "song";
  try {
    await trackMediaPlay(bandId, "song", title);
    
    // V3: Track featured song play
    trackFeaturedSongPlay(bandId, title, showTrackingContext());
  } catch (err) {
    console.error("❌ trackMediaPlay error:", err);
  }
}

async function playVideo() {
  isVideoPlaying.value = true;
  const bandId = band.value?.data?.id;
  const title =
    band.value?.data?.singlevideo?.title ||
    band.value?.data?.singlesong?.title ||
    "video";
  try {
    await trackMediaPlay(bandId, "video", title);
    
    // V3: Track video click
    const videoUrl = band.value?.data?.singlevideo?.youtubeid || '';
    trackVideoClick(bandId, videoUrl, showTrackingContext());
  } catch (err) {
    console.error("❌ video track error:", err);
  }
}

function handleClick(bandId, platform, url, metadata = {}) {
  // Trigger fan moment for link click
  triggerFanMomentForLinkClick();

  const platformLower = (platform || '').toLowerCase();
  const isOfficialMerchStore = platformLower === 'official_merch_store';
  const isEditorial = platformLower.startsWith('editorial_');

  const beaconMeta = {
    linkUrl: metadata.linkUrl || url,
    ...(metadata.linkLabel ? { linkLabel: metadata.linkLabel } : {}),
  };

  if (isOfficialMerchStore || isEditorial) {
    trackClickBeacon(bandId, platform, beaconMeta);
  } else {
    trackClick(bandId, platform, url, beaconMeta);
  }

  // V3: Track interaction based on platform type
  const trackingContext = showTrackingContext();

  if (platformLower.includes('spotify')) {
    trackSpotifyClick(bandId, url, trackingContext);
  } else if (platformLower.includes('apple')) {
    trackAppleMusicClick(bandId, url, trackingContext);
  } else if (platformLower.includes('youtube')) {
    trackYouTubeClick(bandId, url, trackingContext);
  } else if (platformLower.includes('ticket')) {
    trackTicketClick(bandId, url, trackingContext);
  } else if (platformLower.includes('merch') && !isOfficialMerchStore) {
    trackMerchClick(bandId, url, trackingContext);
  }
}

/* ---------- data fetch ---------- */
async function fetchBandData() {
  notFound.value = false;
  loadingData.value = true;

  const incomingSlug = String(route.params.bandSlug || "").toLowerCase();
  const canonicalSlug = incomingSlug
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "");
  const slug = incomingSlug;
  const api = config.public.strapiUrl;

  if (import.meta.dev) {
    const { isFaneqoTestBandSlug, getFaneqoTestBandPayload } = await import(
      '~/utils/dev/faneqoTestBand'
    )
    if (isFaneqoTestBandSlug(slug)) {
      band.value = getFaneqoTestBandPayload()
      events.value = []
      initPaymentDefaults()
      await preloadHero(band.value?.data?.bandImg?.url || null)
      heroReady.value = true
      loadingData.value = false
      return
    }
  }

  // Fetch band data - let the controller return all scalar fields by default
  // Only specify populate for relations we need
  const buildUrl = (s) =>
    `${api}/api/bands/slug/${encodeURIComponent(s)}` +
    `?populate[bandImg][fields][0]=url` +
    `&populate[bandImg][fields][1]=width` +
    `&populate[bandImg][fields][2]=height` +
    `&populate[bandImg][fields][3]=alternativeText` +
    `&populate[bandImg][fields][4]=mime` +
    `&populate[bandImg][fields][5]=formats` +
    `&populate[singlevideo][fields][0]=youtubeid&populate[singlevideo][fields][1]=title` +
    `&populate[singlesong][fields][0]=title&populate[singlesong][fields][1]=isEmbed&populate[singlesong][fields][2]=embedHtml&populate[singlesong][fields][3]=platform&populate[singlesong][fields][4]=spotifyUrl&populate[singlesong][fields][5]=spotifyOembedTitle&populate[singlesong][fields][6]=spotifyOembedThumbnailUrl&populate[singlesong][fields][7]=spotifyOembedType&populate[singlesong][fields][8]=spotifyOembedHtml` +
    `&populate[singlesong][populate][song][fields][0]=url&populate[singlesong][populate][cover][fields][0]=url` +
    `&populate[events][fields][0]=date&populate[events][fields][1]=slug&populate[events][fields][2]=city&populate[events][fields][3]=state&populate[events][fields][4]=venue` +
    `&populate[customButtons][populate][customIcon][fields][0]=url` +
    `&populate[editorialItems][populate][image][fields][0]=url`;

  try {
    let res = await fetch(buildUrl(slug), { cache: "no-store" });

    // If someone hits an old hyphenated URL, retry with canonical no-hyphen slug.
    if (res.status === 404 && canonicalSlug && canonicalSlug !== slug) {
      res = await fetch(buildUrl(canonicalSlug), { cache: "no-store" });
      if (res.ok) {
        // Redirect to canonical, no-hyphen URL.
        router.replace({ path: `/${canonicalSlug}`, query: route.query });
      }
    }

    if (res.status === 404) {
      band.value = null;
      notFound.value = true;
      heroReady.value = true;
      return;
    }

    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const data = await res.json();
    band.value = data;

    // Peek at shape so we know how to unwrap
console.log('[BAND PAYLOAD]', band.value);


// Support BOTH shapes (flattened via custom slug route, or Strapi default)
let evts = [];
const maybeFlat = band.value?.data?.events;                // e.g. [{ id, date, city, ... }]
const maybeStrapi = band.value?.data?.events?.data;        // e.g. [{ id, attributes: {...}}]

if (Array.isArray(maybeFlat)) {
  evts = maybeFlat.filter(Boolean);
} else if (Array.isArray(maybeStrapi)) {
  evts = maybeStrapi
    .filter(Boolean)
    .map(({ id, attributes }) => ({ id, ...(attributes || {}) }));
} else {
  evts = [];
}

// Normalize minimal fields the template expects
events.value = evts.map(e => ({
  id: e.id,
  date: e.date || e.eventDate || e.startDate || null,
  city: e.city ?? null,
  state: e.state ?? null,
  venue: e.venue ?? null,
  slug: e.slug ?? null,
})).filter(e => !!e.date);

    initPaymentDefaults();


    // build the exact URL you’ll render for the hero
    const raw = band.value?.data?.bandImg?.url || null;

    // If you want to be 100% identical to <NuxtImg>, generate the same URL:
    // const img = useImage()            // import { useImage } from '#imports'
    // const heroUrl = raw ? img(raw, { format:'webp', modifiers:{ fit:'cover', quality:60 } }) : null
    // await preloadHero(heroUrl)

    await preloadHero(raw); // (works fine — the transformed NuxtImg URL will use the cache)

    heroReady.value = true;
    // ✅ Fire exactly once when the page is actually ready
    await sendPageView();
  } catch (e) {
    console.error("Fetch band error:", e);
    heroReady.value = true; // don’t hang the page on errors
    band.value = null;
    notFound.value = true;
  } finally {
    console.log(events.value, band.value , 'bandpayload')
    loadingData.value = false;
  }
}

/* ---------- events ---------- */
const today = new Date();

const upcomingEvents = computed(() =>
  events.value
    .filter((e) => {
      // Parse date in local timezone by adding time component
      const eventDate = new Date(e.date + "T00:00:00")
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0) // Start of today
      return eventDate >= todayDate
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
);

const pastEvents = computed(() =>
  events.value
    .filter((e) => {
      // Parse date in local timezone by adding time component
      const eventDate = new Date(e.date + "T00:00:00")
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0) // Start of today
      return eventDate < todayDate
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
);

const nextUpcomingEvent = computed(() => upcomingEvents.value[0] || null);

const otherUpcomingEvents = computed(() =>
  upcomingEvents.value.length > 1 ? upcomingEvents.value.slice(1) : []
);

// Pagination for Other Upcoming Events
const upcomingEventsPage = ref(1);
const eventsPerPage = 3;
const totalUpcomingPages = computed(() => Math.ceil(otherUpcomingEvents.value.length / eventsPerPage));
const paginatedUpcomingEvents = computed(() => {
  const start = (upcomingEventsPage.value - 1) * eventsPerPage;
  return otherUpcomingEvents.value.slice(start, start + eventsPerPage);
});

// Pagination for Past Events
const pastEventsPage = ref(1);
const totalPastPages = computed(() => Math.ceil(pastEvents.value.length / eventsPerPage));
const paginatedPastEvents = computed(() => {
  const start = (pastEventsPage.value - 1) * eventsPerPage;
  return pastEvents.value.slice(start, start + eventsPerPage);
});

const streamingPlatforms = [
  // Existing platforms (keep img)
  { name: "youtube", img: youtubeIcon, label: "YouTube" },
  { name: "youtubeMusic", img: youtubeMusicIcon, label: "YouTube Music" },
  { name: "spotify", img: spotifyIcon, label: "Spotify" },
  { name: "appleMusic", img: appleMusicIcon, label: "Apple Music" },
  { name: "soundcloud", img: soundcloudIcon, label: "SoundCloud" },
  { name: "bandcamp", img: bandcampIcon, label: "Bandcamp" },
  { name: "deezer", img: deezerIcon, label: "Deezer" },
  { name: "twitch", img: twitchIcon, label: "Twitch" },
  { name: "reverbnation", img: reverbnationIcon, label: "Reverbnation" },
  // New platforms (use iconify)
  { name: "amazonMusic", iconify: "simple-icons:amazonmusic", label: "Amazon Music" },
  { name: "tidal", iconify: "simple-icons:tidal", label: "TIDAL" },
  { name: "pandora", iconify: "simple-icons:pandora", label: "Pandora" },
  { name: "audiomack", iconify: "simple-icons:audiomack", label: "Audiomack" },
  { name: "mixcloud", iconify: "simple-icons:mixcloud", label: "Mixcloud" },
  { name: "beatport", iconify: "simple-icons:beatport", label: "Beatport" },
  { name: "napster", iconify: "simple-icons:napster", label: "Napster" },
  { name: "vimeo", iconify: "simple-icons:vimeo", label: "Vimeo" },
  { name: "kick", iconify: "simple-icons:kick", label: "Kick" },
];

const socialPlatforms = [
  // Existing platforms (keep img)
  { name: "facebook", img: facebookIcon, label: "Facebook" },
  { name: "instagram", img: instagramIcon, label: "Instagram" },
  { name: "twitter", img: twitterIcon, label: "Twitter" },
  { name: "tiktok", img: tiktokIcon, label: "TikTok" },
  // New platforms (use iconify)
  { name: "threads", iconify: "simple-icons:threads", label: "Threads" },
  { name: "discord", iconify: "simple-icons:discord", label: "Discord" },
  { name: "telegram", iconify: "simple-icons:telegram", label: "Telegram" },
  { name: "reddit", iconify: "simple-icons:reddit", label: "Reddit" },
  { name: "pinterest", iconify: "simple-icons:pinterest", label: "Pinterest" },
  { name: "linkedin", iconify: "simple-icons:linkedin", label: "LinkedIn" },
  { name: "whatsapp", iconify: "simple-icons:whatsapp", label: "WhatsApp" },
  { name: "snapchat", iconify: "simple-icons:snapchat", label: "Snapchat" },
  { name: "patreon", iconify: "simple-icons:patreon", label: "Patreon" },
];

const eventHubPlatforms = [
  // New platforms (use iconify)
  { name: "bandsintown", iconify: "simple-icons:bandsintown", label: "Bandsintown" },
  { name: "songkick", iconify: "simple-icons:songkick", label: "Songkick" },
  { name: "jambase", iconify: "mdi:music-note", label: "JamBase" },
  { name: "relix", iconify: "mdi:microphone-variant", label: "Relix" },
];

const streamingPlatformsMap = Object.fromEntries(
  streamingPlatforms.map((p) => [p.name, p])
);

const socialPlatformsMap = Object.fromEntries(
  socialPlatforms.map((p) => [p.name, p])
);

const eventHubPlatformsMap = Object.fromEntries(
  eventHubPlatforms.map((p) => [p.name, p])
);

const orderedStreamingPlatforms = computed(() => {
  const order = layoutConfig.value.buttons.streaming;
  return order
    .map((id) => streamingPlatformsMap[id])
    .filter(Boolean);
});

const orderedSocialPlatforms = computed(() => {
  const order = layoutConfig.value.buttons.social;
  return order
    .map((id) => socialPlatformsMap[id])
    .filter(Boolean);
});

const orderedEventHubPlatforms = computed(() => {
  const order = layoutConfig.value.buttons.eventHubs;
  return order
    .map((id) => eventHubPlatformsMap[id])
    .filter(Boolean);
});

/* ---------- Custom Buttons ---------- */
const customButtons = computed(() => {
  const buttons = band.value?.data?.customButtons;
  if (!Array.isArray(buttons)) return [];
  return buttons.map(btn => ({
    id: btn.id,
    title: btn.title || '',
    subtitle: btn.subtitle || '',
    url: btn.url || '',
    iconName: btn.iconName || '',
    customIcon: btn.customIcon?.data?.attributes || btn.customIcon || null
  }));
});

const isPublicationBand = computed(() => isPublicationProfile(band.value?.data));

const fanCaptureDisplayCopy = computed(() => {
  const data = band.value?.data;
  if (!data) {
    return {
      ...resolveFanCaptureCopy({}),
      successMessage: FAN_CAPTURE_DEFAULT_SUCCESS,
    };
  }
  if (isPublicationProfile(data)) {
    return getPublicationFanCaptureCopy(data);
  }
  return {
    ...resolveFanCaptureCopy({
      headline: data.fanCaptureHeadline,
      message: data.fanCaptureMessage,
      artistName: data.name,
      buttonLabel: data.fanCaptureButtonLabel,
    }),
    successMessage: data.fanCaptureSuccessMessage || FAN_CAPTURE_DEFAULT_SUCCESS,
  };
});

function getCustomButtonIcon(button) {
  if (button.iconName) {
    const platform = detectPlatform(`https://${button.iconName}.com`);
    return platform.iconify;
  }
  return detectPlatform(button.url)?.iconify || 'mdi:link-variant';
}

function handleCustomButtonClick(event, button) {
  event.preventDefault();
  handleClick(band.value.data.id, 'custom', button.url);
}

/* ---------- Fan Moment ---------- */
const fanMomentRef = ref(null);
const pulseData = ref(null);

// Trigger fan moment for link clicks
function triggerFanMomentForLinkClick() {
  if (fanMomentRef.value?.earnMoment) {
    fanMomentRef.value.earnMoment('link_click', {
      landingPath: window.location.pathname,
    });
  }
}

// Trigger fan moment for follow
function triggerFanMomentForFollow() {
  if (fanMomentRef.value?.earnMoment) {
    fanMomentRef.value.earnMoment('follow', {
      landingPath: window.location.pathname,
    });
  }
}

// Trigger fan moment for payment
function triggerFanMomentForPayment() {
  if (fanMomentRef.value?.earnMoment) {
    fanMomentRef.value.earnMoment('payment', {
      landingPath: window.location.pathname,
    });
  }
}

/* ---------- Native Faneqo Follow ---------- */
const followBandId = computed(() => band.value?.data?.id || null)
const followBandName = computed(() => band.value?.data?.name || '')
const followSheetOpen = ref(false)
const unfollowSheetOpen = ref(false)
const shareDrawerOpen = ref(false)
const {
  followed: isNativeFollowing,
  contactable: isFanListContactable,
  followBusy,
  followError,
  onFollowAction,
  endRelationship,
  markSessionFollowed,
  refreshFollowState,
  offerFollowPassport,
} = useArtistPageFollow({
  bandId: followBandId,
  bandSlug: currentBandSlug,
  bandName: followBandName,
  onAnonymousFollow: () => {
    hidePassportInvite()
    unfollowSheetOpen.value = false
    followSheetOpen.value = true
  },
  onConfirmUnfollow: () => {
    followSheetOpen.value = false
    unfollowSheetOpen.value = true
  },
})

const { showAfterFollowSaved, hide: hidePassportInvite } = useFanAccountConversion()

function passportInviteContext(email) {
  return {
    email,
    bandName: band.value?.data?.name || '',
    returnTo: route.fullPath,
    artistImage: band.value?.data?.bandImg?.url || '',
    photos: featuredGalleryTeaser(band.value?.data?.featuredGallery)?.photos || [],
    bandId: band.value?.data?.id,
    bandSlug: currentBandSlug.value,
  }
}

function onFollowSheetJoined(data) {
  if (data?.email) checkInFanEmail.value = data.email
  markSessionFollowed({ subscribed: data?.subscribed === true })
  refreshFollowState()
  const opened = showAfterFollowSaved(passportInviteContext(data?.email))
  if (opened) followSheetOpen.value = false
}

async function onUnfollowConfirmed() {
  const result = await endRelationship()
  if (result.ok) unfollowSheetOpen.value = false
}

function onFollowPassportPath(payload) {
  followSheetOpen.value = false
  if (payload?.followed) {
    showAfterFollowSaved(passportInviteContext(payload?.email))
    return
  }
  offerFollowPassport(payload?.email)
}

const {
  status: messageStatus,
  sending: messageSending,
  sheetOpen: messageSheetOpen,
  sheetStep: messageSheetStep,
  error: messageError,
  label: messageActionLabel,
  disabled: messageActionDisabled,
  loadStatus: loadMessageStatus,
  onMessageTap,
  closeSheet: closeMessageSheet,
  sendAuthLink,
  consumeMessageIntent,
  saveNameAndContinue,
  sendRequest: sendFanMessageRequest,
} = useFanMessageRequest()
const messageActionPending = computed(() => messageStatus.value.state === 'pending')

function onMessageArtist() {
  onMessageTap({
    bandId: band.value?.data?.id,
    bandName: band.value?.data?.name,
    bandSlug: currentBandSlug.value,
  })
}

function onMessageContinueFree(email) {
  sendAuthLink({ email, bandName: band.value?.data?.name })
}

function onMessageSaveName({ firstName, lastName }) {
  saveNameAndContinue({
    bandId: band.value?.data?.id,
    firstName,
    lastName,
  })
}

function onMessageSendRequest(bodyText) {
  sendFanMessageRequest({
    bandId: band.value?.data?.id,
    bodyText,
    firstName: messageStatus.value.firstName,
    lastName: messageStatus.value.lastName,
  })
}

watch(
  () => band.value?.data?.id,
  (id) => {
    if (import.meta.dev && String(route.params.bandSlug || '').toLowerCase() === 'faneqo-test-band') return
    if (id) loadMessageStatus(id)
  },
  { immediate: true }
)

watch(
  () => [route.query.feq_intent, band.value?.data?.id],
  () => {
    const id = band.value?.data?.id
    if (!id) return
    consumeMessageIntent({
      bandId: id,
      bandName: band.value?.data?.name,
      bandSlug: currentBandSlug.value,
      artistImage: band.value?.data?.bandImg?.url || '',
    })
  },
  { immediate: true },
)

/* ---------- Show Check-In Modal ---------- */
// The page owns the canonical modal state. Every check-in entry point (floating
// CTA, the button inside fan capture, the post-signup prompt) routes here.
const checkInModalOpen = ref(false);
const checkInFanEmail = ref('');
const badgeModalOpen = ref(false);
const badgeAttendance = ref(null);

const { flush: flushQueuedCheckIns } = useShowCheckInQueue();

async function flushCheckInQueue() {
  try {
    await flushQueuedCheckIns();
  } catch (err) {
    // Replay is best-effort; the entries stay queued for the next attempt.
  }
}

async function refreshAttendanceAfterQueue() {
  await flushCheckInQueue();
  await resolveShowAttendance();
}

const FAN_EMAIL_STORAGE_KEY = 'mbq_fan_email';

function readStoredFanEmail() {
  try {
    return localStorage.getItem(FAN_EMAIL_STORAGE_KEY) || '';
  } catch (err) {
    return '';
  }
}

// Per-campaign dismissal mark. Attendance itself is never read from storage;
// canonical unsuppressed attendance is resolved through check-in-status.
function campaignMark(prefix) {
  const campaignId = band.value?.data?.showModeCampaignId;
  return campaignId ? `${prefix}:${campaignId}` : null;
}

function readMark(prefix) {
  const key = campaignMark(prefix);
  if (!key) return false;
  try {
    return Boolean(localStorage.getItem(key));
  } catch (err) {
    return false;
  }
}

function writeMark(prefix) {
  const key = campaignMark(prefix);
  if (!key) return;
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch (err) {
    // Non-essential: worst case we prompt again on the next load.
  }
}

function openCheckInModal() {
  if (!canOfferCheckIn.value) return;
  // Re-read on open: the fan may have just subscribed in this session.
  const storedEmail = readStoredFanEmail();
  if (storedEmail) checkInFanEmail.value = storedEmail;
  checkInModalOpen.value = true;
}

function closeCheckInModal() {
  checkInModalOpen.value = false;
  // Closing without checking in is an answer too — don't ask again tonight.
  if (!hasCheckedIn.value) writeMark('mbq_show_checkin_dismissed');
}

function onCheckInSuccess() {
  attendanceLookupGeneration += 1;
  attendanceState.value = 'checked_in';
  const storedEmail = readStoredFanEmail();
  if (storedEmail) checkInFanEmail.value = storedEmail;
}

// One modal at a time: hand off from check-in success to the badge surface.
function openBadgeModal(attendance) {
  badgeAttendance.value = attendance || null;
  checkInModalOpen.value = false;
  badgeModalOpen.value = true;
}

function onCheckInError(error) {
  console.error('[CheckIn] Error:', error);
}

const followablePlatforms = computed(() => {
  const platforms = [];
  const data = band.value?.data;
  if (!data) return platforms;

  // Streaming platforms
  for (const p of streamingPlatforms) {
    const url = data[p.name];
    if (url && !isLinkHidden(p.name)) {
      platforms.push({
        id: p.name,
        name: p.label,
        url,
        category: 'streaming',
        icon: p.img,
      });
    }
  }

  // Social platforms
  for (const p of socialPlatforms) {
    const url = data[p.name];
    if (url && !isLinkHidden(p.name)) {
      platforms.push({
        id: p.name,
        name: p.label,
        url,
        category: 'social',
        icon: p.img,
      });
    }
  }

  return platforms;
});

// ============================================
// SMART LINK LIVE SURFACE HANDLERS
// ============================================

function handleNowBannerCta(data) {
  if (data.type === 'link' && data.url) {
    handleClick(band.value?.data?.id, 'now_banner_cta', data.url);
  }
}

function handleScrollTo(section) {
  const sectionMap = {
    featured: '.featured-song-section, [class*="Featured Song"]',
    events: '.events-section, [class*="Upcoming Shows"]',
    support: '.support-section, [class*="Support"]',
  };
  
  const selector = sectionMap[section];
  if (!selector) return;
  
  const el = document.querySelector(selector);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function scrollToSupport() {
  handleScrollTo('support');
}

function handleContinueAction(data) {
  if (data.url) {
    handleClick(band.value?.data?.id, data.type, data.url);
  }
}

function trackFollowRedirect(platformId, url) {
  sendFollowTrackEvent({
    event: 'follow_redirect',
    bandId: band.value?.data?.id,
    bandSlug: currentBandSlug.value,
    platformId,
    url,
    timestamp: new Date().toISOString(),
  });
}

function sendFollowTrackEvent(data) {
  const apiUrl = `${config.public.strapiUrl}/api/band-ui-events/track`;
  const payload = {
    bandId: data.bandId,
    bandSlug: data.bandSlug,
    eventName: data.event,
    payload: {
      ...data,
      event: undefined,
      bandId: undefined,
      bandSlug: undefined,
    },
  };

  // Use sendBeacon for reliability during navigation
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(apiUrl, blob);
  } else if (typeof fetch !== 'undefined') {
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

// in the band page <script setup>
// onMounted(() => {
//   try {
//     const body = {
//       bandId: band.value?.data?.id,
//       path: location.pathname,
//       title: document.title
//     }
//     const blob = new Blob([JSON.stringify(body)], { type:'application/json' })
//     navigator.sendBeacon?.('/api/track/band-view', blob)
//     if (!navigator.sendBeacon) {
//       fetch('/api/track/band-view', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
//     }
//   } catch {}
// })
async function sendPageView() {
  // Don’t run on server
  if (typeof window === 'undefined') return;

  const id = band.value?.data?.id;
  if (!id) {
    console.warn("[page-view] no band id yet");
    return;
  }

  const payload = {
    bandId: id,
    path: location.pathname,
    title: document?.title || "",
    url: window.location.href, // ← NEW: full landing URL (UTMs included)
  };

  console.log("[page-view] → POST /api/track/band-view", payload);

  try {
    const res = await fetch("/api/track/band-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Note: the browser will send the Referer header automatically
    });
    const json = await res.json();
    console.log("[page-view] ←", res.status, json);
  } catch (err) {
    console.error("[page-view] ERROR", err);
  }
}


const beaconSent = ref(false);

// watch(() => band.value?.data?.id, async (id) => {
//   if (!id || beaconSent.value) return
//   beaconSent.value = true

//   const payload = { bandId: id, path: location.pathname, title: document.title }
//   const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })

//   try {
//     if (navigator.sendBeacon) {
//       navigator.sendBeacon('/api/track/band-view', blob)
//     } else {
//       await fetch('/api/track/band-view', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       })
//     }
//   } catch (err) {
//     console.error('band-view beacon error:', err)
//   }
// })

onMounted(() => {
  fetchBandData();
  handlePaymentQuery();
});

// V3: Track page view when band data loads
watch([loadingData, band], ([isLoading, bandVal]) => {
  if (isLoading) return;
  if (import.meta.dev && String(route.params.bandSlug || '').toLowerCase() === 'faneqo-test-band') return;
  const bandId = bandVal?.data?.id;
  if (!bandId) return;
  
  // Determine tracking context
  const trackingContext = showTrackingContext();

  // Track page view
  if (isShowModeLive.value) {
    const eventId = bandVal?.data?.showModeEventId || null;
    trackShowModePageView(bandId, { ...trackingContext, eventId });
  } else {
    trackPageView(bandId, trackingContext);
  }
}, { immediate: true });

// watch([loadingData, band], ([loadingData, bandVal]) => {
//   if (loadingData) return
//   const id = bandVal?.data?.id
//   if (!id) return
//   try {
//     const payload = {
//       bandId: id,
//       path: location.pathname,
//       title: document.title
//     }
//     const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
//     if (navigator.sendBeacon) {
//       navigator.sendBeacon('/api/track/band-view', blob)
//     } else {
//       fetch('/api/track/band-view', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       })
//     }
//   } catch {}
// }, { immediate: true })
</script>

<style scoped>
.embed-shake {
  animation: embedShake 0.4s ease-in-out;
}

@keyframes embedShake {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
  100% {
    transform: translateX(0);
  }
}

.embed-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
}

.fade-in {
  animation: fadeIn 0.25s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.embed-container iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.custom-border {
  border: 0.1px solid white;
}
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.spinner {
  border: 8px solid #f3f3f3;
  border-top: 8px solid #6200ee;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  margin-top: 2rem;
}
@keyframes spin {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
/* testing */
#embedPlayerWrapper :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
}

</style>

<!--
  Global html/body use height 100% plus overflow-x hidden, which makes BODY
  the real scroller. When hero/media height changes, the browser can drop
  body.scrollTop and the artist page jumps back to the top. Homepage already
  restores document scroll; this page needs the same.
-->
<style>
html.fq-artist-route,
html.fq-artist-route body {
  height: auto;
  min-height: 100%;
  overflow-x: clip;
  overflow-y: visible;
}

/*
  Live Cybered close is #050506 below 1024px and --faneqo-obsidian from 1024px.
  The route pad paints the mobile nav clearance with that same canvas.
  The header keeps its own black background.
*/
.artist-page-canvas,
html.fq-artist-route .fq-route-pad {
  background: #050506;
}

@media (min-width: 1024px) {
  .artist-page-canvas,
  html.fq-artist-route .fq-route-pad {
    background: var(--faneqo-obsidian, #050608);
  }
}
</style>
