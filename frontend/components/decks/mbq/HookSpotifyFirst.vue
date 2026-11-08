<template>
  <div class="hook-spotify-first">
    <!-- Visual metaphor: Streaming icon vs Fan card -->
    <div class="visual-metaphor">
      <!-- Streaming platform (fading away) -->
      <div class="platform-side">
        <div class="platform-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 12.75c-.23.61-.73 1.12-1.34 1.35-.61.23-1.28.16-1.84-.19-.28-.19-.54-.42-.77-.67-.23.25-.49.48-.77.67-.56.35-1.23.42-1.84.19-.61-.23-1.11-.74-1.34-1.35-.23-.61-.16-1.28.19-1.84.35-.56.97-.91 1.66-.91.35 0 .68.09.98.26.3.17.55.41.74.69.19-.28.44-.52.74-.69.3-.17.63-.26.98-.26.69 0 1.31.35 1.66.91.35.56.42 1.23.19 1.84z"/>
          </svg>
        </div>
        <span class="platform-label">Stream</span>
        <div class="fading-arrow">→</div>
      </div>
      
      <!-- VS indicator -->
      <div class="vs-indicator">
        <div class="vs-line" />
        <span class="vs-text">VS</span>
        <div class="vs-line" />
      </div>
      
      <!-- Fan relationship (staying) -->
      <div class="fan-side">
        <div class="fan-card">
          <div class="fan-avatar">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="fan-info">
            <div class="fan-name">Maya R.</div>
            <div class="fan-status">Warm Fan</div>
          </div>
        </div>
        <span class="fan-label">Fan Relationship</span>
        <div class="staying-arrow">✓</div>
      </div>
    </div>
    
    <!-- Punchline -->
    <div class="punchline">
      <span class="punchline-highlight">Spotify gets the stream.</span>
      <span class="punchline-text">The artist should get the fan.</span>
    </div>
  </div>
</template>

<style scoped>
.hook-spotify-first {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  gap: 2rem;
}

.visual-metaphor {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 320px;
}

.platform-side,
.fan-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.platform-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0.6;
  animation: fade-out 3s ease-in-out infinite;
}

.platform-icon svg {
  width: 40px;
  height: 40px;
}

@keyframes fade-out {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.95); }
}

.platform-label,
.fan-label {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
}

.fading-arrow {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.3);
  animation: fade-arrow 3s ease-in-out infinite;
}

@keyframes fade-arrow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.1; }
}

.vs-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.vs-line {
  width: 1px;
  height: 24px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent);
}

.vs-text {
  font-size: 0.625rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.2em;
}

.fan-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.1));
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 1rem;
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
    transform: scale(1.02);
  }
}

.fan-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.fan-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.fan-status {
  font-size: 0.625rem;
  color: #a855f7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.staying-arrow {
  width: 28px;
  height: 28px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  animation: check-pulse 2s ease-in-out infinite;
}

@keyframes check-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.punchline {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.punchline-highlight {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
}

.punchline-text {
  font-size: 1.125rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
