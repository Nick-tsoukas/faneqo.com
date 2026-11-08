/**
 * Smart Link Live Feed Data Provider
 * 
 * Provides micro-signals for the live feed component.
 * Includes demo data fallback when real data is missing.
 * 
 * Feed Item Types:
 * - SupportReceived: payment in last 2h / 24h
 * - CityTuningIn: top city today or new city appears
 * - HeatingUp: plays last 30m > baseline * 2
 * - PostShowSpike: spike after show ends
 * - MostClickedLink: top tapped today
 */

import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'
import { DEMO_FEED_ENABLED } from '@/config/smartLinkFeatureFlags'

// Feed Item Type Constants
export const FEED_ITEM_TYPES = {
  SUPPORT_RECEIVED: 'SUPPORT_RECEIVED',
  CITY_TUNING_IN: 'CITY_TUNING_IN',
  HEATING_UP: 'HEATING_UP',
  POST_SHOW_SPIKE: 'POST_SHOW_SPIKE',
  MOST_CLICKED_LINK: 'MOST_CLICKED_LINK',
}

// Maximum age for feed items (24 hours)
const MAX_FEED_AGE_MS = 24 * 60 * 60 * 1000

/**
 * Generate demo feed items that look realistic
 * @param {Object} options
 * @param {string} options.bandName - Band name for personalization
 * @param {string} options.pageMode - Current page mode (SHOW_DAY, POST_SHOW, QUIET)
 */
function generateDemoFeed(options = {}) {
  const { bandName = 'the band', pageMode = 'QUIET' } = options
  const now = Date.now()
  
  // Demo cities pool
  const cities = ['Los Angeles', 'New York', 'Chicago', 'Austin', 'Nashville', 'Seattle', 'Denver', 'Portland']
  const randomCity = cities[Math.floor(Math.random() * cities.length)]
  
  // Demo platforms
  const platforms = ['Spotify', 'Apple Music', 'YouTube', 'SoundCloud']
  const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)]

  // Base demo items
  const demoItems = []

  // Always show a city tuning in
  demoItems.push({
    id: 'demo-city-1',
    type: FEED_ITEM_TYPES.CITY_TUNING_IN,
    timestamp: now - (Math.random() * 2 * 60 * 60 * 1000), // Within last 2 hours
    data: {
      city: randomCity,
      isNew: Math.random() > 0.7,
    },
    copy: `${randomCity} is tuning in`,
    icon: '📍',
  })

  // Show support received (more likely on POST_SHOW)
  if (pageMode === 'POST_SHOW' || Math.random() > 0.5) {
    demoItems.push({
      id: 'demo-support-1',
      type: FEED_ITEM_TYPES.SUPPORT_RECEIVED,
      timestamp: now - (Math.random() * 4 * 60 * 60 * 1000), // Within last 4 hours
      data: {
        amount: [5, 10, 20][Math.floor(Math.random() * 3)],
        isRecent: true,
      },
      copy: 'Someone just showed support',
      icon: '💜',
    })
  }

  // Show heating up on SHOW_DAY
  if (pageMode === 'SHOW_DAY') {
    demoItems.push({
      id: 'demo-heating-1',
      type: FEED_ITEM_TYPES.HEATING_UP,
      timestamp: now - (15 * 60 * 1000), // 15 min ago
      data: {
        multiplier: 2.5,
      },
      copy: 'Activity heating up',
      icon: '🔥',
    })
  }

  // Show post-show spike
  if (pageMode === 'POST_SHOW') {
    demoItems.push({
      id: 'demo-spike-1',
      type: FEED_ITEM_TYPES.POST_SHOW_SPIKE,
      timestamp: now - (30 * 60 * 1000), // 30 min ago
      data: {
        increase: '+340%',
      },
      copy: 'Post-show surge happening',
      icon: '📈',
    })
  }

  // Most clicked link
  if (Math.random() > 0.6) {
    demoItems.push({
      id: 'demo-clicked-1',
      type: FEED_ITEM_TYPES.MOST_CLICKED_LINK,
      timestamp: now - (Math.random() * 6 * 60 * 60 * 1000),
      data: {
        platform: randomPlatform,
        clicks: Math.floor(Math.random() * 50) + 10,
      },
      copy: `${randomPlatform} trending today`,
      icon: '🎵',
    })
  }

  // Sort by timestamp (most recent first) and limit to 3
  return demoItems
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3)
}

/**
 * Composable for managing live feed data
 * @param {Object} options
 * @param {number} options.bandId - Band ID for fetching real data
 * @param {string} options.bandName - Band name for demo data
 * @param {string} options.pageMode - Current page mode
 * @param {Object} options.analyticsData - Existing analytics data if available
 */
