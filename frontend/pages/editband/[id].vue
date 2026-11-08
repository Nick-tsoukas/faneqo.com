<template>
  <div class="min-h-screen pt-[var(--header-height)]">
    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-4 text-center px-6">
        <div class="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <div>
          <p class="text-white font-semibold text-lg">{{ loadingMessage }}</p>
          <p class="text-white/50 text-sm mt-1">Please wait while we save your changes...</p>
        </div>
      </div>
    </div>

    <div class="artist-setup mx-auto max-w-6xl px-6 py-10">
      <BandsArtistSetupMobileBar
        class="lg:hidden"
        :items="setupItems"
        :current="setupCurrent"
        :position="currentPosition"
        :open="jumpOpen"
        @toggle="jumpOpen = !jumpOpen"
        @jump="scrollToSection"
      />

      <div class="lg:grid lg:grid-cols-[13.5rem_minmax(0,48rem)] lg:items-start lg:gap-12">
      <BandsArtistSetupRail
        class="hidden lg:block"
        :items="setupItems"
        @jump="scrollToSection"
      />

      <div class="min-w-0 max-w-3xl">
      <!-- Header -->
      <div class="mb-10">
        <NuxtLink to="/dashboard" class="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mb-4 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </NuxtLink>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-white">Edit your artist page</h1>
            <p class="text-white/60 mt-2">Update the pieces fans will see.</p>
          </div>
          <NuxtLink
            :to="`/band-layout/${$route.params.id}`"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/40 bg-purple-900/30 text-purple-200 hover:bg-purple-900/50 transition text-sm font-medium shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Edit Layout
          </NuxtLink>
        </div>
      </div>

      <form class="space-y-8" @submit.prevent="submitForm" @invalid.capture="onSetupInvalid">
        <!-- Artist Details -->
        <section id="setup-details" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-purple-500 to-violet-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-details') }}</p>
              <h2 class="form-section-title">Artist Details</h2>
              <p class="form-section-subtitle">The name and story fans see first.</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="form-field">
              <label for="band-name" class="form-label">Band Name <span class="text-red-400">*</span></label>
              <input
                type="text"
                id="band-name"
                class="form-input"
                v-model="bandName"
                placeholder="Enter your band name"
                required
              />
            </div>

            <div class="form-field">
              <label for="genre" class="form-label">Genre <span class="text-red-400">*</span></label>
              <input
                type="text"
                id="genre"
                class="form-input"
                v-model="genre"
                placeholder="e.g. Rock, Jazz, Electronic"
                required
              />
            </div>

            <div class="form-field">
              <label for="bio" class="form-label">Bio / Description <span class="text-red-400">*</span></label>
              <textarea
                id="bio"
                class="form-input form-textarea"
                v-model="bio"
                placeholder="Tell fans about your band..."
                rows="4"
                required
              ></textarea>
            </div>
          </div>
        </section>

        <!-- Profile Image -->
        <section id="setup-profile" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-pink-500 to-rose-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-profile') }}</p>
              <h2 class="form-section-title">Profile Image</h2>
              <p class="form-section-subtitle">Upload the best photo you have. Faneqo adapts it for your page.</p>
            </div>
          </div>

          <div class="form-section-content">
            <p class="text-white/50 text-sm mb-4">
              One photo. Phone and Desktop each keep their own fit and framing.
            </p>
            <p class="text-white/35 text-xs mb-4">
              Choose Fill frame or Full photo on each surface, then drag or reset that surface only.
            </p>

            <label
              for="band-img"
              class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition group"
            >
              <svg class="w-10 h-10 text-white/30 group-hover:text-purple-400 transition mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span class="text-white/50 group-hover:text-white/70 transition">Click to upload image</span>
              <span class="text-white/30 text-sm mt-1">JPEG, PNG, or WebP up to 10MB</span>
              <input
                ref="bandImgInput"
                type="file"
                id="band-img"
                class="hidden"
                @change="handleImageUpload"
                accept="image/jpeg,image/png,image/webp"
              />
            </label>
            <p v-if="bandImgError" class="mt-3 text-sm text-red-300">{{ bandImgError }}</p>

            <BandsFaneqoArtistImageEditor
              v-if="bandImgFullUrl"
              class="mt-6"
              :image-url="bandImgFullUrl"
              :image-width="bandImgWidth"
              :image-height="bandImgHeight"
              :artist-name="bandName"
              v-model:phone="artistImagePhone"
              v-model:desktop="artistImageDesktop"
              @framing-change="onArtistFramingChange"
            />
          </div>
        </section>

        <!-- Editorial Showcase (entitled accounts only) -->
        <section v-if="hasEditorialShowcaseAccess" id="setup-editorial" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-emerald-500 to-teal-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-editorial') }}</p>
              <h2 class="form-section-title">Editorial Showcase</h2>
              <p class="form-section-subtitle">Feature selected articles, interviews, reviews, videos, and photo galleries on your profile</p>
            </div>
          </div>

          <div class="form-section-content">
            <EditorialShowcaseEditor
              ref="editorialEditorRef"
              v-model:enabled="editorialShowcaseEnabled"
              v-model:section-title="editorialSectionTitle"
              v-model:archive-url="editorialArchiveUrl"
              v-model:archive-label="editorialArchiveLabel"
              v-model:publication-header-image-mode="publicationHeaderImageMode"
              v-model:items="editorialItems"
              :strapi-base-url="config.public.strapiUrl"
              @image-upload="handleEditorialImageUpload"
              @image-remove="handleEditorialImageRemove"
            />
          </div>
        </section>

        <!-- Featured Music -->
        <section id="setup-music" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-orange-500 to-amber-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-music') }}</p>
              <h2 class="form-section-title">Featured Music</h2>
              <p class="form-section-subtitle">Put one song front and center on your artist page.</p>
            </div>
          </div>

          <div class="form-section-content">
            <BandsArtistFeaturedMusicFields
              v-model:mode="singlesongType"
              v-model:platform="singlesongPlatform"
              v-model:title="singlesongTitle"
              v-model:embed-html="singlesongEmbedHtml"
              v-model:spotify-url="spotifyUrlInput"
              :spotify-preview="spotifyOembedData"
              :spotify-loading="spotifyOembedLoading"
              :spotify-error="spotifyOembedError"
              :file-name="singlesongFile?.name || existingSongFilename"
              :existing-file="!!singlesongFileId"
              :file-fresh="!!singlesongFile"
              :file-key="songInputKey"
              id-prefix="edit-music"
              @add-track="fetchSpotifyOembed"
              @change-spotify="changeSpotifyTrack"
              @clear-spotify="clearSpotifyEmbed"
              @clear-embed="removeEmbedSong"
              @remove-file="deleteSong"
              @upload="handleSingleSongUpload"
            />
          </div>
        </section>

        <!-- Featured Video -->
        <section id="setup-video" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-red-500 to-rose-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-video') }}</p>
              <h2 class="form-section-title">Featured Video</h2>
              <p class="form-section-subtitle">Put one video on your artist page.</p>
            </div>
          </div>
          <div class="form-section-content">
            <BandsArtistFeaturedVideoFields
              v-model:title="singlevideoTitle"
              v-model:youtube-url="singlevideoYoutubeUrl"
              :preview="videoPreview"
              :loading="videoAdding"
              :error="videoAddError"
              id-prefix="edit-video"
              @add-video="addFeaturedVideo"
              @change-video="changeFeaturedVideo"
              @remove-video="deleteVideo"
            />
          </div>
        </section>

        <!-- Website & Links -->
        <section id="setup-links" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-blue-500 to-cyan-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-links') }}</p>
              <h2 class="form-section-title">Website & Links</h2>
              <p class="form-section-subtitle">Official site, store, and the buttons you want on your page.</p>
            </div>
          </div>
          <div class="form-section-content">
            <div>
              <h3 class="setup-subhead">Official links</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-field">
                  <label for="websitelink" class="form-label">Website URL</label>
                  <input
                    type="text"
                    id="websitelink"
                    class="form-input"
                    v-model="websitelink"
                    placeholder="https://yourbandsite.com"
                  />
                </div>
                <div class="form-field">
                  <label for="websitelinktext" class="form-label">Display Text</label>
                  <input
                    type="text"
                    id="websitelinktext"
                    class="form-input"
                    v-model="websitelinktext"
                    placeholder="Visit our website"
                  />
                </div>
                <div class="form-field md:col-span-2">
                  <label for="officialMerchUrl" class="form-label">Official Merch Store</label>
                  <input
                    type="url"
                    id="officialMerchUrl"
                    class="form-input"
                    :class="{ 'border-red-500/50': officialMerchUrlError }"
                    v-model="officialMerchUrl"
                    placeholder="https://yourband.com/merch"
                    autocomplete="url"
                    @blur="validateOfficialMerchUrl"
                  />
                  <p class="text-white/50 text-sm mt-1.5">Link fans directly to your official merchandise store.</p>
                  <p v-if="officialMerchUrlError" class="text-red-400 text-sm mt-1">{{ officialMerchUrlError }}</p>
                </div>
              </div>
            </div>
            <div class="setup-divider">
              <h3 class="setup-subhead">Custom links</h3>
              <CustomButtonEditor
                v-model="customButtons"
                @icon-upload="handleCustomButtonIconUpload"
              />
            </div>
            <div class="setup-divider">
              <h3 class="setup-subhead">Contact / booking</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-field">
                  <label for="bookingEmail" class="form-label">Booking Email</label>
                  <input id="bookingEmail" type="email" v-model="contacts.bookingEmail" class="form-input" placeholder="booking@yourband.com" />
                </div>
                <div class="form-field">
                  <label for="managementEmail" class="form-label">Management Email</label>
                  <input id="managementEmail" type="email" v-model="contacts.managementEmail" class="form-input" placeholder="management@yourband.com" />
                </div>
                <div class="form-field">
                  <label for="pressEmail" class="form-label">Press / Media Email</label>
                  <input id="pressEmail" type="email" v-model="contacts.pressEmail" class="form-input" placeholder="press@yourband.com" />
                </div>
                <div class="form-field">
                  <label for="bookingAgent" class="form-label">Booking Agent / Agency</label>
                  <input id="bookingAgent" type="text" v-model="contacts.bookingAgent" class="form-input" placeholder="Agent name or agency" />
                </div>
                <div class="form-field">
                  <label for="labelName" class="form-label">Record Label Name</label>
                  <input id="labelName" type="text" v-model="contacts.labelName" class="form-input" placeholder="e.g. Atlantic Records" />
                </div>
                <div class="form-field">
                  <label for="labelUrl" class="form-label">Record Label Website</label>
                  <input id="labelUrl" type="url" v-model="contacts.labelUrl" class="form-input" placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Streaming -->
        <section id="setup-streaming" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-green-500 to-emerald-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-streaming') }}</p>
              <h2 class="form-section-title">Streaming</h2>
              <p class="form-section-subtitle">Where fans can listen to you everywhere else.</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="stream in Object.keys(streaming)" :key="stream" class="form-field">
                <div class="flex items-center justify-between mb-2">
                  <label :for="stream" class="form-label capitalize mb-0">{{ stream }}</label>
                  <label :for="`hide-${stream}`" class="flex items-center gap-2 cursor-pointer">
                    <span class="text-white/50 text-xs">Hide</span>
                    <div class="relative">
                      <input
                        type="checkbox"
                        :id="`hide-${stream}`"
                        :checked="isLinkHidden(stream)"
                        @change="setLinkHidden(stream, $event.target.checked)"
                        class="sr-only peer"
                      />
                      <div class="w-8 h-4 bg-white/20 rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                      <div class="absolute left-[2px] top-[2px] w-3 h-3 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
                    </div>
                  </label>
                </div>
                <input
                  :id="stream"
                  type="text"
                  v-model="streaming[stream]"
                  class="form-input"
                  placeholder="Paste your link here"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Social -->
        <section id="setup-social" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-pink-500 to-purple-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-social') }}</p>
              <h2 class="form-section-title">Social</h2>
              <p class="form-section-subtitle">Help fans find you everywhere else.</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="net in Object.keys(social)" :key="net" class="form-field">
                <div class="flex items-center justify-between mb-2">
                  <label :for="net" class="form-label capitalize mb-0">{{ net }}</label>
                  <label :for="`hide-${net}`" class="flex items-center gap-2 cursor-pointer">
                    <span class="text-white/50 text-xs">Hide</span>
                    <div class="relative">
                      <input
                        type="checkbox"
                        :id="`hide-${net}`"
                        :checked="isLinkHidden(net)"
                        @change="setLinkHidden(net, $event.target.checked)"
                        class="sr-only peer"
                      />
                      <div class="w-8 h-4 bg-white/20 rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                      <div class="absolute left-[2px] top-[2px] w-3 h-3 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
                    </div>
                  </label>
                </div>
                <input
                  :id="net"
                  type="text"
                  v-model="social[net]"
                  class="form-input"
                  :placeholder="`https://${net}.com/...`"
                />
              </div>
            </div>
            <div class="setup-divider">
              <h3 class="setup-subhead">Event hubs</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="hub in Object.keys(eventHubs)" :key="hub" class="form-field">
                  <div class="flex items-center justify-between mb-2">
                    <label :for="hub" class="form-label capitalize mb-0">{{ hub }}</label>
                    <label :for="`hide-${hub}`" class="flex items-center gap-2 cursor-pointer">
                      <span class="text-white/50 text-xs">Hide</span>
                      <div class="relative">
                        <input
                          type="checkbox"
                          :id="`hide-${hub}`"
                          :checked="isLinkHidden(hub)"
                          @change="setLinkHidden(hub, $event.target.checked)"
                          class="sr-only peer"
                        />
                        <div class="w-8 h-4 bg-white/20 rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                        <div class="absolute left-[2px] top-[2px] w-3 h-3 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
                      </div>
                    </label>
                  </div>
                  <input
                    :id="hub"
                    type="text"
                    v-model="eventHubs[hub]"
                    class="form-input"
                    :placeholder="`https://${hub}.com/...`"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Support -->
        <section id="setup-support" class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-emerald-500 to-teal-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="setup-kicker">{{ setupNumber('setup-support') }}</p>
              <h2 class="form-section-title">Support</h2>
              <p class="form-section-subtitle">Let fans support you, pay at the merch table, or cover entry from your artist page.</p>
            </div>
          </div>

          <div class="form-section-content">
            <div
              class="payout-status mb-5"
              :class="statusCard.tone === 'ready' ? 'payout-status--ready' : 'payout-status--action'"
              role="status"
              data-testid="payout-setup-status"
              :data-state="statusCard.state"
            >
              <div class="min-w-0">
                <p class="payout-status__title">{{ statusCard.title }}</p>
                <p class="payout-status__body">{{ statusCard.body }}</p>
                <p v-if="payoutError" class="payout-status__error" role="alert">{{ payoutError }}</p>
              </div>
              <button
                v-if="statusCard.action"
                type="button"
                class="payout-status__action"
                :disabled="loading"
                @click="saveThenSetUpPayouts"
              >
                {{ statusCard.action }}
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="btn in paymentButtons"
                :key="btn.key"
                class="p-4 rounded-xl border transition"
                :class="btn.enabled ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 bg-white/5'"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="text-white font-medium">{{ btn.title }}</div>
                    <div v-if="btn.description" class="text-white/50 text-sm mt-1">
                      {{ btn.description }}
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      :id="`paybtn-${btn.key}`"
                      type="checkbox"
                      v-model="btn.enabled"
                      class="sr-only peer"
                      :aria-label="`Show ${btn.title} on your artist page`"
                      @change="onPaymentToggle(btn)"
                    />
                    <div class="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-purple-600 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-300 transition-colors"></div>
                    <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div v-if="btn.enabled" class="mt-4 grid gap-3 md:grid-cols-2">
                  <div class="form-field">
                    <label class="form-label">Pricing Mode</label>
                    <select
                      v-model="btn.pricingMode"
                      class="form-input"
                    >
                      <option value="min">Minimum</option>
                      <option value="fixed">Fixed</option>
                      <option value="presets">Presets</option>
                    </select>
                  </div>

                  <div v-if="btn.pricingMode === 'min'" class="form-field">
                    <label class="form-label">Minimum amount</label>
                    <div class="flex items-center gap-2">
                      <span class="text-white/60">$</span>
                      <input
                        v-model.number="btn.minAmount"
                        type="number"
                        step="1"
                        min="0"
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div v-else-if="btn.pricingMode === 'fixed'" class="form-field">
                    <label class="form-label">Fixed amount</label>
                    <div class="flex items-center gap-2">
                      <span class="text-white/60">$</span>
                      <input
                        v-model.number="btn.fixedAmount"
                        type="number"
                        step="1"
                        min="0"
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div v-else-if="btn.pricingMode === 'presets'" class="md:col-span-2 form-field">
                    <label class="form-label">Preset amounts (comma-separated)</label>
                    <input
                      v-model="btn.presetAmountsText"
                      @blur="btn.presetAmounts = parsePresetAmounts(btn.presetAmountsText)"
                      type="text"
                      placeholder="e.g. 3, 5, 10"
                      class="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="setup-divider">
              <h3 class="setup-subhead">Payouts</h3>
            <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              <div class="p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 text-center">
                <div class="text-white/50 text-xs uppercase tracking-wide mb-1">Stripe</div>
                <div class="text-white font-semibold">{{ stripeAccountId ? "Connected" : "Not connected" }}</div>
              </div>
              <div class="p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 text-center">
                <div class="text-white/50 text-xs uppercase tracking-wide mb-1">Onboarding</div>
                <div class="font-semibold" :class="stripeOnboardingComplete ? 'text-emerald-400' : 'text-amber-400'">
                  {{ stripeOnboardingComplete ? "Complete" : "Incomplete" }}
                </div>
              </div>
              <div class="p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 text-center">
                <div class="text-white/50 text-xs uppercase tracking-wide mb-1">Payments</div>
                <div class="font-semibold" :class="paymentsEnabled ? 'text-emerald-400' : 'text-white/50'">
                  {{ paymentsEnabled ? "Enabled" : "Disabled" }}
                </div>
              </div>
            </div>

            <button
              type="button"
              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition disabled:opacity-50"
              :disabled="loading"
              @click="saveThenSetUpPayouts"
            >
              {{ stripeOnboardingComplete ? "Manage / Continue Payout Setup" : "Set Up Payouts" }}
            </button>
            <p v-if="payoutError" class="payout-status__error mt-2" role="alert">{{ payoutError }}</p>
            </div>
          </div>
        </section>

        <!-- Merch Concierge Section - DISABLED FOR TESTING
        <section class="form-section-disabled">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-violet-500 to-purple-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h2 class="form-section-title">Merch Concierge</h2>
              <p class="form-section-subtitle">Show-only pickup for fans</p>
            </div>
          </div>

          <div class="form-section-content">
            <label for="mc-enabled" class="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/[0.07] transition group">
              <div class="relative">
                <input
                  id="mc-enabled"
                  type="checkbox"
                  v-model="mcEnabled"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
              </div>
              <div>
                <div class="text-white font-medium">Enable Merch Concierge</div>
                <div class="text-white/50 text-sm">Let fans buy merch during the show and pick it up later</div>
              </div>
            </label>

            <div v-if="mcEnabled" class="space-y-4 mt-4">
              <div class="form-field">
                <label for="mc-pickup" class="form-label">Pickup Instructions <span class="text-red-400">*</span></label>
                <textarea
                  id="mc-pickup"
                  class="form-input form-textarea"
                  v-model="mcPickupInstructions"
                  placeholder="e.g. Pickup at the merch table after the set — show this screen to staff."
                  rows="3"
                  required
                ></textarea>
              </div>

              <label for="mc-ready" class="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/[0.07] transition">
                <div class="relative">
                  <input
                    id="mc-ready"
                    type="checkbox"
                    v-model="mcStaffReadyConfirmed"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                  <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div>
                  <div class="text-white font-medium">Staff & inventory ready</div>
                  <div class="text-white/50 text-sm">Must be checked for checkout to work</div>
                </div>
              </label>

              <div class="space-y-4">
                <div
                  v-for="(item, idx) in mcItems"
                  :key="idx"
                  class="p-4 rounded-xl border border-white/10 bg-white/5"
                >
                  <div class="flex items-center justify-between gap-3 mb-4">
                    <div class="text-white font-semibold">Item {{ idx + 1 }}</div>
                    <button
                      type="button"
                      class="text-sm text-red-400 hover:text-red-300 transition"
                      @click="resetMcItem(idx)"
                    >
                      Remove
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-field">
                      <label :for="`mc-title-${idx}`" class="form-label">Title</label>
                      <input
                        :id="`mc-title-${idx}`"
                        v-model="item.title"
                        type="text"
                        class="form-input"
                        placeholder="T-Shirt, Vinyl, etc."
                      />
                    </div>

                    <div class="form-field">
                      <label :for="`mc-price-${idx}`" class="form-label">Price (USD)</label>
                      <input
                        :id="`mc-price-${idx}`"
                        type="text"
                        inputmode="decimal"
                        class="form-input"
                        placeholder="25.00"
                        v-model="mcPriceTextByIndex[idx]"
                        @blur="commitMcPrice(idx)"
                        @change="commitMcPrice(idx)"
                      />
                    </div>

                    <div class="md:col-span-2 form-field">
                      <label class="form-label">Product image (optional)</label>
                      <input
                        :id="`mc-img-${idx}`"
                        type="file"
                        accept="image/*"
                        class="form-input"
                        @change="onMcImageFileChange(idx, $event)"
                      />

                      <div v-if="mcItemImagePreviewByIndex[idx] || item.imageUrl" class="mt-3 relative inline-block">
                        <img
                          :src="mcItemImagePreviewByIndex[idx] || item.imageUrl"
                          :alt="item.title || 'Product image'"
                          class="max-h-40 rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow transition"
                          @click="clearMcImage(idx)"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div class="md:col-span-2 form-field">
                      <label :for="`mc-desc-${idx}`" class="form-label">Description</label>
                      <textarea
                        :id="`mc-desc-${idx}`"
                        v-model="item.description"
                        class="form-input form-textarea"
                        placeholder="Optional description..."
                        rows="2"
                      ></textarea>
                    </div>
                  </div>

                  <label :for="`mc-sizes-${idx}`" class="flex items-center gap-3 mt-4 cursor-pointer">
                    <div class="relative">
                      <input
                        :id="`mc-sizes-${idx}`"
                        type="checkbox"
                        v-model="item.sizesEnabled"
                        class="sr-only peer"
                      />
                      <div class="w-9 h-5 bg-white/20 rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                      <div class="absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
                    </div>
                    <span class="text-white text-sm">Sizes enabled</span>
                  </label>

                  <div v-if="!item.sizesEnabled" class="mt-3 form-field">
                    <label class="form-label">Available quantity</label>
                    <input
                      v-model.number="item.availableQty"
                      type="number"
                      step="1"
                      min="0"
                      class="form-input w-32"
                    />
                  </div>

                  <div v-else class="mt-3">
                    <div class="text-white/50 text-sm mb-2">Size stock (set 0 for sold out)</div>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div v-for="sz in mcSizes" :key="sz" class="form-field">
                        <label class="form-label text-xs">{{ sz }}</label>
                        <input
                          v-model.number="item.sizeStock[sz]"
                          type="number"
                          step="1"
                          min="0"
                          class="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        END Merch Concierge Section -->

        <!-- Submit Button -->
        <div class="pt-6 pb-10">
          <button 
            type="submit" 
            class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-lg shadow-lg shadow-purple-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </form>
      <PayoutSetupPrompt
        :open="payoutPromptOpen"
        mode="edit"
        @setup="saveThenSetUpPayouts"
        @dismiss="declinePayoutPrompt"
      />
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { normalizeLink, isValidHttpUrl, normalizeLinkOrNull } from "@/utils/normalizeLink";
import EditorialShowcaseEditor from "@/components/editorial/EditorialShowcaseEditor.vue";
import { useEditorialShowcaseAccess } from "@/composables/useEditorialShowcaseAccess";
import { useArtistSetupNav } from "@/composables/useArtistSetupNav";
import { hasAnyFilled, visibleArtistSetupSections } from "@/utils/bands/artistSetupSections";
import {
  detectFeaturedMusicPlatform,
  featuredMusicIsReady,
  featuredPlayerLooksReady,
  isValidSpotifyShareUrl,
  maybeDetectFeaturedPlatform,
  normalizeFeaturedPlayerInput,
} from "@/utils/bands/featuredMusic";
import {
  FEATURED_TRACK_ADD_ERROR,
  FEATURED_VIDEO_ADD_ERROR,
  extractYoutubeId,
  featuredVideoPreview,
} from "@/utils/bands/featuredVideo";
import { DEFAULT_PUBLICATION_HEADER_IMAGE_MODE } from "@/utils/publicationProfile";
import { paymentSetupStatus } from "@/utils/payments/paymentSetupStatus";
import { payoutReturnKind, usePayoutSetup } from "@/composables/usePayoutSetup";
import PayoutSetupPrompt from "@/components/payments/PayoutSetupPrompt.vue";
import {
  readImageDimensions,
  unwrapBandImage,
  validateArtistProfileImageFile,
} from "@/utils/media/artistImage";
import {
  buildCyberedFramingSavePayload,
  getDefaultCyberedSurfaceFraming,
  readCyberedSurfaceFraming,
  resetCyberedSurfaceCrop,
} from "@/utils/media/cyberedArtistFraming";

