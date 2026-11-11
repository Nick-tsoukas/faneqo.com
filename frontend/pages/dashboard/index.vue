<template>
  <div class="min-h-screen pt-[var(--header-height)]">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Several authorized bands and none chosen: choose a workspace first. -->
      <ArtistWorkspacePicker v-if="showPicker" :bands="bandItems" />

      <template v-else>
      <!-- Header -->
      <!-- Wraps on phones so the workspace bar ("Switch artist") stays on screen. -->
      <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold text-white">Dashboard</h1>
          <p class="text-white/60 mt-2">Manage your QR codes, artist pages, and events</p>
        </div>
        <div class="flex items-center gap-3 min-w-0 max-w-full">
          <DashboardActiveBandBar v-if="isScopedWorkspace && activeBand" :band="activeBand" />
          <NotificationBell />
        </div>
      </div>

      <!-- Performance glance: situational awareness only. Depth lives in Analytics. -->
      <DashboardPerformanceGlance
        v-if="hasBand && activeBand?.id"
        :band-id="activeBand.id"
      />

      <!-- Banners -->
      <PayoutReturnNotice
        v-if="payoutNotice"
        :notice="payoutNotice.notice"
        :loading="payoutLoadingId === payoutNotice.bandId"
        :error="payoutNoticeError"
        @action="onPayoutNoticeAction"
        @dismiss="dismissPayoutNotice"
      />
      <PastDueBanner
        :status="subscriptionStatus"
        :days-left="daysLeft"
        :has-payment-method="billingInfo?.hasPaymentMethod ?? null"
        :billing-exempt="isBillingExempt"
        :price-label="billingPriceLabel"
      />

      <TrialBanner
        v-if="
          !loadingTrial &&
          !isBillingExempt &&
          daysLeft !== null &&
          daysLeft > 0 &&
          billingInfo?.hasPaymentMethod === false
        "
        :days-left="daysLeft"
        :disabled="loadingPortal"
        :price-label="billingPriceLabel"
        ref="trialBannerRef"
        @add-payment="goToBillingPortal"
      />

      <!-- Marketer Dashboard Card (Shannon only, hideable via Video Mode toggle) -->
      <MarketerOverviewCard v-if="!hideMetrics" class="mb-8" />

      <!-- Demo Show Recap Card (Video Mode toggle) -->
      <DashboardDemoShowRecapCard v-if="showDemoRecap" />

      <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
      <ArtistUpdatesDashboardCard
        v-if="false"
        :band-id="activeBand?.id"
      />

      <!-- MBQ Pulse Section (commented out - not ready yet) -->
      <!--
      <section v-if="hasBand && !loading" class="dashboard-section mb-8">
        <div class="section-header bg-gradient-to-r from-violet-600 to-purple-600">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">MBQ Pulse</h2>
              <p class="text-white/70 text-sm">Your fan momentum at a glance</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(label, days) in pulseRangeOptions"
              :key="days"
              @click="pulseRange = Number(days)"
              :class="[
                'px-3 py-1 text-xs rounded-full border transition-colors',
                pulseRange === Number(days)
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10',
              ]"
            >
              {{ label }}
            </button>
          </div>
        </div>
        <div class="section-content">
          <MbqPulseCard
            :pulse="pulseData"
            :loading="pulseLoading"
            :range-label="`Last ${pulseRange} days`"
            :show-opt-in="true"
            :band-id="bandItems[0]?.id"
          />
        </div>
      </section>
      -->

      <!-- Shareables Section - temporarily hidden for improvements -->
      <!--
      <section v-if="hasBand && !loading && bandItems[0]?.id" class="dashboard-section mb-8">
        <div class="section-header bg-gradient-to-r from-violet-600 to-purple-600">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Shareables</h2>
              <p class="text-white/70 text-sm">Share your music with fans</p>
            </div>
          </div>
        </div>
        <div class="section-content">
          <ShareablesSection
            v-if="bandItems[0]?.id"
            :band-id="bandItems[0].id"
            :band-slug="bandItems[0].slug || ''"
            :band-name="bandItems[0].name || 'This Artist'"
            :band-image-url="bandItems[0].bandImg?.url || null"
            :is-band-name-in-logo="bandItems[0].isBandNameInLogo || false"
            class="mt-4"
          />
        </div>
      </section>
      -->

      <!-- Demo Controls (only for whitelisted users) -->
      <!-- <DemoControlsCard /> -->

      <!--
        Artist Pages lead the dashboard. Show Mode moves above them only while a
        show is live or scheduled, because that state is time-sensitive.
        Ordered in CSS so ShowModeCard keeps its own polling state across the swap.
      -->
      <div :class="['dashboard-primary', primaryLayoutClass]">
      <!-- Keyed: ShowModeCard has no bandId watcher, so switching artists must remount it. -->
      <ShowModeCard
        v-if="hasBand && activeBand?.id"
        :key="`show-mode-${activeBand.id}`"
        :band-id="activeBand.id"
        :band-slug="activeBand.slug || ''"
        :refresh-tick="showModeRefreshTick"
        :class="['mb-8', showModeLeads ? 'primary-lead' : 'primary-follow']"
        @status="onShowModeStatus"
      />

      <!-- Bands Section -->
      <div v-if="loading" class="mb-8">
        <SkeletonLoader />
      </div>

      <section v-else class="dashboard-section mb-8">
        <div class="section-header bg-gradient-to-r from-emerald-600 to-teal-600">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Artist Pages</h2>
              <p class="text-white/70 text-sm">{{ workspaceBands.length }} page{{ workspaceBands.length !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <NuxtLink
            v-if="!hasBand || isSpecialUser"
            to="/createband"
            class="create-button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Artist Page</span>
          </NuxtLink>
          <button
            v-else
            class="create-button opacity-50 cursor-not-allowed"
            disabled
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Limit reached</span>
          </button>
        </div>

        <div class="section-content">
          <div v-if="workspaceBands.length" class="space-y-4">
            <div
              v-for="(band, idx) in workspaceBands"
              :key="band.id"
              class="item-card"
            >
              <!-- Image with skeleton loading -->
              <div class="item-image-wrapper">
                <div class="item-image-skeleton"></div>
                <NuxtImg
                  provider="ipx"
                  format="webp"
                  :src="normalizeImg(band.imageUrl)"
                  class="item-image"
                  width="80"
                  height="80"
                  :loading="idx === 0 ? 'eager' : 'lazy'"
                  decoding="async"
                  :fetchpriority="idx === 0 ? 'high' : 'auto'"
                  :modifiers="{ fit: 'cover' }"
                  @load="(e) => e.target.classList.add('loaded')"
                />
              </div>

              <div class="item-info">
                <h3 class="item-title">{{ band.title }}</h3>
                <div
                  v-if="!band.isOwner || (band.paymentsEnabled && band.stripeOnboardingComplete) || band.stripeAccountId"
                  class="flex items-center gap-2 mt-1 flex-wrap"
                >
                  <span
                    v-if="!band.isOwner"
                    class="status-badge status-neutral"
                  >
                    <span class="status-dot"></span>
                    {{ band.accessRole === 'viewer' ? 'Viewer access' : 'Manager access' }}
                  </span>
                  <span
                    v-if="band.isOwner && ((band.paymentsEnabled && band.stripeOnboardingComplete) || band.stripeAccountId)"
                    class="status-badge"
                    :class="band.paymentsEnabled && band.stripeOnboardingComplete ? 'status-success' : 'status-warning'"
                  >
                    <span class="status-dot"></span>
                    {{ band.paymentsEnabled && band.stripeOnboardingComplete ? 'Payments active' : 'Finish payment setup' }}
                  </span>
                </div>
              </div>

              <div class="item-actions">
                <button
                  @click="router.push(`/${band.slug}`)"
                  class="action-btn-labeled"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View</span>
                </button>

                <button
                  @click="copyBandLink(band.slug)"
                  class="action-btn-labeled text-sky-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.102-1.101" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.172 13.828a4 4 0 005.656 0l3-3a4 4 0 10-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Copy Link</span>
                </button>

                <button
                  v-if="band.canEdit"
                  @click="router.push(`/editband/${band.id}`)"
                  class="action-btn-labeled"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>

                <NuxtLink
                  v-if="band.canManageTeam"
                  :to="`/dashboard/team/${band.id}`"
                  class="action-btn-labeled text-violet-300"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Team</span>
                </NuxtLink>

                <button
                  @click="router.push(`/analytics/${band.id}`)"
                  class="action-btn-labeled text-emerald-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analytics</span>
                </button>

                <button
                  @click="openShareDrawer(band)"
                  class="action-btn-labeled text-amber-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>

                <button
                  v-if="band.canManagePayments"
                  @click="startPayoutOnboarding(band.id)"
                  class="action-btn-labeled text-purple-400"
                  :disabled="payoutLoadingId === band.id"
                >
                  <svg v-if="payoutLoadingId !== band.id" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Set up payments</span>
                </button>

                <button
                  v-if="band.canDeleteBand"
                  @click="deleteItem(band.id, 'band')"
                  class="action-btn-labeled text-red-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon bg-emerald-500/20">
              <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 class="text-white font-semibold mt-4">No artist pages yet</h3>
            <p class="text-white/50 text-sm mt-1">Create your artist page to showcase your music</p>
          </div>
        </div>
      </section>
      </div>

      <!-- Fans / Fan Intelligence — owner only (PII + messaging stay owner-gated) -->
      <FansDashboardCard
        v-if="hasBand && !loading && isActiveBandOwner"
        :band-id="activeBand?.id"
        :can-send-messages="canSendFanMessages"
        :can-manage-fan-list="canManageFanList"
      />

      <!-- Events Section -->
      <div v-if="loading" class="mb-8">
        <SkeletonLoader />
      </div>

      <section v-else class="dashboard-section mb-8">
        <div class="section-header bg-gradient-to-r from-blue-600 to-indigo-600">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Events</h2>
              <p class="text-white/70 text-sm">{{ workspaceEvents.length }} event{{ workspaceEvents.length !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <NuxtLink
            :to="createEventTo"
            class="create-button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Event</span>
          </NuxtLink>
        </div>

        <div class="section-content">
          <div v-if="workspaceEvents.length" class="space-y-4">
            <div
              v-for="(ev, idx) in workspaceEvents"
              :key="ev.id"
              class="item-card"
            >
              <!-- Image with skeleton loading -->
              <div class="item-image-wrapper">
                <div class="item-image-skeleton"></div>
                <NuxtImg
                  provider="ipx"
                  format="webp"
                  :src="normalizeImg(ev.imageUrl)"
                  class="item-image"
                  width="80"
                  height="80"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  :modifiers="{ fit: 'cover' }"
                  @load="(e) => e.target.classList.add('loaded')"
                />
              </div>

              <div class="item-info">
                <h3 class="item-title">{{ ev.title }}</h3>
                <p class="item-subtitle">{{ ev.contextLine || 'Event' }}</p>
                <!-- No start time, so no Event-backed activation. Explain it
                     rather than showing a Start button that cannot work. -->
                <p
                  v-if="ev.showModeControl.kind === 'missing_time'"
                  class="item-show-mode-note"
                >
                  {{ ev.showModeControl.label }}
                </p>
                <p
                  v-if="eventShowModeNotice?.eventId === ev.id"
                  class="item-show-mode-note"
                  role="status"
                >
                  {{ eventShowModeNotice.message }}
                  <button
                    v-if="eventShowModeNotice.action === 'manage'"
                    type="button"
                    class="item-show-mode-note__link"
                    @click="scrollToShowMode"
                  >
                    Manage Show Mode
                  </button>
                </p>
              </div>

              <div class="item-actions">
                <button
                  v-if="ev.showModeControl.kind === 'start' || ev.showModeControl.kind === 'live'"
                  type="button"
                  class="action-btn-labeled action-btn-show-mode"
                  :class="{ 'is-live': ev.showModeControl.kind === 'live' }"
                  :disabled="startingShowModeEventId === ev.id"
                  :title="ev.showModeControl.hint"
                  @click="onEventShowModeClick(ev)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.93 19.07a10 10 0 010-14.14M7.76 16.24a6 6 0 010-8.48M16.24 7.76a6 6 0 010 8.48M19.07 4.93a10 10 0 010 14.14" />
                    <circle cx="12" cy="12" r="1.55" fill="currentColor" stroke="none" />
                  </svg>
                  <span>{{ startingShowModeEventId === ev.id ? 'Starting…' : ev.showModeControl.label }}</span>
                </button>

                <!-- Upcoming but not yet startable. Never an active control. -->
                <span
                  v-else-if="ev.showModeControl.kind === 'waiting'"
                  class="action-btn-labeled action-btn-show-mode-waiting"
                  :title="ev.showModeControl.hint"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke-width="2" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7.5V12l3 1.75" />
                  </svg>
                  <span>{{ ev.showModeControl.label }}</span>
                </span>

                <!-- Already live elsewhere. Manage it; never replace it. -->
                <button
                  v-else-if="ev.showModeControl.kind === 'other_live'"
                  type="button"
                  class="action-btn-labeled action-btn-show-mode-conflict"
                  :title="ev.showModeControl.hint"
                  @click="onEventShowModeConflictClick(ev)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ ev.showModeControl.label }}</span>
                </button>

                <span
                  v-else-if="ev.showModeControl.kind === 'past'"
                  class="item-show-mode-past"
                >
                  {{ ev.showModeControl.label }}
                </span>

                <button
                  @click="router.push(`/${ev.bandSlug}/event/${ev.slug}`)"
                  class="action-btn-labeled"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View</span>
                </button>

                <button
                  @click="router.push(`/editevent/${ev.id}`)"
                  class="action-btn-labeled"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>

                <button
                  @click="copyToClipboard(`${config.public.baseUrl}/${ev.bandSlug}/event/${ev.slug}`)"
                  class="action-btn-labeled text-amber-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>

                <button
                  @click="router.push(`/event-analytics/${ev.id}`)"
                  class="action-btn-labeled text-emerald-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analytics</span>
                </button>

                <button
                  @click="deleteItem(ev.id, 'event')"
                  class="action-btn-labeled text-red-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon bg-blue-500/20">
              <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold mt-4">No events yet</h3>
            <p class="text-white/50 text-sm mt-1">Create your first event to promote your shows</p>
          </div>
        </div>
      </section>

      <!-- QR Codes Section -->
      <div v-if="loading" class="mb-8">
        <SkeletonLoader />
      </div>

      <section v-else class="dashboard-section mb-8">
        <div class="section-header bg-gradient-to-r from-purple-600 to-violet-600">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">QR Codes</h2>
              <p class="text-white/70 text-sm">{{ qrItems.length }} code{{ qrItems.length !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <NuxtLink
            v-if="canCreateMoreQrs"
            to="/createqr"
            class="create-button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create QR</span>
          </NuxtLink>
          <button
            v-else
            class="create-button opacity-50 cursor-not-allowed"
            disabled
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Limit reached</span>
          </button>
        </div>

        <div class="section-content">
          <div v-if="qrItems.length" class="space-y-4">
            <div
              v-for="(qr, idx) in qrItems"
              :key="qr.id"
              class="item-card"
            >
              <!-- Image with skeleton loading -->
              <div class="item-image-wrapper">
                <div class="item-image-skeleton"></div>
                <NuxtImg
                  provider="ipx"
                  format="webp"
                  :src="normalizeImg(qr.imageUrl)"
                  class="item-image"
                  width="80"
                  height="80"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  :modifiers="{ fit: 'cover' }"
                  @load="(e) => e.target.classList.add('loaded')"
                />
              </div>

              <div class="item-info">
                <h3 class="item-title">{{ qr.title }}</h3>
                <p class="item-subtitle">QR Code</p>
              </div>

              <div class="item-actions">
                <button @click="openDownloadForQr(qr.id)" class="action-btn-labeled">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </button>

                <button
                  v-if="!qr.isShared"
                  @click="editItem(qr.id, 'editqr')"
                  class="action-btn-labeled"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>

                <button
                  @click="router.push(`/analyticsqr/${qr.id}`)"
                  class="action-btn-labeled text-emerald-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analytics</span>
                </button>

                <button
                  v-if="!qr.isShared"
                  @click="deleteItem(qr.id, 'qr')"
                  class="action-btn-labeled text-red-400"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon bg-purple-500/20">
              <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold mt-4">No QR codes yet</h3>
            <p class="text-white/50 text-sm mt-1">Create your first QR code to get started</p>
          </div>
        </div>
      </section>

      <!-- Team Access: account/admin utility, deliberately last. -->
      <TeamAccessCard
        v-if="hasBand && isActiveBandOwner && activeBand?.id"
        :band-id="activeBand.id"
        :band-name="activeBand.name || activeBand.title || ''"
        class="team-access-trailing"
      />

      <!-- Download modal (client-only component) -->

      <ClientOnly>
        <LazyDownloadQr
          v-model="showDownload"
          :qr-options="activeQrOptions"
          :default-name="activeQrName"
          :key="showDownload ? activeQrName : 'closed'"
        />
      </ClientOnly>

      <!-- Delete Confirmation Modal -->
      <DeleteConfirmModal
        v-model="showDeleteModal"
        :item-id="deleteTarget.id"
        :item-name="deleteTarget.name"
        :item-type="deleteTarget.type"
        :item-image="deleteTarget.image"
        ref="deleteModalRef"
        @confirm="confirmDelete"
      />
      <!-- VIEW QR Popup -->
      <!-- <div
        v-if="qrView"
        class="h-screen w-screen bg-black z-50 fixed overflow-hidden top-0 right-0 flex justify-center items-center"
      >
        <div class="flex flex-col gap-4">
          <img :src="imageURL" class="max-h-[67vh]" alt="" />
          <button
            @click="downloadImage"
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Download Image
          </button>

          <button
            @click="viewQr"
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Close popup
          </button>
        </div>
      
      </div> -->
      </template>
    </div>
    <transition name="fade-slide">
      <div
        v-if="showToast"
        class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm font-medium px-6 py-3 rounded shadow-lg z-50"
      >
        {{ toastMessage }}
      </div>
    </transition>

    <ShareDrawer
      v-if="activeShareBand"
      :is-open="shareDrawerOpen"
      :band-id="Number(activeShareBand.id)"
      :band-slug="activeShareBand.slug"
      :band-name="activeShareBand.name"
      :band-image-url="activeShareBand.bandImg?.url || activeShareBand.imageUrl || null"
      :is-band-name-in-logo="activeShareBand.isBandNameInLogo || false"
      @close="closeShareDrawer"
    />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

import { useNuxtApp } from "#app";
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
  inject,
  watch,
  defineAsyncComponent,
} from "vue";
import { differenceInCalendarDays } from "date-fns";
import { useRuntimeConfig } from "#imports";
import ShareablesSection from '~/components/dashboard/ShareablesSection.vue';
import DemoControlsCard from '~/components/dashboard/DemoControlsCard.vue';
import ShareDrawer from '~/components/band/ShareDrawer.vue';
import FansDashboardCard from '~/components/dashboard/fans/FansDashboardCard.vue';
import MarketerOverviewCard from '~/components/dashboard/marketer/MarketerOverviewCard.vue';
import ShowModeCard from '~/components/dashboard/ShowModeCard.vue';
import TeamAccessCard from '~/components/dashboard/TeamAccessCard.vue';
import DashboardPerformanceGlance from '~/components/dashboard/PerformanceGlance.vue';
import ArtistWorkspacePicker from '~/components/dashboard/ArtistWorkspacePicker.vue';
import PayoutReturnNotice from '~/components/payments/PayoutReturnNotice.vue';
import { payoutReturnKind, usePayoutSetup } from '~/composables/usePayoutSetup';
import { payoutReturnNotice, stageFromFlags } from '~/utils/payments/paymentSetupStatus';
import DashboardActiveBandBar from '~/components/dashboard/ActiveBandBar.vue';
import { priceLabelFrom } from '~/utils/billing/billingTerms';
import {
  DASHBOARD_WORKSPACE,
  resolveDashboardWorkspace,
  scopeEventsToBand,
  newEventPathForBand,
} from '~/utils/ui/dashboardWorkspace';
import { writeStoredActiveBandId } from '~/composables/useWorkspaceBand';
import {
  EVENT_SHOW_MODE_CONTROL,
  eventShowModeControl,
  indexServerActivation,
  sortDashboardEvents,
} from '~/utils/show-mode/eventShowModeActivation';
// Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable.
// import ArtistUpdatesDashboardCard from '~/components/updates/ArtistUpdatesDashboardCard.vue';
import { useVideoModeToggles } from '~/composables/useVideoModeToggles';
import {
  isAmbassadorBilling,
  isBillingExemptLifetimePro,
} from '~/utils/billing/artistEntitlement';

const { hideMetrics, showDemoRecap } = useVideoModeToggles();

// rebuild

// special user override
// with this:
const specialEmails = [
  "mjc773@gmail.com",
  "nick.tsoukas101@gmail.com",
  "info@rocksnaps.com",
  "novamusic@aol.com",
  "partner@musicbizqr.com",
];
const isSpecialUser = computed(() => {
  const e = String(user.value?.email || "").toLowerCase().trim();
  return specialEmails.includes(e);
});

const sharedViewEmails = ["info@rocksnaps.com", "novamusic@aol.com"];
const sharedQrIds = computed(() => {
  const e = String(user.value?.email || "").toLowerCase().trim();
  if (!sharedViewEmails.includes(e)) return [];
  return [46];
});

const maxQrAllowed = computed(() => 10);

const ownedQrCount = computed(() => qrItems.value.filter((q) => !q.isShared).length);

const canCreateMoreQrs = computed(
  () => ownedQrCount.value < maxQrAllowed.value
);

const token = useStrapiToken();
const loadingPortal = ref(false);

const config = useRuntimeConfig();

const user = useStrapiUser();
const router = useRouter();
const route = useRoute();
const client = useStrapiClient();
import { useStrapi } from "#imports";
const { find, findOne  } = useStrapi();
const strapi = useStrapi();

const { setToken, fetchUser } = useStrapiAuth();

// reactive state
const daysLeft = ref(null);
const loadingTrial = ref(false);
const trialError = ref("");
const billingInfo = ref(null);
const subscriptionStatus = ref(null); // new

// Founder-granted lifetime Pro (ambassador / white-glove). Read from the billing
// response and the user row, since either alone can be stale on first paint.
const isBillingExempt = computed(
  () => isAmbassadorBilling(billingInfo.value) || isBillingExemptLifetimePro(user.value)
);
// The artist's own subscription price for the billing banners (never invented).
const billingPriceLabel = computed(() => priceLabelFrom(billingInfo.value?.subscription?.price));

const nuxtApp = useNuxtApp();
const historyStack = nuxtApp.$historyStack; // ← grab the real one
const previousRoute = computed(() =>
  historyStack.value.length
    ? historyStack.value[historyStack.value.length - 1]
    : null
);

const loading = ref(true);
const qrs = ref([]);
const scans = ref([]);
const bands = ref([]);
const events = ref([]);
const showModeRefreshTick = ref(0);
const startingShowModeEventId = ref(null);
const eventShowModeNotice = ref(null);
const liveShowMode = ref({ isLive: false, isScheduled: false, eventId: null });
// Event activation eligibility is time-bounded, so the Events list needs a
// clock. One minute is fine for a 24-hour window.
const activationClockMs = ref(Date.now());
let activationClockTimer = null;
// Server-resolved activation windows, keyed by event id. Absolute instants
// only — the browser's timezone must never decide eligibility.
const eventActivationById = ref({});

// MBQ Pulse state
const pulseData = ref(null);
const pulseLoading = ref(false);
const pulseRange = ref(30);
const pulseRangeOptions = {
  7: '7 Days',
  30: '30 Days',
  90: '90 Days',
  365: '1 Year',
};

const payoutLoadingId = ref(null);

const hasQr = computed(() => qrItems.value.length > 0);
const hasBand = computed(() => bandItems.value.length > 0);

const showToast = ref(false);
const toastMessage = ref("");
let toastTimeout = null;
const showDownload = ref(false);
const activeQrOptions = ref(null);
const activeQrName = ref("qr-code");

const shareDrawerOpen = ref(false);
const activeShareBand = ref(null);

function openShareDrawer(band) {
  activeShareBand.value = band;
  shareDrawerOpen.value = true;
}

function closeShareDrawer() {
  shareDrawerOpen.value = false;
}

// Delete modal state
const showDeleteModal = ref(false);
const deleteModalRef = ref(null);
const deleteTarget = ref({
  id: null,
  name: '',
  type: '',
  image: '',
});

const normalizeImg = (u) => {
  if (!u) return "";
  // Your bucket is S3; if Strapi gives relative paths, prefix with alias (optional).
  // For fully-qualified S3 URLs, just return as-is.
  if (u.startsWith("http")) return u;
  return `s3:${u}`; // only if you ever store relative keys like /qrcode_abc.png
};

async function openDownloadForQr(rawOrId) {
  try {
    const id = typeof rawOrId === 'object' ? rawOrId.id : rawOrId

    // Show the modal immediately with a lightweight "loading" state
    activeQrOptions.value = null
    activeQrName.value = 'Loading…'
    showDownload.value = true

    // Fetch detailed row with options (cached)
    const full = await fetchQrOptionsById(id)
    const row = full?.data || rawOrId

    // Build the QR options for the component
    const built = buildQrOptionsFromStrapi(row)
    activeQrOptions.value = built
    activeQrName.value = row?.attributes?.name || `qr-${id}`
  } catch (e) {
    console.error('[Download] failed to load options', e)
    showDownload.value = false
    alert('Could not load QR options. Please try again.')
  }
}


function buildQrOptionsFromStrapi(raw) {
  const node = raw?.data ? raw.data : raw     // normalize
  const a = node?.attributes || {}
  const saved = a.options || {}               // ✅ you were missing this

  // DEBUG: Log what we're working with
  console.log('[QR Download Debug]', {
    nodeId: node?.id,
    savedData: saved.data,
    attrUrl: a.url,
    attrLink: a.link,
    attrSlugId: a.slugId,
  })

  // prefer the exact string you saved in options.data
  // NOTE: a.link is the DESTINATION (e.g. spotify.com), NOT the directqr URL - don't use it here!
  let encoded =
    (saved.data && String(saved.data).trim()) ||
    (a.url && String(a.url).trim()) ||
    (a.qrValue && String(a.qrValue).trim()) ||
    (a.data && String(a.data).trim()) ||
    ''

  const isOriginOnly = (s) => /^https?:\/\/[^/]+\/?$/i.test(s || '')
  const toAbsHttps = (s) => (!s ? '' : /^https?:\/\//i.test(s) ? s : `https://${s}`)
  const base = (useRuntimeConfig().public?.baseUrl || 'https://musicbizqr.com').replace(/\/+$/, '')
  const buildDirect = (id) => `${base}/directqr?id=${id}`

  // If no valid URL found, or only origin without path, build from slugId or node.id
  if (!encoded || isOriginOnly(encoded)) {
    // First try slugId (preferred)
    if (a.slugId) {
      encoded = buildDirect(a.slugId)
    } else if (a.url && /\bid=/.test(a.url)) {
      encoded = toAbsHttps(a.url.trim())
    } else if (node?.id) {
      encoded = buildDirect(node.id)
    }
  }

  encoded = toAbsHttps(encoded)
  
  console.log('[QR Download Debug] Final encoded URL:', encoded)

  const logo =
    saved.image ||
    saved.imageOptions?.src ||
    a.logo?.url ||
    null

  const dotColor =
    saved.dotsOptions?.color ||
    a.qrColor ||
    a.colorDark ||
    saved.colorDark ||
    '#000000'

  const cornersSqColor =
    saved.cornersSquareOptions?.color || a.cornersSquareColor || dotColor

  const cornersDotColor =
    saved.cornersDotOptions?.color || a.cornersDotColor || dotColor

  const bg = saved.backgroundOptions?.color || a.backgroundColor || '#FFFFFF'

  // CRITICAL: Ensure we always have a valid URL with directqr path
  const hasDirectQr = /directqr\?id=/.test(encoded || '')
  if (!encoded || encoded === base || !hasDirectQr) {
    console.error('[QR Download] INVALID URL! Must contain directqr?id=. Got:', encoded)
    // ALWAYS build a valid directqr URL as last resort
    const fallbackId = a.slugId || node?.id || 'unknown'
    encoded = buildDirect(fallbackId)
    console.log('[QR Download] Built fallback URL:', encoded)
  }
  
  console.log('[QR Download] FINAL DATA TO ENCODE:', encoded)
  
  // FINAL VALIDATION - must be a valid directqr URL
  if (!encoded.includes('directqr?id=')) {
    console.error('[QR Download] CRITICAL: Still invalid after fallback! Using hardcoded fallback')
    encoded = `https://musicbizqr.com/directqr?id=${node?.id || 'error'}`
  }

  const opts = {
    data: encoded,
    width: Number(saved.size || saved.width || 300),
    height: Number(saved.size || saved.height || 300),
    backgroundOptions: { color: bg },
    dotsOptions: {
      type: saved.dotsOptions?.type || 'square',
      color: dotColor,
      gradient: saved.dotsOptions?.gradient ?? null,
    },
    cornersSquareOptions: {
      color: cornersSqColor,
      type: saved.cornersSquareOptions?.type || 'square',
    },
    cornersDotOptions: {
      color: cornersDotColor,
      type: saved.cornersDotOptions?.type || 'square',
    },
    imageOptions: {
      src: logo || '',
      imageSize: saved.imageOptions?.imageSize ?? 0.4,
      margin: saved.imageOptions?.margin ?? 0,
      crossOrigin: 'anonymous',
    },
  }

  if (logo) opts.image = logo
  return opts
}


function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toastMessage.value = "✅ Link copied to clipboard!";
      showToast.value = true;

      // Clear any previous timeout
      if (toastTimeout) clearTimeout(toastTimeout);

      // Auto-hide after 3 seconds
      toastTimeout = setTimeout(() => {
        showToast.value = false;
      }, 3000);
    })
    .catch(() => {
      toastMessage.value = "❌ Failed to copy link.";
      showToast.value = true;
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        showToast.value = false;
      }, 3000);
    });
}

/**
 * Uses the configured base URL rather than window.location.origin so a link
 * copied from a preview or staging host still points at production.
 */
function copyBandLink(slug) {
  if (!slug) return;

  const base = (config.public?.baseUrl || "https://faneqo.com").replace(/\/+$/, "");
  copyToClipboard(`${base}/${slug}`);
}

async function fetchBillingInfo() {
  try {
    const result = await client("/stripe/billing", {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    billingInfo.value = result;
  } catch (err) {
    console.warn("[Dashboard] Failed to fetch billing info:", err);
  }
}

async function fetchTrialInfo() {
  loadingTrial.value = true;
  try {
    const subscription = await client("/stripe/subscription-status", {
      method: "GET",
      headers: { Authorization: `Bearer ${useStrapiToken().value}` },
    });

    subscriptionStatus.value =
      subscription && subscription.status ? subscription.status : null;

    const rawEnds = subscription.trialEndsAt;
    const isTrialing = subscriptionStatus.value === 'trialing';
    if (isTrialing && rawEnds) {
      const endDate =
        typeof rawEnds === "number"
          ? new Date(rawEnds * 1000)
          : new Date(rawEnds);
      const diff = differenceInCalendarDays(endDate, new Date());
      daysLeft.value = diff > 0 ? diff : 0;
    } else {
      daysLeft.value = null;
    }
  } catch (err) {
    trialError.value = err.message || "Unknown error fetching trial info";
  } finally {
    loadingTrial.value = false;
  }
}

// refresh everything after billing portal return
watch(
  () => route.query.portal,
  async (flag) => {
    if (flag === "returned") {
      await Promise.all([fetchTrialInfo(), fetchBillingInfo(), fetchUser()]);
      router.replace({ path: route.path, query: {} });
    }
  }
);

const fetchData = async () => {
  console.log('[Dashboard] fetchData called, user:', user.value?.id, user.value?.email);
  if (!user.value?.id) {
    console.log('[Dashboard] No user ID, skipping fetch');
    loading.value = false;
    return;
  }
  loading.value = true;

  try {
    // Band access must resolve before events (team band event filters depend on it).
    const bandsArr = await fetchBandsLite();
    const [qrsArr, eventsArr] = await Promise.all([
      fetchQrsLite(),
      fetchEventsLite(),
    ]);

    console.log('[Dashboard] Fetched data:', { qrs: qrsArr.length, bands: bandsArr.length, events: eventsArr.length });
    console.log('[Dashboard] Raw bands:', JSON.stringify(bandsArr.slice(0, 2), null, 2));

    const mergedQrs = [...qrsArr];

    const extraIds = sharedQrIds.value || [];
    if (extraIds.length) {
      const sharedRows = await Promise.all(
        extraIds.map((id) =>
          findOne('qrs', id, {
            fields: ['name'],
            populate: { q_image: { fields: ['url'] } },
          }).catch((e) => {
            console.warn('[Dashboard] Could not fetch shared QR', id, e)
            return null
          })
        )
      );

      for (const resp of sharedRows) {
        const row = resp?.data;
        if (!row) continue;
        if (mergedQrs.some((q) => String(q.id) === String(row.id))) continue;
        row.__shared = true;
        mergedQrs.push(row);
      }
    }

    // Set state in one go (minimize reactive churn)
    qrs.value = mergedQrs;
    bands.value = bandsArr;
    events.value = eventsArr;

    // Eligibility is server-owned; the Events list stays inert until it lands.
    await fetchEventActivation(eventsArr);

    // Stage 2: scans depend on QR IDs
    const qrIds = qrsArr.map((q) => q.id);
    // const scansArr = await fetchScansForQrIds(qrIds);
    // scans.value = scansArr;
  } catch (e) {
    console.error('[Dashboard] fetchData error:', e);
  } finally {
    loading.value = false;
  }
};

// Fetch MBQ Pulse for user's band
async function fetchPulse() {
  const bandId = activeBand.value?.id;
  if (!bandId) {
    pulseData.value = null;
    pulseLoading.value = false;
    return;
  }
  pulseLoading.value = true;
  try {
    const data = await client('/analytics/pulse', {
      params: { entityType: 'band', entityId: bandId, range: `${pulseRange.value}d` }
    });
    pulseData.value = data?.pulse || null;
  } catch (err) {
    console.error('[Dashboard] Failed to fetch pulse:', err);
    pulseData.value = null;
  } finally {
    pulseLoading.value = false;
  }
}

// Refresh all moment panels (called after running evaluators)
function refreshPanels() {
  // This triggers a re-fetch in child components by updating a key
  // Components will re-fetch on mount, so we just need to trigger re-render
  fetchPulse();
}

const qrDetailCache = new Map() // id -> full row with options



async function fetchQrOptionsById(id) {
  if (qrDetailCache.has(id)) return qrDetailCache.get(id)

  // ask ONLY for fields your builder reads, and that exist in your CT
  const row = await findOne('qrs', id, {
    fields: ['name','url','link','template','arEnabled','options','slugId'],
    populate: {
      logo: { fields: ['url'] },
      q_image: { fields: ['url'] }, // Include the pre-generated QR image
    },
    // publicationState: 'live', // add if you use draft/publish
  })

  qrDetailCache.set(id, row)
  return row
}

// Return-only helpers (no state mutation)
async function fetchQrsLite() {
  console.log('[Dashboard] fetchQrsLite starting... user.id:', user.value?.id);
  console.log('[Dashboard] token present:', !!token.value);
  try {
    const resp = await find("qrs", {
      filters: { users_permissions_user: { id: { $eq: user.value.id } } },
      fields: ["name", "id", ],
      populate: { q_image: { fields: ["url"] } },
      sort: ["updatedAt:desc"],
      pagination: { pageSize: 50 },
    });
    console.log('[Dashboard] fetchQrsLite response:', resp);
    console.log('[Dashboard] fetchQrsLite success:', resp?.data?.length);
    return Array.isArray(resp.data) ? resp.data : [];
  } catch (e) {
    console.error('[Dashboard] fetchQrsLite ERROR:', e);
    console.error('[Dashboard] fetchQrsLite ERROR details:', e?.response?.status, e?.response?.data);
    return [];
  }
}

/** Role / permissions from GET /api/me/band-access (secure backend list). */
const bandAccessById = ref({});

async function fetchBandsLite() {
  console.log('[Dashboard] fetchBandsLite starting... user.id:', user.value?.id);
  const bandFields = {
    'fields[0]': 'name',
    'fields[1]': 'slug',
    'fields[2]': 'stripeAccountId',
    'fields[3]': 'paymentsEnabled',
    'fields[4]': 'stripeOnboardingComplete',
    'fields[5]': 'isBandNameInLogo',
    'fields[6]': 'showModeStatus',
    'fields[7]': 'showModeEnabled',
    'fields[8]': 'showModeEventId',
    'populate[bandImg][fields][0]': 'url',
    'populate[bandImg][fields][1]': 'formats',
    'sort[0]': 'updatedAt:desc',
    'pagination[pageSize]': 50,
  };

  try {
    let owned = [];
    let teamAccess = [];
    try {
      const { getMyBandAccess } = useBandTeam();
      const access = await getMyBandAccess();
      owned = Array.isArray(access?.owned) ? access.owned : [];
      teamAccess = Array.isArray(access?.teamAccess) ? access.teamAccess : [];
    } catch (accessErr) {
      console.warn('[Dashboard] band-access failed; falling back to owned bands only', accessErr);
    }

    const accessMap = {};
    for (const row of owned) {
      accessMap[String(row.bandId)] = {
        role: 'owner',
        isOwner: true,
        permissions: row.permissions || null,
      };
    }
    for (const row of teamAccess) {
      accessMap[String(row.bandId)] = {
        role: row.role,
        isOwner: false,
        permissions: row.permissions || null,
      };
    }
    bandAccessById.value = accessMap;

    const teamIds = teamAccess.map((r) => r.bandId).filter(Boolean);

    // Always load owned bands via owner filter (existing path + access-API fallback).
    const ownedResp = await client('/bands', {
      params: {
        'filters[users_permissions_user][id][$eq]': user.value.id,
        ...bandFields,
      },
    });
    const ownedBands = Array.isArray(ownedResp?.data) ? ownedResp.data : [];
    for (const b of ownedBands) {
      if (!accessMap[String(b.id)]) {
        accessMap[String(b.id)] = { role: 'owner', isOwner: true, permissions: null };
      }
    }
    bandAccessById.value = { ...accessMap };

    // Team bands: fetch by id from the secure access list (never client-side scrape of all bands).
    const ownedIdSet = new Set(ownedBands.map((b) => String(b.id)));
    const teamOnlyIds = teamIds.filter((id) => !ownedIdSet.has(String(id)));
    const teamBands = (
      await Promise.all(
        teamOnlyIds.map((id) =>
          client(`/bands/${id}`, {
            params: {
              'fields[0]': 'name',
              'fields[1]': 'slug',
              'fields[2]': 'stripeAccountId',
              'fields[3]': 'paymentsEnabled',
              'fields[4]': 'stripeOnboardingComplete',
              'fields[5]': 'isBandNameInLogo',
              'fields[6]': 'showModeStatus',
              'fields[7]': 'showModeEnabled',
              'fields[8]': 'showModeEventId',
              'populate[bandImg][fields][0]': 'url',
              'populate[bandImg][fields][1]': 'formats',
            },
          }).catch((e) => {
            console.warn('[Dashboard] Could not fetch team band', id, e);
            return null;
          })
        )
      )
    )
      .map((resp) => resp?.data)
      .filter(Boolean);

    // Owners first, then team access — primary dashboard band prefers ownership.
    const merged = [...ownedBands, ...teamBands];
    console.log('[Dashboard] fetchBandsLite success:', merged.length, {
      owned: ownedBands.length,
      team: teamBands.length,
    });
    return merged;
  } catch (e) {
    console.error('[Dashboard] fetchBandsLite ERROR:', e);
    return [];
  }
}

async function fetchEventsLite() {
  console.log('[Dashboard] fetchEventsLite starting...');
  try {
    // Owner-created events
    const ownedResp = await find("events", {
      filters: { users_permissions_user: { id: { $eq: user.value.id } } },
      // Activation eligibility is resolved server-side (fetchEventActivation);
      // `date` and `time` are carried for display only.
      fields: ["title", "slug", "date", "time"],
      populate: {
        image: { fields: ["url", "formats"] },
        band: { fields: ["id", "slug"] },
      },
      sort: ["updatedAt:desc"],
      pagination: { pageSize: 50 },
    });
    const ownedEvents = Array.isArray(ownedResp.data) ? ownedResp.data : [];

    // Events for team-access bands (band-scoped, auth-checked on API)
    const teamBandIds = Object.entries(bandAccessById.value)
      .filter(([, meta]) => meta && !meta.isOwner)
      .map(([id]) => id);

    const teamEventBatches = await Promise.all(
      teamBandIds.map((bandId) =>
        find("events", {
          filters: { band: { id: { $eq: bandId } } },
          fields: ["title", "slug", "date", "time"],
          populate: {
            image: { fields: ["url", "formats"] },
            band: { fields: ["id", "slug"] },
          },
          sort: ["updatedAt:desc"],
          pagination: { pageSize: 50 },
        }).catch((e) => {
          console.warn('[Dashboard] team band events failed', bandId, e);
          return { data: [] };
        })
      )
    );

    const seen = new Set(ownedEvents.map((e) => String(e.id)));
    const merged = [...ownedEvents];
    for (const batch of teamEventBatches) {
      for (const row of Array.isArray(batch?.data) ? batch.data : []) {
        if (seen.has(String(row.id))) continue;
        seen.add(String(row.id));
        merged.push(row);
      }
    }

    console.log('[Dashboard] fetchEventsLite success:', merged.length);
    return merged;
  } catch (e) {
    console.error('[Dashboard] fetchEventsLite ERROR:', e);
    return [];
  }
}

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Authoritative Event activation timing, batched per band.
 *
 * Event `date` + `time` carry no timezone, so only the server can say which
 * Events may start Show Mode right now — it resolves the venue zone and returns
 * absolute `opensAt` / `closesAt` instants. One request per band, never one per
 * Event. The browser zone rides along only as the server's last-resort
 * fallback, and it is refetched cheaply because eligibility is presentation.
 */
async function fetchEventActivation(eventRows) {
  const idsByBand = new Map();
  for (const row of Array.isArray(eventRows) ? eventRows : []) {
    const attrs = row.attributes || row;
    const bandRel = attrs.band?.data || attrs.band || null;
    const bandId = bandRel?.id || bandRel?.attributes?.id || null;
    if (!bandId || !row?.id) continue;
    const key = String(bandId);
    if (!idsByBand.has(key)) idsByBand.set(key, []);
    idsByBand.get(key).push(row.id);
  }

  if (!idsByBand.size || !token.value) {
    eventActivationById.value = {};
    return;
  }

  const timezone = browserTimeZone();
  const batches = await Promise.all(
    [...idsByBand.entries()].map(async ([bandId, ids]) => {
      const query = new URLSearchParams({ eventIds: ids.join(',') });
      if (timezone) query.set('timezone', timezone);
      try {
        const response = await fetch(
          `${config.public.strapiUrl}/api/bands/${bandId}/show-mode?${query.toString()}`,
          { headers: { Authorization: `Bearer ${token.value}` } }
        );
        if (!response.ok) return [];
        const body = await response.json();
        return Array.isArray(body?.data?.eventActivation) ? body.data.eventActivation : [];
      } catch (e) {
        console.warn('[Dashboard] event activation fetch failed', bandId, e);
        return [];
      }
    })
  );

  eventActivationById.value = indexServerActivation(batches.flat());
}

// Keep your existing scans fetch (ideally replace with a /scans/count route)
async function fetchScansForQrIds(qrIds) {
  if (!qrIds.length) return [];
  const resp = await find("scans", {
    filters: { qr: { id: { $in: qrIds } } },
    pagination: { pageSize: 250 }, // reduce from 1000 for now
    populate: [], // no deep populate
  });
  return Array.isArray(resp.data) ? resp.data : [];
}

// Open delete confirmation modal
const deleteItem = (id, type) => {
  // Find the item to get its name and image
  let item = null;
  if (type === 'qr') {
    item = qrItems.value.find(q => q.id === id);
  } else if (type === 'band') {
    item = bandItems.value.find(b => b.id === id);
  } else if (type === 'event') {
    item = eventItems.value.find(e => e.id === id);
  }

  deleteTarget.value = {
    id,
    type,
    name: item?.title || 'Untitled',
    image: item?.imageUrl || '',
  };
  showDeleteModal.value = true;
};

// Actually perform the delete after confirmation
const confirmDelete = async ({ id, type }) => {
  try {
    await client(`/${type}s/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${useStrapiToken().value}` },
    });
    
    // Reset modal state and close it
    if (deleteModalRef.value) {
      deleteModalRef.value.resetDeleting();
    }
    showDeleteModal.value = false;
    
    // Refresh the data
    await fetchData();
    
    // Show success toast
    const typeLabels = { qr: 'QR Code', band: 'Artist Page', event: 'Event' };
    toastMessage.value = `✅ ${typeLabels[type] || type} deleted successfully`;
    showToast.value = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      showToast.value = false;
    }, 3000);
  } catch (e) {
    console.error(e);
    // Reset the modal's deleting state
    if (deleteModalRef.value) {
      deleteModalRef.value.resetDeleting();
    }
    toastMessage.value = `❌ Failed to delete. Please try again.`;
    showToast.value = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      showToast.value = false;
    }, 3000);
  }
};

