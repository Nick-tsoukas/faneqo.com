<template>
  <div class="banner banner-warning mb-6">
    <div class="banner-icon">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div class="banner-content">
      <h3 class="banner-title">
        Trial ends in {{ daysLeft }} {{ daysLeft === 1 ? 'day' : 'days' }}
      </h3>
      <p class="banner-text">
        Add a payment method now to keep your access uninterrupted after your trial.
      </p>
    </div>
    <div class="banner-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${Math.max(0, 100 - (daysLeft / 30) * 100)}%` }"></div>
      </div>
      <span class="progress-label">{{ daysLeft }}/30 days left</span>
    </div>
    <button
      @click="handleAddPayment"
      :disabled="disabled"
      class="banner-button banner-button-warning"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      Add Payment
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, onMounted } from 'vue'

const props = defineProps<{
  daysLeft: number
  disabled?: boolean
}>()

// ← **This** was missing!
const emit = defineEmits<{
  (e: 'add-payment'): void
}>()

onMounted(() => {
  console.debug('[TrialBanner] mounted with daysLeft =', props.daysLeft)
})

function handleAddPayment() {
  if (props.disabled) return
  console.debug('[TrialBanner] Add Payment button clicked')
  emit('add-payment')
}
</script>

<style scoped>
.banner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid;
}

@media (min-width: 768px) {
  .banner {
    flex-direction: row;
    align-items: center;
  }
}

.banner-warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.banner-warning .banner-icon {
  background: rgba(245, 158, 11, 0.2);
  color: rgb(251, 191, 36);
}

.banner-content {
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.banner-warning .banner-title {
  color: rgb(253, 224, 71);
}

.banner-text {
  font-size: 0.875rem;
  line-height: 1.5;
}

.banner-warning .banner-text {
  color: rgba(253, 224, 71, 0.8);
}

.banner-progress {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 120px;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgb(245, 158, 11), rgb(234, 88, 12));
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.banner-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
  white-space: nowrap;
  border: none;
  cursor: pointer;
}

.banner-button-warning {
  background: rgb(245, 158, 11);
  color: rgb(0, 0, 0);
}

.banner-button-warning:hover:not(:disabled) {
  background: rgb(234, 88, 12);
  transform: translateY(-1px);
}

.banner-button-warning:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
