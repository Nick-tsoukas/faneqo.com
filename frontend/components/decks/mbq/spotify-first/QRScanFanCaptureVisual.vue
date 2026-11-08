<template>
  <div class="qr-scan-visual">
    <!-- QR Code with scan animation -->
    <div class="qr-container">
      <div class="qr-code">
        <!-- QR pattern -->
        <div class="qr-grid">
          <div v-for="n in 25" :key="n" class="qr-cell" :class="{ filled: qrPattern[n-1] }" />
        </div>
        <!-- Corner markers -->
        <div class="corner tl" />
        <div class="corner tr" />
        <div class="corner bl" />
      </div>

      <!-- Scan line -->
      <div class="scan-line" />

      <!-- Pulse rings -->
      <div class="pulse-ring ring-1" />
      <div class="pulse-ring ring-2" />
    </div>

    <!-- Fan captured result -->
    <div class="capture-result">
      <div class="result-icon">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span>New fan from QR</span>
    </div>

    <!-- Source chips -->
    <div class="source-chips">
      <div class="chip poster">
        <span class="chip-dot" />
        Show Poster
      </div>
      <div class="chip city">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Nashville
      </div>
    </div>
  </div>
</template>

<script setup>
// Simplified QR pattern (5x5 grid)
const qrPattern = [
  1,1,1,1,1,
  1,0,1,0,1,
  1,1,0,1,1,
  1,0,1,0,1,
  1,1,1,1,1
]
</script>

<style scoped>
.qr-scan-visual {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  gap: 1.5rem;
}

.qr-container {
  position: relative;
  width: 140px;
  height: 140px;
}

.qr-code {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 1rem;
  padding: 1rem;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 3px;
  width: 100%;
  height: 100%;
}

.qr-cell {
  border-radius: 1px;
}

.qr-cell.filled {
  background: #1a1a2e;
}

.corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 4px solid #1a1a2e;
  border-radius: 6px;
}

.corner::after {
  content: '';
  position: absolute;
  inset: 4px;
  background: #1a1a2e;
  border-radius: 2px;
}

.corner.tl { top: 12px; left: 12px; }
.corner.tr { top: 12px; right: 12px; }
.corner.bl { bottom: 12px; left: 12px; }

.scan-line {
  position: absolute;
  top: 10%;
  left: 15%;
  right: 15%;
  height: 2px;
  background: linear-gradient(to right, transparent, #10b981, transparent);
  box-shadow: 0 0 8px #10b981;
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
  border-radius: 1.25rem;
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

.capture-result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1.25rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 2rem;
}

.result-icon {
  width: 24px;
  height: 24px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.capture-result span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
}

.source-chips {
  display: flex;
  gap: 0.5rem;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 2rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chip.poster {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #a855f7;
}

.chip.city {
  background: rgba(34, 211, 238, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.3);
  color: #22d3ee;
}

.chip-dot {
  width: 5px;
  height: 5px;
  background: #a855f7;
  border-radius: 50%;
}
</style>