const qrItems = computed(() =>
  qrs.value.map((qr) => {
    // Handle both Strapi v4 (nested attributes) and v5 (flat) response formats
    const attrs = qr.attributes || qr;
    const qImage = attrs.q_image?.data?.attributes || attrs.q_image || null;
    return {
      id: qr.id,
      title: attrs.name,
      imageUrl: qImage?.url || "",
      raw: qr,
      isShared: !!qr.__shared,
    };
  })
);

const bandItems = computed(() =>
  Array.isArray(bands.value)
    ? bands.value.map((b) => {
        // Handle both Strapi v4 (nested attributes) and v5 (flat) response formats
        const attrs = b.attributes || b;
        const bandImg = attrs.bandImg?.data?.attributes || attrs.bandImg || null;
        const access = bandAccessById.value[String(b.id)] || { role: 'owner', isOwner: true };
        return {
          id: b.id,
          title: attrs.name,
          name: attrs.name,
          slug: attrs.slug,
          imageUrl: bandImg?.formats?.medium?.url || bandImg?.url || "",
          bandImg: bandImg ? { url: bandImg.url } : null,
          isBandNameInLogo: attrs.isBandNameInLogo ?? false,
          stripeAccountId: attrs.stripeAccountId ?? null,
          paymentsEnabled: attrs.paymentsEnabled ?? null,
          stripeOnboardingComplete: attrs.stripeOnboardingComplete ?? null,
          accessRole: access.role || 'owner',
          isOwner: access.isOwner !== false,
          canEdit: access.permissions
            ? !!access.permissions.editBand
            : access.role !== 'viewer',
          canManageTeam: !!access.permissions?.manageTeam,
          canManagePayments: !!access.permissions?.managePayments,
          canDeleteBand: !!access.permissions?.deleteBand,
          canViewFanPII: !!access.permissions?.viewFanPII,
          canSendFanMessages: access.permissions
            ? !!access.permissions.sendFanMessages
            : access.isOwner !== false,
          // Prefer explicit manageFanList when present; older API payloads
          // without the key still treat owners as able to manage the list.
          canManageFanList: access.permissions?.manageFanList != null
            ? !!access.permissions.manageFanList
            : access.isOwner !== false,
          canOperateShowMode: access.permissions
            ? !!access.permissions.operateShowMode
            : access.role !== 'viewer',
          showModeStatus: attrs.showModeStatus || 'off',
          showModeEnabled: !!attrs.showModeEnabled,
          showModeEventId: attrs.showModeEventId || null,
        };
      })
    : []
);

