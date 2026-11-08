// MBQ Flagship Deck v1 - Step 2 expansion (6 slides for pitch-ready mini flagship)
export const flagshipDeck_v1 = {
  slug: 'mbq-flagship-v1',
  title: 'MBQ Flagship Deck v1',
  subtitle: 'Live Artist Surface + Momentum Intelligence Layer',
  slides: [
    {
      id: 1,
      type: 'narrative',
      content: {
        headline: 'MusicBizQR',
        subhead: 'Live Artist Surface + Momentum Intelligence Layer',
        body: 'Transforming static band pages into dynamic, real-time experiences that adapt to tour states, fan activity, and momentum signals.',
        speakerNotes: 'This is the flagship presentation showcasing MBQ\'s Live Surface technology and momentum intelligence capabilities.'
      }
    },
    {
      id: 2,
      type: 'mobile_view',
      content: {
        componentKey: 'SmartLinkSurface',
        demoDataKey: 'demo_band_neon_avenue',
        speakerNotes: 'The Smart Link Surface shows how band pages transform into live experiences with real-time updates, tour states, and fan engagement signals.'
      }
    },
    {
      id: 3,
      type: 'mobile_view',
      content: {
        componentKey: 'LiveSurfaceFeed',
        demoDataKey: 'demo_band_neon_avenue_live',
        speakerNotes: 'The Live Surface Feed shows real-time micro-signals from fan activity, creating a living sense of momentum and engagement around the artist.'
      }
    },
    {
      id: 4,
      type: 'dashboard_view',
      content: {
        componentKey: 'BandAnalyticsOverview',
        speakerNotes: 'Analytics Dashboard provides comprehensive insights into fan behavior, platform preferences, and engagement patterns to drive data-driven decisions.'
      }
    },
    {
      id: 5,
      type: 'mobile_view',
      content: {
        componentKey: 'SupportMomentsButtons',
        demoDataKey: 'demo_band_neon_avenue_support',
        speakerNotes: 'Support Module turns fan appreciation into sustainable revenue with smart payment options and contextual timing based on tour states.'
      }
    },
    {
      id: 6,
      type: 'dashboard_view',
      content: {
        componentKey: 'AgencyRosterSignals',
        demoDataKey: 'demo_agency_roster_signals',
        speakerNotes: 'Agency Command Center provides label teams with a comprehensive view of roster momentum, signals, and actionable insights across all artists.'
      }
    }
  ],
  metadata: {
    slug: 'mbq-flagship-v1',
    title: 'MBQ Flagship Deck v1',
    subtitle: 'Live Artist Surface + Momentum Intelligence Layer',
    totalSlides: 6,
    createdAt: new Date().toISOString(),
    version: 'v1-step2'
  }
}
