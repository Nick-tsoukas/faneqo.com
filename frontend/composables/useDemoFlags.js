/**
 * Demo Flags Composable
 * 
 * Provides runtime control over Smart Link Live Surface feature flags
 * via localStorage persistence. Only accessible to whitelisted demo users.
 */

import { ref, computed, watch } from 'vue'
import { useStrapiUser } from '#imports'
import * as configFlags from '@/config/smartLinkFeatureFlags'

// Storage key for localStorage
const STORAGE_KEY = 'mbq_demo_flags_v1'

// Whitelisted demo users
const DEMO_USER_EMAILS = [
  'nick.tsoukas101@gmail.com',
  'test101@gmail.com',
]

// Flag definitions with metadata for UI
export const FLAG_DEFINITIONS = {
  // Master + Demo
  SMARTLINK_LIVE_SURFACE_ENABLED: {
    key: 'SMARTLINK_LIVE_SURFACE_ENABLED',
    label: 'Live Surface Enabled',
    description: 'Master switch for all Live Surface features',
    group: 'master',
    default: configFlags.SMARTLINK_LIVE_SURFACE_ENABLED,
  },
  DEMO_FEED_ENABLED: {
    key: 'DEMO_FEED_ENABLED',
    label: 'Demo Feed Data',
    description: 'Show demo data when real data is missing',
    group: 'master',
    default: configFlags.DEMO_FEED_ENABLED,
  },
  
  // V1 Modules
  SMARTLINK_SHOW_NOW_BANNER: {
    key: 'SMARTLINK_SHOW_NOW_BANNER',
    label: 'NOW Banner',
    description: 'Contextual status banner (Live Tonight, On Tour, etc.)',
    group: 'v1',
    default: configFlags.SMARTLINK_SHOW_NOW_BANNER,
  },
  SMARTLINK_SHOW_LIVE_FEED: {
    key: 'SMARTLINK_SHOW_LIVE_FEED',
    label: 'Live Feed',
    description: 'Micro-signals showing recent activity',
    group: 'v1',
    default: configFlags.SMARTLINK_SHOW_LIVE_FEED,
  },
  SMARTLINK_SHOW_PAGE_MODES: {
    key: 'SMARTLINK_SHOW_PAGE_MODES',
    label: 'Page Modes',
    description: 'State machine affecting CTA emphasis',
    group: 'v1',
    default: configFlags.SMARTLINK_SHOW_PAGE_MODES,
  },
  SMARTLINK_SHOW_CONTINUE_CHIP: {
    key: 'SMARTLINK_SHOW_CONTINUE_CHIP',
    label: 'Continue Chip',
    description: '"Continue on YouTube" for returning visitors',
    group: 'v1',
    default: configFlags.SMARTLINK_SHOW_CONTINUE_CHIP,
  },
  SMARTLINK_SHOW_FAN_TOASTS: {
    key: 'SMARTLINK_SHOW_FAN_TOASTS',
    label: 'Fan Toasts',
    description: 'Recognition toasts after key actions',
    group: 'v1',
    default: configFlags.SMARTLINK_SHOW_FAN_TOASTS,
  },
  SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR: {
    key: 'SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR',
    label: 'Support Module',
    description: 'Consolidated payment section with quick tips',
    group: 'v1',
    default: configFlags.SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR,
  },
  
  // V2 Modules
  SMARTLINK_V2_ENABLED: {
    key: 'SMARTLINK_V2_ENABLED',
    label: 'V2 Features Enabled',
    description: 'Enable V2 optional features',
    group: 'v2',
    default: configFlags.SMARTLINK_V2_ENABLED,
  },
  SMARTLINK_SHOW_MOMENT_BADGES: {
    key: 'SMARTLINK_SHOW_MOMENT_BADGES',
    label: 'Moment Badges',
    description: 'Small chips under NOW banner',
    group: 'v2',
    default: configFlags.SMARTLINK_SHOW_MOMENT_BADGES,
  },
  SMARTLINK_SHOW_SHOW_DAY_HEADER: {
    key: 'SMARTLINK_SHOW_SHOW_DAY_HEADER',
    label: 'Show Day Header',
    description: 'Compact strip on show days',
    group: 'v2',
    default: configFlags.SMARTLINK_SHOW_SHOW_DAY_HEADER,
  },
  SMARTLINK_SHOW_MOMENT_SHARE_CARD: {
    key: 'SMARTLINK_SHOW_MOMENT_SHARE_CARD',
    label: 'Moment Share Card',
    description: 'Shareable preview card in share section',
    group: 'v2',
    default: configFlags.SMARTLINK_SHOW_MOMENT_SHARE_CARD,
  },
  
  // Demo Overrides (force specific states for demos)
  DEMO_FORCE_MODE: {
    key: 'DEMO_FORCE_MODE',
    label: 'Force Page Mode',
    description: 'Override automatic page mode detection',
    group: 'overrides',
    default: null,
    options: [
      { value: null, label: 'Auto (detect from events)' },
      { value: 'QUIET', label: 'QUIET' },
      { value: 'SHOW_DAY', label: 'SHOW_DAY' },
      { value: 'POST_SHOW', label: 'POST_SHOW' },
    ],
  },
  DEMO_FORCE_NOW_BANNER: {
    key: 'DEMO_FORCE_NOW_BANNER',
    label: 'Force NOW Banner',
    description: 'Override automatic banner state detection',
    group: 'overrides',
    default: null,
    options: [
      { value: null, label: 'Auto (detect from events)' },
      { value: 'SHOW_TONIGHT', label: 'SHOW_TONIGHT' },
      { value: 'POST_SHOW_THANKS', label: 'POST_SHOW_THANKS' },
      { value: 'NEW_RELEASE', label: 'NEW_RELEASE' },
      { value: 'ON_TOUR', label: 'ON_TOUR' },
      { value: 'QUIET_DEFAULT', label: 'QUIET_DEFAULT' },
    ],
  },
}

