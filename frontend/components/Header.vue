<template>
  <header
    class="text-white fixed top-0 left-0 right-0 z-40"
    :class="[
      isAppHeader ? 'fq-app-header' : 'bg-black shadow-lg',
      { 'hidden lg:block': hideOnMobileComposer },
    ]"
    style="height: var(--header-height)"
  >
    <!-- <BackButton
    v-if="showBack"
    defaultRoute="/dashboard"
    class="absolute left-4 top-1/2 transform -translate-y-1/2 z-50"
  /> -->

    <div
      class="header-bar mx-auto flex h-full max-w-5xl items-center"
    >
    <NuxtLink :to="logoTo" class="header-logo shrink-0">
      <img src="/faneqo-wordmark-editorial.png?v=2" alt="Faneqo" class="header-logo__mark" width="3398" height="901" />
    </NuxtLink>

      <button
        type="button"
        class="header-search header-search--mobile"
        :aria-label="searchLabel"
        @click="openSearch"
      >
        <svg class="header-search__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="header-search__label">{{ searchLabel }}</span>
      </button>

      <nav class="z-50 hidden md:ml-auto md:flex items-center space-x-1">
        <NuxtLink
          v-for="link in desktopPrimaryLinks"
          :key="`${link.to}:${link.label}`"
          :to="link.to"
          class="nav-link"
        >
          {{ link.label }}
        </NuxtLink>

        <div class="w-px h-5 bg-white/20 mx-2"></div>

        <button
          type="button"
          class="header-search header-search--desktop"
          title="Search Artists (⌘K)"
          :aria-label="searchLabel"
          @click="openSearch"
        >
          <svg class="header-search__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="header-search__label">{{ searchLabel }}</span>
          <kbd class="header-search__kbd">⌘K</kbd>
        </button>

        <NuxtLink v-if="showSavedIcon" to="/saved" class="nav-icon" title="Saved">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <client-only>
            <span v-if="savedCount" class="nav-icon-badge">{{ savedCount }}</span>
          </client-only>
        </NuxtLink>
        <NuxtLink v-if="(isFanHeader || showFanPublicChrome) && user" to="/fan/profile" class="nav-icon" title="Profile">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </NuxtLink>
        <NuxtLink v-if="showArtistChrome && user" to="/account" class="nav-icon" title="Account">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </NuxtLink>
        <button v-if="user" @click="logoutUser" class="nav-icon" title="Logout">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </nav>

      <button 
        type="button"
        @click="toggleMenu" 
        class="header-menu md:hidden focus:outline-none flex items-center justify-center"
        :aria-label="isMenuOpen ? 'Close menu' : 'Open menu'"
      >
        <div class="hamburger-icon" :class="{ 'is-open': isMenuOpen }">
          <span class="hamburger-line hamburger-line-1"></span>
          <span class="hamburger-line hamburger-line-2"></span>
          <span class="hamburger-line hamburger-line-3"></span>
        </div>
      </button>
    </div>

    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <nav
        v-if="isMenuOpen"
        class="fixed left-0 w-full bg-gradient-to-b from-black via-black to-gray-900 text-white md:hidden z-50 flex flex-col overflow-hidden"
        style="
          top: var(--header-height);
          height: calc(100vh - var(--header-height));
        "
      >
        <!-- Decorative gradient orbs -->
        <div class="absolute top-20 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-20 left-0 w-48 h-48 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative flex-1 min-h-0 overflow-y-auto">
        <div class="relative flex flex-col px-5 pt-6 pb-4">
          <!-- Logged-in fan on a public page: header hamburger is the way home. -->
          <div v-if="showFanPublicChrome" class="space-y-0.5">
            <NuxtLink
              to="/fan"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span>Artists</span>
            </NuxtLink>
            <NuxtLink
              to="/fan/messages"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <span>Messages</span>
            </NuxtLink>
            <NuxtLink
              to="/fan/passport"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </span>
              <span>Passport</span>
            </NuxtLink>
          </div>
          <div v-if="showTemporaryDeckLink" class="space-y-0.5">
            <NuxtLink
              to="/presentation"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <span>Presentation</span>
            </NuxtLink>
          </div>
          <div v-if="showPublicGuestChrome" class="space-y-0.5">
            <NuxtLink
              to="/"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              <span>Home</span>
            </NuxtLink>
          </div>
          <div v-if="showArtistChrome" class="space-y-0.5">
            <NuxtLink
              v-if="!user"
              to="/"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              <span>Home</span>
            </NuxtLink>

            <NuxtLink
              v-if="user"
              to="/dashboard"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </span>
              <span>Dashboard</span>
            </NuxtLink>

            <NuxtLink
              v-if="showAdsStudio"
              to="/ads"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span>Ads</span>
            </NuxtLink>

            <NuxtLink
              v-if="user"
              :to="messagesHomePath"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <span>Messages</span>
            </NuxtLink>

            <NuxtLink
              v-if="user && userSlug"
              :to="galleriesPath"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm0 10l4-4 4 4 2-2 6 6M15 8h.01" />
                </svg>
              </span>
              <span>Galleries</span>
            </NuxtLink>

            <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
            <!--
            <NuxtLink
              v-if="user && userSlug"
              to="/updates"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span>Updates</span>
            </NuxtLink>
            -->

            <client-only>
              <NuxtLink
                v-if="user && userSlug"
                :to="`/${userSlug}`"
                @click="toggleMenu"
                class="mobile-nav-item mobile-nav-item--primary"
              >
                <span class="mobile-nav-icon">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </span>
                <span>My Artist Page</span>
              </NuxtLink>
            </client-only>

            <NuxtLink
              to="/saved"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </span>
              <span>Saved</span>
              <client-only>
                <span
                  v-if="savedCount"
                  class="ml-auto bg-white/10 text-white/70 text-xs font-semibold px-2 py-0.5 rounded-full"
                >{{ savedCount }}</span>
              </client-only>
            </NuxtLink>
          </div>

          <!-- Fan / fan-auth hamburger: secondary actions only. Bottom nav owns tabs. -->
          <div v-if="isFanHeader || isFanAuthHeader" class="space-y-0.5">
            <NuxtLink
              v-if="isFanAuthHeader && !user"
              to="/"
              @click="toggleMenu"
              class="mobile-nav-item mobile-nav-item--primary"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              <span>Home</span>
            </NuxtLink>
            <button
              type="button"
              class="mobile-nav-item mobile-nav-item--primary w-full text-left"
              @click="openSearchFromMenu"
            >
              <span class="mobile-nav-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <span>Search artists</span>
            </button>
          </div>

          <!-- Account & Help -->
          <div class="mt-6 pt-5 border-t border-white/10">
            <p class="mobile-nav-section-label">{{ showArtistChrome || showPublicGuestChrome || showFanPublicChrome ? 'Account & Help' : 'Help' }}</p>
            <div class="mt-1.5 space-y-0.5">
              <NuxtLink
                v-if="user && showFanPublicChrome"
                to="/fan/profile"
                @click="toggleMenu"
                class="mobile-nav-item mobile-nav-item--secondary"
              >
                <span class="mobile-nav-icon mobile-nav-icon--quiet">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <span>Profile</span>
              </NuxtLink>
              <NuxtLink
                v-if="user && showArtistChrome"
                to="/account"
                @click="toggleMenu"
                class="mobile-nav-item mobile-nav-item--secondary"
              >
                <span class="mobile-nav-icon mobile-nav-icon--quiet">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <span>Account</span>
              </NuxtLink>

              <NuxtLink
                v-if="!user && (showArtistChrome || showPublicGuestChrome)"
                :to="guestLoginTo"
                @click="toggleMenu"
                class="mobile-nav-item mobile-nav-item--secondary"
              >
                <span class="mobile-nav-icon mobile-nav-icon--quiet">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span>Login</span>
              </NuxtLink>

              <NuxtLink
                v-if="!user && isFanAuthHeader"
                to="/fan/login"
                @click="toggleMenu"
                class="mobile-nav-item mobile-nav-item--secondary"
              >
                <span class="mobile-nav-icon mobile-nav-icon--quiet">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span>Login</span>
              </NuxtLink>

              <NuxtLink
                to="/contact"
                @click="toggleMenu"
                class="mobile-nav-item mobile-nav-item--secondary"
              >
                <span class="mobile-nav-icon mobile-nav-icon--quiet">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <span>Contact</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Video Mode Toggles (marketer only, artist/public chrome) -->
          <div v-if="isMarketerUser && (showArtistChrome || isPublicHeader)" class="mt-6 pt-5 border-t border-white/10">
            <p class="mobile-nav-section-label">Video Mode</p>
            <div class="mt-2 space-y-2 px-0.5">
              <div class="flex items-center justify-between px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  <span class="text-white/80 text-sm font-medium">Metrics</span>
                </div>
                <button
                  type="button"
                  @click="hideMetrics = !hideMetrics"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  :class="hideMetrics ? 'bg-white/10' : 'bg-white/25'"
                  :aria-pressed="!hideMetrics"
                  aria-label="Toggle metrics"
                >
                  <span
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    :class="hideMetrics ? 'translate-x-0' : 'translate-x-5'"
                  ></span>
                </button>
              </div>
              <div class="flex items-center justify-between px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </span>
                  <span class="text-white/80 text-sm font-medium">Recap</span>
                </div>
                <button
                  type="button"
                  @click="showDemoRecap = !showDemoRecap"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  :class="showDemoRecap ? 'bg-white/25' : 'bg-white/10'"
                  :aria-pressed="showDemoRecap"
                  aria-label="Toggle recap demo"
                >
                  <span
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    :class="showDemoRecap ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </div>
            </div>
          </div>

          <!-- App install - hidden once running as an installed PWA -->
          <div v-if="!isPwa" class="mt-6">
            <button
              type="button"
              class="install-card"
              :disabled="installing"
              @click="handleInstallApp"
            >
              <span class="install-glow"></span>

              <img src="/icons/faneqo-icon-192.png" class="install-icon" alt="" />

              <span class="install-copy">
                <span class="install-title">Install the Faneqo App</span>
                <span class="install-sub">Home screen access. Faster at shows.</span>
              </span>

              <span class="install-cta">
                <svg v-if="installing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <template v-else>
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                  </svg>
                  <span>Install</span>
                </template>
              </span>
            </button>
          </div>
        </div>
        </div>

        <!--
          Pinned footer: Log out (logged-in) or Get Started Free (logged-out).
          Separated from ordinary destinations so session exit doesn't compete.
        -->
        <div
          v-if="user"
          class="relative flex-shrink-0 px-5 pt-3 border-t border-white/10 bg-black/90 backdrop-blur-sm"
          style="padding-bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px))"
        >
          <button
            type="button"
            class="mobile-nav-logout w-full"
            @click="logoutUserMobile"
          >
            <span class="mobile-nav-icon mobile-nav-icon--logout">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            <span>Log out</span>
          </button>
        </div>
        <div
          v-else-if="showArtistChrome || showPublicGuestChrome"
          class="relative flex-shrink-0 px-5 pt-4 border-t border-white/10 bg-black/90 backdrop-blur-sm"
          style="padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px))"
        >
          <NuxtLink :to="guestSignupTo" @click="toggleMenu" class="mobile-nav-item-cta">
            <span>Get Started Free</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </nav>
    </Transition>
      <!-- Band Search Modal -->
    <client-only>
      <BandSearchModal
        :is-open="isSearchOpen"
        :heading="isFanHeader || isFanAuthHeader ? 'Search artists' : undefined"
        :lead="isFanHeader || isFanAuthHeader ? 'Find an artist you follow.' : undefined"
        :search-placeholder="isFanHeader || isFanAuthHeader ? 'Search artists...' : undefined"
        @close="isSearchOpen = false"
        @select="onBandSelect"
      />
    </client-only>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStrapiUser, useStrapiAuth, useStrapiToken } from '#imports'