const singlevideoTitle = ref("");
const singlesongEmbedHtml = ref("");

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const user = useStrapiUser();
const token = useStrapiToken();

const loading = ref(false);
const loadingMessage = ref('Saving changes...');
const payoutError = ref("");

const stripeAccountId = ref(null);
const stripeOnboardingComplete = ref(false);
const paymentsEnabled = ref(false);

// Fresh stage from the server (Stripe), when it has answered.
const payoutStage = ref(null);
// Set when the artist just came back from Stripe (?payouts=…).
const payoutReturn = ref(null);
// True only when the server read the account from Stripe just now.
const payoutVerified = ref(false);

// Why fans can or can't see payment options, and the one step that fixes it.
const setupStatus = computed(() =>
  paymentSetupStatus({
    stripeAccountId: stripeAccountId.value,
    stripeOnboardingComplete: stripeOnboardingComplete.value,
    paymentsEnabled: paymentsEnabled.value,
    enabledOptionCount: paymentButtons.value.filter((b) => b.enabled).length,
    stage: payoutStage.value,
  })
);

// The status card, greeting an artist who just finished in Stripe.
const statusCard = computed(() => {
  const s = setupStatus.value;
  if (payoutReturn.value === "return" && !payoutVerified.value) {
    // Stripe didn't answer: show the saved status without claiming a fresh check.
    return {
      ...s,
      tone: "action",
      title: "We couldn't confirm your payout status yet",
      body: `Stripe didn't answer just now, so this shows your last saved status: ${s.title.toLowerCase()}. Check back in a few minutes.`,
    };
  }
  if (payoutReturn.value === "return" && s.state === "live") {
    return { ...s, title: "Your payments are ready!" };
  }
  if (payoutReturn.value === "refresh" && s.action) {
    return { ...s, title: "Your setup link expired", body: `Pick up where you left off. ${s.body}` };
  }
  return s;
});

