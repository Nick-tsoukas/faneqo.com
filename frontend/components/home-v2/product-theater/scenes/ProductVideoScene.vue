<template>
  <div class="v2-pt-video" aria-hidden="true">
    <p class="v2-pt-kicker">Featured video</p>
    <div v-if="video" class="v2-pt-video__frame">
      <img
        :src="video.thumbnailUrl"
        :alt="video.title"
        loading="lazy"
      >
      <div class="v2-pt-video__play">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </div>
      <div class="v2-pt-video__meta">
        <p>{{ video.title }}</p>
        <span>{{ artist.name }}</span>
      </div>
    </div>
    <div v-if="song" class="v2-pt-chip">
      <span class="v2-pt-chip__label">Also on the page</span>
      <span class="v2-pt-chip__title">{{ song.title }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  artist: { type: Object, required: true },
})

const video = computed(() => props.artist.featuredVideo)
const song = computed(() => props.artist.featuredSong)
</script>

<style scoped>
.v2-pt-video {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-height: 0;
}

.v2-pt-kicker {
  margin: 0 0 0.7rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}

.v2-pt-video__frame {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: 1rem;
  border: 1px solid rgba(35, 199, 195, 0.28);
  background: #0c0c10;
}

.v2-pt-video__frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.78;
}

.v2-pt-video__play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.v2-pt-video__play svg {
  width: 3.2rem;
  height: 3.2rem;
  padding: 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(69, 214, 167, 0.5);
  background: rgba(0, 0, 0, 0.38);
  color: #fff;
}

.v2-pt-video__meta {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 0.8rem 0.9rem 0.75rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.82), transparent);
}

.v2-pt-video__meta p {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 650;
}

.v2-pt-video__meta span {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
}

.v2-pt-chip {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin-top: 0.85rem;
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.78rem;
}

.v2-pt-chip__title {
  color: rgba(255, 255, 255, 0.72);
  font-weight: 600;
}
</style>
