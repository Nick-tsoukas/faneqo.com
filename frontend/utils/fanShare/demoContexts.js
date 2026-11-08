/**
 * MBQ Fan Share Demo Contexts
 * Provides demo context data for all 5 fan moment types
 * Used by the internal shareables gallery for testing/review
 */

import { FAN_MOMENT_TYPES } from './copy'

// Demo band data (same as demoDeck.js)
export const DEMO_BAND = {
  id: 4,
  name: 'The Danny Nova Band',
  slug: 'thedannynovaband',
  imageUrl: 'https://qrcode101.s3.us-east-1.amazonaws.com/dannylogo_2c227e4742.PNG',
  isBandNameInLogo: true,
}

// Demo contexts for each fan moment type
const FAN_DEMO_CONTEXTS = {
  FIRST_DISCOVERY: {
    label: 'First Discovery',
    emoji: '✨',
    contexts: [
      {
        city: 'Chicago',
        venue: null,
        eventTitle: null,
        isLateNight: false,
      },
      {
        city: 'Austin',
        venue: null,
        eventTitle: null,
        isLateNight: true,
      },
    ],
  },
  AFTER_SHOW_FAN: {
    label: 'After Show Fan',
    emoji: '🎤',
    contexts: [
      {
        city: 'Chicago',
        venue: 'House of Blues',
        eventTitle: 'Summer Tour 2026',
        isLateNight: true,
      },
      {
        city: 'Nashville',
        venue: 'The Ryman',
        eventTitle: 'Acoustic Night',
        isLateNight: false,
      },
    ],
  },
  CITY_SUPPORT: {
    label: 'City Support',
    emoji: '🌆',
    contexts: [
      {
        city: 'Chicago',
        venue: null,
        eventTitle: null,
        isLateNight: false,
      },
      {
        city: 'Los Angeles',
        venue: null,
        eventTitle: null,
        isLateNight: true,
      },
    ],
  },
  RETURNING_FAN: {
    label: 'Returning Fan',
    emoji: '🔁',
    contexts: [
      {
        city: 'New York',
        venue: null,
        eventTitle: null,
        isLateNight: false,
        visitCount: 5,
      },
      {
        city: 'Miami',
        venue: null,
        eventTitle: null,
        isLateNight: true,
        visitCount: 12,
      },
    ],
  },
  SUPER_FAN_ACTION: {
    label: 'Super Fan Action',
    emoji: '⚡',
    contexts: [
      {
        city: 'Chicago',
        venue: null,
        eventTitle: null,
        isLateNight: false,
        actionType: 'shared',
      },
      {
        city: 'Denver',
        venue: null,
        eventTitle: null,
        isLateNight: true,
        actionType: 'followed',
      },
    ],
  },
}

// Headlines for each moment type
const FAN_HEADLINES = {
  FIRST_DISCOVERY: 'JUST FOUND SOMETHING SPECIAL',
  AFTER_SHOW_FAN: 'THAT SHOW WAS EVERYTHING',
  CITY_SUPPORT: 'REPPING MY CITY',
  RETURNING_FAN: 'BACK FOR MORE',
  SUPER_FAN_ACTION: 'REAL ONES KNOW',
  DEFAULT: 'PUT SOMEONE ON',
}

// Captions for each moment type and style
const FAN_CAPTIONS = {
  FIRST_DISCOVERY: {
    hype: '"Just discovered something special 🔥"',
    grateful: '"So glad I found this 🙏"',
    tease: '"You\'re gonna want to hear this... 👀"',
  },
  AFTER_SHOW_FAN: {
    hype: '"That show was INSANE 🔥"',
    grateful: '"Thank you for an unforgettable night 🙏"',
    tease: '"If you weren\'t there... 👀"',
  },
  CITY_SUPPORT: {
    hype: '"My city knows what\'s up 🔥"',
    grateful: '"Proud to rep my city 🙏"',
    tease: '"The city is talking... 👀"',
  },
  RETURNING_FAN: {
    hype: '"Can\'t stop coming back 🔥"',
    grateful: '"This music hits different every time 🙏"',
    tease: '"There\'s a reason I keep coming back... 👀"',
  },
  SUPER_FAN_ACTION: {
    hype: '"Real ones move different 🔥"',
    grateful: '"Happy to support real talent 🙏"',
    tease: '"Just did something... 👀"',
  },
  DEFAULT: {
    hype: '"Put someone on 🔥"',
    grateful: '"Sharing the love 🙏"',
    tease: '"You need to hear this... 👀"',
  },
}

/**
 * Get all fan moment types
 * @returns {Array} Array of moment type names
 */
export function getAllFanMomentTypes() {
  return Object.keys(FAN_DEMO_CONTEXTS)
}

/**
 * Get demo context for a moment type
 * @param {string} momentType - Fan moment type
 * @param {number} variant - Context variant (0 or 1)
 * @returns {Object} Demo context
 */
export function getFanDemoContext(momentType, variant = 0) {
  const config = FAN_DEMO_CONTEXTS[momentType] || FAN_DEMO_CONTEXTS.FIRST_DISCOVERY
  return config.contexts[variant] || config.contexts[0]
}

/**
 * Get moment type config
 * @param {string} momentType - Fan moment type
 * @returns {Object} Config with label and emoji
 */
export function getFanMomentConfig(momentType) {
  return FAN_DEMO_CONTEXTS[momentType] || { label: 'Fan Moment', emoji: '✨' }
}

/**
 * Get headline for moment type
 * @param {string} momentType - Fan moment type
 * @returns {string} Headline text
 */
export function getFanDemoHeadline(momentType) {
  return FAN_HEADLINES[momentType] || FAN_HEADLINES.DEFAULT
}

/**
 * Get captions for moment type
 * @param {string} momentType - Fan moment type
 * @returns {Object} Captions object with hype/grateful/tease
 */
export function getFanDemoCaptions(momentType) {
  return FAN_CAPTIONS[momentType] || FAN_CAPTIONS.DEFAULT
}

/**
 * Get all fan demo items for the gallery
 * @returns {Array} Array of fan share demo items
 */
export function getFanDemoItems() {
  const items = []

  Object.entries(FAN_DEMO_CONTEXTS).forEach(([momentType, config], index) => {
    items.push({
      id: `demo-fan-${momentType.toLowerCase()}`,
      momentType,
      label: config.label,
      emoji: config.emoji,
      headline: FAN_HEADLINES[momentType] || FAN_HEADLINES.DEFAULT,
      captions: FAN_CAPTIONS[momentType] || FAN_CAPTIONS.DEFAULT,
      context: config.contexts[0],
      band: {
        id: DEMO_BAND.id,
        name: DEMO_BAND.name,
        slug: DEMO_BAND.slug,
        imageUrl: DEMO_BAND.imageUrl,
        isBandNameInLogo: DEMO_BAND.isBandNameInLogo,
      },
    })
  })

  return items
}

export default {
  DEMO_BAND,
  getAllFanMomentTypes,
  getFanDemoContext,
  getFanMomentConfig,
  getFanDemoHeadline,
  getFanDemoCaptions,
  getFanDemoItems,
}
