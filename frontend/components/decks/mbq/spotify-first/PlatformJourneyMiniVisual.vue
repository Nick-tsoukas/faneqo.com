<template>
  <div class="platform-journey-mini">
    <!-- Hub in center -->
    <div class="hub-center">
      <div class="hub-card">
        <div class="hub-icon">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <span class="hub-label">Your Hub</span>
        <div class="hub-glow" />
      </div>
    </div>

    <!-- Platform destinations -->
    <div class="platforms">
      <div class="platform spotify">
        <div class="platform-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 12.75c-.23.61-.73 1.12-1.34 1.35-.61.23-1.28.16-1.84-.19-.28-.19-.54-.42-.77-.67-.23.25-.49.48-.77.67-.56.35-1.23.42-1.84.19-.61-.23-1.11-.74-1.34-1.35-.23-.61-.16-1.28.19-1.84.35-.56.97-.91 1.66-.91.35 0 .68.09.98.26.3.17.55.41.74.69.19-.28.44-.52.74-.69.3-.17.63-.26.98-.26.69 0 1.31.35 1.66.91.35.56.42 1.23.19 1.84z"/>
          </svg>
        </div>
        <span>Spotify</span>
      </div>

      <div class="platform youtube">
        <div class="platform-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <span>YouTube</span>
      </div>

      <div class="platform tickets">
        <div class="platform-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <span>Tickets</span>
      </div>

      <div class="platform merch">
        <div class="platform-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <span>Merch</span>
      </div>

      <div class="platform social">
        <div class="platform-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span>Social</span>
      </div>
    </div>

    <!-- Connection arrows -->
    <div class="arrows">
      <div class="arrow arrow-1">→</div>
      <div class="arrow arrow-2">→</div>
      <div class="arrow arrow-3">→</div>
      <div class="arrow arrow-4">→</div>
      <div class="arrow arrow-5">→</div>
    </div>
  </div>
</template>

<style scoped>
.platform-journey-mini {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
}

.hub-center {
  margin-bottom: 2rem;
}

.hub-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.hub-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 0 40px rgba(168, 85, 247, 0.4);
  animation: hub-pulse 3s ease-in-out infinite;
}

@keyframes hub-pulse {
  0%, 100% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.4); }
  50% { box-shadow: 0 0 60px rgba(168, 85, 247, 0.6); }
}

.hub-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: #a855f7;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.platforms {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 280px;
}

.platform {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
}

.platform-icon {
  width: 48px;
  height: 48px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.platform-icon svg {
  width: 24px;
  height: 24px;
}

.platform.spotify .platform-icon {
  background: #1DB954;
}

.platform.youtube .platform-icon {
  background: #FF0000;
}

.platform.tickets .platform-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.platform.merch .platform-icon {
  background: linear-gradient(135deg, #ec4899, #db2777);
}

.platform.social .platform-icon {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.platform span {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.arrows {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.arrow {
  position: absolute;
  font-size: 1.5rem;
  color: rgba(168, 85, 247, 0.4);
  animation: arrow-pulse 2s ease-in-out infinite;
}

.arrow-1 { top: -60px; left: -80px; transform: rotate(-30deg); }
.arrow-2 { top: -60px; left: 60px; transform: rotate(30deg); }
.arrow-3 { top: 20px; left: -100px; transform: rotate(-10deg); }
.arrow-4 { top: 20px; left: 80px; transform: rotate(10deg); }
.arrow-5 { top: 80px; left: -10px; transform: rotate(90deg); }

@keyframes arrow-pulse {
  0%, 100% { opacity: 0.4; transform: translateX(0) rotate(var(--rotation, 0deg)); }
  50% { opacity: 0.8; transform: translateX(5px) rotate(var(--rotation, 0deg)); }
}
</style>