import { useRouter } from 'vue-router'
import { useAsyncData } from '#app'
import { useSavedBands } from '@/composables/useSavedBands'
import { useVideoModeToggles } from '~/composables/useVideoModeToggles'
import { usePwa } from '~/composables/usePwa'
import { useFanProfile } from '~/composables/useFanProfile'
import { isImmersiveMessagesPath } from '~/utils/messages/messageChrome'
import { isFaneqoAppPath, isImmersiveShowRecapPath } from '~/utils/ui/appSurface'
import { resolveWorkspaceBand, withActiveBand } from '~/utils/ui/artistWorkspace'
import { useWorkspaceBand } from '~/composables/useWorkspaceBand'
import {
  APP_SHELL,
  headerLogoTo,
  headerLogoutTo,
  headerPrimaryLinks,
  headerSearchCopy,
  headerShowsArtistWorkspaceNav,
  headerShowsFanPublicNav,
  headerShowsPublicGuestNav,
  headerShowsTemporaryDeckLink,
  resolveAppShellContext,
} from '~/utils/ui/appShell'
import { withAuthReturnTo } from '~/utils/auth/safeAuthReturnTo'
import { canAccessAdsStudio } from '~/utils/ads/access.js'

const user = useStrapiUser()
const token = useStrapiToken()
const { logout } = useStrapiAuth()
const { reset: resetFanProfile } = useFanProfile()
const router = useRouter()
const route = useRoute()
const hideOnMobileComposer = computed(() =>
  isImmersiveMessagesPath(route.path) || isImmersiveShowRecapPath(route.path)
)
const isAppHeader = computed(() => isFaneqoAppPath(route.path))
const headerContext = computed(() => resolveAppShellContext(route.path))
const isFanHeader = computed(() => headerContext.value === APP_SHELL.FAN)
const isFanAuthHeader = computed(() => headerContext.value === APP_SHELL.FAN_AUTH)
const isPublicHeader = computed(() => headerContext.value === APP_SHELL.PUBLIC)
const showPublicGuestChrome = computed(() =>
  headerShowsPublicGuestNav(route.path, { hasUser: !!user.value })
)
const showTemporaryDeckLink = computed(() => headerShowsTemporaryDeckLink(route.path))
const logoTo = computed(() => headerLogoTo(route.path))
const searchLabel = computed(() => headerSearchCopy(route.path))

