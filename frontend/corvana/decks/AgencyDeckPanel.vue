<template>
  <div class="agency-deck-panel">
    <!-- Header -->
    <div class="panel-header">
      <h2 class="panel-title">Agency Command Center</h2>
      <p class="panel-subtitle">{{ agencyData?.agency?.name || 'Music Agency' }} - Roster Overview</p>
    </div>

    <!-- Top Row: Two Columns -->
    <div class="panel-top-row">
      <!-- Top Movers Card (Self-contained) -->
      <div class="panel-card">
        <div class="card-header">
          <h3 class="card-title">Top Movers</h3>
          <p class="card-subtitle">Bands with highest 7-day velocity</p>
        </div>
        <div class="movers-list">
          <div 
            v-for="(artist, idx) in topMovers" 
            :key="artist.name"
            class="mover-row"
            :class="{ 'top-mover': idx === 0 }"
          >
            <div class="mover-rank" :class="{ 'top-rank': idx < 3 }">{{ idx + 1 }}</div>
            <div class="mover-info">
              <div class="mover-name">{{ artist.name }}</div>
              <div class="mover-action">{{ artist.recommendedAction }}</div>
            </div>
            <div class="mover-change" :class="artist.change.startsWith('+') ? 'positive' : 'negative'">
              {{ artist.change }}
            </div>
            <div class="mover-momentum">{{ artist.momentum }}</div>
          </div>
        </div>
      </div>

      <!-- Heat Map Card (Self-contained) -->
      <div class="panel-card">
        <div class="card-header">
          <h3 class="card-title">City Heat Map</h3>
          <p class="card-subtitle">Top cities by heat score</p>
        </div>
        <div class="heat-list">
          <div 
            v-for="(city, idx) in topCities" 
            :key="city.name"
            class="heat-row"
            :class="{ 'top-city': idx === 0 }"
          >
            <div class="heat-score" :class="getHeatClass(city.heatScore)">{{ city.heatScore }}</div>
            <div class="heat-info">
              <div class="heat-name">{{ city.name }}</div>
              <div class="heat-bar-container">
                <div class="heat-bar" :style="{ width: city.heatScore + '%' }" :class="getHeatBarClass(city.heatScore)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Signal Feed -->
    <div class="panel-bottom-row">
      <div class="panel-card full-width">
        <div class="card-header">
          <h3 class="card-title">Recent Signals</h3>
          <p class="card-subtitle">Latest momentum signals across roster</p>
        </div>
        <div class="signals-list">
          <div 
            v-for="signal in recentSignals" 
            :key="signal.id"
            class="signal-row"
          >
            <div class="signal-type" :class="getSignalTypeClass(signal.type)">
              {{ formatSignalType(signal.type) }}
            </div>
            <div class="signal-info">
              <div class="signal-band">{{ signal.band }}</div>
              <div class="signal-detail">{{ signal.detail }}</div>
            </div>
            <div class="signal-time">{{ signal.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  agencyData: {
    type: Object,
    required: true
  }
})

// Process demo data
const topMovers = computed(() => {
  return props.agencyData?.roster?.slice(0, 4) || []
})

const topCities = computed(() => {
  const cities = [
    { name: 'Chicago', heatScore: 95 },
    { name: 'Los Angeles', heatScore: 88 },
    { name: 'Austin', heatScore: 76 },
    { name: 'New York', heatScore: 65 }
  ]
  return cities
})

const recentSignals = computed(() => {
  return props.agencyData?.signalFeed?.slice(0, 6) || []
})

// Styling helpers
function getHeatClass(score) {
  if (score >= 80) return 'heat-high'
  if (score >= 60) return 'heat-medium'
  return 'heat-low'
}

function getHeatBarClass(score) {
  if (score >= 80) return 'bar-high'
  if (score >= 60) return 'bar-medium'
  return 'bar-low'
}

function getSignalTypeClass(type) {
  const classes = {
    'CITY_CLAIM': 'signal-city',
    'MOMENTUM_SURGE': 'signal-momentum',
    'PLATFORM_PULL': 'signal-platform',
    'ENGAGEMENT_DROP': 'signal-drop'
  }
  return classes[type] || 'signal-default'
}

function formatSignalType(type) {
  const labels = {
    'CITY_CLAIM': 'City Claim',
    'MOMENTUM_SURGE': 'Momentum',
    'PLATFORM_PULL': 'Platform',
    'ENGAGEMENT_DROP': 'Alert'
  }
  return labels[type] || type
}
</script>

<style scoped>
.agency-deck-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-header {
  text-align: center;
  margin-bottom: 0.5rem;
}

.panel-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.25rem;
}

.panel-subtitle {
  font-size: 1rem;
  color: #808080;
  margin: 0;
}

.panel-top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.panel-bottom-row {
  width: 100%;
}

.panel-card {
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.25rem;
}

.panel-card.full-width {
  width: 100%;
}

.card-header {
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.25rem 0;
}

.card-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* Top Movers */
.movers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mover-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.mover-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.mover-row.top-mover {
  background: rgba(16, 185, 129, 0.1);
}

.mover-rank {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.25rem;
  background: rgba(75, 85, 99, 0.5);
  color: #9ca3af;
}

.mover-rank.top-rank {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.mover-info {
  flex: 1;
  min-width: 0;
}

.mover-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mover-action {
  font-size: 0.7rem;
  color: #6b7280;
}

.mover-change {
  font-size: 0.875rem;
  font-weight: 600;
}

.mover-change.positive {
  color: #10b981;
}

.mover-change.negative {
  color: #ef4444;
}

.mover-momentum {
  font-size: 0.75rem;
  color: #9ca3af;
  width: 2rem;
  text-align: right;
}

/* Heat Map */
.heat-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.heat-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.heat-row.top-city {
  background: rgba(139, 92, 246, 0.1);
}

.heat-score {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.5rem;
}

.heat-score.heat-high {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
}

.heat-score.heat-medium {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.heat-score.heat-low {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.heat-info {
  flex: 1;
}

.heat-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  margin-bottom: 0.25rem;
}

.heat-bar-container {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.heat-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.heat-bar.bar-high {
  background: linear-gradient(to right, #f43f5e, #fb7185);
}

.heat-bar.bar-medium {
  background: linear-gradient(to right, #f59e0b, #fbbf24);
}

.heat-bar.bar-low {
  background: linear-gradient(to right, #3b82f6, #60a5fa);
}

/* Signals */
.signals-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.signal-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
}

.signal-type {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}

.signal-type.signal-city {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.signal-type.signal-momentum {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.signal-type.signal-platform {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.signal-type.signal-drop {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.signal-type.signal-default {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.signal-info {
  flex: 1;
  min-width: 0;
}

.signal-band {
  font-size: 0.8rem;
  font-weight: 500;
  color: #fff;
}

.signal-detail {
  font-size: 0.7rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.signal-time {
  font-size: 0.65rem;
  color: #6b7280;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 900px) {
  .panel-top-row {
    grid-template-columns: 1fr;
  }
  
  .signals-list {
    grid-template-columns: 1fr;
  }
}
</style>
