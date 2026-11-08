/**
 * MBQ Shareables V1 — Mock Fixtures
 * 
 * Contains mock data for all 10 card types + edge cases for QA testing.
 * Used when dev toggle is enabled or ?shareables=mock query param is present.
 */

/**
 * Mock ShareCards — One card per type with realistic values
 * Covers all 10 V1 card types with varied accents and scores (40-95 range)
 */
export const mockShareCards = [
  {
    id: 'CITY_CLAIM:24h:Chicago',
    type: 'CITY_CLAIM',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '📍 CHICAGO IS HEATING UP',
    hero: '47 FANS',
    proof: '62% OF TRAFFIC • LAST 24H',
    microCaption: {
      hype: 'Chicago is showing love 🔥',
      grateful: 'Chicago, thank you 🙏',
      tease: 'Chicago… we see you 👀',
    },
    accent: 'violet',
    context: {
      city: 'Chicago',
      count: 47,
      sharePct: 62,
      window: '24h',
    },
    score: 83,
  },
  {
    id: 'MOMENTUM_SURGE:2h',
    type: 'MOMENTUM_SURGE',
    window: '2h',
    windowLabel: 'Last 2h',
    headline: '⚡ MOMENTUM SURGE',
    hero: '+127%',
    proof: 'ACTIVITY UP • LAST 2H',
    microCaption: {
      hype: "It's starting to move 🔥",
      grateful: 'Thank you for pushing this forward 🙏',
      tease: 'This is only the beginning 👀',
    },
    accent: 'blue',
    context: {
      growthPct: 127,
      totalInteractions: 34,
      prevTotal: 15,
      window: '2h',
    },
    score: 95,
  },
  {
    id: 'AFTER_SHOW_ENERGY:24h',
    type: 'AFTER_SHOW_ENERGY',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '🎤 AFTER-SHOW ENERGY',
    hero: '156 INTERACTIONS',
    proof: 'PEAK AT 11PM • LAST 24H',
    microCaption: {
      hype: 'Last night hit different 🔥',
      grateful: 'We felt every second of it 🙏',
      tease: 'If you missed it… 👀',
    },
    accent: 'rose',
    context: {
      peakHour: { hour: 23, count: 42 },
      totalInteractions: 156,
      window: '24h',
    },
    score: 88,
  },
  {
    id: 'NEW_CITY_UNLOCKED:7d:Austin',
    type: 'NEW_CITY_UNLOCKED',
    window: '7d',
    windowLabel: 'Last 7d',
    headline: '🗺️ NEW CITY UNLOCKED',
    hero: 'AUSTIN',
    proof: 'FIRST TIME • LAST 7D',
    microCaption: {
      hype: 'Austin just unlocked 🔥',
      grateful: 'Love to Austin 🙏',
      tease: 'Austin… hello 👀',
    },
    accent: 'emerald',
    context: {
      city: 'Austin',
      count: 8,
      window: '7d',
    },
    score: 78,
  },
  {
    id: 'RETURNING_FANS:24h',
    type: 'RETURNING_FANS',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '🔁 FANS ARE COMING BACK',
    hero: '34% RETURNING',
    proof: 'LOYALTY UP • LAST 24H',
    microCaption: {
      hype: 'The real ones are coming back 🔥',
      grateful: 'We appreciate you 🙏',
      tease: 'More coming soon 👀',
    },
    accent: 'amber',
    context: {
      returningRate: 34,
      window: '24h',
    },
    score: 72,
  },
  {
    id: 'SHARE_CHAIN:24h',
    type: 'SHARE_CHAIN',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '🔗 LINKS ARE GETTING SHARED',
    hero: '12 SHARES',
    proof: 'FANS SHARED YOUR PAGE • LAST 24H',
    microCaption: {
      hype: 'The share chain is real 🔥',
      grateful: 'Thank you for sharing 🙏',
      tease: "Something's spreading 👀",
    },
    accent: 'blue',
    context: {
      sharesCount: 12,
      prevSharesCount: 4,
      window: '24h',
    },
    score: 76,
  },
  {
    id: 'ENGAGED_SESSIONS:24h',
    type: 'ENGAGED_SESSIONS',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '🧠 THEY STAYED FOR IT',
    hero: 'AVG 2:34',
    proof: 'REAL ATTENTION • LAST 24H',
    microCaption: {
      hype: "They didn't just click — they stayed 🔥",
      grateful: 'Thanks for the time 🙏',
      tease: "Wait til you see what's next 👀",
    },
    accent: 'violet',
    context: {
      avgTimeOnPageSec: 154,
      engagedSessions: 18,
      window: '24h',
    },
    score: 68,
  },
  {
    id: 'PLATFORM_PULL:24h:spotify',
    type: 'PLATFORM_PULL',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '🎧 SPOTIFY IS HITTING',
    hero: '28 CLICKS',
    proof: 'TOP PLATFORM • LAST 24H',
    microCaption: {
      hype: 'Spotify is popping 🔥',
      grateful: 'Appreciate the listens 🙏',
      tease: 'More on the way 👀',
    },
    accent: 'emerald',
    context: {
      platform: 'spotify',
      count: 28,
      sharePct: 58,
      window: '24h',
    },
    score: 74,
  },
  {
    id: 'PEAK_HOUR:24h',
    type: 'PEAK_HOUR',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '⏰ PEAK HOUR: 3PM',
    hero: '19 HITS',
    proof: 'BEST TIME • LAST 24H',
    microCaption: {
      hype: 'That hour went off 🔥',
      grateful: 'Thank you for pulling up 🙏',
      tease: 'Try again tomorrow 👀',
    },
    accent: 'amber',
    context: {
      peakHour: { hour: 15, count: 19 },
      window: '24h',
    },
    score: 64,
  },
  {
    id: 'MILESTONE_DROP:7d:500 INTERACTIONS',
    type: 'MILESTONE_DROP',
    window: '7d',
    windowLabel: 'Last 7d',
    headline: '🏆 MILESTONE UNLOCKED',
    hero: '500 INTERACTIONS',
    proof: 'LAST 7D • KEEP IT GOING',
    microCaption: {
      hype: 'We just leveled up 🔥',
      grateful: "Couldn't do it without you 🙏",
      tease: 'Next one is coming 👀',
    },
    accent: 'rose',
    context: {
      milestone: '500 INTERACTIONS',
      window: '7d',
    },
    score: 92,
  },
]

