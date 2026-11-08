<template>
  <div class="final-spotify-first-cta">
    <!-- Logo mark -->
    <div class="logo-mark">
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    </div>
    
    <!-- Main CTA content -->
    <div class="cta-content">
      <h2 class="cta-headline">Build Your Artist Page Free</h2>
      <p class="cta-subtitle">Pro included for 30 days</p>
    </div>
    
    <!-- Punchline -->
    <div class="punchline-box">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>Stop losing fans after the click</span>
    </div>
    
    <!-- URL -->
    <div class="url-display">
      <span class="url-text">musicbizqr.com</span>
    </div>
    
    <!-- CTA Button -->
    <button class="cta-button">
      <span>Start Free</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
      </svg>
    </button>
    
    <!-- Trust note -->
    <p class="trust-note">Free account. Pro for 30 days. Keep your page either way.</p>
  </div>
</template>

<style scoped>
.final-spotify-first-cta {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  gap: 1.25rem;
  text-align: center;
}

.logo-mark {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 20px 40px rgba(168, 85, 247, 0.3);
  animation: logo-float 3s ease-in-out infinite;
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.cta-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cta-headline {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  line-height: 1.2;
  margin: 0;
}

.cta-subtitle {
  font-size: 1rem;
  color: #a855f7;
  font-weight: 600;
  margin: 0;
}

.punchline-box {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 1rem;
  margin: 0.5rem 0;
}

.punchline-box svg {
  color: #ef4444;
  flex-shrink: 0;
}

.punchline-box span {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.url-display {
  padding: 0.5rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}

.url-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.05em;
}

.cta-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border: none;
  border-radius: 1rem;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
  margin-top: 0.5rem;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(168, 85, 247, 0.5);
}

.cta-button:active {
  transform: translateY(0);
}

.trust-note {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  max-width: 200px;
  line-height: 1.5;
  margin: 0;
}
</style>