/**
 * `?bandId=` is a navigation hint. `bandItems` comes from
 * /api/me/band-access, so a hint can only ever resolve to a band this user is
 * already authorized for; anything else falls through to the picker.
 */
const workspace = computed(() =>
  resolveDashboardWorkspace(bandItems.value, route.query.bandId)
);
const activeBand = computed(() => workspace.value.band);
const createEventTo = computed(() => newEventPathForBand(activeBand.value?.id));
const isActiveBandOwner = computed(() => !!activeBand.value?.isOwner);
const isScopedWorkspace = computed(
  () => workspace.value.mode === DASHBOARD_WORKSPACE.SCOPED
);
const showPicker = computed(
  () => !loading.value && workspace.value.mode === DASHBOARD_WORKSPACE.PICKER
);

/** Scoped workspaces show only their own artist page. */
const workspaceBands = computed(() =>
  isScopedWorkspace.value && activeBand.value ? [activeBand.value] : bandItems.value
);

const workspaceEvents = computed(() =>
  isScopedWorkspace.value && activeBand.value
    ? scopeEventsToBand(eventItems.value, activeBand.value.id)
    : eventItems.value
);

// Strip an unusable ?bandId= rather than silently opening a different band.
watch(
  () => workspace.value.redirect,
  (redirect) => {
    if (redirect) router.replace(redirect);
  },
  { immediate: true }
);