/**
 * Mock Edge Cases — Problematic test cards for QA
 * Used to stress-test UI rendering and fallback behavior
 */
export const mockEdgeCases = [
  {
    id: 'EDGE_LONG_HEADLINE',
    type: 'CITY_CLAIM',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '📍 SAN FRANCISCO BAY AREA CALIFORNIA IS ABSOLUTELY ON FIRE RIGHT NOW',
    hero: '89 FANS',
    proof: '71% OF TRAFFIC • LAST 24H',
    microCaption: {
      hype: 'SF Bay is showing massive love 🔥',
      grateful: 'Bay Area, we appreciate every single one of you 🙏',
      tease: 'Bay Area… something big is coming 👀',
    },
    accent: 'violet',
    context: { city: 'San Francisco', count: 89 },
    score: 85,
  },
  {
    id: 'EDGE_LONG_HERO',
    type: 'MILESTONE_DROP',
    window: '30d',
    windowLabel: 'Last 30d',
    headline: '🏆 MILESTONE UNLOCKED',
    hero: '10,000 INTERACTIONS REACHED',
    proof: 'LAST 30D • LEGENDARY STATUS',
    microCaption: {
      hype: 'We hit legendary status 🔥',
      grateful: 'This is all because of you 🙏',
      tease: 'The next milestone is even bigger 👀',
    },
    accent: 'rose',
    context: { milestone: '10000 INTERACTIONS' },
    score: 98,
  },
  {
    id: 'EDGE_MISSING_CAPTION',
    type: 'MOMENTUM_SURGE',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '⚡ MOMENTUM SURGE',
    hero: '+85%',
    proof: 'ACTIVITY UP • LAST 24H',
    microCaption: null,
    accent: 'blue',
    context: { growthPct: 85 },
    score: 75,
  },
  {
    id: 'EDGE_MISSING_BAND_IMAGE',
    type: 'SHARE_CHAIN',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '🔗 LINKS ARE SPREADING',
    hero: '8 SHARES',
    proof: 'ORGANIC GROWTH • LAST 24H',
    microCaption: {
      hype: 'Word of mouth is real 🔥',
      grateful: 'Thank you for spreading the word 🙏',
      tease: 'Keep it going 👀',
    },
    accent: 'blue',
    context: { sharesCount: 8 },
    score: 70,
    _testNote: 'Use with bandImageUrl = null to test placeholder',
  },
  {
    id: 'EDGE_UNKNOWN_ACCENT',
    type: 'PEAK_HOUR',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '⏰ PEAK HOUR: 8PM',
    hero: '24 HITS',
    proof: 'BEST TIME • LAST 24H',
    microCaption: {
      hype: 'Prime time hit 🔥',
      grateful: 'Thanks for showing up 🙏',
      tease: 'Same time tomorrow? 👀',
    },
    accent: 'invalid_color',
    context: { peakHour: { hour: 20, count: 24 } },
    score: 65,
  },
  {
    id: 'EDGE_SCORE_ZERO',
    type: 'RETURNING_FANS',
    window: '7d',
    windowLabel: 'Last 7d',
    headline: '🔁 FANS TRICKLING BACK',
    hero: '5% RETURNING',
    proof: 'LOW BUT GROWING • LAST 7D',
    microCaption: {
      hype: 'Every return counts 🔥',
      grateful: 'We see you coming back 🙏',
      tease: 'Stick around 👀',
    },
    accent: 'amber',
    context: { returningRate: 5 },
    score: 0,
  },
  {
    id: 'EDGE_SCORE_MAX',
    type: 'AFTER_SHOW_ENERGY',
    window: '24h',
    windowLabel: 'Last 24h',
    headline: '🎤 LEGENDARY NIGHT',
    hero: '1,247 INTERACTIONS',
    proof: 'SOLD OUT SHOW • LAST 24H',
    microCaption: {
      hype: 'That was one for the books 🔥',
      grateful: 'We will never forget this night 🙏',
      tease: 'The next one will be even bigger 👀',
    },
    accent: 'rose',
    context: { totalInteractions: 1247 },
    score: 100,
  },
]

/**
 * Get mock recommended cards (top 4 by score)
 */
export function getMockRecommended(cards = mockShareCards) {
  return [...cards].sort((a, b) => b.score - a.score).slice(0, 4)
}

/**
 * Build mock API response matching backend format
 */
export function buildMockApiResponse(cards = mockShareCards, bandId = 1) {
  return {
    ok: true,
    bandId,
    generatedAt: new Date().toISOString(),
    recommended: getMockRecommended(cards),
    cards,
  }
}