const { openPayoutSetup, fetchPayoutStatus, onBackFromStripe } = usePayoutSetup();
const payoutPromptOpen = ref(false);
// Ask once per visit; "Not Now" means not now.
const payoutPromptAnswered = ref(false);
// Set while saving on the way to Stripe, so submitForm opens Stripe instead of the artist page.
const payoutAfterSave = ref(false);

onBackFromStripe(() => {
  loading.value = false;
});

function onPaymentToggle(btn) {
  if (!btn.enabled || payoutPromptAnswered.value) return;
  if (setupStatus.value.state === "live") return;
  payoutPromptOpen.value = true;
}

function declinePayoutPrompt() {
  payoutPromptOpen.value = false;
  payoutPromptAnswered.value = true;
}

// Save what's on screen, then open Stripe; Stripe returns here (?payouts=return).
function saveThenSetUpPayouts() {
  payoutPromptOpen.value = false;
  payoutPromptAnswered.value = true;
  payoutError.value = "";
  payoutAfterSave.value = true;
  submitForm();
}

async function refreshPayoutStatus() {
  if (!stripeAccountId.value && payoutReturn.value == null) return;
  const status = await fetchPayoutStatus(route.params.id);
  if (!status) return;
  // No Stripe account means nothing to check; "not started" is already accurate.
  payoutVerified.value = status.checkedWithStripe === true || status.stage === "not_started";
  payoutStage.value = status.stage;
  paymentsEnabled.value = status.paymentsEnabled === true;
  stripeOnboardingComplete.value = status.stripeOnboardingComplete === true;
}

// flags for “delete on save”
const removeSong = ref(false);
const removeVideo = ref(false);

// Always use smartlink (cybered) template
const buttonStyle = ref('classic'); // 'classic' | 'modern'

// Feature flag: show alternative templates for all users
const showAlternativeTemplates = computed(() => true);

// Band basics
const bandName = ref("");
const genre = ref("");
const bio = ref("");
const websitelink = ref("");
const websitelinktext = ref("");
const officialMerchUrl = ref("");
const officialMerchUrlError = ref("");

// Track existing vs new image
const bandImgFile = ref(null);
const bandImgUrl = ref("");
const bandImgId = ref(null);
const bandImgWidth = ref(null);
const bandImgHeight = ref(null);
const bandImgError = ref("");
const bandImgInput = ref(null);
const artistImagePhone = ref(getDefaultCyberedSurfaceFraming());
const artistImageDesktop = ref(getDefaultCyberedSurfaceFraming());
const phoneFramingDirty = ref(false);
const desktopFramingDirty = ref(false);
const imageSectionDirty = computed(() => phoneFramingDirty.value || desktopFramingDirty.value);
const hydratedImageSignature = ref("");

