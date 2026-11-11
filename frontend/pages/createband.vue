<template>
  <div class="min-h-screen pt-[var(--header-height)]">
    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-4 text-center px-6">
        <div class="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <div>
          <p class="text-white font-semibold text-lg">{{ loadingMessage }}</p>
          <p class="text-white/50 text-sm mt-1">Please wait while we set everything up...</p>
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
        <h1 class="text-3xl md:text-4xl font-bold text-white">Create your artist page</h1>
        <p class="text-white/60 mt-2">Faneqo walks you through the pieces fans will see.</p>
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
            <!-- Band Name -->
            <div class="form-field">
              <label for="band-name" class="form-label">Band Name <span class="text-red-400">*</span></label>
              <input
                type="text"
                id="band-name"
                v-model="bandName"
                class="form-input"
                placeholder="Enter your band name"
                required
              />
            </div>

            <!-- Band name in logo toggle -->
            <label for="isBandNameInLogo" class="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/[0.07] transition group">
              <div class="relative">
                <input
                  id="isBandNameInLogo"
                  type="checkbox"
                  v-model="isBandNameInLogo"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-500/50 transition-colors"></div>
                <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
              </div>
              <div>
                <div class="text-white font-medium">Band name is in logo</div>
                <div class="text-white/50 text-sm">Hide the text name if your logo already includes it</div>
              </div>
            </label>

            <!-- Genre -->
            <div class="form-field">
              <label for="genre" class="form-label">Genre</label>
              <input
                type="text"
                id="genre"
                v-model="genre"
                class="form-input"
                placeholder="e.g. Rock, Jazz, Electronic"
              />
            </div>

            <!-- Bio -->
            <div class="form-field">
              <label for="bio" class="form-label">Bio / Description <span class="text-red-400">*</span></label>
              <textarea
                id="bio"
                v-model="bio"
                class="form-input form-textarea"
                placeholder="Tell fans about your band..."
                maxlength="247"
                rows="4"
                required
              ></textarea>
              <div class="flex justify-end mt-2">
                <span 
                  class="text-sm"
                  :class="bio.length > max ? 'text-red-400' : 'text-white/40'"
                >
                  {{ bio.length }} / {{ max }}
                </span>
              </div>
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

            <div v-if="bandImgUrl" class="mb-4 flex justify-end">
              <button
                type="button"
                @click="removeBandImage"
                class="text-sm text-red-300 hover:text-red-200 transition"
              >
                Remove image
              </button>
            </div>

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
              v-if="bandImgUrl"
              class="mt-6"
              :image-url="bandImgUrl"
              :image-width="bandImgWidth"
              :image-height="bandImgHeight"
              :artist-name="bandName"
              v-model:phone="artistImagePhone"
              v-model:desktop="artistImageDesktop"
              @framing-change="onArtistFramingChange"
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
              :file-name="singlesongFileName"
              :file-fresh="!!singlesongFile"
              :file-key="songInputKey"
              id-prefix="create-music"
              @add-track="fetchSpotifyOembed"
              @change-spotify="changeSpotifyTrack"
              @clear-spotify="clearSpotifyEmbed"
              @clear-embed="removeEmbedSong"
              @remove-file="removeSingleSong"
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
              id-prefix="create-video"
              @add-video="addFeaturedVideo"
              @change-video="changeFeaturedVideo"
              @remove-video="clearSingleVideo"
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
                  <input type="text" id="websitelink" v-model="websitelink" class="form-input" placeholder="https://yourbandsite.com" />
                </div>
                <div class="form-field">
                  <label for="websitelinktext" class="form-label">Display Text</label>
                  <input type="text" id="websitelinktext" v-model="websitelinktext" class="form-input" placeholder="Visit our website" />
                </div>
                <div class="form-field md:col-span-2">
                  <label for="officialMerchUrl" class="form-label">Official Merch Store</label>
                  <input
                    type="url"
                    id="officialMerchUrl"
                    v-model="officialMerchUrl"
                    class="form-input"
                    :class="{ 'border-red-500/50': officialMerchUrlError }"
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
                <label :for="stream" class="form-label capitalize">{{ stream }}</label>
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
                <label :for="net" class="form-label capitalize">{{ net }}</label>
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
                  <label :for="hub" class="form-label capitalize">{{ hub }}</label>
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
            <PaymentsActivationPanel
              v-if="createActivation"
              ref="activationPanel"
              class="mb-4"
              :view="createActivation"
              :state="createEligibility?.state || ''"
              :artist-name="bandName"
              :artist-image="bandImgUrl"
              :busy="activationBusy"
              :error="activationError"
              :notice="activationNotice"
              :consent-terms="startProConsent.terms.value"
              :consent-notice="startProConsent.notice.value"
              @action="onActivationAction"
            />
            <div
              v-else-if="setupPayoutsAfterCreate"
              class="create-payout-next mb-4"
              role="status"
              data-testid="create-payout-note"
            >
              <p class="text-white text-sm font-semibold">Payout setup is next</p>
              <p class="text-white/70 text-sm mt-1">
                After we create your band, we'll take you to Stripe to finish. Your payment choices are kept.
              </p>
              <button type="button" class="create-payout-next__skip" @click="skipPayoutSetup">
                Skip for now
              </button>
            </div>
            <p v-else class="text-white/60 text-sm mb-4" data-testid="create-payout-note">
              {{ payoutPromptAnswered
                ? "Your choices are saved with your band. Payment buttons won't appear on your artist page until payouts are set up, which you can do any time from your band settings."
                : "Pick the options you want now. Fans see them once you set up payouts with Stripe." }}
            </p>
            <div class="space-y-3">
              <div
                v-for="btn in paymentButtons"
                :key="btn.key"
                class="p-4 rounded-xl border transition"
                :class="btn.enabled ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 bg-white/5'"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="font-medium" :class="paymentsLocked ? 'text-white/70' : 'text-white'">{{ btn.title }}</div>
                    <div v-if="btn.description" class="text-white/50 text-sm mt-1">
                      {{ btn.description }}
                    </div>
                  </div>
                  <svg v-if="paymentsLocked" class="w-4 h-4 mt-1 text-white/50 shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
                  <label class="relative inline-flex items-center cursor-pointer" :class="{ 'opacity-50': paymentsLocked && !btn.enabled }">
                    <input
                      :id="`paybtn-${btn.key}`"
                      type="checkbox"
                      v-model="btn.enabled"
                      class="sr-only peer"
                      :aria-label="toggleLabel(btn)"
                      @change="onPaymentToggle(btn)"
                      @click="guardLockedToggle($event, btn)"
                    />
                    <div class="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-purple-600 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-300 transition-colors"></div>
                    <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div v-if="btn.enabled" class="mt-4 flex items-center gap-3">
                  <span class="text-white/60">Min $</span>
                  <input
                    v-model.number="btn.minAmount"
                    type="number"
                    step="1"
                    min="0"
                    class="w-24 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:border-purple-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          v-if="hasEditorialShowcaseAccess"
          class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-white/70"
        >
          After your profile is created, you can configure the Editorial Showcase from the edit profile page.
        </div>

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
              Creating...
            </span>
            <span v-else>{{ setupPayoutsAfterCreate ? "Create Band & Set Up Payouts" : "Create Band Profile" }}</span>
          </button>
        </div>
      </form>
      <PayoutSetupPrompt
        :open="payoutPromptOpen"
        mode="create"
        @setup="choosePayoutSetup"
        @dismiss="declinePayoutPrompt"
      />
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  useStrapiClient,
  useStrapiUser,
  useStrapiToken,
  useRuntimeConfig,
} from "#imports";
import { normalizeLink, isValidHttpUrl, normalizeLinkOrNull } from "@/utils/normalizeLink";
import { useEditorialShowcaseAccess } from "@/composables/useEditorialShowcaseAccess";
import { useArtistSetupNav } from "@/composables/useArtistSetupNav";
import { refreshWorkspaceAccess } from "@/composables/useWorkspaceBand";
import { usePayoutSetup } from "@/composables/usePayoutSetup";
import PayoutSetupPrompt from "@/components/payments/PayoutSetupPrompt.vue";
import PaymentsActivationPanel from "@/components/payments/PaymentsActivationPanel.vue";
import { useBillingConsent } from "@/composables/useBillingConsent";
import { usePaymentActivation } from "@/composables/usePaymentActivation";
import { activationView, chargeCanShow, createPageEligibility } from "@/utils/payments/paymentActivation";
import { hasAnyFilled, visibleArtistSetupSections } from "@/utils/bands/artistSetupSections";
import { createBandErrorMessage } from "@/utils/bands/createBandError";
import {
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
import {
  readImageDimensions,
  validateArtistProfileImageFile,
} from "@/utils/media/artistImage";
import {
  buildCyberedFramingSavePayload,
  getDefaultCyberedSurfaceFraming,
  resetCyberedSurfaceCrop,
} from "@/utils/media/cyberedArtistFraming";

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const client = useStrapiClient();
const user = useStrapiUser();
const token = useStrapiToken();

const loading = ref(false);
const loadingMessage = ref('Creating your band...');
const isBandNameInLogo = ref(false);

// Payout setup can't start until the band exists: choosing it here only
// queues it, and submitForm opens Stripe once the band is created.
const { openPayoutSetup, onBackFromStripe } = usePayoutSetup();
const payoutPromptOpen = ref(false);
const payoutPromptAnswered = ref(false);
const setupPayoutsAfterCreate = ref(false);

// ── Payments panel. Shown only once the paid requirement is enforced; the band
// doesn't exist yet, so the view comes from the account (the server decides at checkout).
const { startProUrl, fetchBillingSubscription } = usePaymentActivation();
// The account's Stripe subscription, so charges are quoted at the price it pays (undefined = unknown).
const billingSubscription = ref(undefined);
const activationPanel = ref(null);
const activationBusy = ref(null);
const activationError = ref("");
const activationNotice = ref(null);
const keptTrial = ref(false);
// Set by Start Pro: submitForm creates the band once, then opens checkout for it.
const startProAfterCreate = ref(false);
const createEligibility = computed(() =>
  createPageEligibility(user.value, { enforced: String(config.public.paymentsRequirePaid || "") === "enforce" })
);
const createActivation = computed(() =>
  activationView(createEligibility.value, { keptTrial: keptTrial.value, subscription: billingSubscription.value })
);
// Billing A: the server's terms for Start Pro and the consent given in the panel.
const startProConsent = useBillingConsent("start_pro");
const pendingConsent = ref(null);

// Read the price only when the panel can show a paying button (paid enforcement on).
watch(
  createEligibility,
  async (answer) => {
    if (process.client && answer && chargeCanShow(answer) && billingSubscription.value === undefined) {
      const [sub] = await Promise.all([fetchBillingSubscription(), startProConsent.load()]);
      billingSubscription.value = sub;
    }
  },
  { immediate: true }
);
const paymentsLocked = computed(() => Boolean(createActivation.value?.rowsLocked));
const toggleLabel = (btn) =>
  paymentsLocked.value ? `${btn.title} unlocks with Faneqo Pro` : `Show ${btn.title} on your artist page`;

function onActivationAction(action, extra = {}) {
  activationError.value = "";
  if (action === "start_pro" || action === "update_payment") {
    pendingConsent.value = extra?.consent || null;
    activationBusy.value = "start_pro";
    startProAfterCreate.value = true;
    setupPayoutsAfterCreate.value = false;
    submitForm();
    return;
  }
  if (action === "setup_payouts") {
    activationBusy.value = "setup_payouts";
    setupPayoutsAfterCreate.value = true;
    submitForm();
    return;
  }
  if (action === "keep_trial") {
    keptTrial.value = true;
    activationNotice.value = { tone: "neutral", text: "Your free trial continues. Payment options unlock whenever you start Pro." };
  }
}

// A validation stop or failed create ends any busy state (and the queued checkout).
watch(loading, (on) => {
  if (!on) {
    activationBusy.value = null;
    startProAfterCreate.value = false;
  }
});

// While payments need Pro, an option can't be switched ON: the click is cancelled
// (the choice is never rewritten) and focus moves to Start Pro.
function guardLockedToggle(event, btn) {
  if (!paymentsLocked.value || btn.enabled) return;
  event.preventDefault();
  keptTrial.value = false;
  activationPanel.value?.focusPrimary();
}

function onPaymentToggle(btn) {
  if (createActivation.value) {
    if (!btn.enabled) return; // switching an option off is always allowed
    // Before payouts are live the choice is kept; point at the action that makes it count.
    activationPanel.value?.focusPrimary();
    return;
  }
  if (btn.enabled && !payoutPromptAnswered.value) payoutPromptOpen.value = true;
}

/** The band exists now: open checkout for it; back or cancel lands on its editor. */
async function openStartProForNewBand(bandId) {
  createdBandEditor.value = `/editband/${bandId}?billing=canceled`;
  window.history.replaceState(window.history.state, "", createdBandEditor.value);
  loadingMessage.value = "Artist page created! Opening secure checkout…";
  try {
    window.location.assign(await startProUrl(bandId, pendingConsent.value));
  } catch {
    // Nothing was charged; the editor shows the server's terms again for consent.
    window.location.assign(`/editband/${bandId}?billing=error`);
  }
}
function choosePayoutSetup() {
  payoutPromptOpen.value = false;
  payoutPromptAnswered.value = true;
  setupPayoutsAfterCreate.value = true;
}
function declinePayoutPrompt() {
  payoutPromptOpen.value = false;
  payoutPromptAnswered.value = true;
}
function skipPayoutSetup() {
  setupPayoutsAfterCreate.value = false;
}

// Once the band exists this page must not come back (it would create it again).
const createdBandEditor = ref("");
onBackFromStripe(() => {
  if (createdBandEditor.value) window.location.replace(createdBandEditor.value);
  else loading.value = false;
});

async function openPayoutSetupForNewBand(bandId) {
  createdBandEditor.value = `/editband/${bandId}?payouts=return`;
  // Back from Stripe lands on the new band's editor, not this form.
  window.history.replaceState(window.history.state, "", createdBandEditor.value);
  loadingMessage.value = "Band created! Opening Stripe…";
  try {
    await openPayoutSetup(bandId, "editband");
  } catch {
    window.location.assign(`/editband/${bandId}?payouts=error`);
  }
}

// Always use smartlink (cybered) template

// Band basics
const bandName = ref("");
const genre = ref("");
const bio = ref("");
const bandImg = ref(null);
const bandImgUrl = ref(null);
const bandImgWidth = ref(null);
const bandImgHeight = ref(null);
const bandImgError = ref("");
const artistImagePhone = ref(getDefaultCyberedSurfaceFraming());
const artistImageDesktop = ref(getDefaultCyberedSurfaceFraming());
const phoneFramingDirty = ref(false);
const desktopFramingDirty = ref(false);
const websitelink = ref("");
const websitelinktext = ref("");
const officialMerchUrl = ref("");
const officialMerchUrlError = ref("");

const { hasAccess: hasEditorialShowcaseAccess } = useEditorialShowcaseAccess();

// Cybered image position settings
const imageSectionDirty = computed(() => phoneFramingDirty.value || desktopFramingDirty.value);
const max = 247;

// Custom Buttons
const customButtons = ref([]);
const customButtonIconFiles = ref({});

function handleCustomButtonIconUpload({ index, file }) {
  customButtonIconFiles.value[index] = file;
}

const bandImgInput = ref(null);
const singleSongInput = ref(null);

// KEY to reset the file input
const songInputKey = ref(0);

// Remove band image
function removeBandImage() {
  bandImg.value = null;
  bandImgUrl.value = null;
  bandImgWidth.value = null;
  bandImgHeight.value = null;
  bandImgError.value = "";
  applyNewImagePresentation();
  if (bandImgInput.value) bandImgInput.value.value = "";
}

// Remove uploaded song
function removeSingleSong() {

  singlesongFileName.value = "";
  singlesongTitle.value = "";
  singlesongEmbedHtml.value = "";
  singlesongFile.value = null;
  songInputKey.value++; // reset <input type="file">
}

// Remove embed song
function removeEmbedSong() {
  singlesongEmbedHtml.value = "";
  singlesongTitle.value = "";
}


function clearBandImage() {
  bandImg.value = null;
  bandImgUrl.value = null;
  bandImgWidth.value = null;
  bandImgHeight.value = null;
  bandImgError.value = "";
  if (bandImgInput.value) {
    bandImgInput.value.value = "";
  }
}

function clearSingleSong() {
  singlesongTitle.value = "";
  singlesongType.value = "embed";
  singlesongPlatform.value = "spotify";
  singlesongFile.value = null;
  singlesongFileName.value = "";
  singlesongEmbedHtml.value = "";
  if (singleSongInput.value) {
    singleSongInput.value.value = "";
  }
}

// Members
const members = ref([
  { name: "", instrument: "", image: null, imageUrl: null },
]);
function addMember() {
  members.value.push({ name: "", instrument: "", image: null, imageUrl: null });
}
function removeMember(idx) {
  members.value.splice(idx, 1);
}
function handleMemberImageUpload(e, idx) {
  const f = e.target.files[0];
  members.value[idx].image = f;
  members.value[idx].imageUrl = URL.createObjectURL(f);
}

// Social + Streaming + Event Hubs
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

// Featured song/video — create defaults to Add Track / Spotify
const singlesongType = ref("embed"); // 'upload' | 'embed'
const singlesongTitle = ref("");
const singlesongFile = ref(null);
const singlesongFileName = ref("");
const singlesongEmbedHtml = ref(""); // iframe or YouTube URL
const singlesongPlatform = ref("spotify");

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

const singlevideoYoutubeUrl = ref("");
const singlevideoTitle = ref("");
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

function clearSingleVideo() {
  singlevideoTitle.value = "";
  singlevideoYoutubeUrl.value = "";
  videoAdded.value = false;
  videoAddError.value = "";
}

const paymentButtons = ref([
  {
    key: "pay_entry",
    title: "Pay Entry",
    description: "Door entry for tonight’s show",
    enabled: false,
    minAmount: 5,
  },
  // {
  //   key: "tip_band",
  //   title: "Tip the Band",
  //   description: "Thanks for the support ❤️",
  //   enabled: false,
  //   minAmount: 5,
  // },
  // {
  //   key: "pay_merch",
  //   title: "Pay for Merch",
  //   description: "Shirts, posters, vinyl, etc.",
  //   enabled: false,
  //   minAmount: 5,
  // },
  {
    key: "support_band",
    title: "Support the Band",
    description: "Help us keep making music",
    enabled: false,
    minAmount: 5,
  },
  // {
  //   key: "help_get_home",
  //   title: "Help Us Get Home",
  //   description: "Gas, food, and late nights on the road",
  //   enabled: false,
  //   minAmount: 5,
  // },
  // {
  //   key: "after_show_support",
  //   title: "After-Show Support",
  //   description: "Thanks for coming out tonight ❤️",
  //   enabled: false,
  //   minAmount: 5,
  // },
  {
    key: "merch_table",
    title: "Merch Table Payment",
    description: "Scan at the merch table and enter your total.",
    enabled: false,
    minAmount: 1,
  },
]);

const errorSectionId = ref("");
const setupSections = computed(() =>
  visibleArtistSetupSections({ isEdit: false, hasEditorial: false })
);

function getSetupState() {
  return {
    name: bandName.value,
    bio: bio.value,
    hasImage: Boolean(bandImg.value),
    hasFeaturedMusic: featuredMusicIsReady({
      mode: singlesongType.value,
      platform: singlesongPlatform.value,
      hasFile: Boolean(singlesongFile.value),
      spotifyPreview: spotifyOembedData.value,
      embedHtml: singlesongEmbedHtml.value,
    }),
    hasVideo: Boolean(extractYoutubeId(singlevideoYoutubeUrl.value) || singlevideoTitle.value.trim()),
    hasLinks:
      hasAnyFilled([websitelink.value, officialMerchUrl.value, contacts.value]) ||
      hasAnyFilled(customButtons.value),
    hasStreaming: hasAnyFilled(streaming.value),
    hasSocial: hasAnyFilled(social.value) || hasAnyFilled(eventHubs.value),
    hasSupport: paymentButtons.value.some((btn) => btn.enabled),
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
  if (id === "band-name" || id === "bio") {
    markError("setup-details", id);
  }
}

// Helpers
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
  bandImg.value = file;
  bandImgUrl.value = URL.createObjectURL(file);
  applyNewImagePresentation();
  const dimensions = await readImageDimensions(file);
  bandImgWidth.value = dimensions.width;
  bandImgHeight.value = dimensions.height;
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
  const f = e.target.files[0];
  singlesongFile.value = f;
  singlesongFileName.value = f?.name || "";
}

// Optional: preload user bands
onMounted(async () => {
  try {
    await client("/bands", {
      params: {
        filters: { users_permissions_user: { id: user.value.id } },
        populate: ["users_permissions_user"],
      },
    });
  } catch (e) {
    console.error(e);
  }
});

async function submitForm() {
  loading.value = true;
  loadingMessage.value = 'Creating your band...';
  errorSectionId.value = "";
  try {
    if (!bandName.value.trim() || !bio.value.trim()) {
      loading.value = false;
      markError("setup-details", !bandName.value.trim() ? "band-name" : "bio");
      return;
    }

    if (!validateOfficialMerchUrl()) {
      loading.value = false;
      markError("setup-links", "officialMerchUrl");
      return;
    }

    if (singlesongType.value === "embed") {
      if (singlesongPlatform.value === "spotify") {
        if (spotifyUrlInput.value.trim() && !spotifyOembedData.value) {
          await fetchSpotifyOembed();
        }
        if (spotifyUrlInput.value.trim() && !spotifyOembedData.value) {
          loading.value = false;
          markError("setup-music", "create-music-spotify");
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
          markError("setup-music", "create-music-embed");
          return;
        }
      }
    }

    // 1) Build JSON payload
    const payload = {
      name: bandName.value,
      isBandNameInLogo: isBandNameInLogo.value,
      pageStyle: 'smartlink',
      genre: genre.value,
      bio: bio.value,
      websitelink: normalizeLink(websitelink.value) || null,
      websitelinktext: websitelinktext.value || null,
      officialMerchUrl: normalizeLinkOrNull(officialMerchUrl.value),
      users_permissions_user: user.value.id,
      ...buildCyberedFramingSavePayload({
        phone: artistImagePhone.value,
        desktop: artistImageDesktop.value,
        phoneDirty: true,
        desktopDirty: true,
      }),
      paymentButtons: paymentButtons.value.map((b) => ({
        key: b.key,
        enabled: b.enabled === true,
        pricingMode: "min",
        minAmount: Number(b.minAmount || 5),
      })),

      // members
      members: members.value.map((m) => ({
        name: m.name,
        instrument: m.instrument,
      })),

      // social (normalized)
      ...Object.fromEntries(
        Object.entries(social.value).map(([key, val]) => [
          key,
          normalizeLink(val),
        ])
      ),

      // streaming (normalized)
      ...Object.fromEntries(
        Object.entries(streaming.value).map(([key, val]) => [
          key,
          normalizeLink(val),
        ])
      ),

      // event hubs (normalized)
      ...Object.fromEntries(
        Object.entries(eventHubs.value).map(([key, val]) => [
          key,
          normalizeLink(val),
        ])
      ),

      // contact / booking
      bookingEmail: contacts.value.bookingEmail?.trim() || "",
      managementEmail: contacts.value.managementEmail?.trim() || "",
      pressEmail: contacts.value.pressEmail?.trim() || "",
      bookingAgent: contacts.value.bookingAgent?.trim() || "",
      labelUrl: contacts.value.labelUrl?.trim() || "",
      labelName: contacts.value.labelName?.trim() || "",

      // featured song — embedHtml OR upload OR Spotify oEmbed
      singlesong: (() => {
        const isEmbed = singlesongType.value === "embed";
        const isSpotify = isEmbed && singlesongPlatform.value === "spotify";
        return {
          title: singlesongTitle.value || "",
          isEmbed,
          platform: isEmbed ? singlesongPlatform.value || null : null,
          // For non-Spotify embeds, use embedHtml
          embedHtml: isEmbed && !isSpotify ? (singlesongEmbedHtml.value || "").trim() : null,
          // For Spotify, use oEmbed data
          spotifyUrl: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.spotifyUrl : null,
          spotifyOembedTitle: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.title : null,
          spotifyOembedThumbnailUrl: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.thumbnailUrl : null,
          spotifyOembedType: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.type : null,
          spotifyOembedHtml: isSpotify && spotifyOembedData.value ? spotifyOembedData.value.html : null,
        };
      })(),

      // featured video
      singlevideo: {
        youtubeid: extractYoutubeId(singlevideoYoutubeUrl.value) || "",
        title: singlevideoTitle.value || "",
      },

      // Custom buttons
      customButtons: customButtons.value.map(btn => ({
        title: btn.title || '',
        subtitle: btn.subtitle || '',
        url: btn.url || '',
        iconName: btn.iconName || '',
        customIcon: null, // Will be updated after upload
      })),
    };

    // 2) Wrap in FormData for file uploads
    const fd = new FormData();
    fd.append("data", JSON.stringify(payload));

    if (bandImg.value) {
      fd.append("files.bandImg", bandImg.value);
    }
    members.value.forEach((m, i) => {
      if (m.image) {
        fd.append(`files.members.${i}.image`, m.image);
      }
    });
    if (singlesongType.value === "upload" && singlesongFile.value) {
      fd.append("files.singlesong.song", singlesongFile.value);
    }

    // 3) Create band
    const res = await fetch(`${config.public.strapiUrl}/api/bands`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.value}` },
      body: fd,
    });
    const json = await res.json();
    if (!res.ok) throw json;

    // Payout setup was chosen: Stripe now, back to this band's editor after
    // (a full page load, so workspace access is fetched fresh there).
    const newBandId = json.data?.id;
    if (startProAfterCreate.value && newBandId) {
      await openStartProForNewBand(newBandId);
      return;
    }
    if (setupPayoutsAfterCreate.value && newBandId) {
      await openPayoutSetupForNewBand(newBandId);
      return;
    }

    // 4) Redirect - keep loading true until navigation completes.
    // The artist page is /:bandSlug. There is no route named "slug".
    loadingMessage.value = 'Band created! Redirecting...';
    const slug = json.data?.attributes?.slug || json.data?.slug;
    const target = slug ? `/${slug}` : "/dashboard";
    // The account just gained artist access without its user or token
    // changing, so the cached answer is stale. Settle it before the artist
    // page renders, or the header shows fan navigation to the new artist.
    try {
      await refreshWorkspaceAccess();
    } catch (accessErr) {
      console.warn("createBand: workspace access refresh failed", accessErr);
    }
    try {
      await router.push(target);
    } catch (navErr) {
      console.error("createBand redirect failed:", navErr);
      window.location.assign(target);
    }
  } catch (err) {
    console.error("❌ createBand error:", err);
    alert(createBandErrorMessage(err));
    loading.value = false;
  }
}
</script>

<style scoped>
.create-payout-next {
  padding: 0.875rem 1rem;
  border-radius: 0.875rem;
  border: 1px solid rgba(52, 211, 153, 0.35);
  background: rgba(52, 211, 153, 0.08);
}
.create-payout-next__skip {
  margin-top: 0.5rem;
  min-height: 36px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.create-payout-next__skip:focus-visible {
  outline: 2px solid #5eead4;
  outline-offset: 2px;
  border-radius: 4px;
}

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
