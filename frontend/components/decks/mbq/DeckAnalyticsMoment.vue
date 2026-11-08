<template>
  <div class="deck-analytics-moment">
    <!-- Focused analytics view -->
    <div class="analytics-container">
      <DemoAnalyticsSnapshot class="scaled-analytics" />
    </div>
    
    <!-- Insight pill -->
    <div class="insight-pill">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <span>Know what creates fans</span>
    </div>
  </div>
</template>

<script setup>
import DemoAnalyticsSnapshot from '~/components/marketing/DemoAnalyticsSnapshot.vue'
</script>

<style>
.deck-analytics-moment {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.analytics-container {
  width: 100%;
  max-width: 360px;
  transform: scale(0.9);
  transform-origin: center;
}

.scaled-analytics {
  width: 100%;
}

/* Hide header in deck context */
.scaled-analytics .flex-col.lg\\:flex-row {
  display: none !important;
}

/* Hide CTA section */
.scaled-analytics .text-center.mt-8 {
  display: none !important;
}

/* Hide insight card at bottom */
.scaled-analytics .rounded-2xl {
  display: none !important;
}

/* Compact KPI cards */
.scaled-analytics .kpi-card {
  padding: 0.75rem !important;
}

.scaled-analytics .text-xl {
  font-size: 1.125rem !important;
}

.scaled-analytics .text-2xl {
  font-size: 1.25rem !important;
}

.scaled-analytics .text-3xl {
  font-size: 1.5rem !important;
}

/* Compact analytics panels */
.scaled-analytics .analytics-panel {
  padding: 0.875rem !important;
}

/* Hide fan signal feed section title but keep content */
.scaled-analytics .analytics-panel.mb-6 {
  display: none !important;
}

/* Hide final SEO copy */
.scaled-analytics .text-xs {
  display: none !important;
}

.insight-pill {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1));
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #a855f7;
}
</style>
