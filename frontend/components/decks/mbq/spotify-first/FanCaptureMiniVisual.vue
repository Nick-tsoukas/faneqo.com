<template>
  <div class="fan-capture-mini">
    <!-- Step 1: Fan capture form -->
    <div class="capture-step" :class="{ 'step-hidden': showSuccess }">
      <div class="capture-card">
        <div class="artist-avatar">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div class="capture-text">
          <div class="capture-title">Follow The Midnight Static</div>
          <div class="capture-sub">Get show updates + music drops</div>
        </div>
      </div>

      <div class="email-field">
        <div class="email-input">maya@email.com</div>
      </div>

      <button class="join-btn" @click="showSuccess = true">Join Fan List</button>
    </div>

    <!-- Step 2: Success -->
    <Transition name="fade">
      <div v-if="showSuccess" class="success-card">
        <div class="success-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="success-title">New fan captured</div>

        <div class="fan-details">
          <div class="fan-avatar-mini">MR</div>
          <div class="fan-info">
            <div class="fan-name">Maya R.</div>
            <div class="fan-location">Nashville, TN</div>
          </div>
        </div>

        <div class="source-chip">
          <span class="dot" />
          Source: Artist Hub
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showSuccess = ref(false)

// Auto-trigger after 2 seconds
setTimeout(() => {
  showSuccess.value = true
}, 2000)
</script>

<style scoped>
.fan-capture-mini {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
}

.capture-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 280px;
  transition: all 0.5s ease;
}

.capture-step.step-hidden {
  opacity: 0;
  transform: scale(0.9);
}

.capture-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1));
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 1rem;
  width: 100%;
}

.artist-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.capture-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.capture-sub {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

.email-field {
  width: 100%;
}

.email-input {
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.join-btn {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.join-btn:hover {
  transform: translateY(-2px);
}

.success-card {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(34, 211, 238, 0.1));
  border: 2px solid rgba(16, 185, 129, 0.4);
  border-radius: 1.5rem;
  width: 100%;
  max-width: 280px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.success-icon {
  width: 56px;
  height: 56px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.success-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: #10b981;
}

.fan-details {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  width: 100%;
}

.fan-avatar-mini {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.fan-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.fan-location {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
}

.source-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 2rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: #10b981;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
}
</style>