/**
 * Remember the opened workspace so tools reached without a ?bandId= — a
 * bookmark, a back button, a link we do not own — resolve to this artist
 * instead of the first one. Still only a hint: every destination revalidates
 * it against /api/me/band-access.
 */
watch(
  () => (isScopedWorkspace.value ? activeBand.value?.id : null),
  (id) => {
    if (id != null) writeStoredActiveBandId(id);
  },
  { immediate: true }
);

// Choosing "Switch artist" must not leave the old band behind as a hint.
watch(showPicker, (visible) => {
  if (visible) writeStoredActiveBandId(null);
});

/**
 * Show Mode owns its status poll; the dashboard only mirrors it to decide
 * whether that card outranks Artist Pages. No second fetch, no second source.
 */
const showModeLeads = ref(false);
function onShowModeStatus(status) {
  showModeLeads.value = showModeTakesPriority(status);
  liveShowMode.value = {
    isLive: !!status?.isLive,
    isScheduled: !!status?.isScheduled,
    eventId: status?.eventId || null,
  };
}

function formatEventContext(dateValue) {
  if (!dateValue) return '';
  const day = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const parsed = day
    ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
    : new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function bandShowModeState(bandId) {
  // Only the active band has a mounted ShowModeCard emitting live status.
  const active = activeBand.value;
  if (active && String(active.id) === String(bandId) && liveShowMode.value.isLive) {
    return {
      isLive: true,
      eventId: liveShowMode.value.eventId,
    };
  }
  const band = bandItems.value.find((row) => String(row.id) === String(bandId));
  return {
    isLive: !!band && band.showModeEnabled && band.showModeStatus === 'live',
    eventId: band?.showModeEventId || null,
  };
}

onUnmounted(() => {
  if (activationClockTimer) clearInterval(activationClockTimer);
  activationClockTimer = null;
});

function scrollToShowMode() {
  if (typeof document === 'undefined') return;
  document.getElementById('dashboard-show-mode')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

/** Another session is live: offer to manage it, never to replace it. */
function onEventShowModeConflictClick(ev) {
  eventShowModeNotice.value = {
    eventId: ev.id,
    message: 'Show Mode is already live for another show.',
    action: 'manage',
  };
  scrollToShowMode();
}

async function onEventShowModeClick(ev) {
  if (!ev?.canOperateShowMode || !ev.bandId) return;
  // One tap, one campaign. The disabled attribute is not a guarantee.
  if (startingShowModeEventId.value != null) return;
  eventShowModeNotice.value = null;
  if (ev.showModeLiveForEvent) {
    scrollToShowMode();
    return;
  }
  // Only an open activation window may mint a session. The backend enforces
  // the same rule; this keeps a stale render from firing a doomed request.
  if (ev.showModeControl?.kind !== EVENT_SHOW_MODE_CONTROL.START) {
    if (ev.showModeControl?.hint) {
      eventShowModeNotice.value = {
        eventId: ev.id,
        message: ev.showModeControl.hint,
        action: null,
      };
    }
    return;
  }
  if (ev.bandShowModeActive) {
    eventShowModeNotice.value = {
      eventId: ev.id,
      message: 'Show Mode is already active.',
      action: 'manage',
    };
    return;
  }

  startingShowModeEventId.value = ev.id;
  try {
    const timezone = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
      } catch {
        return null;
      }
    })();
    const response = await fetch(`${config.public.strapiUrl}/api/bands/${ev.bandId}/show-mode/from-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ eventId: ev.id, timezone }),
    });
    const body = await response.json().catch(() => null);
    if (response.status === 409 || body?.error?.name === 'already_live') {
      eventShowModeNotice.value = {
        eventId: ev.id,
        message: body?.error?.message || 'Show Mode is already active.',
        action: 'manage',
      };
      showModeRefreshTick.value += 1;
      return;
    }
    if (!response.ok) {
      // The server is the authority. Surface its refusal, leave local live
      // state alone, and re-read the authoritative window so the card corrects
      // itself instead of offering the same doomed tap.
      fetchEventActivation(events.value);
      throw new Error(body?.error?.message || 'Could not start Show Mode');
    }
    const band = bands.value.find((row) => String(row.id) === String(ev.bandId));
    if (band) {
      const attrs = band.attributes || band;
      attrs.showModeStatus = 'live';
      attrs.showModeEnabled = true;
      attrs.showModeEventId = ev.id;
    }
    showModeRefreshTick.value += 1;
    scrollToShowMode();
  } catch (err) {
    eventShowModeNotice.value = {
      eventId: ev.id,
      message: err?.message || 'Could not start Show Mode',
      action: null,
    };
  } finally {
    startingShowModeEventId.value = null;
  }
}

/**
 * Docked = Show Mode sits tight under Artist Pages as a utility strip.
 * Null when the card is absent, so Artist Pages keeps its normal section gap.
 */
const primaryLayoutClass = computed(() => {
  if (!hasBand.value || !activeBand.value?.id) return null;
  return showModeLeads.value ? 'show-mode-leads' : 'show-mode-docked';
});
const canSendFanMessages = computed(() => {
  if (!activeBand.value) return false;
  if (activeBand.value.canSendFanMessages != null) return !!activeBand.value.canSendFanMessages;
  return !!activeBand.value.isOwner;
});
const canManageFanList = computed(() => {
  if (!activeBand.value) return false;
  if (activeBand.value.canManageFanList != null) return !!activeBand.value.canManageFanList;
  return !!activeBand.value.isOwner;
});

const { openPayoutSetup, fetchPayoutStatus, onBackFromStripe } = usePayoutSetup();
// What to show after Stripe sends the artist back (or setup fails to open).
const payoutNotice = ref(null); // { bandId, notice }
const payoutNoticeError = ref("");

onBackFromStripe(() => {
  payoutLoadingId.value = null;
});

async function startPayoutOnboarding(bandId) {
  payoutLoadingId.value = bandId;
  payoutNoticeError.value = "";
  try {
    await openPayoutSetup(bandId, "dashboard");
    return; // stays loading while the browser leaves for Stripe
  } catch (e) {
    const band = bandItems.value.find((b) => String(b.id) === String(bandId));
    payoutNotice.value = {
      bandId,
      notice: {
        tone: "action",
        title: band?.title ? `Payout setup for ${band.title} didn't open` : "Payout setup didn't open",
        body: "Nothing was changed. Try again in a moment.",
        actionLabel: "Try again",
        action: "setup",
      },
    };
    payoutNoticeError.value = e?.message && /session/i.test(e.message) ? e.message : "";
  }
  payoutLoadingId.value = null;
}

