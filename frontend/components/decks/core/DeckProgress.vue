<template>
  <div class="deck-progress">
    <!-- Segmented Progress Bar -->
    <div class="progress-segments">
      <div 
        v-for="(slide, index) in totalSlides" 
        :key="index"
        class="progress-segment"
        :class="{
          'completed': index < currentSlideIndex,
          'active': index === currentSlideIndex,
          'pending': index > currentSlideIndex
        }"
      >
        <!-- Progress fill for active slide -->
        <div 
          v-if="index === currentSlideIndex"
          class="progress-fill"
          :style="{ width: `${slideProgress}%` }"
        />
      </div>
    </div>
    
    <!-- Current Slide Indicator (optional, subtle) -->
    <div class="slide-indicator">
      <span class="current">{{ currentSlideIndex + 1 }}</span>
      <span class="separator">/</span>
      <span class="total">{{ totalSlides }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentSlideIndex: {
    type: Number,
    default: 0
  },
  totalSlides: {
    type: Number,
    default: 1
  },
  slideProgress: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.deck-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.progress-segments {
  flex: 1;
  display: flex;
  gap: 0.25rem;
  height: 3px;
}

.progress-segment {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  transition: background 0.3s ease;
}

.progress-segment.completed {
  background: #a855f7;
}

.progress-segment.active {
  background: rgba(255, 255, 255, 0.3);
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #a855f7;
  border-radius: 2px;
  transition: width 0.1s linear;
}

.slide-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

.slide-indicator .current {
  color: #a855f7;
}

.slide-indicator .separator {
  opacity: 0.4;
}
</style>
