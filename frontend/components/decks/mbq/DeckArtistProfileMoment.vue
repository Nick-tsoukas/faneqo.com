<template>
  <div class="deck-artist-profile-moment">
    <!-- Scaled/cropped phone mockup -->
    <div class="phone-container">
      <div class="phone-frame">
        <DemoArtistProfileShowcase 
          :compact="true"
          :animated="false"
          class="scaled-profile"
        />
      </div>
    </div>
    
    <!-- Context label -->
    <div class="moment-label">
      <span class="label-eyebrow">Artist Hub</span>
      <span class="label-text">One page. Every link. Fan-first.</span>
    </div>
  </div>
</template>

<script setup>
import DemoArtistProfileShowcase from '~/components/marketing/DemoArtistProfileShowcase.vue'
</script>

<style>
.deck-artist-profile-moment {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.phone-container {
  position: relative;
  width: 100%;
  max-width: 280px;
  transform: scale(0.85);
  transform-origin: center;
}

.phone-frame {
  position: relative;
  border-radius: 2rem;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.scaled-profile {
  width: 100%;
  max-width: none !important;
}

.scaled-profile .demo-artist-showcase {
  transform: scale(1);
}

/* Hide the outer glow in deck mode */
.scaled-profile .absolute.-inset-4 {
  display: none !important;
}

.moment-label {
  margin-top: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label-eyebrow {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #a855f7;
}

.label-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>
