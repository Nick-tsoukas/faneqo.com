/**
 * MBQ Shareables V1 — Centralized Mappings
 * 
 * SINGLE SOURCE OF TRUTH for all card type definitions, tab mappings, and accent colors.
 * All components must import from here — do NOT duplicate these definitions elsewhere.
 */

/**
 * Card Types Enum
 * All V1 shareable card types + Pulse Moment types
 */
export const CARD_TYPES = {
  // Shareable card types
  CITY_CLAIM: 'CITY_CLAIM',
  MOMENTUM_SURGE: 'MOMENTUM_SURGE',
  AFTER_SHOW_ENERGY: 'AFTER_SHOW_ENERGY',
  NEW_CITY_UNLOCKED: 'NEW_CITY_UNLOCKED',
  RETURNING_FANS: 'RETURNING_FANS',
  SHARE_CHAIN: 'SHARE_CHAIN',
  ENGAGED_SESSIONS: 'ENGAGED_SESSIONS',
  PLATFORM_PULL: 'PLATFORM_PULL',
  PEAK_HOUR: 'PEAK_HOUR',
  MILESTONE_DROP: 'MILESTONE_DROP',
  // Pulse Moment types (real-time surges)
  PULSE_SURGE: 'PULSE_SURGE',
  CITY_HEAT: 'CITY_HEAT',
  MOMENT_MATTERED: 'MOMENT_MATTERED',
}

/**
 * Tab Definitions
 * Ordered list of tabs for the Shareables section
 */
export const TAB_DEFS = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'moments', label: '⚡ Moments' },
  { key: 'recaps', label: 'Recaps' },
  { key: 'spikes', label: 'Spikes' },
  { key: 'prompts', label: 'Prompts' },
]

/**
 * Type → Tab Mapping
 * Maps each card type to its tab category
 * THIS IS THE ONLY PLACE THIS LOGIC SHOULD EXIST
 */
export const TYPE_TO_TAB = {
  [CARD_TYPES.CITY_CLAIM]: 'spikes',
  [CARD_TYPES.MOMENTUM_SURGE]: 'spikes',
  [CARD_TYPES.AFTER_SHOW_ENERGY]: 'recaps',
  [CARD_TYPES.NEW_CITY_UNLOCKED]: 'prompts',
  [CARD_TYPES.RETURNING_FANS]: 'prompts',
  [CARD_TYPES.SHARE_CHAIN]: 'prompts',
  [CARD_TYPES.ENGAGED_SESSIONS]: 'prompts',
  [CARD_TYPES.PLATFORM_PULL]: 'prompts',
  [CARD_TYPES.PEAK_HOUR]: 'spikes',
  [CARD_TYPES.MILESTONE_DROP]: 'prompts',
  // Pulse Moment types → Moments tab
  [CARD_TYPES.PULSE_SURGE]: 'moments',
  [CARD_TYPES.CITY_HEAT]: 'moments',
  [CARD_TYPES.MOMENT_MATTERED]: 'moments',
}

/**
 * Type → Default Accent Mapping
 * Fallback accent colors per card type (API may override)
 */
export const TYPE_TO_ACCENT = {
  [CARD_TYPES.CITY_CLAIM]: 'violet',
  [CARD_TYPES.MOMENTUM_SURGE]: 'blue',
  [CARD_TYPES.AFTER_SHOW_ENERGY]: 'rose',
  [CARD_TYPES.NEW_CITY_UNLOCKED]: 'emerald',
  [CARD_TYPES.RETURNING_FANS]: 'amber',
  [CARD_TYPES.SHARE_CHAIN]: 'blue',
  [CARD_TYPES.ENGAGED_SESSIONS]: 'violet',
  [CARD_TYPES.PLATFORM_PULL]: 'emerald',
  [CARD_TYPES.PEAK_HOUR]: 'amber',
  [CARD_TYPES.MILESTONE_DROP]: 'rose',
  // Pulse Moment types
  [CARD_TYPES.PULSE_SURGE]: 'amber',
  [CARD_TYPES.CITY_HEAT]: 'blue',
  [CARD_TYPES.MOMENT_MATTERED]: 'violet',
}

