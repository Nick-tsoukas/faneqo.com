// Label/Agency Deck v1 - Roster momentum, cities, signals, playbooks
export const labelAgencyDeck_v1 = {
  slug: 'mbq-agency-v1',
  title: 'Label / Agency Deck',
  subtitle: 'Roster Momentum & Signal Intelligence',
  slides: [
    {
      id: 1,
      type: 'narrative',
      chapter: 'Opening',
      content: {
        headline: 'Command Your Roster',
        subhead: 'One dashboard. Every artist\'s momentum.',
        body: 'See who\'s heating up, who needs attention, and where to deploy resources.',
        speakerNotes: 'Open with the label/agency pain: too many artists, not enough visibility. MBQ gives you a command center for the entire roster.'
      }
    },
    {
      id: 2,
      type: 'narrative',
      chapter: 'Problem',
      content: {
        headline: 'Roster Blind Spots',
        subhead: '',
        body: 'You find out an artist is breaking after it\'s already happened. Signals are scattered across platforms.',
        speakerNotes: 'The problem: by the time you see momentum in traditional analytics, the moment has passed. You need real-time signals, not monthly reports.'
      }
    },
    {
      id: 3,
      type: 'dashboard_view',
      chapter: 'Demo: Command Center',
      content: {
        componentKey: 'AgencyRosterSignals',
        demoDataKey: 'demo_agency_roster_signals',
        speakerNotes: 'The Agency Command Center. See all artists ranked by momentum. Top movers, city heat maps, recent signals. This is your war room.'
      }
    },
    {
      id: 4,
      type: 'mobile_view',
      chapter: 'Demo: Artist Surface',
      content: {
        componentKey: 'SmartLinkSurface',
        demoDataKey: 'demo_band_neon_avenue',
        speakerNotes: 'Each artist gets a Live Surface. Consistent branding, real-time updates, fan engagement built in. Scale this across the roster.'
      }
    },
    {
      id: 5,
      type: 'mobile_view',
      chapter: 'Demo: Signals',
      content: {
        componentKey: 'LiveSurfaceFeed',
        demoDataKey: 'demo_band_neon_avenue_live',
        speakerNotes: 'Drill into any artist\'s signals. See what\'s happening in real-time. City claims, song spikes, share chains—all visible.'
      }
    },
    {
      id: 6,
      type: 'dashboard_view',
      chapter: 'Demo: Analytics',
      content: {
        componentKey: 'BandAnalyticsOverview',
        speakerNotes: 'Deep analytics per artist. Compare performance, identify patterns, spot opportunities before competitors do.'
      }
    },
    {
      id: 7,
      type: 'narrative',
      chapter: 'Close',
      content: {
        headline: 'Deploy Resources Where They Matter',
        subhead: '',
        body: 'Stop spreading thin. Focus on artists with momentum.',
        cta: 'Onboard your roster to MBQ.',
        speakerNotes: 'Close with the ROI: better resource allocation, earlier signal detection, faster execution. The command center pays for itself.'
      }
    }
  ],
  metadata: {
    slug: 'mbq-agency-v1',
    title: 'Label / Agency Deck',
    subtitle: 'Roster Momentum & Signal Intelligence',
    totalSlides: 7,
    createdAt: '2026-01-18',
    version: 'v1'
  }
}
