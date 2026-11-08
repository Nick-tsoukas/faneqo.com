<template>
  <div class="feature-chips-slide">
    <!-- Key phrase -->
    <div class="key-phrase">
      <div class="phrase-line phrase-spotify">Spotify gets the stream.</div>
      <div class="phrase-divider" />
      <div class="phrase-line phrase-artist">The artist should get the fan.</div>
    </div>
    
    <!-- Feature chips -->
    <div class="features-grid">
      <div class="feature-chip">
        <div class="chip-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <span>Smart Links</span>
      </div>
      
      <div class="feature-chip">
        <div class="chip-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <span>QR Codes</span>
      </div>
      
      <div class="feature-chip">
        <div class="chip-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <span>Fan Capture</span>
      </div>
      
      <div class="feature-chip">
        <div class="chip-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span>Analytics</span>
      </div>
    </div>
    
    <!-- Free badge -->
    <div class="free-badge">
      <span class="badge-text">Start Free</span>
      <span class="badge-sub">Pro included 30 days</span>
    </div>
  </div>
</template>

<style scoped>
.feature-chips-slide {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  gap: 1.75rem;
}

.key-phrase {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.phrase-line {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
}

.phrase-spotify {
  color: rgba(255, 255, 255, 0.5);
}

.phrase-artist {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.phrase-divider {
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(168, 85, 247, 0.5), transparent);
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 280px;
}

.feature-chip {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  transition: all 0.2s ease;
}

.feature-chip:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(168, 85, 247, 0.2);
  transform: translateY(-2px);
}

.chip-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.1));
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a855f7;
  flex-shrink: 0;
}

.feature-chip span {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.free-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(34, 211, 238, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 2rem;
}

.badge-text {
  font-size: 0.875rem;
  font-weight: 700;
  color: #10b981;
}

.badge-sub {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