export function useSmartLinkLiveFeed(options = {}) {
  const { bandId, bandName = 'the band', pageMode = 'QUIET', analyticsData = null } = options

  const feedItems = ref([])
  const isLoading = ref(false)
  const isUsingDemoData = ref(false)

  /**
   * Transform real analytics data into feed items
   * TODO: Implement when analytics endpoints are available
   */
  function transformAnalyticsToFeed(data) {
    const items = []
    const now = Date.now()

    // TODO: Backend endpoint needed - /api/bands/:id/live-signals
    // Expected response shape:
    // {
    //   recentSupport: { amount, timestamp },
    //   topCity: { name, isNew, count },
    //   activitySpike: { multiplier, timestamp },
    //   topLink: { platform, clicks },
    // }

    if (data?.recentSupport && (now - data.recentSupport.timestamp) < MAX_FEED_AGE_MS) {
      items.push({
        id: `support-${data.recentSupport.timestamp}`,
        type: FEED_ITEM_TYPES.SUPPORT_RECEIVED,
        timestamp: data.recentSupport.timestamp,
        data: data.recentSupport,
        copy: 'Someone just showed support',
        icon: '💜',
      })
    }

    if (data?.topCity) {
      items.push({
        id: `city-${data.topCity.name}`,
        type: FEED_ITEM_TYPES.CITY_TUNING_IN,
        timestamp: now,
        data: data.topCity,
        copy: data.topCity.isNew 
          ? `${data.topCity.name} just joined` 
          : `${data.topCity.name} is tuning in`,
        icon: '📍',
      })
    }

    if (data?.activitySpike && data.activitySpike.multiplier >= 2) {
      items.push({
        id: `spike-${data.activitySpike.timestamp}`,
        type: FEED_ITEM_TYPES.HEATING_UP,
        timestamp: data.activitySpike.timestamp,
        data: data.activitySpike,
        copy: 'Activity heating up',
        icon: '🔥',
      })
    }

    if (data?.topLink) {
      items.push({
        id: `link-${data.topLink.platform}`,
        type: FEED_ITEM_TYPES.MOST_CLICKED_LINK,
        timestamp: now,
        data: data.topLink,
        copy: `${data.topLink.platform} trending today`,
        icon: '🎵',
      })
    }

    return items.slice(0, 3)
  }

  /**
   * Fetch live feed data
   */
  async function fetchFeed() {
    isLoading.value = true

    try {
      // Fetch from live-signals endpoint
      let realItems = []
      
      if (bandId) {
        try {
          const config = useRuntimeConfig()
          const response = await fetch(`${config.public.strapiUrl}/api/bands/${bandId}/live-signals`)
          if (response.ok) {
            const data = await response.json()
            realItems = transformAnalyticsToFeed(data)
          }
        } catch (fetchErr) {
          console.warn('[LiveFeed] API fetch failed, using fallback:', fetchErr.message)
        }
      }

      // If no real data from API, check passed-in analytics data
      if (realItems.length === 0 && analyticsData) {
        realItems = transformAnalyticsToFeed(analyticsData)
      }

      if (realItems.length > 0) {
        feedItems.value = realItems
        isUsingDemoData.value = false
      } else if (DEMO_FEED_ENABLED) {
        // Fall back to demo data
        feedItems.value = generateDemoFeed({ bandName, pageMode })
        isUsingDemoData.value = true
      } else {
        feedItems.value = []
        isUsingDemoData.value = false
      }
    } catch (err) {
      console.warn('[LiveFeed] Failed to fetch:', err)
      
      // Fall back to demo data on error
      if (DEMO_FEED_ENABLED) {
        feedItems.value = generateDemoFeed({ bandName, pageMode })
        isUsingDemoData.value = true
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Filter out expired items (older than 24h)
   */
  const activeFeedItems = computed(() => {
    const now = Date.now()
    return feedItems.value.filter(item => {
      return (now - item.timestamp) < MAX_FEED_AGE_MS
    })
  })

  /**
   * Get the most important feed item (for single-item display)
   */
  const primaryFeedItem = computed(() => {
    return activeFeedItems.value[0] || null
  })

  /**
   * Check if feed has any items to show
   */
  const hasFeedItems = computed(() => {
    return activeFeedItems.value.length > 0
  })

  // Fetch on mount
  onMounted(() => {
    fetchFeed()
  })

  return {
    // State
    feedItems: activeFeedItems,
    primaryFeedItem,
    hasFeedItems,
    isLoading,
    isUsingDemoData,
    
    // Actions
    fetchFeed,
    
    // Constants
    FEED_ITEM_TYPES,
  }
}
