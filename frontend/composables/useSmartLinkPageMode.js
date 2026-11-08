/**
 * Smart Link Page Mode State Machine
 * 
 * Determines the current page mode based on events and activity.
 * Modes affect CTA emphasis and section ordering.
 * 
 * Modes:
 * - SHOW_DAY: Event happening today (within 24h)
 * - POST_SHOW: Event ended within last 12h
 * - QUIET: Default state
 */

import { computed, ref } from 'vue'

// Page Mode Constants
export const PAGE_MODES = {
  SHOW_DAY: 'SHOW_DAY',
  POST_SHOW: 'POST_SHOW',
  QUIET: 'QUIET',
}

// NOW Banner State Constants
export const NOW_BANNER_STATES = {
  SHOW_TONIGHT: 'SHOW_TONIGHT',
  ON_TOUR: 'ON_TOUR',
  NEW_RELEASE: 'NEW_RELEASE',
  POST_SHOW_THANKS: 'POST_SHOW_THANKS',
  QUIET_DEFAULT: 'QUIET_DEFAULT',
}

/**
 * Composable for managing smart link page mode
 * @param {Object} options
 * @param {Array} options.events - Array of event objects with date field
 * @param {Object} options.bandData - Band data object
 * @param {Object} options.analyticsData - Optional analytics data for activity signals
 */