/** Back from Stripe (?bandId=…&payouts=return|refresh): check status with the server and say what's next. */
async function handlePayoutReturn() {
  const kind = payoutReturnKind(route.query);
  const bandId = route.query.bandId;
  if (!kind || !bandId) return;
  const { payouts, ...rest } = route.query;
  router.replace({ path: route.path, query: rest });

  const band = bandItems.value.find((b) => String(b.id) === String(bandId));
  if (!band) return;
  const status = await fetchPayoutStatus(bandId);
  const raw = bands.value.find((b) => String(b.id) === String(bandId));
  if (status && raw) {
    // Mirror the fresh flags so the band's badge matches the message.
    const attrs = raw.attributes || raw;
    attrs.paymentsEnabled = status.paymentsEnabled;
    attrs.stripeOnboardingComplete = status.stripeOnboardingComplete;
  }
  const stage = status?.stage
    || stageFromFlags({ stripeAccountId: band.stripeAccountId, stripeOnboardingComplete: band.stripeOnboardingComplete, paymentsEnabled: band.paymentsEnabled });
  payoutNotice.value = {
    bandId,
    notice: payoutReturnNotice(stage, {
      bandName: band.title,
      expired: kind === "refresh",
      // Only a fresh answer from Stripe may say "ready" (or anything else).
      verified: status?.checkedWithStripe === true || status?.stage === "not_started",
    }),
  };
}

