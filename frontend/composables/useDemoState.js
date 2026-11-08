import { ref, computed, reactive } from 'vue'
import { getBandDemoCards, DEMO_BAND } from '~/utils/shareables/demoDeck'

// ============================================================================
// SHARED DEMO STATE - Single source of truth for all demo screens
// Used by: SceneMoments, SceneProof, SceneShowtime, DemoShowtimeStage
// ============================================================================

// Core demo stats
const demoStats = ref({
  profileVisits: 342,
  plays: 156,
  linkClicks: 134,
  follows: 23,
  shares: 12,
  scans: 127,
  spotifyClicks: 89,
  appleMusicClicks: 45,
  youtubePlays: 67,
  ticketClicks: 34,
  merchClicks: 12,
})

// Momentum state derived from activity
const MOMENTUM_THRESHOLDS = {
  cooling: { min: 0, max: 20 },
  watching: { min: 21, max: 50 },
  heating: { min: 51, max: 100 },
  breakout: { min: 101, max: Infinity },
}

// Top cities with counts
const topCities = ref([
  { name: 'Los Angeles', count: 45 },
  { name: 'New York', count: 38 },
  { name: 'Chicago', count: 29 },
  { name: 'Austin', count: 24 },
  { name: 'Nashville', count: 18 },
])

// Platform breakdown
const platformBreakdown = ref([
  { key: 'spotify', label: 'Spotify', icon: '🎵', count: 89 },
  { key: 'apple', label: 'Apple Music', icon: '🍎', count: 45 },
  { key: 'youtube', label: 'YouTube', icon: '📺', count: 67 },
  { key: 'tickets', label: 'Tickets', icon: '🎟️', count: 34 },
])

// Recent shares (from share drawer actions)
const recentShares = ref([])

// Recent shareables (last generated cards)
const recentShareables = ref([])

// Shareable deck management
let bandDeck = []
let deckIdx = 0
let instanceCounter = 0

function initDeck() {
  bandDeck = getBandDemoCards()
  deckIdx = 0
}

function normalizeCard(raw) {
  const ogParams = new URLSearchParams({
    bandId: String(DEMO_BAND.id),
    bandSlug: DEMO_BAND.slug,
    type: raw.type,
    hero: raw.hero,
    headline: raw.headline,
    proof: raw.proof,
    accent: raw.accent,
  })
  const ogUrl = `https://musicbizqr.com/share/shareable/demo-${raw.type.toLowerCase()}?${ogParams.toString()}`

  return {
    id: raw.id,
    _instanceId: ++instanceCounter,
    type: raw.type,
    kind: raw.type,
    accent: raw.accent,
    windowLabel: raw.windowLabel,
    title: raw.headline,
    primaryStat: raw.hero,
    secondaryStat: raw.proof,
    headline: raw.headline,
    hero: raw.hero,
    proof: raw.proof,
    band: {
      id: DEMO_BAND.id,
      name: DEMO_BAND.name,
      slug: DEMO_BAND.slug,
      imageUrl: DEMO_BAND.imageUrl,
      isBandNameInLogo: DEMO_BAND.isBandNameInLogo,
    },
    share: {
      captions: raw.microCaption || {
        hype: `${raw.headline} 🔥`,
        grateful: `${raw.headline} 🙏`,
        tease: `${raw.headline} 👀`,
      },
      shareUrl: `https://musicbizqr.com/${DEMO_BAND.slug}`,
      ogUrl: ogUrl,
    },
  }
}

