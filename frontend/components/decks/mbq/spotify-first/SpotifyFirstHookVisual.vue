<template>
  <div class="hook-visual">
    <!-- Side by side comparison -->
    <div class="comparison">
      <!-- Spotify Stream (drifts away) -->
      <div class="stream-side">
        <div class="stream-card">
          <div class="stream-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 12.75c-.23.61-.73 1.12-1.34 1.35-.61.23-1.28.16-1.84-.19-.28-.19-.54-.42-.77-.67-.23.25-.49.48-.77.67-.56.35-1.23.42-1.84.19-.61-.23-1.11-.74-1.34-1.35-.23-.61-.16-1.28.19-1.84.35-.56.97-.91 1.66-.91.35 0 .68.09.98.26.3.17.55.41.74.69.19-.28.44-.52.74-.69.3-.17.63-.26.98-.26.69 0 1.31.35 1.66.91.35.56.42 1.23.19 1.84z"/>
            </svg>
          </div>
          <span class="stream-label">Stream</span>
          <div class="drift-arrow">→</div>
        </div>
      </div>

      <!-- VS -->
      <div class="vs">VS</div>

      <!-- MBQ Fan (stays) -->
      <div class="fan-side">
        <div class="fan-card">
          <div class="fan-avatar">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="fan-info">
            <div class="fan-name">Maya R.</div>
            <div class="fan-badge">Fan Captured</div>
          </div>
        </div>
        <div class="stay-check">✓</div>
      </div>
    </div>

    <!-- Punchline -->
    <div class="punchline">
      <div class="line1">Spotify gets the stream.</div>
      <div class="line2">The artist should get the fan.</div>
    </div>
  </div>
</template>

<style scoped>
.hook-visual {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  gap: 2rem;
}

.comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  width: 100%;
}

.stream-side,
.fan-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.stream-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  animation: drift-away 3s ease-in-out infinite;
}

@keyframes drift-away {
  0%, 100% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(-15px); opacity: 0.6; }
}

.stream-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #1DB954, #1ed760);
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 15px 30px rgba(29, 185, 84, 0.3);
}

.stream-icon svg {
  width: 48px;
  height: 48px;
}

.stream-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
}

.drift-arrow {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.3);
  animation: fade-arrow 3s ease-in-out infinite;
}

@keyframes fade-arrow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.1; }
}

.vs {
  font-size: 0.875rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.2);
  letter-spacing: 0.2em;
}

.fan-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.1));
  border: 2px solid rgba(168, 85, 247, 0.4);
  border-radius: 1.25rem;
  animation: fan-glow 3s ease-in-out infinite;
}

@keyframes fan-glow {
  0%, 100% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.3); }
  50% { box-shadow: 0 0 50px rgba(168, 85, 247, 0.5); }
}

.fan-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.fan-name {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.fan-badge {
  font-size: 0.625rem;
  font-weight: 700;
  color: #a855f7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stay-check {
  width: 32px;
  height: 32px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  animation: check-pulse 2s ease-in-out infinite;
}

@keyframes check-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.punchline {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.line1 {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

.line2 {
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
