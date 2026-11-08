<template>
  <Motion
    ref="showcaseRoot"
    class="demo-artist-showcase"
    :class="{
      'demo-compact': compact && !sequenceActive,
      'demo-showcase-mode': isShowcase,
      'demo-wake-clip': sequenceActive && !isViewport,
      'demo-viewport': isViewport,
      'demo-viewport-clip': isViewport,
      'demo-lite': isLite,
      'demo-preview': isPreview,
    }"
    :style="(sequenceActive || isViewport) ? wakeClipStyle : undefined"
    v-bind="phoneBind"
  >
    <div
      v-if="animated && !isShowcase && !isViewport && !isPreview"
      class="hidden lg:block absolute -inset-4 bg-gradient-to-r from-purple-500/15 via-pink-500/8 to-purple-500/15 rounded-[3rem] blur-2xl opacity-50 pointer-events-none"
    />

    <div v-if="isPreview" class="demo-preview-island" aria-hidden="true" />

    <div
      class="relative overflow-hidden bg-black"
      :data-reveal="productReveal ? 'shell' : undefined"
      :class="isViewport
        ? 'demo-viewport-surface'
        : isPreview
          ? 'demo-preview-screen'
          : 'rounded-[2rem] border border-white/10 shadow-2xl max-w-md lg:max-w-lg mx-auto'"
    >
      <!-- Hero — wake-up animates this frame only; outer phone clip stays fixed -->
      <component
        :is="sequenceActive ? Motion : 'div'"
        class="relative overflow-hidden"
        :class="heroFrameClass"
        v-bind="sequenceActive ? heroFrameBind : {}"
      >
        <component
          :is="sequenceActive ? Motion : 'div'"
          class="absolute inset-0 origin-top overflow-hidden"
          :class="{ 'will-change-transform': sequenceActive }"
          :data-reveal="productReveal ? 'photo' : undefined"
          v-bind="sequenceActive ? imageBind : {}"
        >
        <!--
          Short frames (compact / carousel) may use the landscape mobile crop.
          The Artist Page demo uses the tall 2:3 portrait so it matches /badflower.
        -->
        <picture v-if="useMobileHeroCrop">
          <source
            media="(max-width: 640px)"
            :srcset="artist.heroImageMobile"
            type="image/webp"
          />
          <img
            :src="artist.heroImage"
            :alt="`${artist.name} hero`"
            class="absolute inset-0 h-full w-full object-cover"
            :class="heroObjectClass"
            width="1000"
            height="1500"
            decoding="async"
            :loading="priority ? 'eager' : 'lazy'"
            :fetchpriority="priority ? 'high' : undefined"
          />
        </picture>
        <img
          v-else-if="artist.heroImage && !isShowcase"
          :src="artist.heroImage"
          :alt="`${artist.name} hero`"
          class="absolute inset-0 h-full w-full object-cover"
          :class="heroObjectClass"
          width="1000"
          height="1500"
          decoding="async"
          :loading="priority ? 'eager' : 'lazy'"
          :fetchpriority="priority ? 'high' : undefined"
        />
        <NuxtImg
          v-else-if="artist.heroImage"
          :src="artist.heroImage"
          :alt="`${artist.name} hero`"
          class="absolute inset-0 h-full w-full object-cover"
          :class="heroObjectClass"
          format="webp"
          :quality="priority ? 72 : 68"
          :sizes="isShowcase ? '380px' : priority ? '400px' : '320px'"
          :width="isShowcase ? 720 : 800"
          :height="isShowcase ? 960 : 1000"
          fit="cover"
          :loading="priority ? 'eager' : 'lazy'"
          :fetchpriority="priority ? 'high' : undefined"
        />
        <div v-else class="absolute inset-0 bg-[#0c0c10]" />
        </component>
        <div
          class="absolute inset-0"
          :class="isShowcase
            ? 'bg-gradient-to-t from-black via-black/35 to-black/10'
            : 'bg-gradient-to-t from-black via-black/30 to-transparent'"
        />

        <div v-if="artist.genre && !isShowcase && !isViewport && !isLite" class="absolute top-4 left-4">
          <div class="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-xs text-white/85 font-medium">
            {{ artist.genre }}
          </div>
        </div>

        <component
          :is="sequenceActive ? Motion : 'div'"
          class="absolute bottom-0 left-0 right-0"
          :class="isShowcase ? 'p-4 sm:p-5' : 'p-5 sm:p-6'"
          v-bind="sequenceActive ? titleBind : {}"
        >
          <h2
            class="font-extrabold tracking-tight text-white truncate"
            :data-reveal="productReveal ? 'name' : undefined"
            :class="isViewport
              ? 'demo-viewport-name'
              : isShowcase ? 'text-xl sm:text-2xl' : isLite ? 'text-[1.85rem] leading-none sm:text-3xl' : 'text-2xl sm:text-3xl'"
          >
            {{ artist.name }}
          </h2>
          <p
            v-if="isShowcase && artist.genre"
            class="mt-0.5 truncate text-xs text-white/65 sm:text-sm"
          >
            {{ String(artist.genre).split(/[,|]/)[0]?.trim() }}
          </p>
        </component>
      </component>

      <!-- Content -->
      <div
        class="bg-black/95 -mt-2 relative z-10 rounded-t-2xl border-t border-white/5"
        :class="{ 'demo-preview-world': isPreview }"
      >
        <!-- Bio -->
        <div
          v-if="artist.bio && !isViewport && (!isLite || isHqLite)"
          :data-reveal="productReveal ? 'bio' : undefined"
          :class="isHqLite ? 'px-4 pt-4 pb-3' : 'px-5 sm:px-6 pt-5 pb-4 text-center'"
        >
          <p
            class="text-white/65 text-sm leading-relaxed"
            :class="isHqLite ? 'line-clamp-2' : isShowcase ? 'line-clamp-2' : 'line-clamp-4'"
          >
            {{ artist.bio }}
          </p>
        </div>

        <!-- Featured Song -->
        <Motion
          v-if="artist.featuredSong"
          class="demo-wake-music"
          data-hq-wake="music"
          :data-reveal="productReveal ? 'music' : undefined"
          :class="[isViewport ? 'px-4 pb-3 pt-1' : isLite ? 'px-4 pb-3 pt-3' : 'px-5 sm:px-6 pb-4', { 'is-play-cue': playCue }]"
          v-bind="musicBind"
        >
          <h3 v-if="!isViewport && !isLite" class="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Featured Song</h3>
          <!-- Showcase / homepage lite: artwork player — no Spotify iframe -->
          <div
            v-if="isShowcase || isViewport || isLite || !(artist.featuredSong.kind === 'spotify' && artist.featuredSong.spotifyUrl)"
            class="flex items-center gap-3 p-3 rounded-xl bg-[#0c0c10] border border-white/10"
            :class="{ 'demo-viewport-ghost': isViewport, 'demo-lite-music': isLite }"
          >
            <div
              class="rounded-lg overflow-hidden flex-shrink-0 bg-white/5"
              :class="isViewport || isLite ? 'w-[4.75rem] h-[4.75rem]' : 'w-14 h-14'"
            >
              <img
                v-if="artist.featuredSong.thumbnailUrl"
                :src="artist.featuredSong.thumbnailUrl"
                :alt="artist.featuredSong.title"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-white truncate" :class="isLite ? 'text-[1.12rem] font-bold leading-tight tracking-tight' : 'font-semibold'">{{ artist.featuredSong.title }}</div>
              <div class="truncate" :class="isLite ? 'mt-0.5 text-sm text-white/55' : 'text-sm text-white/50'">{{ artist.featuredSong.artistName || artist.name }}</div>
            </div>
            <div
              v-if="isShowcase || isViewport || isLite"
              class="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0"
              :data-reveal="productReveal ? 'music-play' : undefined"
              :class="{ 'demo-viewport-play': isViewport }"
              aria-hidden="true"
            >
              <svg class="w-5 h-5 text-white/80 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <template v-else>
              <audio
                v-if="artist.featuredSong.audioUrl"
                ref="demoAudio"
                :src="artist.featuredSong.audioUrl"
                class="hidden"
              />
              <button
                v-if="artist.featuredSong.audioUrl"
                type="button"
                class="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/15 transition"
                aria-label="Play track"
                @click="toggleDemoAudio"
              >
                <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </template>
          </div>
          <EliteSpotifyEmbedWidget
            v-else
            :spotify-url="artist.featuredSong.spotifyUrl"
            :title="artist.featuredSong.title"
            :thumbnail-url="artist.featuredSong.thumbnailUrl"
            :type="artist.featuredSong.type || 'track'"
            :iframe-html="artist.featuredSong.iframeHtml"
            :artist-name="artist.featuredSong.artistName || artist.name"
          />
        </Motion>

        <!-- Featured Video -->
        <div
          v-if="artist.featuredVideo"
          data-hq-wake="video"
          :data-reveal="productReveal ? 'video' : undefined"
          :data-reveal-later="productReveal ? 'video' : undefined"
          :class="isViewport ? 'demo-viewport-peek' : isLite ? 'px-4 pb-3' : 'px-5 sm:px-6 pb-4'"
        >
          <h3 v-if="!isViewport && !isLite" class="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Featured Video</h3>
          <!-- Showcase / viewport: thumbnail only — no YouTube iframe -->
          <div
            v-if="isShowcase || isViewport || !isVideoPlaying"
            class="relative aspect-video overflow-hidden bg-[#0c0c10]"
            :class="isViewport
              ? 'demo-viewport-peek-frame'
              : ['rounded-xl border border-white/10', { 'cursor-pointer group': !isShowcase }]"
            @click="!isShowcase && !isViewport && playVideo()"
          >
            <img
              :src="artist.featuredVideo.thumbnailUrl"
              :alt="artist.featuredVideo.title"
              class="absolute inset-0 w-full h-full object-cover"
              :class="{ 'group-hover:opacity-95 transition': !isShowcase }"
              loading="lazy"
              @load="promoteYoutubeThumb"
            />
            <div class="absolute inset-0 flex items-center justify-center" v-if="!isViewport">
              <div
                class="rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center"
                :data-reveal="productReveal ? 'video-play' : undefined"
                :class="[
                  isLite ? 'w-14 h-14' : 'w-12 h-12 sm:w-14 sm:h-14',
                  { 'group-hover:bg-white/20 transition': !isShowcase },
                ]"
              >
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div v-if="!isViewport" class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div class="text-white font-semibold truncate" :class="isLite ? 'text-[0.95rem]' : 'text-sm'">{{ artist.featuredVideo.title }}</div>
              <div v-if="!isLite" class="text-white/55 text-xs truncate">{{ artist.name }}</div>
            </div>
          </div>
          <div v-else class="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
            <iframe
              :src="`${artist.featuredVideo.embedUrl}?autoplay=1`"
              class="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowfullscreen
              title="Featured video"
            />
          </div>
        </div>

        <!-- Upcoming show — HQ lite sits with music/video, not as a labeled module -->
        <div
          v-if="hqUpcomingEvents.length"
          class="px-4 pb-3"
          :data-reveal-later="productReveal ? 'show' : undefined"
        >
          <div
            v-for="event in hqUpcomingEvents"
            :key="event.id || event.slug || event.date"
            class="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-[#0c0c10] border border-white/10"
          >
            <div class="min-w-0">
              <div class="text-white font-semibold truncate">
                {{ event.city || 'TBA' }}<span v-if="event.state">, {{ event.state }}</span>
              </div>
              <div class="text-white/45 text-sm mt-0.5 truncate">
                {{ event.venue || 'Venue TBA' }} · {{ formatEventDate(event.date) }}
              </div>
            </div>
            <span
              class="shrink-0 text-sm font-medium text-white/55"
              :data-reveal="productReveal ? 'show-cta' : undefined"
            >
              Details
            </span>
          </div>
        </div>

        <!-- Website -->
        <div v-if="artist.website?.url && !isViewport && !isLite" class="px-5 sm:px-6 pb-4">
          <h3 class="demo-link-kicker text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Website</h3>
          <a
            :href="artist.website.url"
            target="_blank"
            rel="noopener noreferrer"
            class="demo-dest-row"
            @click="isShowcase && $event.preventDefault()"
          >
            <div class="demo-dest-icon">
              <svg class="h-5 w-5 text-white/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate font-semibold text-white">{{ artist.website.label || 'Official Website' }}</div>
              <div class="truncate text-xs text-white/40">{{ hostLabel(artist.website.url) }}</div>
            </div>
            <svg class="demo-dest-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <!-- Streaming + social: live polish-test destination rows -->
        <div v-if="visibleStreaming.length && !isViewport && !isLite" class="px-5 sm:px-6 pb-4">
          <h3 class="demo-link-kicker text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Streaming</h3>
          <div class="space-y-[0.58rem]">
            <a
              v-for="link in visibleStreaming"
              :key="link.name"
              :href="isShowcase ? undefined : link.url"
              :target="isShowcase ? undefined : '_blank'"
              :rel="isShowcase ? undefined : 'noopener noreferrer'"
              class="demo-dest-row"
              :class="isShowcase ? 'pointer-events-none' : ''"
            >
              <div class="demo-dest-icon">
                <PlatformIcon
                  :existing-icon="platformAsset(link.name)"
                  :iconify="platformIconify(link.name)"
                  :color="platformColor(link.name)"
                  :alt="link.label"
                  class-name="w-5 h-5"
                />
              </div>
              <span class="min-w-0 flex-1 truncate">{{ link.label }}</span>
              <svg class="demo-dest-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <div v-if="visibleSocial.length && !isViewport && !isLite" class="px-5 sm:px-6 pb-4">
          <h3 class="demo-link-kicker text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Social</h3>
          <div v-if="isShowcase" class="flex flex-wrap gap-2">
            <div
              v-for="link in visibleSocial"
              :key="link.name"
              class="demo-dest-icon"
              :title="link.label"
            >
              <PlatformIcon
                :existing-icon="platformAsset(link.name)"
                :iconify="platformIconify(link.name)"
                :color="platformColor(link.name)"
                :alt="link.label"
                class-name="w-5 h-5"
              />
            </div>
          </div>
          <div v-else class="space-y-[0.58rem]">
            <a
              v-for="link in visibleSocial"
              :key="link.name"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="demo-dest-row"
            >
              <div class="demo-dest-icon">
                <PlatformIcon
                  :existing-icon="platformAsset(link.name)"
                  :iconify="platformIconify(link.name)"
                  :color="platformColor(link.name)"
                  :alt="link.label"
                  class-name="w-5 h-5"
                />
              </div>
              <span class="min-w-0 flex-1 truncate">{{ link.label }}</span>
              <svg class="demo-dest-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <div
          v-if="liteWorldLinks.length"
          class="px-4 pb-3"
          :data-reveal-later="productReveal ? 'links' : undefined"
        >
          <div class="space-y-[0.58rem]">
            <a
              v-for="link in liteWorldLinks"
              :key="`lite-${link.name}`"
              :href="link.url"
              class="demo-dest-row pointer-events-none"
            >
              <div class="demo-dest-icon">
                <svg
                  v-if="link.name === 'website'"
                  class="h-5 w-5 text-white/80"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <PlatformIcon
                  v-else
                  :existing-icon="platformAsset(link.name)"
                  :iconify="platformIconify(link.name)"
                  :color="platformColor(link.name)"
                  :alt="link.label"
                  class-name="w-5 h-5"
                />
              </div>
              <span class="min-w-0 flex-1 truncate">{{ link.label }}</span>
              <svg class="demo-dest-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Fan List — live FanCaptureSection language, scaled for the phone. -->
        <div
          v-if="!isViewport && !isPreview && artist.fanList?.enabled !== false"
          :class="isLite ? 'px-4 pb-3.5' : 'px-5 sm:px-6 pb-4'"
        >
          <!-- Homepage headquarters: the real artist-page module, exactly as Badflower's
               page renders it (composition "close"). testMode keeps it local: joining
               shows the joined state and never calls the API. -->
          <div
            v-if="realFanList"
            class="demo-fan-real"
            data-hq-wake="fans"
            :data-reveal-later="productReveal ? 'fans' : undefined"
          >
            <FanCaptureSection
              variant="artist"
              composition="close"
              test-mode
              capture-surface="homepage_demo"
              :artist-image="artist.heroImageMobile || artist.heroImage || ''"
              :artist-name="artist.name || ''"
              :headline="liteFanHeadline"
              :message="liteFanMessage"
              :button-label="liteFanButton"
            />
          </div>
          <div
            v-else
            class="demo-fan fq-fan-card"
            data-hq-wake="fans"
            :data-reveal-later="productReveal ? 'fans' : undefined"
            :class="{ 'is-joined': fanJoined }"
          >
            <div class="demo-fan__edge fq-fan-edge" aria-hidden="true"></div>
            <div class="demo-fan__body">
              <div class="demo-fan__icon fq-fan-icon" aria-hidden="true">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="demo-fan__title">{{ liteFanHeadline }}</h3>
              <p v-if="!isShowcase" class="demo-fan__copy">{{ liteFanMessage }}</p>
              <div v-if="fanJoined" class="demo-fan__joined" role="status">
                You're on the list
              </div>
              <form v-else class="demo-fan__form" @submit.prevent="submitDemoFanSignup">
                <input
                  v-if="!isShowcase"
                  v-model="demoEmail"
                  type="email"
                  required
                  placeholder="your@email.com"
                  class="demo-fan__input fq-fan-input"
                  aria-label="Email address for fan list demo"
                />
                <button type="submit" class="demo-fan__btn fq-fan-cta" :tabindex="isShowcase ? -1 : 0">
                  {{ liteFanButton }}
                </button>
              </form>
              <p v-if="!fanJoined" class="demo-fan__trust">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>

        <!-- Events (neutral cards) -->
        <div v-if="visibleEvents.length && !isViewport" class="px-5 sm:px-6 pb-4">
          <h3 v-if="!isLite" class="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Upcoming Shows</h3>
          <div class="space-y-2">
            <div
              v-for="event in visibleEvents"
              :key="event.id || event.slug || event.date"
              class="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-[#0c0c10] border border-white/10"
            >
              <div class="min-w-0">
                <div class="text-white font-semibold truncate">
                  {{ event.city || 'TBA' }}<span v-if="event.state">, {{ event.state }}</span>
                </div>
                <div class="text-white/45 text-sm mt-0.5 truncate">
                  {{ event.venue || 'Venue TBA' }} · {{ formatEventDate(event.date) }}
                </div>
              </div>
              <span class="shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/55 text-sm font-medium">
                Details
              </span>
            </div>
          </div>
        </div>

        <!-- Official Merch Store -->
        <div v-if="artist.merchUrl && !isShowcase && !isViewport && !isLite" class="px-5 sm:px-6 pb-4">
          <a
            :href="artist.merchUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="demo-dest-row"
          >
            <div class="demo-dest-icon">
              <PlatformIcon iconify="lucide:shopping-bag" alt="" class-name="w-4 h-4" />
            </div>
            <span class="min-w-0 flex-1 truncate">Official Merch Store</span>
            <svg class="demo-dest-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <!-- Message / Follow / Share — live public-profile action language. No Save. -->
        <div
          v-if="!isShowcase && !isViewport && !isPreview"
          class="demo-profile-actions"
          :data-reveal-later="productReveal ? 'actions' : undefined"
          :class="isLite ? 'px-4 pb-5' : 'px-5 sm:px-6 pb-6'"
        >
          <ArtistPageActions
            variant="cybered"
            visual-variant="polish-test"
            message-label="Message artist"
            :show-follow="true"
            :show-save="false"
          />
        </div>
      </div>
    </div>

    <div v-if="isPreview" class="demo-preview-home" aria-hidden="true" />
  </Motion>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import EliteSpotifyEmbedWidget from '@/components/smartlink/EliteSpotifyEmbedWidget.vue'
