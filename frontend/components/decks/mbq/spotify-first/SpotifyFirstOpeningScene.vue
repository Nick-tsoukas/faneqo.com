<template>
  <div class="opening-scene" :class="{ 'phase-phone': phase >= 3 }">
    <!-- Debug - always visible -->
    <div style="position: absolute; top: 10px; left: 10px; color: red; z-index: 9999; font-size: 12px;">
      SLIDE 1 MOUNTED - Phase: {{ phase }}
    </div>
    
    <!-- Cinematic Background -->
    <div class="bg-cinematic">
      <div class="bg-glow top" />
      <div class="bg-glow bottom" />
      <div class="bg-grid" />
    </div>

    <!-- Phase 1: Text Hook (0-5s) -->
    <div class="hook-phase">
      <div class="eyebrow">
        <span class="eyebrow-line" />
        THE PROBLEM
        <span class="eyebrow-line" />
      </div>
      
      <div class="headline">
        <div class="line line-1">MUSICIANS,</div>
        <div class="line line-2">
          STOP SENDING
          <span class="highlight-fans">FANS</span>
        </div>
        <div class="line line-3 accent">
          TO <span class="highlight-spotify">SPOTIFY</span> FIRST.
        </div>
      </div>
      
      <div class="subtitle-wrap">
        <p class="subtitle">
          Capture the relationship before the stream.
        </p>
        <div class="punchline">
          <span class="punch-spotify">Spotify gets the stream.</span>
          <span class="punch-divider"></span>
          <span class="punch-artist">The artist should get the fan.</span>
        </div>
      </div>
    </div>

    <!-- Phase 2: Product Reveal (5s+) -->
    <div class="reveal-phase" :class="{ 'visible': phase >= 3 }">
      <!-- Ambient glow behind phone -->
      <div class="phone-ambient-glow" />
      
      <div class="phone-container" :class="{ 'tilted': phase >= 4 }">
        <div class="phone-frame">
          <!-- Phone notch -->
          <div class="phone-notch" />
          
          <div class="phone-screen" :class="{ 'auto-pan': phase >= 4, 'paused': phase >= 5 }">
            <!-- Shannon Profile Content -->
            <div class="profile-content">
              <!-- Hero Section -->
              <div class="profile-hero">
                <div class="hero-image-wrapper">
                  <div class="hero-image" />
                  <div class="hero-shine" />
                </div>
                <div class="hero-overlay" />
                <div class="hero-content">
                  <div class="genre-chip">Indie Artist</div>
                  <h1 class="profile-name">Shannon Tehya</h1>
                </div>
              </div>

              <!-- Featured Track -->
              <div class="profile-section">
                <div class="section-label">Featured Song</div>
                <div class="track-card">
                  <div class="track-artwork">
                    <div class="artwork-image" />
                    <div class="play-overlay">
                      <svg class="play-icon" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div class="track-meta">
                    <div class="track-name">Change</div>
                    <div class="track-artist">Shannon Tehya</div>
                  </div>
                </div>
              </div>

              <!-- Platform Links -->
              <div class="profile-section compact">
                <div class="platform-links">
                  <div class="platform-btn spotify">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 12.75c-.23.61-.73 1.12-1.34 1.35-.61.23-1.28.16-1.84-.19-.28-.19-.54-.42-.77-.67-.23.25-.49.48-.77.67-.56.35-1.23.42-1.84.19-.61-.23-1.11-.74-1.34-1.35-.23-.61-.16-1.28.19-1.84.35-.56.97-.91 1.66-.91.35 0 .68.09.98.26.3.17.55.41.74.69.19-.28.44-.52.74-.69.3-.17.63-.26.98-.26.69 0 1.31.35 1.66.91.35.56.42 1.23.19 1.84z"/>
                    </svg>
                    <span>Spotify</span>
                  </div>
                  <div class="platform-btn youtube">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>YouTube</span>
                  </div>
                </div>
              </div>

              <!-- Fan Capture Module - THE HERO -->
              <div class="fan-capture-wrap" id="fan-capture">
                <div class="fan-capture-hero">
                  <div class="capture-glow" />
                  <div class="capture-header">
                    <div class="capture-avatar">
                      <span>ST</span>
                    </div>
                    <div class="capture-title-wrap">
                      <div class="capture-title">Follow Shannon Tehya</div>
                      <div class="capture-subtitle">Get updates + exclusive drops</div>
                    </div>
                  </div>
                  <div class="capture-form">
                    <div class="email-field">
                      <span class="email-icon">@</span>
                      <span class="email-text">maya@email.com</span>
                    </div>
                    <button class="capture-btn">
                      <span>Join Fan List</span>
                      <svg class="btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div class="capture-badge">
                    <span class="badge-dot" />
                    New fan captured
                  </div>
                </div>
              </div>

              <!-- Bottom padding for scroll -->
              <div class="profile-footer" />
            </div>
          </div>
        </div>

        <!-- Final Callout -->
        <div class="final-callout" :class="{ 'visible': phase >= 5 }">
          <div class="callout-arrow" />
          <div class="callout-pill">
            <span class="callout-dot" />
            Capture the fan before the platform click.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const phase = ref(0)
