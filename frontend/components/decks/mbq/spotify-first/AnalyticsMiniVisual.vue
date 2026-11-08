<template>
  <div class="analytics-mini">
    <!-- Four metric cards -->
    <div class="metrics">
      <div class="metric-card">
        <div class="metric-icon city">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div class="metric-label">Top City</div>
        <div class="metric-value">Nashville</div>
      </div>

      <div class="metric-card">
        <div class="metric-icon link">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div class="metric-label">Best Link</div>
        <div class="metric-value">Latest Video</div>
      </div>

      <div class="metric-card">
        <div class="metric-icon fans">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="metric-label">New Fans</div>
        <div class="metric-value positive">+38</div>
      </div>

      <div class="metric-card">
        <div class="metric-icon momentum">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div class="metric-label">Momentum</div>
        <div class="metric-value surge">Surging</div>
      </div>
    </div>

    <!-- Mini bar chart -->
    <div class="mini-chart">
      <div class="chart-title">Weekly Growth</div>
      <div class="bars">
        <div class="bar" style="height: 40%" />
        <div class="bar" style="height: 55%" />
        <div class="bar" style="height: 45%" />
        <div class="bar" style="height: 70%" />
        <div class="bar highlight" style="height: 85%" />
        <div class="bar" style="height: 60%" />
        <div class="bar" style="height: 75%" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-mini {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  gap: 1.5rem;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 300px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  text-align: center;
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.metric-icon.city {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.metric-icon.link {
  background: linear-gradient(135deg, #10b981, #22d3ee);
}

.metric-icon.fans {
  background: linear-gradient(135deg, #ec4899, #f59e0b);
}

.metric-icon.momentum {
  background: linear-gradient(135deg, #a855f7, #ec4899);
}

.metric-label {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.metric-value.positive {
  color: #10b981;
}

.metric-value.surge {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.mini-chart {
  width: 100%;
  max-width: 280px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
}

.chart-title {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  text-align: center;
}

.bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 60px;
  gap: 0.5rem;
}

.bar {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px 3px 0 0;
  min-height: 8px;
}

.bar.highlight {
  background: linear-gradient(to top, #a855f7, #ec4899);
}
</style>