import ArtistPageActions from '@/components/band/ArtistPageActions.vue'
import FanCaptureSection from '@/components/band/FanCaptureSection.vue'
import { resolveFanCaptureCopy } from '@/utils/fanCaptureCopy'
import PlatformIcon from '@/components/ui/PlatformIcon.vue'
import { FALLBACK_SNAPSHOT } from '~/composables/useHomepageDemoArtist'
import { SHOWCASE_FEATURED_VIDEOS } from '~/config/homepageDemo'
import { promoteYoutubeThumb } from '~/utils/media/youtubeThumb'
import {
  HOME_HERO_WAKE,
  HOME_HQ_WAKE,
  homeHeroFrameMotion,
  homeHeroImageMotion,
  homeHeroMusicMotion,
  homeHeroPhoneMotion,
  homeHeroTitleMotion,
  homeHeroWakePlayCueDelay,
  homeHeroWakeSettleStart,
} from '@/utils/ui/homeHeroWakeUp'
import { HOME_V2_HQ_WAKE } from '~/utils/home-v2/headquartersWake.js'
import { isHomeTypeReduced } from '@/utils/ui/homeTypeMotion'

// Same colored assets as BandPageCybered / real artist page
import spotifyIcon from '@/assets/spotify.svg'
import appleMusicIcon from '@/assets/apple.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'
import soundcloudIcon from '@/assets/soundcloudlast.png'
import bandcampIcon from '@/assets/bandcamp.svg'
import deezerIcon from '@/assets/dezzer.svg'
import facebookIcon from '@/assets/facebookfree.png'
import instagramIcon from '@/assets/instagramfree.png'
import twitterIcon from '@/assets/twitter.png'
import tiktokIcon from '@/assets/tiktok.png'

