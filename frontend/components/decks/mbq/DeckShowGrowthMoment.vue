<template>
  <div class="deck-show-growth-moment">
    <!-- Focused timeline view -->
    <div class="growth-container">
      <DemoShowGrowthFlow class="scaled-growth" />
    </div>
    
    <!-- Live indicator -->
    <div class="live-indicator">
      <span class="live-dot" />
      <span class="live-text">Live Show Growth</span>
    </div>
  </div>
</template>

<script setup>
import DemoShowGrowthFlow from '~/components/marketing/DemoShowGrowthFlow.vue'
</script>

<style>
.deck-show-growth-moment {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.growth-container {
  width: 100%;
  max-width: 360px;
  transform: scale(0.85);
  transform-origin: center;
}

.scaled-growth {
  width: 100%;
}

/* Hide section header in deck context */
.scaled-growth .text-center.mb-12 {
  display: none !important;
}

/* Hide CTA section at bottom */
.scaled-growth .mt-14 {
  display: none !important;
}

/* Focus on timeline panel */
.scaled-growth .timeline-panel {
  padding: 1rem !important;
}

/* Reduce stat card text size */
.scaled-growth .text-xl {
  font-size: 1.125rem !important;
}

/* Compact the mini artist card */
.scaled-growth .rounded-2xl {
  padding: 0.75rem !important;
}

.live-indicator {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 2rem;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.live-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
