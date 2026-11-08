/**
 * Smart Link Live Surface Feature Flags
 * 
 * HOW TO DEMO:
 * 1. Set SMARTLINK_LIVE_SURFACE_ENABLED to true to enable all new features
 * 2. Toggle individual module flags to show/hide specific upgrades
 * 3. Set DEMO_FEED_ENABLED to true to show demo data when real data is missing
 * 
 * PRODUCTION:
 * - Keep SMARTLINK_LIVE_SURFACE_ENABLED false until ready for launch
 * - When launching, enable global flag and individual modules as needed
 */

// ============================================
// GLOBAL MASTER SWITCH
// ============================================
// When false, page behaves EXACTLY as it does today (no layout shifts)
export const SMARTLINK_LIVE_SURFACE_ENABLED = false;

// ============================================
// V1 MODULE TOGGLES
// ============================================
// Only active when SMARTLINK_LIVE_SURFACE_ENABLED is true

// NOW Banner - shows contextual status (SHOW_TONIGHT, ON_TOUR, etc.)
export const SMARTLINK_SHOW_NOW_BANNER = false;

// Live Feed - micro-signals showing recent activity
export const SMARTLINK_SHOW_LIVE_FEED = false;

// Page Modes - state machine affecting CTA emphasis and section order
export const SMARTLINK_SHOW_PAGE_MODES = false;

// Continue Chip - "Continue on YouTube" for returning visitors
export const SMARTLINK_SHOW_CONTINUE_CHIP = false;

// Fan Toasts - recognition toasts after key actions
export const SMARTLINK_SHOW_FAN_TOASTS = false;

// Support Module Refactor - consolidated payment section
export const SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR = false;

// ============================================
// DEMO DATA MODE
// ============================================
// When true AND real data is missing/low, shows realistic demo feed
// Should be obvious in code but not visible to users
export const DEMO_FEED_ENABLED = false;

// ============================================
// V2 OPTIONAL FEATURES (future)
// ============================================
export const SMARTLINK_V2_ENABLED = false;  // V2 features disabled

// V2 Module Toggles (only active when V2_ENABLED is true)
export const SMARTLINK_SHOW_MOMENT_BADGES = false;
export const SMARTLINK_SHOW_SHOW_DAY_HEADER = false;
export const SMARTLINK_SHOW_MOMENT_SHARE_CARD = false;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a V1 feature should be shown
 * @param {string} featureFlag - The feature flag constant name
 * @returns {boolean}
 */
export function isV1FeatureEnabled(featureFlag) {
  if (!SMARTLINK_LIVE_SURFACE_ENABLED) return false;
  return featureFlag;
}

/**
 * Check if a V2 feature should be shown
 * @param {string} featureFlag - The feature flag constant name
 * @returns {boolean}
 */
export function isV2FeatureEnabled(featureFlag) {
  if (!SMARTLINK_LIVE_SURFACE_ENABLED) return false;
  if (!SMARTLINK_V2_ENABLED) return false;
  return featureFlag;
}

/**
 * Get all feature flags as an object (useful for debugging)
 */
export function getAllFlags() {
  return {
    global: SMARTLINK_LIVE_SURFACE_ENABLED,
    v1: {
      nowBanner: SMARTLINK_SHOW_NOW_BANNER,
      liveFeed: SMARTLINK_SHOW_LIVE_FEED,
      pageModes: SMARTLINK_SHOW_PAGE_MODES,
      continueChip: SMARTLINK_SHOW_CONTINUE_CHIP,
      fanToasts: SMARTLINK_SHOW_FAN_TOASTS,
      supportModuleRefactor: SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR,
    },
    v2: {
      enabled: SMARTLINK_V2_ENABLED,
      momentBadges: SMARTLINK_SHOW_MOMENT_BADGES,
      showDayHeader: SMARTLINK_SHOW_SHOW_DAY_HEADER,
      momentShareCard: SMARTLINK_SHOW_MOMENT_SHARE_CARD,
    },
    demoFeed: DEMO_FEED_ENABLED,
  };
}
