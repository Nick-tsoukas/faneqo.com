<template>
  <div class="stream-is-not-relationship">
    <!-- Anonymous listener cards fading out -->
    <div class="listeners-visual">
      <div 
        v-for="n in 5" 
        :key="n"
        class="listener-card"
        :class="`listener-${n}`"
        :style="{ animationDelay: `${(n - 1) * 0.3}s` }"
      >
        <div class="listener-avatar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div class="listener-bar" />
      </div>
      
      <!-- Ghost/fading effect overlay -->
      <div class="fade-overlay" />
    </div>
    
    <!-- Stats showing the problem -->
    <div class="problem-stats">
      <div class="stat-item">
        <div class="stat-value">1,247</div>
        <div class="stat-label">Streams today</div>
      </div>
      <div class="stat-arrow">→</div>
      <div class="stat-item weak">
        <div class="stat-value">0</div>
        <div class="stat-label">Fan relationships</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stream-is-not-relationship {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  gap: 2.5rem;
}

.listeners-visual {
  position: relative;
  width: 200px;
  height: 160px;
}

.listener-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2rem;
  animation: fade-away 3s ease-in-out infinite;
}

.listener-avatar {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
}

.listener-bar {
  width: 60px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

/* Position the cards in a grid */
.listener-1 { top: 0; left: 0; }
.listener-2 { top: 0; right: 0; }
.listener-3 { top: 50%; left: 50%; transform: translate(-50%, -50%); }
.listener-4 { bottom: 0; left: 0; }
.listener-5 { bottom: 0; right: 0; }

@keyframes fade-away {
  0%, 100% { 
    opacity: 0.6; 
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
  50% { 
    opacity: 0.1; 
    transform: translateY(-10px) scale(0.95);
    filter: blur(2px);
  }
}

.fade-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, transparent 30%, rgba(10, 10, 15, 0.8) 70%);
  pointer-events: none;
}

.problem-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
}

.stat-item.weak {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.05);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: white;
  line-height: 1;
}

.stat-item.weak .stat-value {
  color: #ef4444;
}

.stat-label {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
}

.stat-arrow {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.2);
}
</style>