function onPayoutNoticeAction(action) {
  const bandId = payoutNotice.value?.bandId;
  if (!bandId) return;
  if (action === "options") router.push(`/editband/${bandId}#setup-support`);
  else if (action === "setup") startPayoutOnboarding(bandId);
}

function dismissPayoutNotice() {
  payoutNotice.value = null;
  payoutNoticeError.value = "";
}

const eventItems = computed(() => sortDashboardEvents(
  events.value.map((ev) => {
    // Handle both Strapi v4 (nested attributes) and v5 (flat) response formats
    const attrs = ev.attributes || ev;
    const image = attrs.image?.data?.attributes || attrs.image || null;
    const bandRel = attrs.band?.data || attrs.band || null;
    const bandAttrs = bandRel?.attributes || bandRel || null;
    const bandId = bandRel?.id || bandAttrs?.id || null;
    const access = bandAccessById.value[String(bandId)] || { role: 'owner', isOwner: true };
    const canOperateShowMode = !!bandId && (access.permissions
      ? !!access.permissions.operateShowMode
      : access.role !== 'viewer');
    const showState = bandShowModeState(bandId);
    const dateLine = formatEventContext(attrs.date);
    const showModeLiveForEvent = showState.isLive && Number(showState.eventId) === Number(ev.id);
    const date = attrs.date || null;
    const time = attrs.time || null;
    return {
      id: ev.id,
      title: attrs.title,
      slug: attrs.slug,
      date,
      time,
      contextLine: dateLine || 'Event',
      bandSlug: bandAttrs?.slug || null,
      bandId,
      imageUrl: image?.url || "",
      canOperateShowMode,
      bandShowModeActive: showState.isLive,
      showModeLiveForEvent,
      showModeControl: eventShowModeControl({
        activation: eventActivationById.value[String(ev.id)] || null,
        nowMs: activationClockMs.value,
        canOperateShowMode,
        isLiveForEvent: showModeLiveForEvent,
        bandSessionLive: showState.isLive && !showModeLiveForEvent,
      }),
    };
  })
));