const { count: savedCount } = useSavedBands()
const { hideMetrics, showDemoRecap } = useVideoModeToggles()
const VIDEO_MODE_EMAILS = ['shannonmorgello@gmail.com']
const isMarketerUser = computed(() => {
  return !!user.value?.email && VIDEO_MODE_EMAILS.includes(user.value.email.toLowerCase())
})

// Confirmed artist/band capability — same /api/me/band-access truth as Dashboard.
// Client-only: /api/me/band-access needs the existing JWT. SSR without a token
// would cache an empty payload and strand an already-logged-in artist until
// user.id changed (logout/login). Watch token so a hydrated session is enough.
// Band access is fetched by useWorkspaceBand and only there. Declaring a
// second fetch under the same cache key would leave Nuxt holding whichever
// handler registered first, so the header and the pages could disagree.
const {
  access: bandAccess,
  accessResolved: bandAccessResolved,
  refreshAccess: refreshBandAccess,
  resolved: activeWorkspace,
} = useWorkspaceBand()

// Capability is "has any artist access" and must not depend on which band is
// selected — otherwise a multi-band artist on the picker would get fan chrome.
// Only the answer fetched for the account signed in now counts. Until it
// arrives, a signed-in user's capability is unknown: public pages show no
// primary links rather than guessing fan links for a new or switched artist.
const workspaceBand = computed(() =>
  bandAccessResolved.value ? resolveWorkspaceBand(bandAccess.value) : null
)
const hasArtistWorkspaceAccess = computed(() => !!workspaceBand.value)
const capabilityPending = computed(() => !!user.value && !bandAccessResolved.value)