const props = defineProps({
  /** Normalized homepage demo artist (from useHomepageDemoArtist). */
  artist: {
    type: Object,
    default: null,
  },
  /**
   * `demo` — full interactive Badflower-style phone.
   * `showcase` — lightweight visual proof for the multi-artist Swiper.
   * `viewport` — Home V2 Headquarters first window (identity + music + video peek).
   */
  mode: {
    type: String,
    default: 'demo',
    validator: (v) => ['demo', 'showcase', 'viewport'].includes(v),
  },
  /** Alias for mode="showcase" */
  showcase: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  /**
   * Homepage HQ demo: curated public profile — not every Faneqo module.
   * Production artist-page demos must leave this false.
   */
  lite: {
    type: Boolean,
    default: false,
  },
  // Render the production fan-list module instead of the lite card (homepage HQ only)
  realFanList: {
    type: Boolean,
    default: false,
  },
  /**
   * Homepage product-reveal choreography markers only.
   * Does not change profile behavior.
   */
  productReveal: {
    type: Boolean,
    default: false,
  },
  /**
   * Carousel / proof preview: same HQ lite page, inner controls inert.
   * Parent should wrap with a link to the live artist page.
   */
  preview: {
    type: Boolean,
    default: false,
  },
  animated: {
    type: Boolean,
    default: true,
  },
  /**
   * Only the above-the-fold hero phone should be true.
   * Below-fold / Swiper phones stay lazy with normal priority.
   */
  priority: {
    type: Boolean,
    default: false,
  },
  /**
   * Homepage hero wake-up: internal hero arrives large, then compacting
   * reveals Featured Music. Outer phone clip stays fixed.
   */
  wakeUp: {
    type: Boolean,
    default: false,
  },
  /**
   * `hero` — desktop first-section phone (existing timing).
   * `headquarters` — mobile Artist Page mockup; tighter clip, in-view start.
   */
  wakeVariant: {
    type: String,
    default: 'hero',
    validator: (v) => ['hero', 'headquarters'].includes(v),
  },
})