// Singleton state (shared across all useDemoFlags() calls)
const demoFlags = ref(null)
const initialized = ref(false)

/**
 * Get default flags from config
 */
function getDefaultFlags() {
  const defaults = {}
  for (const def of Object.values(FLAG_DEFINITIONS)) {
    defaults[def.key] = def.default
  }
  return defaults
}

/**
 * Load flags from localStorage, falling back to config defaults
 */
function loadFlags() {
  if (typeof window === 'undefined') {
    demoFlags.value = getDefaultFlags()
    return
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle new flags
      demoFlags.value = { ...getDefaultFlags(), ...parsed }
    } else {
      demoFlags.value = getDefaultFlags()
    }
  } catch (e) {
    console.warn('[useDemoFlags] Failed to load from localStorage:', e)
    demoFlags.value = getDefaultFlags()
  }
  
  initialized.value = true
}

/**
 * Save current flags to localStorage
 */
function saveFlags() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoFlags.value))
  } catch (e) {
    console.warn('[useDemoFlags] Failed to save to localStorage:', e)
  }
}

/**
 * Reset flags to config defaults and clear localStorage
 */
function resetFlags() {
  demoFlags.value = getDefaultFlags()
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('[useDemoFlags] Failed to clear localStorage:', e)
    }
  }
}

/**
 * Set a single flag value
 */
function setFlag(key, value) {
  if (!demoFlags.value) loadFlags()
  demoFlags.value[key] = value
  saveFlags()
}

/**
 * Get a single flag value
 */
function getFlag(key) {
  if (!demoFlags.value) loadFlags()
  return demoFlags.value?.[key] ?? FLAG_DEFINITIONS[key]?.default ?? false
}

/**
 * Main composable
 */
export function useDemoFlags() {
  const user = useStrapiUser()
  
  // Check if current user is a demo user
  const isDemoUser = computed(() => {
    if (!user.value?.email) return false
    const email = String(user.value.email).toLowerCase().trim()
    return DEMO_USER_EMAILS.includes(email)
  })
  
  // Initialize on first use
  if (!initialized.value) {
    loadFlags()
  }
  
  // Auto-save when flags change
  watch(demoFlags, () => {
    if (initialized.value) {
      saveFlags()
    }
  }, { deep: true })
  
  // Computed helpers for common checks
  const isMasterEnabled = computed(() => getFlag('SMARTLINK_LIVE_SURFACE_ENABLED'))
  const isV2Enabled = computed(() => getFlag('SMARTLINK_V2_ENABLED'))
  
  return {
    // State
    demoFlags,
    initialized,
    
    // User check
    isDemoUser,
    
    // Actions
    loadFlags,
    saveFlags,
    resetFlags,
    setFlag,
    getFlag,
    
    // Helpers
    isMasterEnabled,
    isV2Enabled,
    
    // Metadata
    FLAG_DEFINITIONS,
    DEMO_USER_EMAILS,
  }
}

/**
 * Get a flag value (can be called outside of setup)
 * Priority: localStorage > config defaults
 */
export function getDemoFlag(key) {
  // If flags haven't been loaded yet, load them
  if (!initialized.value && typeof window !== 'undefined') {
    loadFlags()
  }
  
  return demoFlags.value?.[key] ?? FLAG_DEFINITIONS[key]?.default ?? configFlags[key] ?? false
}

/**
 * Check if demo flags are being used (localStorage has overrides)
 */
export function hasDemoOverrides() {
  if (typeof window === 'undefined') return false
  
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}
