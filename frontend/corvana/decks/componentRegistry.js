// Component registry for Corvana deck renderer
import { defineAsyncComponent } from 'vue'
import { getDemoData } from '~/corvana/demo/demoData.js'

// Lazy-loaded components
const SmartLinkSurface = defineAsyncComponent(() => 
  import('~/components/band/BandPageCompact.vue')
)

// Band page style variants
const BandPageStyleDefault = defineAsyncComponent(() => 
  import('~/components/band/BandPageStyleDefault.vue')
)

const BandPageStyleCompact = defineAsyncComponent(() => 
  import('~/components/band/BandPageStyleCompact.vue')
)

const BandPageStyleBold = defineAsyncComponent(() => 
  import('~/components/band/BandPageStyleBold.vue')
)

const ShareablesGrid = defineAsyncComponent(() => 
  import('~/components/shareables/ShareablesFeed.vue')
)

// New components for Step 2
const LiveSurfaceFeed = defineAsyncComponent(() => 
  import('~/components/smartlink/LiveFeed.vue')
)

const BandAnalyticsOverview = defineAsyncComponent(() => 
  import('~/components/demo/AnalyticsDemoInline.vue')
)

const SupportMomentsButtons = defineAsyncComponent(() => 
  import('~/components/smartlink/SupportModule.vue')
)

const AgencyRosterSignals = defineAsyncComponent(() => 
  import('~/corvana/decks/AgencyDeckPanel.vue')
)

const PulseMuse = defineAsyncComponent(() => 
  import('~/corvana/decks/PulseMuse.vue')
)

const LiveFeedEnhanced = defineAsyncComponent(() => 
  import('~/corvana/decks/LiveFeedEnhanced.vue')
)

const ShareablesShowcase = defineAsyncComponent(() => 
  import('~/corvana/decks/ShareablesShowcase.vue')
)

const FaneqoIndustryDeckSlide = defineAsyncComponent(() =>
  import('~/corvana/decks/FaneqoIndustryDeckSlide.vue')
)

const FaneqoCoverSlide = defineAsyncComponent(() =>
  import('~/corvana/decks/FaneqoCoverSlide.vue')
)

const FaneqoConnectSlide = defineAsyncComponent(() =>
  import('~/corvana/decks/FaneqoConnectSlide.vue')
)

const FaneqoHomeSlide = defineAsyncComponent(() =>
  import('~/corvana/decks/FaneqoHomeSlide.vue')
)

// Flagship slides 4–10 (preview deck). Each is a self-contained composition.
const FaneqoRoomSlide = defineAsyncComponent(() => import('~/corvana/decks/FaneqoRoomSlide.vue'))
const FaneqoNightSlide = defineAsyncComponent(() => import('~/corvana/decks/FaneqoNightSlide.vue'))
const FaneqoConversationSlide = defineAsyncComponent(() => import('~/corvana/decks/FaneqoConversationSlide.vue'))
const FaneqoSupportSlide = defineAsyncComponent(() => import('~/corvana/decks/FaneqoSupportSlide.vue'))
const FaneqoInsightSlide = defineAsyncComponent(() => import('~/corvana/decks/FaneqoInsightSlide.vue'))
const FaneqoJourneySlide = defineAsyncComponent(() => import('~/corvana/decks/FaneqoJourneySlide.vue'))
const FaneqoClosingSlide = defineAsyncComponent(() => import('~/corvana/decks/FaneqoClosingSlide.vue'))

const flagshipSlides = {
  FaneqoRoomSlide,
  FaneqoNightSlide,
  FaneqoConversationSlide,
  FaneqoSupportSlide,
  FaneqoInsightSlide,
  FaneqoJourneySlide,
  FaneqoClosingSlide,
}