const PREVIEW_LINKS = [
  { name: 'spotify', label: 'Spotify', url: '#' },
  { name: 'appleMusic', label: 'Apple Music', url: '#' },
  { name: 'youtube', label: 'YouTube', url: '#' },
]

function withPreviewModules(source) {
  const art = source.heroImage || source.heroImageMobile || ''
  const streaming = Array.isArray(source.streaming) && source.streaming.length
    ? source.streaming
    : PREVIEW_LINKS
  const featuredVideo =
    SHOWCASE_FEATURED_VIDEOS[source.slug] ||
    source.featuredVideo || {
      title: `${source.name} — Watch`,
      thumbnailUrl: art,
    }
  return {
    ...source,
    featuredSong: source.featuredSong || {
      title: 'Latest release',
      artistName: source.name,
      thumbnailUrl: art,
    },
    featuredVideo,
    streaming,
  }
}

const isShowcase = computed(() => props.showcase || props.mode === 'showcase')
const isViewport = computed(() => props.mode === 'viewport')
const isPreview = computed(() => !!props.preview)
const artist = computed(() => {
  const source = props.artist || FALLBACK_SNAPSHOT
  return isPreview.value ? withPreviewModules(source) : source
})
const isLite = computed(() => !!props.lite || isPreview.value)
const isHqLite = computed(() => isLite.value && !isPreview.value)