let timeouts = []

function clearAllTimeouts() {
  timeouts.forEach(t => clearTimeout(t))
  timeouts = []
}

function startSequence() {
  clearAllTimeouts()
  
  // Animation timeline
  const timeline = [
    { phase: 0, delay: 600 },      // Show eyebrow
    { phase: 1, delay: 1200 },     // Show headline
    { phase: 2, delay: 3200 },     // Show subtitle
    { phase: 3, delay: 4800 },     // Transition to phone
    { phase: 4, delay: 5800 },     // Start auto-pan
    { phase: 5, delay: 10500 },    // Pause on fan capture + show callout
  ]
  
  timeline.forEach(({ phase: p, delay }) => {
    timeouts.push(setTimeout(() => { phase.value = p }, delay))
  })
}

onMounted(() => {
  // Start immediately
  startSequence()
})

watch(() => props.active, (isActive) => {
  if (isActive) {
    startSequence()
  } else {
    clearAllTimeouts()
    phase.value = -1
  }
})

onUnmounted(() => {
  clearAllTimeouts()
})

// Expose restart method for deck controller
defineExpose({
  restart: startSequence
})
</script>

<style scoped>
.opening-scene {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Cinematic Background */
.bg-cinematic {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%);
  z-index: 0;
}

.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.4;
  animation: glow-pulse 8s ease-in-out infinite;
}

.bg-glow.top {
  top: -300px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
}

.bg-glow.bottom {
  bottom: -400px;
  right: -200px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%);
  animation-delay: -4s;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.5;
}

/* Hook Phase */
.hook-phase {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 10;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.hook-phase.fade-out {
  opacity: 0;
  transform: translateY(-40px) scale(0.95);
  pointer-events: none;
}

.hook-phase.compressed {
  transform: translateY(-20vh);
}

/* Eyebrow */
.eyebrow {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.35em;
  color: #a855f7;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  opacity: 1;
  transform: translateY(0);
}

.eyebrow-line {
  width: 30px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #a855f7, transparent);
}

/* Headline */
.headline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
  opacity: 1;
  transform: translateY(0);
}

.line {
  font-size: clamp(2rem, 7vw, 2.75rem);
  font-weight: 900;
  line-height: 1.05;
  color: white;
  letter-spacing: -0.02em;
}

.line-1 {
  animation: none;
}

.highlight-fans {
  background: linear-gradient(90deg, #ff2bd6, #a855f7, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.highlight-fans::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff2bd6, #a855f7, #22d3ee);
  border-radius: 2px;
  opacity: 0.6;
}

.highlight-spotify {
  color: #1ed760;
  text-shadow: 0 0 30px rgba(29, 185, 84, 0.4);
}

.line-3.accent {
  font-size: clamp(2.25rem, 8vw, 3rem);
  margin-top: 0.25rem;
}

/* Subtitle */
.subtitle-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  opacity: 1;
  transform: translateY(0);
}

.subtitle {
  font-size: 1.125rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  max-width: 320px;
  line-height: 1.4;
}

.punchline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.punch-spotify {
  color: rgba(255, 255, 255, 0.4);
}

.punch-divider {
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.punch-artist {
  background: linear-gradient(90deg, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Reveal Phase */
.reveal-phase {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.9) translateY(30px);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 20;
}

.reveal-phase.visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Ambient Glow */
.phone-ambient-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.15) 40%, transparent 70%);
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0;
  transition: opacity 1s ease;
}

.reveal-phase.visible .phone-ambient-glow {
  opacity: 1;
}