// Scope is a separate question, already answered by the helper above: which
// band do these links actually open? A multi-band artist with no usable hint
// gets no artist-slug links rather than Band A's.
const showFanPublicChrome = computed(() =>
  !capabilityPending.value && headerShowsFanPublicNav(route.path, {
    hasUser: !!user.value,
    hasArtistWorkspaceAccess: hasArtistWorkspaceAccess.value,
  })
)
const userSlug = computed(() =>
  bandAccessResolved.value ? activeWorkspace.value.band?.slug || null : null
)
const showArtistChrome = computed(() =>
  headerShowsArtistWorkspaceNav(route.path, {
    hasArtistWorkspaceAccess: hasArtistWorkspaceAccess.value,
  })
)
const showSavedIcon = computed(() => showArtistChrome.value)

const messagesHomePath = computed(() =>
  (hasArtistWorkspaceAccess.value || userSlug.value)
    ? withActiveBand('/messages', activeWorkspace.value)
    : '/fan/messages'
)
const galleriesPath = computed(() => withActiveBand('/galleries', activeWorkspace.value))
const showAdsStudio = computed(() =>
  canAccessAdsStudio(user.value?.email, import.meta.dev)
)
const desktopPrimaryLinks = computed(() => {
  if (isPublicHeader.value && capabilityPending.value) return []
  const links = headerPrimaryLinks(route.path, {
    hasUser: !!user.value,
    userSlug: userSlug.value,
    hasArtistWorkspaceAccess: hasArtistWorkspaceAccess.value,
    artistSlug: userSlug.value,
  }).map((link) => ({
    ...link,
    to: withAuthReturnTo(withActiveBand(link.to, activeWorkspace.value), route.fullPath),
  }))
  if (showAdsStudio.value) links.push({ to: '/ads', label: 'Ads' })
  return links
})
const guestLoginTo = computed(() => withAuthReturnTo('/login', route.fullPath))
const guestSignupTo = computed(() => withAuthReturnTo('/signup', route.fullPath))