const typePreference = usePreferredReducedMotion()
const reducedMotion = computed(() => isHomeTypeReduced(typePreference.value))
const isMobileHome = ref(true)
const heroCompacted = ref(false)
const playCue = ref(false)
const wakeArmed = ref(false)
const showcaseRoot = ref(null)
let settleTimer = 0
let cueTimer = 0
let cueOffTimer = 0
let homeMq = null
let onHomeMqChange = null
let wakeObserver = null
let wakeFailsafe = 0

const isHeadquartersWake = computed(() => props.wakeVariant === 'headquarters' || isViewport.value)
const wakeTokens = computed(() => {
  if (isViewport.value) return HOME_V2_HQ_WAKE
  return isHeadquartersWake.value ? HOME_HQ_WAKE : HOME_HERO_WAKE
})

const sequenceActive = computed(() => {
  if (!props.wakeUp || isShowcase.value) return false
  if (isViewport.value) return true
  if (props.compact) return true
  return isMobileHome.value
})

const phoneBind = computed(() => {
  // Viewport must paint visible without JS. Never start HQ at opacity 0.
  if (!sequenceActive.value || isViewport.value) {
    return {
      initial: { opacity: 1, y: 0, scale: 1 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0 },
    }
  }
  const motion = homeHeroPhoneMotion(reducedMotion.value, wakeTokens.value)
  if (isHeadquartersWake.value && !wakeArmed.value && !reducedMotion.value) {
    return {
      initial: motion.initial,
      animate: motion.initial,
      transition: { duration: 0 },
    }
  }
  return motion
})

const heroFrameBind = computed(() => {
  if (!sequenceActive.value || isViewport.value) {
    return {
      initial: false,
      animate: false,
      transition: { duration: 0 },
    }
  }
  return homeHeroFrameMotion(reducedMotion.value, heroCompacted.value, wakeTokens.value)
})

const imageBind = computed(() => {
  if (!sequenceActive.value || isViewport.value) {
    return {
      initial: { scale: 1 },
      animate: { scale: 1 },
      transition: { duration: 0 },
    }
  }
  return homeHeroImageMotion(reducedMotion.value, heroCompacted.value, wakeTokens.value)
})

const titleBind = computed(() => {
  if (!sequenceActive.value || isViewport.value) {
    return {
      initial: false,
      animate: false,
      transition: { duration: 0 },
    }
  }
  return homeHeroTitleMotion(reducedMotion.value, heroCompacted.value, wakeTokens.value)
})

const musicBind = computed(() => {
  if (!sequenceActive.value || isViewport.value) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    }
  }
  return homeHeroMusicMotion(reducedMotion.value, wakeTokens.value)
})

const wakeClipStyle = computed(() => ({
  '--fq-demo-clip-h': `${wakeTokens.value.clipHeight}px`,
  '--fq-demo-clip-h-mobile': `${wakeTokens.value.clipHeightMobile}px`,
  '--fq-demo-hero-h': `${wakeTokens.value.arrivalHeight}px`,
  '--fq-demo-hero-h-settled': `${wakeTokens.value.settledHeight}px`,
}))

const useMobileHeroCrop = computed(() =>
  !!(artist.value.heroImage && artist.value.heroImageMobile && (isShowcase.value || (props.compact && !sequenceActive.value)))
)
const heroFrameClass = computed(() => {
  if (isViewport.value) return 'demo-viewport-hero'
  if (isShowcase.value) return 'showcase-hero'
  if (sequenceActive.value) return 'demo-wake-hero'
  if (props.compact) return 'h-64 sm:h-72'
  if (isPreview.value) return 'demo-page-hero demo-preview-hero'
  if (isLite.value) return 'demo-page-hero demo-lite-hero'
  return 'demo-page-hero'
})
const heroObjectClass = computed(() => {
  if (isViewport.value) return 'object-[center_26%]'
  if (isShowcase.value) return 'object-[center_18%]'
  if (sequenceActive.value) return 'object-[center_16%]'
  if (props.compact) return 'object-center sm:object-top'
  if (isPreview.value) return 'object-[center_18%]'
  if (isLite.value) return 'object-[center_22%]'
  return 'object-[center_16%]'
})

const visibleStreaming = computed(() => {
  const list = artist.value.streaming || []
  return isShowcase.value ? list.slice(0, 3) : list
})

const visibleSocial = computed(() => {
  const list = artist.value.social || []
  return isShowcase.value ? list.slice(0, 5) : list
})

const LITE_STREAMING = ['spotify', 'appleMusic']
const PREVIEW_STREAMING = ['spotify', 'appleMusic', 'youtube']
const LITE_SOCIAL = ['instagram', 'facebook', 'tiktok']

const liteWorldLinks = computed(() => {
  if (!isLite.value) return []
  const streamKeys = isPreview.value ? PREVIEW_STREAMING : LITE_STREAMING
  const streaming = (artist.value.streaming || []).filter((link) => streamKeys.includes(link.name))
  const social = isPreview.value
    ? []
    : (artist.value.social || []).filter((link) => LITE_SOCIAL.includes(link.name))
  const byName = new Map()
  if (!isPreview.value && artist.value.website?.url) {
    byName.set('website', {
      name: 'website',
      label: artist.value.website.label || 'Official Website',
      url: artist.value.website.url,
    })
  }
  for (const link of [...streaming, ...social]) {
    if (!byName.has(link.name)) byName.set(link.name, link)
  }
  if (isPreview.value && byName.size < 3) {
    for (const link of artist.value.streaming || []) {
      if (!byName.has(link.name)) byName.set(link.name, link)
      if (byName.size >= 3) break
    }
  }
  const links = [...byName.values()]
  if (isPreview.value && !links.length) return PREVIEW_LINKS
  return isPreview.value ? links.slice(0, 3) : links
})

