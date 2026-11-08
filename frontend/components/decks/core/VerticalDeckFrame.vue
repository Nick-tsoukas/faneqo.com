<template>
  <div 
    class="vertical-deck-frame"
    :class="{ 'recording-mode': recordingMode }"
  >
    <!-- MBQ Cinematic Background -->
    <MBQDeckBackground />
    
    <!-- Main 9:16 Canvas -->
    <div class="deck-canvas">
      <!-- Active Slide Slot -->
      <div class="slide-container">
        <slot name="slide" />
      </div>
      
      <!-- Progress Indicator -->
      <div class="progress-area">
        <slot name="progress" />
      </div>
    </div>
    
    <!-- Controls (hidden in recording mode) -->
    <div v-if="!recordingMode" class="controls-area">
      <slot name="controls" />
    </div>
    
    <!-- Recording Mode Indicator -->
    <div v-if="recordingMode" class="recording-indicator">
      <div class="rec-dot" />
      <span>REC</span>
    </div>
  </div>
</template>

<script setup>
import MBQDeckBackground from '../mbq/MBQDeckBackground.vue'

defineProps({
  recordingMode: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.vertical-deck-frame {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

.deck-canvas {
  position: relative;
  width: 100%;
  max-width: 450px;
  aspect-ratio: 9 / 16;
  max-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #111118 100%);
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 0 100px rgba(139, 92, 246, 0.15);
}

/* Recording mode: add subtle frame border */
.recording-mode .deck-canvas {
  border: 2px solid rgba(139, 92, 246, 0.3);
}

.slide-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.progress-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%);
}

.controls-area {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.recording-indicator {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 600;
}

.rec-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Desktop: show frame with background */
@media (min-width: 768px) {
  .deck-canvas {
    border-radius: 1rem;
    max-height: 90vh;
  }
}
</style>
