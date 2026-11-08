<template>
  <div class="deck-controller">
    <!-- Play/Pause -->
    <button 
      class="control-btn"
      :class="{ 'playing': props.isPlaying }"
      @click="togglePlay"
      :title="props.isPlaying ? 'Pause (Space)' : 'Play (Space)'"
    >
      <svg v-if="props.isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
      <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
    
    <!-- Previous -->
    <button 
      class="control-btn"
      @click="$emit('prev')"
      title="Previous (←)"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    
    <!-- Next -->
    <button 
      class="control-btn"
      @click="$emit('next')"
      title="Next (→)"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
    
    <!-- Restart -->
    <button 
      class="control-btn"
      @click="$emit('restart')"
      title="Restart (R)"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
    
    <!-- Recording Mode Toggle -->
    <button 
      class="control-btn"
      :class="{ 'active': recordingMode }"
      @click="$emit('toggle-recording')"
      title="Recording Mode (F)"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      </svg>
    </button>
    
    <!-- Slide Counter -->
    <div class="slide-counter">
      {{ props.currentSlide }} / {{ props.totalSlides }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isPlaying: {
    type: Boolean,
    default: false
  },
  currentSlide: {
    type: Number,
    default: 1
  },
  totalSlides: {
    type: Number,
    default: 1
  },
  recordingMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['play', 'pause', 'prev', 'next', 'restart', 'toggle-recording'])

function togglePlay() {
  emit(props.isPlaying ? 'pause' : 'play')
}
</script>

<style scoped>
.deck-controller {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
  transform: translateY(-1px);
}

.control-btn:active {
  transform: translateY(0);
}

.control-btn.playing {
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
  color: #a855f7;
}

.control-btn.active {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.slide-counter {
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 0.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