const liteFanCopy = computed(() =>
  resolveFanCaptureCopy({
    headline: artist.value.fanList?.headline,
    message: artist.value.fanList?.message,
    artistName: artist.value.name,
    buttonLabel: artist.value.fanList?.buttonLabel,
  })
)
const liteFanHeadline = computed(() => liteFanCopy.value.headline)
const liteFanMessage = computed(() => liteFanCopy.value.message)
const liteFanButton = computed(() => liteFanCopy.value.buttonLabel)

const HQ_DEMO_EVENT = {
  id: 'hq-demo-show',
  city: 'Nashville',
  state: 'TN',
  venue: 'The Basement East',
  date: '2026-10-18',
}

const hqUpcomingEvents = computed(() => {
  if (!isHqLite.value) return []
  const list = artist.value.events || []
  return (list.length ? list : [HQ_DEMO_EVENT]).slice(0, 1)
})

const visibleEvents = computed(() => {
  const list = artist.value.events || []
  if (isLite.value) return []
  return isShowcase.value ? list.slice(0, 1) : list
})

const isVideoPlaying = ref(false)
const demoEmail = ref('')
const fanJoined = ref(false)
const demoAudio = ref(null)

/** Colored image assets for platforms that use them on the real artist page. */
const ASSET_MAP = {
  spotify: spotifyIcon,
  appleMusic: appleMusicIcon,
  youtube: youtubeIcon,
  youtubeMusic: youtubeIcon,
  soundcloud: soundcloudIcon,
  bandcamp: bandcampIcon,
  deezer: deezerIcon,
  facebook: facebookIcon,
  instagram: instagramIcon,
  twitter: twitterIcon,
  tiktok: tiktokIcon,
}

/** Brand colors for Iconify-only platforms (matches BandPageCybered). */
const COLOR_MAP = {
  amazonMusic: '#00A8E1',
  tidal: '#00FFFF',
  deezer: '#FEAA2D',
  spotify: '#1DB954',
  appleMusic: '#FC3C44',
  youtube: '#FF0000',
  youtubeMusic: '#FF0000',
  soundcloud: '#FF5500',
  bandcamp: '#1DA0C3',
  instagram: '#E4405F',
  facebook: '#1877F2',
  tiktok: '#FFFFFF',
  twitter: '#FFFFFF',
  threads: '#FFFFFF',
  discord: '#5865F2',
}

const ICONIFY_MAP = {
  spotify: 'simple-icons:spotify',
  appleMusic: 'simple-icons:applemusic',
  youtube: 'simple-icons:youtube',
  youtubeMusic: 'simple-icons:youtubemusic',
  amazonMusic: 'simple-icons:amazonmusic',
  tidal: 'simple-icons:tidal',
  soundcloud: 'simple-icons:soundcloud',
  bandcamp: 'simple-icons:bandcamp',
  deezer: 'simple-icons:deezer',
  instagram: 'simple-icons:instagram',
  facebook: 'simple-icons:facebook',
  tiktok: 'simple-icons:tiktok',
  twitter: 'simple-icons:x',
  threads: 'simple-icons:threads',
  discord: 'simple-icons:discord',
}

function platformAsset(name) {
  return ASSET_MAP[name] || null
}

function platformIconify(name) {
  // Prefer asset icons; Iconify is fallback for platforms without assets
  if (ASSET_MAP[name]) return null
  return ICONIFY_MAP[name] || 'lucide:link'
}

function platformColor(name) {
  return COLOR_MAP[name] || '#FFFFFF'
}

function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function playVideo() {
  isVideoPlaying.value = true
}

function submitDemoFanSignup() {
  if (isPreview.value) return
  // Intentionally local-only — never call Fan Capture / Strapi.
  fanJoined.value = true
  demoEmail.value = ''
}

function toggleDemoAudio() {
  const el = demoAudio.value
  if (!el) return
  if (el.paused) el.play().catch(() => {})
  else el.pause()
}

function clearWakeTimers() {
  if (settleTimer) window.clearTimeout(settleTimer)
  if (cueTimer) window.clearTimeout(cueTimer)
  if (cueOffTimer) window.clearTimeout(cueOffTimer)
  settleTimer = 0
  cueTimer = 0
  cueOffTimer = 0
}

function startWakeSequence() {
  if (wakeArmed.value) return
  wakeArmed.value = true
  clearWakeTimers()
  playCue.value = false
  const tokens = wakeTokens.value
  if (!sequenceActive.value) {
    heroCompacted.value = true
    return
  }
  if (reducedMotion.value) {
    heroCompacted.value = true
    return
  }
  heroCompacted.value = false
  settleTimer = window.setTimeout(() => {
    heroCompacted.value = true
  }, homeHeroWakeSettleStart(tokens) * 1000)
  if (!(tokens.playCueDuration > 0)) return
  cueTimer = window.setTimeout(() => {
    playCue.value = true
    cueOffTimer = window.setTimeout(() => {
      playCue.value = false
    }, tokens.playCueDuration * 1000)
  }, homeHeroWakePlayCueDelay(tokens) * 1000)
}

function stopWakeObserver() {
  wakeObserver?.disconnect()
  wakeObserver = null
  if (wakeFailsafe) window.clearTimeout(wakeFailsafe)
  wakeFailsafe = 0
}

function armHeadquartersWake() {
  if (wakeArmed.value) return
  stopWakeObserver()
  startWakeSequence()
}