// Full URL for band image (handles both relative Strapi URLs and blob URLs)
const bandImgFullUrl = computed(() => {
  if (!bandImgUrl.value) return "";
  if (bandImgUrl.value.startsWith("http") || bandImgUrl.value.startsWith("blob:")) {
    return bandImgUrl.value;
  }
  return `${config.public.strapiUrl}${bandImgUrl.value}`;
});

// Members
const members = ref([]);

// Social media links
const social = ref({
  facebook: "",
  instagram: "",
  twitter: "",
  tiktok: "",
  threads: "",
  discord: "",
  telegram: "",
  reddit: "",
  pinterest: "",
  linkedin: "",
  whatsapp: "",
  snapchat: "",
  patreon: "",
});

// Streaming links
const streaming = ref({
  youtube: "",
  youtubeMusic: "",
  spotify: "",
  appleMusic: "",
  amazonMusic: "",
  tidal: "",
  pandora: "",
  soundcloud: "",
  audiomack: "",
  bandcamp: "",
  deezer: "",
  mixcloud: "",
  beatport: "",
  napster: "",
  twitch: "",
  vimeo: "",
  kick: "",
  reverbnation: "",
});

// Event hub links
const eventHubs = ref({
  bandsintown: "",
  songkick: "",
  jambase: "",
  relix: "",
});

// Contact / Booking
const contacts = ref({
  bookingEmail: "",
  managementEmail: "",
  pressEmail: "",
  bookingAgent: "",
  labelUrl: "",
  labelName: "",
});

const hiddenLinks = ref([]);

// Custom Buttons
const customButtons = ref([]);
const customButtonIconFiles = ref({}); // { index: File }

const { hasAccess: hasEditorialShowcaseAccess } = useEditorialShowcaseAccess();
const editorialEditorRef = ref(null);
const editorialShowcaseEnabled = ref(false);
const editorialSectionTitle = ref("");
const editorialArchiveUrl = ref("");
const editorialArchiveLabel = ref("");
const publicationHeaderImageMode = ref(DEFAULT_PUBLICATION_HEADER_IMAGE_MODE);
const editorialItems = ref([]);
const editorialImageFiles = ref({}); // { localId: File }

function editorialLocalId(item, index) {
  return item._localId || `ed-load-${item.id || index}`;
}

// Merch Concierge config
const mcSizes = ["S", "M", "L", "XL", "2XL"];
const mcEnabled = ref(false);
const mcPickupInstructions = ref("");
const mcStaffReadyConfirmed = ref(false);
const mcPriceTextByIndex = ref(["", "", ""]);
const mcItemImageFiles = ref([null, null, null]);
const mcItemImagePreviewByIndex = ref({});
const mcItems = ref([
  {
    title: "",
    description: "",
    imageUrl: "",
    priceCents: 0,
    sizesEnabled: false,
    availableQty: 0,
    sizeStock: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 },
  },
  {
    title: "",
    description: "",
    imageUrl: "",
    priceCents: 0,
    sizesEnabled: false,
    availableQty: 0,
    sizeStock: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 },
  },
  {
    title: "",
    description: "",
    imageUrl: "",
    priceCents: 0,
    sizesEnabled: false,
    availableQty: 0,
    sizeStock: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 },
  },
]);

function normalizeMerchConcierge(raw) {
  const mc = raw && typeof raw === "object" ? raw : null;
  if (!mc) return;

  mcEnabled.value = mc.enabled === true;
  mcPickupInstructions.value = mc.pickupInstructions ? String(mc.pickupInstructions) : "";
  mcStaffReadyConfirmed.value = mc.staffReadyConfirmed === true;

  const items = Array.isArray(mc.merchItems) ? mc.merchItems : [];
  const next = mcItems.value.map((d, i) => {
    const it = items[i] || {};
    const sizesEnabled = it.sizesEnabled === true;
    const sizeStock = it.sizeStock && typeof it.sizeStock === "object" ? it.sizeStock : {};

    return {
      ...d,
      title: it.title ? String(it.title) : "",
      description: it.description ? String(it.description) : "",
      imageUrl: it.imageUrl ? String(it.imageUrl) : "",
      priceCents: Number(it.priceCents || 0),
      sizesEnabled,
      availableQty: Number(it.availableQty || 0),
      sizeStock: {
        S: Number(sizeStock.S || 0),
        M: Number(sizeStock.M || 0),
        L: Number(sizeStock.L || 0),
        XL: Number(sizeStock.XL || 0),
        "2XL": Number(sizeStock["2XL"] || 0),
      },
    };
  });

  mcItems.value = next;

  mcPriceTextByIndex.value = next.map((it) => formatMcPriceDollars(it.priceCents));
}

function formatMcPriceDollars(priceCents) {
  const n = Number(priceCents || 0);
  return (n / 100).toFixed(2);
}

function parseMcPriceToCents(value) {
  const s = String(value == null ? "" : value).trim();
  if (!s) return 0;
  const num = Number(s);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

function commitMcPrice(idx) {
  const v = mcPriceTextByIndex.value?.[idx];
  const cents = parseMcPriceToCents(v);
  mcItems.value[idx].priceCents = cents;
  mcPriceTextByIndex.value[idx] = formatMcPriceDollars(cents);
}

function onMcImageFileChange(idx, e) {
  const f = e?.target?.files?.[0] || null;
  mcItemImageFiles.value[idx] = f;

  const next = { ...(mcItemImagePreviewByIndex.value || {}) };
  if (f) {
    next[idx] = URL.createObjectURL(f);
  } else {
    delete next[idx];
  }
  mcItemImagePreviewByIndex.value = next;
}

function clearMcImage(idx) {
  mcItemImageFiles.value[idx] = null;
  mcItems.value[idx].imageUrl = "";
  const next = { ...(mcItemImagePreviewByIndex.value || {}) };
  delete next[idx];
  mcItemImagePreviewByIndex.value = next;
}

function resetMcItem(idx) {
  if (!confirm("Clear this merch item?")) return;

  mcItems.value[idx] = {
    title: "",
    description: "",
    imageUrl: "",
    priceCents: 0,
    sizesEnabled: false,
    availableQty: 0,
    sizeStock: { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 },
  };

  mcItemImageFiles.value[idx] = null;
  const next = { ...(mcItemImagePreviewByIndex.value || {}) };
  delete next[idx];
  mcItemImagePreviewByIndex.value = next;

  mcPriceTextByIndex.value[idx] = "";
}

function normalizeHiddenLinks(v) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (v && typeof v === 'object') return Object.keys(v).filter((k) => v[k]);
  return [];
}

function isLinkHidden(key) {
  return Array.isArray(hiddenLinks.value) && hiddenLinks.value.includes(key);
}

function setLinkHidden(key, hidden) {
  const next = Array.isArray(hiddenLinks.value) ? [...hiddenLinks.value] : [];
  const idx = next.indexOf(key);
  if (hidden && idx === -1) next.push(key);
  if (!hidden && idx !== -1) next.splice(idx, 1);
  hiddenLinks.value = next;
}

const paymentButtons = ref([
  {
    key: "pay_entry",
    title: "Pay Entry",
    badgeId: "show_supporter",
    description: "Door entry for tonight’s show",
    enabled: false,
    pricingMode: "min",
    minAmount: 5,
    fixedAmount: null,
    presetAmounts: [],
    presetAmountsText: "",
    shareEnabled: true,
    unlockEnabled: false,
    supporterWallEligible: true,
  },
  // {
  //   key: "tip_band",
  //   title: "Tip the Band",
  //   badgeId: "tip_legend",
  //   description: "Thanks for the support ❤️",
  //   enabled: false,
  //   pricingMode: "min",
  //   minAmount: 5,
  //   fixedAmount: null,
  //   presetAmounts: [],
  //   presetAmountsText: "",
  //   shareEnabled: true,
  //   unlockEnabled: false,
  //   supporterWallEligible: true,
  // },
  // {
  //   key: "pay_merch",
  //   title: "Pay for Merch",
  //   badgeId: "merch_mvp",
  //   description: "Shirts, posters, vinyl, etc.",
  //   enabled: false,
  //   pricingMode: "min",
  //   minAmount: 5,
  //   fixedAmount: null,
  //   presetAmounts: [],
  //   presetAmountsText: "",
  //   shareEnabled: true,
  //   unlockEnabled: false,
  //   supporterWallEligible: true,
  // },
  {
    key: "support_band",
    title: "Support the Band",
    badgeId: "band_backer",
    description: "Help us keep making music",
    enabled: false,
    pricingMode: "min",
    minAmount: 5,
    fixedAmount: null,
    presetAmounts: [],
    presetAmountsText: "",
    shareEnabled: true,
    unlockEnabled: false,
    supporterWallEligible: true,
  },
  // {
  //   key: "help_get_home",
  //   title: "Help Us Get Home",
  //   badgeId: "road_crew",
  //   description: "Gas, food, and late nights on the road",
  //   enabled: false,
  //   pricingMode: "min",
  //   minAmount: 5,
  //   fixedAmount: null,
  //   presetAmounts: [],
  //   presetAmountsText: "",
  //   shareEnabled: true,
  //   unlockEnabled: false,
  //   supporterWallEligible: true,
  // },
  // {
  //   key: "after_show_support",
  //   title: "After-Show Support",
  //   badgeId: "after_show_backer",
  //   description: "Thanks for coming out tonight ❤️",
  //   enabled: false,
  //   pricingMode: "min",
  //   minAmount: 5,
  //   fixedAmount: null,
  //   presetAmounts: [],
  //   presetAmountsText: "",
  //   shareEnabled: true,
  //   unlockEnabled: false,
  //   supporterWallEligible: true,
  // },
  {
    key: "merch_table",
    title: "Merch Table Payment",
    badgeId: "merch_table_buyer",
    description: "Scan at the merch table and enter your total.",
    enabled: false,
    pricingMode: "min",
    minAmount: 1,
    fixedAmount: null,
    presetAmounts: [],
    presetAmountsText: "",
    shareEnabled: true,
    unlockEnabled: false,
    supporterWallEligible: true,
  },
]);

