<template>
  <div class="deck-fan-intelligence-moment">
    <!-- Focused fan list view -->
    <div class="fan-intelligence-container">
      <DemoFanIntelligenceShowcase 
        :compact="true"
        :animated="false"
        class="scaled-intelligence"
      />
    </div>
    
    <!-- Context labels -->
    <div class="moment-labels">
      <div class="label-chip">
        <span class="dot warm" />
        Warm Fans
      </div>
      <div class="label-chip">
        <span class="dot engaged" />
        Engaged
      </div>
      <div class="label-chip">
        <span class="dot superfan" />
        Superfans
      </div>
    </div>
  </div>
</template>

<script setup>
import DemoFanIntelligenceShowcase from '~/components/marketing/DemoFanIntelligenceShowcase.vue'
</script>

<style>
.deck-fan-intelligence-moment {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.fan-intelligence-container {
  width: 100%;
  max-width: 340px;
  transform: scale(0.9);
  transform-origin: center;
  overflow: hidden;
  border-radius: 1.5rem;
}

.scaled-intelligence {
  width: 100%;
}

/* Hide outer glow */
.scaled-intelligence .absolute.-inset-4 {
  display: none !important;
}

/* Focus on fan list by adjusting internal spacing */
.scaled-intelligence .p-4 {
  padding: 0.75rem !important;
}

.scaled-intelligence .p-6 {
  padding: 1rem !important;
}

/* Hide header buttons in deck context */
.scaled-intelligence .demo-header-btn,
.scaled-intelligence .demo-analytics-btn {
  display: none !important;
}

/* Reduce stat card padding */
.scaled-intelligence .stat-card {
  padding: 0.5rem !important;
}

.moment-labels {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.label-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2rem;
  font-size: 0.625rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.warm {
  background: #3b82f6;
}

.dot.engaged {
  background: #10b981;
}

.dot.superfan {
  background: #f59e0b;
  box-shadow: 0 0 4px #f59e0b;
}
</style>
