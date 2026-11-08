/**
 * MBQ Internal Demo Deck
 * Generates demo ShareCard objects for all 10 band card types
 * Used by the internal shareables gallery for testing/review
 */

// Demo band data
export const DEMO_BAND = {
  id: 1,
  name: 'Neon Avenue',
  slug: 'neon-avenue',
  genre: 'Indie Pop',
  city: 'Los Angeles',
  state: 'CA',
  imageUrl: '/neonposter.png',
  isBandNameInLogo: false,
}

// All 10 card types with their accents
const CARD_TYPES = {
  CITY_CLAIM: { accent: 'violet', emoji: '📍' },
  MOMENTUM_SURGE: { accent: 'blue', emoji: '📈' },
  AFTER_SHOW_ENERGY: { accent: 'rose', emoji: '🎤' },
  NEW_CITY_UNLOCKED: { accent: 'emerald', emoji: '🌆' },
  RETURNING_FANS: { accent: 'amber', emoji: '🔁' },
  SHARE_CHAIN: { accent: 'blue', emoji: '🔗' },
  ENGAGED_SESSIONS: { accent: 'violet', emoji: '⏱️' },
  PLATFORM_PULL: { accent: 'emerald', emoji: '🎧' },
  PEAK_HOUR: { accent: 'amber', emoji: '🕐' },
  MILESTONE_DROP: { accent: 'rose', emoji: '🏆' },
}

// Tab categories
const TAB_MAPPING = {
  CITY_CLAIM: 'spikes',
  MOMENTUM_SURGE: 'spikes',
  AFTER_SHOW_ENERGY: 'recaps',
  NEW_CITY_UNLOCKED: 'prompts',
  RETURNING_FANS: 'recaps',
  SHARE_CHAIN: 'prompts',
  ENGAGED_SESSIONS: 'recaps',
  PLATFORM_PULL: 'prompts',
  PEAK_HOUR: 'spikes',
  MILESTONE_DROP: 'recaps',
}

// Demo card data for each type
const DEMO_CARDS_DATA = {
  CITY_CLAIM: {
    headline: '📍 CHICAGO IS HEATING UP',
    hero: '23 FANS',
    proof: '43% OF TRAFFIC • LAST 7D',
    windowLabel: 'LAST 7D',
    window: '7d',
    microCaption: {
      hype: '"Chicago is showing love 🔥"',
      grateful: '"Thank you Chicago 🙏"',
      tease: '"Something brewing in Chicago... 👀"',
    },
    context: { city: 'Chicago', sharePct: 43 },
  },
  MOMENTUM_SURGE: {
    headline: '📈 MOMENTUM IS BUILDING',
    hero: '+127%',
    proof: 'VS PREVIOUS 24H',
    windowLabel: 'LAST 24H',
    window: '24h',
    microCaption: {
      hype: '"The wave is real 🌊"',
      grateful: '"Grateful for the growth 🙏"',
      tease: '"Something\'s happening... 👀"',
    },
    context: { growthPct: 127 },
  },
  AFTER_SHOW_ENERGY: {
    headline: '🎤 POST-SHOW ENERGY',
    hero: '89 HITS',
    proof: 'AFTER THE SHOW • LAST 2H',
    windowLabel: 'LAST 2H',
    window: '2h',
    microCaption: {
      hype: '"The energy was unreal 🔥"',
      grateful: '"Thank you to everyone who came out 🙏"',
      tease: '"If you weren\'t there... 👀"',
    },
    context: { venue: 'House of Blues', city: 'Chicago' },
  },
  NEW_CITY_UNLOCKED: {
    headline: '🌆 NEW CITY UNLOCKED',
    hero: 'AUSTIN',
    proof: '12 NEW FANS • LAST 7D',
    windowLabel: 'LAST 7D',
    window: '7d',
    microCaption: {
      hype: '"Austin just entered the chat 🔥"',
      grateful: '"Welcome Austin 🙏"',
      tease: '"New city, who dis? 👀"',
    },
    context: { city: 'Austin', newFans: 12 },
  },
  RETURNING_FANS: {
    headline: '🔁 FANS KEEP COMING BACK',
    hero: '34%',
    proof: 'RETURNING VISITORS • LAST 7D',
    windowLabel: 'LAST 7D',
    window: '7d',
    microCaption: {
      hype: '"The real ones stay 🔥"',
      grateful: '"Loyal fans are everything 🙏"',
      tease: '"They can\'t stay away... 👀"',
    },
    context: { returningPct: 34 },
  },
  SHARE_CHAIN: {
    headline: '🔗 LINKS ARE GETTING SHARED',
    hero: '8 SHARES',
    proof: 'FANS SHARED YOUR PAGE • LAST 24H',
    windowLabel: 'LAST 24H',
    window: '24h',
    microCaption: {
      hype: '"The share chain is real 🔥"',
      grateful: '"Thank you for spreading the word 🙏"',
      tease: '"Word is getting around... 👀"',
    },
    context: { shares: 8 },
  },
  ENGAGED_SESSIONS: {
    headline: '⏱️ FANS ARE LOCKED IN',
    hero: '2m 45s',
    proof: 'AVG SESSION TIME • LAST 24H',
    windowLabel: 'LAST 24H',
    window: '24h',
    microCaption: {
      hype: '"They\'re not just clicking, they\'re staying 🔥"',
      grateful: '"Love that you\'re taking time to explore 🙏"',
      tease: '"Something\'s keeping them here... 👀"',
    },
    context: { avgDuration: 165 },
  },
  PLATFORM_PULL: {
    headline: '🎧 SPOTIFY IS PULLING',
    hero: '67%',
    proof: 'OF LINK CLICKS • LAST 7D',
    windowLabel: 'LAST 7D',
    window: '7d',
    microCaption: {
      hype: '"Spotify is where it\'s at 🔥"',
      grateful: '"Thank you for streaming 🙏"',
      tease: '"The streams are speaking... 👀"',
    },
    context: { platform: 'Spotify', sharePct: 67 },
  },
  PEAK_HOUR: {
    headline: '🕐 PEAK HOUR: 8AM',
    hero: '10 HITS',
    proof: 'BEST TIME • LAST 24H',
    windowLabel: 'LAST 24H',
    window: '24h',
    microCaption: {
      hype: '"That hour went off 🔥"',
      grateful: '"Morning crew showing love 🙏"',
      tease: '"8AM hits different... 👀"',
    },
    context: { peakHour: 8, peakCount: 10 },
  },
  MILESTONE_DROP: {
    headline: '🏆 MILESTONE UNLOCKED',
    hero: '50',
    proof: 'INTERACTIONS • LAST 7D',
    windowLabel: 'LAST 7D',
    window: '7d',
    microCaption: {
      hype: '"We just leveled up 🔥"',
      grateful: '"50 interactions means 50 real moments 🙏"',
      tease: '"Just hit a milestone... 👀"',
    },
    context: { milestone: 50 },
  },
}