// Menu state & actions
const isMenuOpen = ref(false)
const isPwa = ref(false)

const toggleMenu = () => {
  document.body.style.overflow = isMenuOpen.value ? '' : 'hidden'
  isMenuOpen.value = !isMenuOpen.value
}

// `beforeinstallprompt` is captured app-wide by plugins/pwa.client.js, so on
// Android/Chrome we can open the real install dialog instead of sending the
// user to a page that just explains how. iOS never fires it and still needs
// the Add to Home Screen instructions on /install.
const { canInstall, promptInstall } = usePwa()
const installing = ref(false)

async function handleInstallApp() {
  if (!canInstall.value) {
    toggleMenu()
    router.push('/install')
    return
  }

  installing.value = true
  try {
    if (await promptInstall()) toggleMenu()
  } finally {
    installing.value = false
  }
}
function afterLogout() {
  if (headerContext.value === APP_SHELL.FAN) resetFanProfile()
  router.push(headerLogoutTo(route.path))
}

const logoutUser = () => {
  logout()
  afterLogout()
}
const logoutUserMobile = () => {
  logout()
  toggleMenu()
  afterLogout()
}

// Search modal state
const isSearchOpen = ref(false)

function openSearch() {
  isSearchOpen.value = true
}

function openSearchFromMenu() {
  toggleMenu()
  isSearchOpen.value = true
}

function onBandSelect(band) {
  router.push(`/${band.slug}`)
}

// Keyboard shortcut: Cmd/Ctrl + K
function handleGlobalKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    isSearchOpen.value = true
  }
}

// Standalone only becomes true after relaunch, so without this the install card
// would linger in the browser tab the user installed from.
function handleAppInstalled() {
  isPwa.value = true
}