function observeHeadquartersWake() {
  if (reducedMotion.value) {
    startWakeSequence()
    return
  }
  const raw = showcaseRoot.value?.$el || showcaseRoot.value
  const el = raw instanceof Element ? raw : raw?.parentElement
  if (!el || typeof IntersectionObserver === 'undefined') {
    startWakeSequence()
    return
  }
  wakeObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      armHeadquartersWake()
    },
    { threshold: 0.22, rootMargin: '0px 0px -6% 0px' }
  )
  wakeObserver.observe(el)
  wakeFailsafe = window.setTimeout(() => {
    armHeadquartersWake()
  }, 1600)
}

onMounted(() => {
  if (!process.client) return
  homeMq = window.matchMedia('(max-width: 1023px)')
  isMobileHome.value = homeMq.matches
  onHomeMqChange = (event) => {
    isMobileHome.value = event.matches
  }
  homeMq.addEventListener('change', onHomeMqChange)
  if (isHeadquartersWake.value) observeHeadquartersWake()
  else startWakeSequence()
})

onBeforeUnmount(() => {
  if (homeMq && onHomeMqChange) {
    homeMq.removeEventListener('change', onHomeMqChange)
  }
  stopWakeObserver()
  clearWakeTimers()
})
</script>

<style scoped>
.demo-artist-showcase {
  position: relative;
}

.demo-compact {
  max-height: 580px;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
}

.demo-wake-clip {
  height: var(--fq-demo-clip-h, 580px);
  max-height: var(--fq-demo-clip-h, 580px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

@media (max-width: 1023px) {
  .demo-wake-clip {
    height: var(--fq-demo-clip-h-mobile, 620px);
    max-height: var(--fq-demo-clip-h-mobile, 620px);
  }
}

.demo-wake-hero {
  width: 100%;
  flex-shrink: 0;
  height: var(--fq-demo-hero-h, 350px);
}

@media (prefers-reduced-motion: reduce) {
  .demo-wake-hero {
    height: var(--fq-demo-hero-h-settled, 240px);
  }
}

.demo-wake-music {
  pointer-events: auto;
}

.demo-wake-music.is-play-cue :deep(button) {
  border-color: rgba(57, 255, 20, 0.55);
  transform: scale(1.02);
}

.demo-wake-clip :deep(.elite-spotify-widget),
.demo-wake-clip :deep(a),
.demo-wake-clip :deep(button) {
  pointer-events: auto;
}

/*
  Carousel phone preview:
  - Tall portrait hero (see .showcase-hero) so artist photos aren't face-cropped
  - Longer card so more of the real page (song / links) is visible
  - Soft fade only at the very bottom
*/
.demo-showcase-mode {
  max-height: 720px;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 88%, transparent 100%);
  pointer-events: none;
  user-select: none;
}

@media (min-width: 640px) {
  .demo-showcase-mode {
    max-height: 760px;
  }
}

/* Portrait hero plane — short fixed heights were chopping band photos */
.showcase-hero {
  aspect-ratio: 3 / 4;
  width: 100%;
  min-height: 280px;
  max-height: 420px;
}

@media (min-width: 640px) {
  .showcase-hero {
    min-height: 320px;
    max-height: 460px;
  }
}

/*
  Full homepage Artist Page demo — same 2:3 plane as Badflower's live Cybered hero
  (1000×1500 local portrait / 4096×6144 live). Do not use the 2:1 mobile crop here.
*/
.demo-page-hero {
  aspect-ratio: 2 / 3;
  width: 100%;
  min-height: 22rem;
  max-height: 34rem;
}

@media (min-width: 640px) {
  .demo-page-hero {
    min-height: 24rem;
    max-height: 36rem;
  }
}

/*
  Homepage HQ mobile: editorial crop, not a poster.
  Faces stay in frame; bio + Ghost + a video peek must land above the fold.
*/
.demo-lite-hero {
  aspect-ratio: auto;
  height: 17.5rem;
  min-height: 17.5rem;
  max-height: 17.5rem;
}

@media (min-width: 430px) {
  .demo-lite-hero {
    height: 19rem;
    min-height: 19rem;
    max-height: 19rem;
  }
}

@media (min-width: 1024px) {
  .demo-lite-hero {
    height: 24rem;
    min-height: 24rem;
    max-height: 24.5rem;
  }
}

.demo-lite-music {
  padding: 0.8rem 0.75rem;
}

.demo-link-kicker {
  color: #E8E8EC;
}

.demo-dest-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.9rem;
  min-height: 3.35rem;
  padding: 0.72rem 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.065);
  background: #0D0F13;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  color: #F5F5F6;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.011em;
}

.demo-dest-row .text-white {
  color: #F5F5F6;
}

.demo-dest-row .text-white\/40,
.demo-dest-row .text-xs {
  color: rgba(245, 245, 246, 0.58);
}

.demo-dest-icon {
  display: flex;
  width: 2.15rem;
  height: 2.15rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.65rem;
  background: #181B22;
}

.demo-dest-icon :deep(img),
.demo-dest-icon :deep(svg) {
  display: block;
  max-width: 1.15rem;
  max-height: 1.15rem;
}

.demo-dest-chevron {
  width: 1.05rem;
  height: 1.05rem;
  flex-shrink: 0;
  color: rgba(245, 245, 246, 0.30);
}

@media (hover: hover) and (min-width: 1024px) {
  .demo-dest-row:hover,
  .demo-dest-row:focus-visible {
    background: #16191F;
    border-color: rgba(255, 255, 255, 0.13);
  }
}

.demo-fan {
  position: relative;
  overflow: hidden;
  border-radius: 1.15rem;
  border: 1px solid rgba(139, 108, 255, 0.22);
}

.demo-fan.is-joined {
  border-color: rgba(98, 242, 157, 0.28);
}

.demo-fan__edge {
  height: 2px;
}

.demo-fan__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.15rem 1rem 1.05rem;
  text-align: center;
}

.demo-fan__icon {
  position: relative;
  display: flex;
  width: 2.65rem;
  height: 2.65rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.7rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(57, 213, 255, 0.36);
}

.demo-fan__icon svg {
  width: 1.2rem;
  height: 1.2rem;
  color: var(--faneqo-connection-cyan, #39d5ff);
}

.demo-fan__title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--faneqo-text, #f7f9fc);
}

