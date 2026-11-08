/**
 * Agency Portal Store (Pinia)
 * Manages state for the Agency Portal V1 with localStorage persistence
 * 
 * HOW TO SWAP FOR REAL API:
 * 1. Replace mock data imports with API fetch calls
 * 2. Add async actions that call your endpoints
 * 3. Keep the same state shape for component compatibility
 * See docs/AGENCY_SCHEMA_BLUEPRINT.md for endpoint suggestions.
 */

import { defineStore } from 'pinia'
import {
  mockOrg,
  mockMembers,
  mockRosterBands,
  mockSignals,
  bandDailyMetrics,
  getTriageBucket,
  getMomentumState,
  getMomentumStateFromVelocity,
  getConfidenceLabel,
  calculateMomentumIndex,
  SIGNAL_SUPPRESSION_HOURS
} from '~/utils/agencyPortal/mockData'

const STORAGE_KEY = 'mbq_agency_portal'

function loadFromStorage() {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (e) {
    console.warn('Failed to load agency portal state from localStorage:', e)
    return null
  }
}

function saveToStorage(data) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save agency portal state to localStorage:', e)
  }
}

export const useAgencyPortalStore = defineStore('agencyPortal', {
  state: () => {
    const stored = loadFromStorage()
    return {
      // Auth
      passwordUnlocked: stored?.passwordUnlocked || false,
      
      // Org data (from mock)
      org: mockOrg,
      members: mockMembers,
      rosterBands: mockRosterBands,
      
      // Signals indexed by bandId
      signalsByBandId: mockSignals.reduce((acc, signal) => {
        if (!acc[signal.bandId]) acc[signal.bandId] = []
        acc[signal.bandId].push(signal)
        return acc
      }, {}),
      
      // Persisted user actions
      handledSignals: stored?.handledSignals || {},
      assignments: stored?.assignments || {},
      tasks: stored?.tasks || [],
      
      // UI state
      selectedBandId: null,
      searchQuery: '',
      filterType: null,
      filterCity: null
    }
  },

  getters: {
    // Get all signals flat
    allSignals: (state) => {
      return Object.values(state.signalsByBandId).flat()
    },

    // Get signals for a specific band
    getSignalsForBand: (state) => (bandId) => {
      return state.signalsByBandId[bandId] || []
    },

    // Get top signal for a band (highest score)
    getTopSignalForBand: (state) => (bandId) => {
      const signals = state.signalsByBandId[bandId] || []
      if (!signals.length) return null
      return signals.reduce((top, s) => s.score > top.score ? s : top, signals[0])
    },

    // Get band by ID
    getBandById: (state) => (bandId) => {
      return state.rosterBands.find(b => b.bandId === bandId)
    },

    // Get member by ID
    getMemberById: (state) => (memberId) => {
      return state.members.find(m => m.id === memberId)
    },

    // Get owner for a band (from assignments or default)
    getOwnerForBand: (state) => (bandId) => {
      const assignedId = state.assignments[bandId]
      if (assignedId) {
        return state.members.find(m => m.id === assignedId)
      }
      const band = state.rosterBands.find(b => b.bandId === bandId)
      if (band?.ownerId) {
        return state.members.find(m => m.id === band.ownerId)
      }
      return null
    },

    // Check if signal is handled
    isSignalHandled: (state) => (signalId) => {
      return !!state.handledSignals[signalId]
    },

    // Get tasks for a band
    getTasksForBand: (state) => (bandId) => {
      return state.tasks.filter(t => t.bandId === bandId)
    },

    // Get triage buckets with bands
    triageBuckets: (state) => {
      const buckets = {
        needsAction: [],
        heatingUp: [],
        watching: [],
        cooling: []
      }

      state.rosterBands.forEach(band => {
        const signals = state.signalsByBandId[band.bandId] || []
        if (!signals.length) {
          buckets.cooling.push({ band, topSignal: null, bucket: 'cooling' })
          return
        }

        const topSignal = signals.reduce((top, s) => s.score > top.score ? s : top, signals[0])
        const bucket = getTriageBucket(topSignal)
        
        // Skip if handled
        if (state.handledSignals[topSignal.id]) {
          return
        }

        buckets[bucket].push({
          band,
          topSignal,
          signals,
          bucket,
          momentumState: getMomentumState(topSignal.score),
          owner: state.members.find(m => m.id === (state.assignments[band.bandId] || band.ownerId))
        })
      })

      // Sort each bucket by score descending
      Object.keys(buckets).forEach(key => {
        buckets[key].sort((a, b) => (b.topSignal?.score || 0) - (a.topSignal?.score || 0))
      })

      return buckets
    },

    // Get cities with activity
    activeCities: (state) => {
      const cityMap = {}
      
      state.rosterBands.forEach(band => {
        const signals = state.signalsByBandId[band.bandId] || []
        signals.forEach(signal => {
          if (signal.context?.city) {
            const city = signal.context.city
            if (!cityMap[city]) {
              cityMap[city] = {
                name: city,
                artists: [],
                signals: [],
                topScore: 0
              }
            }
            if (!cityMap[city].artists.find(a => a.bandId === band.bandId)) {
              cityMap[city].artists.push(band)
            }
            cityMap[city].signals.push({ ...signal, band })
            if (signal.score > cityMap[city].topScore) {
              cityMap[city].topScore = signal.score
              cityMap[city].topSignal = signal
            }
          }
        })
      })

      // Convert to array and sort by artist count
      return Object.values(cityMap)
        .map(city => ({
          ...city,
          artistCount: city.artists.length,
          isStack: city.artists.filter(a => {
            const topSig = state.signalsByBandId[a.bandId]?.find(s => s.context?.city === city.name)
            return topSig && topSig.score >= 75
          }).length >= 2
        }))
        .sort((a, b) => b.artistCount - a.artistCount)
    },

    // Filtered bands for search
    filteredBands: (state) => {
      if (!state.searchQuery) return state.rosterBands
      const q = state.searchQuery.toLowerCase()
      return state.rosterBands.filter(band => 
        band.name.toLowerCase().includes(q) ||
        band.genre?.toLowerCase().includes(q) ||
        band.homeCity?.toLowerCase().includes(q)
      )
    },

    // Tasks grouped by status
    tasksByStatus: (state) => {
      const now = new Date()
      return {
        open: state.tasks.filter(t => t.status === 'open' && new Date(t.dueAt) >= now),
        overdue: state.tasks.filter(t => t.status === 'open' && new Date(t.dueAt) < now),
        done: state.tasks.filter(t => t.status === 'done')
      }
    },

    // V1.1: Get band daily metrics
    getBandDailyMetrics: () => (bandId) => {
      return bandDailyMetrics[bandId] || []
    },

    // V1.1: Get momentum index for a band on a specific day (0 = today, 1 = yesterday, etc)
    getBandMomentumIndex: () => (bandId, daysAgo = 0) => {
      const metrics = bandDailyMetrics[bandId]
      if (!metrics || !metrics.length) return 0
      const idx = metrics.length - 1 - daysAgo
      if (idx < 0 || idx >= metrics.length) return 0
      return calculateMomentumIndex(metrics[idx])
    },

    // V1.1: Get 7-day velocity for a band
    getBandVelocity7d: () => (bandId) => {
      const metrics = bandDailyMetrics[bandId]
      if (!metrics || metrics.length < 8) return 0
      
      const todayIndex = calculateMomentumIndex(metrics[metrics.length - 1])
      const last7 = metrics.slice(-8, -1)
      const avg7d = last7.reduce((sum, m) => sum + calculateMomentumIndex(m), 0) / 7
      
      return Math.round(todayIndex - avg7d)
    },

    // V1.1: Get momentum state for a band using velocity
    getBandMomentumState: () => (bandId) => {
      const metrics = bandDailyMetrics[bandId]
      if (!metrics || metrics.length < 8) return 'steady'
      
      const todayIndex = calculateMomentumIndex(metrics[metrics.length - 1])
      const last7 = metrics.slice(-8, -1)
      const avg7d = last7.reduce((sum, m) => sum + calculateMomentumIndex(m), 0) / 7
      const velocity = todayIndex - avg7d
      
      return getMomentumStateFromVelocity(velocity, todayIndex)
    },

    // V1.1: Get 14-day sparkline data for a band
    getBandSparkline: () => (bandId) => {
      const metrics = bandDailyMetrics[bandId]
      if (!metrics) return []
      return metrics.slice(-14).map(m => calculateMomentumIndex(m))
    },

    // V1.1: Get roster momentum trend (avg across all bands by day)
    rosterMomentumTrend: (state) => (days = 30) => {
      const result = []
      for (let i = days - 1; i >= 0; i--) {
        let sum = 0
        let count = 0
        state.rosterBands.forEach(band => {
          const metrics = bandDailyMetrics[band.bandId]
          if (metrics && metrics.length > i) {
            const idx = metrics.length - 1 - i
            if (idx >= 0) {
              sum += calculateMomentumIndex(metrics[idx])
              count++
            }
          }
        })
        result.push({
          daysAgo: i,
          avgIndex: count > 0 ? Math.round(sum / count) : 0,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      }
      return result
    },

    // V1.1: Get city heat scores
    cityHeatScores: (state) => {
      const cityMap = {}
      
      state.rosterBands.forEach(band => {
        const metrics = bandDailyMetrics[band.bandId]
        if (!metrics || !metrics.length) return
        
        // Use last 7 days
        const recent = metrics.slice(-7)
        recent.forEach(day => {
          if (!day.topCity?.city) return
          const city = day.topCity.city
          const momentumIndex = calculateMomentumIndex(day)
          
          if (!cityMap[city]) {
            cityMap[city] = {
              name: city,
              region: day.topCity.region,
              country: day.topCity.country,
              activeBands: new Set(),
              highMomentumBands: new Set(),
              totalMomentum: 0,
              dayCount: 0
            }
          }
          
          if (momentumIndex >= 60) {
            cityMap[city].activeBands.add(band.bandId)
          }
          if (momentumIndex >= 75) {
            cityMap[city].highMomentumBands.add(band.bandId)
          }
          cityMap[city].totalMomentum += momentumIndex
          cityMap[city].dayCount++
        })
      })
      
      // Calculate heat scores
      return Object.values(cityMap).map(city => {
        const activeCount = city.activeBands.size
        const highCount = city.highMomentumBands.size
        const avgMomentum = city.dayCount > 0 ? city.totalMomentum / city.dayCount : 0
        
        // Stack boost
        let stackBoost = 0
        if (highCount >= 4) stackBoost = 18
        else if (highCount >= 2) stackBoost = 10
        
        const heatScore = Math.min(100, Math.round(avgMomentum + stackBoost))
        
        return {
          name: city.name,
          region: city.region,
          country: city.country,
          heatScore,
          activeArtists: activeCount,
          highMomentumArtists: highCount,
          isStack: highCount >= 2,
          activeBandIds: Array.from(city.activeBands),
          highMomentumBandIds: Array.from(city.highMomentumBands)
        }
      }).sort((a, b) => b.heatScore - a.heatScore)
    },

    // V1.1: Get top movers (bands by velocity)
    topMovers: (state) => {
      return state.rosterBands.map(band => {
        const metrics = bandDailyMetrics[band.bandId]
        if (!metrics || metrics.length < 8) {
          return { band, velocity: 0, momentumIndex: 0, topCity: null, topSignal: null }
        }
        
        const todayIndex = calculateMomentumIndex(metrics[metrics.length - 1])
        const last7 = metrics.slice(-8, -1)
        const avg7d = last7.reduce((sum, m) => sum + calculateMomentumIndex(m), 0) / 7
        const velocity = Math.round(todayIndex - avg7d)
        
        const topCity = metrics[metrics.length - 1]?.topCity?.city || band.homeCity
        const signals = state.signalsByBandId[band.bandId] || []
        const topSignal = signals.length ? signals.reduce((top, s) => s.score > top.score ? s : top, signals[0]) : null
        
        return { band, velocity, momentumIndex: todayIndex, topCity, topSignal }
      }).sort((a, b) => b.velocity - a.velocity)
    },

    // V1.1: Get platform pull mix (aggregated across roster)
    platformPullMix: (state) => (days = 7) => {
      const totals = { spotify: 0, youtube: 0, tickets: 0, instagram: 0 }
      
      state.rosterBands.forEach(band => {
        const metrics = bandDailyMetrics[band.bandId]
        if (!metrics) return
        
        const recent = metrics.slice(-days)
        recent.forEach(day => {
          if (day.platformClicks) {
            totals.spotify += day.platformClicks.spotify || 0
            totals.youtube += day.platformClicks.youtube || 0
            totals.tickets += day.platformClicks.tickets || 0
            totals.instagram += day.platformClicks.instagram || 0
          }
        })
      })
      
      const total = totals.spotify + totals.youtube + totals.tickets + totals.instagram
      
      return {
        totals,
        percentages: {
          spotify: total > 0 ? Math.round(totals.spotify / total * 100) : 0,
          youtube: total > 0 ? Math.round(totals.youtube / total * 100) : 0,
          tickets: total > 0 ? Math.round(totals.tickets / total * 100) : 0,
          instagram: total > 0 ? Math.round(totals.instagram / total * 100) : 0
        },
        total
      }
    },

    // V1.1: Get after-show lift data
    afterShowLift: (state) => {
      let afterShowDays = []
      let baselineDays = []
      
      state.rosterBands.forEach(band => {
        const metrics = bandDailyMetrics[band.bandId]
        if (!metrics) return
        
        metrics.forEach(day => {
          const index = calculateMomentumIndex(day)
          if (day.isAfterShow) {
            afterShowDays.push(index)
          } else {
            baselineDays.push(index)
          }
        })
      })
      
      const avgAfterShow = afterShowDays.length > 0 
        ? Math.round(afterShowDays.reduce((a, b) => a + b, 0) / afterShowDays.length)
        : 0
      const avgBaseline = baselineDays.length > 0
        ? Math.round(baselineDays.reduce((a, b) => a + b, 0) / baselineDays.length)
        : 0
      
      const lift = avgBaseline > 0 ? Math.round((avgAfterShow - avgBaseline) / avgBaseline * 100) : 0
      
      return {
        avgAfterShow,
        avgBaseline,
        lift,
        afterShowCount: afterShowDays.length,
        baselineCount: baselineDays.length
      }
    },

    // V1.1: Apply signal hygiene (dedupe, suppression)
    hygieneSignals: (state) => (signals, options = {}) => {
      const { maxPerBand = null, showHandled = false } = options
      
      // Filter handled if needed
      let filtered = showHandled 
        ? signals 
        : signals.filter(s => !state.handledSignals[s.id])
      
      // DEDUPE: Only top signal per (bandId + type + windowLabel)
      const dedupeMap = {}
      filtered.forEach(signal => {
        const key = `${signal.bandId}:${signal.type}:${signal.windowLabel}`
        if (!dedupeMap[key] || signal.score > dedupeMap[key].score) {
          dedupeMap[key] = signal
        }
      })
      filtered = Object.values(dedupeMap)
      
      // SUPPRESSION: Hide repeated (bandId + type) within suppression window
      const suppressionMap = {}
      const now = new Date()
      filtered = filtered.filter(signal => {
        const key = `${signal.bandId}:${signal.type}`
        const suppressionHours = SIGNAL_SUPPRESSION_HOURS[signal.type] || SIGNAL_SUPPRESSION_HOURS.default
        const signalTime = new Date(signal.createdAt)
        const hoursSince = (now - signalTime) / (1000 * 60 * 60)
        
        if (suppressionMap[key]) {
          const lastTime = new Date(suppressionMap[key].createdAt)
          const hoursBetween = (signalTime - lastTime) / (1000 * 60 * 60)
          if (Math.abs(hoursBetween) < suppressionHours) {
            // Keep the higher scoring one
            if (signal.score > suppressionMap[key].score) {
              suppressionMap[key] = signal
            }
            return false
          }
        }
        suppressionMap[key] = signal
        return true
      })
      
      // Sort by score descending
      filtered.sort((a, b) => b.score - a.score)
      
      // INBOX CAP: Max signals per band
      if (maxPerBand) {
        const bandCounts = {}
        filtered = filtered.filter(signal => {
          bandCounts[signal.bandId] = (bandCounts[signal.bandId] || 0) + 1
          return bandCounts[signal.bandId] <= maxPerBand
        })
      }
      
      // Add confidence label
      filtered = filtered.map(signal => ({
        ...signal,
        confidence: getConfidenceLabel(signal.score)
      }))
      
      return filtered
    },

    // V1.1: Get hygiene-filtered signals for inbox (max 3 per band)
    inboxSignals: (state) => {
      const allSignals = Object.values(state.signalsByBandId).flat()
      return state.hygieneSignals(allSignals, { maxPerBand: 3 })
    },

    // V1.1: Get hygiene-filtered signals for feed
    feedSignals: (state) => (options = {}) => {
      const { showHandled = false } = options
      const allSignals = Object.values(state.signalsByBandId).flat()
      return state.hygieneSignals(allSignals, { showHandled })
    },

    // V1.2: Get band's top city from daily metrics or signals
    getBandTopCity: (state) => (bandId) => {
      const metrics = state.getBandDailyMetrics(bandId)
      if (metrics && metrics.length > 0) {
        return metrics[metrics.length - 1]?.topCity || null
      }
      const signals = state.signalsByBandId[bandId] || []
      const citySignal = signals.find(s => s.context?.city)
      return citySignal?.context?.city || null
    },

    // V1.2: Get overdue tasks
    overdueTasks: (state) => {
      const now = new Date()
      return state.tasks.filter(t => {
        if (t.status === 'done') return false
        if (!t.dueAt) return false
        return new Date(t.dueAt) < now
      })
    },

    // V1.2: Get open tasks
    openTasks: (state) => {
      return state.tasks.filter(t => t.status !== 'done')
    }
  },

  actions: {
    // Persist state to localStorage
    persist() {
      saveToStorage({
        passwordUnlocked: this.passwordUnlocked,
        handledSignals: this.handledSignals,
        assignments: this.assignments,
        tasks: this.tasks
      })
    },

    // Unlock portal with password
    unlockPortal(password) {
      if (password === 'password101') {
        this.passwordUnlocked = true
        this.persist()
        return true
      }
      return false
    },

    // Lock portal (logout)
    lockPortal() {
      this.passwordUnlocked = false
      this.persist()
    },

    // Mark signal as handled
    handleSignal(signalId, memberId = 'mem_001') {
      this.handledSignals[signalId] = {
        handledAt: new Date().toISOString(),
        handledBy: memberId
      }
      this.persist()
    },

    // Unhandle signal
    unhandleSignal(signalId) {
      delete this.handledSignals[signalId]
      this.persist()
    },

    // Assign band to member
    assignBand(bandId, memberId) {
      this.assignments[bandId] = memberId
      this.persist()
    },

    // Create task
    createTask(task) {
      const newTask = {
        id: `task_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'open',
        ...task
      }
      this.tasks.push(newTask)
      this.persist()
      return newTask
    },

    // Update task
    updateTask(taskId, updates) {
      const idx = this.tasks.findIndex(t => t.id === taskId)
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], ...updates }
        this.persist()
      }
    },

    // Complete task
    completeTask(taskId) {
      this.updateTask(taskId, { status: 'done', completedAt: new Date().toISOString() })
    },

    // Delete task
    deleteTask(taskId) {
      this.tasks = this.tasks.filter(t => t.id !== taskId)
      this.persist()
    },

    // Set search query
    setSearchQuery(query) {
      this.searchQuery = query
    },

    // Set filters
    setFilters({ type, city }) {
      if (type !== undefined) this.filterType = type
      if (city !== undefined) this.filterCity = city
    },

    // Update band tier
    updateBandTier(bandId, tier) {
      const band = this.rosterBands.find(b => b.bandId === bandId)
      if (band) {
        band.tier = tier
      }
    }
  }
})