/**
 * Accent Color Palette
 * Primary colors and glow effects for each accent
 */
export const ACCENT_COLORS = {
  violet: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.3)' },
  blue: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
  emerald: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.3)' },
  amber: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)' },
  rose: { primary: '#F43F5E', glow: 'rgba(244, 63, 94, 0.3)' },
}

/**
 * Default/fallback accent for unknown values
 */
export const DEFAULT_ACCENT = 'violet'

/**
 * Type Metadata
 * Additional info per card type for scoring, sorting, and display
 */
export const TYPE_METADATA = {
  [CARD_TYPES.CITY_CLAIM]: {
    source: 'geo',
    priority: 78,
    family: 'location',
    icon: '📍',
  },
  [CARD_TYPES.MOMENTUM_SURGE]: {
    source: 'growth',
    priority: 80,
    family: 'momentum',
    icon: '⚡',
  },
  [CARD_TYPES.AFTER_SHOW_ENERGY]: {
    source: 'event',
    priority: 85,
    family: 'recap',
    icon: '🎤',
  },
  [CARD_TYPES.NEW_CITY_UNLOCKED]: {
    source: 'geo',
    priority: 82,
    family: 'location',
    icon: '🗺️',
  },
  [CARD_TYPES.RETURNING_FANS]: {
    source: 'engagement',
    priority: 70,
    family: 'loyalty',
    icon: '🔁',
  },
  [CARD_TYPES.SHARE_CHAIN]: {
    source: 'distribution',
    priority: 74,
    family: 'viral',
    icon: '🔗',
  },
  [CARD_TYPES.ENGAGED_SESSIONS]: {
    source: 'engagement',
    priority: 68,
    family: 'attention',
    icon: '🧠',
  },
  [CARD_TYPES.PLATFORM_PULL]: {
    source: 'distribution',
    priority: 72,
    family: 'platform',
    icon: '🎧',
  },
  [CARD_TYPES.PEAK_HOUR]: {
    source: 'timing',
    priority: 66,
    family: 'momentum',
    icon: '⏰',
  },
  [CARD_TYPES.MILESTONE_DROP]: {
    source: 'achievement',
    priority: 90,
    family: 'milestone',
    icon: '🏆',
  },
}

/**
 * Helper: Get tab key for a card type
 * @param {string} type - Card type
 * @returns {string} Tab key
 */
export function getTabForType(type) {
  return TYPE_TO_TAB[type] || 'prompts'
}

/**
 * Helper: Get accent config for a card
 * Falls back to DEFAULT_ACCENT if unknown
 * @param {string} accent - Accent key from card
 * @param {string} type - Card type (for fallback)
 * @returns {{ primary: string, glow: string }}
 */
export function getAccentConfig(accent, type) {
  if (accent && ACCENT_COLORS[accent]) {
    return ACCENT_COLORS[accent]
  }
  const fallbackAccent = TYPE_TO_ACCENT[type] || DEFAULT_ACCENT
  return ACCENT_COLORS[fallbackAccent]
}

/**
 * Helper: Get metadata for a card type
 * @param {string} type - Card type
 * @returns {object}
 */
export function getTypeMetadata(type) {
  return TYPE_METADATA[type] || { source: 'unknown', priority: 50, family: 'other', icon: '✨' }
}

/**
 * Helper: Filter cards by tab
 * @param {Array} cards - Array of cards
 * @param {string} tabKey - Tab key to filter by
 * @returns {Array}
 */
export function filterCardsByTab(cards, tabKey) {
  if (tabKey === 'recommended') {
    return [...cards].sort((a, b) => (b.score || 0) - (a.score || 0))
  }
  return cards.filter(card => getTabForType(card.type) === tabKey)
}

/**
 * Helper: Get tab counts
 * @param {Array} cards - Array of cards
 * @returns {Object} Map of tabKey → count
 */
export function getTabCounts(cards) {
  const counts = { recommended: cards.length, moments: 0, recaps: 0, spikes: 0, prompts: 0 }
  for (const card of cards) {
    const tab = getTabForType(card.type)
    if (counts[tab] !== undefined) {
      counts[tab]++
    }
  }
  return counts
}
