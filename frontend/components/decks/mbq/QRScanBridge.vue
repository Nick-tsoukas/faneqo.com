<template>
  <div class="qr-scan-bridge">
    <!-- QR Code scanning animation -->
    <div class="qr-visual">
      <div class="qr-code">
        <div class="qr-pattern">
          <div v-for="n in 16" :key="n" class="qr-block" :class="{ filled: qrPattern[n-1] }" />
        </div>
        <div class="qr-corner tl" />
        <div class="qr-corner tr" />
        <div class="qr-corner bl" />
      </div>
      
      <!-- Scan line -->
      <div class="scan-line" />
      
      <!-- Pulse rings -->
      <div class="pulse-ring ring-1" />
      <div class="pulse-ring ring-2" />
    </div>
    
    <!-- Scan result: New fan captured -->
    <div class="scan-result">
      <div class="result-icon">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span class="result-text">New fan captured</span>
    </div>
    
    <!-- Source chips -->
    <div class="source-chips">
      <div class="chip source">
        <span class="chip-dot" />
        Show Poster
      </div>
      <div class="chip location">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Nashville
      </div>
      <div class="chip action">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Joined list
      </div>
    </div>
  </div>
</template>

<script setup>
// Simple QR-like pattern
const qrPattern = [
  1,1,1,1,0,1,1,0,
  1,0,0,1,1,0,1,1,
  0,1,1,0,1,1,0,1,
  1,1,0,1,0,1,1,0,
  0,1,1,1,1,0,1,1,
  1,0,1,0,1,1,0,1,
  0,1,0,1,1,0,1,0,
  1,1,1,0,1,1,0,1
]
</script>

<style scoped>
.qr-scan-bridge {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  gap: 1.5rem;
}

.qr-visual {
  position: relative;
  width: 160px;
  height: 160px;
}

.qr-code {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 2px;
}

.qr-pattern {
  position: absolute;
  inset: 1rem;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 2px;
}

.qr-block {
  border-radius: 1px;
}

.qr-block.filled {
  background: #1a1a2e;
}

.qr-corner {
  position: absolute;
  width: 32px;
  height: 32px;
  border: 4px solid #1a1a2e;
  border-radius: 8px;
}

.qr-corner::after {
  content: '';
  position: absolute;
  inset: 4px;
  background: #1a1a2e;
  border-radius: 3px;
}

.qr-corner.tl { top: 12px; left: 12px; }
.qr-corner.tr { top: 12px; right: 12px; }
.qr-corner.bl { bottom: 12px; left: 12px; }

.scan-line {
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(to right, transparent, #10b981, transparent);
  box-shadow: 0 0 10px #10b981;
  animation: scan 2s ease-in-out infinite;
}

@keyframes scan {
  0%, 100% { top: 10%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  50% { top: 90%; }
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #10b981;
  border-radius: 1.5rem;
  opacity: 0;
}

.ring-1 {
  width: 100%;
  height: 100%;
  animation: pulse-ring 2s ease-out infinite;
}

.ring-2 {
  width: 100%;
  height: 100%;
  animation: pulse-ring 2s ease-out infinite;
  animation-delay: 0.5s;
}

@keyframes pulse-ring {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

.scan-result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 2rem;
  animation: result-pop 0.5s ease-out;
}

@keyframes result-pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.result-icon {
  width: 28px;
  height: 28px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.result-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
}

.source-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 2rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chip.source {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #a855f7;
}

.chip.location {
  background: rgba(34, 211, 238, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.3);
  color: #22d3ee;
}

.chip.action {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.chip-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}
</style>
