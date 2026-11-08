<template>
  <div class="mbq-deck-background" aria-hidden="true">
    <!-- Base dark gradient -->
    <div class="bg-base" />
    
    <!-- Subtle grid pattern -->
    <div class="bg-grid" />
    
    <!-- Glow orbs (simplified, no blur filter) -->
    <div class="glow-orb glow-purple" />
    <div class="glow-orb glow-cyan" />
    <div class="glow-orb glow-pink" />
    
    <!-- Floating particles (CSS-based, no heavy animations) -->
    <div class="particles">
      <div v-for="n in 12" :key="n" class="particle" :style="particleStyle(n)" />
    </div>
    
    <!-- QR code pattern overlay (subtle) -->
    <div class="qr-pattern" />
    
    <!-- Vignette -->
    <div class="vignette" />
  </div>
</template>

<script setup>
// Generate deterministic particle positions
function particleStyle(n) {
  const positions = [
    { left: '10%', top: '20%', delay: '0s', size: '3px' },
    { left: '85%', top: '15%', delay: '2s', size: '4px' },
    { left: '70%', top: '60%', delay: '4s', size: '2px' },
    { left: '20%', top: '75%', delay: '1s', size: '3px' },
    { left: '90%', top: '80%', delay: '3s', size: '2px' },
    { left: '40%', top: '30%', delay: '5s', size: '4px' },
    { left: '60%', top: '45%', delay: '2.5s', size: '3px' },
    { left: '15%', top: '55%', delay: '1.5s', size: '2px' },
    { left: '75%', top: '25%', delay: '4.5s', size: '3px' },
    { left: '30%', top: '85%', delay: '3.5s', size: '4px' },
    { left: '55%', top: '70%', delay: '0.5s', size: '2px' },
    { left: '45%', top: '10%', delay: '6s', size: '3px' }
  ]
  
  const pos = positions[(n - 1) % positions.length]
  return {
    left: pos.left,
    top: pos.top,
    animationDelay: pos.delay,
    width: pos.size,
    height: pos.size
  }
}
</script>

<style scoped>
.mbq-deck-background {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* Base dark gradient - no blur */
.bg-base {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, #0f0f1e 0%, #050508 100%);
  background-color: #000;
}

/* Subtle grid pattern - CSS only */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.5;
}

/* Glow orbs - using opacity/transform instead of blur filter */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
  animation: orb-float 20s ease-in-out infinite;
}

.glow-purple {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
  top: -10%;
  right: -10%;
  animation-delay: 0s;
}

.glow-cyan {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.25) 0%, transparent 70%);
  bottom: 10%;
  left: -15%;
  animation-delay: -7s;
}

.glow-pink {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%);
  top: 40%;
  right: 20%;
  animation-delay: -14s;
}

@keyframes orb-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.4;
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
    opacity: 0.5;
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
    opacity: 0.35;
  }
}

/* Particles - lightweight CSS animations */
.particles {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: float-up 15s ease-in-out infinite;
  opacity: 0;
}

@keyframes float-up {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-40px);
    opacity: 0;
  }
}

/* QR Pattern overlay - subtle, CSS-based */
.qr-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 8px,
      rgba(168, 85, 247, 0.02) 8px,
      rgba(168, 85, 247, 0.02) 10px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 8px,
      rgba(34, 211, 238, 0.02) 8px,
      rgba(34, 211, 238, 0.02) 10px
    );
  background-size: 40px 40px;
  opacity: 0.3;
  animation: pattern-shift 60s linear infinite;
}

@keyframes pattern-shift {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 40px;
  }
}

/* Vignette - edges darker */
.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}
</style>