.demo-fan__copy {
  margin: 0.35rem 0 0;
  max-width: 18rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--faneqo-muted, #9aa6b5);
}

.demo-fan__form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 0.85rem;
}

.demo-fan__input {
  width: 100%;
  min-height: 2.85rem;
  padding: 0.8rem 1rem;
  border-radius: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.9rem;
  font-weight: 500;
}

.demo-fan__input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.demo-fan__input:focus {
  outline: none;
}

.demo-fan__btn {
  width: 100%;
  min-height: 2.85rem;
  padding: 0.8rem 1rem;
  border-radius: 0.875rem;
  border: 1px solid rgba(139, 108, 255, 0.36);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.demo-fan__joined {
  margin-top: 0.85rem;
  color: var(--faneqo-success, #62f29d);
  font-size: 0.9rem;
  font-weight: 600;
}

.demo-fan__trust {
  margin: 0.7rem 0 0;
  color: var(--faneqo-muted, #9aa6b5);
  font-size: 0.75rem;
}

.demo-profile-actions {
  pointer-events: none;
}

.demo-profile-actions :deep(.artist-actions) {
  column-gap: 0.5rem;
}

.demo-profile-actions :deep(.artist-actions__btn) {
  background: #18191f;
  border-color: rgba(255, 255, 255, 0.15);
  border-radius: 0.95rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
}

.demo-viewport-clip {
  overflow: hidden;
  height: auto;
  max-height: none;
}

.demo-viewport-hero {
  aspect-ratio: 2 / 3;
  width: 100%;
  min-height: 22rem;
}

.demo-viewport-ghost :is(img, .w-14) {
  width: 4.25rem;
  height: 4.25rem;
}

.demo-viewport-ghost {
  gap: 0.85rem;
  padding: 0.7rem 0.15rem 0.85rem;
  border: 0;
  background: transparent;
  border-radius: 0;
}

.demo-viewport-ghost .w-14 {
  width: 4.25rem;
  height: 4.25rem;
}

.demo-viewport-play {
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  color: #45d6a7;
  background: rgba(69, 214, 167, 0.16);
}

@media (min-width: 1024px) {
  .demo-viewport-clip {
    height: 36.5rem;
    max-height: 36.5rem;
  }

  .demo-viewport-hero {
    aspect-ratio: auto;
    height: 24.25rem;
    min-height: 0;
  }
}

.demo-viewport-surface {
  width: 100%;
  max-width: none;
  border-radius: 0;
  border: 0;
  box-shadow: none;
}

.demo-viewport-name {
  font-size: clamp(2.7rem, 11.5vw, 3.35rem);
  letter-spacing: -0.055em;
  line-height: 0.9;
}

.demo-viewport-peek {
  height: 4.5rem;
  overflow: hidden;
  pointer-events: none;
}

.demo-viewport-peek-frame {
  height: 4.5rem;
  aspect-ratio: auto;
}

.demo-viewport-peek-frame img {
  object-position: center 36%;
}

.demo-viewport :deep(.elite-spotify-widget),
.demo-viewport :deep(a),
.demo-viewport :deep(button) {
  pointer-events: none;
}

.demo-preview {
  position: relative;
  pointer-events: none;
  user-select: none;
  padding: 0.7rem 0.68rem 0.86rem;
  border-radius: 2.55rem;
  background:
    linear-gradient(165deg, #6a6a72 0%, #2e2e34 16%, #16161a 48%, #070709 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(0, 0, 0, 0.55),
    0 1px 0 rgba(255, 255, 255, 0.08),
    0 32px 72px -22px rgba(0, 0, 0, 0.88),
    0 0 40px -18px rgba(139, 108, 255, 0.22);
}

.demo-preview::before,
.demo-preview::after {
  content: '';
  position: absolute;
  right: 0;
  z-index: 6;
  width: 0.18rem;
  border-radius: 999px 0 0 999px;
  background: linear-gradient(180deg, #3a3a42, #121214);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
}

.demo-preview::before {
  top: 7.2rem;
  height: 2.1rem;
}

.demo-preview::after {
  top: 9.7rem;
  height: 3.35rem;
}

.demo-preview-island {
  position: absolute;
  top: 0.92rem;
  left: 50%;
  z-index: 8;
  width: 5.55rem;
  height: 1.32rem;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #050506;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.demo-preview-home {
  position: absolute;
  bottom: 0.38rem;
  left: 50%;
  z-index: 8;
  width: 6.75rem;
  height: 0.28rem;
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.32);
}

.demo-preview-screen {
  overflow: hidden;
  max-width: none;
  margin: 0;
  border: 0;
  border-radius: 1.95rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.demo-preview-hero {
  aspect-ratio: auto;
  height: 11.75rem;
  min-height: 11.75rem;
  max-height: 11.75rem;
}

.demo-preview-world {
  padding-bottom: 1.15rem;
}

.demo-preview-world .demo-lite-music {
  padding: 0.7rem 0.9rem 0.55rem;
}

.demo-preview-world .demo-lite-music > div {
  gap: 0.8rem;
  padding: 0.7rem 0.75rem;
  border-color: rgba(255, 255, 255, 0.12);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
}

.demo-preview-world .demo-lite-music .w-11 {
  width: 2.7rem;
  height: 2.7rem;
  border: 0;
  color: #45d6a7;
  background: rgba(69, 214, 167, 0.16);
}

.demo-preview-world [data-hq-wake='video'] {
  padding-left: 0.9rem;
  padding-right: 0.9rem;
  padding-bottom: 0.55rem;
}

.demo-preview-world [data-hq-wake='video'] .rounded-xl {
  box-shadow: 0 10px 24px -16px rgba(0, 0, 0, 0.9);
}

.demo-preview-world .px-4.pb-3 {
  padding-left: 0.9rem;
  padding-right: 0.9rem;
  padding-bottom: 0.15rem;
}

.demo-preview-world .demo-link-card {
  min-height: 2.65rem;
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
}

@media (min-width: 1024px) {
  .demo-preview-hero {
    height: 13.5rem;
    min-height: 13.5rem;
    max-height: 13.5rem;
  }
}
</style>
