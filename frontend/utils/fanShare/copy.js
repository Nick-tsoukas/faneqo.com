/**
 * MBQ Fan Share Copy System
 * 
 * Centralized copy for fan-facing share moments.
 * These are identity-driven, emotion-driven, public-facing shares.
 * 
 * Fan shares should communicate: pride, discovery, belonging, moment-in-time
 */

// ============================================================
// FAN MOMENT TYPES
// ============================================================

export const FAN_MOMENT_TYPES = {
  FIRST_DISCOVERY: 'FIRST_DISCOVERY',
  AFTER_SHOW_FAN: 'AFTER_SHOW_FAN',
  CITY_SUPPORT: 'CITY_SUPPORT',
  RETURNING_FAN: 'RETURNING_FAN',
  SUPER_FAN_ACTION: 'SUPER_FAN_ACTION',
  SHOW_CHECK_IN: 'SHOW_CHECK_IN',
  DEFAULT: 'DEFAULT',
}

// ============================================================
// CAPTION STYLES
// ============================================================

export const CAPTION_STYLES = {
  hype: 'hype',
  grateful: 'grateful',
  tease: 'tease',
}

// ============================================================
// FAN SHARE COPY BY MOMENT TYPE
// ============================================================

const FAN_COPY = {
  [FAN_MOMENT_TYPES.FIRST_DISCOVERY]: {
    hype: 'Just found something special 🔥',
    grateful: "New favorite artist. You're welcome 🙏",
    tease: "You're about to hear a lot more about this band 👀",
  },
  [FAN_MOMENT_TYPES.AFTER_SHOW_FAN]: {
    hype: 'This band owned the night 🎤',
    grateful: 'What a show. Still processing 🙏',
    tease: "If you weren't there… you missed out 👀",
  },
  [FAN_MOMENT_TYPES.CITY_SUPPORT]: {
    hype: '{city} shows up for this band 🔥',
    grateful: 'Proud to rep {city} for {bandName} 🙏',
    tease: "{city} knows something you don't 👀",
  },
  [FAN_MOMENT_TYPES.RETURNING_FAN]: {
    hype: "I'm officially a fan now 🔥",
    grateful: 'Back again. This band just hits different 🙏',
    tease: "Yeah, I'm hooked 👀",
  },
  [FAN_MOMENT_TYPES.SUPER_FAN_ACTION]: {
    hype: 'This band deserves your attention 🔥',
    grateful: 'Spent way too long on this page. Worth it 🙏',
    tease: 'Trust me on this one 👀',
  },
  [FAN_MOMENT_TYPES.SHOW_CHECK_IN]: {
    hype: 'I was there. {bandName} brought it 🔥',
    grateful: 'Caught {bandName} live tonight. Unreal 🙏',
    tease: "You missed {bandName} tonight… just saying 👀",
  },
  [FAN_MOMENT_TYPES.DEFAULT]: {
    hype: 'Put someone on 🔥',
    grateful: 'Supporting real music 🙏',
    tease: "You'll thank me later 👀",
  },
}

// ============================================================
// HEADLINE COPY (for share images)
// ============================================================