onMounted(async () => {
  document.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('appinstalled', handleAppInstalled)
  // Check if running as installed PWA (standalone mode)
  isPwa.value = window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true
  if (user.value?.id && token.value && !bandAccessResolved.value) {
    await refreshBandAccess()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<style scoped>
header {
  z-index: 99999999 !important;
}

.header-bar {
  gap: 0.7rem;
  padding: 0 0.7rem 0 0.9rem;
}

.header-logo {
  display: block;
  line-height: 0;
  flex-shrink: 0;
}

.header-logo__mark {
  display: block;
  width: 112px;
  height: auto;
  max-width: 46vw;
  object-fit: contain;
}

.header-search {
  display: none;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  height: 2.375rem;
  padding: 0 0.7rem 0 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(168, 85, 247, 0.42);
  background:
    linear-gradient(180deg, rgba(147, 51, 234, 0.16) 0%, rgba(10, 7, 16, 0.86) 100%);
  box-shadow:
    inset 0 1px 0 rgba(232, 121, 249, 0.16),
    0 0 14px -5px rgba(168, 85, 247, 0.5);
  color: #c4b5fd;
  text-align: left;
  cursor: pointer;
}

.header-search--mobile {
  flex: 1 1 auto;
}

.header-search:hover {
  border-color: rgba(192, 132, 252, 0.58);
  background:
    linear-gradient(180deg, rgba(147, 51, 234, 0.22) 0%, rgba(12, 8, 20, 0.9) 100%);
  box-shadow:
    inset 0 1px 0 rgba(244, 114, 182, 0.18),
    0 0 16px -4px rgba(168, 85, 247, 0.58);
}

.header-search:focus-visible {
  outline: none;
  border-color: rgba(192, 132, 252, 0.7);
  box-shadow:
    inset 0 1px 0 rgba(232, 121, 249, 0.2),
    0 0 0 2px rgba(168, 85, 247, 0.28),
    0 0 16px -4px rgba(168, 85, 247, 0.55);
}

.header-search__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: #c084fc;
  filter: none;
}

.header-search__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: rgba(226, 211, 255, 0.86);
}

.header-search__kbd {
  display: none;
  margin-left: 0.15rem;
  padding: 0.08rem 0.32rem;
  border-radius: 0.28rem;
  border: 1px solid rgba(168, 85, 247, 0.28);
  background: rgba(0, 0, 0, 0.35);
  color: rgba(192, 132, 252, 0.78);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.04em;
}

@media (max-width: 767px) {
  .header-search--mobile {
    display: flex;
  }
}

@media (min-width: 768px) {
  .header-logo__mark {
    width: 136px;
  }

  .header-bar {
    justify-content: space-between;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .header-search--desktop {
    display: flex;
    flex: 0 0 auto;
    padding-right: 0.45rem;
  }

  .header-search__kbd {
    display: inline-flex;
  }
}

@media (prefers-reduced-motion: reduce) {
  .header-search,
  .header-search__icon {
    box-shadow: none;
    filter: none;
  }
}

.header-menu {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  margin-right: -0.2rem;
  border-radius: 0.7rem;
}

.header-menu:hover {
  background: rgba(255, 255, 255, 0.06);
}

.header-menu:focus-visible {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.35);
}

.nav-link {
  @apply text-white hover:bg-purple-700 rounded px-3 py-2 transition-colors text-sm;
}

.nav-link:focus-visible {
  outline: none;
  background: rgb(126 34 206);
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.4);
}

.nav-link--lab {
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.nav-link--lab:hover {
  color: rgba(255, 255, 255, 0.72);
  background: transparent;
}

.nav-icon {
  @apply relative text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors;
}

.nav-icon:focus-visible {
  outline: none;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.35);
}

.nav-icon-badge {
  @apply absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center;
}

.mobile-nav-link {
  @apply text-white text-xl hover:bg-purple-100 rounded px-4 py-2 transition-colors;
}

.mobile-nav-section-label {
  padding: 0 0.85rem;
  font-size: 0.65rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.32);
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 48px;
  padding: 0.7rem 0.85rem;
  border-radius: 0.85rem;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 550;
  font-size: 0.98rem;
  transition: background 0.15s ease, color 0.15s ease;
}

