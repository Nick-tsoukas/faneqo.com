<template>
  <div class="artist-carousel-bg pointer-events-none select-none" aria-hidden="true">
    <!-- Row 1 — moves left -->
    <div class="marquee-row mb-5">
      <div class="marquee-track marquee-left">
        <div v-for="(artist, i) in [...demoArtists, ...demoArtists]" :key="'r1-' + i" class="artist-tile">
          <div class="tile-inner">
            <img :src="artist.image" :alt="artist.name" class="tile-img" loading="lazy" />
            <div class="tile-overlay"></div>
            <div class="tile-content">
              <p class="tile-name">{{ artist.name }}</p>
              <p class="tile-genre">{{ artist.genre }}</p>
              <span class="tile-badge">
                <span class="tile-badge-dot" :class="`dot-${artist.color}`"></span>
                {{ artist.badge }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 2 — moves right -->
    <div class="marquee-row">
      <div class="marquee-track marquee-right">
        <div v-for="(artist, i) in [...demoArtistsAlt, ...demoArtistsAlt]" :key="'r2-' + i" class="artist-tile">
          <div class="tile-inner">
            <img :src="artist.image" :alt="artist.name" class="tile-img" loading="lazy" />
            <div class="tile-overlay"></div>
            <div class="tile-content">
              <p class="tile-name">{{ artist.name }}</p>
              <p class="tile-genre">{{ artist.genre }}</p>
              <span class="tile-badge">
                <span class="tile-badge-dot" :class="`dot-${artist.color}`"></span>
                {{ artist.badge }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import shannonImg from '~/assets/newbandhome.jpg'
import neonImg from '~/assets/neonposter.png'
import eventImg from '~/assets/eventposter1.png'
import albumImg from '~/assets/albumcover3.png'
import posterImg from '~/assets/eventposter2.png'
import eventImg5 from '~/assets/eventposter5.png'
import aisixImg from '~/assets/aisix.png'
import eventImg7 from '~/assets/eventposter7.png'

const demoArtists = [
  { name: 'Shannon Tehya', genre: 'Indie Pop', image: shannonImg, badge: 'Fan list active', color: 'emerald' },
  { name: 'Neon Avenue', genre: 'Alt Pop', image: neonImg, badge: 'Support enabled', color: 'pink' },
  { name: 'Clockwork Brass', genre: 'Steampunk Jazz', image: posterImg, badge: 'Show QR ready', color: 'cyan' },
  { name: 'Prism Effect', genre: 'Electronic', image: albumImg, badge: 'Analytics live', color: 'purple' },
  { name: 'Burning Thunder', genre: 'Rock', image: eventImg5, badge: 'QR ready', color: 'pink' },
  { name: 'High Tide', genre: 'Indie Rock', image: eventImg, badge: 'Show Mode', color: 'cyan' },
]

const demoArtistsAlt = [
  { name: 'Midnight Radio', genre: 'Indie Rock', image: eventImg, badge: 'Analytics live', color: 'purple' },
  { name: 'Violet Signal', genre: 'Dream Pop', image: aisixImg, badge: 'Fan list active', color: 'emerald' },
  { name: 'Rust & Wire', genre: 'Americana', image: eventImg7, badge: 'Support enabled', color: 'pink' },
  { name: 'Clockwork Brass', genre: 'Steampunk Jazz', image: posterImg, badge: 'QR ready', color: 'cyan' },
  { name: 'Prism Effect', genre: 'Electronic', image: albumImg, badge: 'Show QR ready', color: 'pink' },
  { name: 'Neon Avenue', genre: 'Alt Pop', image: neonImg, badge: 'Show Mode', color: 'purple' },
]
</script>

<style scoped>
.artist-carousel-bg {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.marquee-row {
  overflow: hidden;
  width: 100%;
}

.marquee-track {
  display: flex;
  gap: 1.25rem;
  width: max-content;
}

.marquee-left {
  animation: marquee-scroll-left 60s linear infinite;
}

.marquee-right {
  animation: marquee-scroll-right 65s linear infinite;
}

@keyframes marquee-scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes marquee-scroll-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}

.artist-tile {
  flex-shrink: 0;
  width: 220px;
  height: 155px;
}

@media (min-width: 768px) {
  .artist-tile {
    width: 280px;
    height: 185px;
  }
}

.tile-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.tile-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.85) brightness(0.9);
}

.tile-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.7) 75%);
}

.tile-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.75rem;
}

.tile-name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.2;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.tile-genre {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 0.125rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.tile-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.375rem;
  padding: 0.175rem 0.5rem;
  font-size: 0.5625rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(236, 72, 153, 0.2);
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 9999px;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}

.tile-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.dot-emerald { background: #34d399; box-shadow: 0 0 6px #34d399; }
.dot-pink { background: #ec4899; box-shadow: 0 0 6px #ec4899; }
.dot-cyan { background: #22d3ee; box-shadow: 0 0 6px #22d3ee; }
.dot-purple { background: #a855f7; box-shadow: 0 0 6px #a855f7; }

@media (prefers-reduced-motion: reduce) {
  .marquee-left,
  .marquee-right {
    animation: none;
  }
}
</style>
