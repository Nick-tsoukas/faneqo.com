/**
 * Shareable Card Types Configuration
 * Centralized mapping for the 10 V1 card types
 */

// Card type to tab category mapping
export const CARD_TYPE_CATEGORIES = {
  // Recaps
  AFTER_SHOW_ENERGY: 'recaps',
  
  // Spikes
  MOMENTUM_SURGE: 'spikes',
  PEAK_HOUR: 'spikes',
  CITY_CLAIM: 'spikes',
  
  // Prompts
  SHARE_CHAIN: 'prompts',
  PLATFORM_PULL: 'prompts',
  ENGAGED_SESSIONS: 'prompts',
  RETURNING_FANS: 'prompts',
  NEW_CITY_UNLOCKED: 'prompts',
  MILESTONE_DROP: 'prompts',
}

// Card type to accent color mapping (locked per spec)
export const CARD_TYPE_ACCENTS = {
  CITY_CLAIM: 'violet',
  MOMENTUM_SURGE: 'blue',
  AFTER_SHOW_ENERGY: 'rose',
  NEW_CITY_UNLOCKED: 'emerald',
  RETURNING_FANS: 'amber',
  SHARE_CHAIN: 'blue',
  ENGAGED_SESSIONS: 'violet',
  PLATFORM_PULL: 'emerald',
  PEAK_HOUR: 'amber',
  MILESTONE_DROP: 'rose',
}

// Accent color palette
export const ACCENT_COLORS = {
  violet: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.25)', bg: 'from-violet-900/30' },
  blue: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.25)', bg: 'from-blue-900/30' },
  emerald: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.25)', bg: 'from-emerald-900/30' },
  amber: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.25)', bg: 'from-amber-900/30' },
  rose: { primary: '#F43F5E', glow: 'rgba(244, 63, 94, 0.25)', bg: 'from-rose-900/30' },
}

// Card type display names (for tooltips/labels)
export const CARD_TYPE_LABELS = {
  CITY_CLAIM: 'City Claim',
  MOMENTUM_SURGE: 'Momentum Surge',
  AFTER_SHOW_ENERGY: 'After-Show Energy',
  NEW_CITY_UNLOCKED: 'New City Unlocked',
  RETURNING_FANS: 'Returning Fans',
  SHARE_CHAIN: 'Share Chain',
  ENGAGED_SESSIONS: 'Engaged Sessions',
  PLATFORM_PULL: 'Platform Pull',
  PEAK_HOUR: 'Peak Hour',
  MILESTONE_DROP: 'Milestone Drop',
}

// Tab configuration
export const SHAREABLE_TABS = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'recaps', label: 'Recaps' },
  { key: 'spikes', label: 'Spikes' },
  { key: 'prompts', label: 'Prompts' },
]

/**
 * Get category for a card type
 */
export function getCardCategory(type) {
  return CARD_TYPE_CATEGORIES[type] || 'prompts'
}

/**
 * Get accent color config for a card
 */
export function getCardAccent(card) {
  const accentKey = card.accent || CARD_TYPE_ACCENTS[card.type] || 'violet'
  return ACCENT_COLORS[accentKey] || ACCENT_COLORS.violet
}

/**
 * Normalize ShareCard from API to ShareableItem for UI
 */
export function normalizeShareCard(card, band) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const bandUrl = `${origin}/${band.slug}`
  
  return {
    id: card.id,
    type: card.type,
    windowLabel: card.windowLabel || 'Last 24h',
    headline: card.headline,
    hero: card.hero,
    proof: card.proof,
    microCaption: card.microCaption || {},
    accent: card.accent || CARD_TYPE_ACCENTS[card.type] || 'violet',
    score: card.score || 0,
    context: card.context || {},
    category: getCardCategory(card.type),
    selectedCaptionStyle: 'hype',
    share: {
      shareUrl: bandUrl,
      ogUrl: `${origin}/share/band/${band.slug}`,
    },
    band: {
      id: band.id,
      slug: band.slug,
      name: band.name,
      imageUrl: band.imageUrl,
      isBandNameInLogo: band.isBandNameInLogo || false,
    },
  }
}

/**
 * Filter cards by tab
 */
export function filterCardsByTab(cards, tab) {
  if (tab === 'recommended') {
    return [...cards].sort((a, b) => (b.score || 0) - (a.score || 0))
  }
  return cards.filter(c => c.category === tab)
}
