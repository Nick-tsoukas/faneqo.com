import { ref, computed, onUnmounted } from 'vue'
import { getBandDemoCards } from '~/utils/shareables/demoDeck'

const BEATS = ['idle', 'beat1', 'beat2', 'beat3', 'beat4', 'done']

const BEAT_DURATIONS = {
  idle: 0,
  beat1: 2000,    // Smart Link setup
  beat2: 4500,    // Shareables cascade (longer for more cards)
  beat3: 1500,    // Featured takeover
  beat4: 2500,    // Analytics overlay
  done: 0
}

// Preferred card type order for showtime sequence
const CARD_TYPE_ORDER = [
  'CITY_CLAIM',
  'MOMENTUM_SURGE',
  'AFTER_SHOW_ENERGY',
  'NEW_CITY_UNLOCKED',
  'RETURNING_FANS',
  'SHARE_CHAIN',
  'PEAK_HOUR',
  'MILESTONE_DROP',
]

/**
 * Normalize demo deck card to ShareableCard component format
 */
function normalizeShareable(raw) {
  return {
    id: raw.id,
    type: raw.type,
    accent: raw.accent,
    windowLabel: raw.windowLabel,
    title: raw.headline,
    primaryStat: raw.hero,
    secondaryStat: raw.proof,
    microCaption: raw.microCaption,
    band: raw.band,
    share: raw.share,
    // Keep original for reference
    _raw: raw,
  }
}