function sanitizePricingMode(v) {
  return v === "fixed" || v === "presets" || v === "min" ? v : "min";
}

function parsePresetAmounts(v) {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => Number(String(s).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function sanitizePresetAmounts(arr) {
  return Array.isArray(arr)
    ? arr
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];
}

function formatPresetAmounts(arr) {
  return Array.isArray(arr) ? arr.filter(Boolean).join(", ") : "";
}

function mergePaymentButtons(existing = []) {
  const safeExisting = Array.isArray(existing) ? existing : [];
  const byKey = new Map(safeExisting.filter(Boolean).map((b) => [b.key, b]));
  return paymentButtons.value.map((d) => {
    const e = byKey.get(d.key) || {};

    const pricingMode = sanitizePricingMode(e.pricingMode ?? d.pricingMode);
    const minAmount = Number(e.minAmount ?? d.minAmount ?? 5);
    const fixedAmountRaw = e.fixedAmount ?? d.fixedAmount ?? null;
    const fixedAmount = fixedAmountRaw == null ? null : Number(fixedAmountRaw);
    const presetAmounts = sanitizePresetAmounts(e.presetAmounts ?? d.presetAmounts);

    return {
      ...d,
      ...e,
      key: d.key,
      title: d.title,
      description: d.description,
      enabled: e.enabled === true,
      pricingMode,
      minAmount: pricingMode === "min" ? minAmount : null,
      fixedAmount: pricingMode === "fixed" ? fixedAmount : null,
      presetAmounts: pricingMode === "presets" ? presetAmounts : [],
      presetAmountsText:
        pricingMode === "presets" ? formatPresetAmounts(presetAmounts) : "",
    };
  });
}

// Featured song/video
const singlesongType = ref("embed"); // 'upload' | 'embed' — fetchBand restores saved method
const singlesongTitle = ref("");
const singlesongPlatform = ref("spotify"); // fetchBand overwrites from saved singlesong
const singlesongTrackId = ref(""); // new
const singlesongFile = ref(null);
const singlesongFileId = ref(null); // preserve existing file relation
const existingSongFilename = ref(""); // store the existing song filename
const songInputKey = ref(0); // key to reset file input

// Spotify oEmbed state
const spotifyUrlInput = ref("");
const spotifyOembedLoading = ref(false);
const spotifyOembedError = ref("");
const spotifyOembedData = ref(null); // { spotifyUrl, type, title, thumbnailUrl, html }

let spotifyFetchTimeout = null;

watch(spotifyUrlInput, (newUrl) => {
  if (spotifyFetchTimeout) {
    clearTimeout(spotifyFetchTimeout);
    spotifyFetchTimeout = null;
  }

  spotifyOembedError.value = "";

  const detected = maybeDetectFeaturedPlatform(newUrl, singlesongPlatform.value);
  if (detected && detected !== "spotify") {
    singlesongPlatform.value = detected;
    singlesongEmbedHtml.value = String(newUrl || "").trim();
    return;
  }

  if (spotifyOembedData.value?.spotifyUrl === String(newUrl || "").trim()) return;

  if (isValidSpotifyShareUrl(newUrl)) {
    spotifyFetchTimeout = setTimeout(() => {
      fetchSpotifyOembed();
    }, 500);
  }
});

watch(singlesongEmbedHtml, (value) => {
  if (singlesongType.value !== "embed") return;
  const detected = maybeDetectFeaturedPlatform(value, singlesongPlatform.value);
  if (detected === "spotify" && isValidSpotifyShareUrl(value)) {
    singlesongPlatform.value = "spotify";
    spotifyUrlInput.value = String(value).trim();
  } else if (detected) {
    singlesongPlatform.value = detected;
  }
});

async function fetchSpotifyOembed() {
  if (spotifyOembedLoading.value) return;
  if (!spotifyUrlInput.value) return;
  if (!isValidSpotifyShareUrl(spotifyUrlInput.value)) {
    spotifyOembedError.value = "Please enter a valid Spotify URL";
    return;
  }
  
  spotifyOembedLoading.value = true;
  spotifyOembedError.value = "";
  spotifyOembedData.value = null;
  
  try {
    const res = await $fetch(`/api/spotify/oembed`, {
      query: { url: spotifyUrlInput.value }
    });
    
    if (res.ok) {
      spotifyOembedData.value = res;
      // Auto-fill title if empty
      if (!singlesongTitle.value && res.title) {
        singlesongTitle.value = res.title;
      }
    } else {
      spotifyOembedError.value = FEATURED_TRACK_ADD_ERROR;
    }
  } catch (err) {
    spotifyOembedError.value = FEATURED_TRACK_ADD_ERROR;
  } finally {
    spotifyOembedLoading.value = false;
  }
}

function clearSpotifyEmbed() {
  spotifyUrlInput.value = "";
  spotifyOembedData.value = null;
  spotifyOembedError.value = "";
}

function changeSpotifyTrack() {
  spotifyOembedData.value = null;
  spotifyOembedError.value = "";
}

function removeEmbedSong() {
  singlesongEmbedHtml.value = "";
}

const singlevideoYoutubeUrl = ref("");
const videoAdding = ref(false);
const videoAddError = ref("");
const videoAdded = ref(false);
const videoPreview = computed(() =>
  videoAdded.value
    ? featuredVideoPreview(singlevideoYoutubeUrl.value, singlevideoTitle.value)
    : null
);

async function addFeaturedVideo() {
  if (videoAdding.value) return;
  videoAddError.value = "";
  videoAdding.value = true;
  await nextTick();
  try {
    const preview = featuredVideoPreview(singlevideoYoutubeUrl.value, singlevideoTitle.value);
    if (!preview) {
      videoAddError.value = FEATURED_VIDEO_ADD_ERROR;
      return;
    }
    videoAdded.value = true;
    removeVideo.value = false;
  } finally {
    videoAdding.value = false;
  }
}

function changeFeaturedVideo() {
  videoAdded.value = false;
  videoAddError.value = "";
}

// Pasting a YouTube link adds it, like Spotify tracks: no button to press.
let videoAddTimeout = null;
watch(singlevideoYoutubeUrl, (url) => {
  clearTimeout(videoAddTimeout);
  videoAddError.value = "";
  if (videoAdded.value || !String(url || "").trim()) return;
  videoAddTimeout = setTimeout(() => {
    if (extractYoutubeId(url)) addFeaturedVideo();
    else videoAddError.value = FEATURED_VIDEO_ADD_ERROR;
  }, 500);
});

// Clear the song fields and mark for removal on Save
function deleteSong() {
  if (!confirm("Remove the featured song from this form?")) return;
  removeSong.value = true;
  singlesongTitle.value = "";
  singlesongPlatform.value = "";
  singlesongTrackId.value = "";
  singlesongEmbedHtml.value = "";
  singlesongFile.value = null;
  singlesongFileId.value = null;
  existingSongFilename.value = "";
  songInputKey.value++;
  // Clear Spotify oEmbed state
  spotifyUrlInput.value = "";
  spotifyOembedData.value = null;
  spotifyOembedError.value = "";
}

// Clear the video field and mark for removal on Save
function deleteVideo() {
  if (!confirm("Remove the featured video from this form?")) return;
  removeVideo.value = true;
  singlevideoYoutubeUrl.value = "";
  singlevideoTitle.value = "";
  videoAdded.value = false;
  videoAddError.value = "";
}

const rawEmbedHtml = computed(() => singlesongEmbedHtml.value || "");

function validateOfficialMerchUrl() {
  if (!officialMerchUrl.value.trim()) {
    officialMerchUrlError.value = "";
    return true;
  }
  if (!isValidHttpUrl(officialMerchUrl.value)) {
    officialMerchUrlError.value = "Enter a valid http:// or https:// URL.";
    return false;
  }
  officialMerchUrl.value = normalizeLink(officialMerchUrl.value);
  officialMerchUrlError.value = "";
  return true;
}

const errorSectionId = ref("");
const setupSections = computed(() =>
  visibleArtistSetupSections({
    isEdit: true,
    hasEditorial: hasEditorialShowcaseAccess.value,
  })
);

function getSetupState() {
  return {
    name: bandName.value,
    bio: bio.value,
    genre: genre.value,
    genreRequired: true,
    hasImage: Boolean(bandImgFullUrl.value || bandImgFile.value),
    hasEditorial:
      editorialShowcaseEnabled.value ||
      editorialItems.value.some((item) => item?.title || item?.url),
    hasFeaturedMusic: featuredMusicIsReady({
      mode: singlesongType.value,
      platform: singlesongPlatform.value,
      hasFile: Boolean(singlesongFile.value || singlesongFileId.value),
      spotifyPreview: spotifyOembedData.value,
      embedHtml: singlesongEmbedHtml.value,
    }),
    hasVideo: Boolean(extractYoutubeId(singlevideoYoutubeUrl.value) || singlevideoTitle.value.trim()),
    hasLinks:
      hasAnyFilled([websitelink.value, officialMerchUrl.value, contacts.value]) ||
      hasAnyFilled(customButtons.value),
    hasStreaming: hasAnyFilled(streaming.value),
    hasSocial: hasAnyFilled(social.value) || hasAnyFilled(eventHubs.value),
    hasSupport:
      paymentButtons.value.some((btn) => btn.enabled) || Boolean(stripeAccountId.value),
  };
}

const {
  items: setupItems,
  current: setupCurrent,
  currentPosition,
  jumpOpen,
  scrollToSection,
  markError,
} = useArtistSetupNav({
  sections: setupSections,
  getState: getSetupState,
  errorSectionId,
});

function setupNumber(id) {
  return setupItems.value.find((section) => section.id === id)?.number || "";
}

function onSetupInvalid(event) {
  const id = event.target?.id;
  if (id === "band-name" || id === "bio" || id === "genre") {
    markError("setup-details", id);
  }
}

async function fetchBand() {
  loading.value = true;
  const id = route.params.id;

  try {
    const url =
      `${config.public.strapiUrl}/api/bands/${id}` +
      `?populate=bandImg,members.image,singlesong.song,singlevideo,customButtons.customIcon,editorialItems.image`;
    const res = await fetch(url, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    });
    const j = await res.json();
    if (!j.data) throw new Error("No data");

    // Support both Strapi response formats:
    // - Core controller: { data: { id, attributes: {...} } }
    // - Custom controller: { data: { id, name, ... } } (flat)
    const attrs = j.data.attributes || j.data;

    stripeAccountId.value = attrs.stripeAccountId || null;
    stripeOnboardingComplete.value = attrs.stripeOnboardingComplete === true;
    paymentsEnabled.value = attrs.paymentsEnabled === true;

    // Basic fields
    bandName.value = attrs.name || "";
    genre.value = attrs.genre || "";
    bio.value = attrs.bio || "";
    websitelink.value = normalizeLink(attrs.websitelink) || "";
    websitelinktext.value = attrs.websitelinktext || "";
    officialMerchUrl.value = normalizeLink(attrs.officialMerchUrl) || "";
    officialMerchUrlError.value = "";
    // Always use smartlink (cybered) template
    buttonStyle.value = attrs.buttonStyle || "classic";

    // Existing image - handle both formats
    const img = attrs.bandImg?.data || attrs.bandImg;
    const unwrappedImg = unwrapBandImage(attrs.bandImg);
    bandImgId.value = img?.id || unwrappedImg?.id || null;
    bandImgUrl.value = img?.attributes?.url || img?.url || unwrappedImg?.url || "";
    bandImgWidth.value = unwrappedImg?.width || img?.attributes?.width || img?.width || null;
    bandImgHeight.value = unwrappedImg?.height || img?.attributes?.height || img?.height || null;
    bandImgError.value = "";
    const surfaces = readCyberedSurfaceFraming(attrs);
    artistImagePhone.value = surfaces.phone;
    artistImageDesktop.value = surfaces.desktop;
    hydratedImageSignature.value = artistImageSignature();
    phoneFramingDirty.value = false;
    desktopFramingDirty.value = false;

    // Members - handle both formats
    const rawMembers = attrs.members?.data || attrs.members || [];
    members.value = rawMembers.map((m) => {
      const memberData = m.attributes || m;
      const memberImg = memberData.image?.data || memberData.image;
      return {
        name: memberData.name,
        instrument: memberData.instrument,
        imageUrl: memberImg?.attributes?.url || memberImg?.url || null,
      };
    });

    // Social & Streaming & Event Hubs
    console.log('[DEBUG fetchBand] Full attrs:', attrs);
    console.log('[DEBUG fetchBand] threads:', attrs.threads, 'discord:', attrs.discord, 'patreon:', attrs.patreon);
    Object.keys(social.value).forEach(
      (k) => (social.value[k] = attrs[k] || "")
    );
    Object.keys(streaming.value).forEach(
      (k) => (streaming.value[k] = attrs[k] || "")
    );
    Object.keys(eventHubs.value).forEach(
      (k) => (eventHubs.value[k] = attrs[k] || "")
    );

    // Load contact/booking fields
    contacts.value.bookingEmail = attrs.bookingEmail || "";
    contacts.value.managementEmail = attrs.managementEmail || "";
    contacts.value.pressEmail = attrs.pressEmail || "";
    contacts.value.bookingAgent = attrs.bookingAgent || "";
    contacts.value.labelUrl = attrs.labelUrl || "";
    contacts.value.labelName = attrs.labelName || "";

    hiddenLinks.value = normalizeHiddenLinks(attrs.hiddenLinks);

    // Custom buttons - preserve customIcon.id for saving
    customButtons.value = Array.isArray(attrs.customButtons) 
      ? attrs.customButtons.map(btn => {
          // Handle both Strapi response formats for media
          const iconData = btn.customIcon?.data;
          const customIcon = iconData 
            ? { id: iconData.id, ...iconData.attributes }
            : btn.customIcon 
              ? { id: btn.customIcon.id, ...btn.customIcon }
              : null;
          return {
            id: btn.id,
            title: btn.title || '',
            subtitle: btn.subtitle || '',
            url: btn.url || '',
            iconName: btn.iconName || '',
            customIcon
          };
        })
      : [];

    editorialShowcaseEnabled.value = attrs.editorialShowcaseEnabled === true;
    editorialSectionTitle.value = attrs.editorialSectionTitle || "";
    editorialArchiveUrl.value = normalizeLink(attrs.editorialArchiveUrl) || "";
    editorialArchiveLabel.value = attrs.editorialArchiveLabel || "";
    publicationHeaderImageMode.value =
      attrs.publicationHeaderImageMode === "cinematic_cover"
        ? "cinematic_cover"
        : DEFAULT_PUBLICATION_HEADER_IMAGE_MODE;
    editorialItems.value = Array.isArray(attrs.editorialItems)
      ? attrs.editorialItems.map((item, index) => {
          const imageData = item.image?.data;
          const image = imageData
            ? { id: imageData.id, ...imageData.attributes }
            : item.image
              ? { id: item.image.id, ...item.image }
              : null;
          return {
            id: item.id,
            _localId: `ed-load-${item.id ?? index}`,
            contentType: item.contentType || "article",
            title: item.title || "",
            url: item.url || "",
            category: item.category || "",
            excerpt: item.excerpt || "",
            isFeatured: item.isFeatured === true,
            image,
          };
        })
      : [];

    paymentButtons.value = mergePaymentButtons(attrs.paymentButtons);

    normalizeMerchConcierge(attrs.merchConcierge);

    // Singlesong component + existing file - handle both formats
    if (attrs.singlesong) {
      const ss = attrs.singlesong;
      singlesongTitle.value = ss.title || "";
      if (ss.isEmbed) {
        singlesongType.value = "embed";
        singlesongPlatform.value = ss.platform || "";
        singlesongTrackId.value = ss.trackId || "";
        singlesongEmbedHtml.value = ss.embedHtml || "";
        
        // Load Spotify oEmbed data if present
        if (ss.platform === "spotify" && ss.spotifyUrl) {
          spotifyUrlInput.value = ss.spotifyUrl || "";
          spotifyOembedData.value = {
            spotifyUrl: ss.spotifyUrl,
            type: ss.spotifyOembedType || "track",
            title: ss.spotifyOembedTitle || "",
            thumbnailUrl: ss.spotifyOembedThumbnailUrl || "",
            html: ss.spotifyOembedHtml || ""
          };
        } else if (!ss.platform && ss.embedHtml) {
          singlesongPlatform.value =
            detectFeaturedMusicPlatform(ss.embedHtml) ||
            (ss.embedHtml.includes("open.spotify.com") ? "spotify" : "");
        }
      } else {
        singlesongType.value = "upload";
      }
      const songFile = ss.song?.data || ss.song;
      singlesongFileId.value = songFile?.id || null;
      existingSongFilename.value = songFile?.attributes?.name || songFile?.name || "";
    } else {
      singlesongType.value = "embed";
      singlesongPlatform.value = "spotify";
    }

    // Singlevideo component
    if (attrs.singlevideo) {
      // Convert stored ID back to full URL for display
      const youtubeId = attrs.singlevideo.youtubeid || "";
      singlevideoYoutubeUrl.value = youtubeId ? `https://youtube.com/watch?v=${youtubeId}` : "";
      singlevideoTitle.value = attrs.singlevideo?.title || "";
      videoAdded.value = Boolean(youtubeId);
      videoAddError.value = "";
    }
  } catch (err) {
    console.error("❌ fetchBand failed:", err);
  } finally {
    loading.value = false;
  }
}
onMounted(async () => {
  payoutReturn.value = payoutReturnKind(route.query);
  await fetchBand();
  if (payoutReturn.value === "error") {
    payoutError.value = "Your band was saved, but Stripe payout setup didn't open. Try again below.";
  }
  await refreshPayoutStatus();
  if (payoutReturn.value || route.hash === "#setup-support") {
    // Drop ?payouts= so a reload doesn't greet them again; the status stays accurate.
    if (payoutReturn.value) router.replace({ path: route.path, hash: "#setup-support" });
    await nextTick();
    document.getElementById("setup-support")?.scrollIntoView({ block: "start" });
  }
});