/**
 * Generate a unique ID for demo cards
 */
function generateId(type, index = 0) {
  return `demo-${type.toLowerCase()}-${index}`
}

/**
 * Get all demo band ShareCards (10 types)
 * @returns {Array} Array of ShareCard objects
 */
export function getBandDemoCards() {
  const cards = []

  Object.entries(DEMO_CARDS_DATA).forEach(([type, data], index) => {
    const typeConfig = CARD_TYPES[type]
    
    cards.push({
      id: generateId(type, index),
      type,
      kind: type.replace(/_/g, ' '),
      tab: TAB_MAPPING[type],
      accent: typeConfig.accent,
      headline: data.headline,
      hero: data.hero,
      proof: data.proof,
      windowLabel: data.windowLabel,
      window: data.window,
      microCaption: data.microCaption,
      context: data.context,
      score: 80 - index * 5, // Descending scores for demo
      band: {
        id: DEMO_BAND.id,
        name: DEMO_BAND.name,
        slug: DEMO_BAND.slug,
        imageUrl: DEMO_BAND.imageUrl,
        isBandNameInLogo: DEMO_BAND.isBandNameInLogo,
      },
      share: {
        shareUrl: `https://musicbizqr.com/${DEMO_BAND.slug}`,
        ogUrl: `https://musicbizqr.com/share/band/${DEMO_BAND.slug}`,
        captions: data.microCaption,
        defaultCaptionStyle: 'hype',
      },
    })
  })

  return cards
}

/**
 * Get demo cards filtered by tab
 * @param {string} tab - Tab name (recommended, recaps, spikes, prompts)
 * @returns {Array} Filtered cards
 */
export function getBandDemoCardsByTab(tab) {
  const allCards = getBandDemoCards()
  
  if (tab === 'recommended' || tab === 'all') {
    return allCards
  }
  
  return allCards.filter(card => card.tab === tab)
}

/**
 * Get all card types
 * @returns {Array} Array of card type names
 */
export function getAllCardTypes() {
  return Object.keys(CARD_TYPES)
}

/**
 * Get card type config
 * @param {string} type - Card type
 * @returns {Object} Type config with accent and emoji
 */
export function getCardTypeConfig(type) {
  return CARD_TYPES[type] || { accent: 'violet', emoji: '✨' }
}

export default {
  DEMO_BAND,
  getBandDemoCards,
  getBandDemoCardsByTab,
  getAllCardTypes,
  getCardTypeConfig,
}