export function useDemoState() {
  // Computed: momentum state
  const momentumState = computed(() => {
    const activity = demoStats.value.shares + Math.floor(demoStats.value.profileVisits / 10)
    if (activity >= MOMENTUM_THRESHOLDS.breakout.min) return 'breakout'
    if (activity >= MOMENTUM_THRESHOLDS.heating.min) return 'heating'
    if (activity >= MOMENTUM_THRESHOLDS.watching.min) return 'watching'
    return 'cooling'
  })

  const momentumLabel = computed(() => {
    const labels = {
      cooling: 'Cooling — activity is low',
      watching: 'Watching — building momentum',
      heating: 'Heating — engagement rising',
      breakout: 'Breakout — viral potential',
    }
    return labels[momentumState.value]
  })

  const momentumColor = computed(() => {
    const colors = {
      cooling: 'text-blue-400',
      watching: 'text-yellow-400',
      heating: 'text-orange-400',
      breakout: 'text-red-400',
    }
    return colors[momentumState.value]
  })

  // Actions

  /**
   * Simulate N fans hitting the link
   */
  function simulateFans(n = 50) {
    demoStats.value.profileVisits += n
    demoStats.value.scans += Math.floor(n * 0.6)
    demoStats.value.linkClicks += Math.floor(n * 0.8)
    demoStats.value.plays += Math.floor(n * 0.3)
    demoStats.value.follows += Math.floor(n * 0.08)
    demoStats.value.spotifyClicks += Math.floor(n * 0.35)
    demoStats.value.appleMusicClicks += Math.floor(n * 0.15)
    demoStats.value.youtubePlays += Math.floor(n * 0.2)

    // Bump random cities
    const citiesToBump = Math.min(3, topCities.value.length)
    for (let i = 0; i < citiesToBump; i++) {
      const idx = Math.floor(Math.random() * topCities.value.length)
      topCities.value[idx].count += Math.floor(n / 5) + Math.floor(Math.random() * 5)
    }

    // Update platform breakdown
    platformBreakdown.value[0].count = demoStats.value.spotifyClicks
    platformBreakdown.value[1].count = demoStats.value.appleMusicClicks
    platformBreakdown.value[2].count = demoStats.value.youtubePlays
    platformBreakdown.value[3].count = demoStats.value.ticketClicks
  }

  /**
   * Simulate N shares
   */
  function simulateShares(n = 10) {
    demoStats.value.shares += n
    demoStats.value.profileVisits += n * 3

    const platforms = ['Instagram', 'Facebook', 'Twitter', 'TikTok']
    const platformIcons = {
      Instagram: '📸',
      Facebook: '👍',
      Twitter: '🐦',
      TikTok: '🎵',
    }

    // Record recent shares
    for (let i = 0; i < Math.min(n, 3); i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)]
      recentShares.value.unshift({
        platform,
        platformIcon: platformIcons[platform],
        caption: getRandomCaption(),
        timeAgo: 'just now',
        shareableType: getRandomShareableType(),
      })
    }

    // Keep max 10 recent shares
    if (recentShares.value.length > 10) {
      recentShares.value = recentShares.value.slice(0, 10)
    }

    // Spawn 1-2 new shareables
    const spawnCount = Math.random() > 0.5 ? 2 : 1
    for (let i = 0; i < spawnCount; i++) {
      spawnShareable()
    }

    // Bump a city
    const cityIdx = Math.floor(Math.random() * topCities.value.length)
    topCities.value[cityIdx].count += Math.floor(n / 2)
  }

  /**
   * Record a share from the share drawer
   */
  function recordShare({ platform, caption, shareable }) {
    demoStats.value.shares += 1
    demoStats.value.profileVisits += Math.floor(Math.random() * 15) + 5

    const platformIcons = {
      Instagram: '📸',
      Facebook: '👍',
      Twitter: '🐦',
      TikTok: '🎵',
      Copy: '📋',
    }

    recentShares.value.unshift({
      platform,
      platformIcon: platformIcons[platform] || '📤',
      caption: (caption || '').slice(0, 50) + ((caption || '').length > 50 ? '...' : ''),
      timeAgo: 'just now',
      shareableType: shareable?.type || 'MOMENT',
    })

    if (recentShares.value.length > 10) {
      recentShares.value = recentShares.value.slice(0, 10)
    }

    // Maybe spawn a SHARE_CHAIN card
    if (Math.random() > 0.6) {
      spawnShareable('SHARE_CHAIN')
    }
  }

  /**
   * Spawn a new shareable card
   */
  function spawnShareable(typeHint) {
    if (bandDeck.length === 0) initDeck()

    let raw
    if (typeHint) {
      raw = bandDeck.find(c => c.type === typeHint) || bandDeck[deckIdx % bandDeck.length]
    } else {
      raw = bandDeck[deckIdx % bandDeck.length]
    }
    deckIdx++

    const card = normalizeCard(raw)
    recentShareables.value.unshift(card)

    // Keep max 6 recent shareables
    if (recentShareables.value.length > 6) {
      recentShareables.value = recentShareables.value.slice(0, 6)
    }

    return card
  }

  /**
   * Get next card from deck (for Moments gallery)
   */
  function getNextCard() {
    if (bandDeck.length === 0) initDeck()
    const raw = bandDeck[deckIdx % bandDeck.length]
    deckIdx++
    return normalizeCard(raw)
  }

  /**
   * Reset demo state to defaults
   */
  function resetDemoState() {
    demoStats.value = {
      profileVisits: 342,
      plays: 156,
      linkClicks: 134,
      follows: 23,
      shares: 12,
      scans: 127,
      spotifyClicks: 89,
      appleMusicClicks: 45,
      youtubePlays: 67,
      ticketClicks: 34,
      merchClicks: 12,
    }

    topCities.value = [
      { name: 'Los Angeles', count: 45 },
      { name: 'New York', count: 38 },
      { name: 'Chicago', count: 29 },
      { name: 'Austin', count: 24 },
      { name: 'Nashville', count: 18 },
    ]

    platformBreakdown.value = [
      { key: 'spotify', label: 'Spotify', icon: '🎵', count: 89 },
      { key: 'apple', label: 'Apple Music', icon: '🍎', count: 45 },
      { key: 'youtube', label: 'YouTube', icon: '📺', count: 67 },
      { key: 'tickets', label: 'Tickets', icon: '🎟️', count: 34 },
    ]

    recentShares.value = []
    recentShareables.value = []
    deckIdx = 0
  }

  // Helper functions
  function getRandomCaption() {
    const captions = [
      'Chicago is on fire tonight! 🔥',
      'New fans joining the movement 🚀',
      'The energy is unreal right now',
      'This momentum is insane 📈',
      'Fan love hitting different today',
      'Watch this space 👀',
    ]
    return captions[Math.floor(Math.random() * captions.length)]
  }

  function getRandomShareableType() {
    const types = ['CITY_CLAIM', 'MOMENTUM_SURGE', 'SHARE_CHAIN', 'MILESTONE', 'HOT_CITY']
    return types[Math.floor(Math.random() * types.length)]
  }

  // Initialize deck on first use
  if (bandDeck.length === 0) {
    initDeck()
  }

  return {
    // State
    demoStats,
    topCities,
    platformBreakdown,
    recentShares,
    recentShareables,

    // Computed
    momentumState,
    momentumLabel,
    momentumColor,

    // Actions
    simulateFans,
    simulateShares,
    recordShare,
    spawnShareable,
    getNextCard,
    resetDemoState,

    // Constants
    DEMO_BAND,
  }
}
