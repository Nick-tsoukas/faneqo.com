<template>
  <div class="stream-not-fan-visual">
    <!-- Big stream number -->
    <div class="stream-stat">
      <div class="number">1,247</div>
      <div class="label">streams today</div>
    </div>

    <!-- Arrow down -->
    <div class="arrow-down">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>

    <!-- What you get -->
    <div class="what-you-get">
      <div class="zero-stat">0</div>
      <div class="zero-list">
        <div class="zero-item">fan contacts</div>
        <div class="zero-item">emails</div>
        <div class="zero-item">check-ins</div>
        <div class="zero-item">owned audience</div>
      </div>
    </div>

    <!-- Fading listeners -->
    <div class="listeners">
      <div v-for="n in 5" :key="n" class="listener-dot" :style="{ animationDelay: `${n * 0.2}s` }" />
    </div>
  </div>
</template>

<style scoped>
.stream-not-fan-visual {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
}

.stream-stat {
  text-align: center;
  margin-bottom: 1rem;
}

.number {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #1DB954, #1ed760);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
}

.arrow-down {
  color: rgba(255, 255, 255, 0.2);
  margin: 0.5rem 0;
}

.what-you-get {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.zero-stat {
  font-size: 5rem;
  font-weight: 900;
  color: #ef4444;
  line-height: 1;
}

.zero-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.zero-item {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  padding-left: 1rem;
  position: relative;
}

.zero-item::before {
  content: '✕';
  position: absolute;
  left: 0;
  color: #ef4444;
  font-size: 0.75rem;
}

.listeners {
  position: absolute;
  top: 2rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.listener-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: fade-out 2s ease-in-out infinite;
}

@keyframes fade-out {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0; transform: scale(0.5); }
}
</style>