.mobile-nav-item--primary {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.94);
}

.mobile-nav-item--secondary {
  font-size: 0.92rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
}

.mobile-nav-item:hover,
.mobile-nav-item:focus-visible {
  background: rgba(255, 255, 255, 0.05);
  outline: none;
}

.mobile-nav-item:active {
  background: rgba(255, 255, 255, 0.08);
}

.mobile-nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.mobile-nav-item.router-link-active .mobile-nav-icon {
  color: #f0abfc;
  background: rgba(232, 121, 249, 0.12);
  border: 1px solid rgba(232, 121, 249, 0.22);
}

.mobile-nav-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
  border: 1px solid transparent;
}

.mobile-nav-icon--quiet {
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.55);
}

.mobile-nav-icon--logout {
  background: rgba(255, 255, 255, 0.03);
  color: rgba(252, 165, 165, 0.75);
}

.mobile-nav-logout {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 48px;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: 0.85rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.92rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.mobile-nav-logout:hover,
.mobile-nav-logout:focus-visible {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.08);
  outline: none;
}

.mobile-nav-logout:hover .mobile-nav-icon--logout,
.mobile-nav-logout:focus-visible .mobile-nav-icon--logout {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.12);
}

.mobile-nav-item-cta {
  @apply flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-accent to-neon-purple text-white font-semibold text-base transition-all duration-200;
}

.mobile-nav-item-cta:active {
  @apply scale-[0.98] opacity-90;
}

/* App install card */
.install-card {
  @apply relative w-full flex items-center gap-3 p-4 rounded-2xl overflow-hidden text-left transition-transform duration-200;
  background: linear-gradient(135deg, rgba(145, 0, 255, 0.22) 0%, rgba(255, 0, 255, 0.14) 100%);
  border: 1px solid rgba(145, 0, 255, 0.4);
  box-shadow: 0 10px 30px rgba(145, 0, 255, 0.18);
}

.install-card:active {
  @apply scale-[0.98];
}

.install-card:disabled {
  @apply opacity-70;
}

.install-glow {
  @apply absolute pointer-events-none;
  top: -60px;
  right: -30px;
  width: 170px;
  height: 170px;
  background: radial-gradient(circle, rgba(255, 0, 255, 0.35) 0%, transparent 70%);
}

.install-icon {
  @apply relative w-11 h-11 rounded-xl flex-shrink-0;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
}

.install-copy {
  @apply relative flex-1 min-w-0 flex flex-col;
}

.install-title {
  @apply text-white font-semibold text-sm;
}

.install-sub {
  @apply text-white/50 text-xs mt-0.5;
}

.install-cta {
  @apply relative flex-shrink-0 flex items-center justify-center gap-1.5 h-9 px-4 rounded-full text-white text-xs font-bold;
  background: linear-gradient(90deg, #9100ff, #ff00ff);
  box-shadow: 0 6px 16px rgba(255, 0, 255, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .install-card {
    transition: none;
  }
}

.showfully {
  z-index: 9999999999999;
}

.block {
  display: block;
}

body {
  overflow-x: hidden; /* Prevent horizontal scrolling */
}

/* Premium animated hamburger menu */
.hamburger-icon {
  width: 22px;
  height: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger-line {
  display: block;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #FF00FF, #9100FF);
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: center;
}

.hamburger-line-1 {
  width: 100%;
}

.hamburger-line-2 {
  width: 70%;
  margin-left: auto;
}

.hamburger-line-3 {
  width: 85%;
}

/* Open state - transform to X */
.hamburger-icon.is-open .hamburger-line-1 {
  transform: translateY(7px) rotate(45deg);
  width: 100%;
}

.hamburger-icon.is-open .hamburger-line-2 {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger-icon.is-open .hamburger-line-3 {
  transform: translateY(-7px) rotate(-45deg);
  width: 100%;
}

/* Hover glow effect */
.hamburger-icon:hover .hamburger-line {
  box-shadow: 0 0 8px rgba(255, 0, 255, 0.5);
}
</style>