const viewQr = (img) => {
  imageURL.value = img;
  qrView.value = !qrView.value;
};

const downloadImage = () => {
  const link = document.createElement("a");
  link.href = imageURL.value;
  link.download = "qr.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const imageURL = ref("");
const qrView = ref(false);

onMounted(async () => {
  console.log('[Dashboard] onMounted - user:', user.value?.id, user.value?.email);

  activationClockTimer = setInterval(() => {
    activationClockMs.value = Date.now();
  }, 60 * 1000);
  
  const tok = route.query.token;
  if (typeof tok === "string") {
    setToken(tok);
    await fetchUser();
    router.replace({ path: route.path, query: {} });
  }

  console.log('[Dashboard] About to call fetchData');
  await fetchData(); // show lists first
  console.log('[Dashboard] fetchData complete, bands:', bands.value?.length, 'qrs:', qrs.value?.length);
  handlePayoutReturn();
  fetchPulse(); // fetch pulse after bands are loaded

  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  idle(() => {
    fetchBillingInfo();
    fetchTrialInfo();
  });
});

// Re-fetch pulse when the range or the active artist changes.
watch([pulseRange, () => activeBand.value?.id], () => {
  fetchPulse();
});

watch(
  [() => user.value?.id, () => user.value?.email],
  async ([id, email], oldValue) => {
    const [prevId, prevEmail] = Array.isArray(oldValue) ? oldValue : [];
    if (!id) return;
    if (id !== prevId || email !== prevEmail) {
      await fetchData();
    }
  },
  { immediate: true }
);

const editItem = (id, page) => {
  router.push(`/${page}/${id}`);
};

// Billing A: the trial banner sends the consent its server terms required (or null).
const trialBannerRef = ref(null);
async function goToBillingPortal(payload = {}) {
  if (!token.value) {
    return alert("You must be logged in.");
  }
  loadingPortal.value = true;
  try {
    const { url } = await client("/stripe/create-billing-portal-session", {
      method: "POST",
      headers: { Authorization: `Bearer ${token.value}` },
      body: payload?.consent ? { consent: payload.consent } : {},
    });
    window.location.href = url;
  } catch (err) {
    console.error("[Dashboard] billing-portal error", err);
    // Consent missing or stale: the banner shows the server's current terms again, unticked.
    if (trialBannerRef.value?.handleRefusal?.(err)) return;
    alert("Could not open billing portal. Please try again.");
  } finally {
    loadingPortal.value = false;
  }
}
</script>

<style scoped lang="css">
/* Toast animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/*
 * Artist Pages vs Show Mode ordering. Swapping in CSS keeps ShowModeCard
 * mounted, so its status poll and recap state survive a show going live.
 */
.dashboard-primary {
  display: flex;
  flex-direction: column;
}

.dashboard-primary > * {
  order: 2;
}

.dashboard-primary > .primary-lead {
  order: 1;
}

.dashboard-primary > .primary-follow {
  order: 3;
}

/*
 * Inactive Show Mode docks to Artist Pages: a tight 12px gap reads as "part of
 * the artist product", while the strip keeps the full section gap below it.
 */
.dashboard-primary.show-mode-docked > .dashboard-section {
  margin-bottom: 0.75rem;
}

/* Admin utility, not a product feature. */
.team-access-trailing {
  opacity: 0.85;
}

.team-access-trailing:hover,
.team-access-trailing:focus-within {
  opacity: 1;
}

/* Dashboard Section */
.dashboard-section {
  background: var(--fq-surface, #0B0C10);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  border-radius: 1rem;
  overflow: hidden;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
}

@media (min-width: 640px) {
  .section-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.section-content {
  padding: 1.5rem;
}

/* Create Button */
.create-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  text-decoration: none;
}

.create-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* Item Card */
.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.item-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

@media (min-width: 640px) {
  .item-card {
    flex-direction: row;
    gap: 1.25rem;
  }
}

/* Image with skeleton */
.item-image-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.item-image-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.item-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.item-image.loaded {
  opacity: 1;
}

/* Item Info */
.item-info {
  flex: 1;
  min-width: 0;
  text-align: center;
}

@media (min-width: 640px) {
  .item-info {
    text-align: left;
  }
}

.item-title {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  word-break: break-word;
}

.item-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.item-show-mode-note {
  margin: 0.45rem 0 0;
  color: rgba(247, 249, 252, 0.62);
  font-size: 0.75rem;
  line-height: 1.4;
}

.item-show-mode-note__link {
  display: inline;
  margin-left: 0.35rem;
  padding: 0;
  border: 0;
  background: none;
  color: #39d5ff;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.action-btn-show-mode {
  color: #9be8ff;
  border-color: rgba(57, 213, 255, 0.28);
  background: rgba(57, 213, 255, 0.08);
}

.action-btn-show-mode.is-live {
  color: #7bf1ca;
  border-color: rgba(69, 227, 174, 0.32);
  background: rgba(69, 227, 174, 0.08);
}

/* Upcoming event, activation window not open yet. Reads as status, not action. */
.action-btn-show-mode-waiting {
  color: rgba(255, 255, 255, 0.52);
  border-color: rgba(255, 255, 255, 0.08);
  background: transparent;
  cursor: default;
}

.action-btn-show-mode-waiting::after {
  content: '';
  display: none;
}

/* Eligible event, but another session owns the night. Manage, never replace. */
.action-btn-show-mode-conflict {
  color: rgba(255, 214, 140, 0.9);
  border-color: rgba(255, 196, 88, 0.22);
  background: rgba(255, 196, 88, 0.06);
}

/* Historical event. A label, deliberately not a control. */
.item-show-mode-past {
  display: inline-flex;
  align-items: center;
  color: rgba(247, 249, 252, 0.4);
  font-size: 0.75rem;
  letter-spacing: 0.01em;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-success {
  background: rgba(16, 185, 129, 0.15);
  color: rgb(52, 211, 153);
}
.status-success .status-dot {
  background: rgb(52, 211, 153);
}

.status-warning {
  background: rgba(245, 158, 11, 0.15);
  color: rgb(251, 191, 36);
}
.status-warning .status-dot {
  background: rgb(251, 191, 36);
}

.status-neutral {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}
.status-neutral .status-dot {
  background: rgba(255, 255, 255, 0.4);
}

/* Item Actions */
.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1rem;
}

@media (min-width: 640px) {
  .item-actions {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    width: auto;
    margin-top: 0;
  }
}

.action-btn-labeled {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  width: 100%;
}

.action-btn-labeled span {
  flex: 1;
  text-align: left;
  margin-left: 0.75rem;
}

.action-btn-labeled::after {
  content: '›';
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 0.5rem;
}

.action-btn-labeled.text-red-400::after {
  content: '';
}

@media (min-width: 640px) {
  .action-btn-labeled {
    display: inline-flex;
    justify-content: center;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    width: auto;
  }
  
  .action-btn-labeled span {
    margin-left: 0.375rem;
    text-align: center;
  }
  
  .action-btn-labeled::after {
    content: '';
    display: none;
  }
}

.action-btn-labeled:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn-labeled:active:not(:disabled) {
  transform: scale(0.98);
}

.action-btn-labeled:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
