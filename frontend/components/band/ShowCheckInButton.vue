<template>
  <!-- Simple Trigger Button - Opens Premium Modal -->
  <div v-if="showModeEnabled" class="show-check-in-trigger">
    <button 
      class="check-in-trigger-btn"
      @click="$emit('open-check-in-modal')"
    >
      <span class="btn-glow"></span>
      <span class="btn-icon">📍</span>
      <span class="btn-text">I'm Here Tonight</span>
    </button>
    <p class="check-in-hint">Check in to be part of tonight's show</p>
  </div>
</template>

<script setup>
// This button only triggers check-in. The modal and all show context live on
// pages/[bandSlug]/index.vue, so the event is forwarded up to the page.
defineProps({
  showModeEnabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['open-check-in-modal'])
</script>

<style scoped>
.show-check-in-trigger {
  padding: 1rem;
  text-align: center;
}

.check-in-trigger-btn {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 1rem;
  color: white;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.check-in-trigger-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.6);
}

.check-in-trigger-btn:active {
  transform: translateY(0);
}

.check-in-trigger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.check-in-trigger-btn:hover .btn-glow {
  opacity: 1;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.btn-icon {
  font-size: 1.125rem;
  position: relative;
  z-index: 2;
}

.btn-text {
  position: relative;
  z-index: 2;
  letter-spacing: 0.02em;
}

.check-in-hint {
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  line-height: 1.4;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .check-in-trigger-btn {
    padding: 0.875rem 1.25rem;
    font-size: 0.875rem;
  }
  
  .btn-icon {
    font-size: 1rem;
  }
  
  .check-in-hint {
    font-size: 0.7125rem;
  }
}
</style>