const FAN_HEADLINES = {
  [FAN_MOMENT_TYPES.FIRST_DISCOVERY]: 'JUST FOUND SOMETHING SPECIAL',
  [FAN_MOMENT_TYPES.AFTER_SHOW_FAN]: 'I WAS THERE',
  [FAN_MOMENT_TYPES.CITY_SUPPORT]: '{CITY} SHOWS UP',
  [FAN_MOMENT_TYPES.RETURNING_FAN]: 'OFFICIALLY A FAN',
  [FAN_MOMENT_TYPES.SUPER_FAN_ACTION]: 'THIS BAND DESERVES ATTENTION',
  [FAN_MOMENT_TYPES.SHOW_CHECK_IN]: 'I WAS THERE',
  [FAN_MOMENT_TYPES.DEFAULT]: 'PUT SOMEONE ON',
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Replace template variables in copy
 * @param {string} template 
 * @param {object} context - { bandName, city }
 * @returns {string}
 */
function replacePlaceholders(template, context = {}) {
  let result = template
  if (context.bandName) {
    result = result.replace(/{bandName}/g, context.bandName)
  }
  if (context.city) {
    result = result.replace(/{city}/g, context.city)
    result = result.replace(/{CITY}/g, context.city.toUpperCase())
  }
  return result
}

/**
 * Get fan share caption for a moment type and style
 * @param {string} momentType - FAN_MOMENT_TYPES value
 * @param {string} style - 'hype' | 'grateful' | 'tease'
 * @param {object} context - { bandName, city }
 * @returns {string}
 */
export function getFanCaption(momentType, style = 'hype', context = {}) {
  const typeKey = FAN_COPY[momentType] ? momentType : FAN_MOMENT_TYPES.DEFAULT
  const styleKey = FAN_COPY[typeKey][style] ? style : 'hype'
  const template = FAN_COPY[typeKey][styleKey]
  return replacePlaceholders(template, context)
}

/**
 * Get all caption variants for a moment type
 * @param {string} momentType 
 * @param {object} context 
 * @returns {{ hype: string, grateful: string, tease: string }}
 */
export function getAllCaptions(momentType, context = {}) {
  const typeKey = FAN_COPY[momentType] ? momentType : FAN_MOMENT_TYPES.DEFAULT
  return {
    hype: replacePlaceholders(FAN_COPY[typeKey].hype, context),
    grateful: replacePlaceholders(FAN_COPY[typeKey].grateful, context),
    tease: replacePlaceholders(FAN_COPY[typeKey].tease, context),
  }
}

/**
 * Get headline for share image
 * @param {string} momentType 
 * @param {object} context 
 * @returns {string}
 */
export function getFanHeadline(momentType, context = {}) {
  const typeKey = FAN_HEADLINES[momentType] ? momentType : FAN_MOMENT_TYPES.DEFAULT
  const template = FAN_HEADLINES[typeKey]
  return replacePlaceholders(template, context)
}

// ============================================================
// MOMENT TYPE DETECTION
// ============================================================

/**
 * Detect fan moment type based on context
 * @param {object} context
 * @param {boolean} context.isFirstVisit - First time visitor
 * @param {boolean} context.isNearEvent - Within 4 hours of event
 * @param {boolean} context.cityMatchesMomentum - Fan city matches band momentum city
 * @param {boolean} context.isReturningFan - Has visited before (>24h gap)
 * @param {boolean} context.isSuperFan - Long session or multiple clicks
 * @returns {string} FAN_MOMENT_TYPES value
 */
export function detectFanMomentType(context = {}) {
  // Priority order: most specific first
  
  // After show takes priority (time-sensitive)
  if (context.isNearEvent) {
    return FAN_MOMENT_TYPES.AFTER_SHOW_FAN
  }
  
  // First discovery (new fan)
  if (context.isFirstVisit) {
    return FAN_MOMENT_TYPES.FIRST_DISCOVERY
  }
  
  // City support (local pride)
  if (context.cityMatchesMomentum) {
    return FAN_MOMENT_TYPES.CITY_SUPPORT
  }
  
  // Super fan (deep engagement)
  if (context.isSuperFan) {
    return FAN_MOMENT_TYPES.SUPER_FAN_ACTION
  }
  
  // Returning fan (loyalty)
  if (context.isReturningFan) {
    return FAN_MOMENT_TYPES.RETURNING_FAN
  }
  
  return FAN_MOMENT_TYPES.DEFAULT
}

/**
 * Build share text with URL
 * @param {string} caption 
 * @param {string} url 
 * @returns {string}
 */
export function buildFanShareText(caption, url) {
  return `${caption} ${url}`
}

// ============================================================
// SHOW CHECK-IN BADGE HELPERS
// ============================================================

/**
 * Get verification label based on confidence score
 * @param {number} confidenceScore - 0 to 100
 * @returns {string}
 */
export function getVerificationLabel(confidenceScore) {
  if (confidenceScore >= 85) return 'Verified Attendee'
  if (confidenceScore >= 70) return 'Live Check-In'
  return 'Fan Check-In'
}

/**
 * Get badge headline for share image
 * @param {object} context - { bandName, venue, city }
 * @returns {string}
 */
export function getBadgeHeadline(context = {}) {
  return 'I WAS THERE'
}

/**
 * Get badge caption for sharing
 * @param {string} style - 'hype' | 'grateful' | 'tease'
 * @param {object} context - { bandName, venue, city }
 * @returns {string}
 */
export function getBadgeCaption(style = 'hype', context = {}) {
  return getFanCaption(FAN_MOMENT_TYPES.SHOW_CHECK_IN, style, context)
}

/**
 * Get all badge caption variants
 * @param {object} context - { bandName, venue, city }
 * @returns {{ hype: string, grateful: string, tease: string }}
 */
export function getAllBadgeCaptions(context = {}) {
  return getAllCaptions(FAN_MOMENT_TYPES.SHOW_CHECK_IN, context)
}

/**
 * Format a check-in date for display on badge
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatBadgeDate(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default {
  FAN_MOMENT_TYPES,
  CAPTION_STYLES,
  getFanCaption,
  getAllCaptions,
  getFanHeadline,
  detectFanMomentType,
  buildFanShareText,
  getVerificationLabel,
  getBadgeHeadline,
  getBadgeCaption,
  getAllBadgeCaptions,
  formatBadgeDate,
}
