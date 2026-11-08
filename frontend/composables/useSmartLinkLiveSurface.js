/**
 * Smart Link Live Surface Integration Composable
 * 
 * HOW TO DEMO:
 * 1. Import this composable in the band page
 * 2. Set SMARTLINK_LIVE_SURFACE_ENABLED to true in config/smartLinkFeatureFlags.js
 * 3. Toggle individual module flags as needed
 * 4. Demo data will automatically show when real data is missing
 * 
 * This composable provides:
 * - Feature flag checks
 * - Page mode state machine
 * - Live feed data
 * - All computed values needed for the live surface components
 */

import { computed, ref } from 'vue'
import {
  SMARTLINK_LIVE_SURFACE_ENABLED,
  SMARTLINK_SHOW_NOW_BANNER,
  SMARTLINK_SHOW_LIVE_FEED,
  SMARTLINK_SHOW_PAGE_MODES,
  SMARTLINK_SHOW_CONTINUE_CHIP,
  SMARTLINK_SHOW_FAN_TOASTS,
  SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR,
  SMARTLINK_V2_ENABLED,
  SMARTLINK_SHOW_MOMENT_BADGES,
  SMARTLINK_SHOW_SHOW_DAY_HEADER,
  SMARTLINK_SHOW_MOMENT_SHARE_CARD,
} from '@/config/smartLinkFeatureFlags'
import { useSmartLinkPageMode } from './useSmartLinkPageMode'
import { useSmartLinkLiveFeed } from './useSmartLinkLiveFeed'

/**
 * Main composable for Smart Link Live Surface features
 * @param {Object} options
 * @param {Object} options.bandData - Band data object
 * @param {Array} options.events - Array of event objects
 * @param {Object} options.analyticsData - Optional analytics data
 */
export function useSmartLinkLiveSurface(options = {}) {
  const { bandData = {}, events = [], analyticsData = null } = options

  // ============================================
  // FEATURE FLAG CHECKS
  // ============================================

  const isLiveSurfaceEnabled = computed(() => SMARTLINK_LIVE_SURFACE_ENABLED)

  const showNowBanner = computed(() => {
    return SMARTLINK_LIVE_SURFACE_ENABLED && SMARTLINK_SHOW_NOW_BANNER
  })

  const showLiveFeed = computed(() => {
    return SMARTLINK_LIVE_SURFACE_ENABLED && SMARTLINK_SHOW_LIVE_FEED
  })

  const showPageModes = computed(() => {
    return SMARTLINK_LIVE_SURFACE_ENABLED && SMARTLINK_SHOW_PAGE_MODES
  })

  const showContinueChip = computed(() => {
    return SMARTLINK_LIVE_SURFACE_ENABLED && SMARTLINK_SHOW_CONTINUE_CHIP
  })

  const showFanToasts = computed(() => {
    return SMARTLINK_LIVE_SURFACE_ENABLED && SMARTLINK_SHOW_FAN_TOASTS
  })

  const showSupportModuleRefactor = computed(() => {
    return SMARTLINK_LIVE_SURFACE_ENABLED && SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR
  })

  // V2 Features
  const isV2Enabled = computed(() => {
    return SMARTLINK_LIVE_SURFACE_ENABLED && SMARTLINK_V2_ENABLED
  })

  const showMomentBadges = computed(() => {
    return isV2Enabled.value && SMARTLINK_SHOW_MOMENT_BADGES
  })

  const showShowDayHeader = computed(() => {
    return isV2Enabled.value && SMARTLINK_SHOW_SHOW_DAY_HEADER
  })

  const showMomentShareCard = computed(() => {
    return isV2Enabled.value && SMARTLINK_SHOW_MOMENT_SHARE_CARD
  })

  // ============================================
  // PAGE MODE STATE MACHINE
  // ============================================

  const {
    PAGE_MODES,
    NOW_BANNER_STATES,
    pageMode,
    nowBannerState,
    nowBannerContent,
    nextEvent,
    upcomingEvents,
    hasShowTonight,
    hasRecentShow,
    isOnTour,
    hasNewRelease,
    sectionOrder,
    ctaEmphasis,
  } = useSmartLinkPageMode({
    events,
    bandData,
    analyticsData,
  })

  // ============================================
  // LIVE FEED DATA
  // ============================================

  const {
    feedItems,
    primaryFeedItem,
    hasFeedItems,
    isLoading: isFeedLoading,
    isUsingDemoData,
    fetchFeed,
    FEED_ITEM_TYPES,
  } = useSmartLinkLiveFeed({
    bandId: bandData.id,
    bandName: bandData.name,
    pageMode: pageMode.value,
    analyticsData,
  })

  // ============================================
  // COMPUTED HELPERS
  // ============================================

  // Effective page mode (respects feature flag)
  const effectivePageMode = computed(() => {
    if (!showPageModes.value) return 'QUIET'
    return pageMode.value
  })

  // Should show the show day header (V2)
  const shouldShowShowDayHeader = computed(() => {
    return showShowDayHeader.value && effectivePageMode.value === 'SHOW_DAY' && nextEvent.value
  })

  // Moment type for share card
  const momentShareType = computed(() => {
    if (effectivePageMode.value === 'SHOW_DAY') return 'you_were_here'
    if (effectivePageMode.value === 'POST_SHOW') return 'post_show'
    if (hasFeedItems.value) {
      const primary = primaryFeedItem.value
      if (primary?.type === 'SUPPORT_RECEIVED') return 'support_received'
      if (primary?.type === 'HEATING_UP') return 'heating_up'
    }
    return 'default'
  })

  // ============================================
  // DEBUG INFO
  // ============================================

  const debugInfo = computed(() => ({
    liveSurfaceEnabled: isLiveSurfaceEnabled.value,
    pageMode: pageMode.value,
    effectivePageMode: effectivePageMode.value,
    nowBannerState: nowBannerState.value,
    feedItemCount: feedItems.value?.length || 0,
    isUsingDemoData: isUsingDemoData.value,
    flags: {
      nowBanner: showNowBanner.value,
      liveFeed: showLiveFeed.value,
      pageModes: showPageModes.value,
      continueChip: showContinueChip.value,
      fanToasts: showFanToasts.value,
      supportModule: showSupportModuleRefactor.value,
      v2: isV2Enabled.value,
    },
  }))

  return {
    // Feature Flags
    isLiveSurfaceEnabled,
    showNowBanner,
    showLiveFeed,
    showPageModes,
    showContinueChip,
    showFanToasts,
    showSupportModuleRefactor,
    isV2Enabled,
    showMomentBadges,
    showShowDayHeader,
    showMomentShareCard,

    // Page Mode
    PAGE_MODES,
    NOW_BANNER_STATES,
    pageMode,
    effectivePageMode,
    nowBannerState,
    nowBannerContent,
    sectionOrder,
    ctaEmphasis,

    // Events
    nextEvent,
    upcomingEvents,
    hasShowTonight,
    hasRecentShow,
    isOnTour,
    hasNewRelease,

    // Live Feed
    FEED_ITEM_TYPES,
    feedItems,
    primaryFeedItem,
    hasFeedItems,
    isFeedLoading,
    isUsingDemoData,
    fetchFeed,

    // V2 Helpers
    shouldShowShowDayHeader,
    momentShareType,

    // Debug
    debugInfo,
  }
}