// Handlers
async function handleImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const check = validateArtistProfileImageFile(file);
  if (check.error) {
    bandImgError.value = check.message;
    if (bandImgInput.value) bandImgInput.value.value = "";
    return;
  }

  bandImgError.value = "";
  bandImgFile.value = file;
  bandImgUrl.value = URL.createObjectURL(file);
  applyNewImagePresentation();
  const dimensions = await readImageDimensions(file);
  bandImgWidth.value = dimensions.width;
  bandImgHeight.value = dimensions.height;
}

function artistImageSignature() {
  return JSON.stringify({
    phone: artistImagePhone.value,
    desktop: artistImageDesktop.value,
    file: Boolean(bandImgFile.value),
  });
}

function onArtistFramingChange({ surface } = {}) {
  if (surface === 'desktop') desktopFramingDirty.value = true;
  else phoneFramingDirty.value = true;
}

function applyNewImagePresentation() {
  artistImagePhone.value = resetCyberedSurfaceCrop(artistImagePhone.value);
  artistImageDesktop.value = resetCyberedSurfaceCrop(artistImageDesktop.value);
  phoneFramingDirty.value = true;
  desktopFramingDirty.value = true;
}
function handleSingleSongUpload(e) {
  singlesongFile.value = e.target.files[0];
}

function handleCustomButtonIconUpload({ index, file }) {
  customButtonIconFiles.value[index] = file;
}

function handleEditorialImageUpload({ localId, file }) {
  if (!localId || !file) return;
  editorialImageFiles.value = { ...editorialImageFiles.value, [localId]: file };
}

function handleEditorialImageRemove({ localId }) {
  if (!localId || !editorialImageFiles.value[localId]) return;
  const { [localId]: _removed, ...rest } = editorialImageFiles.value;
  editorialImageFiles.value = rest;
}

// Normalize links before including them in the payload