export function useDemoShowtime() {
  const state = ref('idle')
  const speed = ref(1)
  const isPlaying = ref(false)
  const timelineCursor = ref(0)
  
  let timeoutId = null
  let startTime = null
  let pausedAt = null

  // Demo deck state
  const bandDeck = ref([])
  let bandIdx = 0

  // Shareables conveyor state
  const visibleCards = ref([])
  const featuredCard = ref(null)
  const cardIdCounter = ref(0)

  // Analytics visibility
  const showPulse = ref(false)
  const showStats = ref(false)
  const showCities = ref(false)
  const showSlider = ref(false)

  // Layer visibility/opacity
  const smartLinkOpacity = ref(1)
  const smartLinkBlur = ref(0)

  // Initialize demo deck
  function initDeck() {
    const rawCards = getBandDemoCards()
    // Sort by preferred order
    const orderedCards = []
    CARD_TYPE_ORDER.forEach(type => {
      const card = rawCards.find(c => c.type === type)
      if (card) orderedCards.push(card)
    })
    // Add any remaining cards not in order
    rawCards.forEach(card => {
      if (!orderedCards.find(c => c.id === card.id)) {
        orderedCards.push(card)
      }
    })
    bandDeck.value = orderedCards.map(normalizeShareable)
    bandIdx = 0
  }

  function nextBandCard() {
    if (bandDeck.value.length === 0) initDeck()
    const card = bandDeck.value[bandIdx % bandDeck.value.length]
    bandIdx++
    return { ...card, _instanceId: ++cardIdCounter.value }
  }

  const currentBeatIndex = computed(() => BEATS.indexOf(state.value))
  const isIdle = computed(() => state.value === 'idle')
  const isDone = computed(() => state.value === 'done')
  const beatProgress = computed(() => {
    const duration = BEAT_DURATIONS[state.value]
    if (!duration) return 0
    return Math.min(timelineCursor.value / duration, 1)
  })

  function getScaledDuration(beat) {
    return BEAT_DURATIONS[beat] / speed.value
  }

  function clearScheduledTransition() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function scheduleNextBeat() {
    clearScheduledTransition()
    const duration = getScaledDuration(state.value)
    if (duration <= 0) return

    startTime = Date.now()
    timeoutId = setTimeout(() => {
      nextBeat()
    }, duration - (pausedAt || 0))
    pausedAt = null
  }

  function enterBeat(beat) {
    state.value = beat
    timelineCursor.value = 0

    switch (beat) {
      case 'beat1':
        // Smart Link visible
        smartLinkOpacity.value = 1
        smartLinkBlur.value = 0
        visibleCards.value = []
        featuredCard.value = null
        showPulse.value = false
        showStats.value = false
        showCities.value = false
        showSlider.value = false
        break

      case 'beat2':
        // Start shareables cascade
        startShareablesCascade()
        break

      case 'beat3':
        // Featured takeover
        if (visibleCards.value.length > 0) {
          featuredCard.value = visibleCards.value[visibleCards.value.length - 1]
        }
        smartLinkOpacity.value = 0
        smartLinkBlur.value = 8
        break

      case 'beat4':
        // Analytics overlay - staggered
        setTimeout(() => { showPulse.value = true }, 0)
        setTimeout(() => { showStats.value = true }, getScaledDuration('beat4') * 0.25)
        setTimeout(() => { showCities.value = true }, getScaledDuration('beat4') * 0.5)
        setTimeout(() => { showSlider.value = true }, getScaledDuration('beat4') * 0.75)
        break

      case 'done':
        isPlaying.value = false
        break
    }

    if (isPlaying.value && beat !== 'done') {
      scheduleNextBeat()
    }
  }

  function startShareablesCascade() {
    // Initialize deck if needed
    if (bandDeck.value.length === 0) initDeck()
    
    // Spawn 7 cards from the real demo deck
    const numCards = 7
    const interval = getScaledDuration('beat2') / (numCards + 1)
    
    for (let i = 0; i < numCards; i++) {
      setTimeout(() => {
        pushCard(nextBandCard())
      }, interval * (i + 1))
    }
  }

  function pushCard(card) {
    // Add position tracking for conveyor animation
    const cardWithPosition = {
      ...card,
      position: 0, // 0 = newest (rightmost), increases as pushed left
    }

    // Push existing cards left
    visibleCards.value = visibleCards.value.map(c => ({
      ...c,
      position: c.position + 1
    })).filter(c => c.position < 3) // Keep max 3 visible

    visibleCards.value.push(cardWithPosition)
  }

  function play() {
    if (isDone.value) {
      restart()
      return
    }
    
    isPlaying.value = true
    
    if (isIdle.value) {
      enterBeat('beat1')
    } else {
      scheduleNextBeat()
    }
  }

  function pause() {
    isPlaying.value = false
    if (startTime) {
      pausedAt = Date.now() - startTime
    }
    clearScheduledTransition()
  }

  function restart() {
    clearScheduledTransition()
    isPlaying.value = false
    pausedAt = null
    
    // Reset all state
    visibleCards.value = []
    featuredCard.value = null
    showPulse.value = false
    showStats.value = false
    showCities.value = false
    showSlider.value = false
    smartLinkOpacity.value = 1
    smartLinkBlur.value = 0
    
    state.value = 'idle'
    timelineCursor.value = 0
  }

  function nextBeat() {
    const idx = currentBeatIndex.value
    if (idx < BEATS.length - 1) {
      enterBeat(BEATS[idx + 1])
    }
  }

  function setSpeed(newSpeed) {
    speed.value = newSpeed
  }

  function jumpToBeat(beat) {
    if (BEATS.includes(beat)) {
      clearScheduledTransition()
      enterBeat(beat)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    clearScheduledTransition()
  })

  return {
    // State
    state,
    speed,
    isPlaying,
    timelineCursor,
    currentBeatIndex,
    isIdle,
    isDone,
    beatProgress,

    // Shareables state
    visibleCards,
    featuredCard,

    // Analytics visibility
    showPulse,
    showStats,
    showCities,
    showSlider,

    // Smart link state
    smartLinkOpacity,
    smartLinkBlur,

    // Controls
    play,
    pause,
    restart,
    nextBeat,
    setSpeed,
    jumpToBeat,

    // Director controls
    pushCard,
    nextBandCard,
    initDeck,

    // Constants
    BEATS,
  }
}