/* Phone Container */
.phone-container {
  position: relative;
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.phone-container.tilted {
  transform: perspective(1200px) rotateY(-5deg) rotateX(2deg);
}

/* Phone Frame */
.phone-frame {
  position: relative;
  width: 300px;
  height: 580px;
  background: #000;
  border-radius: 2.75rem;
  padding: 0.625rem;
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow: 
    0 60px 120px -30px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(168, 85, 247, 0.15),
    0 0 80px rgba(168, 85, 247, 0.15),
    inset 0 0 40px rgba(168, 85, 247, 0.05);
}

.phone-notch {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 24px;
  background: #000;
  border-radius: 0 0 1rem 1rem;
  z-index: 10;
}

/* Phone Screen */
.phone-screen {
  width: 100%;
  height: 100%;
  background: #0f0f1e;
  border-radius: 2.25rem;
  overflow: hidden;
  position: relative;
}

.phone-screen.auto-pan .profile-content {
  animation: camera-pan 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.phone-screen.paused .profile-content {
  animation-play-state: paused;
}

@keyframes camera-pan {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-340px);
  }
}

/* Profile Content */
.profile-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  will-change: transform;
}

/* Profile Hero */
.profile-hero {
  position: relative;
  height: 240px;
  flex-shrink: 0;
}

.hero-image-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero-image {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%);
}

.hero-image::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/images/shannonImage.jpg') center 30% / cover;
  opacity: 0.7;
  mix-blend-mode: overlay;
}

.hero-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #0f0f1e 0%, transparent 50%, rgba(0,0,0,0.3) 100%);
}

.hero-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.25rem;
}

.genre-chip {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 2rem;
  font-size: 0.625rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.625rem;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
}

/* Profile Sections */
.profile-section {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.profile-section.compact {
  padding: 0.75rem 1.25rem;
}

.section-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 0.75rem;
}

/* Track Card */
.track-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
}

.track-artwork {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 0.625rem;
  overflow: hidden;
  flex-shrink: 0;
}

.artwork-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #a855f7, #ec4899);
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.track-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.track-meta {
  flex: 1;
  min-width: 0;
}

.track-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.track-artist {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.125rem;
}

/* Platform Links */
.platform-links {
  display: flex;
  gap: 0.625rem;
}

.platform-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  flex: 1;
  justify-content: center;
}

.platform-btn.spotify {
  background: rgba(29, 185, 84, 0.15);
  border: 1px solid rgba(29, 185, 84, 0.25);
  color: #1ed760;
}

.platform-btn.youtube {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
}

.platform-btn svg {
  width: 16px;
  height: 16px;
}

/* Fan Capture - THE HERO */
.fan-capture-wrap {
  padding: 1rem 1.25rem 1.5rem;
}

.fan-capture-hero {
  position: relative;
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%);
  border: 2px solid rgba(168, 85, 247, 0.3);
  border-radius: 1.25rem;
  overflow: hidden;
}

.capture-glow {
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 60%);
  animation: capture-pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes capture-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.capture-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.capture-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 0.875rem;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
}

.capture-title-wrap {
  flex: 1;
}

.capture-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.capture-subtitle {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.125rem;
}

.capture-form {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  position: relative;
  z-index: 1;
}

.email-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.625rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.email-icon {
  color: rgba(255, 255, 255, 0.4);
}

.capture-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(90deg, #a855f7, #ec4899);
  border: none;
  border-radius: 0.625rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.capture-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: translateX(-100%);
  animation: btn-shine 2s ease-in-out infinite;
}

@keyframes btn-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.btn-arrow {
  width: 16px;
  height: 16px;
}

.capture-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 2rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: #10b981;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 1;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  animation: badge-pulse 1.5s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

/* Footer spacer */
.profile-footer {
  height: 100px;
  flex-shrink: 0;
}

/* Final Callout */
.final-callout {
  position: absolute;
  bottom: -3.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.final-callout.visible {
  opacity: 1;
  bottom: -4rem;
}

.callout-arrow {
  width: 2px;
  height: 1.5rem;
  background: linear-gradient(to bottom, #10b981, transparent);
}

.callout-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
  white-space: nowrap;
}

.callout-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: callout-pulse 1.5s ease-in-out infinite;
}

@keyframes callout-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { opacity: 0.8; transform: scale(1.2); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}

/* Responsive adjustments */
@media (max-height: 800px) {
  .phone-frame {
    width: 280px;
    height: 540px;
  }
  
  .line {
    font-size: clamp(1.75rem, 6vw, 2.25rem);
  }
  
  .line-3.accent {
    font-size: clamp(2rem, 7vw, 2.5rem);
  }
}
</style>