export function useSmartLinkPageMode(options = {}) {
  const { events = [], bandData = {}, analyticsData = {} } = options

  // ============================================
  // TIME HELPERS
  // ============================================
  
  const now = ref(new Date())
  
  // Update "now" every minute for live updates
  if (typeof window !== 'undefined') {
    setInterval(() => {
      now.value = new Date()
    }, 60000)
  }

  /**
   * Check if a date is within X hours from now
   */
  function isWithinHours(dateStr, hours, direction = 'future') {
    if (!dateStr) return false
    const eventDate = new Date(dateStr + 'T20:00:00') // Assume 8pm show time if not specified
    const diffMs = direction === 'future' 
      ? eventDate.getTime() - now.value.getTime()
      : now.value.getTime() - eventDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffHours >= 0 && diffHours <= hours
  }

  /**
   * Check if a date is within X days from now
   */
  function isWithinDays(dateStr, days) {
    if (!dateStr) return false
    const targetDate = new Date(dateStr)
    const diffMs = now.value.getTime() - targetDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= days
  }

  // ============================================
  // EVENT ANALYSIS
  // ============================================

  const upcomingEvents = computed(() => {
    if (!Array.isArray(events)) return []
    return events
      .filter(e => {
        const eventDate = new Date(e.date + 'T23:59:59')
        return eventDate >= now.value
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  const nextEvent = computed(() => upcomingEvents.value[0] || null)

  const hasShowTonight = computed(() => {
    return nextEvent.value && isWithinHours(nextEvent.value.date, 24, 'future')
  })

  const hasRecentShow = computed(() => {
    // Check if any event ended within last 12 hours
    if (!Array.isArray(events)) return false
    return events.some(e => isWithinHours(e.date, 12, 'past'))
  })

  const isOnTour = computed(() => {
    // On tour if multiple upcoming events within next 30 days
    return upcomingEvents.value.length >= 2
  })

  // ============================================
  // RELEASE DETECTION
  // ============================================

  const hasNewRelease = computed(() => {
    // TODO: Backend field needed - band.newReleaseDate
    // For now, check if singlesong or singlevideo was recently added
    const releaseDate = bandData.newReleaseDate || bandData.singlesong?.createdAt || null
    if (!releaseDate) return false
    return isWithinDays(releaseDate, 30)
  })

  // ============================================
  // PAGE MODE DETERMINATION
  // ============================================

  const pageMode = computed(() => {
    if (hasShowTonight.value) return PAGE_MODES.SHOW_DAY
    if (hasRecentShow.value) return PAGE_MODES.POST_SHOW
    return PAGE_MODES.QUIET
  })

  // ============================================
  // NOW BANNER STATE
  // ============================================

  const nowBannerState = computed(() => {
    // TODO: Check for manual override from band data
    // bandData.nowBannerOverride could be set by artist
    if (bandData.nowBannerOverride) {
      return bandData.nowBannerOverride
    }

    // Auto-detect based on events and data
    if (hasShowTonight.value) return NOW_BANNER_STATES.SHOW_TONIGHT
    if (hasRecentShow.value) return NOW_BANNER_STATES.POST_SHOW_THANKS
    if (hasNewRelease.value) return NOW_BANNER_STATES.NEW_RELEASE
    if (isOnTour.value) return NOW_BANNER_STATES.ON_TOUR
    return NOW_BANNER_STATES.QUIET_DEFAULT
  })

  // ============================================
  // NOW BANNER CONTENT
  // ============================================

  const nowBannerContent = computed(() => {
    const state = nowBannerState.value
    const event = nextEvent.value

    switch (state) {
      case NOW_BANNER_STATES.SHOW_TONIGHT:
        return {
          icon: '🎤',
          headline: 'Live Tonight',
          subtext: event ? `${event.venue || 'Show'} in ${event.city || 'your city'}` : 'Catch the show',
          cta: event?.ticketLink ? 'Get Tickets' : null,
          ctaLink: event?.ticketLink || null,
          accent: 'orange',
        }
      
      case NOW_BANNER_STATES.POST_SHOW_THANKS:
        return {
          icon: '🙏',
          headline: 'Thanks for coming out',
          subtext: 'Hope you had a great time',
          cta: 'Share the moment',
          ctaAction: 'share',
          accent: 'purple',
        }
      
      case NOW_BANNER_STATES.NEW_RELEASE:
        return {
          icon: '🔥',
          headline: 'New Music',
          subtext: 'Fresh release — check it out',
          cta: 'Listen Now',
          ctaAction: 'scroll-to-featured',
          accent: 'pink',
        }
      
      case NOW_BANNER_STATES.ON_TOUR:
        return {
          icon: '🚐',
          headline: 'On Tour',
          subtext: `${upcomingEvents.value.length} shows coming up`,
          cta: 'See Dates',
          ctaAction: 'scroll-to-events',
          accent: 'blue',
        }
      
      case NOW_BANNER_STATES.QUIET_DEFAULT:
      default:
        return {
          icon: '🎵',
          headline: bandData.name || 'Welcome',
          subtext: bandData.bio ? bandData.bio.substring(0, 60) + '...' : 'Thanks for stopping by',
          cta: null,
          accent: 'neutral',
        }
    }
  })

  // ============================================
  // SECTION ORDERING BY MODE
  // ============================================

  const sectionOrder = computed(() => {
    // Default order
    const defaultOrder = [
      'identity',
      'nowBanner',
      'primaryCtas',
      'featuredMedia',
      'liveFeed',
      'streamingLinks',
      'socialLinks',
      'events',
      'support',
      'actions',
    ]

    // SHOW_DAY: Emphasize tickets/entry, events higher
    if (pageMode.value === PAGE_MODES.SHOW_DAY) {
      return [
        'identity',
        'nowBanner',
        'primaryCtas', // Tickets/Entry emphasized
        'events',
        'featuredMedia',
        'liveFeed',
        'support', // Pay Entry expanded
        'streamingLinks',
        'socialLinks',
        'actions',
      ]
    }

    // POST_SHOW: Emphasize sharing, support
    if (pageMode.value === PAGE_MODES.POST_SHOW) {
      return [
        'identity',
        'nowBanner',
        'featuredMedia',
        'liveFeed',
        'support',
        'primaryCtas',
        'streamingLinks',
        'socialLinks',
        'events',
        'actions',
      ]
    }

    return defaultOrder
  })

  // ============================================
  // CTA EMPHASIS BY MODE
  // ============================================

  const ctaEmphasis = computed(() => {
    switch (pageMode.value) {
      case PAGE_MODES.SHOW_DAY:
        return {
          primary: 'tickets', // or 'payEntry' if no ticket link
          secondary: 'listen',
          tertiary: 'support',
        }
      case PAGE_MODES.POST_SHOW:
        return {
          primary: 'share',
          secondary: 'support',
          tertiary: 'listen',
        }
      default:
        return {
          primary: 'listen',
          secondary: 'follow',
          tertiary: 'support',
        }
    }
  })

  return {
    // Constants
    PAGE_MODES,
    NOW_BANNER_STATES,
    
    // State
    pageMode,
    nowBannerState,
    nowBannerContent,
    
    // Event data
    nextEvent,
    upcomingEvents,
    hasShowTonight,
    hasRecentShow,
    isOnTour,
    hasNewRelease,
    
    // Layout helpers
    sectionOrder,
    ctaEmphasis,
  }
}