// Component registry
export const componentRegistry = {
  'FaneqoConnectSlide': {
    component: FaneqoConnectSlide,
    buildProps: () => ({}),
  },

  'FaneqoHomeSlide': {
    component: FaneqoHomeSlide,
    buildProps: () => ({}),
  },

  ...Object.fromEntries(
    Object.entries(flagshipSlides).map(([key, component]) => [key, { component, buildProps: () => ({}) }])
  ),

  'FaneqoIndustryDeckSlide': {
    component: FaneqoIndustryDeckSlide,
    buildProps: (scene) => ({ scene }),
  },

  'FaneqoCoverSlide': {
    component: FaneqoCoverSlide,
    buildProps: () => ({}),
  },

  'SmartLinkSurface': {
    component: SmartLinkSurface,
    buildProps: (demoDataKey) => {
      const data = getDemoData(demoDataKey)
      const band = data.band
      
      return {
        band: {
          name: band.name,
          bio: band.tagline,
          genre: band.genre,
          bandImg: { url: band.imageUrl },
          isBandNameInLogo: false,
          slug: 'neon-avenue',
          // Streaming links
          spotify: 'https://open.spotify.com/artist/neon-avenue',
          appleMusic: 'https://music.apple.com/artist/neon-avenue',
          youtube: 'https://youtube.com/@neonavenue',
          soundcloud: 'https://soundcloud.com/neonavenue',
          // Social links
          instagram: 'https://instagram.com/neonavenue',
          tiktok: 'https://tiktok.com/@neonavenue',
          twitter: 'https://twitter.com/neonavenue',
          // Featured song
          singlesong: {
            title: 'Neon Lights',
            isEmbed: false,
            song: { url: '/demo/neon-lights.mp3' }
          },
          // Featured video
          singlevideo: {
            youtubeid: 'dQw4w9WgXcQ'
          }
        },
        bandSlug: 'neon-avenue',
        upcomingEvents: [
          {
            id: 1,
            city: 'Chicago',
            state: 'IL',
            venue: 'Metro',
            date: '2026-02-15',
            ticketLink: 'https://tickets.example.com'
          },
          {
            id: 2,
            city: 'Detroit',
            state: 'MI',
            venue: 'The Fillmore',
            date: '2026-02-18',
            ticketLink: 'https://tickets.example.com'
          }
        ],
        hiddenLinks: [],
        enabledPaymentButtons: ['quickTip'],
        followablePlatforms: ['spotify', 'instagram']
      }
    }
  },
  
  'ShareablesGrid': {
    component: ShareablesGrid,
    buildProps: (demoDataKey) => {
      const data = getDemoData(demoDataKey)
      
      return {
        bandId: 'demo-band',
        bandName: 'Neon Avenue',
        bandSlug: 'neon-avenue',
        bandImageUrl: '/demo/neonposter.png',
        isBandNameInLogo: false
      }
    }
  },

  // New Step 2 components
  'LiveSurfaceFeed': {
    component: LiveSurfaceFeed,
    buildProps: (demoDataKey) => {
      const data = getDemoData(demoDataKey)
      const rawFeed = data.liveSurface?.recentActivityFeed || []
      
      // Transform demo data to match LiveFeed component expectations
      const feedItems = rawFeed.map(item => ({
        id: item.id,
        icon: item.icon || '🎵',
        copy: item.headline || item.detail,
        timestamp: Date.now() - (parseInt(item.time) || 5) * 60000,
        type: item.type
      }))
      
      return {
        feedItems: feedItems,
        primaryFeedItem: feedItems[0] || null,
        hasFeedItems: feedItems.length > 0,
        displayMode: 'multi',
        maxItems: 5
      }
    }
  },

  'BandAnalyticsOverview': {
    component: BandAnalyticsOverview,
    buildProps: () => {
      // AnalyticsDemoInline is self-contained, no props needed
      return {}
    }
  },

  'SupportMomentsButtons': {
    component: SupportMomentsButtons,
    buildProps: (demoDataKey) => {
      const data = getDemoData(demoDataKey)
      
      return {
        bandName: 'Neon Avenue',
        showQuickTips: true,
        quickTipAmounts: data.quickTipAmounts || [5, 10, 20],
        pageMode: 'QUIET',
        paymentButtons: []
      }
    }
  },

  'AgencyRosterSignals': {
    component: AgencyRosterSignals,
    buildProps: (demoDataKey) => {
      const data = getDemoData(demoDataKey)
      
      return {
        agencyData: data
      }
    }
  },

  'PulseMuse': {
    component: PulseMuse,
    buildProps: (demoDataKey) => {
      const data = getDemoData(demoDataKey)
      
      return {
        pulseData: data.pulse || {
          recentSupport: [],
          stats: { todayTotal: 0, supporters: 0, streak: 0, weekChange: 0 },
          chartBars: [30, 45, 35, 60, 50, 75, 90]
        },
        museData: data.muse || {
          insights: [],
          prediction: { headline: '', confidence: 0, detail: '' }
        }
      }
    }
  },

  'LiveFeedEnhanced': {
    component: LiveFeedEnhanced,
    buildProps: (demoDataKey) => {
      const data = getDemoData(demoDataKey)
      const rawFeed = data.liveSurface?.recentActivityFeed || []
      
      return {
        feedItems: rawFeed
      }
    }
  },

  'ShareablesShowcase': {
    component: ShareablesShowcase,
    buildProps: () => {
      return {}
    }
  }
}

// Helper to resolve component
export function resolveComponent(componentKey) {
  const registry = componentRegistry[componentKey]
  if (!registry) {
    throw new Error(`Component "${componentKey}" not found in registry`)
  }
  return registry
}
