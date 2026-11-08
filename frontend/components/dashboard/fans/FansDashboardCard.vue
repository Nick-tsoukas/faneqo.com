<template>
  <section id="fan-intelligence" class="dashboard-section mb-8">
    <!-- Header -->
    <div class="section-header bg-gradient-to-r from-pink-600 to-purple-600">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Fan Intelligence</h2>
          <p class="text-white/70 text-sm">
            <span v-if="loading">Loading...</span>
            <span v-else-if="totalFans > 0">{{ totalFans }} fan{{ totalFans !== 1 ? 's' : '' }} · {{ engagedCount }} engaged</span>
            <span v-else>Capture and understand your fans</span>
          </p>
        </div>
      </div>
      <div class="fi-actions">
        <!-- PRIMARY -->
        <NuxtLink
          v-if="canSendMessages && bandId"
          to="/messages"
          class="create-button fi-primary-btn"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>Messages</span>
        </NuxtLink>

        <!-- SECONDARY -->
        <div class="fi-secondary-actions">
          <NuxtLink
            to="/fans/recaps"
            class="header-btn"
            aria-label="Nights"
          >
            <!-- History / archive — not a music note -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Nights</span>
          </NuxtLink>
          <NuxtLink
            to="/fans"
            class="header-btn"
            aria-label="Analytics"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analytics</span>
          </NuxtLink>

          <!-- UTILITY overflow -->
          <div class="relative" ref="utilityMenuRef">
            <button
              type="button"
              class="header-btn header-btn-icon"
              aria-label="More Fan List actions"
              :aria-expanded="utilityMenuOpen"
              aria-haspopup="menu"
              @click.stop="toggleUtilityMenu"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class="sr-only">More actions</span>
            </button>
            <div
              v-if="utilityMenuOpen"
              class="fi-menu"
              role="menu"
              aria-label="Fan List utilities"
            >
              <button
                type="button"
                role="menuitem"
                class="fi-menu-item"
                @click="openImportFromMenu"
              >
                Import Fans
              </button>
              <button
                type="button"
                role="menuitem"
                class="fi-menu-item"
                :disabled="exporting"
                @click="exportFromMenu"
              >
                {{ exporting ? 'Exporting…' : 'Export CSV' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="section-content">
      <!-- Loading State -->
      <div v-if="loading" class="py-8 flex justify-center">
        <div class="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
      </div>

      <!-- Failure State — a failed request must never read as "no fans" -->
      <div v-else-if="loadError" class="empty-state">
        <div class="empty-icon bg-amber-500/20">
          <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 class="text-white font-semibold mt-4">Fan list unavailable</h3>
        <p class="text-white/50 text-sm mt-1 max-w-xs mx-auto">
          We couldn't load your fans just now. This is a loading problem, not an empty fan list.
        </p>
        <button
          type="button"
          class="mt-6 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
          @click="retryLoad"
        >
          Try again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="fans.length === 0 && !activeTab" class="empty-state">
        <div class="empty-icon bg-pink-500/20">
          <svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="text-white font-semibold mt-4">No fans yet</h3>
        <p class="text-white/50 text-sm mt-1 max-w-xs mx-auto">
          Fans who join your list or check in at a show appear here.
        </p>
        <div class="flex items-center justify-center gap-3 mt-6">
          <button
            @click="showImportModal = true"
            class="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
          >
            Import CSV
          </button>
        </div>
      </div>

      <!-- V3: Tabbed Interface -->
      <div v-else>
        <!-- Engagement Tier Tabs -->
        <div class="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          <button
            v-for="tab in engagementTabs"
            :key="tab.key"
            @click="setActiveTab(tab.key)"
            class="tier-tab"
            :class="{ 'active': activeTab === tab.key, [tab.colorClass]: activeTab === tab.key }"
          >
            <span class="tier-dot" :class="tab.dotClass"></span>
            <span class="tier-label">{{ tab.label }}</span>
            <span class="tier-count">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Filters & Sort Row -->
        <div class="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <!-- Search -->
          <div class="relative flex-1 min-w-[180px] max-w-xs">
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="Search fans..."
              class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none focus:border-pink-500/50"
            />
            <svg class="w-4 h-4 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Sort & Filter Controls -->
          <div class="flex items-center gap-2">
            <select
              v-model="sortField"
              @change="loadFans"
              class="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs focus:outline-none focus:border-white/20"
            >
              <option value="subscribedAt">Date Joined</option>
              <option value="engagementScore">Engagement</option>
              <option value="lastSeenAt">Last Active</option>
              <option value="city">City</option>
              <option value="email">Email</option>
            </select>
            <button
              @click="toggleSortOrder"
              class="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg
                class="w-3.5 h-3.5 transition-transform"
                :class="{ 'rotate-180': sortOrder === 'asc' }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Fans List -->
        <div class="space-y-2">
          <div
            v-for="fan in fans"
            :key="fan.id"
            @click="selectFan(fan)"
            class="fan-row cursor-pointer"
            :class="{ 'ring-1 ring-pink-500/50': selectedFan?.id === fan.id }"
          >
            <!-- Engagement Indicator -->
            <div class="flex-shrink-0">
              <div 
                class="w-2 h-2 rounded-full"
                :class="getTierDotClass(fan.engagementTier)"
              ></div>
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-white font-medium text-sm truncate">
                  {{ fan.firstName || fan.email.split('@')[0] }}
                </p>
                <span v-if="fan.isFaneqoMember" class="fi-member">Faneqo Member ✓</span>
              </div>
              <p class="text-white/50 text-xs mt-0.5 truncate">
                {{ fanContext(fan) }}
              </p>
            </div>
            
            <div class="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
              <span 
                class="text-xs px-1.5 py-0.5 rounded-full"
                :class="getTierBadgeClass(fan.engagementTier)"
              >
                {{ formatTierLabel(fan.engagementTier) }}
              </span>
              <button
                v-if="canSendMessages && fan.canDirectMessage"
                type="button"
                class="fi-msg-btn"
                :disabled="messagingFanId === fan.id"
                @click.stop="messageFan(fan)"
              >
                Message
              </button>
              <span v-else-if="canSendMessages && !fan.isFaneqoMember" class="fi-not-member">
                Not on Faneqo yet
              </span>
              <span
                v-if="messageError && messagingFanId === null && lastMessageErrorFanId === fan.id"
                class="fi-msg-error"
              >
                {{ messageError.body }}
              </span>
            </div>

            <!-- Per-fan actions (expandable later: View Fan, Note, Segment, Message) -->
            <div
              v-if="canManageFanList"
              class="relative flex-shrink-0"
              @click.stop
            >
              <button
                type="button"
                class="fan-row-menu-btn"
                title="Fan actions"
                :aria-label="`Actions for ${fan.firstName || fan.email}`"
                :aria-expanded="openFanMenuId === fan.id"
                aria-haspopup="menu"
                @click.stop="toggleFanMenu(fan.id)"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              <div
                v-if="openFanMenuId === fan.id"
                class="fi-menu fi-menu-right"
                role="menu"
                :aria-label="`Fan actions for ${fan.firstName || fan.email}`"
              >
                <button
                  type="button"
                  role="menuitem"
                  class="fi-menu-item fi-menu-item-danger"
                  @click="requestRemoveFan(fan)"
                >
                  Remove from Fan List
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.pageCount > 1" class="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5">
          <button
            @click="goToPage(pagination.page - 1)"
            :disabled="pagination.page <= 1"
            class="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-white/50 text-sm px-2">
            {{ pagination.page }} / {{ pagination.pageCount }}
          </span>
          <button
            @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.pageCount"
            class="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Fan Detail Slide Panel -->
    <Teleport to="body">
      <Transition name="slide">
        <div v-if="selectedFan" class="fan-detail-overlay" @click.self="closeFanDetail">
          <div class="fan-detail-panel">
            <!-- Panel Header (sticky so close button is always reachable) -->
            <div class="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 z-10 bg-[rgba(30,30,40,0.98)]">
              <h3 class="text-white font-semibold">Fan Profile</h3>
              <button @click="closeFanDetail" class="p-2 -mr-1 rounded-lg hover:bg-white/10 bg-white/5 text-white/80 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Panel Content -->
            <div v-if="loadingDetail" class="p-8 flex justify-center">
              <div class="w-6 h-6 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
            <div v-else-if="fanDetail" class="p-4 space-y-6 overflow-y-auto flex-1">
              <!-- Fan Identity -->
              <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                  <span class="text-white text-xl font-bold">{{ getInitials(fanDetail) }}</span>
                </div>
                <h4 class="text-white font-semibold text-lg">{{ fanDetail.firstName || fanDetail.email.split('@')[0] }}</h4>
                <p v-if="fanDetail.isFaneqoMember" class="fi-member fi-member--detail">Faneqo Member ✓</p>
                <p class="text-white/60 text-sm">{{ fanDetail.email }}</p>
                <button
                  v-if="canSendMessages && fanDetail.canDirectMessage"
                  type="button"
                  class="fi-msg-btn fi-msg-btn--detail"
                  :disabled="messagingFanId === fanDetail.id"
                  @click="messageFan(fanDetail)"
                >
                  Message
                </button>
                <p v-else-if="canSendMessages && !fanDetail.isFaneqoMember" class="fi-not-member mt-2">
                  Not on Faneqo yet
                </p>
                <p
                  v-if="messageError && lastMessageErrorFanId === fanDetail.id"
                  class="fi-msg-error fi-msg-error--detail"
                >
                  {{ messageError.body }}
                </p>
                <div v-if="fanDetail.city" class="flex items-center justify-center gap-1 mt-1 text-white/50 text-xs">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{{ [fanDetail.city, fanDetail.region, fanDetail.country].filter(Boolean).join(', ') }}</span>
                </div>
              </div>

              <!-- Engagement Score -->
              <div class="bg-white/5 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-white/70 text-sm">Engagement Score</span>
                  <span 
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="getTierBadgeClass(fanDetail.engagementTier)"
                  >
                    {{ formatTierLabel(fanDetail.engagementTier) }}
                  </span>
                </div>
                <div class="flex items-end gap-2">
                  <span class="text-3xl font-bold text-white">{{ fanDetail.engagementScore }}</span>
                  <span class="text-white/50 text-sm mb-1">points</span>
                </div>
                <div class="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all"
                    :class="getTierBarClass(fanDetail.engagementTier)"
                    :style="{ width: `${Math.min(fanDetail.engagementScore, 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-white/5 rounded-lg p-3">
                  <p class="text-white/50 text-xs">Interactions</p>
                  <p class="text-white font-semibold text-lg">{{ fanDetail.interactionCount }}</p>
                </div>
                <div class="bg-white/5 rounded-lg p-3">
                  <p class="text-white/50 text-xs">First Seen</p>
                  <p class="text-white font-semibold text-sm">{{ formatDate(fanDetail.firstSeenAt || fanDetail.subscribedAt) }}</p>
                </div>
              </div>

              <!-- Attendance Intelligence -->
              <div v-if="fanDetail.checkedInShowCount > 0" class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <h5 class="text-emerald-400 text-xs font-medium uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span class="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">✓</span>
                  Verified Attendance
                </h5>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <p class="text-white/50 text-xs">Shows Attended</p>
                    <p class="text-emerald-400 font-bold text-xl">{{ fanDetail.checkedInShowCount }}</p>
                  </div>
                  <div v-if="fanDetail.lastCheckedInAt">
                    <p class="text-white/50 text-xs">Last Check-in</p>
                    <p class="text-white font-semibold text-sm">{{ formatDate(fanDetail.lastCheckedInAt) }}</p>
                  </div>
                </div>
                <div v-if="fanDetail.checkedInShowCount >= 2" class="mt-3 flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    🔁 Repeat Attendee
                  </span>
                </div>
                <div v-if="fanDetail.attendedCities && fanDetail.attendedCities.length > 1" class="mt-2 flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                    🌍 Multi-City Fan
                  </span>
                  <span class="text-white/40 text-xs">{{ fanDetail.attendedCities.join(', ') }}</span>
                </div>
              </div>

              <!-- Capture Context -->
              <div v-if="fanDetail.captureContext || fanDetail.captureSurface" class="bg-white/5 rounded-xl p-4">
                <h5 class="text-white/70 text-xs font-medium uppercase tracking-wide mb-3">How They Found You</h5>
                <div class="space-y-2">
                  <div v-if="fanDetail.captureSurface" class="flex items-center gap-2">
                    <span class="text-white/50 text-sm">Surface:</span>
                    <span class="text-white text-sm">{{ formatSurface(fanDetail.captureSurface) }}</span>
                  </div>
                  <div v-if="fanDetail.captureContext" class="flex items-center gap-2">
                    <span class="text-white/50 text-sm">Context:</span>
                    <span class="text-white text-sm">{{ formatContext(fanDetail.captureContext) }}</span>
                  </div>
                  <div v-if="fanDetail.capturedDuringShowMode" class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">Live Show Capture</span>
                  </div>
                </div>
              </div>

              <!-- Top Actions -->
              <div v-if="fanDetail.topActions?.length" class="bg-white/5 rounded-xl p-4">
                <h5 class="text-white/70 text-xs font-medium uppercase tracking-wide mb-3">Top Actions</h5>
                <div class="space-y-2">
                  <div v-for="action in fanDetail.topActions" :key="action.type" class="flex items-center justify-between">
                    <span class="text-white text-sm">{{ formatActionType(action.type) }}</span>
                    <span class="text-white/50 text-sm">{{ action.count }}x</span>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div v-if="fanDetail.interactionHistory?.length" class="bg-white/5 rounded-xl p-4">
                <h5 class="text-white/70 text-xs font-medium uppercase tracking-wide mb-3">Recent Activity</h5>
                <div class="space-y-3">
                  <div v-for="interaction in fanDetail.interactionHistory.slice(0, 5)" :key="interaction.id" class="flex items-start gap-3">
                    <div class="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 flex-shrink-0"></div>
                    <div class="flex-1 min-w-0">
                      <p class="text-white text-sm">{{ formatActionType(interaction.interactionType) }}</p>
                      <p class="text-white/40 text-xs">{{ formatRelativeTime(interaction.timestamp) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mobile close button at bottom -->
              <button
                @click="closeFanDetail"
                class="w-full py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors sm:hidden"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Import Modal -->
    <FansImportModal
      v-model="showImportModal"
      :band-id="bandId"
      @imported="handleImported"
    />

    <!-- Remove from Fan List confirmation -->
    <Teleport to="body">
      <div
        v-if="fanPendingRemove"
        class="fi-confirm-overlay"
        role="presentation"
        @click.self="cancelRemoveFan"
      >
        <div
          class="fi-confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="fi-remove-title"
          aria-describedby="fi-remove-desc"
        >
          <h3 id="fi-remove-title" class="text-white font-semibold text-base">
            Remove this fan?
          </h3>
          <p id="fi-remove-desc" class="text-white/60 text-sm mt-2 leading-relaxed">
            They will be removed from your active Fan List
            and will no longer receive your fan messages.
          </p>
          <p v-if="fanPendingRemove" class="text-white/40 text-xs mt-3 truncate">
            {{ fanPendingRemove.firstName || fanPendingRemove.email }}
          </p>
          <div class="flex items-center justify-end gap-2 mt-6">
            <button
              type="button"
              class="fi-confirm-cancel"
              :disabled="removingFan"
              @click="cancelRemoveFan"
            >
              Cancel
            </button>
            <button
              type="button"
              class="fi-confirm-danger"
              :disabled="removingFan"
              @click="confirmRemoveFan"
            >
              {{ removingFan ? 'Removing…' : 'Remove Fan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useFans } from '~/composables/useFans';
import FansImportModal from './FansImportModal.vue';
import { inboxErrorCopy, inboxUiLog } from '~/utils/messages/inboxUiLog';

const props = defineProps({
  /**
   * The band this card is showing. Every Fan Intelligence read is scoped to it,
   * so the list, the analytics and the Performance Glance above all describe
   * the same artist. Also required for Message Fans campaigns.
   */
  bandId: {
    type: [Number, String],
    default: null,
  },
  /** Owner-only — Inbox DMs and Email Fans */
  canSendMessages: {
    type: Boolean,
    default: true,
  },
  /** Owner-only (`manageFanList`) — remove from this band's Fan List */
  canManageFanList: {
    type: Boolean,
    default: true,
  },
});

const {
  getFans,
  getFanDetail: fetchFanDetail,
  getAnalytics,
  exportFans,
  generateCSV,
  downloadCSV,
  formatSource,
  formatDate,
  removeFromFanList,
} = useFans();
const { startConversation } = useInbox();
const messagingFanId = ref(null);
/** { title, body } from inboxErrorCopy when a conversation cannot be opened. */
const messageError = ref(null);
/** Which row the message error belongs to, so it shows against that fan. */
const lastMessageErrorFanId = ref(null);

const loading = ref(true);
const loadError = ref(false);
const exporting = ref(false);
const fans = ref([]);
const pagination = ref({ page: 1, pageSize: 10, pageCount: 1, total: 0 });
const sortField = ref('subscribedAt');
const sortOrder = ref('desc');
const showImportModal = ref(false);
const searchQuery = ref('');
const activeTab = ref(null);
const analytics = ref(null);

const utilityMenuOpen = ref(false);
const utilityMenuRef = ref(null);
const openFanMenuId = ref(null);
const fanPendingRemove = ref(null);
const removingFan = ref(false);

// Fan detail panel
const selectedFan = ref(null);
const fanDetail = ref(null);
const loadingDetail = ref(false);

const totalFans = computed(() => pagination.value.total);
const engagedCount = computed(() => {
  if (!analytics.value?.engagementTierBreakdown) return 0;
  const tiers = analytics.value.engagementTierBreakdown;
  return (tiers.warm || 0) + (tiers.engaged || 0) + (tiers.superfan_signal || 0);
});

// Engagement tier tabs
const engagementTabs = computed(() => {
  const tiers = analytics.value?.engagementTierBreakdown || { new: 0, warm: 0, engaged: 0, superfan_signal: 0 };
  return [
    { key: null, label: 'All', count: totalFans.value, colorClass: 'tab-all', dotClass: 'bg-white/50' },
    { key: 'superfan_signal', label: 'Superfans', count: tiers.superfan_signal || 0, colorClass: 'tab-superfan', dotClass: 'bg-yellow-400' },
    { key: 'engaged', label: 'Engaged', count: tiers.engaged || 0, colorClass: 'tab-engaged', dotClass: 'bg-green-400' },
    { key: 'warm', label: 'Warm', count: tiers.warm || 0, colorClass: 'tab-warm', dotClass: 'bg-blue-400' },
    { key: 'new', label: 'New', count: tiers.new || 0, colorClass: 'tab-new', dotClass: 'bg-white/30' },
  ];
});

// Debounced search
let searchTimeout = null;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadFans();
  }, 300);
}

async function loadFans() {
  if (!props.bandId) {
    fans.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const result = await getFans({
      bandId: props.bandId,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      search: searchQuery.value || null,
      engagementTier: activeTab.value || null,
    });
    fans.value = result.data;
    pagination.value = result.meta.pagination;
    loadError.value = false;
  } catch (error) {
    console.error('Failed to load fans:', error);
    fans.value = [];
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

async function loadAnalytics() {
  if (!props.bandId) {
    analytics.value = null;
    return;
  }
  try {
    const result = await getAnalytics(props.bandId);
    analytics.value = result.data;
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

function retryLoad() {
  loadError.value = false;
  loadFans();
  loadAnalytics();
}

function setActiveTab(tabKey) {
  activeTab.value = tabKey;
  pagination.value.page = 1;
  loadFans();
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
  loadFans();
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.pageCount) return;
  pagination.value.page = page;
  loadFans();
}

async function selectFan(fan) {
  selectedFan.value = fan;
  loadingDetail.value = true;
  fanDetail.value = null;
  
  try {
    const result = await fetchFanDetail(fan.id, props.bandId);
    fanDetail.value = result.data;
  } catch (error) {
    console.error('Failed to load fan detail:', error);
  } finally {
    loadingDetail.value = false;
  }
}

function closeFanDetail() {
  selectedFan.value = null;
  fanDetail.value = null;
}

async function handleExport() {
  if (!props.bandId) return;
  exporting.value = true;
  try {
    const result = await exportFans(props.bandId);
    const csv = generateCSV(result.data);
    downloadCSV(csv, `fans-${new Date().toISOString().split('T')[0]}.csv`);
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    exporting.value = false;
  }
}

function toggleUtilityMenu() {
  openFanMenuId.value = null;
  utilityMenuOpen.value = !utilityMenuOpen.value;
}

function openImportFromMenu() {
  utilityMenuOpen.value = false;
  showImportModal.value = true;
}

async function exportFromMenu() {
  utilityMenuOpen.value = false;
  await handleExport();
}

function toggleFanMenu(fanId) {
  utilityMenuOpen.value = false;
  openFanMenuId.value = openFanMenuId.value === fanId ? null : fanId;
}

function closeMenus() {
  utilityMenuOpen.value = false;
  openFanMenuId.value = null;
}

function onDocumentClick(event) {
  if (utilityMenuOpen.value) {
    if (!utilityMenuRef.value || !utilityMenuRef.value.contains(event.target)) {
      utilityMenuOpen.value = false;
    }
  }
  // Fan row menus use @click.stop on their containers; outside clicks land here.
  if (openFanMenuId.value != null) {
    openFanMenuId.value = null;
  }
}

function onDocumentKeydown(event) {
  if (event.key === 'Escape') {
    if (fanPendingRemove.value) {
      cancelRemoveFan();
      return;
    }
    closeMenus();
  }
}

function requestRemoveFan(fan) {
  openFanMenuId.value = null;
  fanPendingRemove.value = fan;
}

function cancelRemoveFan() {
  if (removingFan.value) return;
  fanPendingRemove.value = null;
}

async function confirmRemoveFan() {
  const fan = fanPendingRemove.value;
  if (!fan?.id || removingFan.value) return;

  removingFan.value = true;
  try {
    await removeFromFanList(fan.id);
    fans.value = fans.value.filter((f) => f.id !== fan.id);
    pagination.value = {
      ...pagination.value,
      total: Math.max(0, (pagination.value.total || 0) - 1),
    };
    if (selectedFan.value?.id === fan.id) {
      closeFanDetail();
    }
    fanPendingRemove.value = null;
    // Refresh analytics / segment counts without a full page reload
    await loadAnalytics();
    // If the page emptied after removal, step back a page when possible
    if (fans.value.length === 0 && pagination.value.page > 1) {
      pagination.value.page -= 1;
      await loadFans();
    }
  } catch (error) {
    console.error('Failed to remove fan:', error);
    alert(error?.message || 'Failed to remove fan from Fan List');
  } finally {
    removingFan.value = false;
  }
}

function handleImported() {
  pagination.value.page = 1;
  loadFans();
  loadAnalytics();
}

// Formatting helpers
function getTierDotClass(tier) {
  const classes = {
    superfan_signal: 'bg-yellow-400',
    engaged: 'bg-green-400',
    warm: 'bg-blue-400',
    new: 'bg-white/30',
  };
  return classes[tier] || 'bg-white/30';
}

function getTierBadgeClass(tier) {
  const classes = {
    superfan_signal: 'bg-yellow-500/20 text-yellow-300',
    engaged: 'bg-green-500/20 text-green-300',
    warm: 'bg-blue-500/20 text-blue-300',
    new: 'bg-white/10 text-white/50',
  };
  return classes[tier] || 'bg-white/10 text-white/50';
}

function getTierBarClass(tier) {
  const classes = {
    superfan_signal: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    engaged: 'bg-gradient-to-r from-green-500 to-emerald-500',
    warm: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    new: 'bg-white/30',
  };
  return classes[tier] || 'bg-white/30';
}

function formatTierLabel(tier) {
  const labels = {
    superfan_signal: 'Superfan',
    engaged: 'Engaged',
    warm: 'Warm',
    new: 'New',
  };
  return labels[tier] || 'New';
}

function fanContext(fan) {
  const parts = [];
  if (fan.city) parts.push(fan.city);
  const tier = formatTierLabel(fan.engagementTier);
  if (tier && tier !== 'New') parts.push(tier);
  const shows = Number(fan.checkedInShowCount) || 0;
  if (shows === 1) parts.push('1 show');
  if (shows >= 2) parts.push(`${shows} shows`);
  return parts.join(' · ') || 'Fan';
}

async function messageFan(fan) {
  if (!props.bandId || !fan?.id || messagingFanId.value) return;
  messagingFanId.value = fan.id;
  messageError.value = null;
  lastMessageErrorFanId.value = null;
  inboxUiLog('conversation:start', { fanId: fan.id, bandId: props.bandId });
  try {
    const result = await startConversation({ bandId: props.bandId, fanId: fan.id });
    const id = result?.conversationId || result?.conversation?.id;
    inboxUiLog('conversation:resolved', { conversationId: id, created: result?.created });
    if (id) {
      await navigateTo(`/messages/inbox/${id}`);
    } else {
      messageError.value = inboxErrorCopy({ status: 409 });
      lastMessageErrorFanId.value = fan.id;
    }
  } catch (err) {
    // A dev-only console line is not feedback. Say why the click did nothing.
    messageError.value = inboxErrorCopy(err);
    lastMessageErrorFanId.value = fan.id;
    inboxUiLog('conversation:start:error', { status: err?.status || err?.statusCode || 'unknown' });
  } finally {
    messagingFanId.value = null;
  }
}

function getInitials(fan) {
  if (fan.firstName) {
    return fan.firstName.charAt(0).toUpperCase();
  }
  return fan.email.charAt(0).toUpperCase();
}

function formatSurface(surface) {
  const labels = {
    band_page: 'Band Page',
    follow_modal: 'Follow Modal',
    qr_poster: 'QR Poster',
    qr_merch_table: 'Merch Table QR',
    qr_stage_screen: 'Stage Screen QR',
    qr_flyer: 'Flyer QR',
    event_page: 'Event Page',
    direct_link: 'Direct Link',
  };
  return labels[surface] || surface || 'Unknown';
}

function formatContext(context) {
  const labels = {
    normal: 'Normal Visit',
    show_mode: 'Live Show',
    event_linked: 'Event Link',
    qr_scan: 'QR Scan',
  };
  return labels[context] || context || 'Unknown';
}

function formatActionType(type) {
  const labels = {
    viewed_band_page: 'Viewed Page',
    viewed_show_mode_page: 'Viewed Show Page',
    opened_follow_modal: 'Opened Follow',
    clicked_spotify: 'Clicked Spotify',
    clicked_apple_music: 'Clicked Apple Music',
    clicked_youtube: 'Clicked YouTube',
    clicked_ticket_link: 'Clicked Tickets',
    clicked_merch: 'Clicked Merch',
    clicked_share: 'Shared',
    clicked_follow: 'Followed',
    clicked_save: 'Saved',
    played_featured_song: 'Played Song',
    clicked_video: 'Watched Video',
    checked_in_show: 'Checked In',
    subscribed: 'Subscribed',
  };
  return labels[type] || type?.replace(/_/g, ' ') || 'Unknown';
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(timestamp);
}

// The dashboard resolves its primary band asynchronously, so the card reloads
// when that id arrives (or changes) rather than firing an unscoped request.
watch(
  () => props.bandId,
  () => {
    pagination.value.page = 1;
    retryLoad();
  }
);

onMounted(() => {
  loadFans();
  loadAnalytics();
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onDocumentKeydown);
});
</script>

<style scoped>
/* Dashboard Section - matches dashboard.vue styles */
.dashboard-section {
  background: var(--fq-surface, #0B0C10);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  border-radius: 1rem;
  overflow: visible;
}

/* V3: Tier Tabs */
.tier-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.tier-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.tier-tab.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.tier-tab.tab-superfan.active {
  background: rgba(234, 179, 8, 0.15);
  border-color: rgba(234, 179, 8, 0.3);
}

.tier-tab.tab-engaged.active {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
}

.tier-tab.tab-warm.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

.tier-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
}

.tier-label {
  font-weight: 500;
}

.tier-count {
  opacity: 0.6;
  font-size: 0.625rem;
}

/* Fan Detail Panel */
.fan-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  justify-content: flex-end;
}

.fan-detail-panel {
  width: 100%;
  max-width: 400px;
  height: 100%;
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(20, 20, 30, 0.98));
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-from .fan-detail-panel,
.slide-leave-to .fan-detail-panel {
  transform: translateX(100%);
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

.create-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* Action hierarchy: primary full-width on mobile, secondary row beneath */
.fi-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  width: 100%;
}

.fi-primary-btn {
  justify-content: center;
  width: 100%;
}

.fi-member {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  color: #39ff14;
  letter-spacing: 0.01em;
}

.fi-member--detail {
  margin: 0.2rem 0 0.35rem;
  font-size: 0.72rem;
}

.fi-not-member {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
}

.fi-msg-error {
  max-width: 12rem;
  margin-top: 0.2rem;
  font-size: 0.65rem;
  line-height: 1.3;
  text-align: right;
  color: #ff9d9d;
}

.fi-msg-error--detail {
  max-width: none;
  text-align: center;
}

.fi-msg-btn {
  margin-top: 0.15rem;
  border: 0;
  background: none;
  color: #39ff14;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 28px;
  padding: 0;
}

.fi-msg-btn:hover,
.fi-msg-btn:focus-visible {
  text-decoration: underline;
  outline: none;
}

.fi-msg-btn:disabled {
  opacity: 0.55;
  cursor: wait;
}

.fi-msg-btn--detail {
  margin-top: 0.65rem;
  min-height: 40px;
  padding: 0.4rem 0.9rem;
  border-radius: 0.7rem;
  background: rgba(57, 255, 20, 0.12);
  text-decoration: none;
}

.fi-secondary-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .fi-actions {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    width: auto;
  }

  .fi-primary-btn {
    width: auto;
  }
}

/* Header Button (secondary) */
.header-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: 0.75rem;
  transition: all 0.2s;
  text-decoration: none;
}

.header-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.header-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-btn-icon {
  padding: 0.5rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.fi-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 30;
  min-width: 10.5rem;
  padding: 0.35rem;
  border-radius: 0.625rem;
  background: rgba(24, 24, 32, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

.fi-menu-right {
  right: 0;
}

.fi-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.75rem;
  border-radius: 0.45rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.fi-menu-item:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
}

.fi-menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fi-menu-item-danger {
  color: #fca5a5;
}

.fi-menu-item-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.12);
  color: #fecaca;
}

.fan-row-menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.15s;
}

.fan-row-menu-btn:hover,
.fan-row-menu-btn:focus-visible {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: white;
  outline: none;
}

.fi-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.fi-confirm-dialog {
  width: 100%;
  max-width: 22rem;
  padding: 1.25rem 1.35rem;
  border-radius: 0.875rem;
  background: linear-gradient(145deg, rgba(36, 36, 48, 0.98), rgba(22, 22, 30, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.fi-confirm-cancel {
  padding: 0.5rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.8125rem;
  font-weight: 500;
}

.fi-confirm-cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.fi-confirm-danger {
  padding: 0.5rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.2);
  color: #fecaca;
  font-size: 0.8125rem;
  font-weight: 600;
}

.fi-confirm-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.32);
}

.fi-confirm-cancel:disabled,
.fi-confirm-danger:disabled {
  opacity: 0.55;
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

/* Fan Row */
.fan-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.fan-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}
</style>