async function submitForm() {
  loading.value = true;
  loadingMessage.value = 'Saving changes...';
  const id = route.params.id;
  const thenSetUpPayouts = payoutAfterSave.value;
  payoutAfterSave.value = false;

  try {
    errorSectionId.value = "";

    if (!bandName.value.trim() || !genre.value.trim() || !bio.value.trim()) {
      loading.value = false;
      markError(
        "setup-details",
        !bandName.value.trim() ? "band-name" : !genre.value.trim() ? "genre" : "bio"
      );
      return;
    }

    if (!validateOfficialMerchUrl()) {
      loading.value = false;
      markError("setup-links", "officialMerchUrl");
      return;
    }

    if (hasEditorialShowcaseAccess.value && editorialEditorRef.value) {
      if (editorialEditorRef.value.validateArchiveUrl && !editorialEditorRef.value.validateArchiveUrl()) {
        loading.value = false;
        markError("setup-editorial");
        return;
      }
      if (
        editorialShowcaseEnabled.value &&
        editorialEditorRef.value.validateForSave &&
        !editorialEditorRef.value.validateForSave()
      ) {
        loading.value = false;
        markError("setup-editorial");
        return;
      }
    }

    // Ensure merch price inputs are committed to cents
    for (let i = 0; i < mcItems.value.length; i++) {
      const cents = parseMcPriceToCents(mcPriceTextByIndex.value?.[i]);
      mcItems.value[i].priceCents = cents;
      mcPriceTextByIndex.value[i] = formatMcPriceDollars(cents);
    }

    // 1) Upload new image if chosen
    let newImageId = null;
    if (bandImgFile.value) {
      const fm = new FormData();
      fm.append("files", bandImgFile.value, bandImgFile.value.name);
      fm.append("ref", "api::band.band");
      fm.append("refId", id);
      fm.append("field", "bandImg");
      const up = await fetch(`${config.public.strapiUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.value}` },
        body: fm,
      });
      const uj = await up.json();
      if (!up.ok) throw uj;
      newImageId = uj[0]?.id ?? null;
    }

    // 2) Upload new song file if chosen (only relevant for upload mode)
    let newSongId = null;
    if (singlesongFile.value) {
      const fm2 = new FormData();
      fm2.append("files", singlesongFile.value, singlesongFile.value.name);
      fm2.append("ref", "api::band.band");
      fm2.append("refId", id);
      fm2.append("field", "singlesong.song");
      const su = await fetch(`${config.public.strapiUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.value}` },
        body: fm2,
      });
      const suj = await su.json();
      if (!su.ok) throw suj;
      newSongId = suj[0]?.id ?? null;
    }

    // 2b) Upload merch concierge images (stored as absolute URL in merchConcierge JSON)
    if (mcEnabled.value) {
      for (let i = 0; i < mcItemImageFiles.value.length; i++) {
        const f = mcItemImageFiles.value[i];
        if (!f) continue;

        const fm3 = new FormData();
        fm3.append("files", f, f.name);
        const mu = await fetch(`${config.public.strapiUrl}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token.value}` },
          body: fm3,
        });
        const muj = await mu.json();
        if (!mu.ok) throw muj;

        const uploadedUrl = muj?.[0]?.url || null;
        if (uploadedUrl) {
          const base = String(config.public.strapiUrl || "").replace(/\/+$/, "");
          const u = String(uploadedUrl);
          mcItems.value[i].imageUrl = u.startsWith("http")
            ? u
            : base + (u.startsWith("/") ? u : `/${u}`);
        }
      }
    }

    if (singlesongType.value === "embed") {
      if (singlesongPlatform.value === "spotify") {
        if (spotifyUrlInput.value.trim() && !spotifyOembedData.value) {
          await fetchSpotifyOembed();
        }
        if (spotifyUrlInput.value.trim() && !spotifyOembedData.value) {
          loading.value = false;
          markError("setup-music", "edit-music-spotify");
          return;
        }
      } else if (singlesongEmbedHtml.value.trim()) {
        singlesongEmbedHtml.value = normalizeFeaturedPlayerInput(
          singlesongPlatform.value,
          singlesongEmbedHtml.value
        );
        if (!featuredPlayerLooksReady(singlesongPlatform.value, singlesongEmbedHtml.value)) {
          alert(
            singlesongPlatform.value === "youtube"
              ? "Please paste a valid YouTube link."
              : "Please paste the official player for this track."
          );
          loading.value = false;
          markError("setup-music", "edit-music-embed");
          return;
        }
      }
    }

    // 3) Build payloads
    // Featured song
    let singlesongPayload = null;
    if (!removeSong.value) {
      const isEmbed = singlesongType.value === "embed";
      const isSpotify = isEmbed && singlesongPlatform.value === "spotify";
      const embedHtml = isEmbed && !isSpotify ? (singlesongEmbedHtml.value || "").trim() : "";

      singlesongPayload = {
        title: singlesongTitle.value || "",
        isEmbed,
        platform: isEmbed ? singlesongPlatform.value || null : null,
        // For non-Spotify embeds, use embedHtml
        embedHtml: isEmbed && !isSpotify ? embedHtml || null : null,
        // For Spotify, use oEmbed data
        spotifyUrl: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.spotifyUrl : null,
        spotifyOembedTitle: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.title : null,
        spotifyOembedThumbnailUrl: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.thumbnailUrl : null,
        spotifyOembedType: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.type : null,
        spotifyOembedHtml: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.html : null,
        // Legacy fields
        trackId: null,
        embedUrl: null,
        song: !isEmbed ? newSongId || singlesongFileId.value || null : null,
      };
    }

    // Featured video
    const singlevideoPayload = removeVideo.value
      ? null
      : {
          youtubeid: extractYoutubeId(singlevideoYoutubeUrl.value) || "",
          title: singlevideoTitle.value || "",
        };

    // Normalize socials/streaming/eventHubs
    const normalizedSocial = Object.fromEntries(
      Object.entries(social.value).map(([key, val]) => [
        key,
        normalizeLink(val),
      ])
    );
    const normalizedStreaming = Object.fromEntries(
      Object.entries(streaming.value).map(([key, val]) => [
        key,
        normalizeLink(val),
      ])
    );
    const normalizedEventHubs = Object.fromEntries(
      Object.entries(eventHubs.value).map(([key, val]) => [
        key,
        normalizeLink(val),
      ])
    );

    // Full band payload
    const payload = {
      name: bandName.value,
      pageStyle: 'smartlink',
      buttonStyle: buttonStyle.value,
      genre: genre.value,
      bio: bio.value,
      websitelink: websitelink.value || null,
      websitelinktext: websitelinktext.value || null,
      officialMerchUrl: normalizeLinkOrNull(officialMerchUrl.value),
      users_permissions_user: user.value.id,
      ...buildCyberedFramingSavePayload({
        phone: artistImagePhone.value,
        desktop: artistImageDesktop.value,
        phoneDirty: phoneFramingDirty.value,
        desktopDirty: desktopFramingDirty.value,
      }),
      hiddenLinks: hiddenLinks.value,
      merchConcierge: mcEnabled.value
        ? {
            enabled: true,
            pickupInstructions: String(mcPickupInstructions.value || "").trim(),
            staffReadyConfirmed: mcStaffReadyConfirmed.value === true,
            merchItems: mcItems.value.map((it) => {
              const sizesEnabled = it.sizesEnabled === true;
              const sizeStock = sizesEnabled ? (it.sizeStock || {}) : {};
              return {
                title: String(it.title || "").trim(),
                description: String(it.description || "").trim(),
                imageUrl: String(it.imageUrl || "").trim(),
                priceCents: Number(it.priceCents || 0),
                sizesEnabled,
                availableQty: sizesEnabled ? null : Number(it.availableQty || 0),
                sizeStock: sizesEnabled ? sizeStock : null,
              };
            }),
          }
        : { enabled: false },
      paymentButtons: paymentButtons.value.map((b) => {
        const mode = sanitizePricingMode(b.pricingMode);
        const minAmount = mode === "min" ? Number(b.minAmount || 5) : null;
        const fixedAmount =
          mode === "fixed" && b.fixedAmount != null && b.fixedAmount !== ""
            ? Number(b.fixedAmount)
            : null;
        const presetAmounts =
          mode === "presets"
            ? parsePresetAmounts(
                b.presetAmountsText != null
                  ? String(b.presetAmountsText)
                  : formatPresetAmounts(b.presetAmounts)
              )
            : [];
        return {
          key: b.key,
          title: b.title,
          description: b.description,
          badgeId: b.badgeId ?? null,
          enabled: b.enabled === true,
          pricingMode: mode,
          minAmount,
          fixedAmount,
          presetAmounts,
          shareEnabled: b.shareEnabled ?? true,
          unlockEnabled: b.unlockEnabled ?? false,
          supporterWallEligible: b.supporterWallEligible ?? true,
        };
      }),
      ...(newImageId
        ? { bandImg: newImageId }
        : bandImgId.value && { bandImg: bandImgId.value }),
      members: members.value.map((m) => ({
        name: m.name,
        instrument: m.instrument,
      })),
      ...normalizedSocial,
      ...normalizedStreaming,
      ...normalizedEventHubs,
      // contact / booking
      bookingEmail: contacts.value.bookingEmail?.trim() || "",
      managementEmail: contacts.value.managementEmail?.trim() || "",
      pressEmail: contacts.value.pressEmail?.trim() || "",
      bookingAgent: contacts.value.bookingAgent?.trim() || "",
      labelUrl: contacts.value.labelUrl?.trim() || "",
      labelName: contacts.value.labelName?.trim() || "",
      singlesong: singlesongPayload,
      singlevideo: singlevideoPayload,
      // Custom buttons - prepare for save (without file refs)
      customButtons: customButtons.value.map(btn => {
        const buttonData = {
          title: btn.title || '',
          subtitle: btn.subtitle || '',
          url: btn.url || '',
          iconName: btn.iconName || '',
        };
        // Only include customIcon if it has an ID
        if (btn.customIcon?.id) {
          buttonData.customIcon = btn.customIcon.id;
        }
        return buttonData;
      }),
      ...(hasEditorialShowcaseAccess.value
        ? {
            editorialShowcaseEnabled: editorialShowcaseEnabled.value === true,
            publicationHeaderImageMode:
              publicationHeaderImageMode.value === "cinematic_cover"
                ? "cinematic_cover"
                : "contain_blur",
            editorialSectionTitle: editorialSectionTitle.value.trim() || null,
            editorialArchiveUrl: normalizeLinkOrNull(editorialArchiveUrl.value),
            editorialArchiveLabel: editorialArchiveLabel.value.trim() || null,
            editorialItems: editorialItems.value.map((item, index) => {
              const row = {
                contentType: item.contentType || 'article',
                title: item.title || '',
                url: item.url || '',
                category: item.category || '',
                excerpt: item.excerpt || '',
                isFeatured: item.isFeatured === true,
              };
              if (item.image?.id) {
                row.image = item.image.id;
              }
              row._localId = editorialLocalId(item, index);
              return row;
            }),
          }
        : {}),
    };

    // 4a) Upload custom button icons if any
    console.log('🖼️ Custom button icon files to upload:', Object.keys(customButtonIconFiles.value));
    for (const [indexStr, file] of Object.entries(customButtonIconFiles.value)) {
      if (!file) continue;
      const index = parseInt(indexStr, 10);
      console.log(`🖼️ Uploading icon for button ${index}:`, file.name);
      
      const fm = new FormData();
      fm.append("files", file, file.name);
      const up = await fetch(`${config.public.strapiUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.value}` },
        body: fm,
      });
      const uj = await up.json();
      console.log(`🖼️ Upload response for button ${index}:`, uj);
      if (!up.ok) {
        console.error(`❌ Upload failed for button ${index}:`, uj.error);
      }
      if (up.ok && uj[0]?.id) {
        payload.customButtons[index].customIcon = uj[0].id;
        console.log(`✅ Set customIcon for button ${index} to ID:`, uj[0].id);
      }
    }
    // Clear the pending uploads
    customButtonIconFiles.value = {};

    if (hasEditorialShowcaseAccess.value && payload.editorialItems) {
      const localIdToIndex = Object.fromEntries(
        payload.editorialItems.map((item, idx) => [item._localId, idx])
      );

      for (const [localId, file] of Object.entries(editorialImageFiles.value)) {
        if (!file) continue;
        const index = localIdToIndex[localId];
        if (index === undefined) continue;

        const fm = new FormData();
        fm.append("files", file, file.name);
        const up = await fetch(`${config.public.strapiUrl}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token.value}` },
          body: fm,
        });
        const uj = await up.json();
        if (up.ok && uj[0]?.id && payload.editorialItems[index]) {
          payload.editorialItems[index].image = uj[0].id;
        }
      }

      payload.editorialItems = payload.editorialItems.map(({ _localId, ...row }) => row);
      editorialImageFiles.value = {};
    }

    // 4) Send update
    console.log('📤 Saving customButtons:', payload.customButtons);
    const put = await fetch(`${config.public.strapiUrl}/api/bands/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ data: payload }),
    });
    const pj = await put.json();
    console.log('📥 Response:', pj);
    if (!put.ok) throw pj;

    const savedAttrs = pj?.data?.attributes || pj?.data || {};
    const requestedHeaderMode =
      publicationHeaderImageMode.value === "cinematic_cover" ? "cinematic_cover" : "contain_blur";
    const savedHeaderMode = savedAttrs.publicationHeaderImageMode;
    if (hasEditorialShowcaseAccess.value && savedHeaderMode) {
      publicationHeaderImageMode.value =
        savedHeaderMode === "cinematic_cover" ? "cinematic_cover" : "contain_blur";
    }
    if (
      hasEditorialShowcaseAccess.value &&
      requestedHeaderMode === "cinematic_cover" &&
      savedHeaderMode !== "cinematic_cover"
    ) {
      loading.value = false;
      alert(
        "Publication header setting did not save. The Strapi backend may need to be restarted with the latest qrserver schema (publicationHeaderImageMode field)."
      );
      return;
    }

    // Saved on the way to payout setup: go to Stripe, which returns here.
    if (thenSetUpPayouts) {
      loadingMessage.value = 'Changes saved! Opening Stripe…';
      try {
        await openPayoutSetup(id, "editband");
        return; // loading stays on while the browser leaves
      } catch (e) {
        loading.value = false;
        payoutError.value = `Your changes are saved. ${e?.message || "Stripe payout setup didn't open."}`;
        await nextTick();
        document.getElementById("setup-support")?.scrollIntoView({ block: "start" });
        return;
      }
    }

   // ✅ get the current slug and do a full redirect (hard refresh)
let slug =
  pj?.data?.attributes?.slug ||
  pj?.data?.slug ||
  pj?.slug ||
  null;

if (!slug) {
  // fallback: refetch just the slug by id
  try {
    const r = await fetch(`${config.public.strapiUrl}/api/bands/${id}?fields[0]=slug`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    const j = await r.json();
    slug = j?.data?.attributes?.slug || j?.data?.slug || null;
  } catch {}
}

// Update loading message before redirect
loadingMessage.value = 'Changes saved! Redirecting...';

if (slug && process.client) {
  // full page navigation → guarantees header is fresh
  window.location.replace(`/${slug}`);
  return;
}

// final fallback
if (process.client) window.location.reload();
  // Loading stays true - page will navigate away
  } catch (err) {
    console.error("❌ submitForm error:", err);
    alert(err?.error?.message || "Update failed");
    loading.value = false;
  }
}
</script>

<style scoped>
/* Form Section Card */
.form-section {
  @apply rounded-2xl overflow-hidden;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: var(--fq-surface, #0B0C10);
  scroll-margin-top: calc(var(--header-height) + 4.25rem);
}

@media (min-width: 1024px) {
  .form-section {
    scroll-margin-top: calc(var(--header-height) + 1.5rem);
  }
}

.setup-kicker {
  margin: 0 0 0.2rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}

.payout-status {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 0.875rem;
  border: 1px solid;
}

@media (min-width: 640px) {
  .payout-status {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.payout-status--action {
  border-color: rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.08);
}

.payout-status--ready {
  border-color: rgba(52, 211, 153, 0.35);
  background: rgba(52, 211, 153, 0.08);
}

.payout-status__title {
  margin: 0;
  font-weight: 600;
  color: #fff;
}

.payout-status__body {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.68);
}

.payout-status__error {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #fca5a5;
}

.payout-status__action {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.625rem 1.125rem;
  border-radius: 0.75rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #059669, #0d9488);
  transition: filter 0.15s ease;
}

.payout-status__action:hover:not(:disabled) {
  filter: brightness(1.12);
}

.payout-status__action:focus-visible {
  outline: 2px solid #5eead4;
  outline-offset: 2px;
}

.payout-status__action:disabled {
  opacity: 0.6;
}

.setup-subhead {
  margin: 0 0 0.85rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
}

.setup-divider {
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.form-section-header {
  @apply flex items-center gap-4 p-5;
  border-bottom: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: var(--fq-surface-tinted, #0D0B10);
}

.form-section-icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0;
}

.form-section-title {
  @apply text-lg font-semibold text-white;
}

.form-section-subtitle {
  @apply text-sm text-white/50;
}

.form-section-content {
  @apply p-5 space-y-4;
}

/* Form Fields */
.form-field,
:deep(.form-field) {
  @apply space-y-2;
}

.form-label,
:deep(.form-label) {
  @apply block text-sm font-medium text-white/70;
}

.form-input,
:deep(.form-input) {
  @apply w-full px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none;
  appearance: none;
  -webkit-appearance: none;
  color-scheme: dark;
  background-color: #111217;
  border: 1px solid rgba(255, 255, 255, 0.07);
  transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}

.form-input:hover,
:deep(.form-input:hover) {
  border-color: rgba(255, 255, 255, 0.11);
}

.form-input:focus,
:deep(.form-input:focus) {
  background-color: #111217;
  border-color: rgba(57, 255, 20, 0.45);
  box-shadow: 0 0 0 1px rgba(57, 255, 20, 0.16);
}

.form-input:-webkit-autofill,
.form-input:-webkit-autofill:hover,
.form-input:-webkit-autofill:focus,
:deep(.form-input:-webkit-autofill),
:deep(.form-input:-webkit-autofill:hover),
:deep(.form-input:-webkit-autofill:focus) {
  -webkit-text-fill-color: #f5f5f6;
  caret-color: #f5f5f6;
  box-shadow: 0 0 0 1000px #111217 inset;
  -webkit-box-shadow: 0 0 0 1000px #111217 inset;
  transition: background-color 99999s ease-out;
}

.form-textarea,
:deep(.form-textarea) {
  @apply resize-none;
}

/* Legacy MDC styles for existing sections */
.mdc-text-field {
  position: relative;
  margin-bottom: 1.5rem;
  width: 100%;
}
.mdc-text-field__input {
  width: 100%;
  padding: 0.75rem 0.5rem;
  border: 1px solid #000;
  border-radius: 10px;
  outline: none;
}
.mdc-floating-label {
  position: absolute;
  top: 0.75rem;
  left: 0.5rem;
  background: white;
  padding: 0 0.2em;
  transition: transform 0.2s, color 0.2s;
}
.mdc-text-field__input:focus + .mdc-floating-label,
.mdc-text-field__input:not(:placeholder-shown) + .mdc-floating-label {
  transform: translateY(-1.5rem);
  color: #6200ee;
}
.mdc-line-ripple {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #6200ee;
  transform: scaleX(0);
  transition: transform 0.2s;
}
.mdc-text-field__input:focus ~ .mdc-line-ripple {
  transform: scaleX(1);
}

.mdc-button,
.styled-file-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.mdc-button {
  background: #2c2c2c;
  color: #fff;
  border: none;
  margin-top: 1rem;
}
.mdc-button:hover {
  background: #3700b3;
}
.styled-file-input {
  display: none;
}
.styled-file-label {
  background: #2c2c2c;
  color: #fff;
}
.styled-file-label:hover {
  background: #3700b3;
}
.styled-file-label.w-full {
  width: 100%;
  text-align: center;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
