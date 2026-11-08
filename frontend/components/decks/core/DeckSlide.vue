<template>
  <Transition
    enter-active-class="slide-enter-active"
    enter-from-class="slide-enter-from"
    enter-to-class="slide-enter-to"
    leave-active-class="slide-leave-active"
    leave-from-class="slide-leave-from"
    leave-to-class="slide-leave-to"
  >
    <div 
      v-if="active"
      class="deck-slide"
      :class="[`intensity-${intensity}`]"
    >
      <!-- Content Container -->
      <div class="slide-content">
        <!-- Eyebrow -->
        <div v-if="eyebrow" class="slide-eyebrow">
          {{ eyebrow }}
        </div>
        
        <!-- Headline -->
        <h1 v-if="headline" class="slide-headline">
          {{ headline }}
        </h1>
        
        <!-- Subtitle -->
        <p v-if="subtitle" class="slide-subtitle">
          {{ subtitle }}
        </p>
        
        <!-- Visual Slot -->
        <div class="slide-visual">
          <slot name="visual" />
        </div>
        
        <!-- Default Slot for custom content -->
        <slot />
      </div>
      
      <!-- Safe Area for TikTok Captions -->
      <div class="caption-safe-area" />
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false
  },
  headline: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  eyebrow: {
    type: String,
    default: ''
  },
  intensity: {
    type: String,
    default: 'medium',
    validator: (val) => ['low', 'medium', 'high'].includes(val)
  }
})
</script>

<style scoped>
.deck-slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  padding-bottom: 6rem; /* Space for progress + captions */
  overflow: hidden;
}

.slide-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.slide-eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #a855f7;
  margin-bottom: 0.5rem;
}

.slide-headline {
  font-size: clamp(1.75rem, 8vw, 2.5rem);
  font-weight: 800;
  line-height: 1.1;
  color: #fff;
  margin: 0;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.intensity-high .slide-headline {
  font-size: clamp(2rem, 10vw, 3rem);
  font-weight: 900;
}

.intensity-low .slide-headline {
  font-size: clamp(1.5rem, 6vw, 2rem);
  font-weight: 700;
}

.slide-subtitle {
  font-size: clamp(1rem, 4vw, 1.25rem);
  font-weight: 400;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  max-width: 90%;
}

.slide-visual {
  width: 100%;
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.caption-safe-area {
  height: 80px;
  flex-shrink: 0;
}

/* Transition Animations */
.slide-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  filter: blur(4px);
}

.slide-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.slide-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
  filter: blur(4px);
}

/* Intensity variations */
.intensity-high .slide-enter-active {
  transition-duration: 0.8s;
}

.intensity-high .slide-enter-from {
  transform: translateY(50px) scale(0.9);
  filter: blur(8px);
}
</style>
