<template>
  <div class="v2-pt-music" aria-hidden="true">
    <div class="v2-pt-music__photo">
      <img
        v-if="artist.heroImage"
        :src="artist.heroImage"
        :alt="`${artist.name} photography`"
        width="800"
        height="1000"
        decoding="async"
        loading="eager"
      >
    </div>
    <div class="v2-pt-music__copy">
      <p class="v2-pt-kicker">Artist page</p>
      <p class="v2-pt-name">{{ artist.name }}</p>
      <p v-if="song" class="v2-pt-kicker v2-pt-kicker--late">Featured song</p>
      <div v-if="song" class="v2-pt-track">
        <div class="v2-pt-track__art">
          <img
            v-if="song.thumbnailUrl"
            :src="song.thumbnailUrl"
            :alt="song.title"
            loading="lazy"
          >
        </div>
        <div class="v2-pt-track__meta">
          <p class="v2-pt-track__title">{{ song.title }}</p>
          <p class="v2-pt-track__artist">{{ song.artistName || artist.name }}</p>
        </div>
        <div class="v2-pt-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  artist: { type: Object, required: true },
})

const song = computed(() => props.artist.featuredSong)
</script>

<style scoped>
.v2-pt-music {
  display: grid;
  gap: 1.1rem;
  height: 100%;
  min-height: 0;
  align-content: start;
}

.v2-pt-music__photo {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  aspect-ratio: 4 / 5;
  max-height: 14.5rem;
  background: #0b0c10;
}

.v2-pt-music__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 18%;
}

.v2-pt-kicker {
  margin: 0 0 0.35rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}

.v2-pt-kicker--late {
  margin-top: 1rem;
}

.v2-pt-name {
  margin: 0;
  font-size: clamp(1.7rem, 6vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.95;
}

.v2-pt-track {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0c0c10;
}

.v2-pt-track__art {
  width: 3.35rem;
  height: 3.35rem;
  overflow: hidden;
  border-radius: 0.5rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);
}

.v2-pt-track__art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v2-pt-track__meta {
  min-width: 0;
  flex: 1;
}

.v2-pt-track__title {
  margin: 0;
  font-weight: 650;
  color: #fff;
}

.v2-pt-track__artist {
  margin: 0.12rem 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.48);
}

.v2-pt-play {
  width: 2.65rem;
  height: 2.65rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgba(69, 214, 167, 0.45);
  background: rgba(69, 214, 167, 0.12);
  color: #45d6a7;
  flex-shrink: 0;
}

.v2-pt-play svg {
  width: 1.05rem;
  height: 1.05rem;
  margin-left: 0.08rem;
}

@media (min-width: 1024px) {
  .v2-pt-music {
    grid-template-columns: minmax(0, 0.42fr) minmax(0, 1fr);
    gap: 1.5rem;
    align-items: center;
  }

  .v2-pt-music__photo {
    aspect-ratio: auto;
    height: 100%;
    max-height: none;
    min-height: 18rem;
  }

  .v2-pt-kicker--late {
    margin-top: 1.35rem;
  }

  .v2-pt-track {
    padding: 0.85rem 0.9rem;
  }

  .v2-pt-play {
    width: 2.9rem;
    height: 2.9rem;
  }
}
</style>
